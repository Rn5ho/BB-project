// SELECT-only. Who ARE the rare age-20/21 players with a skill at 20+? The owner's claim
// was that they only arise from monolithic 1v1 programs ("trained only 1on1 for 3 seasons").
// If their profiles are 1v1-shaped (DR/HA/JS clustered high), then our engine is RIGHT about
// what a monolithic program produces — such players are simply rare because clubs switch.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const KEYS = ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is_', 'id', 'rb', 'sb'] as const;

const rows = (await sql`
  with latest as (
    select distinct on (s.player_id) s.player_id, s.season, s.age, s.potential, p.height_cm, p.name,
           s.jump_shot js, s.jump_range jr, s.outside_def od, s.handling ha, s.driving dr,
           s.passing pa, s.inside_shot is_, s.inside_def id, s.rebounding rb, s.shot_blocking sb
    from snapshots s join players p on p.bb_player_id = s.player_id
    where s.jump_shot is not null and s.age is not null and s.season is not null
    order by s.player_id, s.captured_at desc
  ) select *, (age + (73 - season)) as derived_age from latest`) as Record<string, number | string>[];

const u21 = rows.filter((r) => Number(r.derived_age) >= 20 && Number(r.derived_age) <= 21);
const top = u21.filter((r) => KEYS.some((k) => Number(r[k]) >= 20));

const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`age 20-21 with any skill >= 20:  ${top.length} of ${u21.length}\n`);
console.log(pad('height', 7) + pad('pot', 4) + KEYS.map((k) => pad(k.replace('_', '').toUpperCase(), 4)).join('') + 'TSP10  topSkill');
for (const r of top.sort((a, b) => Math.max(...KEYS.map((k) => Number(b[k]))) - Math.max(...KEYS.map((k) => Number(a[k]))))) {
  const vals = KEYS.map((k) => Number(r[k]));
  const tsp = vals.reduce((a, b) => a + b, 0);
  const topK = KEYS[vals.indexOf(Math.max(...vals))].replace('_', '').toUpperCase();
  console.log(pad(r.height_cm ?? '?', 7) + pad(r.potential, 4) + vals.map((v) => pad(v, 4)).join('') + pad(tsp, 7) + topK);
}

// Which skill is the 20+ one, across all of them?
const tally: Record<string, number> = {};
for (const r of top) for (const k of KEYS) if (Number(r[k]) >= 20) tally[k] = (tally[k] ?? 0) + 1;
console.log('\nwhich skills reach 20+:', JSON.stringify(tally));
