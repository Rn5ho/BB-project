// Pure simulation, shipped engine unmodified. THE PAYOFF QUESTION.
//
// Measured (scripts/research/training-cadence-probe.mts, 2026-08-07): the owner's two real
// clubs switch training every ~2 weeks — 6-7 switches per 14-week season, cycling among
// 3-5 training types, with blocks shortening from 5-7wk early to 1wk late.
//
// Every build comparison we have run assumed MONOLITHIC blocks (2-5 switches over 56 weeks).
// This re-runs the owner's hypothetical build against traditional ones under BOTH delivery
// styles, holding the training BUDGET identical. If the ranking flips or collapses under
// realistic cadence, then build choice matters less than club adherence.
import { project, displayed, type PlayerState, type WeekConfig } from '../../src/lib/training/engine';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';
import { capThreshold, potentialScore } from '../../src/lib/training/salary';
import { SKILL_KEYS, skillsFromArray, type ModelParams } from '../../src/lib/training/types';

const PA1 = 18, OD1 = 9, JS12 = 1, JR2 = 5, ONE = 15;
const STAFF = { coachLevel: 5, youthTrainerLevel: 6, gymLevel: 3, trainingCourtLevel: 2 };

const player: PlayerState = {
  skills: skillsFromArray([7, 7, 6, 6, 5, 5, 4, 4, 3, 7]),
  age: 18, heightCm: 185, potential: 9, ftSkill: 7, staminaSkill: 7,
};

// Identical training BUDGETS; only the delivery order differs.
const BUDGETS: Record<string, [number, number][]> = {
  owner_JSJR_build: [[PA1, 10], [OD1, 17], [JS12, 15], [JR2, 3], [ONE, 11]],
  trad_pure_1v1: [[ONE, 28], [OD1, 14], [JS12, 14]],
  trad_balanced: [[ONE, 20], [OD1, 14], [JS12, 15], [PA1, 7]],
};

const wk = (id: number, n: number): WeekConfig[] => Array.from({ length: n }, () => ({ trainingId: id, ...STAFF }));

/** Monolithic: each training in one contiguous block, in listed order. */
const monolithic = (b: [number, number][]) => b.flatMap(([id, n]) => wk(id, n));

/** Realistic: proportional round-robin in `blockLen`-week chunks (measured cadence ~2wk).
 *  Always takes from whichever training has the most weeks left, so the mix stays
 *  proportional throughout instead of front-loading one skill. */
function interleaved(b: [number, number][], blockLen: number): WeekConfig[] {
  const left = b.map(([id, n]) => ({ id, n }));
  const out: WeekConfig[] = [];
  while (left.some((x) => x.n > 0)) {
    left.sort((x, y) => y.n - x.n);
    const t = left[0];
    const take = Math.min(blockLen, t.n);
    out.push(...wk(t.id, take));
    t.n -= take;
  }
  return out;
}

const disp = (v: number) => Math.ceil(v - 1e-9);
function evaluate(plan: WeekConfig[], model: ModelParams) {
  const p = project(player, plan, model, { startWeekOfSeason: 1 });
  const shown = Object.fromEntries(SKILL_KEYS.map((k) => [k, disp(p.finalSkills[k])])) as Record<string, number>;
  const ps = potentialScore(p.finalSkills);
  return {
    ...shown,
    TSP: SKILL_KEYS.reduce((a, k) => a + disp(p.finalSkills[k]), 0),
    cap: +ps.score.toFixed(1),
  };
}

const ORDER = ['js', 'jr', 'od', 'ha', 'dr', 'pa'];
const styles: [string, (b: [number, number][]) => WeekConfig[]][] = [
  ['monolithic (what we simulated)', monolithic],
  ['2wk blocks (MEASURED cadence)', (b) => interleaved(b, 2)],
  ['4wk blocks', (b) => interleaved(b, 4)],
  ['1wk blocks (late-season style)', (b) => interleaved(b, 1)],
];

console.log(`cap stage 1 for potential 9 = ${capThreshold(9)}\n`);
for (const [styleName, fn] of styles) {
  console.log(`== ${styleName}`);
  console.log(`   ${'build'.padEnd(20)}` + ORDER.map((k) => k.toUpperCase().padStart(5)).join('') + 'TSP'.padStart(7) + 'CAP'.padStart(7));
  for (const [name, budget] of Object.entries(BUDGETS)) {
    const r = evaluate(fn(budget), BBSCOUT) as Record<string, number>;
    console.log(`   ${name.padEnd(20)}` + ORDER.map((k) => String(r[k]).padStart(5)).join('') + String(r.TSP).padStart(7) + String(r.cap).padStart(7));
  }
  console.log();
}
