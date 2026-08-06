import { describe, it, expect } from 'vitest';
import { isTrackableNavigation } from './guest-tracking';

/** Minimal stand-in for the NextRequest fields the predicate reads. */
function req(opts: { method?: string; pathname?: string; headers?: Record<string, string> } = {}) {
  const headers = new Headers(opts.headers ?? {});
  return {
    method: opts.method ?? 'GET',
    headers,
    nextUrl: { pathname: opts.pathname ?? '/slovenia' },
  };
}

describe('isTrackableNavigation', () => {
  it('tracks a plain page request', () => {
    expect(isTrackableNavigation(req())).toBe(true);
  });

  it('tracks an in-app RSC navigation', () => {
    expect(isTrackableNavigation(req({ headers: { RSC: '1' } }))).toBe(true);
  });

  it('ignores router prefetches', () => {
    expect(isTrackableNavigation(req({ headers: { 'next-router-prefetch': '1' } }))).toBe(false);
    expect(isTrackableNavigation(req({ headers: { purpose: 'prefetch' } }))).toBe(false);
    expect(isTrackableNavigation(req({ headers: { 'x-purpose': 'prefetch' } }))).toBe(false);
    expect(isTrackableNavigation(req({ headers: { Purpose: 'Prefetch' } }))).toBe(false);
  });

  it('ignores non-GET requests', () => {
    expect(isTrackableNavigation(req({ method: 'POST' }))).toBe(false);
    expect(isTrackableNavigation(req({ method: 'HEAD' }))).toBe(false);
  });

  it('ignores api routes', () => {
    expect(isTrackableNavigation(req({ pathname: '/api/cron/daily' }))).toBe(false);
  });

  it('ignores asset requests', () => {
    expect(isTrackableNavigation(req({ pathname: '/favicon.ico' }))).toBe(false);
    expect(isTrackableNavigation(req({ pathname: '/icon.png' }))).toBe(false);
  });

  it('tracks real routes, including nested and root', () => {
    expect(isTrackableNavigation(req({ pathname: '/' }))).toBe(true);
    expect(isTrackableNavigation(req({ pathname: '/players/12345' }))).toBe(true);
  });
});
