import { describe, expect, it } from 'vitest';
import { TRAINING_CATALOG, getTrainingType } from './catalog';
import { SKILL_KEYS, skillsFromArray, skillsToArray } from './types';

describe('training catalog', () => {
  it('has exactly 33 types with ids 1..33', () => {
    expect(TRAINING_CATALOG).toHaveLength(33);
    expect(TRAINING_CATALOG.map((t) => t.id)).toEqual(
      Array.from({ length: 33 }, (_, i) => i + 1),
    );
  });

  it('matches the BuzzerIQ id table on spot checks (docs/research/training/buzzeriq/API-MAP.md)', () => {
    expect(getTrainingType(1)).toMatchObject({ name: 'JS for 12', primary: 'js', positions: ['PG', 'SG'], kind: 'skill' });
    expect(getTrainingType(12)).toMatchObject({ name: 'HA for 1', primary: 'ha', positions: ['PG'] });
    expect(getTrainingType(28)).toMatchObject({ name: 'RB for team', positions: ['PG', 'SG', 'SF', 'PF', 'C'] });
    expect(getTrainingType(32)).toMatchObject({ name: 'Stamina', kind: 'stamina', primary: null });
    expect(getTrainingType(33)).toMatchObject({ name: 'Free Throw', kind: 'freethrow', primary: null });
  });

  it('round-trips skills arrays in canonical order', () => {
    const s = skillsFromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(s.js).toBe(1);
    expect(s.sb).toBe(10);
    expect(skillsToArray(s)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(SKILL_KEYS).toHaveLength(10);
  });
});
