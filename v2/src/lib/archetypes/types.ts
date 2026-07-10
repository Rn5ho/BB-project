export const ARCHETYPE_SKILL_FIELDS = [
  'jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing',
  'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw',
] as const;

export const ARCHETYPE_ATTR_FIELDS = ['potential', 'height_cm', 'tsp'] as const;

export type ArchetypeField = (typeof ARCHETYPE_SKILL_FIELDS)[number] | (typeof ARCHETYPE_ATTR_FIELDS)[number];

export const AGE_TIERS = [18, 19, 20, 21] as const;
export type AgeTier = (typeof AGE_TIERS)[number];

export interface SkillCondition {
  kind: 'field';
  field: ArchetypeField;
  op: '>=' | '<=';
  byAge: Partial<Record<AgeTier, number>>; // omitted age = blank (no requirement)
}

export interface PositionCondition {
  kind: 'position';
  op: 'is' | 'isNot';
  positions: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[];
}

export type ArchetypeCondition = SkillCondition | PositionCondition;

export interface ArchetypeRules {
  conditions: ArchetypeCondition[];
}

/** A code default (library entry). */
export interface DefaultArchetype {
  key: string;          // stable id, e.g. 'defensive-center'
  name: string;
  description?: string;
  rules: ArchetypeRules;
}

/** The merged, effective archetype the app evaluates + displays. */
export interface EffectiveArchetype {
  id: string;                         // key (default) or `custom-${dbId}`
  key: string | null;                 // default key, or null for custom
  dbId: number | null;                // DB row id if user has an override/custom, else null
  name: string;
  description?: string;
  rules: ArchetypeRules;
  source: 'default' | 'default-modified' | 'custom';
}

/** Minimal player shape the evaluator needs (PlayerListRow satisfies this). */
export interface EvalPlayer {
  ageNow: number | null;
  skills: Record<string, number | null> | null;
  potential: number | null;
  heightCm: number | null;
  tsp: number | null;
  bestPosition: string | null;
}
