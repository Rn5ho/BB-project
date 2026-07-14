import { getTrainingType } from './catalog';
import {
  ALL_POSITIONS, SKILL_KEYS,
  type ModelParams, type SkillKey, type Skills,
} from './types';

export interface PlayerState {
  skills: Skills;
  age: number;
  heightCm: number;
  potential: number; // 0..11
  ftSkill?: number;
  staminaSkill?: number;
}

export interface WeekConfig {
  trainingId: number;
  coachLevel: number; // 1..7
  youthTrainerLevel?: number; // 0..7
  /** Weekly minutes at the training's qualifying positions. undefined = assume full. */
  minutes?: number;
}

export interface WeekResult {
  gains: Skills;
  skillsAfter: Skills;
  pops: Partial<Record<SkillKey, boolean>>;
  capped: boolean;
  ftAfter: number;
  staminaAfter: number;
  multipliers: { age: number; coach: number; youth: number; minutes: number };
}

export function displayed(v: number): number {
  return Math.min(20, Math.max(1, Math.ceil(v)));
}

export function heightMultiplier(model: ModelParams, heightCm: number, skill: SkillKey): number {
  const { stepsCm, bySkill } = model.height.value;
  let best = 0;
  for (let i = 1; i < stepsCm.length; i++) {
    if (Math.abs(stepsCm[i] - heightCm) < Math.abs(stepsCm[best] - heightCm)) best = i;
  }
  return bySkill[skill][best];
}

export function isCapped(model: ModelParams, player: PlayerState): boolean {
  const cap = model.cap.value;
  if (cap.kind !== 'weighted-sum') return false;
  const arr = SKILL_KEYS.map((k) => player.skills[k]);
  const score = Math.max(
    ...ALL_POSITIONS.map((pos) =>
      cap.weights[pos].reduce((acc, w, i) => acc + w * arr[i], 0),
    ),
  );
  return score >= 8 + 2 * player.potential;
}

function elasticMultiplier(model: ModelParams, skills: Skills, trained: SkillKey): number {
  const spec = model.elastic.value;
  if (spec.kind === 'none') return 1;
  if (spec.kind === 'exp-linked') {
    const links = spec.links[trained];
    if (!links || links.length === 0) return 1;
    const avg = links.reduce((a, k) => a + skills[k], 0) / links.length;
    const mult = Math.pow(spec.coeff, skills[trained] - avg);
    return spec.boostOnly ? Math.max(1, mult) : mult;
  }
  // pair-linear (sergiu): boost trained skill by coeff·(other − trained) for each higher other
  let factor = 1;
  for (const p of spec.pairs) {
    if (p.trained !== trained) continue;
    const diff = skills[p.other] - skills[trained];
    if (diff > 0) factor += p.coeff * diff;
  }
  return factor;
}

function minutesFactor(model: ModelParams, age: number, minutes: number | undefined): number {
  const spec = model.minutes.value;
  if (spec.kind === 'none' || minutes === undefined) return 1;
  const band = spec.bands.find((b) => age <= b.maxAge) ?? spec.bands[spec.bands.length - 1];
  if (minutes >= band.minutes) return 1;
  return Math.max(0, minutes / band.minutes);
}

export function weekStep(player: PlayerState, config: WeekConfig, model: ModelParams): WeekResult {
  const tt = getTrainingType(config.trainingId);
  const ageMult = model.age.value[player.age] ?? 0;
  const coachMult = model.coach.value[config.coachLevel] ?? 1;
  const youthMult =
    player.age <= 19 ? 1 + model.youthTrainer.value.perLevel * (config.youthTrainerLevel ?? 0) : 1;
  const minMult = minutesFactor(model, player.age, config.minutes);

  const gains = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Skills;
  let ftAfter = player.ftSkill ?? 1;
  let staminaAfter = player.staminaSkill ?? 1;
  const capped = isCapped(model, player);

  if (tt.kind === 'stamina') {
    staminaAfter += model.stRate.value; // flat, no multipliers (CP semantics)
  } else if (tt.kind === 'freethrow') {
    ftAfter += model.ftRate.value;
  } else {
    const row = model.rates.value[tt.id] ?? {};
    const maxSkill = Math.max(...SKILL_KEYS.map((k) => player.skills[k]));
    const avgAll = SKILL_KEYS.reduce((a, k) => a + player.skills[k], 0) / SKILL_KEYS.length;
    const capSpec = model.cap.value;
    for (const k of SKILL_KEYS) {
      const rate = row[k];
      if (!rate) continue;
      let g = rate * ageMult * coachMult * youthMult * minMult;
      g *= heightMultiplier(model, player.heightCm, k);
      g *= elasticMultiplier(model, player.skills, k);
      const xt = model.xtrain.value;
      if (xt.kind === 'top-skill-malus' && player.skills[k] === maxSkill) {
        g *= Math.pow(xt.coeff, player.skills[k] - avgAll);
      }
      if (capSpec.kind === 'weighted-sum' && capped) g *= capSpec.slowdown;
      if (capSpec.kind === 'high-skill' && player.skills[k] >= capSpec.threshold) g *= capSpec.slowdown;
      gains[k] = g;
    }
  }

  const skillsAfter = { ...player.skills };
  const pops: Partial<Record<SkillKey, boolean>> = {};
  for (const k of SKILL_KEYS) {
    if (!gains[k]) { pops[k] = false; continue; }
    const before = skillsAfter[k];
    skillsAfter[k] = Math.min(20, before + gains[k]);
    pops[k] = displayed(skillsAfter[k]) > displayed(before);
  }

  return {
    gains, skillsAfter, pops, capped, ftAfter, staminaAfter,
    multipliers: { age: ageMult, coach: coachMult, youth: youthMult, minutes: minMult },
  };
}

export interface ProjectOptions {
  startWeekOfSeason?: number; // 1..14, default 1
}

export interface ProjectionWeek {
  weekNumber: number; // 1-based across the whole plan
  age: number;
  seasonWeek: number; // 1..weeksPerSeason
  config: WeekConfig;
  result: WeekResult;
}

export interface Projection {
  weeks: ProjectionWeek[];
  finalSkills: Skills;
  totalGains: Skills;
  displayedGains: Partial<Record<SkillKey, number>>;
  finalAge: number;
  popCount: number;
}

export function project(
  player: PlayerState,
  plan: WeekConfig[],
  model: ModelParams,
  opts: ProjectOptions = {},
): Projection {
  const wps = model.weeksPerSeason.value;
  let seasonWeek = opts.startWeekOfSeason ?? 1;
  let state: PlayerState = { ...player, skills: { ...player.skills } };
  const weeks: ProjectionWeek[] = [];
  let popCount = 0;

  for (let i = 0; i < plan.length; i++) {
    const result = weekStep(state, plan[i], model);
    weeks.push({ weekNumber: i + 1, age: state.age, seasonWeek, config: plan[i], result });
    popCount += SKILL_KEYS.filter((k) => result.pops[k]).length;
    state = {
      ...state,
      skills: result.skillsAfter,
      ftSkill: result.ftAfter,
      staminaSkill: result.staminaAfter,
    };
    seasonWeek++;
    if (seasonWeek > wps) {
      seasonWeek = 1;
      state.age++;
    }
  }

  const totalGains = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, state.skills[k] - player.skills[k]]),
  ) as Skills;
  const displayedGains = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, displayed(state.skills[k]) - displayed(player.skills[k])]),
  ) as Partial<Record<SkillKey, number>>;

  return { weeks, finalSkills: state.skills, totalGains, displayedGains, finalAge: state.age, popCount };
}
