import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db, modelScorecards, players, selfTrainerConfig, skillPops, snapshots, syncLog } from '@/db';
import { BbWebSession, collectHiddenFields } from '@/server/bb/web-session';
import { parseTrainingHistory, parseUsDate } from '@/server/bb/training-history';
import { caseFromScrapedHistory, replayCase, type ReplayScore } from '@/lib/training/replay';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from '@/lib/training/models/bbscout';
import { COACH_PARROT } from '@/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '@/lib/training/models/open-source-live';
import type { ModelParams } from '@/lib/training/types';

export interface SelfTrainerResult {
  playersScored: number;
  playersSkipped: number; // no history rows, no full snapshot, or no height
  popsUpserted: number;
  weekCount: number; // training weeks scored (same for every model)
  scorecardRows: number;
}

/** Same panel the replay CLI scores — bbscout + both provenance models + the band edges. */
const MODELS: ModelParams[] = [BBSCOUT, COACH_PARROT, OPEN_SOURCE_LIVE, BBSCOUT_LOW, BBSCOUT_HIGH];

// skill_pops.skill short keys for the two non-rate skills (see pops.ts PopSkill)
const POP_KEY_TO_DB: Record<string, string> = { stamina: 'st', free_throw: 'ft' };

interface PlayerDetail {
  playerId: number; name: string; weeks: number;
  hits: number; misses: number; falseAlarms: number;
  endAbsErr: number; endExact: number; endCount: number;
}

/**
 * Weekly own-team ground-truth loop ("self-trainer"): scrape traininghistory.aspx for
 * every tracked player owned by the configured club, persist exact-date pops as
 * 'own-scrape' anchors, replay each player's visible history through the model panel
 * with the configured staff levels, and store one scorecard row per model. Runs
 * Fridays after BB's training update (Hetzner cron → /api/cron/self-trainer) or
 * manually from /scorecard. Read-only against BB — plain-HTTP session, no Playwright.
 */
export async function runSelfTrainer(trigger: string): Promise<SelfTrainerResult> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'self-trainer', trigger }).returning({ id: syncLog.id });
  try {
    const [cfg] = await db.select().from(selfTrainerConfig).limit(1);
    if (!cfg) throw new Error('self-trainer not configured — set your club + staff levels on /scorecard');

    const roster = await db.select({
      bbPlayerId: players.bbPlayerId, name: players.name, heightCm: players.heightCm,
    }).from(players).where(eq(players.ownerTeamId, cfg.teamId));
    if (roster.length === 0) {
      throw new Error(`no tracked players owned by team ${cfg.teamId} — check the team id or run a player sync first`);
    }

    const session = new BbWebSession();
    await session.login();
    if (cfg.switchTeam) {
      // The lbSwitchTeams postback belongs to /home.aspx — see scrape-training-history CLI.
      const home = await session.get('/home.aspx');
      await session.post('/home.aspx', {
        ...collectHiddenFields(home),
        __EVENTTARGET: 'ctl00$lbSwitchTeams',
        __EVENTARGUMENT: '',
      });
    }

    const counts: SelfTrainerResult = { playersScored: 0, playersSkipped: 0, popsUpserted: 0, weekCount: 0, scorecardRows: 0 };
    const totals = new Map<string, { score: Omit<ReplayScore, 'events'>; details: PlayerDetail[] }>(
      MODELS.map((m) => [m.id, { score: { hits: 0, misses: 0, falseAlarms: 0, endAbsErr: 0, endCount: 0, endExact: 0 }, details: [] }]),
    );

    for (const p of roster) {
      await new Promise((r) => setTimeout(r, 1000)); // pace page fetches like the census
      const html = await session.get(`/player/${p.bbPlayerId}/traininghistory.aspx`);
      const weeks = parseTrainingHistory(html);
      if (weeks.length === 0) { counts.playersSkipped++; continue; }
      weeks.reverse(); // newest-first page → chronological

      // Exact-date pop anchors (idempotent on uq_skill_pops; 'own-scrape' rows persist
      // across inference rebuilds).
      for (const w of weeks) {
        for (const pop of w.pops) {
          if (!pop.key) continue; // unmapped skill name — skip rather than write a bad row
          const at = parseUsDate(w.date);
          await db.insert(skillPops).values({
            playerId: p.bbPlayerId, skill: POP_KEY_TO_DB[pop.key] ?? pop.key,
            toDisplayed: pop.to, delta: pop.to - pop.from,
            windowStart: at, windowEnd: at, windowWeeks: 1, source: 'own-scrape',
          }).onConflictDoUpdate({
            target: [skillPops.playerId, skillPops.skill, skillPops.windowEnd, skillPops.source],
            set: { toDisplayed: pop.to, delta: pop.to - pop.from },
          });
          counts.popsUpserted++;
        }
      }

      // End state = latest full snapshot (same convention as the CLI).
      const [snap] = await db.select().from(snapshots)
        .where(and(eq(snapshots.playerId, p.bbPlayerId), isNotNull(snapshots.jumpShot)))
        .orderBy(desc(snapshots.capturedAt)).limit(1);
      if (!snap || p.heightCm == null) { counts.playersSkipped++; continue; }

      const replayable = caseFromScrapedHistory({
        label: `${p.name} (${p.bbPlayerId})`,
        rawWeeks: weeks,
        heightCm: p.heightCm,
        potential: snap.potential,
        snapshotAge: snap.age,
        endSkills: {
          js: snap.jumpShot, jr: snap.jumpRange, od: snap.outsideDef, ha: snap.handling,
          dr: snap.driving, pa: snap.passing, is: snap.insideShot, id: snap.insideDef,
          rb: snap.rebounding, sb: snap.shotBlocking,
        },
        endStamina: snap.stamina, endFreeThrow: snap.freeThrow,
        coachLevel: cfg.coachLevel, youthTrainerLevel: cfg.youthTrainerLevel,
        gymLevel: cfg.gymLevel, trainingCourtLevel: cfg.trainingCourtLevel,
      });
      if (replayable.weeks.length === 0) { counts.playersSkipped++; continue; }

      counts.playersScored++;
      counts.weekCount += replayable.weeks.length;
      for (const m of MODELS) {
        const r = replayCase(replayable, m);
        const t = totals.get(m.id)!;
        t.score.hits += r.hits; t.score.misses += r.misses; t.score.falseAlarms += r.falseAlarms;
        t.score.endAbsErr += r.endAbsErr; t.score.endCount += r.endCount; t.score.endExact += r.endExact;
        t.details.push({
          playerId: p.bbPlayerId, name: p.name, weeks: replayable.weeks.length,
          hits: r.hits, misses: r.misses, falseAlarms: r.falseAlarms,
          endAbsErr: r.endAbsErr, endExact: r.endExact, endCount: r.endCount,
        });
      }
    }

    if (counts.playersScored > 0) {
      const runAt = new Date();
      await db.insert(modelScorecards).values(MODELS.map((m) => {
        const t = totals.get(m.id)!;
        return {
          runAt, modelId: m.id,
          popHits: t.score.hits, popMisses: t.score.misses, falseAlarms: t.score.falseAlarms,
          endAbsErr: t.score.endAbsErr, endCount: t.score.endCount, endExact: t.score.endExact,
          playerCount: counts.playersScored, weekCount: counts.weekCount,
          details: t.details,
        };
      }));
      counts.scorecardRows = MODELS.length;
    }

    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(eq(syncLog.id, logRow.id));
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(eq(syncLog.id, logRow.id));
    throw e;
  }
}
