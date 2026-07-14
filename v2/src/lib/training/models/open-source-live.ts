// The buzzeriq.com "open_source" model AS DEPLOYED (probes win over the GitHub file).
// Base tables: docs/research/training/buzzeriq/sergiu-logic.js (MIT)
// Live corrections: docs/research/training/buzzeriq/API-MAP.md + probes/
import { type HeightTable, type ModelParams, type RateRow, type SkillKey } from '../types';
import { CP_HEIGHT_STEPS } from './coach-parrot';

const SRC = 'docs/research/training/buzzeriq';

// trainingEffects (31 named rows), mapped name -> catalog id per the plan's exact mapping.
// Probe-corrected rows (confidence: measured) are called out inline; all others are
// transcribed verbatim from sergiu-logic.js `trainingEffects`.
export const OSL_RATES: Record<number, RateRow> = {
  // probe-corrected (measured; observed at h=200/201 after backing out live height mults
  // DR x0.95, IS x1.05, JS x1.04 — probes 01/05):
  1: { js: 0.5, jr: 0.2, dr: 0.05, ha: 0.05 }, // "JS (PG/SG)" — probe JS-for-12: JS 0.52 = 0.5x1.04
  12: { od: 0.1, ha: 0.5, dr: 0.4 }, // "HA (PG)" — probe HA-for-1: ha/dr primary swapped vs file
  21: { js: 0.125, is: 0.5, id: 0.1 }, // "IS (C)" — probe IS-for-5: IS 0.525=0.5x1.05, JS 0.13~=0.125x1.04
  24: { is: 0.1, id: 0.5, sb: 0.1 }, // "ID (C)" — probe ID-for-5: IS 0.105 = 0.1x1.05
  // remaining rows verbatim from sergiu-logic.js trainingEffects:
  2: { js: 0.4, jr: 0.15, is: 0.25 }, // "JS (SF/PF)"
  3: { js: 0.5, jr: 0.1, dr: 0.05, ha: 0.05 }, // "JS (SG/SF)"
  4: { js: 0.22, jr: 0.04, dr: 0.02, ha: 0.02 }, // "JS (team)"
  5: { js: 0.2, jr: 0.4, dr: 0.05, ha: 0.05 }, // "JR (SG)"
  6: { js: 0.15, jr: 0.3, dr: 0.0375, ha: 0.0375 }, // "JR (PG)"
  7: { js: 0.15, jr: 0.3, dr: 0.0375, ha: 0.0375 }, // "JR (SG/SF)"
  8: { js: 0.05, jr: 0.1, dr: 0.0125, ha: 0.0125 }, // "JR (team)"
  9: { od: 0.5, dr: 0.05, ha: 0.05, id: 0.1 }, // "OD (PG)"
  10: { od: 0.375, dr: 0.0375, ha: 0.0375, id: 0.075 }, // "OD (PG/SG)"
  11: { od: 0.2, dr: 0.02, ha: 0.02, id: 0.04 }, // "OD(PG/SG/SF)"
  13: { od: 0.075, dr: 0.375, ha: 0.03 }, // "HA (PG/SG)"
  14: { od: 0.04, dr: 0.2, ha: 0.16 }, // "HA (PG/SG/SF)"
  15: { js: 0.4, dr: 0.5, ha: 0.4 }, // "1v1 (PG/SG)"
  16: { js: 0.2, dr: 0.5, ha: 0.4, is: 0.2 }, // "1v1 (SF/PF)"
  17: { js: 0.088, dr: 0.176, ha: 0.22, is: 0.088 }, // "1v1 (team)"
  18: { dr: 0.16, ha: 0.16, pa: 0.6 }, // "PA (PG)"
  19: { dr: 0.12, ha: 0.12, pa: 0.45 }, // "PA (PG/SG)"
  20: { dr: 0.04, ha: 0.04, pa: 0.15 }, // "PA (team)"
  22: { js: 0.075, is: 0.375, id: 0.0375 }, // "IS (PF/C)"
  23: { js: 0.04, is: 0.2, id: 0.02 }, // "IS (SF/PF/C)"
  25: { is: 0.0375, id: 0.375, sb: 0.075 }, // "ID (PF/C)"
  26: { is: 0.02, id: 0.2, sb: 0.04 }, // "ID (SF/PF/C)"
  27: { is: 0.05, id: 0.05, rb: 0.5 }, // "RB (PF/C)"
  28: { is: 0.022, id: 0.022, rb: 0.22 }, // "RB (team)"
  29: { id: 0.2, rb: 0.1, sb: 0.5 }, // "SB (C)"
  30: { id: 0.15, rb: 0.075, sb: 0.375 }, // "SB (PF/C)"
  31: { id: 0.08, rb: 0.04, sb: 0.2 }, // "SB (team)"
};

// Age coefficients: sergiu-logic.js `getAgeCoefficient` table, lines 74-78, EXCEPT
// age 21 which the live API deploys as 0.80 (community/file say 0.78) — probe 23-age21.
export const OSL_AGE: Record<number, number> = {
  18: 1.0, 19: 0.95, 20: 0.88, 21: 0.8, 22: 0.7, 23: 0.6, 24: 0.51, 25: 0.42,
  26: 0.35, 27: 0.27, 28: 0.21, 29: 0.16, 30: 0.11, 31: 0.07, 32: 0.05, 33: 0.03,
  34: 0.02, 35: 0.01,
};

export const OSL_COACH: Record<number, number> = {
  1: 0.88, 2: 0.91, 3: 0.94, 4: 0.97, 5: 1.0, 6: 1.03, 7: 1.06,
};

// heightMultipliers, transcribed verbatim from sergiu-logic.js lines 48-70, EXCEPT the
// probe-observed cell corrections noted inline below. Unprobed cells keep file values.
function oslHeightTable(): HeightTable {
  const bySkill: Record<SkillKey, number[]> = {
    // JS flat 1.0 in the file EXCEPT probe 01/05 (JS-for-12, IS-for-5) observed JS x1.04 at 201cm.
    js: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.04, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    jr: [1.5, 1.45, 1.4, 1.35, 1.3, 1.25, 1.2, 1.15, 1.1, 1.05, 1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45],
    od: [1.5, 1.45, 1.4, 1.35, 1.3, 1.25, 1.2, 1.15, 1.1, 1.05, 1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45],
    ha: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // DR flat 1.0 in the file EXCEPT probe 01/04 (HA-for-1) observed DR x0.95 at 201cm.
    dr: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.95, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // PA rising per file, with file's own 198cm quirk (1.1), EXCEPT probe 06 (PA-for-1)
    // observed PA x1.0 at 201cm (file has 1.2 there — not deployed).
    pa: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1.1, 1, 1.3, 1.4, 1.4, 1.5, 1.5, 1.5, 1.7, 2, 2, 2, 2],
    // IS rising per file EXCEPT probe 05 (IS-for-5) observed IS x1.05 at 201cm (file: 1.0)
    // and probe 24-h175-IS5 observed IS x0.65 at 175cm (file: 0.5).
    is: [0.65, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.05, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55],
    // ID rising per file EXCEPT probe 24-h175-IS5 observed ID x0.5 at 175cm (file already 0.5
    // — no change needed there, kept verbatim; noted for completeness).
    id: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55],
    rb: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55],
    sb: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55],
  };
  return { stepsCm: [...CP_HEIGHT_STEPS], bySkill };
}

// elasticEffects, sergiu-logic.js lines 39-45 (15 pairs). Sergiu's key 'A->B' means: when
// training A, if skill B > skill A then A's gain is boosted by coeff*(B-A). Encoded as
// { trained: A, other: B, coeff }.
export const OSL_ELASTIC_PAIRS: Array<{ trained: SkillKey; other: SkillKey; coeff: number }> = [
  { trained: 'js', other: 'dr', coeff: 0.0211 },
  { trained: 'jr', other: 'od', coeff: 0.0371 },
  { trained: 'od', other: 'ha', coeff: 0.0332 },
  { trained: 'pa', other: 'ha', coeff: 0.04 },
  { trained: 'dr', other: 'js', coeff: 0.0296 },
  { trained: 'dr', other: 'pa', coeff: 0.0129 },
  { trained: 'ha', other: 'od', coeff: 0.0116 },
  { trained: 'ha', other: 'pa', coeff: 0.0103 },
  { trained: 'is', other: 'js', coeff: 0.0125 },
  { trained: 'is', other: 'id', coeff: 0.0289 },
  { trained: 'is', other: 'rb', coeff: 0.0257 },
  { trained: 'id', other: 'is', coeff: 0.0153 },
  { trained: 'rb', other: 'id', coeff: 0.0371 },
  { trained: 'sb', other: 'id', coeff: 0.0197 },
  { trained: 'od', other: 'id', coeff: 0.0455 },
];

export const OPEN_SOURCE_LIVE: ModelParams = {
  id: 'open-source-live',
  rates: { value: OSL_RATES, source: `${SRC}/sergiu-logic.js (trainingEffects, probe-corrected)`, confidence: 'measured' },
  stRate: { value: 0, source: `${SRC}/API-MAP.md (live API no-op)`, confidence: 'measured' },
  ftRate: { value: 0, source: `${SRC}/API-MAP.md (live API no-op)`, confidence: 'measured' },
  age: { value: OSL_AGE, source: `${SRC}/sergiu-logic.js (getAgeCoefficient) + API-MAP.md probe 23-age21`, confidence: 'measured' },
  height: { value: oslHeightTable(), source: `${SRC}/sergiu-logic.js (heightMultipliers) + API-MAP.md probes 01/04/05/06, 24-h175-IS5`, confidence: 'estimate' },
  coach: { value: OSL_COACH, source: `${SRC}/sergiu-logic.js (implied CoachParrot-equivalent coach table) + API-MAP.md probes 12-coach{1,2,3,4,6,7} (exact match at every level)`, confidence: 'measured' },
  youthTrainer: { value: { perLevel: 0 }, source: `${SRC}/API-MAP.md (no youth trainer effect observed)`, confidence: 'measured' },
  elastic: {
    value: { kind: 'pair-linear', pairs: OSL_ELASTIC_PAIRS },
    source: `${SRC}/sergiu-logic.js (elasticEffects)`,
    confidence: 'measured',
  },
  xtrain: { value: { kind: 'none' }, source: `${SRC}/API-MAP.md (no cross-training in deployed model)`, confidence: 'measured' },
  cap: {
    value: { kind: 'high-skill', threshold: 16, slowdown: 0.8 },
    source: `${SRC}/API-MAP.md probe 19-cap-open (per-skill x0.8 at skill >= 16, potential ignored)`,
    confidence: 'measured',
  },
  minutes: { value: { kind: 'none' }, source: `${SRC}/API-MAP.md (no minutes effect observed)`, confidence: 'measured' },
  weeksPerSeason: { value: 14, source: 'docs/research/training/model-comparison.md (weeks/season)', confidence: 'measured' },
};
