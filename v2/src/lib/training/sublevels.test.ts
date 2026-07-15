import { describe, expect, it } from 'vitest';
import { sublevelBound, MAX_WEEKLY_GAIN, type PopAnchor } from './sublevels';

const d = (s: string) => new Date(s);
const anchor = (over: Partial<PopAnchor>): PopAnchor => ({
  skill: 'js', toDisplayed: 8, windowStart: d('2026-07-01T00:00:00Z'), windowEnd: d('2026-07-01T00:00:00Z'), ...over,
});

describe('sublevelBound', () => {
  it('no anchor: full displayed band', () => {
    expect(sublevelBound(8, null, d('2026-07-15T00:00:00Z'))).toEqual({ low: 7.01, high: 7.99 });
  });
  it('fresh exact-date pop: tight band just above the crossing', () => {
    const b = sublevelBound(8, anchor({}), d('2026-07-01T00:00:00Z'));
    expect(b.low).toBeCloseTo(7.01, 5);
    expect(b.high).toBeCloseTo(7.01, 5);
  });
  it('pop two weeks ago: band grows by MAX_WEEKLY_GAIN per week', () => {
    const b = sublevelBound(8, anchor({}), d('2026-07-15T00:00:00Z'));
    expect(b.high).toBeCloseTo(7.01 + 2 * MAX_WEEKLY_GAIN, 5);
  });
  it('stale pop: falls back to the full band', () => {
    const b = sublevelBound(8, anchor({ windowStart: d('2026-01-01T00:00:00Z') }), d('2026-07-15T00:00:00Z'));
    expect(b).toEqual({ low: 7.01, high: 7.99 });
  });
  it('anchor for a different displayed level is ignored', () => {
    const b = sublevelBound(9, anchor({ toDisplayed: 8 }), d('2026-07-02T00:00:00Z'));
    expect(b).toEqual({ low: 8.01, high: 8.99 });
  });
});
