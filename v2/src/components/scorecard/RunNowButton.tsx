'use client';

import { useState, useTransition } from 'react';
import { runSelfTrainerNow } from '@/app/scorecard/actions';

export default function RunNowButton({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Awaited<ReturnType<typeof runSelfTrainerNow>> | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending || !configured}
        onClick={() => startTransition(async () => setResult(await runSelfTrainerNow()))}
        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        title={configured ? 'Scrape own-team training history and score all models' : 'Save the club config first'}
      >
        {pending ? 'Running… (about 1s per player)' : 'Run self-trainer now'}
      </button>
      {result && (
        <span className={`text-xs ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.ok
            ? `Done — ${result.counts.playersScored} players scored, ${result.counts.popsUpserted} pops anchored, ${result.counts.playersSkipped} skipped.`
            : result.error}
        </span>
      )}
    </div>
  );
}
