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

  it('caps top paths at ten and returns them in descending order', () => {
    // Create 15 paths with descending view counts: p0 gets 15 views, p1 gets 14, ..., p14 gets 1.
    const rows = [];
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15 - i; j++) {
        rows.push({
          occurredAt: new Date('2026-08-06T09:00:00Z'),
          sessionId: `s${j}`,
          event: 'pageview',
          path: `/p${i}`,
        });
      }
    }

    const result = summarizeGuestEvents(rows, { days: 30, now: NOW });
    expect(result.topPaths).toHaveLength(10);
    // Verify it's the top 10 by views, in descending order, with correct counts.
    expect(result.topPaths[0]).toEqual({ path: '/p0', views: 15 });
    expect(result.topPaths[1]).toEqual({ path: '/p1', views: 14 });
    expect(result.topPaths[9]).toEqual({ path: '/p9', views: 6 });
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

  it('counts sessions separately per day but distinct sessions overall', () => {
    // Session a appears on days 1, 2, 3; session b appears on day 2 only.
    const s = summarizeGuestEvents(
      [
        view('2026-08-04', 'a'),
        view('2026-08-04', 'a'), // Same session, same day
        view('2026-08-05', 'a'), // Same session, different day
        view('2026-08-05', 'b'), // Different session
        view('2026-08-06', 'a'), // Same session again
      ],
      { days: 3, now: NOW },
    );

    expect(s.distinctSessions).toBe(2); // Only sessions a and b globally
    expect(s.totalViews).toBe(5);

    // Per-day session counts reflect only the sessions active that day.
    expect(s.perDay[0]).toEqual({ day: '2026-08-04', views: 2, sessions: 1 }); // Only session a
    expect(s.perDay[1]).toEqual({ day: '2026-08-05', views: 2, sessions: 2 }); // Sessions a and b
    expect(s.perDay[2]).toEqual({ day: '2026-08-06', views: 1, sessions: 1 }); // Only session a
  });

  it('excludes rows well outside the window from all totals, not just perDay', () => {
    // Simulate rows from a much earlier period being passed in together with in-window rows.
    const s = summarizeGuestEvents(
      [
        view('2026-08-06', 'a'), // In window
        { occurredAt: new Date('2026-01-01T09:00:00Z'), sessionId: 'old', event: 'pageview', path: '/x' }, // Way outside
        { occurredAt: new Date('2026-01-01T09:00:00Z'), sessionId: 'old', event: 'login', path: null }, // Way outside login
      ],
      { days: 3, now: NOW },
    );

    // Window-scoped totals: outside rows must not affect these.
    expect(s.totalViews).toBe(1); // Only the in-window view
    expect(s.distinctSessions).toBe(1); // Only session 'a'
    expect(s.logins).toBe(0); // Login from 'old' session excluded
    expect(s.lastSeenAt?.toISOString()).toBe('2026-08-06T09:00:00.000Z'); // Not the old login
  });
});
