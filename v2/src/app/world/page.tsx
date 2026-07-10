import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WorldPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  const all = await listPlayers({ excludeNationality: 'Slovenia' });
  const countries = [...new Set(all.map((p) => p.nationality).filter((n): n is string => !!n))].sort();
  const rows = country ? all.filter((p) => p.nationality === country) : all;
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">World — tracked players</h1>
      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <Link href="/world" className={!country ? 'text-amber-500' : 'text-neutral-400'}>All</Link>
        {countries.map((c) => (
          <Link
            key={c}
            href={`/world?country=${encodeURIComponent(c)}`}
            className={country === c ? 'text-amber-500' : 'text-neutral-400 hover:text-white'}
          >
            {c}
          </Link>
        ))}
      </div>
      <PlayerTable rows={rows} variant="world" showCountry />
    </main>
  );
}
