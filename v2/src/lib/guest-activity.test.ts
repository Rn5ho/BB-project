import { describe, it, expect } from 'vitest';
import { summarizeGuestEvents } from './guest-activity';

const NOW = new Date('2026-08-06T12:00:00Z');

function view(day: string, sessionId: string, path = '/slovenia', time = '09:00:00') {
  return { occurredAt: new Date(`${day}T${time}Z`), sessionId, event: 'pageview', path };
}

describe('summarizeGuestEvents', () => {
  it('returns an empty summary with a zero-filled window for no rows', () => {
    const s = summarizeGuestEvents([], { days: 30, now: NOW });
    expect(s.totalViews).toBe(0);
    expect(s.distinctSessions).toBe(0);
    expect(s.logins).toBe(0);
    expect(s.lastSeenAt).toBe(null);
    expect(s.topPaths).toEqual([]);
    expect(s.perDay).toHaveLength(30);
    expect(s.perDay.every((d) => d.views === 0 && d.sessions === 0)).toBe(true);
  });

  it('counts views and distinct sessions', () => {
    const s = summarizeGuestEvents(
      [
        view('2026-08-06', 'a'),
        view('2026-08-06', 'a', '/world'),
        view('2026-08-05', 'b'),
      ],
      { days: 30, now: NOW },
    );
    expect(s.totalViews).toBe(3);
    expect(s.distinctSessions).toBe(2);
  });

  it('excludes login rows from the view count but counts them separately', () => {
    const s = summarizeGuestEvents(
      [
        { occurredAt: new Date('2026-08-06T08:00:00Z'), sessionId: 'a', event: 'login', path: null },
        view('2026-08-06', 'a'),
      ],
      { days: 30, now: NOW },
    );
    expect(s.totalViews).toBe(1);
    expect(s.logins).toBe(1);
    expect(s.distinctSessions).toBe(1);
  });

  it('buckets per day in UTC, oldest first, with zero days kept', () => {
    const s = summarizeGuestEvents(
      [view('2026-08-06', 'a'), view('2026-08-06', 'b'), view('2026-08-04', 'c')],
      { days: 3, now: NOW },
    );
    expect(s.perDay).toEqual([
      { day: '2026-08-04', views: 1, sessions: 1 },
      { day: '2026-08-05', views: 0, sessions: 0 },
      { day: '2026-08-06', views: 2, sessions: 2 },
    ]);
  });

  it('ranks top paths by views', () => {
    const s = summarizeGuestEvents(
      [
        view('2026-08-06', 'a', '/world'),
        view('2026-08-06', 'b', '/world'),
        view('2026-08-06', 'c', '/slovenia'),
      ],
      { days: 30, now: NOW },
    );
    expect(s.topPaths).toEqual([
      { path: '/world', views: 2 },
      { path: '/slovenia', views: 1 },
    ]);
  });

  it('caps top paths at ten', () => {
    const rows = Array.from({ length: 15 }, (_, i) => view('2026-08-06', 's', `/p${i}`));
    expect(summarizeGuestEvents(rows, { days: 30, now: NOW }).topPaths).toHaveLength(10);
  });

  it('reports the most recent activity, including a login', () => {
    const s = summarizeGuestEvents(
      [
        view('2026-08-05', 'a'),
        { occurredAt: new Date('2026-08-06T11:00:00Z'), sessionId: 'a', event: 'login', path: null },
      ],
      { days: 30, now: NOW },
    );
    expect(s.lastSeenAt?.toISOString()).toBe('2026-08-06T11:00:00.000Z');
  });

  it('ignores rows older than the window when bucketing', () => {
    const s = summarizeGuestEvents(
      [view('2026-08-06', 'a'), view('2026-01-01', 'old')],
      { days: 3, now: NOW },
    );
    expect(s.perDay).toHaveLength(3);
    expect(s.perDay.reduce((n, d) => n + d.views, 0)).toBe(1);
  });
});
