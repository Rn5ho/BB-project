import { describe, it, expect } from 'vitest';
import { archetypeTargets } from './targets';
import type { EffectiveArchetype } from './types';

function arch(conditions: EffectiveArchetype['rules']['conditions']): EffectiveArchetype {
  return { id: 't', key: 't', dbId: null, name: 'Test', rules: { conditions }, source: 'default' };
}

describe('archetypeTargets', () => {
  it('takes the age-21 tier of >= skill conditions', () => {
    const t = archetypeTargets(arch([
      { kind: 'field', field: 'driving', op: '>=', byAge: { 18: 7, 19: 10, 20: 13, 21: 15 } },
      { kind: 'field', field: 'handling', op: '>=', byAge: { 18: 6, 19: 9, 20: 11, 21: 13 } },
    ]));
    expect(t).toEqual({ dr: 15, ha: 13 });
  });

  it('falls back to the highest defined tier when 21 is blank', () => {
    const t = archetypeTargets(arch([
      { kind: 'field', field: 'passing', op: '>=', byAge: { 18: 5, 19: 8 } },
    ]));
    expect(t).toEqual({ pa: 8 });
  });

  it('ignores <= conditions (build constraints, not training targets)', () => {
    const t = archetypeTargets(arch([
      { kind: 'field', field: 'inside_shot', op: '<=', byAge: { 21: 7 } },
      { kind: 'field', field: 'inside_def', op: '>=', byAge: { 21: 15 } },
    ]));
    expect(t).toEqual({ id: 15 });
  });

  it('ignores stamina/FT and attribute/position conditions', () => {
    const t = archetypeTargets(arch([
      { kind: 'field', field: 'stamina', op: '>=', byAge: { 21: 8 } },
      { kind: 'field', field: 'free_throw', op: '>=', byAge: { 21: 11 } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 21: 205 } },
      { kind: 'field', field: 'potential', op: '>=', byAge: { 21: 8 } },
      { kind: 'position', op: 'is', positions: ['PG'] },
      { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 21: 16 } },
    ]));
    expect(t).toEqual({ js: 16 });
  });
});
