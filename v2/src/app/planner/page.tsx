import { computeBoardRow } from '@/lib/training/board';
import { getPlannerData } from '@/queries/planner';
import PlannerTable from '@/components/planner/PlannerTable';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function PlannerPage() {
  const data = await getPlannerData();
  const rows = data.players.map(computeBoardRow);
  return (
    <main className="p-6 max-w-7xl">
      <h1 className="text-xl font-semibold mb-1">U-21 planner</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Every Slovenian 18–21 prospect with full skills: what their club trains (inferred from
        minutes + observed pops), projected TSP at the end of age 21 under that vs. an optimal
        plan, and the gap — sorted so the biggest outreach wins come first. Benchmark = NT-track
        season TSP (forum thread 323477). Projections use the bbscout model, neutral staff.
      </p>
      <PlannerTable rows={rows} currentSeasonWeek={data.currentSeasonWeek} />
    </main>
  );
}
