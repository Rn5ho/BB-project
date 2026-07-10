'use client';

import { useMemo, useState, useTransition } from 'react';
import { addTrackedCountry } from '@/app/settings/actions';

export default function CountryPicker({ available }: { available: { id: number; name: string }[] }) {
  const [q, setQ] = useState('');
  const [pending, start] = useTransition();
  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const matches = useMemo(
    () => (q ? available.filter((c) => norm(c.name).includes(norm(q))).slice(0, 8) : []),
    [q, available],
  );
  return (
    <div className="relative mb-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Add country…"
        className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm w-64"
      />
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-64 rounded border border-neutral-700 bg-neutral-900 text-sm">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                disabled={pending}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
                onClick={() => start(async () => { await addTrackedCountry(c.id, c.name); setQ(''); })}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
