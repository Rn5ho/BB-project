import { describe, it, expect } from 'vitest';
import { tsp, skillCapForAge, currentAge, pickCurrentSeason, computeSkillDeltas, insideTsp, outsideTsp, deriveRowTsp, INSIDE_SKILL_KEYS, OUTSIDE_SKILL_KEYS } from './domain';

describe('computeSkillDeltas', () => {
  it('returns non-zero gains only', () => {
    expect(
      computeSkillDeltas(
        { jump_shot: 13, passing: 8, handling: 10 },
        { jump_shot: 11, passing: 8, handling: 12 },
      ),
    ).toEqual({ jump_shot: 2 }); // handling "drop" is a misread — impossible before age 35
  });

  it('keeps negative stamina (the one skill that can drift down)', () => {
    expect(
      computeSkillDeltas(
        { stamina: 4, jump_shot: 10 },
        { stamina: 5, jump_shot: 12 },
      ),
    ).toEqual({ stamina: -1 });
  });

  it('returns null when only impossible drops exist', () => {
    expect(computeSkillDeltas({ jump_shot: 10 }, { jump_shot: 12 })).toBeNull();
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

import { SKILL_DB_NAMES } from './training/types';
import { OSP_KEYS, ISP_KEYS } from './archetypes/derive/groups';

const FULL = {
  jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8,
  inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3,
};

describe('insideTsp / outsideTsp', () => {
  it('sums the 6 outside skills', () => expect(outsideTsp(FULL)).toBe(69));
  it('sums the 4 inside skills', () => expect(insideTsp(FULL)).toBe(21));
  it('null-propagates per component', () => {
    expect(outsideTsp({ ...FULL, passing: null })).toBeNull();
    expect(insideTsp({ ...FULL, passing: null })).toBe(21); // outside gap doesn't hurt inside
    expect(insideTsp({ ...FULL, rebounding: null })).toBeNull();
    expect(outsideTsp({})).toBeNull();
    expect(insideTsp({})).toBeNull();
  });
  it('in + out equals the hand-computed 10-skill sum, NOT the 12-skill tsp()', () => {
    expect(insideTsp(FULL)! + outsideTsp(FULL)!).toBe(90); // 98 minus stamina 5 minus FT 3
    expect(insideTsp(FULL)! + outsideTsp(FULL)!).not.toBe(tsp(FULL));
  });
  it('partition matches the archetype OSP/ISP grouping', () => {
    expect(new Set(OSP_KEYS.map((k) => SKILL_DB_NAMES[k]))).toEqual(new Set(OUTSIDE_SKILL_KEYS));
    expect(new Set(ISP_KEYS.map((k) => SKILL_DB_NAMES[k]))).toEqual(new Set(INSIDE_SKILL_KEYS));
  });
});

describe('deriveRowTsp', () => {
  it('prefers the computed 10-skill sum over legacy stored values', () => {
    expect(deriveRowTsp(98, 21, 69)).toBe(90);
  });
  it('falls back to stored when either component is null', () => {
    expect(deriveRowTsp(95, null, 69)).toBe(95);
    expect(deriveRowTsp(95, 21, null)).toBe(95);
    expect(deriveRowTsp(95, null, null)).toBe(95);
  });
  it('null when neither derivable nor stored', () => {
    expect(deriveRowTsp(null, null, null)).toBeNull();
  });
});
