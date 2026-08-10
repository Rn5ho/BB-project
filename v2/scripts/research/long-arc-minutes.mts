// READ-ONLY research harvest: per-position match minutes for the owner's OWN two clubs
// across seasons 69-73, reconstructed from BB's schedule.aspx + boxscore.aspx.
//
// Purpose: a long-arc ground-truth minutes dataset (the training model's minutes gate is
// the least-observed input over multi-season arcs — the production `player_match_minutes`
// table only covers the current season and only Slovenian-tracked players).
//
// SAFETY: SELECT-only against Neon (season start dates), GET-only against BB.
// Writes nothing to any DB table. All output goes to docs/research/training/long-arc/.
//
// Run:  npx tsx scripts/research/long-arc-minutes.mts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

// Type-only imports are erased at runtime, so they can stay static.
import type { BbScheduleMatch, BbBoxscore } from '../../src/server/bb/xml-api';

// Dynamic imports: these modules read env / build a DB client at module load, so they
// must be pulled in AFTER dotenv has populated process.env.
const { fetchSchedule, fetchBoxscores } = await import('../../src/server/bb/xml-api');
const { isCountableType, seasonWeekOf } = await import('../../src/server/sync/minutes');

const TEAMS = [114360, 276888]; // Savlje BC (primary), Berlin BC (second team)
const SEASONS = [69, 70, 71, 72, 73];
const BOX_BATCH = 40;
const BATCH_PAUSE_MS = 400;

const OUT_DIR = resolve(process.cwd(), '../docs/research/training/long-arc');
mkdirSync(OUT_DIR, { recursive: true });

const sql = neon(process.env.DATABASE_URL!);
const seasonRows = await sql`select id, start, finish from seasons where id = any(${SEASONS}) order by id`;
const seasonStart = new Map<number, Date>(seasonRows.map((r) => [Number(r.id), new Date(r.start as string)]));
const seasonFinish = new Map<number, string | null>(
  seasonRows.map((r) => [Number(r.id), r.finish ? String(r.finish) : null]),
);
for (const s of SEASONS) if (!seasonStart.has(s)) console.warn(`WARN: no seasons row for season ${s}`);

const teamNames = new Map<number, string>();
const nameRows = await sql`select team_id, name from teams where team_id = any(${TEAMS})`;
for (const r of nameRows) teamNames.set(Number(r.team_id), String(r.name ?? ''));

interface MinuteRow {
  teamId: number; season: number; seasonWeek: number; matchId: number;
  matchDate: string; matchType: string; playerId: number;
  minPg: number; minSg: number; minSf: number; minPf: number; minC: number; totalMin: number;
  isStarter: boolean | null;
}

interface Coverage {
  teamId: number; season: number;
  scheduleOk: boolean; scheduleError: string | null;
  matchesReturned: number; countableMatches: number; skippedTypes: Record<string, number>;
  boxscoresOk: number; boxscoresFailed: number; failedMatchIds: number[];
  distinctPlayers: number; minuteRows: number;
  firstMatchDate: string | null; lastMatchDate: string | null;
}

const allRows: MinuteRow[] = [];
const coverage: Coverage[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

for (const teamId of TEAMS) {
  for (const season of SEASONS) {
    const cov: Coverage = {
      teamId, season, scheduleOk: false, scheduleError: null,
      matchesReturned: 0, countableMatches: 0, skippedTypes: {},
      boxscoresOk: 0, boxscoresFailed: 0, failedMatchIds: [],
      distinctPlayers: 0, minuteRows: 0, firstMatchDate: null, lastMatchDate: null,
    };

    let sched: BbScheduleMatch[] = [];
    try {
      sched = await fetchSchedule(teamId, season);
      cov.scheduleOk = true;
      cov.matchesReturned = sched.length;
    } catch (e) {
      cov.scheduleError = (e as Error).message.slice(0, 200);
      coverage.push(cov);
      console.log(JSON.stringify({ teamId, season, scheduleError: cov.scheduleError }));
      continue;
    }

    const now = Date.now();
    const countable = sched.filter((m) => {
      if (!isCountableType(m.type)) {
        cov.skippedTypes[m.type] = (cov.skippedTypes[m.type] ?? 0) + 1;
        return false;
      }
      // Only matches that have actually been played (BB reads finished ~3h after start).
      return m.startTime.getTime() < now - 3 * 3600_000;
    });
    cov.countableMatches = countable.length;

    const start = seasonStart.get(season) ?? null;
    const byId = new Map(countable.map((m) => [m.matchId, m]));
    const teamRows: MinuteRow[] = [];
    const playerSet = new Set<number>();

    const ids = countable.map((m) => m.matchId);
    for (let i = 0; i < ids.length; i += BOX_BATCH) {
      const chunk = ids.slice(i, i + BOX_BATCH);
      const boxes: Array<BbBoxscore | null> = await fetchBoxscores(chunk);
      for (let j = 0; j < chunk.length; j++) {
        const matchId = chunk[j];
        const b = boxes[j];
        if (b == null) { cov.boxscoresFailed++; cov.failedMatchIds.push(matchId); continue; }
        cov.boxscoresOk++;
        const m = byId.get(matchId)!;
        const date = (b.startTime ?? m.startTime);
        for (const p of b.players) {
          if (p.teamId !== teamId) continue;
          const total = p.minPg + p.minSg + p.minSf + p.minPf + p.minC;
          playerSet.add(p.playerId);
          teamRows.push({
            teamId, season,
            seasonWeek: start ? seasonWeekOf(date, start) : -1,
            matchId, matchDate: date.toISOString(), matchType: b.type || m.type,
            playerId: p.playerId,
            minPg: p.minPg, minSg: p.minSg, minSf: p.minSf, minPf: p.minPf, minC: p.minC,
            totalMin: total, isStarter: p.isStarter,
          });
        }
      }
      if (i + BOX_BATCH < ids.length) await sleep(BATCH_PAUSE_MS);
    }

    teamRows.sort((a, b) => a.matchDate.localeCompare(b.matchDate) || a.playerId - b.playerId);
    cov.minuteRows = teamRows.length;
    cov.distinctPlayers = playerSet.size;
    const dates = countable.map((m) => m.startTime.toISOString()).sort();
    cov.firstMatchDate = dates[0] ?? null;
    cov.lastMatchDate = dates[dates.length - 1] ?? null;

    allRows.push(...teamRows);
    writeFileSync(
      resolve(OUT_DIR, `minutes-${teamId}-s${season}.json`),
      JSON.stringify({
        teamId, teamName: teamNames.get(teamId) ?? null, season,
        seasonStart: start ? start.toISOString() : null,
        seasonFinish: seasonFinish.get(season) ?? null,
        fetchedAt: new Date().toISOString(),
        coverage: cov, rows: teamRows,
      }, null, 2) + '\n',
    );
    coverage.push(cov);
    console.log(JSON.stringify({
      teamId, season, matches: cov.matchesReturned, countable: cov.countableMatches,
      boxOk: cov.boxscoresOk, boxFail: cov.boxscoresFailed, players: cov.distinctPlayers, rows: cov.minuteRows,
    }));
    await sleep(BATCH_PAUSE_MS);
  }
}

// ---- combined tidy CSV ----
const csvHead = 'team_id,season,season_week,match_id,match_date,match_type,player_id,min_pg,min_sg,min_sf,min_pf,min_c,total_min';
const csvLines = allRows
  .slice()
  .sort((a, b) => a.teamId - b.teamId || a.season - b.season || a.matchDate.localeCompare(b.matchDate) || a.playerId - b.playerId)
  .map((r) => [
    r.teamId, r.season, r.seasonWeek, r.matchId, r.matchDate, r.matchType, r.playerId,
    r.minPg, r.minSg, r.minSf, r.minPf, r.minC, r.totalMin,
  ].join(','));
writeFileSync(resolve(OUT_DIR, 'own-team-minutes.csv'), [csvHead, ...csvLines].join('\n') + '\n');

// ---- per (player, season) summary ----
interface Sum {
  teamIds: Set<number>; pg: number; sg: number; sf: number; pf: number; c: number;
  total: number; matches: number; played: number; starts: number;
  firstDate: string; lastDate: string; weeks: Set<number>;
}
const sums = new Map<string, Sum>();
for (const r of allRows) {
  const key = `${r.playerId}|${r.season}`;
  let s = sums.get(key);
  if (!s) {
    s = { teamIds: new Set(), pg: 0, sg: 0, sf: 0, pf: 0, c: 0, total: 0, matches: 0, played: 0, starts: 0,
          firstDate: r.matchDate, lastDate: r.matchDate, weeks: new Set() };
    sums.set(key, s);
  }
  s.teamIds.add(r.teamId);
  s.pg += r.minPg; s.sg += r.minSg; s.sf += r.minSf; s.pf += r.minPf; s.c += r.minC;
  s.total += r.totalMin; s.matches++;
  if (r.totalMin > 0) s.played++;
  if (r.isStarter) s.starts++;
  if (r.matchDate < s.firstDate) s.firstDate = r.matchDate;
  if (r.matchDate > s.lastDate) s.lastDate = r.matchDate;
  if (r.seasonWeek > 0) s.weeks.add(r.seasonWeek);
}
const sumHead = 'player_id,season,team_ids,countable_matches,matches_with_minutes,starts,weeks_covered,min_pg,min_sg,min_sf,min_pf,min_c,total_min,avg_min_per_match,first_match_date,last_match_date';
const sumLines = [...sums.entries()]
  .map(([k, s]) => {
    const [pid, season] = k.split('|').map(Number);
    return { pid, season, s };
  })
  .sort((a, b) => a.pid - b.pid || a.season - b.season)
  .map(({ pid, season, s }) => [
    pid, season, [...s.teamIds].sort().join('|'), s.matches, s.played, s.starts, s.weeks.size,
    s.pg, s.sg, s.sf, s.pf, s.c, s.total,
    (s.total / Math.max(1, s.matches)).toFixed(2),
    s.firstDate.slice(0, 10), s.lastDate.slice(0, 10),
  ].join(','));
writeFileSync(resolve(OUT_DIR, 'player-season-summary.csv'), [sumHead, ...sumLines].join('\n') + '\n');

writeFileSync(
  resolve(OUT_DIR, 'coverage.json'),
  JSON.stringify({
    fetchedAt: new Date().toISOString(),
    teams: TEAMS.map((t) => ({ teamId: t, name: teamNames.get(t) ?? null })),
    seasons: SEASONS.map((s) => ({
      season: s, start: seasonStart.get(s)?.toISOString() ?? null, finish: seasonFinish.get(s) ?? null,
    })),
    coverage: coverage.map((c) => ({ ...c })),
    totals: {
      minuteRows: allRows.length,
      playerSeasonRows: sums.size,
      boxscoresOk: coverage.reduce((a, c) => a + c.boxscoresOk, 0),
      boxscoresFailed: coverage.reduce((a, c) => a + c.boxscoresFailed, 0),
      countableMatches: coverage.reduce((a, c) => a + c.countableMatches, 0),
    },
  }, null, 2) + '\n',
);

console.log(JSON.stringify({
  done: true, minuteRows: allRows.length, playerSeasonRows: sums.size, outDir: OUT_DIR,
}));
