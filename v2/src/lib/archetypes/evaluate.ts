import type { EffectiveArchetype, EvalPlayer, ArchetypeField, AgeTier } from './types';

export interface ConditionCheck {
  field: ArchetypeField | 'position';
  op: string;
  threshold: number | string;
  actual: number | string | null;
  pass: boolean;
}

export interface EvalResult {
  matches: boolean;
  checks: ConditionCheck[];
  ageTierUsed: number | null;
}

function fieldValue(p: EvalPlayer, field: ArchetypeField): number | null {
  if (field === 'potential') return p.potential;
  if (field === 'height_cm') return p.heightCm;
  if (field === 'tsp') return p.tsp;
  return p.skills?.[field] ?? null;
}

export function evaluateArchetype(p: EvalPlayer, a: EffectiveArchetype): EvalResult {
  const age = p.ageNow;
  const checks: ConditionCheck[] = [];
  if (age == null) return { matches: false, checks, ageTierUsed: null };

  let anyApplicable = false;
  let allPass = true;

  for (const cond of a.rules.conditions) {
    if (cond.kind === 'position') {
      const actual = p.bestPosition;
      const inSet = actual != null && (cond.positions as string[]).includes(actual);
      const pass = cond.op === 'is' ? inSet : !inSet;
      anyApplicable = true;
      checks.push({ field: 'position', op: cond.op, threshold: cond.positions.join('/'), actual, pass });
      if (!pass) allPass = false;
    } else {
      const threshold = cond.byAge[age as AgeTier];
      if (threshold == null) continue; // blank at this age
      anyApplicable = true;
      const actual = fieldValue(p, cond.field);
      const pass = actual != null && (cond.op === '>=' ? actual >= threshold : actual <= threshold);
      checks.push({ field: cond.field, op: cond.op, threshold, actual, pass });
      if (!pass) allPass = false;
    }
  }

  return { matches: anyApplicable && allPass, checks, ageTierUsed: anyApplicable ? age : null };
}

export function matchingArchetypes(p: EvalPlayer, archetypes: EffectiveArchetype[]): EffectiveArchetype[] {
  return archetypes.filter((a) => evaluateArchetype(p, a).matches);
}
