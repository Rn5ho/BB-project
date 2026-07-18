export const SKILL_KEYS = ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is', 'id', 'rb', 'sb'] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];
/** Decimal sublevel values (displayed value = ceil, 1..20). */
export type Skills = Record<SkillKey, number>;
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export const ALL_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export function skillsFromArray(ns: number[]): Skills {
  if (ns.length !== 10) throw new Error(`expected 10 skills, got ${ns.length}`);
  return Object.fromEntries(SKILL_KEYS.map((k, i) => [k, ns[i]])) as Skills;
}
export function skillsToArray(s: Skills): number[] {
  return SKILL_KEYS.map((k) => s[k]);
}

/** Map to the snake_case skill columns used by v2 snapshots. */
export const SKILL_DB_NAMES: Record<SkillKey, string> = {
  js: 'jump_shot', jr: 'jump_range', od: 'outside_def', ha: 'handling', dr: 'driving',
  pa: 'passing', is: 'inside_shot', id: 'inside_def', rb: 'rebounding', sb: 'shot_blocking',
};

export type Confidence = 'official' | 'measured' | 'fitted' | 'estimate';
/** A parameter family with provenance. `source` is a repo-relative path into docs/research/training/. */
export interface Param<T> {
  value: T;
  source: string;
  confidence: Confidence;
}

/** Levels/week contributed to each skill by one training type (missing key = 0). */
export type RateRow = Partial<Record<SkillKey, number>>;

export type ElasticSpec =
  | { kind: 'none' }
  /** CoachParrot: multiplier coeff^(trained − avg(links[trained])) on the trained skill.
   *  boostOnly clamps the multiplier at ≥ 1 (only helps lagging skills). */
  | { kind: 'exp-linked'; coeff: number; boostOnly: boolean; links: Partial<Record<SkillKey, SkillKey[]>> }
  /** Sergiu: gain *= 1 + Σ coeff·(other − trained) over pairs where other > trained. */
  | { kind: 'pair-linear'; pairs: Array<{ trained: SkillKey; other: SkillKey; coeff: number }> }
  /** Real-game structure per the 2026 Slovenian-community worked example: an ADDITIVE
   *  sublevel bonus Σ coeff·max(0, other − trained), applied after the multiplier chain
   *  and NOT scaled by age/height/trainer. */
  | { kind: 'additive-pair'; pairs: Array<{ trained: SkillKey; other: SkillKey; coeff: number }> };

export type CapSpec =
  | { kind: 'none' }
  /** Josef Ka / CP: capped when max over positions of Σ(weights·skills) ≥ 8 + 2·potential.
   *  weights arrays follow SKILL_KEYS order. All gains ×slowdown when capped. */
  | { kind: 'weighted-sum'; weights: Record<Position, number[]>; slowdown: number }
  /** Dev-blessed 3-stage ladder (2026 Discord Q&A): capped at stage i when
   *  max over positions of Σ(weights·skills) ≥ stages[i].offset + 2·potential;
   *  the deepest passed stage's slowdown applies. Stages ordered by offset asc. */
  | { kind: 'staged-weighted-sum'; weights: Record<Position, number[]>; stages: Array<{ offset: number; slowdown: number }> }
  /** Deployed open_source: per-skill ×slowdown once that skill ≥ threshold (potential ignored). */
  | { kind: 'high-skill'; threshold: number; slowdown: number };

export type MinutesSpec =
  | { kind: 'none' }
  /** Full rate at/above the age-band threshold, linear below. */
  | { kind: 'threshold-linear'; bands: Array<{ maxAge: number; minutes: number }> };

export type XtrainSpec =
  | { kind: 'none' }
  /** CP: the player's highest skill trains ×coeff^(maxSkill − avg(all 10)). */
  | { kind: 'top-skill-malus'; coeff: number };

/** Height multipliers at the 22 BB height steps, per skill. */
export interface HeightTable {
  stepsCm: number[];
  bySkill: Record<SkillKey, number[]>;
}

export interface TrainingType {
  id: number; // 1..33, BuzzerIQ/BB dropdown order
  name: string; // technical key used by research sources ("DR for 12")
  label: string; // in-game training name shown in UI ("One on One (PG/SG)")
  primary: SkillKey | null; // null for stamina/FT
  positions: Position[]; // qualifying positions for the minutes requirement
  kind: 'skill' | 'stamina' | 'freethrow';
}

export type CrossTrainingSpec =
  | { kind: 'none' }
  /** Dev-specified (2026): each slot sends 10% of the primary skill's training amount to a
   *  random skill (incl. ST/FT); gym adds extra slots. Modeled as expected value: total
   *  scatter spread evenly over the 12 skills. */
  | { kind: 'slot-scatter'; baseSlots: number; slotShare: number };

export interface ModelParams {
  id: 'coach-parrot' | 'open-source-live' | 'bbscout' | 'bbscout-low' | 'bbscout-high' | 'bbscout-ha-flat';
  /** RateRow per skill-training id (1..31). Stamina/FT use stRate/ftRate. */
  rates: Param<Record<number, RateRow>>;
  stRate: Param<number>; // stamina levels/week, no multipliers
  ftRate: Param<number>; // free-throw levels/week, no multipliers
  age: Param<Record<number, number>>; // 18..36
  height: Param<HeightTable>;
  coach: Param<Record<number, number>>; // trainer level 1..7
  /** Multiplicative bonus per youth-trainer level, ages 18-19 only: mult = 1 + perLevel·level. */
  youthTrainer: Param<{ perLevel: number }>;
  elastic: Param<ElasticSpec>;
  xtrain: Param<XtrainSpec>;
  cap: Param<CapSpec>;
  minutes: Param<MinutesSpec>;
  weeksPerSeason: Param<number>;
  /** Gym-driven random cross-training (EV model). 'none' for models whose fitted rates
   *  already average it in (CP/OSL). */
  crossTraining: Param<CrossTrainingSpec>;
  /** Training-court passive free-throw training, levels/week by court level 0-3,
   *  independent of minutes and the weekly training slot. Empty record = not modeled. */
  tcFreeThrow: Param<Record<number, number>>;
}
