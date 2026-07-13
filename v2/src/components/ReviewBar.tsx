'use client';

import { useTransition } from 'react';
import { markReviewed } from '@/app/slovenia/actions';
import { formatStartedAt } from '@/lib/format-sync';

export default function ReviewBar({ markedAtIso }: { markedAtIso: string | null }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3 mb-3 text-sm">
      <span className="text-neutral-500">
        {markedAtIso
          ? <>Last reviewed: {formatStartedAt(new Date(markedAtIso))} UTC · skill pops accumulate since then</>
          : 'Never reviewed — press to start tracking skill pops'}
      </span>
      <button
        onClick={() => start(() => markReviewed())}
        disabled={pending}
        className="rounded border border-neutral-700 px-2.5 py-1 text-sm text-neutral-300 hover:text-amber-400 disabled:opacity-50"
      >
        Mark as reviewed
      </button>
    </div>
  );
}
