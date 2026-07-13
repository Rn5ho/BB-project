# Settings Page UX Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/settings` self-documenting: three cards (tracked countries / data sync / sync log), per-job explanations with live "last run" lines, census section replaced by a link row to `/census` (which gains the newest-run item breakdown).

**Architecture:** Extract the sync/census formatters from page files into shared `src/lib` modules; add per-job latest-`sync_log` queries to the settings server component; replace `SyncButtons` with a client `SyncJobsCard` that renders job rows + buttons under one shared `useTransition`.

**Tech Stack:** Next.js 16 App Router (server components + server actions), Drizzle ORM/Neon, Tailwind 4. Run all commands from `v2/`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-13-settings-page-ux-design.md` — job descriptions and card blurbs must use the spec's copy verbatim.
- Card styling: `rounded-lg border border-neutral-800 bg-neutral-900/40 p-4`.
- `settings/actions.ts` unchanged; no schema changes; no new routes.
- Last-run data comes from per-job `limit(1)` queries, never sliced from the 20-row log.

---

### Task 1: Extract shared formatters

**Files:**
- Create: `v2/src/lib/format-sync.tsx`
- Create: `v2/src/lib/format-census.ts`
- Modify: `v2/src/app/settings/page.tsx` (delete local copies, import)
- Modify: `v2/src/app/census/page.tsx` (delete local copies, import)

**Interfaces:**
- Produces (used by Tasks 2–3):
  - `format-sync.tsx`: `export type SyncCounts = Record<string, unknown> | null;` `export function formatStartedAt(d: Date): string;` `export function formatDuration(start: Date, end: Date | null): string;` `export function formatSyncResult(jobType: string, counts: SyncCounts, error: string | null): React.ReactNode;`
  - `format-census.ts`: `export type CensusFilters = {...}` and `export type CensusTotals = {...} | null` (the `census/page.tsx` versions, which include `opts`); `export function formatCensusFilters(totals: CensusTotals): string;` `export function formatCensusResult(totals: CensusTotals): string;`

- [ ] **Step 1: Create `v2/src/lib/format-sync.tsx`** — move `formatStartedAt`, `formatDuration`, `SyncCounts`, `formatSyncResult` verbatim from `settings/page.tsx` (lines ~86–175), adding `import React from 'react';` at top and `export` on each. No logic changes.

- [ ] **Step 2: Create `v2/src/lib/format-census.ts`** — move `CensusFilters`, `CensusTotals`, `getFilters`, `formatCensusFilters`, `formatCensusResult` verbatim from `census/page.tsx` (lines ~8–89; this version handles both `filters` and enqueued `opts`), exporting the types and the two format functions.

- [ ] **Step 3: Update both pages to import** — in `settings/page.tsx` delete the local copies of all five sync/census helpers + their types and import from `@/lib/format-sync` / `@/lib/format-census`. In `census/page.tsx` delete its formatter/type copies and import from `@/lib/format-census`. Note: settings' old local `formatCensusFilters` (no `opts` support) is superseded by the shared version — behavior for settings only improves.

- [ ] **Step 4: Verify + commit**

Run: `npm test -- run` and `npm run build` → pass.

```bash
git add src/lib/format-sync.tsx src/lib/format-census.ts src/app/settings/page.tsx src/app/census/page.tsx
git commit -m "refactor(v2): extract sync/census formatters to shared lib"
```

---

### Task 2: `/census` gains newest-run item breakdown

**Files:**
- Modify: `v2/src/app/census/page.tsx`

**Interfaces:**
- Consumes: `censusItems` from `@/db`, `eq` from `drizzle-orm` (add to existing imports).
- Produces: newest run's Result cell shows `(captured: 17, failed: 1)`-style breakdown — port of the logic Task 3 removes from settings.

- [ ] **Step 1: Fetch item counts** — in `CensusPage`, after `runs` is fetched:

```ts
  const newestRun = runs[0] ?? null;
  const newestItemCounts: Record<string, number> = {};
  if (newestRun) {
    const items = await db
      .select({ status: censusItems.status })
      .from(censusItems)
      .where(eq(censusItems.runId, newestRun.id));
    for (const item of items) {
      newestItemCounts[item.status] = (newestItemCounts[item.status] ?? 0) + 1;
    }
  }
```

Extend the `@/db` import with `censusItems` and add `eq` to the `drizzle-orm` import.

- [ ] **Step 2: Render in the Result cell** — inside the Result `<td>`, after `{formatCensusResult(...)}`:

```tsx
                  {r.id === newestRun?.id && Object.keys(newestItemCounts).length > 0 && (
                    <span className="ml-2 text-neutral-500">
                      ({Object.entries(newestItemCounts).map(([s, n]) => `${s}: ${n}`).join(', ')})
                    </span>
                  )}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run build` → pass. Manual: `/census` newest run row shows the breakdown.

```bash
git add src/app/census/page.tsx
git commit -m "feat(v2): per-item status breakdown on newest census run"
```

---

### Task 3: Settings page restructure (cards + SyncJobsCard)

**Files:**
- Create: `v2/src/components/settings/SyncJobsCard.tsx`
- Modify: `v2/src/app/settings/page.tsx`
- Delete: `v2/src/components/settings/SyncButtons.tsx`

**Interfaces:**
- Consumes: `formatStartedAt` / `formatSyncResult` / `SyncCounts` (Task 1), `formatCensusResult` / `CensusTotals` (Task 1), `syncNow` from `@/app/settings/actions`.
- Produces: `SyncJobsCard` default export, props `{ lastRuns: Record<'seasons'|'players'|'market', JobLastRun | null>; censusLastRun: CensusLastRun | null }` with `export interface JobLastRun { startedAtIso: string; trigger: string; ok: boolean | null; counts: SyncCounts; error: string | null }` and `export interface CensusLastRun { startedAtIso: string; status: string; totals: CensusTotals }`.

- [ ] **Step 1: Create `v2/src/components/settings/SyncJobsCard.tsx`**

```tsx
'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { syncNow } from '@/app/settings/actions';
import { formatStartedAt, formatSyncResult, type SyncCounts } from '@/lib/format-sync';
import { formatCensusResult, type CensusTotals } from '@/lib/format-census';

type SyncJob = 'seasons' | 'players' | 'market';

export interface JobLastRun {
  startedAtIso: string;
  trigger: string;
  ok: boolean | null;
  counts: SyncCounts;
  error: string | null;
}

export interface CensusLastRun {
  startedAtIso: string;
  status: string;
  totals: CensusTotals;
}

const JOBS: { job: SyncJob; title: string; chip: string; description: string }[] = [
  {
    job: 'seasons',
    title: 'Seasons',
    chip: 'cron: daily',
    description:
      'Refreshes the BB season list; the current season number drives age math. Rarely needed manually — press if a new season just started and ages look off.',
  },
  {
    job: 'players',
    title: 'Players',
    chip: 'cron: Mondays',
    description:
      'Refreshes every 18–21-year-old for Slovenia + tracked countries from the BB Players API; stores one snapshot per player per day. Press for a mid-week refresh or after adding a country.',
  },
  {
    job: 'market',
    title: 'Market',
    chip: 'cron: daily',
    description:
      'Scrapes the transfer list (ages 18–21, potential ≥6, all countries) for full skills and auction info. Press to catch fresh listings before bidding.',
  },
];

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
      {children}
    </span>
  );
}

function LastRunLine({ job, lastRun }: { job: SyncJob; lastRun: JobLastRun | null }) {
  if (!lastRun) return <p className="text-xs text-neutral-500 mt-0.5">Last run: never</p>;
  return (
    <p className="text-xs text-neutral-500 mt-0.5">
      Last run: {formatStartedAt(new Date(lastRun.startedAtIso))} · {lastRun.trigger} ·{' '}
      {lastRun.ok === null ? '…' : lastRun.ok ? (
        <span className="text-green-400">ok</span>
      ) : (
        <span className="text-red-400">failed</span>
      )}{' '}
      · {formatSyncResult(job, lastRun.counts, lastRun.error)}
    </p>
  );
}

export default function SyncJobsCard({
  lastRuns,
  censusLastRun,
}: {
  lastRuns: Record<SyncJob, JobLastRun | null>;
  censusLastRun: CensusLastRun | null;
}) {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<Partial<Record<SyncJob, React.ReactNode>>>({});

  const run = (job: SyncJob) =>
    start(async () => {
      setFeedback((f) => ({ ...f, [job]: 'Running…' }));
      const r = await syncNow(job);
      setFeedback((f) => ({
        ...f,
        [job]: r.ok
          ? formatSyncResult(job, r.counts as SyncCounts, null)
          : formatSyncResult(job, null, r.error),
      }));
    });

  return (
    <div>
      <p className="text-sm text-neutral-500">
        All jobs run automatically — the Hetzner box triggers the daily cron at 06:00 UTC.
        Buttons run the same job immediately.
      </p>
      {JOBS.map(({ job, title, chip, description }) => (
        <div key={job} className="flex items-start justify-between gap-4 border-t border-neutral-800 mt-3 pt-3">
          <div className="min-w-0">
            <p className="font-medium">
              {title}
              <Chip>{chip}</Chip>
            </p>
            <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
            <LastRunLine job={job} lastRun={lastRuns[job]} />
            {feedback[job] && <p className="text-xs text-neutral-400 mt-0.5">{feedback[job]}</p>}
          </div>
          <button
            onClick={() => run(job)}
            disabled={pending}
            className="shrink-0 rounded border border-amber-700 px-3 py-1.5 text-sm text-amber-400 disabled:opacity-50"
          >
            Sync now
          </button>
        </div>
      ))}
      <div className="flex items-start justify-between gap-4 border-t border-neutral-800 mt-3 pt-3">
        <div className="min-w-0">
          <p className="font-medium">
            Census
            <Chip>manual</Chip>
          </p>
          <p className="text-sm text-neutral-500 mt-0.5">
            Deep-scouts Slovenian prospects by cycling them through the U-21 roster via the
            Hetzner worker.
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {censusLastRun ? (
              <>
                Last run: {formatStartedAt(new Date(censusLastRun.startedAtIso))} ·{' '}
                {censusLastRun.status} · {formatCensusResult(censusLastRun.totals)}
              </>
            ) : (
              'Last run: never'
            )}
          </p>
        </div>
        <Link
          href="/census"
          className="shrink-0 rounded border border-neutral-700 px-3 py-1.5 text-sm hover:text-amber-400"
        >
          Open /census →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `v2/src/app/settings/page.tsx`**

Full new content (formatters now imported; census section gone; `censusItems` import dropped):

```tsx
import { db, trackedCountries, syncLog, censusRuns } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { getCountriesCatalog } from '@/server/sync/countries';
import CountryPicker from '@/components/settings/CountryPicker';
import TrackedCountryList from '@/components/settings/TrackedCountryList';
import SyncJobsCard, { type JobLastRun, type CensusLastRun } from '@/components/settings/SyncJobsCard';
import { formatStartedAt, formatDuration, formatSyncResult, type SyncCounts } from '@/lib/format-sync';
import type { CensusTotals } from '@/lib/format-census';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

function Card({ title, blurb, children }: { title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 mb-6">
      <h2 className="font-medium mb-1">{title}</h2>
      {blurb && <p className="text-sm text-neutral-500 mb-3">{blurb}</p>}
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const [tracked, log, catalog, lastSeasons, lastPlayers, lastMarket, lastCensusRows] = await Promise.all([
    db.select().from(trackedCountries).orderBy(trackedCountries.name),
    db.select().from(syncLog).orderBy(desc(syncLog.startedAt)).limit(20),
    getCountriesCatalog().catch(() => []),
    lastRunOf('seasons'),
    lastRunOf('players'),
    lastRunOf('market'),
    db.select().from(censusRuns).orderBy(desc(censusRuns.startedAt)).limit(1),
  ]);

  const censusLastRun: CensusLastRun | null = lastCensusRows[0]
    ? {
        startedAtIso: lastCensusRows[0].startedAt.toISOString(),
        status: lastCensusRows[0].status,
        totals: lastCensusRows[0].totals as CensusTotals,
      }
    : null;

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

      <Card title="Data sync">
        <SyncJobsCard
          lastRuns={{
            seasons: toJobLastRun(lastSeasons),
            players: toJobLastRun(lastPlayers),
            market: toJobLastRun(lastMarket),
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
```

(Adjust `toJobLastRun`'s row typing to the actual Drizzle inferred type if `$inferSelect` differs — the fields used are `startedAt`, `trigger`, `ok`, `counts`, `error`.)

- [ ] **Step 3: Delete `v2/src/components/settings/SyncButtons.tsx`** (no remaining importers — verify with grep).

- [ ] **Step 4: Verify + commit**

Run: `npm test -- run` and `npm run build` → pass. Manual dev pass: `/settings` shows three cards; each job row shows description + last-run line; "Sync seasons now" run → feedback line + last-run updates; census row links to `/census`.

```bash
git add -A src/app/settings src/components/settings
git commit -m "feat(v2): self-documenting settings page with data sync card"
```
