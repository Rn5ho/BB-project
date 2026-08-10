// SELECT-only DB + pure simulation. RESEARCH ONLY — imports the shipped engine but
// never mutates it; all variants are built as local ModelParams copies.
//
// DEFECT UNDER TEST (found 2026-08-07, later RETRACTED — see
// docs/research/training/concentration-study-2026-08-07/FINDINGS.md): our engine reproduces
// realistic TOTAL skill growth over a 56-week U-21 arc but appears to CONCENTRATE it far too
// much — it projects one skill to 21-23 by age 21, while only 13/1649 MVP-potential 20/21yos
// have ANY skill at 20+, 1 has two, none has three, and the Greek bronze squad's mean
// per-player max is 17.8 (its highest single skill is SB 21, on two loophole centers).
// OUTCOME: the program-realism control showed the shipped, unmodified model reproduces the
// wild concentration range once training-budget diversity is realistic. No engine change.
//
// METHOD: compare CONCENTRATION CONDITIONAL ON TOTAL. `top3 / tsp10` is scale-free, so it
// is insensitive to staff quality, minutes and weeks-trained — which we cannot observe for
// the wild population. A model with the right brake must match the observed conditional
// relationship, not merely the average endpoint.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { project, displayed, type PlayerState, type WeekConfig } from '../../src/lib/training/engine';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';
import { SKILL_KEYS, skillsFromArray, type ModelParams } from '../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);
const CURRENT_SEASON = 73;

// ---------- seeded PRNG (reproducible runs) ----------
let seed = 20260807;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];

// ---------- shape metrics ----------
type Shape = { tsp10: number; max: number; top3: number; conc: number; n18: number; n20: number };
function shapeOf(vals: number[]): Shape {
  const s = [...vals].sort((a, b) => b - a);
  const tsp10 = vals.reduce((a, b) => a + b, 0);
  const top3 = s[0] + s[1] + s[2];
  return { tsp10, max: s[0], top3, conc: top3 / tsp10, n18: vals.filter((v) => v >= 18).length, n20: vals.filter((v) => v >= 20).length };
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const r3 = (x: number) => +x.toFixed(3);

// TSP10 bins let us compare like-for-like: "among players who reached this much total, how
// concentrated are they?"
const BINS = [[80, 95], [95, 105], [105, 115], [115, 130]] as const;
function binned(shapes: Shape[]) {
  return BINS.map(([lo, hi]) => {
    const g = shapes.filter((s) => s.tsp10 >= lo && s.tsp10 < hi);
    return { bin: `${lo}-${hi}`, n: g.length, meanMax: r3(mean(g.map((s) => s.max))), meanConc: r3(mean(g.map((s) => s.conc))), meanN18: r3(mean(g.map((s) => s.n18))), meanN20: r3(mean(g.map((s) => s.n20))) };
  });
}

// ---------- observed population ----------
const rows = (await sql`
  with latest as (
    select distinct on (s.player_id) s.player_id, s.season, s.age, s.potential, p.height_cm,
           s.jump_shot js, s.jump_range jr, s.outside_def od, s.handling ha, s.driving dr,
           s.passing pa, s.inside_shot is_, s.inside_def id, s.rebounding rb, s.shot_blocking sb
    from snapshots s join players p on p.bb_player_id = s.player_id
    where s.jump_shot is not null and s.age is not null and s.season is not null
      and p.height_cm is not null
    order by s.player_id, s.captured_at desc
  ) select *, (age + (${CURRENT_SEASON} - season)) as derived_age from latest`) as Record<string, number>[];

const SK = ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is_', 'id', 'rb', 'sb'] as const;
const observed = rows
  .filter((r) => r.derived_age >= 20 && r.derived_age <= 21 && r.potential >= 8)
  .map((r) => shapeOf(SK.map((k) => r[k])));

// Greek bronze squad = kept, medal-winning roster; immune to the market-listing bias.
const greek = readFileSync('../docs/research/market-archetypes/greece-s72/greek_summary.csv', 'utf8')
  .trim().split('\n').slice(1)
  .map((l) => l.split(','))
  .map((c) => shapeOf([14, 17, 20, 23, 26, 29, 32, 35, 38, 41].map((i) => Number(c[i]))));

// ---------- starts: real 18yo draftees ----------
const starts = rows.filter((r) => r.age === 18 && r.potential >= 8 && r.season >= 72);

// ---------- realistic 56-week programs (guard / wing / big) ----------
const B = (id: number, n: number) => ({ id, n });
const PROGRAMS = [
  [B(15, 28), B(9, 14), B(1, 14)],                        // guard: 1v1 rush -> OD -> JS
  [B(15, 20), B(9, 14), B(1, 15), B(18, 7)],              // guard: balanced
  [B(18, 10), B(9, 17), B(1, 15), B(5, 3), B(15, 11)],    // guard: OD-first (owner hypothesis)
  [B(16, 28), B(11, 14), B(2, 14)],                       // wing: 1v1 SF/PF -> OD 123 -> JS SF/PF
  [B(16, 20), B(11, 12), B(2, 12), B(25, 12)],            // wing: + inside D
  [B(22, 20), B(25, 18), B(27, 18)],                      // big: IS -> ID -> RB
  [B(30, 20), B(25, 18), B(27, 18)],                      // big: SB -> ID -> RB
  [B(15, 14), B(9, 10), B(1, 10), B(18, 8), B(5, 6), B(13, 8)], // guard: switches often
];

function planFor(prog: { id: number; n: number }[], staff: Omit<WeekConfig, 'trainingId'>): WeekConfig[] {
  return prog.flatMap(({ id, n }) => Array.from({ length: n }, () => ({ trainingId: id, ...staff })));
}

// ---------- candidate models (all local copies; BBSCOUT untouched) ----------
function variant(id: string, mut: (m: ModelParams) => ModelParams): { id: string; model: ModelParams } {
  return { id, model: mut(structuredClone(BBSCOUT)) };
}
const setSlots = (n: number) => (m: ModelParams) => {
  const x = m.crossTraining.value;
  if (x.kind === 'slot-scatter') m.crossTraining = { ...m.crossTraining, value: { ...x, baseSlots: n } };
  return m;
};
const setMalus = (c: number) => (m: ModelParams) => ({ ...m, xtrain: { ...m.xtrain, value: { kind: 'top-skill-malus' as const, coeff: c } } });

const MODELS = [
  variant('bbscout (shipped, baseSlots 0)', (m) => m),
  variant('baseSlots=1', setSlots(1)),
  variant('baseSlots=2', setSlots(2)),
  variant('baseSlots=3', setSlots(3)),
  variant('malus 0.88', setMalus(0.88)),
  variant('malus 0.85', setMalus(0.85)),
  variant('malus 0.82', setMalus(0.82)),
  variant('malus 0.80', setMalus(0.80)),
  variant('malus 0.78', setMalus(0.78)),
  variant('malus 0.75', setMalus(0.75)),
  variant('malus 0.80 + baseSlots=2', (m) => setMalus(0.80)(setSlots(2)(m))),
];

// ---------- run ----------
const N = Math.min(400, starts.length);
const out: Record<string, unknown> = {
  observed: { label: 'age 20-21, potential>=8 (wild)', n: observed.length, byTspBin: binned(observed), overall: { meanMax: r3(mean(observed.map((s) => s.max))), meanConc: r3(mean(observed.map((s) => s.conc))), pctWith2at20: r3(observed.filter((s) => s.n20 >= 2).length / observed.length) } },
  greekBronze: { n: greek.length, meanTsp: r3(mean(greek.map((s) => s.tsp10))), meanMax: r3(mean(greek.map((s) => s.max))), meanConc: r3(mean(greek.map((s) => s.conc))), maxObserved: Math.max(...greek.map((s) => s.max)) },
  simulatedStarts: N,
};

for (const { id, model } of MODELS) {
  seed = 20260807; // identical starts/programs/staff across models
  const shapes: Shape[] = [];
  for (let i = 0; i < N; i++) {
    const s = starts[Math.floor(rnd() * starts.length)];
    const staff = { coachLevel: pick([3, 4, 5, 5, 6, 6, 7]), youthTrainerLevel: pick([0, 3, 5, 6, 6, 7]), gymLevel: pick([0, 0, 1, 2, 3]), trainingCourtLevel: pick([0, 0, 1, 2, 3]) };
    const player: PlayerState = { skills: skillsFromArray(SK.map((k) => s[k])), age: 18, heightCm: s.height_cm, potential: s.potential, ftSkill: 5, staminaSkill: 5 };
    const p = project(player, planFor(pick(PROGRAMS), staff), model, { startWeekOfSeason: 1 });
    shapes.push(shapeOf(SKILL_KEYS.map((k) => Math.min(30, displayed(p.finalSkills[k])))));
  }
  out[id] = {
    overall: { meanTsp: r3(mean(shapes.map((s) => s.tsp10))), meanMax: r3(mean(shapes.map((s) => s.max))), meanConc: r3(mean(shapes.map((s) => s.conc))), pctWith2at20: r3(shapes.filter((s) => s.n20 >= 2).length / shapes.length), pctWith3at20: r3(shapes.filter((s) => s.n20 >= 3).length / shapes.length) },
    byTspBin: binned(shapes),
  };
}

console.log(JSON.stringify(out, null, 1));
