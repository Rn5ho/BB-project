import { describe, it, expect } from 'vitest';
import { mapApiPlayerToPlayer, mapApiPlayerToSnapshot, splitAgeWindows, POSITION_NAMES, type BbApiPlayer } from './players-api';

const api: BbApiPlayer = {
  playerId: 55158715, firstName: 'Milan', lastName: 'Peterec',
  teamId: 114522, teamName: 'KK Pragersko II', countryId: 66, isUtopian: false,
  position: 1, age: 20, potential: 8, salary: 12346, height: 77,
  isForSale: false, seasonDrafted: 69, gs: 8, dmi: 157700,
  isInjured: false, injuredWeeks: 0,
};

describe('mapApiPlayerToPlayer', () => {
  const row = mapApiPlayerToPlayer(api, 'Slovenija');
  it('keys by playerId', () => expect(row.bbPlayerId).toBe(55158715));
  it('joins the name', () => expect(row.name).toBe('Milan Peterec'));
  it('converts inches to cm', () => expect(row.heightCm).toBe(196));
  it('maps numeric position', () => expect(row.bestPosition).toBe('PG'));
  it('carries countryId + catalog nationality', () => {
    expect(row.countryId).toBe(66);
    expect(row.nationality).toBe('Slovenija');
  });
  it('tolerates position 0/undefined as null', () =>
    expect(mapApiPlayerToPlayer({ ...api, position: 0 }, 'Slovenija').bestPosition).toBeNull());
});

describe('mapApiPlayerToSnapshot', () => {
  const snap = mapApiPlayerToSnapshot(api, 72);
  it('is a light snapshot', () => {
    expect(snap.source).toBe('api');
    expect(snap).not.toHaveProperty('jumpShot');
  });
  it('carries season/age/dmi/gs/salary/potential/owner', () => {
    expect(snap.season).toBe(72);
    expect(snap.age).toBe(20);
    expect(snap.dmi).toBe(157700);
    expect(snap.gameShape).toBe(8);
    expect(snap.salary).toBe(12346);
    expect(snap.potential).toBe(8);
    expect(snap.ownerTeamId).toBe(114522);
    expect(snap.ownerTeamName).toBe('KK Pragersko II');
  });
});

describe('splitAgeWindows', () => {
  it('starts with the full window', () => expect(splitAgeWindows(18, 21)).toEqual([[18, 21]]));
  it('splits a window into single ages', () =>
    expect(splitAgeWindows(18, 21, true)).toEqual([[18, 18], [19, 19], [20, 20], [21, 21]]));
});

describe('POSITION_NAMES', () => {
  it('maps 1..5', () => expect([1, 2, 3, 4, 5].map((n) => POSITION_NAMES[n])).toEqual(['PG', 'SG', 'SF', 'PF', 'C']));
});
