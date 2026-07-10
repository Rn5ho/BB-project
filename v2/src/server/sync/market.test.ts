import { describe, it, expect } from 'vitest';
import { listedAgoHours, pageIsStale } from './market';

const asOf = new Date('2026-07-10T17:43:11');

describe('listedAgoHours', () => {
  it('a listing ending in 3 minutes was listed ~72h ago', () => {
    const ends = new Date('2026-07-10T17:45:55');
    expect(listedAgoHours(ends, asOf)).toBeGreaterThan(71);
  });
  it('a listing ending in 71h was listed ~1h ago', () => {
    const ends = new Date(asOf.getTime() + 71 * 3600_000);
    expect(listedAgoHours(ends, asOf)).toBeLessThan(2);
  });
});

describe('pageIsStale', () => {
  const fresh = { auctionEnds: new Date(asOf.getTime() + 70 * 3600_000) };
  const stale = { auctionEnds: new Date(asOf.getTime() + 10 * 3600_000) };
  it('stale only when ALL cards are older than the threshold', () => {
    expect(pageIsStale([stale, stale] as never, asOf, 30)).toBe(true);
    expect(pageIsStale([stale, fresh] as never, asOf, 30)).toBe(false);
  });
  it('cards without auction end are treated as fresh (never stop on them)', () => {
    expect(pageIsStale([{ auctionEnds: null }] as never, asOf, 30)).toBe(false);
  });
});
