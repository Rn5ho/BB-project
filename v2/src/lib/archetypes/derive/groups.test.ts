import { describe, it, expect } from 'vitest';
import { balance, assignGroup, osp, isp, type CohortPlayer } from './groups';

function player(over: Partial<CohortPlayer> & { skills: CohortPlayer['skills'] }): CohortPlayer {
  return { playerId: 1, name: 'T', heightCm: 190, potential: 8, salary: null, startingPrice: null,
    ownerTeamName: null, nationality: null, stamina: null, freeThrow: null,
    tsp: Object.values(over.skills).reduce((a, b) => a + b, 0), ...over };
}
const GUARD = { js: 16, jr: 11, od: 15, ha: 16, dr: 17, pa: 8, is: 11, id: 7, rb: 5, sb: 4 };
const BIG = { js: 9, jr: 6, od: 7, ha: 10, dr: 9, pa: 6, is: 19, id: 17, rb: 14, sb: 14 };
const FLAT = { js: 10, jr: 10, od: 10, ha: 10, dr: 10, pa: 10, is: 10, id: 10, rb: 10, sb: 10 };

describe('balance', () => {
  it('is OSP/6 minus ISP/4 (per-skill means, not raw sums)', () => {
    expect(osp(GUARD)).toBe(83); expect(isp(GUARD)).toBe(27);
    expect(balance(GUARD)).toBeCloseTo(83 / 6 - 27 / 4, 10);
  });
  it('is zero for a flat player (the 6:4 sum bias is corrected)', () => {
    expect(balance(FLAT)).toBeCloseTo(0, 10);
  });
});

describe('assignGroup', () => {
  it('short outside-leaning -> outside', () => {
    expect(assignGroup(player({ skills: GUARD, heightCm: 190 }))).toBe('outside');
  });
  it('tall inside-leaning -> inside', () => {
    expect(assignGroup(player({ skills: BIG, heightCm: 213 }))).toBe('inside');
  });
  it('tall outside-leaning wing -> wing (not discarded)', () => {
    expect(assignGroup(player({ skills: GUARD, heightCm: 205 }))).toBe('wing');
  });
  it('202cm sits in wing regardless of lean', () => {
    expect(assignGroup(player({ skills: BIG, heightCm: 202 }))).toBe('wing');
  });
  it('flat player inside the deadband -> wing', () => {
    expect(assignGroup(player({ skills: FLAT, heightCm: 190 }))).toBe('wing');
  });
  it('short inside-leaning -> appendix', () => {
    expect(assignGroup(player({ skills: BIG, heightCm: 198 }))).toBe('appendix');
  });
});
