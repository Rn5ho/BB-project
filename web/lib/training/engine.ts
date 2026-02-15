import type {
  TrainableSkillKey,
  AllSkillKey,
  SkillState,
  TrainingWeekConfig,
  PlayerParams,
  SkillGainBreakdown,
  WeeklyTrainingResult,
  TrainingPlanWeek,
  TrainingProjection,
  WeeklyProjectionEntry,
  ProjectionSummary,
} from './types';
import type { SkillSnapshot } from '@/lib/types';
import {
  AGE_MULTIPLIERS,
  TRAINER_MULTIPLIERS,
  YOUTH_TRAINER_MULTIPLIERS,
  HEIGHT_SKILL_MULTIPLIERS,
  TRAINING_POINT_MATRIX,
  ELASTIC_DRAG_COEFFICIENTS,
  POTENTIAL_SKILL_CAP,
  POTENTIAL_RESISTANCE_K,
  TRAINING_POINT_DIVISOR,
  WEEKS_PER_SEASON,
  getClosestHeight,
  getMinutesThreshold,
  SALARY_SKILL_ORDER,
  SALARY_SKILL_MULTIPLIERS,
  SALARY_POSITIONS,
  SALARY_BASE,
  SALARY_DEFLATION_FACTOR,
  SALARY_DEFLATION_MODELS,
} from './data';
import type { SalaryPosition } from './data';
import type { TrainerLevel } from './types';

// ─────────────────────────────────────────────────────────
// Trainable skill keys (the 10 affected by regular training)
// ─────────────────────────────────────────────────────────
const TRAINABLE_SKILLS: TrainableSkillKey[] = [
  'jump_shot', 'jump_range', 'outside_def', 'handling', 'driving',
  'passing', 'inside_shot', 'inside_def', 'rebounding', 'shot_blocking',
];

const ALL_SKILLS: AllSkillKey[] = [
  ...TRAINABLE_SKILLS, 'stamina', 'free_throw',
];

// ─────────────────────────────────────────────────────────
// Initialize skill state from a SkillSnapshot
// BB displays ceil-rounded integers. We assume midpoint (value - 0.5).
// ─────────────────────────────────────────────────────────
export function initializeSkillState(snapshot: SkillSnapshot): SkillState {
  function toDecimal(val: number | null): number {
    if (val === null || val === undefined) return 1.0;
    return Math.max(0.5, val - 0.5);
  }
  return {
    jump_shot: toDecimal(snapshot.jump_shot),
    jump_range: toDecimal(snapshot.jump_range),
    outside_def: toDecimal(snapshot.outside_def),
    handling: toDecimal(snapshot.handling),
    driving: toDecimal(snapshot.driving),
    passing: toDecimal(snapshot.passing),
    inside_shot: toDecimal(snapshot.inside_shot),
    inside_def: toDecimal(snapshot.inside_def),
    rebounding: toDecimal(snapshot.rebounding),
    shot_blocking: toDecimal(snapshot.shot_blocking),
    stamina: toDecimal(snapshot.stamina),
    free_throw: toDecimal(snapshot.free_throw),
  };
}

// ─────────────────────────────────────────────────────────
// Individual multiplier functions
// ─────────────────────────────────────────────────────────

export function getAgeMultiplier(age: number): number {
  if (age < 18) return 1.0;
  if (age > 36) return 0.0;
  return AGE_MULTIPLIERS[age] ?? 0.0;
}

export function getTrainerMultiplier(level: TrainerLevel): number {
  return TRAINER_MULTIPLIERS[level]?.multiplier ?? 1.0;
}

export function getYouthTrainerMultiplier(age: number, level: number): number {
  if (age > 19 || level <= 0) return 1.0;
  return YOUTH_TRAINER_MULTIPLIERS[level] ?? 1.0;
}

export function getHeightMultiplier(heightCm: number, skill: TrainableSkillKey): number {
  const closest = getClosestHeight(heightCm);
  const row = HEIGHT_SKILL_MULTIPLIERS[closest];
  if (!row) return 1.0;
  return row[skill] ?? 1.0;
}

export function getMinutesFactor(minutesPlayed: number, age: number): number {
  const threshold = getMinutesThreshold(age);
  if (minutesPlayed >= threshold) return 1.0;
  if (minutesPlayed <= 0) return 0.0;
  // Linear model (exact formula unknown, linear is a reasonable estimate)
  return minutesPlayed / threshold;
}

/**
 * Potential slowdown: sigmoid model.
 * Below cap: ~1.0 (no slowdown).
 * Above cap: rapidly decreasing toward 0.
 * Formula: 1 / (1 + e^(k * (currentSkill - cap)))
 */
export function getPotentialSlowdown(
  currentSkill: number,
  potential: number,
  resistance: 'low' | 'medium' | 'high'
): number {
  const cap = POTENTIAL_SKILL_CAP[potential] ?? 20;
  const k = POTENTIAL_RESISTANCE_K[resistance];
  return 1 / (1 + Math.exp(k * (currentSkill - cap)));
}

// ─────────────────────────────────────────────────────────
// Salary Calculation (Josef Ka's formula)
// Salary = 300 × Π(mult[i]^skill[i]), then deflated.
// Player's best position = whichever gives max salary.
// ─────────────────────────────────────────────────────────

/** Calculate raw salary for one position (before deflation) */
function calculateRawPositionSalary(skills: SkillState, position: SalaryPosition): number {
  const mults = SALARY_SKILL_MULTIPLIERS[position];
  let acc = 0;
  for (let i = 0; i < SALARY_SKILL_ORDER.length; i++) {
    const skillKey = SALARY_SKILL_ORDER[i];
    // Use displayed (ceil) skill values for salary, matching BB's behavior
    const skillVal = Math.min(20, Math.max(1, Math.ceil(skills[skillKey])));
    acc += Math.log(mults[i]) * skillVal;
  }
  return SALARY_BASE * Math.exp(acc);
}

/** Apply deflation to raw salary */
function deflateSalary(rawSalary: number): number {
  const deflated = Math.min(
    ...SALARY_DEFLATION_MODELS.map(dm =>
      rawSalary * (dm.k - dm.d * Math.log(rawSalary))
    )
  );
  return Math.round(SALARY_DEFLATION_FACTOR * deflated);
}

/** Calculate player salary: max deflated salary across all 5 positions */
export function calculatePlayerSalary(skills: SkillState): {
  salary: number;
  position: SalaryPosition;
  salaryByPosition: Record<SalaryPosition, number>;
} {
  const salaryByPosition: Record<string, number> = {};
  let maxSalary = 0;
  let bestPosition: SalaryPosition = 'PG';

  for (const pos of SALARY_POSITIONS) {
    const raw = calculateRawPositionSalary(skills, pos);
    const deflated = deflateSalary(raw);
    salaryByPosition[pos] = deflated;
    if (deflated > maxSalary) {
      maxSalary = deflated;
      bestPosition = pos;
    }
  }

  return {
    salary: maxSalary,
    position: bestPosition,
    salaryByPosition: salaryByPosition as Record<SalaryPosition, number>,
  };
}


// ─────────────────────────────────────────────────────────
// Elastic Training Bonus
// When a skill is being trained and an associated skill is lower,
// the lower skill gets a drag bonus.
// Only positive drag (higher→lower).
// ─────────────────────────────────────────────────────────
function calculateElasticBonuses(
  skills: SkillState,
  primaryGains: Record<TrainableSkillKey, number>,
  ageMult: number,
  trainerMult: number,
  youthMult: number,
  minutesMult: number
): Partial<Record<TrainableSkillKey, number>> {
  const bonuses: Partial<Record<TrainableSkillKey, number>> = {};

  for (const { trainedSkill, towedSkill, coefficient } of ELASTIC_DRAG_COEFFICIENTS) {
    // Only apply if the trained skill is actually being trained this week
    const trainedGain = primaryGains[trainedSkill];
    if (!trainedGain || trainedGain <= 0) continue;

    const diff = skills[trainedSkill] - skills[towedSkill];
    if (diff <= 0) continue; // only positive drag

    // Elastic bonus is scaled by the same multipliers as regular training
    const bonus = coefficient * diff * ageMult * trainerMult * youthMult * minutesMult;
    bonuses[towedSkill] = (bonuses[towedSkill] || 0) + bonus;
  }

  return bonuses;
}

// ─────────────────────────────────────────────────────────
// Cross-Training (~10% redistribution)
// Deterministic average model.
// Well-rounded = less reduction, one-dimensional = more.
// ─────────────────────────────────────────────────────────
function calculateCrossTraining(
  skills: SkillState,
  primaryGains: Record<TrainableSkillKey, number>,
  gymLevel: number,
  potential: number,
  potentialResistance: 'low' | 'medium' | 'high',
  potentialModel: 'off' | 'on'
): { reduction: Record<TrainableSkillKey, number>; bonus: Partial<Record<TrainableSkillKey, number>> } {
  // Calculate how one-dimensional the player is (higher std dev = more reduction)
  const skillValues = TRAINABLE_SKILLS.map(k => skills[k]);
  const avg = skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
  const variance = skillValues.reduce((sum, v) => sum + (v - avg) ** 2, 0) / skillValues.length;
  const stdDev = Math.sqrt(variance);

  // Base cross-training rate: 10% ± adjustment for skill spread
  // Well-rounded (low std dev ~1-2): ~7% reduction
  // One-dimensional (high std dev ~5+): ~13% reduction
  // Gym adds extra cross-training slots (+3% per gym level)
  const gymBonus = gymLevel * 0.03;
  const crossTrainRate = Math.min(0.25, Math.max(0.05, 0.10 + (stdDev - 3) * 0.01 + gymBonus));

  const reduction: Record<string, number> = {};
  const bonus: Partial<Record<TrainableSkillKey, number>> = {};
  let totalReduced = 0;

  // Reduce primary gains
  for (const skill of TRAINABLE_SKILLS) {
    const gain = primaryGains[skill];
    if (gain > 0) {
      const red = gain * crossTrainRate;
      reduction[skill] = red;
      totalReduced += red;
    }
  }

  // Distribute reduced amount across non-primary skills (those with 0 or low gains)
  // Weighted toward lower skills (lower skills get proportionally more)
  const nonPrimarySkills = TRAINABLE_SKILLS.filter(k => !primaryGains[k] || primaryGains[k] === 0);
  if (nonPrimarySkills.length > 0 && totalReduced > 0) {
    // Weight inversely by skill level so lower skills get more cross-training
    const weights = nonPrimarySkills.map(k => Math.max(0.1, 21 - skills[k]));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < nonPrimarySkills.length; i++) {
      const skill = nonPrimarySkills[i];
      let skillBonus = totalReduced * (weights[i] / totalWeight);
      // Apply potential slowdown to cross-training gains too
      if (potentialModel === 'on') {
        skillBonus *= getPotentialSlowdown(skills[skill], potential, potentialResistance);
      }
      bonus[skill] = skillBonus;
    }
  }

  return { reduction: reduction as Record<TrainableSkillKey, number>, bonus };
}

// ─────────────────────────────────────────────────────────
// Display rounding: BB uses ceil (displayed = ceil of internal)
// ─────────────────────────────────────────────────────────
function toDisplayed(value: number): number {
  return Math.min(20, Math.max(1, Math.ceil(value)));
}

// ─────────────────────────────────────────────────────────
// Empty skill gain breakdown
// ─────────────────────────────────────────────────────────
function emptyBreakdown(): SkillGainBreakdown {
  return { base: 0, elastic: 0, crossTraining: 0, total: 0 };
}

// ─────────────────────────────────────────────────────────
// MAIN: Calculate weekly training gains
// ─────────────────────────────────────────────────────────
export function calculateWeeklyGains(
  player: PlayerParams,
  config: TrainingWeekConfig
): WeeklyTrainingResult {
  const { age, heightCm, potential, currentSkills, potentialResistance, potentialModel } = player;
  const { trainingType, trainingPosition, trainerLevel, youthTrainerLevel, minutesPlayed } = config;

  // Look up training points for this type + position
  const positionMap = TRAINING_POINT_MATRIX[trainingType];
  const trainingPoints = positionMap?.[trainingPosition];

  // Calculate shared multipliers
  const ageMult = getAgeMultiplier(age);
  const trainerMult = getTrainerMultiplier(trainerLevel);
  const youthMult = getYouthTrainerMultiplier(age, youthTrainerLevel);
  const minutesMult = getMinutesFactor(minutesPlayed, age);

  // Step 1: Calculate base gains for each trainable skill
  const baseGains: Record<TrainableSkillKey, number> = {} as Record<TrainableSkillKey, number>;
  for (const skill of TRAINABLE_SKILLS) {
    const rawPoints = trainingPoints?.[skill] ?? 0;
    if (rawPoints === 0) {
      baseGains[skill] = 0;
      continue;
    }

    const heightMult = getHeightMultiplier(heightCm, skill);

    // Potential slowdown (per-skill sigmoid model)
    let potentialSlow = 1.0;
    if (potentialModel === 'on') {
      potentialSlow = getPotentialSlowdown(currentSkills[skill], potential, potentialResistance);
    }

    baseGains[skill] = (rawPoints / TRAINING_POINT_DIVISOR)
      * ageMult
      * heightMult
      * trainerMult
      * youthMult
      * minutesMult
      * potentialSlow;
  }

  // Step 2: Elastic training bonuses
  const elasticBonuses = calculateElasticBonuses(
    currentSkills, baseGains, ageMult, trainerMult, youthMult, minutesMult
  );

  // Step 3: Cross-training redistribution
  const crossTraining = calculateCrossTraining(
    currentSkills, baseGains, config.gymLevel, potential, potentialResistance, potentialModel
  );

  // Step 4: Combine all gains into final result
  const gains: Record<AllSkillKey, SkillGainBreakdown> = {} as Record<AllSkillKey, SkillGainBreakdown>;
  const newSkills: SkillState = { ...currentSkills };
  const newDisplayedSkills: Record<AllSkillKey, number> = {} as Record<AllSkillKey, number>;
  const levelUps: Partial<Record<AllSkillKey, boolean>> = {};

  for (const skill of ALL_SKILLS) {
    const breakdown = emptyBreakdown();

    if (TRAINABLE_SKILLS.includes(skill as TrainableSkillKey)) {
      const ts = skill as TrainableSkillKey;
      breakdown.base = baseGains[ts] - (crossTraining.reduction[ts] || 0);
      breakdown.elastic = elasticBonuses[ts] || 0;
      breakdown.crossTraining = crossTraining.bonus[ts] || 0;
    }

    breakdown.total = breakdown.base + breakdown.elastic + breakdown.crossTraining;
    gains[skill] = breakdown;

    const oldValue = currentSkills[skill];
    const newValue = Math.min(20, oldValue + breakdown.total); // Cap at 20
    newSkills[skill] = newValue;

    const oldDisplayed = toDisplayed(oldValue);
    const newDisplayed = toDisplayed(newValue);
    newDisplayedSkills[skill] = newDisplayed;

    if (newDisplayed > oldDisplayed) {
      levelUps[skill] = true;
    }
  }

  // Build salary info for display when potential model is on
  const salaryInfo = potentialModel === 'on' ? (() => {
    const { salary, position } = calculatePlayerSalary(currentSkills);
    return { salary, position };
  })() : undefined;

  return {
    gains,
    newSkills,
    newDisplayedSkills,
    levelUps,
    multipliers: {
      age: ageMult,
      trainer: trainerMult,
      youthTrainer: youthMult,
      minutes: minutesMult,
    },
    salaryInfo,
  };
}

// ─────────────────────────────────────────────────────────
// Multi-week projection
// ─────────────────────────────────────────────────────────
export function projectTrainingPath(
  player: PlayerParams,
  plan: TrainingPlanWeek[]
): TrainingProjection {
  const weeks: WeeklyProjectionEntry[] = [];
  let currentSkills = { ...player.currentSkills };
  let currentAge = player.age;
  const startAge = player.age;

  for (let i = 0; i < plan.length; i++) {
    const { config } = plan[i];

    // Age increments every WEEKS_PER_SEASON weeks
    if (i > 0 && i % WEEKS_PER_SEASON === 0) {
      currentAge++;
    }

    const playerThisWeek: PlayerParams = {
      ...player,
      age: currentAge,
      currentSkills,
    };

    const result = calculateWeeklyGains(playerThisWeek, config);

    weeks.push({
      weekNumber: i + 1,
      age: currentAge,
      config,
      result,
    });

    currentSkills = result.newSkills;
  }

  // Summary
  const totalGains: Record<AllSkillKey, number> = {} as Record<AllSkillKey, number>;
  const displayedGains: Record<AllSkillKey, number> = {} as Record<AllSkillKey, number>;
  for (const skill of ALL_SKILLS) {
    totalGains[skill] = currentSkills[skill] - player.currentSkills[skill];
    displayedGains[skill] = toDisplayed(currentSkills[skill]) - toDisplayed(player.currentSkills[skill]);
  }

  const summary: ProjectionSummary = {
    totalGains,
    displayedGains,
    weeksSimulated: plan.length,
    startAge,
    endAge: currentAge,
  };

  return { weeks, summary };
}
