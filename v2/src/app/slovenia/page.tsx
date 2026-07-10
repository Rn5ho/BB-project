import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';

export const dynamic = 'force-dynamic';

export default async function SloveniaPage() {
  const rows = await listPlayers('slovenia');
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Slovenia — U21 candidates</h1>
      <PlayerTable rows={rows} variant="slovenia" defaultShowSkills />
    </main>
  );
}
