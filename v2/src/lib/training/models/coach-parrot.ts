// CoachParrot 2.1 training model, extracted 2026-07-14 from cp_2_1_excel.xls.
// Provenance + formula semantics: docs/research/training/coachparrot/model_formula.md
import {
  SKILL_KEYS,
  type HeightTable,
  type ModelParams,
  type Position,
  type RateRow,
  type SkillKey,
} from '../types';

const SRC = 'docs/research/training/coachparrot';

// training_rate_matrix.csv, ids 1..31 (levels/week; position dilution baked in).
export const CP_RATES: Record<number, RateRow> = {
  1: { js: 0.5, jr: 0.1, ha: 0.05, dr: 0.05 },
  2: { js: 0.4, jr: 0.05, is: 0.2 },
  3: { js: 0.5, jr: 0.1, ha: 0.05, dr: 0.05 },
  4: { js: 0.22, jr: 0.044, ha: 0.022, dr: 0.022 },
  5: { js: 0.2, jr: 0.4, ha: 0.05, dr: 0.05 },
  6: { js: 0.15, jr: 0.3, ha: 0.0375, dr: 0.0375 },
  7: { js: 0.15, jr: 0.3, ha: 0.0375, dr: 0.0375 },
  8: { js: 0.05, jr: 0.1, ha: 0.0125, dr: 0.0125 },
  9: { od: 0.5, ha: 0.05, dr: 0.05, id: 0.1 },
  10: { od: 0.375, ha: 0.0375, dr: 0.0375, id: 0.075 },
  11: { od: 0.2, ha: 0.02, dr: 0.02, id: 0.04 },
  12: { od: 0.1, ha: 0.5, dr: 0.4 },
  13: { od: 0.075, ha: 0.375, dr: 0.3 },
  14: { od: 0.04, ha: 0.2, dr: 0.16 },
  15: { js: 0.4, ha: 0.4, dr: 0.5 },
  16: { js: 0.2, ha: 0.4, dr: 0.5, is: 0.2 },
  17: { js: 0.088, ha: 0.176, dr: 0.22, is: 0.088 },
  18: { ha: 0.16, dr: 0.16, pa: 0.6 },
  19: { ha: 0.12, dr: 0.12, pa: 0.45 },
  20: { ha: 0.04, dr: 0.04, pa: 0.15 },
  21: { js: 0.1, is: 0.5, id: 0.05 },
  22: { js: 0.075, is: 0.375, id: 0.0375 },
  23: { js: 0.04, is: 0.2, id: 0.02 },
  24: { is: 0.05, id: 0.5, sb: 0.1 },
  25: { is: 0.0375, id: 0.375, sb: 0.075 },
  26: { is: 0.02, id: 0.2, sb: 0.04 },
  27: { is: 0.05, id: 0.05, rb: 0.5 },
  28: { is: 0.022, id: 0.022, rb: 0.22 },
  29: { id: 0.2, rb: 0.1, sb: 0.5 },
  30: { id: 0.15, rb: 0.075, sb: 0.375 },
  31: { id: 0.08, rb: 0.04, sb: 0.2 },
};

export const CP_AGE: Record<number, number> = {
  18: 1.0, 19: 0.95, 20: 0.88, 21: 0.78, 22: 0.7, 23: 0.6, 24: 0.51, 25: 0.42,
  26: 0.35, 27: 0.27, 28: 0.21, 29: 0.16, 30: 0.11, 31: 0.07, 32: 0.05, 33: 0.03,
  34: 0.02, 35: 0.01, 36: 0,
};

export const CP_COACH: Record<number, number> = {
  1: 0.88, 2: 0.91, 3: 0.94, 4: 0.97, 5: 1.0, 6: 1.03, 7: 1.06,
};

export const CP_HEIGHT_STEPS = [
  175, 178, 180, 183, 185, 188, 190, 193, 196, 198, 201, 203, 206, 208, 211, 213,
  216, 218, 221, 224, 226, 229,
];

const CP_FLAT = 0.9975273768433653; // fitted JS/DR/PA constant (height_coefficients.csv)

/** JR/OD/HA: 1.50 at 175 declining 0.05/step; IS/ID/RB/SB: 0.50 rising 0.05/step; JS/DR/PA flat. */
export function cpHeightTable(flatValue: number = CP_FLAT): HeightTable {
  const n = CP_HEIGHT_STEPS.length;
  const declining = Array.from({ length: n }, (_, i) => 1.5 - 0.05 * i);
  const rising = Array.from({ length: n }, (_, i) => 0.5 + 0.05 * i);
  const flat = Array.from({ length: n }, () => flatValue);
  const bySkill = {} as Record<SkillKey, number[]>;
  for (const k of SKILL_KEYS) {
    bySkill[k] =
      k === 'jr' || k === 'od' || k === 'ha' ? [...declining]
      : k === 'is' || k === 'id' || k === 'rb' || k === 'sb' ? [...rising]
      : [...flat];
  }
  return { stepsCm: [...CP_HEIGHT_STEPS], bySkill };
}

// Elastic linked sets (model_formula.md): trained skill <- averaged-against set.
export const CP_ELASTIC_LINKS: Partial<Record<SkillKey, SkillKey[]>> = {
  js: ['jr', 'ha', 'dr'],
  jr: ['js', 'ha', 'dr'],
  od: ['ha', 'dr', 'id'],
  ha: ['od', 'dr'],
  dr: ['js', 'ha'],
  pa: ['ha', 'dr'],
  is: ['js', 'id'],
  id: ['is', 'sb'],
  rb: ['is', 'id'],
  sb: ['id', 'rb'],
};

// potential_weights.csv (SKILL_KEYS order). Capped when max_pos Σ(w·skill) >= 8 + 2·potential.
export const CP_POTENTIAL_WEIGHTS: Record<Position, number[]> = {
  PG: [0.18, 0.28, 0.3, 0.23, 0.11, 0.5, 0.05, 0.05, 0.2, 0.03],
  SG: [0.45, 0.41, 0.4, 0.06, 0.06, 0.07, 0.06, 0.1, 0.25, 0.03],
  SF: [0.6, 0.23, 0.3, 0.05, 0.05, 0.03, 0.1, 0.2, 0.35, 0.03],
  PF: [0.34, 0.06, 0.05, 0.05, 0.05, 0.03, 0.4, 0.4, 0.4, 0.16],
  C: [0.08, 0.15, 0, 0.03, 0.03, 0.03, 0.46, 0.42, 0.45, 0.23],
};

export const COACH_PARROT: ModelParams = {
  id: 'coach-parrot',
  rates: { value: CP_RATES, source: `${SRC}/training_rate_matrix.csv`, confidence: 'fitted' },
  stRate: { value: 2 / 3, source: `${SRC}/training_scalars.txt`, confidence: 'fitted' },
  ftRate: { value: 0.5, source: `${SRC}/training_scalars.txt`, confidence: 'fitted' },
  age: { value: CP_AGE, source: `${SRC}/age_coefficients.csv`, confidence: 'fitted' },
  height: { value: cpHeightTable(), source: `${SRC}/height_coefficients.csv`, confidence: 'fitted' },
  coach: { value: CP_COACH, source: `${SRC}/coach_coefficients.csv`, confidence: 'fitted' },
  youthTrainer: { value: { perLevel: 0 }, source: `${SRC}/model_formula.md (not modeled by CP)`, confidence: 'fitted' },
  elastic: {
    value: { kind: 'exp-linked', coeff: 0.91, boostOnly: false, links: CP_ELASTIC_LINKS },
    source: `${SRC}/model_formula.md`,
    confidence: 'fitted',
  },
  xtrain: { value: { kind: 'top-skill-malus', coeff: 0.925 }, source: `${SRC}/training_scalars.txt`, confidence: 'fitted' },
  cap: {
    value: { kind: 'weighted-sum', weights: CP_POTENTIAL_WEIGHTS, slowdown: 1 / 3 },
    source: `${SRC}/potential_weights.csv`,
    confidence: 'fitted',
  },
  minutes: { value: { kind: 'none' }, source: `${SRC}/model_formula.md (CP assumes full minutes)`, confidence: 'fitted' },
  weeksPerSeason: { value: 14, source: 'docs/research/training/model-comparison.md (weeks/season)', confidence: 'measured' },
  crossTraining: { value: { kind: 'none' }, source: `${SRC}/model_formula.md (fitted rates already average base cross-training; gym/TC not modeled by CP)`, confidence: 'fitted' },
  tcFreeThrow: { value: {}, source: `${SRC}/model_formula.md (TC not modeled by CP)`, confidence: 'fitted' },
};
