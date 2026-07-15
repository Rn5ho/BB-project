// Reverse planner: beam search over weekly training choices, stepped with the REAL
// engine (weekStep + BBSCOUT), so week-by-week elastic evolution, cap slowdowns and
// cross-training are discovered by search rather than approximated. Full minutes
// assumed. Objective (lexicographic):
//   1. weighted shortfall at the deadline   (priority weights 3 / 1 / 0.4)
//   2. weighted earliness of target hits    (high-priority skills finish first)
//   3. total TSP (desc)                     (leftover weeks help wherever they can)
//   4. fewer switches
// A small per-switch penalty in the PRUNING score biases survivors toward blocky,
// club-communicable plans without distorting real trade-offs. Note: tier 3 is weak
// under pruning (post-hit, low-switch entries outrank TSP chasers in the beam);
// documented, acceptable for v1.
import { TRAINING_CATALOG } from './catalog';
import { weekStep, type PlayerState, type WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { SKILL_KEYS, type SkillKey, type Skills } from './types';

export type TargetPriority = 'high' | 'normal' | 'low';
export const PRIORITY_WEIGHT: Record<TargetPriority, number> = { high: 3, normal: 1, low: 0.4 };

export interface SkillTarget {
  skill: SkillKey;
  displayed: number; // 1..20 target displayed level
  priority: TargetPriority;
}

export interface OptimizeOptions {
  horizonWeeks: number;
  startWeekOfSeason: number; // 1..14
  coachLevel: number;
  youthTrainerLevel: number;
  gymLevel?: number;
  trainingCourtLevel?: number;
  beamWidth?: number; // default 128
}

export interface PlanCandidate {
  weekly: number[]; // trainingId per week
  blocks: Array<{ trainingId: number; weeks: number }>;
  finalSkills: Skills;
  /** 1-based week the target displayed level was first reached; null = not reached. */
  hitWeek: Partial<Record<SkillKey, number | null>>;
  /** Remaining internal sublevels to the target threshold (0 = reached). */
  shortfall: Partial<Record<SkillKey, number>>;
  totalShortfall: number; // tier 1 (weighted)
  earliness: number; // tier 2 (weighted hit weeks; misses count horizon+1)
  tsp: number; // tier 3
  switches: number; // tier 4
  reachable: boolean;
}

export interface OptimizeResult {
  best: PlanCandidate | null;
  alternatives: PlanCandidate[];
}

const SWITCH_PENALTY = 0.02;
const EPS = 1e-6;
/** Minimum internal sublevel whose ceil-display equals `d`. */
const tau = (d: number) => d - 1 + EPS;

const tspOf = (s: Skills) => SKILL_KEYS.reduce((a, k) => a + s[k], 0);

interface BeamEntry {
  state: PlayerState;
  last: number; // last trainingId; 0 = none yet
  weekly: number[];
  switches: number;
  hit: Array<number | null>; // parallel to targets
  shortfall: number; // weighted tier-1 measure of state
  tsp: number;
}

function measure(skills: Skills, targets: SkillTarget[], weights: number[]): number {
  let s = 0;
  for (let i = 0; i < targets.length; i++) {
    s += weights[i] * Math.max(0, tau(targets[i].displayed) - skills[targets[i].skill]);
  }
  return s;
}

/** Pruning order: shortfall + switch penalty, then TSP desc. Stable-sort safe. */
function pruneCompare(a: BeamEntry, b: BeamEntry): number {
  const pa = a.shortfall + a.switches * SWITCH_PENALTY;
  const pb = b.shortfall + b.switches * SWITCH_PENALTY;
  if (Math.abs(pa - pb) > EPS) return pa - pb;
  return b.tsp - a.tsp;
}

export function collapseWeekly(weekly: number[]): Array<{ trainingId: number; weeks: number }> {
  const blocks: Array<{ trainingId: number; weeks: number }> = [];
  for (const id of weekly) {
    const last = blocks[blocks.length - 1];
    if (last && last.trainingId === id) last.weeks++;
    else blocks.push({ trainingId: id, weeks: 1 });
  }
  return blocks;
}

function stepEntry(
  e: BeamEntry,
  trainingId: number,
  cfgBase: Omit<WeekConfig, 'trainingId'>,
  targets: SkillTarget[],
  weights: number[],
  weekNo: number,
  ageUp: boolean,
): BeamEntry {
  const r = weekStep(e.state, { ...cfgBase, trainingId }, BBSCOUT);
  const state: PlayerState = {
    ...e.state,
    skills: r.skillsAfter,
    ftSkill: r.ftAfter,
    staminaSkill: r.staminaAfter,
    age: ageUp ? e.state.age + 1 : e.state.age,
  };
  const hit = e.hit.slice();
  for (let i = 0; i < targets.length; i++) {
    if (hit[i] == null && r.skillsAfter[targets[i].skill] >= tau(targets[i].displayed)) {
      hit[i] = weekNo;
    }
  }
  return {
    state,
    last: trainingId,
    weekly: [...e.weekly, trainingId],
    switches: e.switches + (e.last !== 0 && e.last !== trainingId ? 1 : 0),
    hit,
    shortfall: measure(state.skills, targets, weights),
    tsp: tspOf(state.skills),
  };
}

function toCandidate(
  e: BeamEntry, targets: SkillTarget[], weights: number[], horizon: number,
): PlanCandidate {
  const shortfall: Partial<Record<SkillKey, number>> = {};
  const hitWeek: Partial<Record<SkillKey, number | null>> = {};
  let total = 0;
  let earliness = 0;
  let reachable = true;
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const sf = Math.max(0, tau(t.displayed) - e.state.skills[t.skill]);
    shortfall[t.skill] = sf;
    hitWeek[t.skill] = e.hit[i];
    total += weights[i] * sf;
    earliness += weights[i] * (e.hit[i] ?? horizon + 1);
    if (e.hit[i] == null) reachable = false;
  }
  return {
    weekly: e.weekly,
    blocks: collapseWeekly(e.weekly),
    finalSkills: e.state.skills,
    hitWeek,
    shortfall,
    totalShortfall: total,
    earliness,
    tsp: e.tsp,
    switches: e.switches,
    reachable,
  };
}

function finalCompare(a: PlanCandidate, b: PlanCandidate): number {
  if (Math.abs(a.totalShortfall - b.totalShortfall) > EPS) return a.totalShortfall - b.totalShortfall;
  if (Math.abs(a.earliness - b.earliness) > EPS) return a.earliness - b.earliness;
  if (Math.abs(a.tsp - b.tsp) > EPS) return b.tsp - a.tsp;
  return a.switches - b.switches;
}

/** Sequence of distinct trainings after collapsing runs — the plan's "structure". */
function signature(c: PlanCandidate): string {
  return c.blocks.map((b) => b.trainingId).join('-');
}

export function optimizePlan(
  start: PlayerState,
  targets: SkillTarget[],
  opts: OptimizeOptions,
): OptimizeResult {
  const H = Math.floor(opts.horizonWeeks);
  // Only targets strictly above the current internal level are active.
  const active = targets.filter((t) => start.skills[t.skill] < tau(t.displayed));
  if (H <= 0 || active.length === 0) return { best: null, alternatives: [] };
  const weights = active.map((t) => PRIORITY_WEIGHT[t.priority]);
  const width = opts.beamWidth ?? 128;
  const actions = TRAINING_CATALOG.filter((t) => t.kind === 'skill').map((t) => t.id);
  const cfgBase: Omit<WeekConfig, 'trainingId'> = {
    coachLevel: opts.coachLevel,
    youthTrainerLevel: opts.youthTrainerLevel,
    gymLevel: opts.gymLevel,
    trainingCourtLevel: opts.trainingCourtLevel,
    minutes: undefined, // full minutes assumed
  };

  let beam: BeamEntry[] = [{
    state: { ...start, skills: { ...start.skills } },
    last: 0,
    weekly: [],
    switches: 0,
    hit: active.map(() => null),
    shortfall: measure(start.skills, active, weights),
    tsp: tspOf(start.skills),
  }];
  let seasonWeek = opts.startWeekOfSeason;

  for (let w = 1; w <= H; w++) {
    // Same season-wrap semantics as project(): the training in week `w` uses the
    // pre-increment age; the age bump applies from the NEXT week on.
    const ageUp = seasonWeek >= 14;
    const next: BeamEntry[] = [];
    for (const e of beam) {
      for (const id of actions) next.push(stepEntry(e, id, cfgBase, active, weights, w, ageUp));
    }
    seasonWeek = seasonWeek >= 14 ? 1 : seasonWeek + 1;

    // Dedup near-identical states that arrived by different paths, keep the better.
    const seen = new Map<string, BeamEntry>();
    for (const e of next) {
      const key = e.last + '|' + SKILL_KEYS.map((k) => e.state.skills[k].toFixed(2)).join(',');
      const prev = seen.get(key);
      if (!prev || pruneCompare(e, prev) < 0) seen.set(key, e);
    }
    beam = [...seen.values()].sort(pruneCompare).slice(0, width);
  }

  const cands = beam.map((e) => toCandidate(e, active, weights, H)).sort(finalCompare);
  const best = cands[0] ?? null;
  const alternatives: PlanCandidate[] = [];
  if (best) {
    const sigs = new Set([signature(best)]);
    for (const c of cands.slice(1)) {
      const s = signature(c);
      if (sigs.has(s)) continue;
      sigs.add(s);
      alternatives.push(c);
      if (alternatives.length === 2) break;
    }
  }
  return { best, alternatives };
}

/** Score an explicit weekly plan with the exact same stepping as the search
 *  (drift guard + hand-plan comparison). */
export function evaluatePlan(
  start: PlayerState,
  weekly: number[],
  targets: SkillTarget[],
  opts: Omit<OptimizeOptions, 'horizonWeeks' | 'beamWidth'>,
): PlanCandidate {
  const weights = targets.map((t) => PRIORITY_WEIGHT[t.priority]);
  const cfgBase: Omit<WeekConfig, 'trainingId'> = {
    coachLevel: opts.coachLevel,
    youthTrainerLevel: opts.youthTrainerLevel,
    gymLevel: opts.gymLevel,
    trainingCourtLevel: opts.trainingCourtLevel,
    minutes: undefined,
  };
  let e: BeamEntry = {
    state: { ...start, skills: { ...start.skills } },
    last: 0,
    weekly: [],
    switches: 0,
    hit: targets.map(() => null),
    shortfall: measure(start.skills, targets, weights),
    tsp: tspOf(start.skills),
  };
  let seasonWeek = opts.startWeekOfSeason;
  for (let w = 1; w <= weekly.length; w++) {
    const ageUp = seasonWeek >= 14;
    e = stepEntry(e, weekly[w - 1], cfgBase, targets, weights, w, ageUp);
    seasonWeek = seasonWeek >= 14 ? 1 : seasonWeek + 1;
  }
  return toCandidate(e, targets, weights, weekly.length);
}
