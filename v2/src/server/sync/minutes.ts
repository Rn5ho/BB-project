import { db, matches, players, playerMatchMinutes, seasons, syncLog, teams } from '@/db';
import { fetchBoxscores, fetchSchedules } from '@/server/bb/xml-api';
import { getCurrentSeasonId } from '@/queries/players';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';

const SLOVENIA = 66;
const FINISHED_BUFFER_MS = 3 * 3600_000; // BB matches read as "finished" 3h after start

const COUNTABLE_PREFIXES = new Set(['league', 'cup', 'friendly', 'pl']);

/** Countable = counts toward development minutes tracking (excludes BBM, NT games, unknown types). */
export function isCountableType(type: string): boolean {
  return COUNTABLE_PREFIXES.has(type.split('.')[0]);
}

/** 1-indexed season week, where day 0-6 of the season is week 1. */
export function seasonWeekOf(date: Date, seasonStart: Date): number {
  const diffDays = Math.floor((date.getTime() - seasonStart.getTime()) / 86_400_000);
  return Math.floor(diffDays / 7) + 1;
}

export interface MinutesSyncResult {
  clubsSynced: number;
  clubsRemaining: number;
  matchesDiscovered: number;
  boxscoresFetched: number;
  boxscoresUnavailable: number;
  minutesRows: number;
  matchesRemaining: number;
}

interface TeamScheduleState {
  scheduleSyncedAt: Date | null;
  scheduleSyncedSeason: number | null;
}

/** A club needs a fresh schedule fetch if never synced, synced for a different season, or (unless forced) past the staleness window. */
function isStaleClub(t: TeamScheduleState | undefined, seasonId: number, staleDays: number, forceSchedules: boolean): boolean {
  if (!t || t.scheduleSyncedAt == null) return true;
  if (t.scheduleSyncedSeason !== seasonId) return true;
  if (forceSchedules) return false;
  return t.scheduleSyncedAt.getTime() < Date.now() - staleDays * 24 * 3600_000;
}

export async function runMinutesSync(
  opts: { clubBatch?: number; matchBatch?: number; season?: number; scheduleStaleDays?: number; forceSchedules?: boolean } = {},
  trigger: string,
): Promise<MinutesSyncResult> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'minutes', trigger }).returning({ id: syncLog.id });
  try {
    const clubBatch = opts.clubBatch ?? 100;
    const matchBatch = opts.matchBatch ?? 400;
    const staleDays = opts.scheduleStaleDays ?? 3;
    const forceSchedules = opts.forceSchedules ?? false;

    // Step 1: resolve season + its start date
    const seasonId = opts.season ?? (await getCurrentSeasonId());
    const [seasonRow] = await db.select().from(seasons).where(eq(seasons.id, seasonId));
    if (!seasonRow) throw new Error(`runMinutesSync: season ${seasonId} not found`);
    const seasonStart = seasonRow.start;

    const counts: MinutesSyncResult = {
      clubsSynced: 0, clubsRemaining: 0, matchesDiscovered: 0,
      boxscoresFetched: 0, boxscoresUnavailable: 0, minutesRows: 0, matchesRemaining: 0,
    };

    // Step 2: tracked club ids
    const trackedClubRows = await db.selectDistinct({ ownerTeamId: players.ownerTeamId }).from(players)
      .where(and(eq(players.countryId, SLOVENIA), eq(players.archived, false), isNotNull(players.ownerTeamId)));
    const trackedClubIds = trackedClubRows.map((r) => r.ownerTeamId).filter((id): id is number => id != null);

    // Step 3: stale clubs -> fetch schedules -> upsert matches + mark clubs synced
    if (trackedClubIds.length > 0) {
      const teamRows = await db.select({
        teamId: teams.teamId, scheduleSyncedAt: teams.scheduleSyncedAt, scheduleSyncedSeason: teams.scheduleSyncedSeason,
      }).from(teams).where(inArray(teams.teamId, trackedClubIds));
      const teamById = new Map(teamRows.map((t) => [t.teamId, t]));

      const staleClubIds = trackedClubIds
        .filter((id) => isStaleClub(teamById.get(id), seasonId, staleDays, forceSchedules))
        .slice(0, clubBatch);

      if (staleClubIds.length > 0) {
        const scheduleResults = await fetchSchedules(staleClubIds, seasonId);
        const scheduleNow = new Date();
        for (const { teamId, matches: clubMatches } of scheduleResults) {
          if (clubMatches == null) continue; // failed fetch: leave stale for retry, don't mark synced

          const finished = clubMatches.filter(
            (m) => isCountableType(m.type) && m.startTime.getTime() < Date.now() - FINISHED_BUFFER_MS,
          );
          if (finished.length > 0) {
            const rows = finished.map((m) => ({
              matchId: m.matchId,
              homeTeamId: m.homeTeamId,
              awayTeamId: m.awayTeamId,
              matchType: m.type,
              startTime: m.startTime,
              season: seasonId,
              seasonWeek: seasonWeekOf(m.startTime, seasonStart),
            }));
            const inserted = await db.insert(matches).values(rows).onConflictDoNothing().returning({ matchId: matches.matchId });
            counts.matchesDiscovered += inserted.length;
          }

          await db.execute(sql`
            insert into teams (team_id, schedule_synced_at, schedule_synced_season)
            values (${teamId}, ${scheduleNow.toISOString()}, ${seasonId})
            on conflict (team_id) do update set
              schedule_synced_at = excluded.schedule_synced_at,
              schedule_synced_season = excluded.schedule_synced_season
          `);
          counts.clubsSynced++;
        }
      }
    }

    // Step 4: pending matches (finished, boxscore not yet fetched)
    const pendingRows = await db.execute(sql`
      select match_id from matches
      where boxscore_fetched_at is null and start_time < now() - interval '3 hours'
      order by start_time
      limit ${matchBatch}
    `);
    const pendingIds = (pendingRows.rows as { match_id: number }[]).map((r) => Number(r.match_id));

    // Step 5: fetch boxscores, insert minutes for tracked players
    if (pendingIds.length > 0) {
      const trackedPlayerRows = await db.select({ id: players.bbPlayerId }).from(players)
        .where(and(eq(players.countryId, SLOVENIA), eq(players.archived, false)));
      const trackedPlayerIds = new Set(trackedPlayerRows.map((r) => r.id));

      const boxscores = await fetchBoxscores(pendingIds);
      const boxscoreNow = new Date();
      for (let i = 0; i < pendingIds.length; i++) {
        const matchId = pendingIds[i];
        const b = boxscores[i];
        if (b == null) {
          counts.boxscoresUnavailable++;
          await db.update(matches).set({ boxscoreFetchedAt: boxscoreNow, boxscoreError: 'unavailable' })
            .where(eq(matches.matchId, matchId));
          continue;
        }

        counts.boxscoresFetched++;
        const rows = b.players.filter((p) => trackedPlayerIds.has(p.playerId)).map((p) => ({
          matchId,
          playerId: p.playerId,
          minPg: p.minPg, minSg: p.minSg, minSf: p.minSf, minPf: p.minPf, minC: p.minC,
          isStarter: p.isStarter,
        }));
        if (rows.length > 0) {
          const inserted = await db.insert(playerMatchMinutes).values(rows).onConflictDoNothing()
            .returning({ matchId: playerMatchMinutes.matchId });
          counts.minutesRows += inserted.length;
        }

        await db.update(matches).set({ boxscoreFetchedAt: boxscoreNow, boxscoreError: null })
          .where(eq(matches.matchId, matchId));
      }
    }

    // Step 7: remaining counts, computed fresh at the end
    if (trackedClubIds.length > 0) {
      const teamRowsAfter = await db.select({
        teamId: teams.teamId, scheduleSyncedAt: teams.scheduleSyncedAt, scheduleSyncedSeason: teams.scheduleSyncedSeason,
      }).from(teams).where(inArray(teams.teamId, trackedClubIds));
      const teamByIdAfter = new Map(teamRowsAfter.map((t) => [t.teamId, t]));
      counts.clubsRemaining = trackedClubIds
        .filter((id) => isStaleClub(teamByIdAfter.get(id), seasonId, staleDays, forceSchedules)).length;
    }

    const remainingRows = await db.execute(sql`
      select count(*)::int as n from matches
      where boxscore_fetched_at is null and start_time < now() - interval '3 hours'
    `);
    counts.matchesRemaining = Number((remainingRows.rows[0] as { n: number }).n);

    // Step 6: sync_log bookkeeping
    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(sql`id = ${logRow.id}`);
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(sql`id = ${logRow.id}`);
    throw e;
  }
}
