import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';
import CountryChips from '@/components/CountryChips';

export const dynamic = 'force-dynamic';

export default async function SeniorsPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  const all = await listPlayers('seniors');
  const countries = [...new Set(all.map((p) => p.nationality).filter((n): n is string => !!n))].sort();
  const rows = country ? all.filter((p) => p.nationality === country) : all;
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">Seniors — senior NT market intel</h1>
      <p className="text-sm text-neutral-500 mb-4">
        Age-22+ players seen on the transfer market while on a senior national team — full skills captured from their listings.
      </p>
      <CountryChips countries={countries} active={country} basePath="/seniors" />
      <PlayerTable rows={rows} variant="seniors" showCountry defaultShowSkills />
    </main>
  );
}
