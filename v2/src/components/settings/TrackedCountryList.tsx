'use client';

import { useTransition } from 'react';
import { removeTrackedCountry, toggleStar } from '@/app/settings/actions';

interface Tracked { id: number; countryId: number | null; name: string; starred: boolean }

export default function TrackedCountryList({ tracked }: { tracked: Tracked[] }) {
  const [pending, start] = useTransition();
  if (tracked.length === 0) return <p className="text-sm text-neutral-500">No tracked countries yet.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {tracked.map((t) => (
        <li key={t.id} className="flex items-center gap-1.5 rounded bg-neutral-900 border border-neutral-800 px-2 py-1 text-sm">
          <button
            title={t.starred ? 'Unstar' : 'Star as season opponent'}
            disabled={pending}
            onClick={() => start(async () => { await toggleStar(t.id, !t.starred); })}
            className={t.starred ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'}
          >★</button>
          <span>{t.name}</span>
          <button
            title="Remove"
            disabled={pending}
            onClick={() => start(async () => { await removeTrackedCountry(t.id); })}
            className="text-neutral-600 hover:text-red-400 ml-1"
          >×</button>
        </li>
      ))}
    </ul>
  );
}
