// BB Scout's default synthesis: CoachParrot structure + evidence-driven corrections.
// Rationale per parameter: docs/superpowers/specs/2026-07-14-training-planner-v2-design.md §1.
import type { ModelParams, Position, RateRow } from '../types';
import { CP_AGE, CP_COACH, CP_ELASTIC_LINKS, CP_RATES, cpHeightTable } from './coach-parrot';

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
    // boost-only: manual line 709 + thread 291954 msg 13/21 lean this way
    value: { kind: 'exp-linked', coeff: 0.91, boostOnly: true, links: CP_ELASTIC_LINKS },
    source: `${RESEARCH}/coachparrot/model_formula.md + forum-research/EXTRACTED-DATA.md §6`,
    confidence: 'fitted',
  },
  xtrain: { value: { kind: 'top-skill-malus', coeff: 0.925 }, source: `${RESEARCH}/coachparrot/training_scalars.txt`, confidence: 'fitted' },
  cap: {
    // slowdown 0.15: at-cap pop every ~6-7 weeks (thread 98371) vs ~weekly uncapped
    value: { kind: 'weighted-sum', weights: JK_POTENTIAL_WEIGHTS, slowdown: 0.15 },
    source: `${RESEARCH}/forum-research/EXTRACTED-DATA.md §1 + salary-potential/t98371-m35.txt`,
    confidence: 'estimate',
  },
  minutes: {
    // manual: 45/48/40 with an official 1-minute buffer => effective 44/47/39.
    // Linear sub-threshold shape is an estimate (nobody has measured the curve).
    value: { kind: 'threshold-linear', bands: [{ maxAge: 19, minutes: 44 }, { maxAge: 26, minutes: 47 }, { maxAge: 99, minutes: 39 }] },
    source: `${RESEARCH}/model-comparison.md (BBmanual lines 690-698)`,
    confidence: 'official',
  },
  weeksPerSeason: { value: 14, source: `${RESEARCH}/model-comparison.md (weeks/season)`, confidence: 'measured' },
};

function variant(id: ModelParams['id'], f: number, capSlowdown: number, ytPerLevel: number): ModelParams {
  const v = structuredClone(BBSCOUT);
  v.id = id;
  v.rates = { ...v.rates, value: scaleRates(BBSCOUT.rates.value, f) };
  if (v.cap.value.kind === 'weighted-sum') v.cap.value.slowdown = capSlowdown;
  v.youthTrainer = { ...v.youthTrainer, value: { perLevel: ytPerLevel } };
  return v;
}

// ±15% rate scale = median cross-source cell disagreement (model-comparison.md).
export const BBSCOUT_LOW: ModelParams = variant('bbscout-low', 0.85, 0.1, 0);
export const BBSCOUT_HIGH: ModelParams = variant('bbscout-high', 1.15, 1 / 3, 0.05);
