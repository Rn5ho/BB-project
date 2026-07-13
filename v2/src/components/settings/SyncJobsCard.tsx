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
