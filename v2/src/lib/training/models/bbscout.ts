// BB Scout's default synthesis: CoachParrot structure + evidence-driven corrections.
// Rationale per parameter: docs/superpowers/specs/2026-07-14-training-planner-v2-design.md §1.
import type { ModelParams, Position, RateRow } from '../types';
import { CP_AGE, CP_COACH, CP_RATES, cpHeightTable } from './coach-parrot';

const RESEARCH = 'docs/research/training';

// Josef Ka 2011 potential weights (2,276 samples) — forum-research/EXTRACTED-DATA.md §1
export const JK_POTENTIAL_WEIGHTS: Record<Position, number[]> = {
  PG: [0.18, 0.26, 0.3, 0.24, 0.12, 0.52, 0.03, 0.04, 0.2, 0.03],
  SG: [0.45, 0.5, 0.42, 0.05, 0.04, 0.08, 0.03, 0.05, 0.25, 0.03],
  SF: [0.58, 0.34, 0.26, 0.05, 0.03, 0.03, 0.05, 0.25, 0.33, 0.03],
  PF: [0.32, 0.06, 0.07, 0.05, 0.03, 0.02, 0.4, 0.4, 0.4, 0.2],
  C: [0.06, 0.08, 0.01, 0.04, 0.03, 0.01, 0.46, 0.46, 0.46, 0.25],
};

function scaleRates(rates: Record<number, RateRow>, f: number): Record<number, RateRow> {
  return Object.fromEntries(
    Object.entries(rates).map(([id, row]) => [
      id,
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k, (v as number) * f])),
    ]),
  ) as Record<number, RateRow>;
}

export const BBSCOUT: ModelParams = {
  id: 'bbscout',
  rates: { value: CP_RATES, source: `${RESEARCH}/coachparrot/training_rate_matrix.csv`, confidence: 'fitted' },
  stRate: { value: 2 / 3, source: `${RESEARCH}/coachparrot/training_scalars.txt`, confidence: 'fitted' },
  ftRate: { value: 0.5, source: `${RESEARCH}/coachparrot/training_scalars.txt`, confidence: 'fitted' },
  age: { value: CP_AGE, source: `${RESEARCH}/coachparrot/age_coefficients.csv`, confidence: 'fitted' },
  // JS/DR/PA exactly 1.0 (CP's 0.99753 = fit artifact; model-comparison.md)
  height: { value: cpHeightTable(1.0), source: `${RESEARCH}/coachparrot/height_coefficients.csv`, confidence: 'fitted' },
  coach: { value: CP_COACH, source: `${RESEARCH}/coachparrot/coach_coefficients.csv`, confidence: 'fitted' },
  youthTrainer: { value: { perLevel: 0.025 }, source: `${RESEARCH}/model-comparison.md (youth trainer: estimate)`, confidence: 'estimate' },
  elastic: {
    // ADDITIVE post-multiplier structure per the 2026 worked example (ID gain =
    // rate×age×height×coach + (IS−ID)×0.02) — elastic is NOT scaled by age/height/trainer.
    // Coefficients: Dormouse per-pair table (user-notes/elastic.png; ID←IS 0.02 validated
    // by the worked example). rb←is listed as "0.20" in the source — treated as a
    // transcription artifact for 0.020. jr←od and sb←id filled from the In-Depth guide
    // chart (the two pairs Dormouse left unknown).
    value: {
      kind: 'additive-pair',
      pairs: [
        { trained: 'js', other: 'dr', coeff: 0.011 },
        { trained: 'od', other: 'ha', coeff: 0.007 },
        { trained: 'ha', other: 'od', coeff: 0.05 },
        { trained: 'dr', other: 'ha', coeff: 0.005 },
        { trained: 'pa', other: 'ha', coeff: 0.03 },
        { trained: 'is', other: 'id', coeff: 0.001 },
        { trained: 'id', other: 'is', coeff: 0.02 },
        { trained: 'rb', other: 'is', coeff: 0.02 },
        { trained: 'rb', other: 'id', coeff: 0.01 },
        { trained: 'jr', other: 'od', coeff: 0.0371 },
        { trained: 'sb', other: 'id', coeff: 0.0197 },
      ],
    },
    source: `${RESEARCH}/user-notes/dev-statements-2026.md (worked example) + user-notes/elastic.png + user-notes/in-depth-guide-extraction.md`,
    confidence: 'measured',
  },
  xtrain: { value: { kind: 'top-skill-malus', coeff: 0.925 }, source: `${RESEARCH}/coachparrot/training_scalars.txt`, confidence: 'fitted' },
  cap: {
    // Dev-blessed 3-stage ladder (2026 Discord Q&A): ~70-75% / ~40-50% / 25%.
    // Stages placed inside Josef Ka's cap range [8+2p, 10+2p] (sublevels decide
    // where in the range capping starts). Replaces the earlier single x0.15 step.
    value: {
      kind: 'staged-weighted-sum',
      weights: JK_POTENTIAL_WEIGHTS,
      stages: [
        { offset: 8, slowdown: 0.725 },
        { offset: 9, slowdown: 0.45 },
        { offset: 10, slowdown: 0.25 },
      ],
    },
    source: `${RESEARCH}/user-notes/dev-statements-2026.md §1 + forum-research/EXTRACTED-DATA.md §1`,
    confidence: 'measured',
  },
  minutes: {
    // manual: 45/48/40 with an official 1-minute buffer => effective 44/47/39.
    // Linear sub-threshold shape is an estimate (nobody has measured the curve).
    value: { kind: 'threshold-linear', bands: [{ maxAge: 19, minutes: 44 }, { maxAge: 26, minutes: 47 }, { maxAge: 99, minutes: 39 }] },
    source: `${RESEARCH}/model-comparison.md (BBmanual lines 690-698)`,
    confidence: 'official',
  },
  weeksPerSeason: { value: 14, source: `${RESEARCH}/model-comparison.md (weeks/season)`, confidence: 'measured' },
  crossTraining: {
    // Dev spec (2026): slot = 10% of the primary skill's pre-elastic amount to a random
    // skill incl. ST/FT; the gym adds 1-3 EXTRA slots. baseSlots is 0 here because the
    // CP-fitted rates were measured on real teams and already average in the base
    // slot's effects — only gym-added slots are modeled explicitly. EV validated on
    // the owner's gym-3 trainees (~2-3 off-training pops per 10 weeks ≈ 3 x 0.1 x
    // primary spread over 12 skills).
    value: { kind: 'slot-scatter', baseSlots: 0, slotShare: 0.1 },
    source: `${RESEARCH}/user-notes/dev-statements-2026.md §2 + calibration-cases/auto (gym-3 trainees)`,
    confidence: 'measured',
  },
  tcFreeThrow: {
    // In-Depth guide FT pop rates at age 18 (L3 ~6wks, L2 ~7wks, L1 ~11wks), validated:
    // Tim Zorec (TC2) 2 FT pops/11wks; Dore Lovreković (TC3) 2 FT pops/10wks.
    value: { 0: 0, 1: 1 / 11, 2: 1 / 7, 3: 1 / 6 },
    source: `${RESEARCH}/user-notes/in-depth-guide-extraction.md + calibration-cases/auto`,
    confidence: 'measured',
  },
};

function variant(
  id: ModelParams['id'],
  f: number,
  stageSlowdowns: [number, number, number],
  ytPerLevel: number,
): ModelParams {
  const v = structuredClone(BBSCOUT);
  v.id = id;
  v.rates = { ...v.rates, value: scaleRates(BBSCOUT.rates.value, f) };
  if (v.cap.value.kind === 'staged-weighted-sum') {
    v.cap.value.stages.forEach((s, i) => { s.slowdown = stageSlowdowns[i]; });
  }
  v.youthTrainer = { ...v.youthTrainer, value: { perLevel: ytPerLevel } };
  return v;
}

// ±15% rate scale = median cross-source cell disagreement (model-comparison.md).
// Stage slowdowns spread across the dev-quoted ranges (70-75% / 40-50% / 25%).
export const BBSCOUT_LOW: ModelParams = variant('bbscout-low', 0.85, [0.7, 0.4, 0.25], 0);
export const BBSCOUT_HIGH: ModelParams = variant('bbscout-high', 1.15, [0.75, 0.5, 0.25], 0.05);

// Hypothesis variant on the weekly self-trainer scorecard: HA NOT height-scaled.
// The deployed BuzzerIQ model holds HA flat (probes 38/39) and the 2026-07 calibration
// replay weakly preferred it at <=185cm (4 cells, p~0.31, tall datapoint against) —
// while CP's fit and BBMark's 2022 dev quote say HA IS height-scaled. The Friday runs
// arbitrate. Full story: docs/research/training/user-notes/community-paste-2026-07.md.
export const BBSCOUT_HA_FLAT: ModelParams = (() => {
  const v = structuredClone(BBSCOUT);
  v.id = 'bbscout-ha-flat';
  const table = cpHeightTable(1.0);
  table.bySkill.ha = table.bySkill.ha.map(() => 1);
  v.height = { ...v.height, value: table, source: `${v.height.source} (ha column flattened)`, confidence: 'estimate' };
  return v;
})();
