import { describe, it, expect } from 'vitest';
import {
  sortRows,
  filterRows,
  nextSortState,
  isFilterDefault,
  countActiveSkillMins,
  countActiveMoreFilters,
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
    insideTsp: null,
    outsideTsp: null,
    skills: null,
    skillsCapturedAt: null,
    hasFullSkills: false,
    skillDeltas: null,
    tspDelta: null,
    scoutedThisSeason: false,
    onMarketUntil: null,
    lastListedPrice: null,
    isRookie: false,
    firstSeenAt: null,
    ownerTeamId: null,
    ownerTeamName: null,
    ownerManager: null,
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
    expect(filterRows(rows, DEFAULT_FILTER.slovenia)).toHaveLength(2);
  });

  it('filters by name substring (case-insensitive)', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, name: 'Janez Novak' }),
      makePlayer({ bbPlayerId: 2, name: 'Miha Horvat' }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, name: 'novak' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Janez Novak');
  });

  it('diacritic-insensitive search: "Zuzek" matches "Žužek"', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, name: 'Žužek' }),
      makePlayer({ bbPlayerId: 2, name: 'Normal Name' }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, name: 'Zuzek' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Žužek');
  });

  it('diacritic-insensitive search: "zuzek" (lower) matches "Žužek"', () => {
    const rows = [makePlayer({ bbPlayerId: 1, name: 'Žužek' })];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, name: 'zuzek' });
    expect(result).toHaveLength(1);
  });

  it('age null rows PASS the age filter', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, ageNow: null }),
      makePlayer({ bbPlayerId: 2, ageNow: 25 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, ageMin: 18, ageMax: 21 });
    // null age passes; age 25 is outside 18-21 so fails
    expect(result).toHaveLength(1);
    expect(result[0].ageNow).toBeNull();
  });

  it('age within range passes', () => {
    const rows = [makePlayer({ ageNow: 20 })];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, ageMin: 18, ageMax: 21 })).toHaveLength(1);
  });

  it('age outside range fails', () => {
    const rows = [makePlayer({ ageNow: 22 })];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, ageMin: 18, ageMax: 21 })).toHaveLength(0);
  });

  it('position filter: empty string means All', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, bestPosition: 'PG' }),
      makePlayer({ bbPlayerId: 2, bestPosition: 'C' }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, position: '' })).toHaveLength(2);
  });

  it('position filter: specific position filters correctly', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, bestPosition: 'PG' }),
      makePlayer({ bbPlayerId: 2, bestPosition: 'C' }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, position: 'PG' })).toHaveLength(1);
  });

  it('fullSkillsOnly: filters out rows without full skills', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, hasFullSkills: true }),
      makePlayer({ bbPlayerId: 2, hasFullSkills: false }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, fullSkillsOnly: true })).toHaveLength(1);
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, fullSkillsOnly: true })[0].bbPlayerId).toBe(1);
  });

  it('min TSP: null TSP FAILS when min is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: null }),
      makePlayer({ bbPlayerId: 2, tsp: 150 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, minTsp: '100' });
    expect(result).toHaveLength(1);
    expect(result[0].bbPlayerId).toBe(2);
  });

  it('min TSP: passes rows above threshold', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: 80 }),
      makePlayer({ bbPlayerId: 2, tsp: 120 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, minTsp: '100' });
    expect(result).toHaveLength(1);
    expect(result[0].bbPlayerId).toBe(2);
  });

  it('min TSP empty string: inactive, nulls pass', () => {
    const rows = [makePlayer({ tsp: null }), makePlayer({ tsp: 50 })];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, minTsp: '' })).toHaveLength(2);
  });

  it('min DMI: null DMI fails when filter is set', () => {
    const rows = [makePlayer({ dmi: null }), makePlayer({ dmi: 20000 })];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, minDmi: '10000' });
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
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, heightMin: '180', heightMax: '200' });
    // 190 passes, others fail (175 < 180, 205 > 200, null fails min)
    expect(result).toHaveLength(1);
    expect(result[0].bbPlayerId).toBe(2);
  });

  it('min game shape: null fails when filter is set', () => {
    const rows = [makePlayer({ gameShape: null }), makePlayer({ gameShape: 7 })];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, minGameShape: '5' });
    expect(result).toHaveLength(1);
    expect(result[0].gameShape).toBe(7);
  });

  it('potential range: null fails when range is restricted', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, potential: null }),
      makePlayer({ bbPlayerId: 2, potential: 8 }),
      makePlayer({ bbPlayerId: 3, potential: 3 }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, potMin: 5, potMax: 11 });
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
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, skillMins: { outside_def: '11' } });
    expect(result.map((r) => r.bbPlayerId)).toEqual([1]);
  });

  it('null or missing skills fail when that filter is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: null }) }),
      makePlayer({ bbPlayerId: 2, skills: null }),
      makePlayer({ bbPlayerId: 3, skills: fullSkills({ outside_def: 12 }) }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER.slovenia, skillMins: { outside_def: '5' } });
    expect(result.map((r) => r.bbPlayerId)).toEqual([3]);
  });

  it('multiple skill mins combine with AND', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: 11, jump_shot: 13, passing: 8 }) }),
      makePlayer({ bbPlayerId: 2, skills: fullSkills({ outside_def: 11, jump_shot: 12, passing: 8 }) }),
    ];
    const result = filterRows(rows, {
      ...DEFAULT_FILTER.slovenia,
      skillMins: { outside_def: '11', jump_shot: '13', passing: '8' },
    });
    expect(result.map((r) => r.bbPlayerId)).toEqual([1]);
  });

  it('empty-string min is inactive (nulls pass)', () => {
    const rows = [makePlayer({ skills: null })];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, skillMins: { outside_def: '' } })).toHaveLength(1);
  });

  it('isFilterDefault: {} and all-empty are default; a set min is not', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, skillMins: {} }, 'slovenia')).toBe(true);
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, skillMins: { passing: '' } }, 'slovenia')).toBe(true);
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, skillMins: { passing: '8' } }, 'slovenia')).toBe(false);
  });

  it('countActiveSkillMins counts non-empty entries', () => {
    expect(countActiveSkillMins({})).toBe(0);
    expect(countActiveSkillMins({ passing: '8', outside_def: '', jump_shot: '13' })).toBe(2);
  });
});

// ─── isFilterDefault ─────────────────────────────────────────────────────────

describe('isFilterDefault', () => {
  it('returns true for default filter', () => {
    expect(isFilterDefault(DEFAULT_FILTER.slovenia, 'slovenia')).toBe(true);
  });

  it('returns false when name is set', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, name: 'test' }, 'slovenia')).toBe(false);
  });

  it('returns false when ageMin changes', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, ageMin: 19 }, 'slovenia')).toBe(false);
  });

  it('returns false when fullSkillsOnly is true', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, fullSkillsOnly: true }, 'slovenia')).toBe(false);
  });

  it('returns false when minTsp is set', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, minTsp: '100' }, 'slovenia')).toBe(false);
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

  it('seniors defaults to tsp desc', () => {
    expect(DEFAULT_SORT.seniors).toEqual({ key: 'tsp', direction: 'desc' });
  });
});

// ─── max bounds + inside/outside filters ──────────────────────────────────────

describe('max bounds + inside/outside filters', () => {
  it('maxTsp excludes rows above the bound and null-tsp rows', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: 80 }),
      makePlayer({ bbPlayerId: 2, tsp: 120 }),
      makePlayer({ bbPlayerId: 3, tsp: null }),
    ];
    const out = filterRows(rows, { ...DEFAULT_FILTER.slovenia, maxTsp: '100' });
    expect(out.map((r) => r.bbPlayerId)).toEqual([1]);
  });
  it('min+max TSP form a band', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: 50 }),
      makePlayer({ bbPlayerId: 2, tsp: 90 }),
      makePlayer({ bbPlayerId: 3, tsp: 130 }),
    ];
    const out = filterRows(rows, { ...DEFAULT_FILTER.slovenia, minTsp: '60', maxTsp: '100' });
    expect(out.map((r) => r.bbPlayerId)).toEqual([2]);
  });
  it('maxDmi excludes rows above the bound and null-dmi rows', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, dmi: 5000 }),
      makePlayer({ bbPlayerId: 2, dmi: 20000 }),
      makePlayer({ bbPlayerId: 3, dmi: null }),
    ];
    const out = filterRows(rows, { ...DEFAULT_FILTER.slovenia, maxDmi: '10000' });
    expect(out.map((r) => r.bbPlayerId)).toEqual([1]);
  });
  it('inside TSP min/max; nulls fail when a bound is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, insideTsp: 20 }),
      makePlayer({ bbPlayerId: 2, insideTsp: 45 }),
      makePlayer({ bbPlayerId: 3, insideTsp: null }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, minInsideTsp: '30' }).map((r) => r.bbPlayerId)).toEqual([2]);
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, maxInsideTsp: '30' }).map((r) => r.bbPlayerId)).toEqual([1]);
  });
  it('outside TSP min/max; nulls fail when a bound is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, outsideTsp: 40 }),
      makePlayer({ bbPlayerId: 2, outsideTsp: 70 }),
      makePlayer({ bbPlayerId: 3, outsideTsp: null }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, minOutsideTsp: '50' }).map((r) => r.bbPlayerId)).toEqual([2]);
    expect(filterRows(rows, { ...DEFAULT_FILTER.slovenia, maxOutsideTsp: '50' }).map((r) => r.bbPlayerId)).toEqual([1]);
  });
});

// ─── inside/outside sort keys ──────────────────────────────────────────────────

describe('inside/outside sort keys', () => {
  it('sorts insideTsp desc with nulls last', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, insideTsp: null }),
      makePlayer({ bbPlayerId: 2, insideTsp: 30 }),
      makePlayer({ bbPlayerId: 3, insideTsp: 50 }),
    ];
    const sorted = sortRows(rows, { key: 'insideTsp', direction: 'desc' });
    expect(sorted.map((r) => r.bbPlayerId)).toEqual([3, 2, 1]);
  });
  it('sorts outsideTsp asc with nulls last', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, outsideTsp: 70 }),
      makePlayer({ bbPlayerId: 2, outsideTsp: null }),
      makePlayer({ bbPlayerId: 3, outsideTsp: 40 }),
    ];
    const sorted = sortRows(rows, { key: 'outsideTsp', direction: 'asc' });
    expect(sorted.map((r) => r.bbPlayerId)).toEqual([3, 1, 2]);
  });
});

// ─── countActiveMoreFilters ───────────────────────────────────────────────────

describe('countActiveMoreFilters', () => {
  it('is 0 on defaults', () => expect(countActiveMoreFilters(DEFAULT_FILTER.slovenia)).toBe(0));
  it('counts each non-empty More-panel field', () => {
    expect(countActiveMoreFilters({ ...DEFAULT_FILTER.slovenia, maxTsp: '100', heightMin: '190' })).toBe(2);
    expect(countActiveMoreFilters({ ...DEFAULT_FILTER.slovenia, minOutsideTsp: '50' })).toBe(1);
  });
  it('ignores whitespace-only values', () => {
    expect(countActiveMoreFilters({ ...DEFAULT_FILTER.slovenia, minDmi: '  ' })).toBe(0);
  });
});

// ─── isFilterDefault with new fields ───────────────────────────────────────────

describe('isFilterDefault with new fields', () => {
  it('is false when any new bound is set', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, maxTsp: '100' }, 'slovenia')).toBe(false);
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, maxDmi: '9' }, 'slovenia')).toBe(false);
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, minInsideTsp: '1' }, 'slovenia')).toBe(false);
    expect(isFilterDefault({ ...DEFAULT_FILTER.slovenia, maxOutsideTsp: '1' }, 'slovenia')).toBe(false);
  });
  it('is true on defaults', () => expect(isFilterDefault(DEFAULT_FILTER.slovenia, 'slovenia')).toBe(true));
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

// ─── per-variant DEFAULT_FILTER ───────────────────────────────────────────────

describe('per-variant DEFAULT_FILTER', () => {
  it('slovenia and world default to age 18–21', () => {
    for (const v of ['slovenia', 'world'] as const) {
      expect(DEFAULT_FILTER[v].ageMin).toBe(18);
      expect(DEFAULT_FILTER[v].ageMax).toBe(21);
    }
  });

  it('seniors defaults to age 22–45', () => {
    expect(DEFAULT_FILTER.seniors.ageMin).toBe(22);
    expect(DEFAULT_FILTER.seniors.ageMax).toBe(45);
  });

  it('variants only diverge on the age window', () => {
    const stripAges = ({ ageMin, ageMax, ...rest }: FilterState) => (void ageMin, void ageMax, rest);
    expect(stripAges(DEFAULT_FILTER.seniors)).toEqual(stripAges(DEFAULT_FILTER.slovenia));
    expect(DEFAULT_FILTER.world).toEqual(DEFAULT_FILTER.slovenia);
  });

  it('filterRows with seniors defaults passes 22–45 and fails younger', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, ageNow: 20 }),
      makePlayer({ bbPlayerId: 2, ageNow: 22 }),
      makePlayer({ bbPlayerId: 3, ageNow: 31 }),
      makePlayer({ bbPlayerId: 4, ageNow: null }), // nulls pass the age filter
    ];
    const out = filterRows(rows, DEFAULT_FILTER.seniors);
    expect(out.map((r) => r.bbPlayerId)).toEqual([2, 3, 4]);
  });
});

// ─── isFilterDefault per variant ──────────────────────────────────────────────

describe('isFilterDefault per variant', () => {
  it('each variant default is default for itself', () => {
    for (const v of ['slovenia', 'world', 'seniors'] as const) {
      expect(isFilterDefault(DEFAULT_FILTER[v], v)).toBe(true);
    }
  });

  it('seniors defaults are NOT default for world (age windows differ)', () => {
    expect(isFilterDefault(DEFAULT_FILTER.seniors, 'world')).toBe(false);
    expect(isFilterDefault(DEFAULT_FILTER.world, 'seniors')).toBe(false);
  });

  it('changing the age window off the seniors default is dirty', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER.seniors, ageMax: 30 }, 'seniors')).toBe(false);
    expect(isFilterDefault({ ...DEFAULT_FILTER.seniors, ageMin: 18 }, 'seniors')).toBe(false);
  });
});

// ─── seniors localStorage round-trip ──────────────────────────────────────────

describe('seniors sanitize round-trip', () => {
  it('JSON round-trip of the seniors defaults (as PlayerTable stores them) stays default', () => {
    // PlayerTable persists { filter } via JSON and rehydrates by spreading over the
    // variant's defaults — the round-tripped seniors defaults must still read as default.
    const stored = JSON.parse(JSON.stringify(DEFAULT_FILTER.seniors)) as FilterState;
    const rehydrated: FilterState = { ...DEFAULT_FILTER.seniors, ...stored };
    expect(rehydrated).toEqual(DEFAULT_FILTER.seniors);
    expect(isFilterDefault(rehydrated, 'seniors')).toBe(true);
  });

  it('a stored non-default seniors filter survives the round-trip as dirty', () => {
    const dirty: FilterState = { ...DEFAULT_FILTER.seniors, ageMax: 28, minTsp: '120' };
    const rehydrated: FilterState = { ...DEFAULT_FILTER.seniors, ...JSON.parse(JSON.stringify(dirty)) };
    expect(rehydrated.ageMax).toBe(28);
    expect(rehydrated.minTsp).toBe('120');
    expect(isFilterDefault(rehydrated, 'seniors')).toBe(false);
  });
});
