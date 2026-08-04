// Per-cluster plan search + forward-simulated byAge tiers (spec §7).
import { optimizePlan, type SkillTarget, type PlanCandidate } from '../../training/optimize';
import { project, displayed, type PlayerState, type Projection } from '../../training/engine';
import { planToWeeks } from '../../training/bridge';
import { horizonWeeks } from '../../training/horizon';
import { BBSCOUT } from '../../training/models/bbscout';
import { evaluateArchetype } from '../evaluate';
import type { DefaultArchetype, EvalPlayer } from '../types';
import { SKILL_KEYS, SKILL_DB_NAMES, type SkillKey } from '../../training/types';
import type { DefenseFloor } from './rules';

export interface StaffScenario {
  name: 'neutral' | 'elite';
  coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number;
}
export const STAFF_SCENARIOS: StaffScenario[] = [
  { name: 'neutral', coachLevel: 5, youthTrainerLevel: 5, gymLevel: 0, trainingCourtLevel: 0 },
  { name: 'elite', coachLevel: 7, youthTrainerLevel: 7, gymLevel: 2, trainingCourtLevel: 2 },
];

export interface DrafteeProfile {
  label: 'p25' | 'p50' | 'p75';
  skills: Record<SkillKey, number>; // displayed ints at age 18, week 1
  heightCm: number; potential: number;
}

export interface ClusterPlanResult {
  scenario: string;
  candidate: PlanCandidate | null;
  blocks: Array<{ trainingId: number; weeks: number }>;
  tiers: Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>;
  feasibleEntering21: boolean;
  fullRuleMatch: boolean;
  failingChecks: Array<{ field: string; op: string; threshold: number | string; actual: number | string | null }>;
  finishingDeltas: Partial<Record<SkillKey, number>>;
  weeklyPopRate: number;
}

const DB_TO_KEY = new Map(SKILL_KEYS.map((k) => [SKILL_DB_NAMES[k], k]));

export function targetsFor(a: DefaultArchetype, floor: DefenseFloor): SkillTarget[] {
  const targets: SkillTarget[] = [];
  for (const c of a.rules.conditions) {
    if (c.kind !== 'field' || c.op !== '>=') continue;
    const key = DB_TO_KEY.get(c.field as string);
    if (!key) continue; // attrs / stamina / free_throw drop
    const v = c.byAge[21];
    if (v === undefined) continue;
    targets.push({ skill: key, displayed: v, priority: key === floor.skill ? 'high' : 'normal' });
  }
  return targets;
}

function toState(d: DrafteeProfile): PlayerState {
  const skills = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.max(0.5, d.skills[k] - 0.5)]),
  ) as Record<SkillKey, number>;
  return { skills, age: 18, heightCm: d.heightCm, potential: d.potential, ftSkill: 0.5, staminaSkill: 4.5 };
}

/** Displayed skills at the state ENTERING each age, from a projection started at age 18 wk 1. */
function stateEntering(proj: Projection, age: 19 | 20 | 21): Record<SkillKey, number> {
  const firstIdx = proj.weeks.findIndex((w) => w.age === age);
  if (firstIdx <= 0) {
    // horizon ended before this age; use final skills
    return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(proj.finalSkills[k])])) as Record<SkillKey, number>;
  }
  const before = proj.weeks[firstIdx - 1].result.skillsAfter;
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(before[k])])) as Record<SkillKey, number>;
}

export function planForCluster(
  archetype: DefaultArchetype, floor: DefenseFloor,
  draftees: DrafteeProfile[], scenario: StaffScenario,
): ClusterPlanResult {
  const targets = targetsFor(archetype, floor);
  const p50 = draftees.find((d) => d.label === 'p50') ?? draftees[0];
  const H21 = horizonWeeks({ age: 18, week: 1 }, { age: 21, week: 1 }); // 42
  const HEND = horizonWeeks({ age: 18, week: 1 }, { age: 22, week: 1 }); // 56
  const { best } = optimizePlan(toState(p50), targets, {
    horizonWeeks: H21, startWeekOfSeason: 1,
    coachLevel: scenario.coachLevel, youthTrainerLevel: scenario.youthTrainerLevel,
    gymLevel: scenario.gymLevel, trainingCourtLevel: scenario.trainingCourtLevel,
  });
  const blocks = best ? [...best.blocks] : [];
  if (blocks.length > 0) {
    const planned = blocks.reduce((a, b) => a + b.weeks, 0);
    if (planned < HEND) blocks[blocks.length - 1] = {
      ...blocks[blocks.length - 1], weeks: blocks[blocks.length - 1].weeks + (HEND - planned),
    }; // finishing phase: extend last block through end of age 21
  }
  const weekCfgs = planToWeeks(blocks, scenario.coachLevel, scenario.youthTrainerLevel,
    { gymLevel: scenario.gymLevel, trainingCourtLevel: scenario.trainingCourtLevel });
  const projections = draftees.map((d) => project(toState(d), weekCfgs, BBSCOUT, { startWeekOfSeason: 1 }));

  const tiers = { 19: {}, 20: {}, 21: {} } as ClusterPlanResult['tiers'];
  for (const age of [19, 20, 21] as const) {
    for (const k of SKILL_KEYS) {
      const lows = projections.map((p) => stateEntering(p, age)[k]);
      let v = Math.min(...lows);
      if (age === 19) v = Math.max(1, v - 1); // extra slack where uncertainty is largest
      tiers[age][k] = v;
    }
  }
  for (const k of SKILL_KEYS) {
    if (tiers[19][k]! > tiers[20][k]! || tiers[20][k]! > tiers[21][k]!)
      throw new Error(`non-monotone tier for ${k} in ${archetype.key}`);
  }

  const proj50 = projections[draftees.indexOf(p50)] ?? projections[0];
  const entering21 = stateEntering(proj50, 21);
  const end21 = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(proj50.finalSkills[k])])) as Record<SkillKey, number>;
  const finishingDeltas = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, end21[k] - entering21[k]]).filter(([, d]) => (d as number) !== 0),
  ) as Partial<Record<SkillKey, number>>;

  const lastWeek = proj50.weeks[proj50.weeks.length - 1];
  const evalP: EvalPlayer = {
    ageNow: 21,
    skills: {
      ...Object.fromEntries(SKILL_KEYS.map((k) => [SKILL_DB_NAMES[k], end21[k]])),
      stamina: lastWeek ? displayed(lastWeek.result.staminaAfter) : null,
      free_throw: lastWeek ? displayed(lastWeek.result.ftAfter) : null,
    },
    potential: p50.potential, heightCm: p50.heightCm,
    tsp: SKILL_KEYS.reduce((a, k) => a + end21[k], 0), bestPosition: null,
  };
  const verdict = evaluateArchetype(evalP, {
    id: archetype.key, key: archetype.key, dbId: null, name: archetype.name,
    rules: archetype.rules, source: 'default',
  });

  return {
    scenario: scenario.name,
    candidate: best,
    blocks,
    tiers,
    feasibleEntering21: best?.reachable ?? false,
    fullRuleMatch: verdict.matches,
    failingChecks: verdict.checks.filter((c) => !c.pass)
      .map(({ field, op, threshold, actual }) => ({ field: String(field), op, threshold, actual })),
    finishingDeltas,
    weeklyPopRate: proj50.weeks.length ? proj50.popCount / proj50.weeks.length : 0,
  };
}
