import { describe, it, expect } from 'vitest';
import { tsp, skillCapForAge, currentAge, pickCurrentSeason, computeSkillDeltas } from './domain';

describe('computeSkillDeltas', () => {
  it('returns non-zero deltas only', () => {
    expect(
      computeSkillDeltas(
        { jump_shot: 13, passing: 8, handling: 10 },
        { jump_shot: 11, passing: 8, handling: 12 },
      ),
    ).toEqual({ jump_shot: 2, handling: -2 });
  });

  it('returns null when baseline or latest is null', () => {
    expect(computeSkillDeltas(null, { jump_shot: 10 })).toBeNull();
    expect(computeSkillDeltas({ jump_shot: 10 }, null)).toBeNull();
  });

  it('skips skills missing on either side', () => {
    expect(computeSkillDeltas({ jump_shot: 12, passing: null }, { jump_shot: 10 })).toEqual({ jump_shot: 2 });
  });

  it('returns null when nothing changed', () => {
    expect(computeSkillDeltas({ jump_shot: 10 }, { jump_shot: 10 })).toBeNull();
  });
});

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
  it('returns null without snapshot age', () => expect(currentAge(null, 68, 70)).toBeNull());
});

describe('pickCurrentSeason', () => {
  const seasons = [
    { id: 69, start: new Date('2026-01-10'), finish: new Date('2026-04-10') as Date | null },
    { id: 70, start: new Date('2026-04-11'), finish: new Date('2026-07-30') as Date | null },
  ];
  it('picks the season containing now', () => {
    expect(pickCurrentSeason(seasons, new Date('2026-07-10'))).toBe(70);
  });
  it('falls back to highest id when between seasons', () => {
    // use a date before 2026-08-01 so it doesn't overlap the open-ended season fixture below
    expect(pickCurrentSeason(seasons, new Date('2026-07-31'))).toBe(70);
  });
  it('throws on empty seasons list', () => { expect(() => pickCurrentSeason([], new Date())).toThrow(); });

  it('handles in-progress season with null finish', () => {
    const withOpen = [
      ...seasons,
      { id: 71, start: new Date('2026-08-01'), finish: null as Date | null },
    ];
    expect(pickCurrentSeason(withOpen, new Date('2026-08-15'))).toBe(71);
  });
});
