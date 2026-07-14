import { getTrainingType, TRAINING_CATALOG } from './catalog';
import type { PlayerState, WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { SKILL_DB_NAMES, SKILL_KEYS, type Position, type Skills } from './types';
import type { WeekMinutes } from '@/queries/minutes'; // type-only import is fine (no IO)

const POSITION_FIELD: Record<Position, keyof WeekMinutes> = {
  PG: 'minPg', SG: 'minSg', SF: 'minSf', PF: 'minPf', C: 'minC',
};

/** displayed integer -> engine sublevel (displayed − 0.5, min 0.5). Missing/null = displayed 1. */
function toSublevel(v: number | null | undefined): number {
  const displayedVal = v == null ? 1 : v;
  return Math.max(0.5, displayedVal - 0.5);
}

/** displayed integer skills -> engine sublevel state (displayed − 0.5, min 0.5). */
export function playerStateFromSnapshot(input: {
  skills: Partial<Record<string, number | null>>; // v2 snake_case keys (jump_shot, …)
  age: number; heightCm: number; potential: number;
  stamina?: number | null; freeThrow?: number | null;
}): PlayerState {
  const skills = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, toSublevel(input.skills[SKILL_DB_NAMES[k]])]),
  ) as Skills;
  return {
    skills,
    age: input.age,
    heightCm: input.heightCm,
    potential: input.potential,
    ftSkill: toSublevel(input.freeThrow),
    staminaSkill: toSublevel(input.stamina),
  };
}

/** Sum a week's minutes over a training type's qualifying positions. */
export function minutesAtPositions(week: WeekMinutes, trainingId: number): number {
  const tt = getTrainingType(trainingId);
  return tt.positions.reduce((sum, pos) => sum + week[POSITION_FIELD[pos]], 0);
}

function minutesThresholdForAge(age: number): number {
  const spec = BBSCOUT.minutes.value;
  if (spec.kind !== 'threshold-linear') return 0;
  const band = spec.bands.find((b) => age <= b.maxAge) ?? spec.bands[spec.bands.length - 1];
  return band.minutes;
}

/** Training-type ids trainable at FULL rate given a week's minutes and the player's age. */
export function eligibleTrainings(week: WeekMinutes, age: number): number[] {
  const threshold = minutesThresholdForAge(age);
  const ids: number[] = [];
  for (const tt of TRAINING_CATALOG) {
    // Stamina/FT are whole-roster trainings — always eligible.
    if (tt.kind === 'stamina' || tt.kind === 'freethrow') {
      ids.push(tt.id);
      continue;
    }
    if (minutesAtPositions(week, tt.id) >= threshold) ids.push(tt.id);
  }
  return ids;
}

/** Expand PlanBlock[] into the engine's WeekConfig[]. */
export function planToWeeks(
  blocks: Array<{ trainingId: number; weeks: number }>,
  coachLevel: number, youthTrainerLevel: number,
): WeekConfig[] {
  const weeks: WeekConfig[] = [];
  for (const block of blocks) {
    for (let i = 0; i < block.weeks; i++) {
      weeks.push({ trainingId: block.trainingId, coachLevel, youthTrainerLevel });
    }
  }
  return weeks;
}
