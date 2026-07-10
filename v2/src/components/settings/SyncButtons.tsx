'use client';

import { useState, useTransition } from 'react';
import { syncNow } from '@/app/settings/actions';

export default function SyncButtons() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const run = (job: 'players' | 'seasons' | 'market') =>
    start(async () => {
      setResult(`Running ${job} sync…`);
      const r = await syncNow(job);
      setResult(r.ok ? `${job}: ${JSON.stringify(r.counts)}` : `${job} failed: ${r.error}`);
    });
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => run('players')} disabled={pending}
        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50">
        Sync players now
      </button>
      <button onClick={() => run('seasons')} disabled={pending}
        className="rounded border border-neutral-700 px-3 py-1.5 text-sm disabled:opacity-50">
        Sync seasons now
      </button>
      <button onClick={() => run('market')} disabled={pending}
        className="rounded border border-amber-700 px-3 py-1.5 text-sm text-amber-400 disabled:opacity-50">
        Sync market now
      </button>
      {result && <span className="text-xs text-neutral-400">{result}</span>}
    </div>
  );
}
