// SELECT-only. Where did the S73 full captures of Slovenian 18-21s come from?
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
const r = await sql`
  with latest as (
    select distinct on (player_id) player_id, age, season from snapshots order by player_id, captured_at desc
  ), slo as (
    select p.bb_player_id, (l.age + (73 - l.season)) as age_now
    from players p join latest l on l.player_id = p.bb_player_id
    where p.country_id = 66 or p.nationality in ('Slovenia','Slovenija')
  )
  select s.source, count(distinct s.player_id)::int as players,
         min(s.captured_at)::date as first, max(s.captured_at)::date as last
  from snapshots s join slo on slo.bb_player_id = s.player_id
  where s.jump_shot is not null and s.season = 73 and slo.age_now between 18 and 21
  group by 1 order by 2 desc`;
console.log(JSON.stringify(r, null, 1));
