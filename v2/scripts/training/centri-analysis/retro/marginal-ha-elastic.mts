// Retro "optimizer vs reality" study — question (a): THE HA-ELASTIC PUSH.
// Owner practice (build-knowledge batch 2): DR/HA pushed to 18-19 "for the ha→od elastic".
// This script measures, with the real engine (BBSCOUT weekStep sequences, no hand math),
// the marginal value chain of ONE extra HA-push week (One on One PG/SG, id 15; alt: Ball
// Handling PG/SG, id 13) vs ONE direct OD week (Outside Defense PG/SG, id 10) for a wing
// chasing an OD-16 entering-21 gate — and sweeps the HA crossover across ages/heights.
// Also runs an ordering experiment (HA-first vs OD-first) to show which elastic direction
// (od←ha 0.007 vs ha←od 0.05) actually dominates.
//
// NEW file for the retro study; READ-ONLY (engine only, no DB, no BB).
// Usage (from v2/): npx tsx scripts/training/centri-analysis/retro/marginal-ha-elastic.mts [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, type PlayerState } from '../../../../src/lib/training/engine';
import { BBSCOUT } from '../../../../src/lib/training/models/bbscout';
import { SKILL_KEYS, skillsFromArray, type SkillKey } from '../../../../src/lib/training/types';

const outDir = process.argv[2]
  ?? 'C:/Users/Rn5ho/AppData/Local/Temp/claude/D--ClaudeProjects-BB-project-v2/3cc08ba3-8a42-4d6b-9ea5-496b684e99bf/scratchpad/retro-agents/marginal-value';
mkdirSync(outDir, { recursive: true });

const OD_ROW = 10; // Outside Defense (PG/SG): od .375, ha .0375, dr .0375, id .075
const OOO = 15;    // One on One (PG/SG):     js .4,  ha .4,   dr .5           (no od cell)
const BH = 13;     // Ball Handling (PG/SG):  od .075, ha .375, dr .3

const cfg = (trainingId: number) => ({
  trainingId, coachLevel: 5, youthTrainerLevel: 5, gymLevel: 0, trainingCourtLevel: 0,
});
const r3 = (x: number) => Math.round(x * 1000) / 1000;

// Representative wing card (displayed). HA (and DR = HA+1) swept; OD fixed at 12 per the
// owner's scenario. Potential 9 keeps the JK cap out of the marginal comparison (verified
// via cappedAny below). Internal sublevels = displayed − 0.5 (midpoint convention).
function mkState(age: number, heightCm: number, dsk: Record<SkillKey, number>): PlayerState {
  return {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, dsk[k] - 0.5))),
    age, heightCm, potential: 9, ftSkill: 5.5, staminaSkill: 5.5,
  };
}
function wingCard(ha0: number, od0 = 12): Record<SkillKey, number> {
  return { js: 13, jr: 8, od: od0, ha: ha0, dr: Math.min(ha0 + 1, 20), pa: 8, is: 8, id: 5, rb: 7, sb: 3 };
}

// Run a fixed training sequence holding AGE CONSTANT (documented simplification: the
// marginal one-week comparison is evaluated at a representative age; both alternatives
// span identical calendar so age drift cancels to first order).
function runWeeks(s: PlayerState, ids: number[]): { end: PlayerState; cappedAny: boolean } {
  let st: PlayerState = { ...s, skills: { ...s.skills } };
  let capped = false;
  for (const id of ids) {
    const r = weekStep(st, cfg(id), BBSCOUT);
    capped = capped || r.capped;
    st = { ...st, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
  }
  return { end: st, cappedAny: capped };
}

function odWeeksToTarget(s: PlayerState, targetDisplayed = 16, max = 80): number {
  let st: PlayerState = { ...s, skills: { ...s.skills } };
  for (let w = 1; w <= max; w++) {
    const r = weekStep(st, cfg(OD_ROW), BBSCOUT);
    st = { ...st, skills: r.skillsAfter };
    if (st.skills.od > targetDisplayed - 1) return w; // displayed = ceil → od > 15.0 shows 16
  }
  return max;
}

// Engine-measured elastic chain: OD sublevels over `weeks` OD weeks attributable to the
// HA raised by the push week — isolate by resetting HA to its pre-push value (od's only
// elastic pair is ha; js/dr do not enter od's gain).
function elasticChainOD(preHa: number, post: PlayerState, weeks: number): number {
  const ids = Array(weeks).fill(OD_ROW) as number[];
  const withHa = runWeeks(post, ids).end.skills.od;
  const synth: PlayerState = { ...post, skills: { ...post.skills, ha: preHa } };
  const withoutHa = runWeeks(synth, ids).end.skills.od;
  return withHa - withoutHa;
}

// Band-credit value view: gains count only below a per-skill top (internal scale;
// top = displayed band top − 0.5, midpoint convention). Unweighted — owner can reweight.
const credit = (x: number, dx: number, top: number) => Math.min(top, x + dx) - Math.min(top, x);
const TOPSETS: Record<string, Record<string, number>> = {
  // practice bands: HA/DR run 17-19 in owner practice; JS 14-17; OD target 16; ID freebie top 10
  practice: { js: 16.5, ha: 18.5, dr: 18.5, od: 15.5, id: 9.5 },
  // minimum bands: HA/DR minimum 15-16 (credit stops at displayed 16)
  minimum: { js: 16.5, ha: 15.5, dr: 15.5, od: 15.5, id: 9.5 },
};

interface Cell {
  age: number; heightCm: number; ha0: number; od0: number;
  odWeeksToGate16: number;
  odWeek: { d_od: number; d_ha: number; d_dr: number; d_id: number };
  haWeek1v1: { d_js: number; d_ha: number; d_dr: number; elasticChainOD: number; analyticChain: number };
  haWeekBH: { d_od: number; d_ha: number; d_dr: number; elasticChainOD: number };
  fixedBudget: { odDeficit_1v1First: number; haSurplus: number; drSurplus: number; jsSurplus: number };
  value: Record<string, { haWeek1v1: number; odWeek: number; haWeekBH: number }>;
  cappedAny: boolean;
}

const AGES = [19, 20, 21];
const HEIGHTS = [193, 200, 206];
const HA_SWEEP = [13, 14, 15, 16, 17, 18, 19, 20];
const cells: Cell[] = [];

for (const age of AGES) {
  for (const heightCm of HEIGHTS) {
    for (const ha0 of HA_SWEEP) {
      const card = wingCard(ha0);
      const base = mkState(age, heightCm, card);
      const N = odWeeksToTarget(base);
      const R = Math.max(1, N - 1); // remaining OD weeks after the push week

      // one direct OD week
      const odRun = runWeeks(base, [OD_ROW]);
      const od1 = odRun.end.skills;
      const odWeek = {
        d_od: r3(od1.od - base.skills.od), d_ha: r3(od1.ha - base.skills.ha),
        d_dr: r3(od1.dr - base.skills.dr), d_id: r3(od1.id - base.skills.id),
      };

      // one 1v1 push week + its elastic chain over the remaining OD weeks
      const oooRun = runWeeks(base, [OOO]);
      const p1 = oooRun.end;
      const dHa1v1 = p1.skills.ha - base.skills.ha;
      const chain1v1 = elasticChainOD(base.skills.ha, p1, R);
      const haWeek1v1 = {
        d_js: r3(p1.skills.js - base.skills.js), d_ha: r3(dHa1v1),
        d_dr: r3(p1.skills.dr - base.skills.dr),
        elasticChainOD: r3(chain1v1),
        analyticChain: r3(0.007 * dHa1v1 * R), // sanity: coeff × ΔHA × remaining weeks
      };

      // Ball Handling alternative (has a direct od cell)
      const bhRun = runWeeks(base, [BH]);
      const pb = bhRun.end;
      const chainBH = elasticChainOD(base.skills.ha, pb, R);
      const haWeekBH = {
        d_od: r3(pb.skills.od - base.skills.od), d_ha: r3(pb.skills.ha - base.skills.ha),
        d_dr: r3(pb.skills.dr - base.skills.dr), elasticChainOD: r3(chainBH),
      };

      // fixed-budget comparison: N weeks each; A = 1v1 + (N−1)×OD, B = N×OD
      const endA = runWeeks(base, [OOO, ...Array(N - 1).fill(OD_ROW)]).end.skills;
      const endB = runWeeks(base, Array(N).fill(OD_ROW) as number[]).end.skills;
      const fixedBudget = {
        odDeficit_1v1First: r3(endB.od - endA.od),
        haSurplus: r3(endA.ha - endB.ha), drSurplus: r3(endA.dr - endB.dr), jsSurplus: r3(endA.js - endB.js),
      };

      // band-credit values per topset
      const s = base.skills;
      const value: Cell['value'] = {};
      for (const [name, t] of Object.entries(TOPSETS)) {
        value[name] = {
          haWeek1v1: r3(
            credit(s.js, haWeek1v1.d_js, t.js) + credit(s.ha, haWeek1v1.d_ha, t.ha)
            + credit(s.dr, haWeek1v1.d_dr, t.dr) + credit(s.od, chain1v1, t.od),
          ),
          odWeek: r3(
            credit(s.od, odWeek.d_od, t.od) + credit(s.ha, odWeek.d_ha, t.ha)
            + credit(s.dr, odWeek.d_dr, t.dr) + credit(s.id, odWeek.d_id, t.id),
          ),
          haWeekBH: r3(
            credit(s.od, haWeekBH.d_od + chainBH, t.od) + credit(s.ha, haWeekBH.d_ha, t.ha)
            + credit(s.dr, haWeekBH.d_dr, t.dr),
          ),
        };
      }

      cells.push({
        age, heightCm, ha0, od0: 12, odWeeksToGate16: N,
        odWeek, haWeek1v1, haWeekBH, fixedBudget, value,
        cappedAny: odRun.cappedAny || oooRun.cappedAny || bhRun.cappedAny,
      });
    }
  }
}

// OD-weight breakeven per cell: the band-credit comparison above weights every sublevel
// equally. Solve for w* where V_ha(w) = V_od(w) with OD-sublevels weighted w and all other
// sublevels weighted 1: w* = (secondaries_ha − secondaries_od) / (d_od_direct − chainOD).
// If the owner values an OD sublevel below the gate at ≥ w* generic sublevels, the direct
// OD week wins at that state regardless of band tops.
for (const c of cells) {
  const t = TOPSETS.practice;
  const base = mkState(c.age, c.heightCm, wingCard(c.ha0));
  const s = base.skills;
  const secHa = credit(s.js, c.haWeek1v1.d_js, t.js) + credit(s.ha, c.haWeek1v1.d_ha, t.ha) + credit(s.dr, c.haWeek1v1.d_dr, t.dr);
  const secOd = credit(s.ha, c.odWeek.d_ha, t.ha) + credit(s.dr, c.odWeek.d_dr, t.dr) + credit(s.id, c.odWeek.d_id, t.id);
  const den = c.odWeek.d_od - c.haWeek1v1.elasticChainOD;
  (c as Cell & { odWeightBreakeven?: number }).odWeightBreakeven = den > 0 ? r3((secHa - secOd) / den) : Infinity;
}

// crossover per (age,height) per topset: smallest ha0 where haWeek1v1 value < odWeek value
const crossovers: Record<string, { age: number; heightCm: number; crossoverHa: number | null; note: string }[]> = {};
for (const name of Object.keys(TOPSETS)) {
  crossovers[name] = [];
  for (const age of AGES) {
    for (const heightCm of HEIGHTS) {
      const seq = cells.filter((c) => c.age === age && c.heightCm === heightCm);
      const cross = seq.find((c) => c.value[name].haWeek1v1 < c.value[name].odWeek);
      crossovers[name].push({
        age, heightCm, crossoverHa: cross ? cross.ha0 : null,
        note: cross ? `HA week loses to OD week from HA ${cross.ha0} (displayed)` : 'HA week never loses in swept range',
      });
    }
  }
}

// Ordering experiment: same 20-week budget (10×1v1 + 10×OD), HA-first vs OD-first.
// Direction test for the two elastic coefficients (od←ha 0.007 vs ha←od 0.05).
function orderExperiment(age: number, heightCm: number) {
  const base = mkState(age, heightCm, { js: 13, jr: 8, od: 12, ha: 12, dr: 13, pa: 8, is: 8, id: 5, rb: 7, sb: 3 });
  const haFirst = runWeeks(base, [...Array(10).fill(OOO), ...Array(10).fill(OD_ROW)] as number[]);
  const odFirst = runWeeks(base, [...Array(10).fill(OD_ROW), ...Array(10).fill(OOO)] as number[]);
  const pick = (st: PlayerState) => ({
    od: r3(st.skills.od), ha: r3(st.skills.ha), dr: r3(st.skills.dr), js: r3(st.skills.js),
    sum4: r3(st.skills.od + st.skills.ha + st.skills.dr + st.skills.js),
  });
  return {
    age, heightCm, startDisplayed: { od: 12, ha: 12, dr: 13, js: 13 },
    budget: '10 weeks 1v1(PG/SG) + 10 weeks OD(PG/SG), order swapped',
    haFirst: pick(haFirst.end), odFirst: pick(odFirst.end),
    odFirstAdvantage_sum4: r3(
      odFirst.end.skills.od + odFirst.end.skills.ha + odFirst.end.skills.dr + odFirst.end.skills.js
      - (haFirst.end.skills.od + haFirst.end.skills.ha + haFirst.end.skills.dr + haFirst.end.skills.js),
    ),
    cappedAny: haFirst.cappedAny || odFirst.cappedAny,
  };
}
const ordering = [orderExperiment(20, 200), orderExperiment(19, 196), orderExperiment(20, 206)];

// ---- attribution: the ordering result entangles TWO engine mechanisms ----
// (i) elastic pairs (ha←od 0.05 favors OD-first; od←ha 0.007 favors HA-first) and
// (ii) the top-skill malus (0.925^(max−avg) taxes training your current max skill).
// Re-run the ordering experiment under in-memory model variants (elastic off / xtrain off)
// to attribute. STUDY-ONLY variants — repo model untouched.
import type { ModelParams } from '../../../../src/lib/training/types';
function modelVariant(mut: (m: ModelParams) => void): ModelParams {
  const v = structuredClone(BBSCOUT);
  mut(v);
  return v;
}
const NO_ELASTIC = modelVariant((m) => { m.elastic = { ...m.elastic, value: { kind: 'none' } }; });
const NO_XTRAIN = modelVariant((m) => { m.xtrain = { ...m.xtrain, value: { kind: 'none' } }; });

function orderUnder(model: ModelParams, age = 20, heightCm = 200) {
  const base = mkState(age, heightCm, { js: 13, jr: 8, od: 12, ha: 12, dr: 13, pa: 8, is: 8, id: 5, rb: 7, sb: 3 });
  const run = (ids: number[]) => {
    let st: PlayerState = { ...base, skills: { ...base.skills } };
    for (const id of ids) {
      const r = weekStep(st, cfg(id), model);
      st = { ...st, skills: r.skillsAfter };
    }
    return st.skills;
  };
  const haF = run([...Array(10).fill(OOO), ...Array(10).fill(OD_ROW)] as number[]);
  const odF = run([...Array(10).fill(OD_ROW), ...Array(10).fill(OOO)] as number[]);
  const sum4 = (s: typeof haF) => s.od + s.ha + s.dr + s.js;
  return {
    model: model === BBSCOUT ? 'bbscout' : model.elastic.value.kind === 'none' ? 'elastic-off' : 'xtrain-off',
    haFirst: { od: r3(haF.od), ha: r3(haF.ha), dr: r3(haF.dr), js: r3(haF.js) },
    odFirst: { od: r3(odF.od), ha: r3(odF.ha), dr: r3(odF.dr), js: r3(odF.js) },
    odFirstAdvantage_sum4: r3(sum4(odF) - sum4(haF)),
    odFirstAdvantage_odOnly: r3(odF.od - haF.od),
  };
}
const orderingAttribution = [orderUnder(BBSCOUT), orderUnder(NO_ELASTIC), orderUnder(NO_XTRAIN)];

// Attribute the odWeeksToGate16 spread across HA0 (13wk at HA13 → 10wk at HA17+):
// candidate mechanisms are the od←ha 0.007 elastic and the top-skill malus (OD becomes
// the max skill mid-block when HA/DR are low → 0.925^(od−avg) tax on OD training).
function odWeeksUnder(model: ModelParams, ha0: number, age = 20, heightCm = 200): number {
  const base = mkState(age, heightCm, wingCard(ha0));
  let st: PlayerState = { ...base, skills: { ...base.skills } };
  for (let w = 1; w <= 80; w++) {
    const r = weekStep(st, cfg(OD_ROW), model);
    st = { ...st, skills: r.skillsAfter };
    if (st.skills.od > 15) return w;
  }
  return 80;
}
const weeksAttribution = [13, 15, 17, 19].map((ha0) => ({
  ha0,
  odWeeksToGate16: { bbscout: odWeeksUnder(BBSCOUT, ha0), elasticOff: odWeeksUnder(NO_ELASTIC, ha0), xtrainOff: odWeeksUnder(NO_XTRAIN, ha0) },
}));

// ---- single-week demo of the BIG (0.05) elastic direction: ha←od fires when OD > HA ----
// Same wing, HA 12 displayed; compare a 1v1 week's HA gain with OD 16 vs OD 12.
function haElasticDemo(age = 20, heightCm = 200) {
  const lowOd = mkState(age, heightCm, { js: 13, jr: 8, od: 12, ha: 12, dr: 13, pa: 8, is: 8, id: 5, rb: 7, sb: 3 });
  const highOd = mkState(age, heightCm, { js: 13, jr: 8, od: 16, ha: 12, dr: 13, pa: 8, is: 8, id: 5, rb: 7, sb: 3 });
  const g = (st: PlayerState) => weekStep(st, cfg(OOO), BBSCOUT).gains.ha;
  const dLow = g(lowOd), dHigh = g(highOd);
  return {
    scenario: '1v1(PG/SG) week, HA 12 displayed; OD 12 vs OD 16 (displayed)',
    haGain_odEqual: r3(dLow), haGain_od16: r3(dHigh),
    elasticBonus: r3(dHigh - dLow), predictedBonus_0p05xDiff: r3(0.05 * (highOd.skills.od - highOd.skills.ha)),
  };
}
const bigElasticDemo = haElasticDemo();

const out = {
  question: 'Marginal value: one extra HA-push week (1v1 PG/SG) vs one direct OD week (OD PG/SG), wing chasing OD 16',
  model: 'bbscout (engine weekStep; coach 5, YT 5, gym 0, TC 0, full minutes, potential 9, age held constant)',
  elasticDirections: {
    'od←ha (fires during OD weeks when HA>OD)': 0.007,
    'ha←od (fires during HA/1v1 weeks when OD>HA)': 0.05,
    note: 'boost-only additive pairs, unscaled by age/height/coach (models/bbscout.ts)',
  },
  scenario: 'wing card JS13 JR8 OD12 HA=sweep DR=HA+1 PA8 IS8 ID5 RB7 SB3 (displayed; internal −0.5)',
  topsets: TOPSETS,
  crossovers,
  ordering,
  orderingAttribution,
  weeksAttribution,
  bigElasticDemo,
  cells,
};
writeFileSync(path.join(outDir, 'ha-elastic-sweep.json'), JSON.stringify(out, null, 1));

// console digest: representative age 20 / 200 cm
console.log('=== (a) HA-elastic push — age 20, 200 cm, OD 12 → target 16 ===');
console.log('ha0 | odWks | odWeek d_od | 1v1 d_ha/d_dr/d_js | chainOD(1v1) | value practice ha/od | value minimum ha/od');
for (const c of cells.filter((c) => c.age === 20 && c.heightCm === 200)) {
  console.log(
    `${c.ha0} | ${c.odWeeksToGate16} | ${c.odWeek.d_od} | ${c.haWeek1v1.d_ha}/${c.haWeek1v1.d_dr}/${c.haWeek1v1.d_js}` +
    ` | ${c.haWeek1v1.elasticChainOD} | ${c.value.practice.haWeek1v1}/${c.value.practice.odWeek}` +
    ` | ${c.value.minimum.haWeek1v1}/${c.value.minimum.odWeek} | capped=${c.cappedAny}`,
  );
}
console.log('odWeightBreakeven (age20/200):', cells.filter((c) => c.age === 20 && c.heightCm === 200)
  .map((c) => `HA${c.ha0}: w*=${(c as Cell & { odWeightBreakeven?: number }).odWeightBreakeven}`).join('  '));
console.log('crossovers:', JSON.stringify(crossovers, null, 1));
console.log('ordering:', JSON.stringify(ordering, null, 1));
console.log('orderingAttribution:', JSON.stringify(orderingAttribution, null, 1));
console.log('weeksAttribution:', JSON.stringify(weeksAttribution, null, 1));
console.log('bigElasticDemo:', JSON.stringify(bigElasticDemo, null, 1));
console.log('written:', path.join(outDir, 'ha-elastic-sweep.json'));
