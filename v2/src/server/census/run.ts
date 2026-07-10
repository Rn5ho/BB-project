import { db, players, snapshots, censusRuns, censusItems } from '@/db';
import { NtBrowser } from '@/server/bb/nt-browser';
import type { ParsedCard } from '@/server/bb/card-parser';
import { getCurrentSeasonId } from '@/queries/players';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';
import { utcDayKey } from '@/server/sync/players';
import { sql, and, eq, gte, inArray } from 'drizzle-orm';

export interface CensusOpts {
  all?: boolean;
  max?: number;
  dryRun?: boolean;
  /** Required for any real (non-dry-run) run. A missing value hard-refuses the run. */
  confirmed?: boolean;
  /** Count matching candidates and exit immediately — no browser, no roster actions. */
  countOnly?: boolean;
  /** Dismiss the user's own roster first (18 free slots), then re-recruit them at the end. */
  clearRoster?: boolean;
  resumeRunId?: number;
  pauseMs?: number;
  minAge?: number;
  maxAge?: number;
  minPotential?: number;
  maxPotential?: number;
  minSalary?: number;
  maxSalary?: number;
  minHeight?: number;
  maxHeight?: number;
}
const PAUSE = 1500;

type Log = (msg: string) => void;

export async function runCensus(opts: CensusOpts, log: Log = console.log, existingRunId?: number): Promise<{ runId: number; captured: number; failed: number }> {
  // HARD SAFETY GATE. A real census dismisses many players from the NT roster, which drains
  // NT enthusiasm — running it mid-season is destructive. It must NEVER be automated and must
  // NEVER run without a deliberate human confirmation. Anything but a preview requires --confirm.
  if (!opts.dryRun && !opts.countOnly && !opts.confirmed) {
    throw new Error(
      'Refusing to run: a real census requires --confirm. It dismisses many players (drains NT ' +
      'enthusiasm) and must only be run in the OFF-SEASON. Use --dry-run to preview safely.',
    );
  }

  const season = await getCurrentSeasonId();
  const pauseMs = opts.pauseMs ?? PAUSE;
  const sleep = () => new Promise((r) => setTimeout(r, pauseMs));

  // 1. build candidate rows from DB (season-aware age + this-season freshness + stalest date)
  const rows = await loadCandidateRows(season);
  const filters = {
    all: opts.all,
    max: opts.max,
    minAge: opts.minAge,
    maxAge: opts.maxAge,
    minPotential: opts.minPotential,
    maxPotential: opts.maxPotential,
    minSalary: opts.minSalary,
    maxSalary: opts.maxSalary,
    minHeight: opts.minHeight,
    maxHeight: opts.maxHeight,
  };
  const candidates = selectCandidates(rows, filters);
  log(`Season ${season}: ${candidates.length} candidates selected (of ${rows.length} Slovenian 18-21).`);

  if (opts.countOnly) {
    log(`${candidates.length} candidates match these filters.`);
    return { runId: -1, captured: 0, failed: 0 };
  }

  // 2. launch browser, login + protected roster
  const nt = new NtBrowser();
  await nt.launch();
  try {
    await nt.login();
    log('WARNING: do not manually modify the NT roster while the census runs.');
    const rosterAtStart = await nt.fetchRoster();

    if (opts.dryRun) {
      const previewSlots = opts.clearRoster ? 18 : freeSlots(rosterAtStart.length);
      log('DRY RUN — plan only, no roster actions:');
      if (opts.clearRoster) {
        log(`  Would CLEAR your ${rosterAtStart.length} rostered players (dismiss, then restore at end) → ${previewSlots} free slots.`);
      } else {
        log(`  ${rosterAtStart.length} protected players; ${previewSlots} free slots per batch.`);
      }
      candidates.forEach((c, i) => log(`  ${i + 1}. player ${c.bbPlayerId} (age ${c.ageNow}, pot ${c.potential ?? '?'}, salary ${c.salary ?? '?'})`));
      return { runId: -1, captured: 0, failed: 0 };
    }

    // 3. run row (+ resume cleanup). originalRoster = the user's own players to restore
    //    at the end (only populated when --clear-roster is used).
    let runId = opts.resumeRunId ?? 0;
    let originalRoster: number[] = [];
    if (runId) {
      const [row] = await db.select().from(censusRuns).where(eq(censusRuns.id, runId));
      const meta = (row?.totals ?? {}) as { originalRoster?: number[] };
      if (Array.isArray(meta.originalRoster)) originalRoster = meta.originalRoster;
      const lingering = await db.select().from(censusItems).where(and(eq(censusItems.runId, runId), eq(censusItems.status, 'recruited')));
      for (const it of lingering) { await safeDismiss(nt, it.playerId, log); await mark(runId, it.playerId, 'failed', 'crash-recovered: dismissed without capturing skills'); await sleep(); }
    } else {
      if (opts.clearRoster) originalRoster = rosterAtStart.map((c) => c.bbPlayerId);
      const runTotals = { filters, candidateCount: candidates.length, ...(originalRoster.length ? { originalRoster } : {}) };
      if (existingRunId) {
        // Queued mode: the worker already claimed a census_runs row (status flipped to 'running');
        // reuse it and merge our totals into whatever the enqueue stored (e.g. the run opts).
        runId = existingRunId;
        const [row] = await db.select().from(censusRuns).where(eq(censusRuns.id, runId));
        if (!row) throw new Error(`existingRunId ${existingRunId} not found in census_runs`);
        const prevTotals = (row.totals ?? {}) as Record<string, unknown>;
        await db.update(censusRuns).set({ totals: { ...prevTotals, ...runTotals } }).where(eq(censusRuns.id, runId));
      } else {
        const [r] = await db.insert(censusRuns).values({ status: 'running', totals: runTotals }).returning({ id: censusRuns.id });
        runId = r.id;
      }
      await db.insert(censusItems).values(candidates.map((c) => ({ runId, playerId: c.bbPlayerId, status: 'pending' as const })));
    }
    log(`Census run #${runId} — resume with: npm run census -- --resume ${runId} --confirm`);

    // protected = the players we must NOT dismiss and must leave rostered. With --clear-roster
    // (or a resumed clear-run, detected via a stored originalRoster) we instead dismiss the
    // user's roster up front and restore it in the outer finally, so the protected set is empty
    // and all 18 slots are free.
    const isClearRun = opts.clearRoster || originalRoster.length > 0;
    const protectedIds = isClearRun ? new Set<number>() : new Set(rosterAtStart.map((c) => c.bbPlayerId));

    // RESTORE WRAPPER: whatever happens inside (success, abort, crash), the user's own roster
    // is re-recruited before we exit. Re-recruiting costs no enthusiasm; a failed restore is
    // surfaced loudly for a trivial manual fix.
    let captured = 0, failed = 0, consecutiveRecruitFails = 0;
    try {
      if (opts.clearRoster && originalRoster.length > 0 && !opts.resumeRunId) {
        log(`Clearing your ${originalRoster.length} players from the roster (will restore at end): ${originalRoster.join(', ')}`);
        for (const id of originalRoster) { await safeDismiss(nt, id, log); await sleep(); }
      } else if (opts.resumeRunId && originalRoster.length > 0) {
        // Resumed clear-run: the roster was already cleared by the original run; ensure any of
        // the user's players that are somehow still rostered are off before we refill slots.
        for (const id of originalRoster) { await safeDismiss(nt, id, log); await sleep(); }
      }

      const slots = freeSlots(protectedIds.size);
      log(`${protectedIds.size} protected players; ${slots} free slots per batch.`);
      if (slots === 0) throw new Error('No free roster slots (18 already rostered). Aborting — nothing the census can safely do.');

      // 4. batch loop over PENDING items
      try {
        while (true) {
          const pend = await db.select().from(censusItems).where(and(eq(censusItems.runId, runId), eq(censusItems.status, 'pending'))).limit(slots);
          if (pend.length === 0) break;
          const batchIds: number[] = [];

          for (const it of pend) {
            if (protectedIds.has(it.playerId)) { await mark(runId, it.playerId, 'skipped', 'already protected'); continue; }
            try {
              await nt.recruit(it.playerId);
              await mark(runId, it.playerId, 'recruited');
              batchIds.push(it.playerId);
              consecutiveRecruitFails = 0;
            } catch (e) {
              await mark(runId, it.playerId, 'failed', String(e)); failed++;
              if (++consecutiveRecruitFails >= 3) { await abort(nt, runId, batchIds, log); throw new Error('3 consecutive recruit failures — aborted with clean roster'); }
            }
            await sleep();
          }

          if (batchIds.length > 0) {
            const roster = await nt.fetchRoster();
            const capturedSet = new Set(roster.filter((c) => batchIds.includes(c.bbPlayerId)).map((c) => c.bbPlayerId));
            const capthere = await saveCensusSnapshots(roster.filter((c) => capturedSet.has(c.bbPlayerId)), season);
            captured += capthere;
            log(`Batch captured ${capthere}/${batchIds.length} full-skill snapshots.`);
            for (const id of batchIds) {
              await safeDismiss(nt, id, log);
              if (capturedSet.has(id)) {
                await mark(runId, id, 'captured');
              } else {
                await mark(runId, id, 'failed', 'not found on roster after recruit');
              }
              await sleep();
            }
          }
        }
      } finally {
        // 5. dismiss any census-recruited players left on the roster (never the originals — those
        // are already off and will be restored below).
        const rosterEnd = await nt.fetchRoster();
        const extras = rosterEnd.filter((c) => !protectedIds.has(c.bbPlayerId) && !originalRoster.includes(c.bbPlayerId));
        if (extras.length > 0) {
          log(`Cleanup: dismissing ${extras.length} non-protected players left on roster: ${extras.map((e) => e.bbPlayerId).join(', ')}`);
          for (const e of extras) { await safeDismiss(nt, e.bbPlayerId, log); await sleep(); }
        }
      }
    } finally {
      // 6. RESTORE the user's own roster (re-recruit). Runs even on abort/crash.
      if (originalRoster.length > 0) {
        log(`Restoring your ${originalRoster.length} original players...`);
        const failedRestore: number[] = [];
        for (const id of originalRoster) {
          try { await nt.recruit(id); } catch (e) { failedRestore.push(id); log(`RESTORE FAILED for ${id}: ${e}`); }
          await sleep();
        }
        if (failedRestore.length > 0) {
          log(`!!! MANUAL ACTION NEEDED: re-add these players to your NT roster: ${failedRestore.join(', ')}`);
        } else {
          log(`Restored all ${originalRoster.length} original players.`);
        }
      }
    }

    await db.update(censusRuns).set({ status: 'finished', finishedAt: new Date(), totals: { captured, failed, filters, ...(originalRoster.length ? { originalRoster } : {}) } }).where(eq(censusRuns.id, runId));
    log(`Census #${runId} finished: ${captured} captured, ${failed} failed.`);
    return { runId, captured, failed };
  } finally {
    await nt.close();
  }
}

async function safeDismiss(nt: NtBrowser, playerId: number, log: Log) {
  try { await nt.dismiss(playerId); } catch (e) { log(`dismiss ${playerId} failed: ${e}`); }
}
async function abort(nt: NtBrowser, runId: number, batchIds: number[], log: Log) {
  for (const id of batchIds) { await safeDismiss(nt, id, log); await mark(runId, id, 'failed', 'aborted-mid-batch'); }
  await db.update(censusRuns).set({ status: 'aborted', finishedAt: new Date() }).where(eq(censusRuns.id, runId));
}
async function mark(runId: number, playerId: number, status: 'recruited' | 'captured' | 'failed' | 'skipped', error?: string) {
  await db.update(censusItems).set({ status, error: error ?? null }).where(and(eq(censusItems.runId, runId), eq(censusItems.playerId, playerId)));
}

async function saveCensusSnapshots(cards: ParsedCard[], season: number): Promise<number> {
  if (cards.length === 0) return 0;
  const ids = cards.map((c) => c.bbPlayerId);
  const todayStart = new Date(`${utcDayKey(new Date())}T00:00:00Z`);
  const todays = await db.select({ id: snapshots.id }).from(snapshots)
    .where(and(eq(snapshots.source, 'census'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, ids)));
  if (todays.length > 0) await db.delete(snapshots).where(inArray(snapshots.id, todays.map((t) => t.id)));
  await db.insert(snapshots).values(cards.map((c) => ({
    playerId: c.bbPlayerId, source: 'census' as const, season,
    age: c.age, gameShape: c.gameShape, salary: c.salary, potential: c.potential, experience: c.experience,
    jumpShot: c.skills.jump_shot ?? null, jumpRange: c.skills.jump_range ?? null, outsideDef: c.skills.outside_def ?? null,
    handling: c.skills.handling ?? null, driving: c.skills.driving ?? null, passing: c.skills.passing ?? null,
    insideShot: c.skills.inside_shot ?? null, insideDef: c.skills.inside_def ?? null, rebounding: c.skills.rebounding ?? null,
    shotBlocking: c.skills.shot_blocking ?? null, stamina: c.skills.stamina ?? null, freeThrow: c.skills.free_throw ?? null,
    tsp: c.tsp, ownerTeamId: c.ownerTeamId, ownerTeamName: c.ownerTeamName,
  })));
  return cards.length;
}

async function loadCandidateRows(season: number): Promise<CandidateRow[]> {
  // Slovenian players + season-aware age from latest snapshot + fresh-full-this-season flag + oldest capture
  // Also pulls potential, salary from the latest snapshot, and height_cm from the players table.
  const result = await db.execute(sql`
    with latest as (
      select distinct on (player_id) player_id, age, season, potential, salary from snapshots order by player_id, captured_at desc
    ),
    fresh as (
      select distinct player_id from snapshots
      where jump_shot is not null and season = ${season} and source in ('census','market','manual')
    ),
    oldest as (
      select player_id, min(captured_at) as oldest_capture from snapshots where jump_shot is not null group by player_id
    )
    select p.bb_player_id, l.age as snap_age, l.season as snap_season,
           (f.player_id is not null) as fresh_full, o.oldest_capture,
           l.potential, l.salary, p.height_cm
    from players p
    left join latest l on l.player_id = p.bb_player_id
    left join fresh f on f.player_id = p.bb_player_id
    left join oldest o on o.player_id = p.bb_player_id
    where p.country_id = 66 or p.nationality in ('Slovenia', 'Slovenija')
  `);
  return (result.rows as Record<string, unknown>[]).map((r) => {
    const snapAge = r.snap_age as number | null;
    const snapSeason = r.snap_season as number | null;
    const ageNow = snapAge == null || snapSeason == null ? null : snapAge + (season - snapSeason);
    return {
      bbPlayerId: r.bb_player_id as number,
      ageNow,
      hasFreshFullThisSeason: r.fresh_full === true || r.fresh_full === 't' || r.fresh_full === 'true',
      oldestCapture: r.oldest_capture ? new Date(r.oldest_capture as string) : null,
      potential: r.potential != null ? Number(r.potential) : null,
      salary: r.salary != null ? Number(r.salary) : null,
      heightCm: r.height_cm != null ? Number(r.height_cm) : null,
    };
  });
}
