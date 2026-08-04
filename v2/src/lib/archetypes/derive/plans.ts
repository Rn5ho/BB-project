// Per-cluster plan search + forward-simulated byAge tiers (spec §7).
import { optimizePlan, type SkillTarget, type PlanCandidate } from '../../training/optimize';
import { project, displayed, type PlayerState, type Projection } from '../../training/engine';
import { planToWeeks } from '../../training/bridge';
import { horizonWeeks, absWeek, WEEKS_PER_SEASON } from '../../training/horizon';
import { BBSCOUT } from '../../training/models/bbscout';
import { evaluateArchetype } from '../evaluate';
import type { DefaultArchetype, EvalPlayer } from '../types';
import { SKILL_KEYS, SKILL_DB_NAMES, type SkillKey } from '../../training/types';
import type { DefenseFloor } from './rules';

export interface StaffScenario {
  name: string; // 'neutral' | 'elite' + any custom scenario (e.g. CLI-provided staff levels)
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

// U-21 training has two owner-specified deadlines. M1 = entering age-21 season week 1: the
// build must be PLAYABLE (squad selection). M2 = entering age-21 season week FINALIZE_WEEK
// (group stage ends, playoffs begin): the build must be FINALIZED — full targets met. After
// M2, only polish. See derive/gap.ts (age>=21 closure test) for the other consumer.
export const FINALIZE_WEEK = 7; // age-21 season week when playoffs start (group stage = weeks 1-6)

export interface ClusterPlanResult {
  scenario: string;
  candidate: PlanCandidate | null;
  blocks: Array<{ trainingId: number; weeks: number }>;
  tiers: Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>;
  /** M1 (playable, entering age-21 week 1) reachable — squad-selection targets, not full targets. */
  feasibleEntering21: boolean;
  /** M2 (finalized, entering age-21 week FINALIZE_WEEK) reachable — full targets met. */
  finalizedByPlayoffs: boolean;
  fullRuleMatch: boolean;
  failingChecks: Array<{ field: string; op: string; threshold: number | string; actual: number | string | null }>;
  finishingDeltas: Partial<Record<SkillKey, number>>;
  weeklyPopRate: number;
  /** Worst-case floor: same plan, forward-simulated from worst hidden sublevels (displayed
   *  −0.99) under degraded minutes. Present only when `opts.stress` was requested. */
  stressed?: { reachableEntering21: boolean; enteringTsp: number; stressedFinalized?: boolean };
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

/** Displayed skills mean anything in (d−1, d] (BB rounds UP); `offset` picks where in that
 *  band to start. offset 0.5 = midpoint (ceiling assumption); offset 0.99 = worst case
 *  (floor assumption, just above the pop boundary into the next-lower display). */
function toStateAt(d: DrafteeProfile, offset: number): PlayerState {
  const skills = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.max(0.5, d.skills[k] - offset)]),
  ) as Record<SkillKey, number>;
  return { skills, age: 18, heightCm: d.heightCm, potential: d.potential, ftSkill: 0.5, staminaSkill: 4.5 };
}

function toState(d: DrafteeProfile): PlayerState {
  return toStateAt(d, 0.5);
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

/** Displayed skills at the state ENTERING the plan week that is `weeksTrained + 1` (1-based) —
 *  i.e. after exactly `weeksTrained` weeks have been trained. `weeksTrained` is meant to come
 *  from `horizonWeeks(now, target)` (the same "weeks trained before entering `target`" count
 *  used for H21/HEND), so `proj.weeks[weeksTrained - 1].result.skillsAfter` IS the state
 *  entering `target`. Falls back to final skills if the projection is shorter than requested. */
function stateAtWeek(proj: Projection, weeksTrained: number): Record<SkillKey, number> {
  const w = proj.weeks[weeksTrained - 1];
  if (!w) return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(proj.finalSkills[k])])) as Record<SkillKey, number>;
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(w.result.skillsAfter[k])])) as Record<SkillKey, number>;
}

export function planForCluster(
  archetype: DefaultArchetype, floor: DefenseFloor,
  draftees: DrafteeProfile[], scenario: StaffScenario,
  opts?: { stress?: { minutes: number } },
): ClusterPlanResult {
  const targets = targetsFor(archetype, floor);
  const p50 = draftees.find((d) => d.label === 'p50') ?? draftees[0];
  const H21 = horizonWeeks({ age: 18, week: 1 }, { age: 21, week: 1 }); // 42
  const HEND = horizonWeeks({ age: 18, week: 1 }, { age: 22, week: 1 }); // 56
  // Weeks trained before entering age-21 week FINALIZE_WEEK (M2) — the same horizonWeeks
  // convention as H21/HEND; 42 + (FINALIZE_WEEK − 1) = 48 for FINALIZE_WEEK 7.
  const M2 = horizonWeeks({ age: 18, week: 1 }, { age: 21, week: FINALIZE_WEEK });
  const staff = {
    coachLevel: scenario.coachLevel, youthTrainerLevel: scenario.youthTrainerLevel,
    gymLevel: scenario.gymLevel, trainingCourtLevel: scenario.trainingCourtLevel,
  };
  const planToWeekCfgs = (bs: Array<{ trainingId: number; weeks: number }>) =>
    planToWeeks(bs, scenario.coachLevel, scenario.youthTrainerLevel,
      { gymLevel: scenario.gymLevel, trainingCourtLevel: scenario.trainingCourtLevel });

  // M1 ("playable") targets, derived from the full targets: the floor skill needs
  // displayed−2, every other target displayed−1 (same priorities) — squad-selectable at
  // week 1 of the age-21 season, not yet finished.
  const m1Targets: SkillTarget[] = targets.map((t) => ({
    ...t, displayed: Math.max(1, t.displayed - (t.skill === floor.skill ? 2 : 1)),
  }));

  const phase1 = optimizePlan(toState(p50), m1Targets, { horizonWeeks: H21, startWeekOfSeason: 1, ...staff });

  let candidate: PlanCandidate | null;
  let blocks: Array<{ trainingId: number; weeks: number }>;
  let feasibleEntering21: boolean;
  let finalizedByPlayoffs: boolean;

  if (phase1.best) {
    candidate = phase1.best;
    const phase1Blocks = [...phase1.best.blocks];
    // Phase-1 end state (entering age-21 week 1): skills come straight from the search
    // (best.finalSkills); FT/stamina aren't tracked by optimizePlan, so project() the
    // phase-1 plan once (same engine, same staff) and read the last week's ftAfter/staminaAfter.
    const phase1Proj = project(toState(p50), planToWeekCfgs(phase1Blocks), BBSCOUT, { startWeekOfSeason: 1 });
    const lastPhase1Week = phase1Proj.weeks[phase1Proj.weeks.length - 1];
    const phase1EndState: PlayerState = {
      skills: phase1.best.finalSkills,
      age: 21,
      heightCm: p50.heightCm,
      potential: p50.potential,
      ftSkill: lastPhase1Week ? lastPhase1Week.result.ftAfter : 0.5,
      staminaSkill: lastPhase1Week ? lastPhase1Week.result.staminaAfter : 4.5,
    };

    const phase2 = optimizePlan(phase1EndState, targets, {
      horizonWeeks: FINALIZE_WEEK - 1, startWeekOfSeason: 1, ...staff,
    });
    const phase2Blocks = phase2.best ? [...phase2.best.blocks] : [];

    blocks = [...phase1Blocks, ...phase2Blocks];
    feasibleEntering21 = phase1.best.reachable;
    // phase2.best === null means no active targets remained at M1 — full targets already met.
    finalizedByPlayoffs = phase2.best ? phase2.best.reachable : true;
  } else {
    // No active M1 targets (draftee already playable entering week 1) — shouldn't happen with
    // real draftees, but guard by falling back to the pre-milestone single-phase behavior.
    const fallback = optimizePlan(toState(p50), targets, { horizonWeeks: H21, startWeekOfSeason: 1, ...staff });
    candidate = fallback.best;
    blocks = fallback.best ? [...fallback.best.blocks] : [];
    feasibleEntering21 = fallback.best?.reachable ?? false;
    const fallbackProj = project(toState(p50), planToWeekCfgs(blocks), BBSCOUT, { startWeekOfSeason: 1 });
    const m2State = stateAtWeek(fallbackProj, M2);
    finalizedByPlayoffs = targets.every((t) => m2State[t.skill] >= t.displayed);
  }

  if (blocks.length > 0) {
    const planned = blocks.reduce((a, b) => a + b.weeks, 0);
    if (planned < HEND) blocks[blocks.length - 1] = {
      ...blocks[blocks.length - 1], weeks: blocks[blocks.length - 1].weeks + (HEND - planned),
    }; // finishing phase: extend last block through end of age 21
  }
  const weekCfgs = planToWeekCfgs(blocks);
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

  // Stress floor (worst-start, degraded minutes): evaluates the SAME plan under adversity —
  // no re-run of the beam search. Worst hidden sublevels (displayed −0.99) for every draftee,
  // degraded minutes on every week, judged against the WORST draftee (p25).
  let stressed: ClusterPlanResult['stressed'];
  if (opts?.stress) {
    const stressedWeekCfgs = weekCfgs.map((w) => ({ ...w, minutes: opts.stress!.minutes }));
    const stressedProjections = draftees.map((d) =>
      project(toStateAt(d, 0.99), stressedWeekCfgs, BBSCOUT, { startWeekOfSeason: 1 }));
    const p25 = draftees.find((d) => d.label === 'p25') ?? draftees[0];
    const proj25 = stressedProjections[draftees.indexOf(p25)] ?? stressedProjections[0];
    const entering21Stressed = stateEntering(proj25, 21);
    const reachableEntering21 = targets.every((t) => entering21Stressed[t.skill] >= t.displayed);
    const enteringTsp = SKILL_KEYS.reduce((a, k) => a + entering21Stressed[k], 0);
    // M2 under stress: same worst-start/degraded-minutes projection, read entering age-21
    // week FINALIZE_WEEK instead of week 1, against the FULL targets.
    const m2Stressed = stateAtWeek(proj25, M2);
    const stressedFinalized = targets.every((t) => m2Stressed[t.skill] >= t.displayed);
    stressed = { reachableEntering21, enteringTsp, stressedFinalized };
  }

  return {
    scenario: scenario.name,
    candidate,
    blocks,
    tiers,
    feasibleEntering21,
    finalizedByPlayoffs,
    fullRuleMatch: verdict.matches,
    failingChecks: verdict.checks.filter((c) => !c.pass)
      .map(({ field, op, threshold, actual }) => ({ field: String(field), op, threshold, actual })),
    finishingDeltas,
    weeklyPopRate: proj50.weeks.length ? proj50.popCount / proj50.weeks.length : 0,
    stressed,
  };
}

export interface JourneyPhase {
  label: 'to-playable' | 'to-finalized' | 'polish';
  blocks: Array<{ trainingId: number; weeks: number }>;
}

export interface JourneyResult {
  phases: JourneyPhase[];
  /** M1 (playable, entering age-21 week 1) targets met — trivially true once `now.age >= 21`:
   *  the milestone is already behind `now`, so there's nothing left to plan toward it. */
  playable: boolean;
  /** M2 (finalized, entering age-21 week FINALIZE_WEEK) — full targets met. */
  finalized: boolean;
  /** Displayed skills at each milestone; null when that milestone is strictly before `now`. */
  checkpoints: {
    m1: Record<SkillKey, number> | null;
    m2: Record<SkillKey, number> | null;
    end: Record<SkillKey, number>;
  };
  weeklyPopRate: number;
}

/**
 * Per-player U-21 journey: a STAGED milestone search from the player's CURRENT (age, season
 * week) to end of U-21, composing up to three phases —
 *   1. to-playable:  now -> entering age-21 week 1 (M1), against the relaxed M1 targets
 *      (floor skill displayed−2, others displayed−1, min 1 — see `targetsFor`/planForCluster).
 *   2. to-finalized: -> entering age-21 week FINALIZE_WEEK (M2), against the full targets.
 *   3. polish:       -> entering age-22 week 1, extending whatever was last trained (or, if
 *      nothing was trained yet — both earlier milestones already behind `now` — a fresh search
 *      against the full targets).
 * A phase is entirely omitted once its horizon has already elapsed (a 21yo past FINALIZE_WEEK
 * gets only the polish phase). Within an INCLUDED phase, if none of that phase's own targets
 * are still active (already met at the phase's start), the phase is reported with empty blocks
 * and a trivially-true verdict; the state/season-week simply carry over unchanged into the next
 * phase rather than analytically fast-forwarding through untrained weeks. Real tracked players
 * are never already past a relaxed M1 target 40+ weeks out, so this is a documented
 * simplification of a path that shouldn't be load-bearing, not a modeled feature.
 */
export function planJourney(
  start: PlayerState,
  now: { age: number; week: number },
  targets: SkillTarget[],
  floorSkill: SkillKey | null,
  staff: StaffScenario,
): JourneyResult {
  const staffCfg = {
    coachLevel: staff.coachLevel, youthTrainerLevel: staff.youthTrainerLevel,
    gymLevel: staff.gymLevel, trainingCourtLevel: staff.trainingCourtLevel,
  };
  const planToWeekCfgs = (bs: Array<{ trainingId: number; weeks: number }>) =>
    planToWeeks(bs, staff.coachLevel, staff.youthTrainerLevel,
      { gymLevel: staff.gymLevel, trainingCourtLevel: staff.trainingCourtLevel });
  const replayEnd = (
    from: PlayerState, blocks: Array<{ trainingId: number; weeks: number }>, weekOfSeason: number,
  ): PlayerState => {
    const proj = project(from, planToWeekCfgs(blocks), BBSCOUT, { startWeekOfSeason: weekOfSeason });
    const last = proj.weeks[proj.weeks.length - 1];
    return {
      skills: proj.finalSkills, age: proj.finalAge, heightCm: from.heightCm, potential: from.potential,
      ftSkill: last ? last.result.ftAfter : from.ftSkill,
      staminaSkill: last ? last.result.staminaAfter : from.staminaSkill,
    };
  };

  const P1 = { age: 21, week: 1 };
  const P2 = { age: 21, week: FINALIZE_WEEK };
  const P3 = { age: 22, week: 1 };
  const h1 = horizonWeeks(now, P1);
  const h2 = Math.max(0, horizonWeeks(now, P2) - h1);
  const h3 = Math.max(0, horizonWeeks(now, P3) - horizonWeeks(now, P2));

  // M1 ("playable") targets — same relaxation as planForCluster's m1Targets.
  const m1Targets: SkillTarget[] = targets.map((t) => ({
    ...t, displayed: Math.max(1, t.displayed - (t.skill === floorSkill ? 2 : 1)),
  }));

  const phases: JourneyPhase[] = [];
  let playable = true;
  let cursorState = start;
  let cursorWeek = now.week;

  if (now.age < 21) {
    const r1 = optimizePlan(start, m1Targets, { horizonWeeks: h1, startWeekOfSeason: now.week, ...staffCfg });
    const blocks1 = r1.best ? [...r1.best.blocks] : [];
    phases.push({ label: 'to-playable', blocks: blocks1 });
    playable = r1.best ? r1.best.reachable : true; // no active M1 targets = already playable
    if (blocks1.length > 0) {
      const newWeek = ((now.week - 1 + h1) % WEEKS_PER_SEASON) + 1;
      cursorState = replayEnd(start, blocks1, now.week);
      cursorWeek = newWeek;
    }
  }

  if (h2 > 0) {
    const r2 = optimizePlan(cursorState, targets, { horizonWeeks: h2, startWeekOfSeason: cursorWeek, ...staffCfg });
    const blocks2 = r2.best ? [...r2.best.blocks] : [];
    phases.push({ label: 'to-finalized', blocks: blocks2 });
    if (blocks2.length > 0) {
      const newWeek = ((cursorWeek - 1 + h2) % WEEKS_PER_SEASON) + 1;
      cursorState = replayEnd(cursorState, blocks2, cursorWeek);
      cursorWeek = newWeek;
    }
  }

  if (h3 > 0) {
    const composedSoFar = phases.flatMap((p) => p.blocks);
    if (composedSoFar.length > 0) {
      // Existing planForCluster pattern: extend the last-trained plan through the horizon
      // rather than re-searching (nothing new to optimize for once M2's full targets are set).
      const lastId = composedSoFar[composedSoFar.length - 1].trainingId;
      phases.push({ label: 'polish', blocks: [{ trainingId: lastId, weeks: h3 }] });
    } else {
      // Nothing trained yet (both earlier milestones already behind `now`) — nothing to
      // extend, so run a fresh search against the full targets for the polish horizon.
      const r3 = optimizePlan(cursorState, targets, { horizonWeeks: h3, startWeekOfSeason: cursorWeek, ...staffCfg });
      phases.push({ label: 'polish', blocks: r3.best ? [...r3.best.blocks] : [] });
    }
  }

  const allBlocks = phases.flatMap((p) => p.blocks);
  const fullProj = project(start, planToWeekCfgs(allBlocks), BBSCOUT, { startWeekOfSeason: now.week });
  const end = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, displayed(fullProj.finalSkills[k])]),
  ) as Record<SkillKey, number>;

  const checkpointAt = (target: { age: number; week: number }): Record<SkillKey, number> | null => {
    const offset = absWeek(target) - absWeek(now);
    if (offset < 0) return null; // milestone strictly before `now`
    if (offset === 0) {
      return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(start.skills[k])])) as Record<SkillKey, number>;
    }
    return stateAtWeek(fullProj, offset);
  };
  const m1 = checkpointAt(P1);
  const m2 = checkpointAt(P2);

  const m2Ref = m2 ?? (Object.fromEntries(
    SKILL_KEYS.map((k) => [k, displayed(start.skills[k])]),
  ) as Record<SkillKey, number>);
  const finalized = targets.every((t) => m2Ref[t.skill] >= t.displayed);

  return {
    phases,
    playable,
    finalized,
    checkpoints: { m1, m2, end },
    weeklyPopRate: fullProj.weeks.length ? fullProj.popCount / fullProj.weeks.length : 0,
  };
}
