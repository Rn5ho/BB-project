import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function chipClass(active: boolean): string {
  return `rounded border px-2 py-0.5 ${
    active
      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
      : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
  }`;
}

export default async function WorldPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  const all = await listPlayers('world');
  const countries = [...new Set(all.map((p) => p.nationality).filter((n): n is string => !!n))].sort();
  const rows = country ? all.filter((p) => p.nationality === country) : all;
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">World — tracked players</h1>
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-sm">
        <span className="text-neutral-500 mr-1">Country:</span>
        <Link href="/world" className={chipClass(!country)}>All</Link>
        {countries.map((c) => (
          <Link
            key={c}
            href={country === c ? '/world' : `/world?country=${encodeURIComponent(c)}`}
            title={country === c ? 'Clear country filter' : `Show only ${c}`}
            className={chipClass(country === c)}
          >
            {c}{country === c ? ' ✕' : ''}
          </Link>
        ))}
      </div>
      <PlayerTable rows={rows} variant="world" showCountry />
    </main>
  );
}
