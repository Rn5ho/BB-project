import type { ReactNode } from 'react';
import { db, trackedCountries, syncLog, censusRuns } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { getCountriesCatalog } from '@/server/sync/countries';
import CountryPicker from '@/components/settings/CountryPicker';
import TrackedCountryList from '@/components/settings/TrackedCountryList';
import SyncJobsCard, { type JobLastRun, type CensusLastRun } from '@/components/settings/SyncJobsCard';
import GuestAccessCard from '@/components/settings/GuestAccessCard';
import { getGuestPassword } from '@/queries/app-config';
import GuestActivityCard from '@/components/settings/GuestActivityCard';
import { fetchGuestEvents } from '@/queries/guest-events';
import { summarizeGuestEvents } from '@/lib/guest-activity';
import { formatStartedAt, formatDuration, formatSyncResult, type SyncCounts } from '@/lib/format-sync';
import type { CensusTotals } from '@/lib/format-census';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GUEST_ACTIVITY_DAYS = 30;
// Guest tokens hard-expire after 7 days with no sliding renewal (EXPIRY.guest in
// src/lib/auth.ts), so a 7-day distinct-session count is the one that maps ~1:1 to
// people currently holding the password — the 30-day count is inflated ~4-5x for a
// single continuously-active guest and is not a usable leak signal on its own.
const GUEST_ACTIVITY_RECENT_DAYS = 7;

function lastRunOf(job: string) {
  return db.select().from(syncLog).where(eq(syncLog.jobType, job)).orderBy(desc(syncLog.startedAt)).limit(1);
}

function toJobLastRun(rows: (typeof syncLog.$inferSelect)[]): JobLastRun | null {
  const r = rows[0];
  if (!r) return null;
  return {
    startedAtIso: r.startedAt.toISOString(),
    trigger: r.trigger,
    ok: r.ok,
    counts: r.counts as SyncCounts,
    error: r.error ?? null,
  };
}

function Card({ title, blurb, children }: { title: string; blurb?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 mb-6">
      <h2 className="font-medium mb-1">{title}</h2>
      {blurb && <p className="text-sm text-neutral-500 mb-3">{blurb}</p>}
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const [tracked, log, catalog, lastSeasons, lastPlayers, lastMarket, lastMinutes, lastInference, lastCensusRows, guestPassword, guestEventRows] = await Promise.all([
    db.select().from(trackedCountries).orderBy(trackedCountries.name),
    db.select().from(syncLog).orderBy(desc(syncLog.startedAt)).limit(20),
    getCountriesCatalog().catch(() => []),
    lastRunOf('seasons'),
    lastRunOf('players'),
    lastRunOf('market'),
    lastRunOf('minutes'),
    lastRunOf('inference'),
    db.select().from(censusRuns).orderBy(desc(censusRuns.startedAt)).limit(1),
    getGuestPassword().catch(() => null),
    fetchGuestEvents(new Date(Date.now() - GUEST_ACTIVITY_DAYS * 86_400_000)).catch(() => []),
  ]);

  const censusLastRun: CensusLastRun | null = lastCensusRows[0]
    ? {
        startedAtIso: lastCensusRows[0].startedAt.toISOString(),
        status: lastCensusRows[0].status,
        totals: lastCensusRows[0].totals as CensusTotals,
      }
    : null;

  // One fetch (guestEventRows, 30 days), two summaries — summarizeGuestEvents is
  // self-scoping (ignores rows outside its own {days, now} window for every output),
  // so re-running it over a narrower window needs no second query.
  const now = new Date();
  const guestActivity = summarizeGuestEvents(guestEventRows, { days: GUEST_ACTIVITY_DAYS, now });
  const guestActivityRecent = summarizeGuestEvents(guestEventRows, { days: GUEST_ACTIVITY_RECENT_DAYS, now });
  const showGuestActivity = guestPassword !== null || guestActivity.totalViews > 0 || guestActivity.logins > 0;

  const trackedIds = new Set(tracked.map((t) => t.countryId));
  const available = catalog.filter((c) => !trackedIds.has(c.id) && c.id !== 66);

  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold mb-4">Settings</h1>

      <Card
        title="Tracked countries"
        blurb="Players aged 18–21 from these countries are synced weekly alongside Slovenia. Star countries you face this season."
      >
        <CountryPicker available={available} />
        <TrackedCountryList tracked={tracked} />
      </Card>

      <Card
        title="Guest access"
        blurb="Share the dashboard read-only with community members — one shared password, revocable here anytime."
      >
        <GuestAccessCard current={guestPassword} />
      </Card>

      {showGuestActivity && (
        <Card
          title="Guest activity"
          blurb="Anonymous usage of the shared guest login. Guest logins last 7 days, so recent distinct sessions is roughly how many people are using the password right now — a jump above that suggests it has spread; rotate it above."
        >
          <GuestActivityCard
            activity={guestActivity}
            recent={guestActivityRecent}
            days={GUEST_ACTIVITY_DAYS}
            recentDays={GUEST_ACTIVITY_RECENT_DAYS}
          />
        </Card>
      )}

      <Card title="Data sync">
        <SyncJobsCard
          lastRuns={{
            seasons: toJobLastRun(lastSeasons),
            players: toJobLastRun(lastPlayers),
            market: toJobLastRun(lastMarket),
            minutes: toJobLastRun(lastMinutes),
            inference: toJobLastRun(lastInference),
          }}
          censusLastRun={censusLastRun}
        />
      </Card>

      <Card title="Sync log" blurb="Every sync run, newest first — cron and manual.">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="py-1 pr-3">Job</th>
              <th className="pr-3">Via</th>
              <th className="pr-3">Started</th>
              <th className="pr-3">Took</th>
              <th className="pr-3">Status</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {log.map((l) => (
              <tr key={l.id} className="border-b border-neutral-900">
                <td className="py-1 pr-3">{l.jobType}</td>
                <td className="pr-3">
                  {l.trigger === 'cron'
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">cron</span>
                    : <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-sky-400">manual</span>}
                </td>
                <td className="pr-3 text-neutral-400 whitespace-nowrap">{formatStartedAt(l.startedAt)}</td>
                <td className="pr-3 text-neutral-400 whitespace-nowrap">{formatDuration(l.startedAt, l.finishedAt ?? null)}</td>
                <td className="pr-3">{l.ok === null ? '…' : l.ok ? <span className="text-green-400">ok</span> : <span className="text-red-400">failed</span>}</td>
                <td className="text-neutral-400 text-xs">
                  {formatSyncResult(l.jobType, l.counts as SyncCounts, l.error ?? null)}
                </td>
              </tr>
            ))}
            {log.length === 0 && <tr><td colSpan={6} className="py-2 text-neutral-500">No syncs yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
