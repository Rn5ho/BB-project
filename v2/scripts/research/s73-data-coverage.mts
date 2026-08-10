// SELECT-only: what snapshot/salary coverage do we have around the S73 salary reworks?
// The formula was applied twice (first update 8/4-8/5, second update evening of 8/5),
// so knowing which capture dates carry salary decides what we can measure.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const byDay = await sql`
  select source, season, date_trunc('day', captured_at)::date as day,
         count(*)::int as rows, count(salary)::int as with_salary,
         count(dmi)::int as with_dmi, count(jump_shot)::int as with_skills
  from snapshots
  where captured_at >= '2026-08-01'
  group by 1, 2, 3
  order by 3 desc, 1`;

const latestSalary = await sql`
  select max(captured_at) as latest_salary_capture from snapshots where salary is not null`;

console.log(JSON.stringify({ byDay, latestSalary }, null, 1));
