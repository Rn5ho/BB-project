import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';

export const dynamic = 'force-dynamic';

function coverage(rows: Awaited<ReturnType<typeof listPlayers>>, minPot: number) {
  const pool = rows.filter((p) => p.ageNow != null && p.ageNow >= 18 && p.ageNow <= 21 && (p.potential ?? 0) >= minPot);
  const done = pool.filter((p) => p.scoutedThisSeason).length;
  const pct = pool.length ? Math.round((done / pool.length) * 100) : 0;
  return { done, total: pool.length, pct };
}

export default async function SloveniaPage() {
  const rows = await listPlayers('slovenia');
  const cov = coverage(rows, 7);
  const covAll = coverage(rows, 0);
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">Slovenia — U21 candidates</h1>
      <p className="text-sm text-neutral-500 mb-4">
        Scouted this season:{' '}
        <span className={cov.pct === 100 ? 'text-green-400' : 'text-amber-400'}>
          {cov.done}/{cov.total} potential-7+ ({cov.pct}%)
        </span>
        {' · '}
        <span className="text-neutral-400">{covAll.done}/{covAll.total} of all 18–21 ({covAll.pct}%)</span>
        {cov.total - cov.done > 0 && <span className="text-neutral-400"> · {cov.total - cov.done} relevant still to scout</span>}
      </p>
      <PlayerTable rows={rows} variant="slovenia" defaultShowSkills />
    </main>
  );
}
