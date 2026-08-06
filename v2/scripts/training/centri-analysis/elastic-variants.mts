// Elastic-pair dispute study on the Centri U-21 cases.
// Clones BBSCOUT, edits ONLY the disputed elastic pair(s), reruns the full replay
// (identical mechanics to trace-replay.mts, non-anchored), and reports global +
// per-skill metrics plus leverage counts (how many player-weeks each pair fires).
//
// Usage (from v2/): npx tsx scripts/training/centri-analysis/elastic-variants.mts <outDir>
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, displayed, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';

const CASES_DIR = 'D:/ClaudeProjects/BB-project/docs/research/training/calibration-cases/centri-u21';
const OUT_DIR = process.argv[2];
if (!OUT_DIR) throw new Error('usage: elastic-variants.mts <outDir>');
mkdirSync(OUT_DIR, { recursive: true });

interface Pair { trained: SkillKey; other: SkillKey; coeff: number }

function makeVariant(id: string, edit: (pairs: Pair[]) => void): ModelParams {
  const v = structuredClone(BBSCOUT);
  (v as { id: string }).id = id;
  if (v.elastic.value.kind !== 'additive-pair') throw new Error('expected additive-pair');
  edit(v.elastic.value.pairs as Pair[]);
  return v;
}
function setCoeff(pairs: Pair[], trained: SkillKey, other: SkillKey, coeff: number) {
  const p = pairs.find((q) => q.trained === trained && q.other === other);
  if (!p) throw new Error(`pair ${trained}<-${other} not found`);
  p.coeff = coeff;
}

// Control probe (NOT a dispute variant): scale the IS entry of every rate row by f,
// elastic untouched. Discriminates "is<-id gap-proportional elastic" from "flat IS
// rate underestimate" — a flat boost hits small-gap (alenokc) cases too.
function makeIsRateControl(id: string, f: number): ModelParams {
  const v = structuredClone(BBSCOUT);
  (v as { id: string }).id = id;
  const rates = v.rates.value as Record<number, Partial<Record<SkillKey, number>>>;
  for (const row of Object.values(rates)) if (row.is) row.is *= f;
  return v;
}

const VARIANTS: Array<{ id: string; model: ModelParams; affected: SkillKey[] }> = [
  { id: 'baseline', model: makeVariant('baseline', () => {}), affected: [] },
  { id: 'ctrl_is_rate_x1.15', model: makeIsRateControl('ctrl_is_rate_x1.15', 1.15), affected: ['is'] },
  { id: 'ctrl_is_rate_x1.30', model: makeIsRateControl('ctrl_is_rate_x1.30', 1.30), affected: ['is'] },
  { id: 'is_id_0.0096', model: makeVariant('is_id_0.0096', (p) => setCoeff(p, 'is', 'id', 0.0096)), affected: ['is'] },
  { id: 'rb_is_0.20', model: makeVariant('rb_is_0.20', (p) => setCoeff(p, 'rb', 'is', 0.20)), affected: ['rb'] },
  { id: 'neg_sb_slows_id', model: makeVariant('neg_sb_slows_id', (p) => p.push({ trained: 'id', other: 'sb', coeff: -0.005 })), affected: ['id'] },
  { id: 'neg_od_slows_is', model: makeVariant('neg_od_slows_is', (p) => p.push({ trained: 'is', other: 'od', coeff: -0.005 })), affected: ['is'] },
  { id: 'neg_jr_slows_js_rb', model: makeVariant('neg_jr_slows_js_rb', (p) => { p.push({ trained: 'js', other: 'jr', coeff: -0.005 }); p.push({ trained: 'rb', other: 'jr', coeff: -0.005 }); }), affected: ['js', 'rb'] },
  { id: 'neg_all', model: makeVariant('neg_all', (p) => {
      p.push({ trained: 'id', other: 'sb', coeff: -0.005 });
      p.push({ trained: 'is', other: 'od', coeff: -0.005 });
      p.push({ trained: 'js', other: 'jr', coeff: -0.005 });
      p.push({ trained: 'rb', other: 'jr', coeff: -0.005 });
    }), affected: ['js', 'rb', 'is', 'id'] },
];

// Pairs whose leverage we count (during the BASELINE replay + model-free displayed check)
const LEVERAGE_PAIRS: Array<{ name: string; trained: SkillKey; other: SkillKey }> = [
  { name: 'is<-id (dispute 1)', trained: 'is', other: 'id' },
  { name: 'rb<-is (dispute 3)', trained: 'rb', other: 'is' },
  { name: 'id<-sb neg (dispute 2)', trained: 'id', other: 'sb' },
  { name: 'is<-od neg (dispute 2)', trained: 'is', other: 'od' },
  { name: 'js<-jr neg (dispute 2)', trained: 'js', other: 'jr' },
  { name: 'rb<-jr neg (dispute 2)', trained: 'rb', other: 'jr' },
];

interface CaseFile {
  label: string;
  player: {
    startSkillsDisplayed: Record<SkillKey, number>;
    age: number; heightCm: number; potential: number;
    startStamina?: number; startFreeThrow?: number;
  };
  coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number;
  weeks: Array<{ date: string; trainingId: number; minutes: number; observedPops?: Record<string, number>; ageAfterThis?: number }>;
  endSkillsDisplayed?: Partial<Record<SkillKey, number>>;
}

const files = readdirSync(CASES_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const cases = files.map((f) => ({ file: f, c: JSON.parse(readFileSync(path.join(CASES_DIR, f), 'utf8')) as CaseFile }))
  .filter((x) => x.c.weeks);

interface SkillStats {
  hits: number; misses: number; fa: number;
  predPops: number; obsPops: number;
  matchedTol1: number; matchedTol2: number; // observed pops matched to a predicted pop within +-1 / +-2 weeks (greedy 1:1)
  endAbsErr: number; endCount: number; endExact: number;
  predDispGain: number; obsDispGain: number; // summed over cases with end data
}
function emptyStats(): SkillStats {
  return { hits: 0, misses: 0, fa: 0, predPops: 0, obsPops: 0, matchedTol1: 0, matchedTol2: 0, endAbsErr: 0, endCount: 0, endExact: 0, predDispGain: 0, obsDispGain: 0 };
}

function greedyMatch(pred: number[], obs: number[], tol: number): number {
  const used = new Set<number>();
  let matched = 0;
  for (const o of obs) {
    let best = -1, bestD = Infinity;
    pred.forEach((p, i) => {
      if (used.has(i)) return;
      const d = Math.abs(p - o);
      if (d <= tol && d < bestD) { best = i; bestD = d; }
    });
    if (best >= 0) { used.add(best); matched++; }
  }
  return matched;
}

function runVariant(model: ModelParams, collectLeverage: boolean) {
  const perSkill = Object.fromEntries(SKILL_KEYS.map((k) => [k, emptyStats()])) as Record<SkillKey, SkillStats>;
  const global = { hits: 0, misses: 0, fa: 0, endAbsErr: 0, endCount: 0, endExact: 0, weeks: 0 };
  const leverage = LEVERAGE_PAIRS.map((p) => ({
    ...p,
    weeksTrainedSkillTouched: 0,      // weeks the training row has a rate for `trained`
    fireWeeksInternal: 0,             // ...AND internal other > trained (baseline sim state)
    fireWeeksInternalMin1: 0,         // ...AND minutes > 0
    sumDiffInternal: 0, maxDiffInternal: 0,
    fireWeeksDisplayed: 0,            // model-free: observed displayed other > trained (card values before this week)
    sumDiffDisplayed: 0,
  }));
  const popDetail: Array<{ file: string; skill: SkillKey; predWeeks: number[]; obsWeeks: number[] }> = [];
  const perCaseFinals: Array<{ file: string; finals: Partial<Record<SkillKey, { pred: number; obs: number | null }>> }> = [];

  for (const { file, c } of cases) {
    const obsDisp = { ...c.player.startSkillsDisplayed };
    let state: PlayerState = {
      skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, c.player.startSkillsDisplayed[k] - 0.5))),
      age: c.player.age, heightCm: c.player.heightCm, potential: c.player.potential,
      ftSkill: (c.player.startFreeThrow ?? 1) - 0.5,
      staminaSkill: (c.player.startStamina ?? 1) - 0.5,
    };
    const predWeeksBySkill = Object.fromEntries(SKILL_KEYS.map((k) => [k, [] as number[]])) as Record<SkillKey, number[]>;
    const obsWeeksBySkill = Object.fromEntries(SKILL_KEYS.map((k) => [k, [] as number[]])) as Record<SkillKey, number[]>;

    c.weeks.forEach((wk, wi) => {
      if (collectLeverage) {
        const row = (model.rates.value as Record<number, Partial<Record<SkillKey, number>>>)[wk.trainingId] ?? {};
        for (const lv of leverage) {
          if (!row[lv.trained]) continue;
          lv.weeksTrainedSkillTouched++;
          const dI = state.skills[lv.other] - state.skills[lv.trained];
          if (dI > 0) {
            lv.fireWeeksInternal++;
            if (wk.minutes > 0) lv.fireWeeksInternalMin1++;
            lv.sumDiffInternal += dI;
            lv.maxDiffInternal = Math.max(lv.maxDiffInternal, dI);
          }
          const dD = obsDisp[lv.other] - obsDisp[lv.trained];
          if (dD > 0) { lv.fireWeeksDisplayed++; lv.sumDiffDisplayed += dD; }
        }
      }

      const r = weekStep(state, {
        trainingId: wk.trainingId, coachLevel: c.coachLevel,
        youthTrainerLevel: c.youthTrainerLevel, minutes: wk.minutes,
        gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
      }, model);

      const observed = (wk.observedPops ?? {}) as Partial<Record<SkillKey, number>>;
      for (const k of Object.keys(observed) as SkillKey[]) obsDisp[k] = observed[k]!;

      for (const k of SKILL_KEYS) {
        const predPop = !!r.pops[k];
        const obsPop = observed[k] ?? null;
        if (predPop) { perSkill[k].predPops++; predWeeksBySkill[k].push(wi); }
        if (obsPop != null) { perSkill[k].obsPops++; obsWeeksBySkill[k].push(wi); }
        if (obsPop != null) { if (predPop) { perSkill[k].hits++; global.hits++; } else { perSkill[k].misses++; global.misses++; } }
        else if (predPop) { perSkill[k].fa++; global.fa++; }
      }
      state = { ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter, age: wk.ageAfterThis ?? state.age };
      global.weeks++;
    });

    const finals: Partial<Record<SkillKey, { pred: number; obs: number | null }>> = {};
    for (const k of SKILL_KEYS) {
      perSkill[k].matchedTol1 += greedyMatch(predWeeksBySkill[k], obsWeeksBySkill[k], 1);
      perSkill[k].matchedTol2 += greedyMatch(predWeeksBySkill[k], obsWeeksBySkill[k], 2);
      const want = c.endSkillsDisplayed?.[k] ?? null;
      const got = displayed(state.skills[k]);
      finals[k] = { pred: got, obs: want };
      if (want != null) {
        perSkill[k].endAbsErr += Math.abs(got - want);
        perSkill[k].endCount++;
        if (got === want) perSkill[k].endExact++;
        perSkill[k].predDispGain += got - c.player.startSkillsDisplayed[k];
        perSkill[k].obsDispGain += want - c.player.startSkillsDisplayed[k];
        global.endAbsErr += Math.abs(got - want); global.endCount++;
        if (got === want) global.endExact++;
      }
    }
    perCaseFinals.push({ file, finals });
    for (const k of ['is', 'id', 'rb', 'js', 'sb'] as SkillKey[]) {
      popDetail.push({ file, skill: k, predWeeks: predWeeksBySkill[k], obsWeeks: obsWeeksBySkill[k] });
    }
  }

  return { global, perSkill, leverage: collectLeverage ? leverage : undefined, popDetail, perCaseFinals };
}

const results: Record<string, unknown> = {};
let leverageOut: unknown = null;
for (const v of VARIANTS) {
  const isBaseline = v.id === 'baseline';
  const r = runVariant(v.model, isBaseline);
  if (isBaseline) leverageOut = r.leverage;
  const recall = r.global.hits / (r.global.hits + r.global.misses);
  results[v.id] = {
    affected: v.affected,
    global: {
      popRecall: `${(recall * 100).toFixed(1)}% (${r.global.hits}/${r.global.hits + r.global.misses})`,
      falseAlarms: r.global.fa,
      finalExact: `${r.global.endExact}/${r.global.endCount}`,
      mae: +(r.global.endAbsErr / r.global.endCount).toFixed(4),
    },
    perSkill: r.perSkill,
    popDetail: r.popDetail.filter((d) => d.predWeeks.length || d.obsWeeks.length),
    perCaseFinals: r.perCaseFinals,
  };
  console.log(v.id, JSON.stringify((results[v.id] as { global: unknown }).global));
}

writeFileSync(path.join(OUT_DIR, 'elastic-variants-results.json'), JSON.stringify({
  generated: new Date().toISOString(),
  casesDir: CASES_DIR,
  cases: cases.length,
  note: 'Full-engine reruns of the Centri U-21 replay per elastic-pair variant. baseline must reproduce the verified bbscout numbers (32.0% 58/181, FA 99, 112/160, MAE 0.300).',
  leverage: leverageOut,
  variants: results,
}, null, 1));
console.log('leverage:', JSON.stringify(leverageOut, null, 1));
