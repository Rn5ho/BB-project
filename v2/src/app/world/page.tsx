import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';
import CountryChips from '@/components/CountryChips';

export const dynamic = 'force-dynamic';

export default async function WorldPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  const all = await listPlayers('world');
  const countries = [...new Set(all.map((p) => p.nationality).filter((n): n is string => !!n))].sort();
  const rows = country ? all.filter((p) => p.nationality === country) : all;
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">World — tracked players</h1>
      <CountryChips countries={countries} active={country} basePath="/world" />
      <PlayerTable rows={rows} variant="world" showCountry />
    </main>
  );
}
