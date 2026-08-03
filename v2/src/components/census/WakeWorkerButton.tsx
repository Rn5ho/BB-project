'use client';

import { useState, useTransition } from 'react';
import { wakeWorkerNow } from '@/app/census/actions';

/** Manual wake for the Hetzner census worker — use when a run sits at 'requested'
 *  (the enqueue's automatic wake ping was lost; the safety poll is daily). */
export default function WakeWorkerButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await wakeWorkerNow();
            setMsg(
              r.ok
                ? 'Worker woken — a requested run should start within seconds.'
                : `Wake failed: ${r.error}`,
            );
          })
        }
        className="rounded border border-neutral-600 px-3 py-1 text-xs font-medium text-neutral-200 hover:border-neutral-400 disabled:opacity-50"
      >
        {pending ? 'Waking…' : 'Wake worker now'}
      </button>
      {msg && <span className="text-xs text-neutral-400">{msg}</span>}
    </span>
  );
}
