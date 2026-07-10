import { describe, it, expect } from 'vitest';
import { tsp, skillCapForAge, currentAge, pickCurrentSeason } from './domain';

describe('tsp', () => {
  it('sums all 12 skills', () => {
    expect(tsp({ jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8, inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3 })).toBe(98);
  });
  it('returns null when any skill is missing (light snapshot)', () => {
    expect(tsp({ jump_shot: 11 })).toBeNull();
  });
});

describe('skillCapForAge', () => {
  // Domain rules: 18yo skills are 1–7, 19yo are 1–10, 20+ uncapped (20 max scale)
  it('caps 18yo at 7', () => expect(skillCapForAge(18)).toBe(7));
  it('caps 19yo at 10', () => expect(skillCapForAge(19)).toBe(10));
  it('caps 20yo and up at 20', () => {
    expect(skillCapForAge(20)).toBe(20);
    expect(skillCapForAge(35)).toBe(20);
  });
});

describe('currentAge', () => {
  // age at capture + seasons elapsed since capture
  it('ages a player by elapsed seasons', () => expect(currentAge(19, 68, 70)).toBe(21));
  it('same season → same age', () => expect(currentAge(20, 70, 70)).toBe(20));
  it('returns null without snapshot season', () => expect(currentAge(20, null, 70)).toBeNull());
});

describe('pickCurrentSeason', () => {
  const seasons = [
    { id: 69, start: new Date('2026-01-10'), finish: new Date('2026-04-10') },
    { id: 70, start: new Date('2026-04-11'), finish: new Date('2026-07-30') },
  ];
  it('picks the season containing now', () => {
    expect(pickCurrentSeason(seasons, new Date('2026-07-10'))).toBe(70);
  });
  it('falls back to highest id when between seasons', () => {
    expect(pickCurrentSeason(seasons, new Date('2026-08-15'))).toBe(70);
  });
});
