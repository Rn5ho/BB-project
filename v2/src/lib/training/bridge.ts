import { getTrainingType, TRAINING_CATALOG } from './catalog';
import type { EnsembleResult, SublevelBounds } from './ensemble'; // type-only import is fine (no IO)
import type { PlayerState, WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { sublevelBound, type PopAnchor } from './sublevels';
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

/** Minutes/week (at a training's qualifying positions) needed for FULL-rate training at this age. */
export function fullTrainingMinutes(age: number): number {
  const spec = BBSCOUT.minutes.value;
  if (spec.kind !== 'threshold-linear') return 0;
  const band = spec.bands.find((b) => age <= b.maxAge) ?? spec.bands[spec.bands.length - 1];
  return band.minutes;
}

/** Training-type ids trainable at FULL rate given a week's minutes and the player's age. */
export function eligibleTrainings(week: WeekMinutes, age: number): number[] {
  const threshold = fullTrainingMinutes(age);
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
  facilities?: { gymLevel?: number; trainingCourtLevel?: number },
): WeekConfig[] {
  const weeks: WeekConfig[] = [];
  for (const block of blocks) {
    for (let i = 0; i < block.weeks; i++) {
      weeks.push({
        trainingId: block.trainingId, coachLevel, youthTrainerLevel,
        gymLevel: facilities?.gymLevel, trainingCourtLevel: facilities?.trainingCourtLevel,
      });
    }
  }
  return weeks;
}

const tsp = (s: Skills) => SKILL_KEYS.reduce((a, k) => a + s[k], 0);

/** Per-week TSP band series for a BandChart: x=0 is the pre-plan starting point,
 *  x=i+1 is after week i. central tracks the bbscout model; low/high span all 5 models. */
/** Present an internal sublevel value on the user's displayed scale.
 *  Internal state assumes displayed N = sublevel N−0.5 (midpoint), so +0.5 maps back:
 *  untrained skills keep their displayed value instead of appearing to drop by 0.5. */
export function displayEquivalent(sublevel: number): number {
  return sublevel + 0.5;
}

/** Per-week TSP band on the DISPLAYED-equivalent scale (week 0 = current displayed TSP). */
export function bandSeries(result: EnsembleResult): Array<{ x: number; central: number; low: number; high: number }> {
  const central = result.byModel['bbscout'];
  const shift = 0.5 * SKILL_KEYS.length; // displayEquivalent applied to a 10-skill TSP
  const startTsp = tsp(central.finalSkills) - tsp(central.totalGains) + shift;
  const points = [{ x: 0, central: startTsp, low: startTsp, high: startTsp }];
  const models = Object.values(result.byModel);
  for (let i = 0; i < central.weeks.length; i++) {
    const tsps = models.map((m) => tsp(m.weeks[i].result.skillsAfter) + shift);
    points.push({
      x: i + 1,
      central: tsp(central.weeks[i].result.skillsAfter) + shift,
      low: Math.min(...tsps),
      high: Math.max(...tsps),
    });
  }
  return points;
}

/** Per-skill sublevel bounds from observed pop anchors. Only entries that actually
 *  tighten the default band are returned, keyed by engine skill key. */
export function boundsFromAnchors(
  skillsDb: Partial<Record<string, number | null>>,
  anchors: PopAnchor[],
  asOf: Date,
): SublevelBounds {
  const bySkill = new Map(anchors.map((a) => [a.skill, a]));
  const bounds: SublevelBounds = {};
  for (const k of SKILL_KEYS) {
    const displayedVal = skillsDb[SKILL_DB_NAMES[k]];
    if (displayedVal == null) continue;
    const b = sublevelBound(displayedVal, bySkill.get(k) ?? null, asOf);
    if (b.high < displayedVal - 0.011) bounds[k] = b; // informative only
  }
  return bounds;
}

/** Center a player state on the anchored bounds (midpoint per bounded skill). */
export function applyAnchors(state: PlayerState, bounds: SublevelBounds): PlayerState {
  const skills = { ...state.skills };
  for (const k of SKILL_KEYS) {
    const b = bounds[k];
    if (b) skills[k] = (b.low + b.high) / 2;
  }
  return { ...state, skills };
}
