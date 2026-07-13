import { db, censusRuns, censusItems } from '@/db';
import { desc, eq } from 'drizzle-orm';
import CensusRunForm from '@/components/census/CensusRunForm';
import CensusLivePoller from '@/components/census/CensusLivePoller';
import { formatCensusFilters, formatCensusResult, type CensusTotals } from '@/lib/format-census';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  if (status === 'finished') return <span className="text-green-400">finished</span>;
  if (status === 'running') return <span className="text-yellow-400">running</span>;
  if (status === 'requested') return <span className="text-sky-400">requested</span>;
  if (status === 'aborted') return <span className="text-orange-400">aborted</span>;
  return <span className="text-red-400">{status}</span>;
}

export default async function CensusPage() {
  const runs = await db
    .select()
    .from(censusRuns)
    .orderBy(desc(censusRuns.startedAt))
    .limit(20);

  const hasActiveRun = runs.some(
    (r) => r.status === 'requested' || r.status === 'running',
  );

  // For the newest run, fetch item counts by status
  const newestRun = runs[0] ?? null;
  const newestItemCounts: Record<string, number> = {};
  if (newestRun) {
    const items = await db
      .select({ status: censusItems.status })
      .from(censusItems)
      .where(eq(censusItems.runId, newestRun.id));
    for (const item of items) {
      newestItemCounts[item.status] = (newestItemCounts[item.status] ?? 0) + 1;
    }
  }

  return (
    <main className="p-6 max-w-3xl space-y-10">
      <section>
        <h1 className="text-lg font-semibold mb-1">Queue census</h1>
        <p className="text-sm text-neutral-500 mb-5">
          Enqueues a census run for the Hetzner worker to pick up. The worker polls the database
          every ~30 s, claims the request, and runs it with Playwright on the server.
        </p>
        <CensusRunForm />
      </section>

      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-medium">Recent census runs</h2>
          {hasActiveRun && <CensusLivePoller />}
        </div>

        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="py-1 pr-3">Run ID</th>
              <th className="pr-3">Started</th>
              <th className="pr-3">Status</th>
              <th className="pr-3">Filters</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-b border-neutral-900">
                <td className="py-1 pr-3">#{r.id}</td>
                <td className="pr-3 text-neutral-400">
                  {r.startedAt.toISOString().replace('T', ' ').slice(0, 16)}
                </td>
                <td className="pr-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="pr-3 text-neutral-400 text-xs">
                  {formatCensusFilters(r.totals as CensusTotals)}
                </td>
                <td className="text-neutral-400 text-xs">
                  {formatCensusResult(r.totals as CensusTotals)}
                  {r.id === newestRun?.id && Object.keys(newestItemCounts).length > 0 && (
                    <span className="ml-2 text-neutral-500">
                      ({Object.entries(newestItemCounts).map(([s, n]) => `${s}: ${n}`).join(', ')})
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-2 text-neutral-500">
                  No census runs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
