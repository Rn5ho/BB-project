import { describe, it, expect } from 'vitest';
import { listedAgoHours, pageIsStale, applySweepScope, SENIOR_NT_SWEEP_OPTS } from './market';

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

describe('applySweepScope', () => {
  // The search form as collectFormFields sees it: BB prefills the money caps with
  // the current market maxima.
  const formFields = {
    'ctl00$cphContent$tbMaxSalary': '532489',
    'ctl00$cphContent$tbMaxCurrentBid': '20000000',
    'ctl00$cphContent$ddlCountry': '0',
  };

  it('default opts reproduce the daily U21 search exactly', () => {
    const f = applySweepScope(formFields, {});
    expect(f['ctl00$cphContent$tbMinAge']).toBe('18');
    expect(f['ctl00$cphContent$tbMaxAge']).toBe('21');
    expect(f['ctl00$cphContent$ddlPotentialMin']).toBe('6');
    expect(f['ctl00$cphContent$ddlsortBy']).toBe('2'); // newest-first
    expect('ctl00$cphContent$cbIsOnNT' in f).toBe(false); // unchecked checkboxes are absent from a POST
    // the form's prefilled money caps pass through untouched
    expect(f['ctl00$cphContent$tbMaxSalary']).toBe('532489');
    expect(f['ctl00$cphContent$tbMaxCurrentBid']).toBe('20000000');
  });

  it('SENIOR_NT_SWEEP_OPTS: 22+, open-ended, no potential floor, IsOnNT, blanked money caps', () => {
    const f = applySweepScope(formFields, SENIOR_NT_SWEEP_OPTS);
    expect(f['ctl00$cphContent$tbMinAge']).toBe('22');
    expect(f['ctl00$cphContent$tbMaxAge']).toBe(''); // maxAge: null → empty = no upper bound
    expect(f['ctl00$cphContent$ddlPotentialMin']).toBe('0');
    expect(f['ctl00$cphContent$cbIsOnNT']).toBe('on');
    expect(f['ctl00$cphContent$tbMaxSalary']).toBe('');
    expect(f['ctl00$cphContent$tbMaxCurrentBid']).toBe('');
  });

  it('oldestFirst flips the sort order', () => {
    expect(applySweepScope({}, { oldestFirst: true })['ctl00$cphContent$ddlsortBy']).toBe('1');
    expect(applySweepScope({}, { ...SENIOR_NT_SWEEP_OPTS, oldestFirst: true })['ctl00$cphContent$ddlsortBy']).toBe('1');
  });

  it('is pure — the input field map is not mutated', () => {
    const input = { ...formFields };
    applySweepScope(input, SENIOR_NT_SWEEP_OPTS);
    expect(input).toEqual(formFields);
  });
});
