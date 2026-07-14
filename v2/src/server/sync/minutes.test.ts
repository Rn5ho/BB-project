import { describe, expect, it } from 'vitest';
import { isCountableType, seasonWeekOf } from './minutes';

describe('isCountableType', () => {
  it.each([
    ['league.rs', true], ['league.rs.tv', true], ['league.quarterfinal', true],
    ['cup', true], ['friendly', true], ['pl.rs', true],
    ['bbm', false], ['bbm.playoff', false], ['nt.roundrobin', false],
    ['unknown', false], ['b3.final', false],
  ])('%s -> %s', (t, want) => expect(isCountableType(t)).toBe(want));
});

describe('seasonWeekOf', () => {
  const start = new Date('2026-06-05T00:00:00Z');
  it('day 0 is week 1', () => expect(seasonWeekOf(new Date('2026-06-05T12:00:00Z'), start)).toBe(1));
  it('day 6 is week 1', () => expect(seasonWeekOf(new Date('2026-06-11T23:00:00Z'), start)).toBe(1));
  it('day 7 is week 2', () => expect(seasonWeekOf(new Date('2026-06-12T01:00:00Z'), start)).toBe(2));
  it('day 70 is week 11', () => expect(seasonWeekOf(new Date('2026-08-14T12:00:00Z'), start)).toBe(11));
});
