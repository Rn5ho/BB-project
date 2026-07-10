import { db, players, snapshots, censusRuns, censusItems } from '@/db';
import { BbWebSession } from '@/server/bb/web-session';
import { fetchNtRoster, recruitPlayer, dismissPlayer } from '@/server/bb/nt-roster';
import { getCurrentSeasonId } from '@/queries/players';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';
import { utcDayKey } from '@/server/sync/players';
import { sql, and, eq, gte, inArray } from 'drizzle-orm';

export interface CensusOpts { all?: boolean; max?: number; dryRun?: boolean; resumeRunId?: number; pauseMs?: number }
const PAUSE = 1500;

type Log = (msg: string) => void;

export async function runCensus(opts: CensusOpts, log: Log = console.log): Promise<{ runId: number; captured: number; failed: number }> {
  const season = await getCurrentSeasonId();
  const pauseMs = opts.pauseMs ?? PAUSE;
  const sleep = () => new Promise((r) => setTimeout(r, pauseMs));

  // 1. build candidate rows from DB (season-aware age + this-season freshness + stalest date)
  const rows = await loadCandidateRows(season);
  const candidates = selectCandidates(rows, { all: opts.all, max: opts.max });
  log(`Season ${season}: ${candidates.length} candidates selected (of ${rows.length} Slovenian 18-21).`);

  // 2. login + protected roster
  const session = new BbWebSession();
  await session.login();
  log('WARNING: do not manually modify the NT roster while the census runs.');
  const rosterAtStart = await fetchNtRoster(session);
  const protectedIds = new Set(rosterAtStart.map((c) => c.bbPlayerId));
  const slots = freeSlots(protectedIds.size);
  log(`Roster has ${protectedIds.size} protected players; ${slots} free slots per batch.`);
  if (slots === 0) throw new Error('No free roster slots (18 already rostered). Aborting — nothing the census can safely do.');

  if (opts.dryRun) {
    log('DRY RUN — plan only, no roster actions:');
    candidates.forEach((c, i) => log(`  ${i + 1}. player ${c.bbPlayerId} (age ${c.ageNow})`));
    return { runId: -1, captured: 0, failed: 0 };
  }

  // 3. run row (+ resume cleanup)
  let runId = opts.resumeRunId ?? 0;
  if (runId) {
    const lingering = await db.select().from(censusItems).where(and(eq(censusItems.runId, runId), eq(censusItems.status, 'recruited')));
    for (const it of lingering) { await safeDismiss(session, it.playerId, log); await mark(runId, it.playerId, 'failed', 'crash-recovered: dismissed without capturing skills'); await sleep(); }
  } else {
    const [r] = await db.insert(censusRuns).values({ status: 'running' }).returning({ id: censusRuns.id });
    runId = r.id;
    await db.insert(censusItems).values(candidates.map((c) => ({ runId, playerId: c.bbPlayerId, status: 'pending' as const })));
  }
  log(`Census run #${runId} — resume with: npm run census -- --resume ${runId}`);

  // 4. batch loop over PENDING items
  let captured = 0, failed = 0, consecutiveRecruitFails = 0;
  try {
    while (true) {
      const pend = await db.select().from(censusItems).where(and(eq(censusItems.runId, runId), eq(censusItems.status, 'pending'))).limit(slots);
      if (pend.length === 0) break;
      const batchIds: number[] = [];

      for (const it of pend) {
        if (protectedIds.has(it.playerId)) { await mark(runId, it.playerId, 'skipped', 'already protected'); continue; }
        try {
          await recruitPlayer(session, it.playerId);
          await mark(runId, it.playerId, 'recruited');
          batchIds.push(it.playerId);
          consecutiveRecruitFails = 0;
        } catch (e) {
          await mark(runId, it.playerId, 'failed', String(e)); failed++;
          if (++consecutiveRecruitFails >= 3) { await abort(session, runId, batchIds, log); throw new Error('3 consecutive recruit failures — aborted with clean roster'); }
        }
        await sleep();
      }

      if (batchIds.length > 0) {
        const roster = await fetchNtRoster(session);
        const capturedSet = new Set(roster.filter((c) => batchIds.includes(c.bbPlayerId)).map((c) => c.bbPlayerId));
        const capthere = await saveCensusSnapshots(roster.filter((c) => capturedSet.has(c.bbPlayerId)), season);
        captured += capthere;
        log(`Batch captured ${capthere}/${batchIds.length} full-skill snapshots.`);
        for (const id of batchIds) {
          await safeDismiss(session, id, log);
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
    // 5. final safety net: always dismiss any non-protected players left on roster
    const rosterEnd = await fetchNtRoster(session);
    const extras = rosterEnd.filter((c) => !protectedIds.has(c.bbPlayerId));
    if (extras.length > 0) {
      log(`Cleanup: dismissing ${extras.length} non-protected players left on roster: ${extras.map((e) => e.bbPlayerId).join(', ')}`);
      for (const e of extras) { await safeDismiss(session, e.bbPlayerId, log); await sleep(); }
    }
  }
  await db.update(censusRuns).set({ status: 'finished', finishedAt: new Date(), totals: { captured, failed } }).where(eq(censusRuns.id, runId));
  log(`Census #${runId} finished: ${captured} captured, ${failed} failed. Roster restored to ${protectedIds.size} protected players.`);
  return { runId, captured, failed };
}

async function safeDismiss(session: BbWebSession, playerId: number, log: Log) {
  try { await dismissPlayer(session, playerId); } catch (e) { log(`dismiss ${playerId} failed: ${e}`); }
}
async function abort(session: BbWebSession, runId: number, batchIds: number[], log: Log) {
  for (const id of batchIds) { await safeDismiss(session, id, log); await mark(runId, id, 'failed', 'aborted-mid-batch'); }
  await db.update(censusRuns).set({ status: 'aborted', finishedAt: new Date() }).where(eq(censusRuns.id, runId));
}
async function mark(runId: number, playerId: number, status: 'recruited' | 'captured' | 'failed' | 'skipped', error?: string) {
  await db.update(censusItems).set({ status, error: error ?? null }).where(and(eq(censusItems.runId, runId), eq(censusItems.playerId, playerId)));
}

async function saveCensusSnapshots(cards: Awaited<ReturnType<typeof fetchNtRoster>>, season: number): Promise<number> {
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
  const result = await db.execute(sql`
    with latest as (
      select distinct on (player_id) player_id, age, season from snapshots order by player_id, captured_at desc
    ),
    fresh as (
      select distinct player_id from snapshots
      where jump_shot is not null and season = ${season} and source in ('census','market','manual')
    ),
    oldest as (
      select player_id, min(captured_at) as oldest_capture from snapshots where jump_shot is not null group by player_id
    )
    select p.bb_player_id, l.age as snap_age, l.season as snap_season,
           (f.player_id is not null) as fresh_full, o.oldest_capture
    from players p
    left join latest l on l.player_id = p.bb_player_id
    left join fresh f on f.player_id = p.bb_player_id
    left join oldest o on o.player_id = p.bb_player_id
    where p.country_id = 66 or p.nationality = 'Slovenia'
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
    };
  });
}
