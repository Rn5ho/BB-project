import { describe, it, expect } from 'vitest';
import { evaluateArchetype, matchingArchetypes } from './evaluate';
import type { EffectiveArchetype, EvalPlayer } from './types';

const defCenter: EffectiveArchetype = {
  id: 'defensive-center', key: 'defensive-center', dbId: null, source: 'default', name: 'Defensive Center',
  rules: { conditions: [
    { kind: 'field', field: 'inside_def', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
    { kind: 'field', field: 'shot_blocking', op: '>=', byAge: { 18: 6, 19: 10, 20: 13, 21: 14 } },
    { kind: 'field', field: 'inside_shot', op: '<=', byAge: { 18: 3, 19: 4, 20: 5, 21: 6 } },
  ] },
};

function player(age: number | null, skills: Partial<Record<string, number>>): EvalPlayer {
  return { ageNow: age, skills: skills as Record<string, number>, potential: 8, heightCm: 210, tsp: 90, bestPosition: 'C' };
}

describe('evaluateArchetype', () => {
  it('matches an 18yo meeting the age-18 tier', () => {
    const r = evaluateArchetype(player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 2 }), defCenter);
    expect(r.matches).toBe(true);
    expect(r.ageTierUsed).toBe(18);
  });
  it('fails when a min condition is below the tier', () => {
    expect(evaluateArchetype(player(18, { inside_def: 5, shot_blocking: 7, inside_shot: 2 }), defCenter).matches).toBe(false);
  });
  it('fails when a max (<=) condition is exceeded', () => {
    expect(evaluateArchetype(player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 4 }), defCenter).matches).toBe(false);
  });
  it('uses the correct age column (21 needs the full line)', () => {
    expect(evaluateArchetype(player(21, { inside_def: 12, shot_blocking: 14, inside_shot: 6 }), defCenter).matches).toBe(false); // ID 12 < 15
    expect(evaluateArchetype(player(21, { inside_def: 15, shot_blocking: 14, inside_shot: 6 }), defCenter).matches).toBe(true);
  });
  it('does not match when age is unknown', () => {
    expect(evaluateArchetype(player(null, { inside_def: 15, shot_blocking: 14, inside_shot: 2 }), defCenter).matches).toBe(false);
  });
  it('null skill fails a min condition', () => {
    expect(evaluateArchetype(player(18, { shot_blocking: 7, inside_shot: 2 }), defCenter).matches).toBe(false); // inside_def missing
  });
  it('returns per-condition checks with actual vs threshold', () => {
    const r = evaluateArchetype(player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 2 }), defCenter);
    expect(r.checks).toHaveLength(3);
    expect(r.checks.find((c) => c.field === 'inside_def')).toMatchObject({ threshold: 6, actual: 6, pass: true });
  });
});

describe('age tier with blank cells', () => {
  const only2021: EffectiveArchetype = {
    id: 'x', key: 'x', dbId: null, source: 'default', name: 'X',
    rules: { conditions: [{ kind: 'field', field: 'rebounding', op: '>=', byAge: { 20: 11, 21: 13 } }] },
  };
  it('no requirement at 18 → no applicable cell → no match', () => {
    expect(evaluateArchetype(player(18, { rebounding: 20 }), only2021).matches).toBe(false);
  });
  it('applies at 20', () => {
    expect(evaluateArchetype(player(20, { rebounding: 11 }), only2021).matches).toBe(true);
  });
});

describe('position condition', () => {
  const guard: EffectiveArchetype = {
    id: 'pm', key: 'pm', dbId: null, source: 'default', name: 'PM',
    rules: { conditions: [
      { kind: 'position', op: 'is', positions: ['PG'] },
      { kind: 'field', field: 'passing', op: '>=', byAge: { 18: 6 } },
    ] },
  };
  it('requires the position and the skill', () => {
    expect(evaluateArchetype({ ageNow: 18, skills: { passing: 8 }, potential: 8, heightCm: 185, tsp: 60, bestPosition: 'PG' }, guard).matches).toBe(true);
    expect(evaluateArchetype({ ageNow: 18, skills: { passing: 8 }, potential: 8, heightCm: 185, tsp: 60, bestPosition: 'SG' }, guard).matches).toBe(false);
  });
});

describe('matchingArchetypes', () => {
  it('returns all archetypes a player matches', () => {
    const p = player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 2 });
    expect(matchingArchetypes(p, [defCenter]).map((a) => a.id)).toEqual(['defensive-center']);
  });
});
