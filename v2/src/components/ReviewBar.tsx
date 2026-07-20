'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markReviewed } from '@/app/slovenia/actions';
import { formatStartedAt } from '@/lib/format-sync';
import type { CaptureSweep } from '@/queries/players';

function sweepLabel(s: CaptureSweep): string {
  const [y, m, d] = s.day.split('-');
  return `${d}.${m}.${y} (${s.count} captured)`;
}

export default function ReviewBar({
  markedAtIso,
  sweeps,
  since,
}: {
  markedAtIso: string | null;
  sweeps: CaptureSweep[];
  since: string | null; // active ?since=YYYY-MM-DD, null = review mark
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
      <label className="flex items-center gap-2 text-neutral-500">
        Progress since
        <select
          value={since ?? ''}
          onChange={(e) => router.replace(e.target.value ? `/slovenia?since=${e.target.value}` : '/slovenia')}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
        >
          <option value="">
            {markedAtIso ? `Last review (${formatStartedAt(new Date(markedAtIso))} UTC)` : 'Last review (never)'}
          </option>
          {sweeps.map((s) => (
            <option key={s.day} value={s.day}>{sweepLabel(s)}</option>
          ))}
        </select>
      </label>
      <span className="text-neutral-600">
        {since
          ? 'Δ compares each player against their newest capture up to (and including) that day.'
          : 'Skill pops accumulate since the review mark.'}
      </span>
      <button
        onClick={() => start(() => markReviewed())}
        disabled={pending}
        className="rounded border border-neutral-700 px-2.5 py-1 text-sm text-neutral-300 hover:text-amber-400 disabled:opacity-50"
        title="Set the review mark to now. Press right BEFORE a census so its captures show progress since your last checkup."
      >
        Mark as reviewed
      </button>
    </div>
  );
}
