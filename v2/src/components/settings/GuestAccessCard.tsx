'use client';

import { useState, useTransition } from 'react';
import { saveGuestPassword, disableGuestAccess } from '@/app/settings/actions';

function randomPassword(): string {
  // readable, share-friendly: bbscout-<6 lowercase alphanumerics>
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  const rand = new Uint32Array(6);
  crypto.getRandomValues(rand);
  for (const r of rand) s += chars[r % chars.length];
  return `bbscout-${s}`;
}

export default function GuestAccessCard({ current }: { current: string | null }) {
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await saveGuestPassword(draft);
      if (!res.ok) setError(res.error);
      else setDraft('');
    });

  return (
    <div className="space-y-3 text-sm">
      {current ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-green-400">Guest login enabled</span>
          <code className="rounded bg-neutral-950 border border-neutral-800 px-2 py-1">
            {revealed ? current : '•'.repeat(Math.min(current.length, 14))}
          </code>
          <button onClick={() => setRevealed(!revealed)} className="text-neutral-400 hover:text-white">
            {revealed ? 'hide' : 'reveal'}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(current); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="text-neutral-400 hover:text-white"
          >
            {copied ? 'copied ✓' : 'copy'}
          </button>
          <button
            disabled={pending}
            onClick={() => start(async () => { await disableGuestAccess(); })}
            className="text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            disable guest access
          </button>
        </div>
      ) : (
        <p className="text-neutral-400">Guest login is <span className="text-neutral-200">disabled</span> — set a password to enable it.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={current ? 'New guest password…' : 'Guest password…'}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 w-64"
        />
        <button onClick={() => setDraft(randomPassword())} className="rounded border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:text-white">
          Generate
        </button>
        <button
          disabled={pending || draft.trim().length < 6}
          onClick={submit}
          className="rounded bg-amber-600 px-3 py-1.5 font-medium disabled:opacity-50"
        >
          {current ? 'Rotate' : 'Enable'}
        </button>
      </div>
      {error && <p className="text-red-400">{error}</p>}
      <p className="text-xs text-neutral-500">
        Guests get read-only access: player search, player pages, training lab and planner — no census, syncs,
        saves or settings. Rotating stops new logins immediately; already-issued guest sessions expire within 7 days.
      </p>
    </div>
  );
}
