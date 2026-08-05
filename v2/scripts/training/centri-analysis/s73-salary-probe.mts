// S73 salary-rework probe: census #21 (Aug 3) displayed skills vs S73 reset salaries
// (set Aug 4). Implied deflationScale distribution vs the pre-update band
// (Neon refit 0.7144; Centri per-season DMI-route 0.657-0.791).
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { estimateSalary } from '../../../src/lib/training/salary';
import { SKILL_KEYS, skillsFromArray } from '../../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);
const rows = await sql`
  with census21 as (
    select distinct on (player_id) player_id, jump_shot, jump_range, outside_def, handling,
           driving, passing, inside_shot, inside_def, rebounding, shot_blocking, age
    from snapshots
    where source = 'census' and captured_at >= '2026-08-03' and captured_at < '2026-08-04'
      and jump_shot is not null
    order by player_id, captured_at desc
  ),
  s73 as (
    select distinct on (player_id) player_id, salary
    from snapshots
    where source = 'api' and season = 73 and salary is not null and captured_at >= '2026-08-05'
    order by player_id, captured_at desc
  ),
  s72 as (
    select distinct on (player_id) player_id, salary
    from snapshots
    where source = 'api' and captured_at < '2026-08-04' and salary is not null
    order by player_id, captured_at desc
  )
  select c.player_id, c.age, c.jump_shot, c.jump_range, c.outside_def, c.handling, c.driving,
         c.passing, c.inside_shot, c.inside_def, c.rebounding, c.shot_blocking,
         n.salary as salary73, o.salary as salary72
  from census21 c join s73 n on n.player_id = c.player_id
  left join s72 o on o.player_id = c.player_id`;

const scales: number[] = [], ratios: number[] = [];
for (const r of rows as Record<string, number>[]) {
  const skills = skillsFromArray([r.jump_shot, r.jump_range, r.outside_def, r.handling, r.driving,
    r.passing, r.inside_shot, r.inside_def, r.rebounding, r.shot_blocking]);
  const pred = estimateSalary(skills, { deflationScale: 1 });
  if (pred.salary > 0 && r.salary73 > 0) scales.push(r.salary73 / pred.salary);
  if (r.salary72 && r.salary73) ratios.push(r.salary73 / r.salary72);
}
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
console.log(JSON.stringify({
  n: scales.length,
  impliedScaleS73: { p10: q(scales, 0.1), q1: q(scales, 0.25), median: q(scales, 0.5), q3: q(scales, 0.75), p90: q(scales, 0.9) },
  preUpdateBand: { neonRefit: 0.7144, centriDmiRoute: [0.657, 0.791] },
  nRatio: ratios.length,
  salary73over72: { q1: q(ratios, 0.25), median: q(ratios, 0.5), q3: q(ratios, 0.75) },
}, null, 1));
