// SELECT-only. What signals are available for a TIGHTLY TARGETED census (2026-08-07)?
// Owner wants: 18-19 filtered to real U-21 prospects that are ACTUALLY BEING TRAINED
// ("if they didn't train, they're lost causes"), and 20-21 filtered to genuine U-21 material.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Do we have a pre-training baseline today, and DMI/salary coverage to detect a Friday pop?
const recent = await sql`
  select source, date_trunc('hour', captured_at) as hour, count(*)::int as rows,
         count(salary)::int as with_salary, count(dmi)::int as with_dmi
  from snapshots
  where captured_at >= '2026-08-03' and source = 'api'
  group by 1, 2 order by 2 desc limit 12`;

// Slovenian 18-21 universe as the census sees it.
const universe = await sql`
  with latest as (
    select distinct on (player_id) player_id, age, season, potential, salary, dmi
    from snapshots order by player_id, captured_at desc
  ),
  latest_full as (
    select distinct on (player_id) player_id, captured_at as last_full,
      coalesce(tsp, jump_shot + jump_range + outside_def + handling + driving + passing
             + inside_shot + inside_def + rebounding + shot_blocking) as tsp
    from snapshots where jump_shot is not null order by player_id, captured_at desc
  )
  select (l.age + (73 - l.season)) as age_now,
         count(*)::int as players,
         count(*) filter (where l.potential >= 8)::int as pot8plus,
         count(*) filter (where l.potential >= 9)::int as pot9plus,
         count(lf.tsp)::int as have_tsp,
         count(*) filter (where lf.last_full >= '2026-08-04')::int as fresh_s73
  from players p join latest l on l.player_id = p.bb_player_id
  left join latest_full lf on lf.player_id = p.bb_player_id
  where (p.country_id = 66 or p.nationality in ('Slovenia','Slovenija'))
  group by 1 having (l.age + (73 - l.season)) between 18 and 21
  order by 1`;

// TSP distribution per age among Slovenians — to pick sane thresholds.
const tspDist = await sql`
  with latest as (
    select distinct on (player_id) player_id, age, season, potential from snapshots order by player_id, captured_at desc
  ),
  latest_full as (
    select distinct on (player_id) player_id,
      coalesce(tsp, jump_shot + jump_range + outside_def + handling + driving + passing
             + inside_shot + inside_def + rebounding + shot_blocking) as tsp
    from snapshots where jump_shot is not null order by player_id, captured_at desc
  )
  select (l.age + (73 - l.season)) as age_now,
         percentile_disc(0.5) within group (order by lf.tsp) as p50,
         percentile_disc(0.75) within group (order by lf.tsp) as p75,
         percentile_disc(0.9) within group (order by lf.tsp) as p90,
         percentile_disc(0.95) within group (order by lf.tsp) as p95,
         max(lf.tsp) as max_tsp, count(*)::int as n
  from players p join latest l on l.player_id = p.bb_player_id
  join latest_full lf on lf.player_id = p.bb_player_id
  where (p.country_id = 66 or p.nationality in ('Slovenia','Slovenija'))
  group by 1 having (l.age + (73 - l.season)) between 18 and 21
  order by 1`;

console.log(JSON.stringify({ apiSnapshotsRecent: recent, sloveniaUniverse: universe, tspPercentiles: tspDist }, null, 1));
