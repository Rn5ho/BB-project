// SELECT-only. How wrong is our (old-formula) salary model under the S73 rework?
//
// Market snapshots are the right dataset: unlike census/api joins they carry the full
// 12 skills AND the live salary on the SAME row, for thousands of players, every day.
// That lets us measure the implied deflation scale per BUILD, not just globally.
//
// Timeline: first salary update 8/4-8/5, second (corrective) update evening of 8/5.
// The 8/7 sweep is the first fully post-correction snapshot.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { estimateSalary } from '../../src/lib/training/salary';
import { skillsFromArray, type Position } from '../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);

const SKILL_COLS = `jump_shot, jump_range, outside_def, handling, driving, passing,
                    inside_shot, inside_def, rebounding, shot_blocking`;

// Newest market listing per player from the post-correction sweep.
const rows = (await sql`
  select distinct on (player_id) player_id, age, salary, ${sql.unsafe(SKILL_COLS)}
  from snapshots
  where source = 'market' and captured_at >= '2026-08-06 12:00'
    and salary is not null and jump_shot is not null
  order by player_id, captured_at desc`) as Record<string, number>[];

// Same players as priced by the FIRST update (8/4 sweep) — isolates the correction.
const first = (await sql`
  select distinct on (player_id) player_id, salary
  from snapshots
  where source = 'market' and captured_at >= '2026-08-04' and captured_at < '2026-08-05'
    and salary is not null
  order by player_id, captured_at desc`) as Record<string, number>[];
const firstById = new Map(first.map((r) => [r.player_id, r.salary]));

const q = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? +s[Math.floor(p * (s.length - 1))].toFixed(4) : NaN;
};
const stat = (a: number[]) =>
  a.length ? { n: a.length, p10: q(a, 0.1), median: q(a, 0.5), p90: q(a, 0.9) } : { n: 0 };

const all: number[] = [];
const byPos: Record<string, number[]> = {};
const bySb: Record<string, number[]> = {};
const corrByPos: Record<string, number[]> = {};
let overTwenty = 0;

for (const r of rows) {
  const arr = [r.jump_shot, r.jump_range, r.outside_def, r.handling, r.driving, r.passing,
    r.inside_shot, r.inside_def, r.rebounding, r.shot_blocking];
  if (arr.some((v) => v > 20)) overTwenty++; // model clamps at 20 — these are out of range
  const { salary: pred, best } = estimateSalary(skillsFromArray(arr), { deflationScale: 1 });
  if (!(pred > 0) || !(r.salary > 0)) continue;

  const scale = r.salary / pred;
  all.push(scale);
  (byPos[best as Position] ??= []).push(scale);

  const sb = r.shot_blocking;
  const bucket = sb >= 15 ? 'SB 15+' : sb >= 12 ? 'SB 12-14' : sb >= 9 ? 'SB 9-11' : 'SB <9';
  (bySb[bucket] ??= []).push(scale);

  const s1 = firstById.get(r.player_id);
  if (s1) (corrByPos[best as Position] ??= []).push(r.salary / s1);
}

const map = (o: Record<string, number[]>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, stat(v)]));

console.log(JSON.stringify({
  note: 'scale = actual S73 salary / our old-formula estimate (deflationScale=1). '
    + 'Pre-update Neon refit was 0.7144 — a flat scale means our shape still fits.',
  nListings: rows.length,
  skillsOver20: overTwenty,
  impliedScale: { overall: stat(all), byBestPosition: map(byPos), byShotBlocking: map(bySb) },
  secondUpdateEffect: {
    note: 'salary on 8/7 (post-correction) / salary on 8/4 (first update), same player',
    byBestPosition: map(corrByPos),
  },
}, null, 1));
