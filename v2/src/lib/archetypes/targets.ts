import { SKILL_DB_NAMES, SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import { AGE_TIERS } from './types';
import type { EffectiveArchetype } from './types';

const DB_TO_KEY: Partial<Record<string, SkillKey>> = Object.fromEntries(
  SKILL_KEYS.map((k) => [SKILL_DB_NAMES[k], k]),
);

/** The archetype's U-21 finished build as reverse-planner targets: age-21 '>=' thresholds
 *  on the 10 trainable rate skills (falls back to the highest defined tier when 21 is
 *  blank). '<=' rules and ST/FT/attribute rules are constraints, not training targets. */
export function archetypeTargets(a: EffectiveArchetype): Partial<Record<SkillKey, number>> {
  const out: Partial<Record<SkillKey, number>> = {};
  for (const cond of a.rules.conditions) {
    if (cond.kind !== 'field' || cond.op !== '>=') continue;
    const key = DB_TO_KEY[cond.field];
    if (!key) continue;
    let threshold: number | undefined;
    for (const age of AGE_TIERS) { // ascending — the last defined tier is the U-21 build
      const v = cond.byAge[age];
      if (v != null) threshold = v;
    }
    if (threshold != null) out[key] = threshold;
  }
  return out;
}
