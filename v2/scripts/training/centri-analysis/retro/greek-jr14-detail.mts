import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
const rows = await sql`
  with latest_full as (
    select distinct on (player_id) player_id, season, age, source, captured_at,
      jump_shot, jump_range, outside_def, potential
    from snapshots
    where jump_range is not null and inside_def is not null and jump_shot is not null
      and season in (72,73) and age in (20,21)
    order by player_id, captured_at desc
  )
  select lf.*, p.height_cm, p.best_position, p.nationality, p.name
  from latest_full lf join players p on p.bb_player_id = lf.player_id
  where lf.jump_range >= 14
  order by lf.jump_range desc`;
console.log(JSON.stringify(rows, null, 1));
