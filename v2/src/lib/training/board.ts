import { minutesAtPositions } from './bridge';
import { getTrainingType } from './catalog';
import { project, type PlayerState, type Projection, type WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { benchmarkDelta } from './benchmarks';
import { capThreshold, potentialScore } from './salary';
import { PLAN_TEMPLATES } from './templates';
import { SKILL_KEYS, skillsFromArray } from './types';
import type { WeekMinutes } from '@/queries/minutes';

// Both paths assume the same neutral staff so the gap isolates training choice + minutes.
export const BOARD_COACH_LEVEL = 5;
export const BOARD_YOUTH_TRAINER = 5;

export interface BoardPlayerInput {
  bbPlayerId: number; name: string;
  age: number; heightCm: number; potential: number;
  state: PlayerState;            // anchored midpoint sublevels
  displayedSkills: number[];     // 10 rate skills in SKILL_KEYS order (for cap score)
  tspNow: number | null;         // BB displayed TSP (10 rate skills — never stamina/FT)
  ownerTeamId: number | null; ownerTeamName: string | null;
  inferred: { trainingId: number | null; confidence: 'high' | 'medium' | 'low'; windowEndIso: string } | null;
  recentWeeks: WeekMinutes[];    // last ≤4 observed season-weeks
  currentSeasonWeek: number;     // 1..14
}

export interface BoardRow {
  bbPlayerId: number; name: string; age: number; potential: number; heightCm: number;
  ownerTeamId: number | null; ownerTeamName: string | null;
  inferredTrainingId: number | null;
  inferredLabel: string | null;          // in-game label of the inferred training
  inferredConfidence: 'high' | 'medium' | 'low' | null;
  inferredAsOfIso: string | null;
  avgMinutes: number | null;             // avg weekly minutes at the inferred training's positions;
                                          // null = no boxscore data (projection assumes full minutes)
  tspNow: number | null;
  benchmarkDelta: number | null;         // vs NT track at current age/week
  tsp21Current: number | null;           // 10-skill display-equivalent at end of age-21 season
  tsp21Optimal: number;
  optimalTemplateKey: string;
  gap: number | null;                    // tsp21Optimal − tsp21Current
  capUsedPct: number;                    // weighted-sum score / soft-cap threshold × 100
}

/** Training weeks remaining through the end of the age-21 season (14-week seasons). */
export function weeksToEndOfAge21(age: number, currentSeasonWeek: number): number {
  return Math.max(0, (14 - currentSeasonWeek) + (21 - age) * 14);
}

/** 10-skill display-equivalent TSP after a projection (or of the start state at zero
 *  horizon). BB convention: TSP never includes stamina or free throw. */
function tsp10(state: PlayerState, proj: Projection | null): number {
  if (proj === null || proj.weeks.length === 0) {
    return SKILL_KEYS.reduce((a, k) => a + state.skills[k] + 0.5, 0);
  }
  return SKILL_KEYS.reduce((a, k) => a + proj.finalSkills[k] + 0.5, 0);
}

/** Expand template blocks to exactly `horizon` weeks, repeating the last block's training. */
function templateWeeks(blocks: Array<{ trainingId: number; weeks: number }>, horizon: number): number[] {
  const ids: number[] = [];
  for (const b of blocks) for (let i = 0; i < b.weeks && ids.length < horizon; i++) ids.push(b.trainingId);
  const lastId = blocks.length > 0 ? blocks[blocks.length - 1].trainingId : 15;
  while (ids.length < horizon) ids.push(lastId);
  return ids;
}

export function computeBoardRow(input: BoardPlayerInput): BoardRow {
  const horizon = weeksToEndOfAge21(input.age, input.currentSeasonWeek);
  const projOpts = { startWeekOfSeason: input.currentSeasonWeek };

  // Current path: the club's inferred training at the player's actual recent minutes.
  const tid = input.inferred?.trainingId ?? null;
  let tsp21Current: number | null = null;
  let avgMinutes: number | null = null;
  if (tid != null) {
    const mins = input.recentWeeks.map((w) => minutesAtPositions(w, tid));
    avgMinutes = mins.length > 0 ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null;
    const plan: WeekConfig[] = Array.from({ length: horizon }, () => ({
      trainingId: tid, coachLevel: BOARD_COACH_LEVEL, youthTrainerLevel: BOARD_YOUTH_TRAINER,
      ...(avgMinutes != null ? { minutes: avgMinutes } : {}),
    }));
    tsp21Current = tsp10(input.state, horizon > 0 ? project(input.state, plan, BBSCOUT, projOpts) : null);
  }

  // Optimal path: best archetype template at full minutes.
  let best = { tsp: -Infinity, key: '' };
  for (const t of PLAN_TEMPLATES) {
    const plan: WeekConfig[] = templateWeeks(t.blocks, horizon).map((id) => ({
      trainingId: id, coachLevel: BOARD_COACH_LEVEL, youthTrainerLevel: BOARD_YOUTH_TRAINER,
    }));
    const v = tsp10(input.state, horizon > 0 ? project(input.state, plan, BBSCOUT, projOpts) : null);
    if (v > best.tsp) best = { tsp: v, key: t.key };
  }

  const { score } = potentialScore(skillsFromArray(input.displayedSkills));
  const capUsedPct = Math.round((score / capThreshold(input.potential)) * 100);

  return {
    bbPlayerId: input.bbPlayerId, name: input.name, age: input.age,
    potential: input.potential, heightCm: input.heightCm,
    ownerTeamId: input.ownerTeamId, ownerTeamName: input.ownerTeamName,
    inferredTrainingId: tid,
    inferredLabel: tid != null ? getTrainingType(tid).label : null,
    inferredConfidence: input.inferred?.confidence ?? null,
    inferredAsOfIso: input.inferred?.windowEndIso ?? null,
    avgMinutes,
    tspNow: input.tspNow,
    benchmarkDelta: input.tspNow != null ? benchmarkDelta(input.tspNow, input.age, input.currentSeasonWeek) : null,
    tsp21Current,
    tsp21Optimal: best.tsp,
    optimalTemplateKey: best.key,
    gap: tsp21Current != null ? best.tsp - tsp21Current : null,
    capUsedPct,
  };
}
