import type {
  TrainingType,
  TrainingPosition,
  TrainableSkillKey,
  TrainerLevel,
} from './types';

// ─────────────────────────────────────────────────────────
// Age Multipliers (18=1.00 → 36=0.00)
// Young players train much faster
// ─────────────────────────────────────────────────────────
export const AGE_MULTIPLIERS: Record<number, number> = {
  18: 1.00,
  19: 0.95,
  20: 0.88,
  21: 0.78,
  22: 0.70,
  23: 0.60,
  24: 0.51,
  25: 0.42,
  26: 0.35,
  27: 0.27,
  28: 0.21,
  29: 0.16,
  30: 0.11,
  31: 0.07,
  32: 0.05,
  33: 0.03,
  34: 0.02,
  35: 0.01,
  36: 0.00,
};

// ─────────────────────────────────────────────────────────
// Trainer Quality Multipliers (Level 1-7)
// ─────────────────────────────────────────────────────────
export const TRAINER_MULTIPLIERS: Record<TrainerLevel, { name: string; multiplier: number }> = {
  1: { name: 'minimal', multiplier: 0.88 },
  2: { name: 'basic', multiplier: 0.91 },
  3: { name: 'competent', multiplier: 0.94 },
  4: { name: 'advanced', multiplier: 0.97 },
  5: { name: 'superior', multiplier: 1.00 },
  6: { name: 'exceptional', multiplier: 1.03 },
  7: { name: 'world-renowned', multiplier: 1.06 },
};

// ─────────────────────────────────────────────────────────
// Youth Trainer Multipliers (estimated ~2.5% per level)
// Only applies to ages 18-19
// Community estimate, not officially confirmed
// ─────────────────────────────────────────────────────────
export const YOUTH_TRAINER_MULTIPLIERS: Record<number, number> = {
  0: 1.000,
  1: 1.025,
  2: 1.050,
  3: 1.075,
  4: 1.100,
  5: 1.125,
  6: 1.150,
  7: 1.175,
};

// ─────────────────────────────────────────────────────────
// Height × Skill Multipliers
// Short players train outside skills faster, tall train inside faster
// JS, DR, PA are always 1.0 (height-independent)
// ─────────────────────────────────────────────────────────
type HeightMultiplierRow = Record<TrainableSkillKey, number>;

export const HEIGHT_SKILL_MULTIPLIERS: Record<number, HeightMultiplierRow> = {
  175: { jump_shot: 1, jump_range: 1.5,  outside_def: 1.5,  handling: 1.5,  driving: 1, passing: 1, inside_shot: 0.5,  inside_def: 0.5,  rebounding: 0.5,  shot_blocking: 0.5 },
  178: { jump_shot: 1, jump_range: 1.45, outside_def: 1.45, handling: 1.45, driving: 1, passing: 1, inside_shot: 0.55, inside_def: 0.55, rebounding: 0.55, shot_blocking: 0.55 },
  180: { jump_shot: 1, jump_range: 1.4,  outside_def: 1.4,  handling: 1.4,  driving: 1, passing: 1, inside_shot: 0.6,  inside_def: 0.6,  rebounding: 0.6,  shot_blocking: 0.6 },
  183: { jump_shot: 1, jump_range: 1.35, outside_def: 1.35, handling: 1.35, driving: 1, passing: 1, inside_shot: 0.65, inside_def: 0.65, rebounding: 0.65, shot_blocking: 0.65 },
  185: { jump_shot: 1, jump_range: 1.3,  outside_def: 1.3,  handling: 1.3,  driving: 1, passing: 1, inside_shot: 0.7,  inside_def: 0.7,  rebounding: 0.7,  shot_blocking: 0.7 },
  188: { jump_shot: 1, jump_range: 1.25, outside_def: 1.25, handling: 1.25, driving: 1, passing: 1, inside_shot: 0.75, inside_def: 0.75, rebounding: 0.75, shot_blocking: 0.75 },
  190: { jump_shot: 1, jump_range: 1.2,  outside_def: 1.2,  handling: 1.2,  driving: 1, passing: 1, inside_shot: 0.8,  inside_def: 0.8,  rebounding: 0.8,  shot_blocking: 0.8 },
  193: { jump_shot: 1, jump_range: 1.15, outside_def: 1.15, handling: 1.15, driving: 1, passing: 1, inside_shot: 0.85, inside_def: 0.85, rebounding: 0.85, shot_blocking: 0.85 },
  196: { jump_shot: 1, jump_range: 1.1,  outside_def: 1.1,  handling: 1.1,  driving: 1, passing: 1, inside_shot: 0.9,  inside_def: 0.9,  rebounding: 0.9,  shot_blocking: 0.9 },
  198: { jump_shot: 1, jump_range: 1.05, outside_def: 1.05, handling: 1.05, driving: 1, passing: 1, inside_shot: 0.95, inside_def: 0.95, rebounding: 0.95, shot_blocking: 0.95 },
  201: { jump_shot: 1, jump_range: 1,    outside_def: 1,    handling: 1,    driving: 1, passing: 1, inside_shot: 1,    inside_def: 1,    rebounding: 1,    shot_blocking: 1 },
  203: { jump_shot: 1, jump_range: 0.95, outside_def: 0.95, handling: 0.95, driving: 1, passing: 1, inside_shot: 1.05, inside_def: 1.05, rebounding: 1.05, shot_blocking: 1.05 },
  206: { jump_shot: 1, jump_range: 0.9,  outside_def: 0.9,  handling: 0.9,  driving: 1, passing: 1, inside_shot: 1.1,  inside_def: 1.1,  rebounding: 1.1,  shot_blocking: 1.1 },
  208: { jump_shot: 1, jump_range: 0.85, outside_def: 0.85, handling: 0.85, driving: 1, passing: 1, inside_shot: 1.15, inside_def: 1.15, rebounding: 1.15, shot_blocking: 1.15 },
  211: { jump_shot: 1, jump_range: 0.8,  outside_def: 0.8,  handling: 0.8,  driving: 1, passing: 1, inside_shot: 1.2,  inside_def: 1.2,  rebounding: 1.2,  shot_blocking: 1.2 },
  213: { jump_shot: 1, jump_range: 0.75, outside_def: 0.75, handling: 0.75, driving: 1, passing: 1, inside_shot: 1.25, inside_def: 1.25, rebounding: 1.25, shot_blocking: 1.25 },
  216: { jump_shot: 1, jump_range: 0.7,  outside_def: 0.7,  handling: 0.7,  driving: 1, passing: 1, inside_shot: 1.3,  inside_def: 1.3,  rebounding: 1.3,  shot_blocking: 1.3 },
  218: { jump_shot: 1, jump_range: 0.65, outside_def: 0.65, handling: 0.65, driving: 1, passing: 1, inside_shot: 1.35, inside_def: 1.35, rebounding: 1.35, shot_blocking: 1.35 },
  221: { jump_shot: 1, jump_range: 0.6,  outside_def: 0.6,  handling: 0.6,  driving: 1, passing: 1, inside_shot: 1.4,  inside_def: 1.4,  rebounding: 1.4,  shot_blocking: 1.4 },
  224: { jump_shot: 1, jump_range: 0.55, outside_def: 0.55, handling: 0.55, driving: 1, passing: 1, inside_shot: 1.45, inside_def: 1.45, rebounding: 1.45, shot_blocking: 1.45 },
  226: { jump_shot: 1, jump_range: 0.5,  outside_def: 0.5,  handling: 0.5,  driving: 1, passing: 1, inside_shot: 1.5,  inside_def: 1.5,  rebounding: 1.5,  shot_blocking: 1.5 },
  229: { jump_shot: 1, jump_range: 0.45, outside_def: 0.45, handling: 0.45, driving: 1, passing: 1, inside_shot: 1.55, inside_def: 1.55, rebounding: 1.55, shot_blocking: 1.55 },
};

// All valid heights sorted
export const VALID_HEIGHTS = Object.keys(HEIGHT_SKILL_MULTIPLIERS).map(Number).sort((a, b) => a - b);

// ─────────────────────────────────────────────────────────
// Elastic Training (Drag Coefficients)
// When training a skill, associated skills get a bonus if
// the trained skill is higher than the towed skill.
// Positive drag only (community consensus).
// ─────────────────────────────────────────────────────────
export const ELASTIC_DRAG_COEFFICIENTS: Array<{
  trainedSkill: TrainableSkillKey;
  towedSkill: TrainableSkillKey;
  coefficient: number;
}> = [
  { trainedSkill: 'jump_shot', towedSkill: 'driving',     coefficient: 0.011 },
  { trainedSkill: 'outside_def', towedSkill: 'handling',   coefficient: 0.007 },
  { trainedSkill: 'handling',   towedSkill: 'outside_def', coefficient: 0.050 },
  { trainedSkill: 'driving',    towedSkill: 'handling',    coefficient: 0.005 },
  { trainedSkill: 'passing',    towedSkill: 'handling',    coefficient: 0.030 },
  { trainedSkill: 'inside_shot', towedSkill: 'inside_def', coefficient: 0.001 },
  { trainedSkill: 'inside_def', towedSkill: 'inside_shot', coefficient: 0.020 },
  { trainedSkill: 'rebounding', towedSkill: 'inside_shot', coefficient: 0.020 },
  { trainedSkill: 'rebounding', towedSkill: 'inside_def',  coefficient: 0.010 },
  // JR → JS, SB → ID, SB → RB: unknown coefficients, omitted
];

// ─────────────────────────────────────────────────────────
// Potential Soft Cap (Estimated)
// Maps potential level (0-11) to effective skill cap
// Below cap: no slowdown. Above cap: sigmoid slowdown.
// These are ESTIMATES based on community research.
// ─────────────────────────────────────────────────────────
// Potential cap represents where significant slowdown BEGINS.
// Players routinely train 2-4 levels above their potential display,
// just progressively slower. The sigmoid midpoint (50% reduction)
// should be ~3 levels above these values.
export const POTENTIAL_SKILL_CAP: Record<number, number> = {
  0:  11,  // announcer
  1:  12,  // bench warmer
  2:  13,  // role player
  3:  14,  // 6th man
  4:  15,  // starter
  5:  16,  // star
  6:  17,  // allstar
  7:  18,  // perennial allstar
  8:  19,  // superstar
  9:  20,  // MVP
  10: 21,  // hall of famer (effectively no cap within 1-20 range)
  11: 22,  // all-time great (effectively no cap)
};

// Sigmoid steepness for potential resistance.
// At the cap value, training is at 50%. The slope determines
// how quickly it falls off above that.
// Lower k = more gradual slowdown spread over more skill levels.
export const POTENTIAL_RESISTANCE_K: Record<'low' | 'medium' | 'high', number> = {
  low: 0.8,    // very gradual — slowdown spread over ~5 levels
  medium: 1.2, // moderate — noticeable slowdown ~3 levels before cap
  high: 2.0,   // aggressive — sharp wall ~2 levels before cap
};

// ─────────────────────────────────────────────────────────
// Training Minutes Thresholds
// ─────────────────────────────────────────────────────────
export function getMinutesThreshold(age: number): number {
  if (age <= 19) return 45;
  if (age <= 26) return 48;
  return 40;
}

// ─────────────────────────────────────────────────────────
// Training Point Divisor (calibration constant)
// Raw training points / DIVISOR = base skill gain per week
// Tuned so 18yo + trainer 5 gets ~0.3-0.8 primary skill gain
// ─────────────────────────────────────────────────────────
export const TRAINING_POINT_DIVISOR = 1000;

export const WEEKS_PER_SEASON = 16;

// ─────────────────────────────────────────────────────────
// Height Parsing Helpers
// ─────────────────────────────────────────────────────────

/** Parse height string like "198 cm" or "198" to number */
export function getHeightCm(heightStr: string | null): number {
  if (!heightStr) return 196; // default midpoint
  const match = heightStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 196;
}

/** Snap to the nearest valid height in the multiplier table */
export function getClosestHeight(cm: number): number {
  let closest = VALID_HEIGHTS[0];
  let minDiff = Math.abs(cm - closest);
  for (const h of VALID_HEIGHTS) {
    const diff = Math.abs(cm - h);
    if (diff < minDiff) {
      minDiff = diff;
      closest = h;
    }
  }
  return closest;
}

// ─────────────────────────────────────────────────────────
// Training Type × Position Point Matrix
// Full distribution of training points per skill
// Source: BuzzerBeater community research
// ─────────────────────────────────────────────────────────

type SkillPoints = Record<TrainableSkillKey, number>;

function pts(
  js: number, jr: number, od: number, ha: number, dr: number,
  pa: number, is_: number, id_: number, rb: number, sb: number
): SkillPoints {
  return {
    jump_shot: js, jump_range: jr, outside_def: od, handling: ha,
    driving: dr, passing: pa, inside_shot: is_, inside_def: id_,
    rebounding: rb, shot_blocking: sb,
  };
}

export const TRAINING_POINT_MATRIX: Record<TrainingType, Partial<Record<TrainingPosition, SkillPoints>>> = {
  'Pressure': {
    'PG':        pts(0, 0, 430, 60, 40, 0, 0, 80, 0, 0),
    'SG':        pts(0, 0, 387, 54, 36, 0, 0, 72, 0, 0),
    'SF':        pts(0, 0, 344, 48, 32, 0, 0, 64, 0, 0),
    'PF':        pts(0, 0, 301, 42, 28, 0, 0, 56, 0, 0),
    'C':         pts(0, 0, 258, 36, 24, 0, 0, 48, 0, 0),
    'PG/SG':     pts(0, 0, 310, 40, 0, 0, 0, 50, 0, 0),
    'SG/SF':     pts(0, 0, 279, 36, 0, 0, 0, 45, 0, 0),
    'SF/PF':     pts(0, 0, 248, 32, 0, 0, 0, 40, 0, 0),
    'PF/C':      pts(0, 0, 217, 28, 0, 0, 0, 35, 0, 0),
    'PG/SG/SF':  pts(0, 0, 120, 0, 0, 0, 0, 20, 0, 0),
    'SG/SF/PF':  pts(0, 0, 108, 0, 0, 0, 0, 18, 0, 0),
    'SF/PF/C':   pts(0, 0, 96, 0, 0, 0, 0, 16, 0, 0),
  },

  'Shot Blocking': {
    'C':         pts(30, 0, 0, 0, 0, 0, 0, 190, 80, 680),
    'PF':        pts(27, 0, 0, 0, 0, 0, 0, 171, 72, 612),
    'SF':        pts(24, 0, 0, 0, 0, 0, 0, 152, 64, 544),
    'SG':        pts(21, 0, 0, 0, 0, 0, 0, 133, 56, 476),
    'PG':        pts(18, 0, 0, 0, 0, 0, 0, 114, 48, 408),
    'C/PF':      pts(0, 0, 0, 0, 0, 0, 0, 100, 60, 420),
    'PF/SF':     pts(0, 0, 0, 0, 0, 0, 0, 90, 54, 378),
    'SF/SG':     pts(0, 0, 0, 0, 0, 0, 0, 80, 48, 336),
    'SG/PG':     pts(0, 0, 0, 0, 0, 0, 0, 70, 42, 294),
    'C/PF/SF':   pts(0, 0, 0, 0, 0, 0, 0, 0, 0, 290),
    'PF/SF/SG':  pts(0, 0, 0, 0, 0, 0, 0, 0, 0, 261),
    'SF/SG/PG':  pts(0, 0, 0, 0, 0, 0, 0, 0, 0, 232),
  },

  'Inside Defense': {
    'C':         pts(0, 0, 0, 0, 0, 0, 50, 550, 0, 140),
    'PF':        pts(0, 0, 0, 0, 0, 0, 45, 495, 0, 126),
    'SF':        pts(0, 0, 0, 0, 0, 0, 40, 440, 0, 112),
    'SG':        pts(0, 0, 0, 0, 0, 0, 35, 385, 0, 98),
    'PG':        pts(0, 0, 0, 0, 0, 0, 30, 330, 0, 84),
    'C/PF':      pts(0, 0, 0, 0, 0, 0, 50, 400, 0, 110),
    'PF/SF':     pts(0, 0, 0, 0, 0, 0, 45, 360, 0, 99),
    'SF/SG':     pts(0, 0, 0, 0, 0, 0, 40, 320, 0, 88),
    'SG/PG':     pts(0, 0, 0, 0, 0, 0, 35, 280, 0, 77),
    'C/PF/SF':   pts(0, 0, 0, 0, 0, 0, 50, 280, 0, 60),
    'PF/SF/SG':  pts(0, 0, 0, 0, 0, 0, 45, 252, 0, 54),
    'SF/SG/PG':  pts(0, 0, 0, 0, 0, 0, 40, 224, 0, 48),
  },

  'Rebounding': {
    'C/PF':      pts(0, 0, 0, 0, 0, 0, 0, 50, 560, 0),
    'PF/SF':     pts(0, 0, 0, 0, 0, 0, 0, 45, 504, 0),
    'SF/SG':     pts(0, 0, 0, 0, 0, 0, 0, 40, 448, 0),
    'SG/PG':     pts(0, 0, 0, 0, 0, 0, 0, 35, 392, 0),
    'Team':      pts(0, 0, 0, 0, 0, 0, 0, 40, 260, 0),
  },

  'Inside Scoring': {
    'C':         pts(130, 0, 0, 0, 0, 0, 560, 50, 0, 0),
    'PF':        pts(117, 0, 0, 0, 0, 0, 504, 45, 0, 0),
    'SF':        pts(104, 0, 0, 0, 0, 0, 448, 40, 0, 0),
    'SG':        pts(91, 0, 0, 0, 0, 0, 392, 35, 0, 0),
    'PG':        pts(78, 0, 0, 0, 0, 0, 336, 30, 0, 0),
    'C/PF':      pts(100, 0, 0, 0, 0, 0, 410, 0, 0, 0),
    'PF/SF':     pts(90, 0, 0, 0, 0, 0, 369, 0, 0, 0),
    'SF/SG':     pts(80, 0, 0, 0, 0, 0, 328, 0, 0, 0),
    'SG/PG':     pts(70, 0, 0, 0, 0, 0, 287, 0, 0, 0),
    'C/PF/SF':   pts(120, 0, 0, 0, 0, 0, 330, 40, 0, 0),
    'PF/SF/SG':  pts(108, 0, 0, 0, 0, 0, 297, 36, 0, 0),
    'SF/SG/PG':  pts(96, 0, 0, 0, 0, 0, 264, 32, 0, 0),
  },

  'One on One': {
    'PG/SG (Guards)':    pts(390, 0, 0, 430, 510, 0, 0, 0, 0, 0),
    'SG/SF (Wingmen)':   pts(351, 0, 0, 387, 459, 0, 0, 0, 0, 0),
    'SF/PF (Forwards)':  pts(210, 0, 0, 410, 560, 0, 180, 0, 0, 0),
    'PF/C':              pts(189, 0, 0, 369, 504, 0, 162, 0, 0, 0),
    'Team':              pts(50, 0, 0, 270, 400, 0, 0, 0, 0, 0),
  },

  'Outside Shooting': {
    'SG':        pts(150, 450, 0, 20, 60, 0, 0, 0, 0, 0),
    'PG':        pts(135, 405, 0, 18, 54, 0, 0, 0, 0, 0),
    'SF':        pts(122, 365, 0, 16, 49, 0, 0, 0, 0, 0),
    'PF':        pts(108, 324, 0, 14, 43, 0, 0, 0, 0, 0),
    'C':         pts(95, 284, 0, 13, 38, 0, 0, 0, 0, 0),
    'SG/PG':     pts(220, 310, 0, 0, 0, 0, 0, 0, 0, 0),
    'SG/SF':     pts(210, 260, 0, 0, 0, 0, 0, 0, 0, 0),
    'SF/PF':     pts(189, 234, 0, 0, 0, 0, 0, 0, 0, 0),
    'PF/C':      pts(168, 208, 0, 0, 0, 0, 0, 0, 0, 0),
    'Team':      pts(150, 290, 0, 0, 0, 0, 0, 0, 0, 0),
  },

  'Jump Shot': {
    'PG/SG (Guards)':    pts(470, 140, 0, 60, 50, 0, 0, 0, 0, 0),
    'SF/PF (Forwards)':  pts(320, 60, 0, 0, 0, 0, 200, 0, 0, 0),
    'SG/SF (Wingmen)':   pts(440, 130, 0, 50, 70, 0, 0, 0, 0, 0),
    'PF/C':              pts(396, 117, 0, 45, 63, 0, 0, 0, 0, 0),
    'Team':              pts(180, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  },

  'Ball Handling': {
    'PG':        pts(0, 0, 100, 600, 350, 0, 0, 0, 0, 0),
    'SG':        pts(0, 0, 90, 540, 315, 0, 0, 0, 0, 0),
    'SF':        pts(0, 0, 80, 480, 280, 0, 0, 0, 0, 0),
    'PF':        pts(0, 0, 70, 420, 245, 0, 0, 0, 0, 0),
    'C':         pts(0, 0, 60, 360, 210, 0, 0, 0, 0, 0),
    'PG/SG':     pts(0, 0, 70, 370, 240, 0, 0, 0, 0, 0),
    'SG/SF':     pts(0, 0, 63, 333, 216, 0, 0, 0, 0, 0),
    'SF/PF':     pts(0, 0, 56, 296, 192, 0, 0, 0, 0, 0),
    'PF/C':      pts(0, 0, 49, 259, 168, 0, 0, 0, 0, 0),
    'PG/SG/SF':  pts(0, 0, 130, 60, 140, 10, 0, 0, 0, 0),
    'SG/SF/PF':  pts(0, 0, 117, 54, 126, 9, 0, 0, 0, 0),
    'SF/PF/C':   pts(0, 0, 104, 48, 112, 8, 0, 0, 0, 0),
  },

  'Passing': {
    'PG':        pts(0, 0, 0, 180, 190, 720, 0, 0, 0, 0),
    'SG':        pts(0, 0, 0, 162, 171, 648, 0, 0, 0, 0),
    'SF':        pts(0, 0, 0, 144, 152, 576, 0, 0, 0, 0),
    'PF':        pts(0, 0, 0, 126, 133, 504, 0, 0, 0, 0),
    'C':         pts(0, 0, 0, 108, 114, 432, 0, 0, 0, 0),
    'PG/SG':     pts(0, 0, 0, 130, 90, 510, 0, 0, 0, 0),
    'SG/SF':     pts(0, 0, 0, 117, 81, 459, 0, 0, 0, 0),
    'SF/PF':     pts(0, 0, 0, 104, 72, 408, 0, 0, 0, 0),
    'PF/C':      pts(0, 0, 0, 91, 63, 357, 0, 0, 0, 0),
    'Team':      pts(0, 0, 0, 20, 10, 310, 0, 0, 0, 0),
  },
};

// ─────────────────────────────────────────────────────────
// Helper: Get available positions for a training type
// ─────────────────────────────────────────────────────────
export function getAvailablePositions(trainingType: TrainingType): TrainingPosition[] {
  const positions = TRAINING_POINT_MATRIX[trainingType];
  if (!positions) return [];
  return Object.keys(positions) as TrainingPosition[];
}

// ─────────────────────────────────────────────────────────
// All training types (for dropdown)
// ─────────────────────────────────────────────────────────
export const TRAINING_TYPES: TrainingType[] = [
  'Pressure',
  'Shot Blocking',
  'Inside Defense',
  'Rebounding',
  'Inside Scoring',
  'One on One',
  'Outside Shooting',
  'Jump Shot',
  'Ball Handling',
  'Passing',
];

// ─────────────────────────────────────────────────────────
// Salary Formula (Josef Ka's model from chromebb extension)
// Source: https://github.com/chromebb/chromebb/blob/master/src/salarycalc.js
// Salary = 300 × Π(mult[i]^skill[i]), then deflated.
// Player's "best position" = whichever position gives max salary.
// Potential acts as a salary cap — training slows as salary approaches it.
// ─────────────────────────────────────────────────────────

// Skill order: JS, JR, OD, HA, DR, PA, IS, ID, RB, SB
export const SALARY_SKILL_ORDER: TrainableSkillKey[] = [
  'jump_shot', 'jump_range', 'outside_def', 'handling', 'driving',
  'passing', 'inside_shot', 'inside_def', 'rebounding', 'shot_blocking',
];

export type SalaryPosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

// Per-skill salary multipliers by position.
// Multiplier=1.000 means "free" (skill doesn't increase salary for that position).
// Higher multiplier = more expensive (drains potential budget faster).
export const SALARY_SKILL_MULTIPLIERS: Record<SalaryPosition, number[]> = {
  PG: [1.025, 1.045, 1.080, 1.080, 1.040, 1.155, 1.000, 1.000, 1.035, 1.000],
  SG: [1.125, 1.150, 1.130, 1.000, 1.000, 1.000, 1.000, 1.000, 1.065, 1.000],
  SF: [1.180, 1.085, 1.065, 1.000, 1.000, 1.000, 1.000, 1.060, 1.090, 1.005],
  PF: [1.080, 1.000, 1.000, 1.000, 1.000, 1.000, 1.115, 1.115, 1.115, 1.060],
  C:  [1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.138, 1.135, 1.130, 1.065],
};

export const SALARY_POSITIONS: SalaryPosition[] = ['PG', 'SG', 'SF', 'PF', 'C'];
export const SALARY_BASE = 300;
export const SALARY_DEFLATION_FACTOR = 0.86;

export const SALARY_DEFLATION_MODELS = [
  { k: 0.9885151, d: 0.0180707 },
  { k: 2.3867857, d: 0.1283662 },
];

// Potential level → salary cap midpoint.
// Source: BB forum FAQ + community observations.
// Sub-levels exist (e.g., displayed 8 = internal 8.01-8.99).
// These are midpoint estimates; actual cap varies by sub-level.
export const POTENTIAL_SALARY_CAP: Record<number, number> = {
  0:  5000,    // announcer
  1:  7000,    // bench warmer
  2:  11000,   // role player
  3:  12500,   // 6th man
  4:  17500,   // starter
  5:  25000,   // star
  6:  40000,   // allstar
  7:  67500,   // perennial allstar
  8:  100000,  // superstar
  9:  150000,  // MVP
  10: 250000,  // hall of famer
  11: 400000,  // all-time great
};
