// SELECT-only. What observation capability do we already have for testing model variants
// against live S73 training, and how deep is our history really?
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const span = await sql`
  select min(captured_at)::date as first, max(captured_at)::date as last,
         count(*)::int as snapshots, count(distinct player_id)::int as players,
         count(distinct season)::int as seasons
  from snapshots where jump_shot is not null`;

const cfg = await sql`select * from self_trainer_config`;

const scorecards = await sql`
  select model_id, count(*)::int as runs, max(run_at)::date as latest,
         round((sum(end_abs_err)::numeric / nullif(sum(end_count),0)), 3) as mae_displayed,
         round((sum(pop_hits)::numeric / nullif(sum(pop_hits)+sum(pop_misses),0)), 3) as pop_recall,
         sum(false_alarms)::int as false_alarms, max(player_count)::int as players
  from model_scorecards group by model_id order by 4`;

const scorecardRuns = await sql`
  select run_at::date as run_date, count(*)::int as model_rows
  from model_scorecards group by 1 order by 1 desc limit 8`;

const pops = await sql`
  select source, count(*)::int as pops, min(window_end)::date as first, max(window_end)::date as last
  from skill_pops group by source`;

// Own-scrape pops are the exact-date ground truth the scorecard replays against.
const recentOwnPops = await sql`
  select window_end::date as day, skill, count(*)::int as n
  from skill_pops where source = 'own-scrape' and window_end >= '2026-07-20'
  group by 1, 2 order by 1 desc, 3 desc limit 25`;

console.log(JSON.stringify({ span, selfTrainerConfig: cfg, scorecards, scorecardRuns, pops, recentOwnPops }, null, 1));
