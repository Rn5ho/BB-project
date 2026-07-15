import { asc, isNotNull, sql } from 'drizzle-orm';
import { db, players, seasons, skillPops, snapshots, syncLog, trainingObservations } from '@/db';
import { playerStateFromSnapshot } from '@/lib/training/bridge';
import { inferClubTraining, type PlayerWindowEvidence } from '@/lib/training/infer';
import { detectPops, type FullSnap, type PopEvent } from '@/lib/training/pops';
import type { WeekMinutes } from '@/queries/minutes';

export interface InferenceSyncResult {
  playersScanned: number;
  popsDetected: number;
  observationWindows: number;
  inferredHigh: number;
  inferredMedium: number;
  inferredLow: number;
}

type SnapRow = typeof snapshots.$inferSelect;

const WEEK_MS = 7 * 86_400_000;

function toFullSnap(s: SnapRow): FullSnap {
  return {
    capturedAt: s.capturedAt,
    skills: {
      js: s.jumpShot, jr: s.jumpRange, od: s.outsideDef, ha: s.handling, dr: s.driving,
      pa: s.passing, is: s.insideShot, id: s.insideDef, rb: s.rebounding, sb: s.shotBlocking,
      st: s.stamina, ft: s.freeThrow,
    },
  };
}

function stateFromSnapRow(s: SnapRow, heightCm: number, potential: number) {
  return playerStateFromSnapshot({
    skills: {
      jump_shot: s.jumpShot, jump_range: s.jumpRange, outside_def: s.outsideDef,
      handling: s.handling, driving: s.driving, passing: s.passing,
      inside_shot: s.insideShot, inside_def: s.insideDef, rebounding: s.rebounding,
      shot_blocking: s.shotBlocking,
    },
    age: s.age ?? 18, heightCm, potential,
    stamina: s.stamina, freeThrow: s.freeThrow,
  });
}

/** [start, end) date range of a 1-indexed season week. */
function weekRange(seasonStart: Date, week: number): [Date, Date] {
  const start = new Date(seasonStart.getTime() + (week - 1) * WEEK_MS);
  return [start, new Date(start.getTime() + WEEK_MS)];
}

const chunks = <T>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export async function runTrainingInference(trigger: string): Promise<InferenceSyncResult> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'inference', trigger }).returning({ id: syncLog.id });
  try {
    // 1. Load inputs: full snapshots (asc), player identity, seasons, all weekly minutes.
    const [fullSnaps, playerRows, seasonRows, minutesRows] = await Promise.all([
      db.select().from(snapshots).where(isNotNull(snapshots.jumpShot))
        .orderBy(asc(snapshots.playerId), asc(snapshots.capturedAt)),
      db.select({
        id: players.bbPlayerId, heightCm: players.heightCm, ownerTeamId: players.ownerTeamId,
      }).from(players),
      db.select().from(seasons),
      db.execute(sql`
        select pmm.player_id, m.season, m.season_week,
          sum(pmm.min_pg)::int as min_pg, sum(pmm.min_sg)::int as min_sg, sum(pmm.min_sf)::int as min_sf,
          sum(pmm.min_pf)::int as min_pf, sum(pmm.min_c)::int as min_c, count(*)::int as games
        from player_match_minutes pmm
        join matches m using (match_id)
        where m.season_week is not null
        group by 1, 2, 3
      `),
    ]);

    const playerById = new Map(playerRows.map((p) => [p.id, p]));
    const seasonById = new Map(seasonRows.map((s) => [s.id, s]));
    const minutesByPlayer = new Map<number, Array<WeekMinutes & { range: [Date, Date] }>>();
    for (const r of minutesRows.rows as Record<string, unknown>[]) {
      const playerId = Number(r.player_id);
      const season = Number(r.season);
      const seasonRow = seasonById.get(season);
      if (!seasonRow) continue;
      const wk: WeekMinutes = {
        season, seasonWeek: Number(r.season_week),
        minPg: Number(r.min_pg), minSg: Number(r.min_sg), minSf: Number(r.min_sf),
        minPf: Number(r.min_pf), minC: Number(r.min_c), games: Number(r.games),
      };
      const list = minutesByPlayer.get(playerId) ?? [];
      list.push({ ...wk, range: weekRange(seasonRow.start, wk.seasonWeek) });
      minutesByPlayer.set(playerId, list);
    }

    // 2. Per player: detect pops per consecutive pair, build club-window evidence.
    const snapsByPlayer = new Map<number, SnapRow[]>();
    for (const s of fullSnaps) {
      const list = snapsByPlayer.get(s.playerId) ?? [];
      list.push(s);
      snapsByPlayer.set(s.playerId, list);
    }

    const popRows: (typeof skillPops.$inferInsert)[] = [];
    // groupKey = teamId|startDate|endDate (date-only: census captures spread over ~an hour)
    const groups = new Map<string, { teamId: number; evidence: PlayerWindowEvidence[]; starts: Date[]; ends: Date[] }>();

    for (const [playerId, snaps] of snapsByPlayer) {
      const player = playerById.get(playerId);
      for (let i = 1; i < snaps.length; i++) {
        const prev = snaps[i - 1];
        const cur = snaps[i];
        const events: PopEvent[] = detectPops([toFullSnap(prev), toFullSnap(cur)]);
        for (const e of events) {
          popRows.push({
            playerId, skill: e.skill, toDisplayed: e.toDisplayed, delta: e.delta,
            windowStart: e.windowStart, windowEnd: e.windowEnd, windowWeeks: e.windowWeeks,
            source: 'snapshots',
          });
        }
        // Club evidence: needs a stable owner across the window + known height.
        const teamId = cur.ownerTeamId ?? player?.ownerTeamId ?? null;
        if (teamId == null || player?.heightCm == null) continue;
        if (prev.ownerTeamId != null && prev.ownerTeamId !== teamId) continue;
        const days = (cur.capturedAt.getTime() - prev.capturedAt.getTime()) / 86_400_000;
        if (days < 0.5) continue;
        const windowWeeks = Math.max(1, Math.round(days / 7));
        const weeks = (minutesByPlayer.get(playerId) ?? [])
          .filter((w) => w.range[0] < cur.capturedAt && w.range[1] > prev.capturedAt)
          .map(({ range: _range, ...wk }) => wk);
        const key = `${teamId}|${prev.capturedAt.toISOString().slice(0, 10)}|${cur.capturedAt.toISOString().slice(0, 10)}`;
        const group = groups.get(key) ?? { teamId, evidence: [], starts: [], ends: [] };
        group.evidence.push({
          playerId,
          state: stateFromSnapRow(prev, player.heightCm, cur.potential ?? prev.potential ?? 0),
          pops: events, weeks, windowWeeks,
        });
        group.starts.push(prev.capturedAt);
        group.ends.push(cur.capturedAt);
        groups.set(key, group);
      }
    }

    // 3. Rebuild skill_pops (snapshots source only — own-scrape rows persist).
    await db.execute(sql`delete from skill_pops where source = 'snapshots'`);
    for (const chunk of chunks(popRows, 500)) await db.insert(skillPops).values(chunk);

    // 4. Infer per club-window group and rebuild training_observations.
    const counts: InferenceSyncResult = {
      playersScanned: snapsByPlayer.size, popsDetected: popRows.length,
      observationWindows: 0, inferredHigh: 0, inferredMedium: 0, inferredLow: 0,
    };
    const obsRows: (typeof trainingObservations.$inferInsert)[] = [];
    for (const group of groups.values()) {
      const r = inferClubTraining(group.evidence);
      if (r.popCount === 0) continue; // nothing observed — don't store noise
      obsRows.push({
        teamId: group.teamId,
        windowStart: new Date(Math.min(...group.starts.map((d) => d.getTime()))),
        windowEnd: new Date(Math.max(...group.ends.map((d) => d.getTime()))),
        inferredTrainingId: r.inferredTrainingId,
        confidence: r.confidence,
        evidence: {
          popCount: r.popCount, playerCount: r.playerCount, explainedFrac: r.explainedFrac,
          scores: r.scores, playerIds: group.evidence.map((e) => e.playerId),
        },
      });
      counts.observationWindows++;
      if (r.inferredTrainingId != null) {
        if (r.confidence === 'high') counts.inferredHigh++;
        else if (r.confidence === 'medium') counts.inferredMedium++;
        else counts.inferredLow++;
      }
    }
    await db.execute(sql`delete from training_observations`);
    for (const chunk of chunks(obsRows, 200)) await db.insert(trainingObservations).values(chunk);

    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(sql`id = ${logRow.id}`);
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(sql`id = ${logRow.id}`);
    throw e;
  }
}
