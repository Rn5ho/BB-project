import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
const runs = await sql`
  select id, status, started_at, finished_at,
         totals->'captured' as captured, totals->'failed' as failed,
         totals->'skipped' as skipped, totals->'opts' as opts
  from census_runs order by id desc limit 6`;
console.log(JSON.stringify(runs, null, 1));
