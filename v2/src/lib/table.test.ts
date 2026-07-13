import { describe, it, expect } from 'vitest';
import {
  sortRows,
  filterRows,
  nextSortState,
  isFilterDefault,
  countActiveSkillMins,
  DEFAULT_FILTER,
  DEFAULT_SORT,
  type PlayerListRow,
  type SortState,
  type FilterState,
} from './table';


// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<PlayerListRow> = {}): PlayerListRow {
  return {
    bbPlayerId: 1,
    name: 'Test Player',
    nationality: 'Slovenia',
    heightCm: 185,
    bestPosition: 'PG',
    ageNow: 20,
    dmi: 10000,
    gameShape: 5,
    salary: 50000,
    potential: 8,
    capturedAt: null,
    snapshotSeason: null,
    tsp: 100,
    skills: null,
    skillsCapturedAt: null,
    hasFullSkills: false,
    skillDeltas: null,
    tspDelta: null,
    ...overrides,
  };
}

// ─── sortRows ────────────────────────────────────────────────────────────────

describe('sortRows', () => {
  it('sorts numbers descending', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, dmi: 500 }),
      makePlayer({ bbPlayerId: 2, dmi: 1000 }),
      makePlayer({ bbPlayerId: 3, dmi: 750 }),
    ];
    const sorted = sortRows(rows, { key: 'dmi', direction: 'desc' });
    expect(sorted.map((r) => r.dmi)).toEqual([1000, 750, 500]);
  });

  it('sorts numbers ascending', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, dmi: 500 }),
      makePlayer({ bbPlayerId: 2, dmi: 1000 }),
      makePlayer({ bbPlayerId: 3, dmi: 750 }),
    ];
    const sorted = sortRows(rows, { key: 'dmi', direction: 'asc' });
    expect(sorted.map((r) => r.dmi)).toEqual([500, 750, 1000]);
  });

  it('sinks null to bottom in descending order', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, dmi: null }),
      makePlayer({ bbPlayerId: 2, dmi: 1000 }),
      makePlayer({ bbPlayerId: 3, dmi: null }),
      makePlayer({ bbPlayerId: 4, dmi: 500 }),
    ];
    const sorted = sortRows(rows, { key: 'dmi', direction: 'desc' });
    const dmis = sorted.map((r) => r.dmi);
    expect(dmis[0]).toBe(1000);
    expect(dmis[1]).toBe(500);
    expect(dmis[2]).toBeNull();
    expect(dmis[3]).toBeNull();
  });

  it('sinks null to bottom in ascending order (not to the top)', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, dmi: null }),
      makePlayer({ bbPlayerId: 2, dmi: 1000 }),
      makePlayer({ bbPlayerId: 3, dmi: 500 }),
    ];
    const sorted = sortRows(rows, { key: 'dmi', direction: 'asc' });
    const dmis = sorted.map((r) => r.dmi);
    expect(dmis[0]).toBe(500);
    expect(dmis[1]).toBe(1000);
    expect(dmis[2]).toBeNull(); // null sinks to bottom even in asc
  });

  it('sorts strings via localeCompare descending', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, name: 'Žužek' }),
      makePlayer({ bbPlayerId: 2, name: 'Ančič' }),
      makePlayer({ bbPlayerId: 3, name: 'Novak' }),
    ];
    const sorted = sortRows(rows, { key: 'name', direction: 'asc' });
    // localeCompare puts Ančič before Novak before Žužek
    expect(sorted[0].name).toBe('Ančič');
    expect(sorted[1].name).toBe('Novak');
    expect(sorted[2].name).toBe('Žužek');
  });

  it('sorts skill columns via skills record', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: { jump_shot: 10, jump_range: 5, outside_def: null, handling: null, driving: null, passing: null, inside_shot: null, inside_def: null, rebounding: null, shot_blocking: null, stamina: null, free_throw: null } }),
      makePlayer({ bbPlayerId: 2, skills: { jump_shot: 15, jump_range: 5, outside_def: null, handling: null, driving: null, passing: null, inside_shot: null, inside_def: null, rebounding: null, shot_blocking: null, stamina: null, free_throw: null } }),
      makePlayer({ bbPlayerId: 3, skills: { jump_shot: null, jump_range: 5, outside_def: null, handling: null, driving: null, passing: null, inside_shot: null, inside_def: null, rebounding: null, shot_blocking: null, stamina: null, free_throw: null } }),
    ];
    const sorted = sortRows(rows, { key: 'jump_shot', direction: 'desc' });
    expect(sorted[0].bbPlayerId).toBe(2); // 15
    expect(sorted[1].bbPlayerId).toBe(1); // 10
    expect(sorted[2].bbPlayerId).toBe(3); // null → bottom
  });

  it('sorts by tspDelta desc with nulls at bottom', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tspDelta: 2 }),
      makePlayer({ bbPlayerId: 2, tspDelta: null }),
      makePlayer({ bbPlayerId: 3, tspDelta: 7 }),
    ];
    const sorted = sortRows(rows, { key: 'tspDelta', direction: 'desc' });
    expect(sorted.map((r) => r.bbPlayerId)).toEqual([3, 1, 2]);
  });

  it('does not mutate the original array', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: 50 }),
      makePlayer({ bbPlayerId: 2, tsp: 100 }),
    ];
    const orig = [...rows];
    sortRows(rows, { key: 'tsp', direction: 'desc' });
    expect(rows[0].bbPlayerId).toBe(orig[0].bbPlayerId);
  });
});

// ─── filterRows ──────────────────────────────────────────────────────────────

describe('filterRows', () => {
  it('passes all rows with default filter', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1 }),
      makePlayer({ bbPlayerId: 2 }),
    ];
    expect(filterRows(rows, DEFAULT_FILTER)).toHaveLength(2);
  });

  it('filters by name substring (case-insensitive)', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, name: 'Janez Novak' }),
      makePlayer({ bbPlayerId: 2, name: 'Miha Horvat' }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, name: 'novak' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Janez Novak');
  });

  it('diacritic-insensitive search: "Zuzek" matches "Žužek"', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, name: 'Žužek' }),
      makePlayer({ bbPlayerId: 2, name: 'Normal Name' }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, name: 'Zuzek' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Žužek');
  });

  it('diacritic-insensitive search: "zuzek" (lower) matches "Žužek"', () => {
    const rows = [makePlayer({ bbPlayerId: 1, name: 'Žužek' })];
    const result = filterRows(rows, { ...DEFAULT_FILTER, name: 'zuzek' });
    expect(result).toHaveLength(1);
  });

  it('age null rows PASS the age filter', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, ageNow: null }),
      makePlayer({ bbPlayerId: 2, ageNow: 25 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, ageMin: 18, ageMax: 21 });
    // null age passes; age 25 is outside 18-21 so fails
    expect(result).toHaveLength(1);
    expect(result[0].ageNow).toBeNull();
  });

  it('age within range passes', () => {
    const rows = [makePlayer({ ageNow: 20 })];
    expect(filterRows(rows, { ...DEFAULT_FILTER, ageMin: 18, ageMax: 21 })).toHaveLength(1);
  });

  it('age outside range fails', () => {
    const rows = [makePlayer({ ageNow: 22 })];
    expect(filterRows(rows, { ...DEFAULT_FILTER, ageMin: 18, ageMax: 21 })).toHaveLength(0);
  });

  it('position filter: empty string means All', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, bestPosition: 'PG' }),
      makePlayer({ bbPlayerId: 2, bestPosition: 'C' }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER, position: '' })).toHaveLength(2);
  });

  it('position filter: specific position filters correctly', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, bestPosition: 'PG' }),
      makePlayer({ bbPlayerId: 2, bestPosition: 'C' }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER, position: 'PG' })).toHaveLength(1);
  });

  it('fullSkillsOnly: filters out rows without full skills', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, hasFullSkills: true }),
      makePlayer({ bbPlayerId: 2, hasFullSkills: false }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER, fullSkillsOnly: true })).toHaveLength(1);
    expect(filterRows(rows, { ...DEFAULT_FILTER, fullSkillsOnly: true })[0].bbPlayerId).toBe(1);
  });

  it('min TSP: null TSP FAILS when min is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: null }),
      makePlayer({ bbPlayerId: 2, tsp: 150 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, minTsp: '100' });
    expect(result).toHaveLength(1);
    expect(result[0].bbPlayerId).toBe(2);
  });

  it('min TSP: passes rows above threshold', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: 80 }),
      makePlayer({ bbPlayerId: 2, tsp: 120 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, minTsp: '100' });
    expect(result).toHaveLength(1);
    expect(result[0].bbPlayerId).toBe(2);
  });

  it('min TSP empty string: inactive, nulls pass', () => {
    const rows = [makePlayer({ tsp: null }), makePlayer({ tsp: 50 })];
    expect(filterRows(rows, { ...DEFAULT_FILTER, minTsp: '' })).toHaveLength(2);
  });

  it('min DMI: null DMI fails when filter is set', () => {
    const rows = [makePlayer({ dmi: null }), makePlayer({ dmi: 20000 })];
    const result = filterRows(rows, { ...DEFAULT_FILTER, minDmi: '10000' });
    expect(result).toHaveLength(1);
    expect(result[0].dmi).toBe(20000);
  });

  it('height min/max: filters correctly', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, heightCm: 175 }),
      makePlayer({ bbPlayerId: 2, heightCm: 190 }),
      makePlayer({ bbPlayerId: 3, heightCm: 205 }),
      makePlayer({ bbPlayerId: 4, heightCm: null }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, heightMin: '180', heightMax: '200' });
    // 190 passes, others fail (175 < 180, 205 > 200, null fails min)
    expect(result).toHaveLength(1);
    expect(result[0].bbPlayerId).toBe(2);
  });

  it('min game shape: null fails when filter is set', () => {
    const rows = [makePlayer({ gameShape: null }), makePlayer({ gameShape: 7 })];
    const result = filterRows(rows, { ...DEFAULT_FILTER, minGameShape: '5' });
    expect(result).toHaveLength(1);
    expect(result[0].gameShape).toBe(7);
  });

  it('potential range: null fails when range is restricted', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, potential: null }),
      makePlayer({ bbPlayerId: 2, potential: 8 }),
      makePlayer({ bbPlayerId: 3, potential: 3 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, potMin: 5, potMax: 11 });
    // null and 3 fail, 8 passes
    expect(result).toHaveLength(1);
    expect(result[0].bbPlayerId).toBe(2);
  });
});

// ─── skill min filters ───────────────────────────────────────────────────────

function fullSkills(overrides: Partial<Record<string, number | null>> = {}): Record<string, number | null> {
  return {
    jump_shot: null, jump_range: null, outside_def: null, handling: null,
    driving: null, passing: null, inside_shot: null, inside_def: null,
    rebounding: null, shot_blocking: null, stamina: null, free_throw: null,
    ...overrides,
  };
}

describe('skill min filters', () => {
  it('passes players at/above threshold, fails below', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: 11 }) }),
      makePlayer({ bbPlayerId: 2, skills: fullSkills({ outside_def: 10 }) }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, skillMins: { outside_def: '11' } });
    expect(result.map((r) => r.bbPlayerId)).toEqual([1]);
  });

  it('null or missing skills fail when that filter is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: null }) }),
      makePlayer({ bbPlayerId: 2, skills: null }),
      makePlayer({ bbPlayerId: 3, skills: fullSkills({ outside_def: 12 }) }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, skillMins: { outside_def: '5' } });
    expect(result.map((r) => r.bbPlayerId)).toEqual([3]);
  });

  it('multiple skill mins combine with AND', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: 11, jump_shot: 13, passing: 8 }) }),
      makePlayer({ bbPlayerId: 2, skills: fullSkills({ outside_def: 11, jump_shot: 12, passing: 8 }) }),
    ];
    const result = filterRows(rows, {
      ...DEFAULT_FILTER,
      skillMins: { outside_def: '11', jump_shot: '13', passing: '8' },
    });
    expect(result.map((r) => r.bbPlayerId)).toEqual([1]);
  });

  it('empty-string min is inactive (nulls pass)', () => {
    const rows = [makePlayer({ skills: null })];
    expect(filterRows(rows, { ...DEFAULT_FILTER, skillMins: { outside_def: '' } })).toHaveLength(1);
  });

  it('isFilterDefault: {} and all-empty are default; a set min is not', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER, skillMins: {} })).toBe(true);
    expect(isFilterDefault({ ...DEFAULT_FILTER, skillMins: { passing: '' } })).toBe(true);
    expect(isFilterDefault({ ...DEFAULT_FILTER, skillMins: { passing: '8' } })).toBe(false);
  });

  it('countActiveSkillMins counts non-empty entries', () => {
    expect(countActiveSkillMins({})).toBe(0);
    expect(countActiveSkillMins({ passing: '8', outside_def: '', jump_shot: '13' })).toBe(2);
  });
});

// ─── isFilterDefault ─────────────────────────────────────────────────────────

describe('isFilterDefault', () => {
  it('returns true for default filter', () => {
    expect(isFilterDefault(DEFAULT_FILTER)).toBe(true);
  });

  it('returns false when name is set', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER, name: 'test' })).toBe(false);
  });

  it('returns false when ageMin changes', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER, ageMin: 19 })).toBe(false);
  });

  it('returns false when fullSkillsOnly is true', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER, fullSkillsOnly: true })).toBe(false);
  });

  it('returns false when minTsp is set', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER, minTsp: '100' })).toBe(false);
  });
});

// ─── nextSortState ───────────────────────────────────────────────────────────

describe('nextSortState', () => {
  it('clicking a different column starts at desc', () => {
    const current: SortState = { key: 'dmi', direction: 'desc' };
    expect(nextSortState(current, 'tsp')).toEqual({ key: 'tsp', direction: 'desc' });
  });

  it('clicking active desc column → asc', () => {
    const current: SortState = { key: 'dmi', direction: 'desc' };
    expect(nextSortState(current, 'dmi')).toEqual({ key: 'dmi', direction: 'asc' });
  });

  it('clicking active asc column → desc', () => {
    const current: SortState = { key: 'dmi', direction: 'asc' };
    expect(nextSortState(current, 'dmi')).toEqual({ key: 'dmi', direction: 'desc' });
  });
});

// ─── DEFAULT_SORT ─────────────────────────────────────────────────────────────

describe('DEFAULT_SORT', () => {
  it('slovenia defaults to tsp desc', () => {
    expect(DEFAULT_SORT.slovenia).toEqual({ key: 'tsp', direction: 'desc' });
  });

  it('world defaults to dmi desc', () => {
    expect(DEFAULT_SORT.world).toEqual({ key: 'dmi', direction: 'desc' });
  });
});

// ─── sanitizeShowSkills ───────────────────────────────────────────────────────

import { sanitizeShowSkills } from './table';

describe('sanitizeShowSkills', () => {
  it('returns true when stored value is true', () => {
    expect(sanitizeShowSkills(true, false)).toBe(true);
  });

  it('returns false when stored value is false', () => {
    expect(sanitizeShowSkills(false, true)).toBe(false);
  });

  it('falls back to page default when stored value is undefined', () => {
    expect(sanitizeShowSkills(undefined, true)).toBe(true);
    expect(sanitizeShowSkills(undefined, false)).toBe(false);
  });

  it('falls back to page default when stored value is not a boolean (e.g. string)', () => {
    expect(sanitizeShowSkills('yes' as unknown as boolean, true)).toBe(true);
    expect(sanitizeShowSkills(1 as unknown as boolean, false)).toBe(false);
  });

  it('falls back to page default when stored value is null', () => {
    expect(sanitizeShowSkills(null as unknown as boolean, true)).toBe(true);
  });
});
