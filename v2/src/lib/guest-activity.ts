/** The event shape this module needs. Declared structurally so the pure summary never
 *  imports the DB layer — that is what keeps it testable without a database. */
export type SummarizableEvent = {
  occurredAt: Date;
  sessionId: string;
  event: string;
  path: string | null;
};

export type GuestActivity = {
  totalViews: number;
  /** Headline number: distinct anonymous sessions. A jump past the handful of people the
   *  password was handed to is the signal that it has spread — rotate it on /settings. */
  distinctSessions: number;
  logins: number;
  lastSeenAt: Date | null;
  perDay: { day: string; views: number; sessions: number }[];
  topPaths: { path: string; views: number }[];
};

const DAY_MS = 86_400_000;
const TOP_PATHS = 10;

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Aggregate raw guest events into everything the settings card displays.
 *  Days bucket by UTC, matching the rest of the project. */
export function summarizeGuestEvents(
  rows: SummarizableEvent[],
  opts: { days: number; now: Date },
): GuestActivity {
  // Seed every day in the window so the bar strip has no gaps, oldest first.
  const perDay = new Map<string, { views: number; sessions: Set<string> }>();
  for (let i = opts.days - 1; i >= 0; i--) {
    perDay.set(utcDay(new Date(opts.now.getTime() - i * DAY_MS)), { views: 0, sessions: new Set() });
  }

  const sessions = new Set<string>();
  const pathViews = new Map<string, number>();
  let totalViews = 0;
  let logins = 0;
  let lastSeenAt: Date | null = null;

  for (const row of rows) {
    if (!lastSeenAt || row.occurredAt > lastSeenAt) lastSeenAt = row.occurredAt;
    if (row.event === 'login') {
      logins++;
      continue;
    }
    if (row.event !== 'pageview') continue;

    totalViews++;
    sessions.add(row.sessionId);
    if (row.path) pathViews.set(row.path, (pathViews.get(row.path) ?? 0) + 1);

    const bucket = perDay.get(utcDay(row.occurredAt));
    if (bucket) {
      bucket.views++;
      bucket.sessions.add(row.sessionId);
    }
  }

  return {
    totalViews,
    distinctSessions: sessions.size,
    logins,
    lastSeenAt,
    perDay: [...perDay].map(([day, v]) => ({ day, views: v.views, sessions: v.sessions.size })),
    topPaths: [...pathViews]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_PATHS)
      .map(([path, views]) => ({ path, views })),
  };
}
