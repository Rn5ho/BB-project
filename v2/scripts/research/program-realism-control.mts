// RESEARCH ONLY — SELECT-only DB, shipped engine unmodified.
//
// CONTROL for the concentration finding. The wild population is LESS concentrated
// (top3/TSP10 ~0.44) than our simulations (~0.48). Two rival explanations:
//   H1 (engine defect): a concentration brake is missing/too weak in the model.
//   H2 (program artefact): my simulated programs use long single-training blocks, while
//       real clubs switch training constantly (serving several trainees, chasing needs),
//       which spreads skills for reasons that have nothing to do with the engine.
// If H2 alone can move concentration from 0.48 to 0.44 under the SHIPPED model, the
// "defect" is an artefact of my program design and no engine change is warranted.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { project, displayed, type PlayerState, type WeekConfig } from '../../src/lib/training/engine';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';
import { SKILL_KEYS, skillsFromArray } from '../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);
let seed = 20260807;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r3 = (x: number) => +x.toFixed(3);

const SK = ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is_', 'id', 'rb', 'sb'] as const;
const rows = (await sql`
  select distinct on (s.player_id) s.player_id, s.potential, p.height_cm,
         s.jump_shot js, s.jump_range jr, s.outside_def od, s.handling ha, s.driving dr,
         s.passing pa, s.inside_shot is_, s.inside_def id, s.rebounding rb, s.shot_blocking sb
  from snapshots s join players p on p.bb_player_id = s.player_id
  where s.jump_shot is not null and s.age = 18 and s.potential >= 8 and s.season >= 72
    and p.height_cm is not null
  order by s.player_id, s.captured_at desc`) as Record<string, number>[];

// Position-appropriate training pools (catalog ids).
const GUARD = [15, 9, 1, 18, 5, 13];        // 1v1, OD, JS, PA, JR, HA
const BIG = [22, 25, 27, 30, 2, 16];        // IS, ID, RB, SB, JS34, 1v1 34

// Switch cadence: how many weeks each block lasts. 56 weeks total either way, so total
// training input is IDENTICAL — only the switching frequency differs.
const CADENCES = [28, 14, 8, 4, 2, 1];

const out: Record<string, unknown> = {};
for (const blockLen of CADENCES) {
  seed = 20260807;
  const concs: number[] = [], maxes: number[] = [], tsps: number[] = [];
  for (let i = 0; i < 400; i++) {
    const s = pick(rows);
    const big = s.height_cm >= 202;
    const pool = big ? BIG : GUARD;
    const staff = { coachLevel: pick([3, 4, 5, 5, 6, 6, 7]), youthTrainerLevel: pick([0, 3, 5, 6, 6, 7]), gymLevel: pick([0, 0, 1, 2, 3]), trainingCourtLevel: pick([0, 0, 1, 2, 3]) };
    const plan: WeekConfig[] = [];
    while (plan.length < 56) {
      const id = pick(pool);
      for (let w = 0; w < blockLen && plan.length < 56; w++) plan.push({ trainingId: id, ...staff });
    }
    const player: PlayerState = { skills: skillsFromArray(SK.map((k) => s[k])), age: 18, heightCm: s.height_cm, potential: s.potential, ftSkill: 5, staminaSkill: 5 };
    const p = project(player, plan, BBSCOUT, { startWeekOfSeason: 1 });
    const vals = SKILL_KEYS.map((k) => Math.min(30, displayed(p.finalSkills[k])));
    const sorted = [...vals].sort((a, b) => b - a);
    const tsp = vals.reduce((a, b) => a + b, 0);
    tsps.push(tsp); maxes.push(sorted[0]); concs.push((sorted[0] + sorted[1] + sorted[2]) / tsp);
  }
  out[`block=${blockLen}wk (${Math.ceil(56 / blockLen)} switches)`] = { meanTsp: r3(mean(tsps)), meanMax: r3(mean(maxes)), meanConc: r3(mean(concs)) };
}

console.log(JSON.stringify({
  note: 'shipped BBSCOUT only; identical 56-week budget, only switch cadence varies. '
    + 'Wild target: conc ~0.438-0.447, max 13.8-17.8 depending on TSP bin. Greek: conc 0.459, max 17.8.',
  results: out,
}, null, 1));
