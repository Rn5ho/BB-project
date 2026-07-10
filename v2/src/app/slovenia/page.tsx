import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';

export const dynamic = 'force-dynamic';

export default async function SloveniaPage() {
  const all = await listPlayers({ nationality: 'Slovenia' });
  const rows = all
    .filter((p) => p.ageNow != null && p.ageNow >= 18 && p.ageNow <= 21)
    .sort((a, b) => (b.tsp ?? -1) - (a.tsp ?? -1));
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">Slovenia — U21 candidates</h1>
      <p className="text-sm text-neutral-500 mb-4">{rows.length} players aged 18–21 (of {all.length} tracked) · read-only Phase 1 view</p>
      <PlayerTable rows={rows} showSkills />
    </main>
  );
}
