import { project, type PlayerState, type Projection, type ProjectOptions, type WeekConfig } from './engine';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from './models/bbscout';
import { COACH_PARROT } from './models/coach-parrot';
import { OPEN_SOURCE_LIVE } from './models/open-source-live';
import type { SublevelBound } from './sublevels';
import { SKILL_KEYS, type ModelParams, type SkillKey, type Skills } from './types';

export const ENSEMBLE_MODELS: ModelParams[] = [
  BBSCOUT, COACH_PARROT, OPEN_SOURCE_LIVE, BBSCOUT_LOW, BBSCOUT_HIGH,
];

export interface EnsembleResult {
  central: Projection;
  byModel: Record<string, Projection>;
  band: { low: Skills; high: Skills; tspLow: number; tspHigh: number; tspCentral: number };
}

export type SublevelBounds = Partial<Record<SkillKey, SublevelBound>>;

const tsp = (s: Skills) => SKILL_KEYS.reduce((a, k) => a + s[k], 0);

export function ensembleProject(
  player: PlayerState,
  plan: WeekConfig[],
  opts?: ProjectOptions & { sublevelBounds?: SublevelBounds },
): EnsembleResult {
  const byModel: Record<string, Projection> = {};
  for (const m of ENSEMBLE_MODELS) byModel[m.id] = project(player, plan, m, opts);
  // Displayed integers hide sublevels: a shown "7" is really 6.01–7.00. The engine
  // assumes the midpoint; these two runs bound the projection by the unknowable
  // starting sublevels. Observed pops (sublevelBounds) tighten individual skills.
  const boundState = (pick: 'low' | 'high', fallback: number): PlayerState => {
    const skills = { ...player.skills };
    for (const k of SKILL_KEYS) {
      const b = opts?.sublevelBounds?.[k];
      skills[k] = b ? b[pick] : Math.max(0.01, skills[k] + fallback);
    }
    return { ...player, skills };
  };
  byModel['sublevel-low'] = project(boundState('low', -0.49), plan, BBSCOUT, opts);
  byModel['sublevel-high'] = project(boundState('high', +0.49), plan, BBSCOUT, opts);
  const central = byModel['bbscout'];
  const finals = Object.values(byModel).map((p) => p.finalSkills);
  const low = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.min(...finals.map((f) => f[k]))]),
  ) as Skills;
  const high = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.max(...finals.map((f) => f[k]))]),
  ) as Skills;
  return {
    central, byModel,
    band: {
      low, high,
      tspLow: Math.min(...finals.map(tsp)),
      tspHigh: Math.max(...finals.map(tsp)),
      tspCentral: tsp(central.finalSkills),
    },
  };
}
