// SELECT-only. Owner's falsification claim (2026-08-07): "I have never seen a serious U-21
// player with multiple skills at 20, let alone over 20 — only pure 1v1 spam gets there."
// Our engine projects a 28-week 1v1 rush to internal JS ~23 / HA ~21 / DR ~21 by age 21.
// If the wild contains no such players, the engine over-projects (cap too weak, top-skill
// malus too weak, rates too high, or nobody actually runs 28 straight 1v1 weeks).
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const CURRENT_SEASON = 73;
const KEYS = ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is_', 'id', 'rb', 'sb'] as const;

const rows = (await sql`
  with latest as (
    select distinct on (player_id) player_id, season, age, jump_shot js, jump_range jr,
           outside_def od, handling ha, driving dr, passing pa, inside_shot is_,
           inside_def id, rebounding rb, shot_blocking sb, potential
    from snapshots
    where jump_shot is not null and age is not null and season is not null
    order by player_id, captured_at desc
  )
  select *, (age + (${CURRENT_SEASON} - season)) as derived_age from latest`) as Record<string, number>[];

const countAtLeast = (r: Record<string, number>, bar: number) =>
  KEYS.filter((k) => r[k] >= bar).length;

function summarise(label: string, set: Record<string, number>[]) {
  const maxSkill = set.map((r) => Math.max(...KEYS.map((k) => r[k])));
  const hist: Record<string, number> = {};
  for (const m of maxSkill) hist[m >= 20 ? '20+' : String(m)] = (hist[m >= 20 ? '20+' : String(m)] ?? 0) + 1;
  return {
    label,
    n: set.length,
    globalMaxSkillObserved: set.length ? Math.max(...maxSkill) : null,
    playersWith_1_skill_at20plus: set.filter((r) => countAtLeast(r, 20) >= 1).length,
    playersWith_2_skills_at20plus: set.filter((r) => countAtLeast(r, 20) >= 2).length,
    playersWith_3_skills_at20plus: set.filter((r) => countAtLeast(r, 20) >= 3).length,
    playersWith_1_skill_at18plus: set.filter((r) => countAtLeast(r, 18) >= 1).length,
    playersWith_2_skills_at18plus: set.filter((r) => countAtLeast(r, 18) >= 2).length,
    topOfMaxSkillDistribution: Object.fromEntries(
      Object.entries(hist).sort((a, b) => Number(b[0].replace('+', '')) - Number(a[0].replace('+', ''))).slice(0, 8),
    ),
  };
}

const u21 = rows.filter((r) => r.derived_age >= 20 && r.derived_age <= 21);
const seniors = rows.filter((r) => r.derived_age >= 24);

// The specific shape the engine predicts from a pure 1v1 rush.
const rushShape = u21.filter((r) => r.dr >= 19 && r.ha >= 19 && r.js >= 19);

// Fair comparison for the sim, which used potential 9 (MVP) — a rare tier.
const u21pot9 = u21.filter((r) => r.potential >= 9);
const u21pot8 = u21.filter((r) => r.potential >= 8);

console.log(JSON.stringify({
  perSkillMaxEverStored: Object.fromEntries(KEYS.map((k) => [k, Math.max(...rows.map((r) => r[k]))])),
  age20_21: summarise('derived age 20-21', u21),
  age20_21_pot9plus: summarise('derived age 20-21, potential >= 9 (MVP+) — the sim tier', u21pot9),
  age20_21_pot8plus: summarise('derived age 20-21, potential >= 8 (superstar+)', u21pot8),
  age24plus: summarise('derived age 24+ (does 20+ appear later?)', seniors),
  enginePredictedRushShape_inWild: {
    note: 'age 20-21 with DR>=19 AND HA>=19 AND JS>=19 — what a 28-week 1v1 rush should leave',
    n: rushShape.length,
    examples: rushShape.slice(0, 5).map((r) => Object.fromEntries(KEYS.map((k) => [k, r[k]]))),
  },
}, null, 1));
