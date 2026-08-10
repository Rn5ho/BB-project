import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
const r = await sql`
  select season, captured_at::date as day, count(*)::int as rows,
         min(captured_at) as first_ts, max(captured_at) as last_ts
  from snapshots where source = 'census' and captured_at >= '2026-07-25'
  group by 1,2 order by 2 desc, 1`;
console.log(JSON.stringify(r, null, 1));
