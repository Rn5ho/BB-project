import { db, censusRuns } from '@/db';
import { desc } from 'drizzle-orm';
import CensusRunForm from '@/components/census/CensusRunForm';
import CensusLivePoller from '@/components/census/CensusLivePoller';

export const dynamic = 'force-dynamic';

type CensusFilters = {
  all?: boolean;
  max?: number;
  minAge?: number;
  maxAge?: number;
  minPotential?: number;
  maxPotential?: number;
  minSalary?: number;
  maxSalary?: number;
  minHeight?: number;
  maxHeight?: number;
};

type CensusTotals = {
  captured?: number;
  failed?: number;
  filters?: CensusFilters;
  opts?: CensusFilters & { confirmed?: boolean; clearRoster?: boolean };
  candidateCount?: number;
  originalRoster?: unknown;
} | null;

function getFilters(totals: CensusTotals): CensusFilters | null {
  if (!totals) return null;
  // Run-time totals use `filters`; enqueued opts use `opts`
  return totals.filters ?? totals.opts ?? null;
}

function formatCensusFilters(totals: CensusTotals): string {
  const f = getFilters(totals);
  if (!f) return '—';

  const parts: string[] = [];

  if (f.all) parts.push('all (re-scout)');

  if (f.minPotential != null && f.maxPotential != null) {
    parts.push(`pot ${f.minPotential}-${f.maxPotential}`);
  } else if (f.minPotential != null) {
    parts.push(`pot≥${f.minPotential}`);
  } else if (f.maxPotential != null) {
    parts.push(`pot≤${f.maxPotential}`);
  }

  if (f.minAge != null && f.maxAge != null) {
    parts.push(`age ${f.minAge}-${f.maxAge}`);
  } else if (f.minAge != null) {
    parts.push(`age ≥${f.minAge}`);
  } else if (f.maxAge != null) {
    parts.push(`age ≤${f.maxAge}`);
  }

  if (f.minSalary != null && f.maxSalary != null) {
    parts.push(`salary ${f.minSalary}-${f.maxSalary}`);
  } else if (f.minSalary != null) {
    parts.push(`salary ≥${f.minSalary}`);
  } else if (f.maxSalary != null) {
    parts.push(`salary ≤${f.maxSalary}`);
  }

  if (f.minHeight != null && f.maxHeight != null) {
    parts.push(`ht ${f.minHeight}-${f.maxHeight} cm`);
  } else if (f.minHeight != null) {
    parts.push(`ht ≥${f.minHeight} cm`);
  } else if (f.maxHeight != null) {
    parts.push(`ht ≤${f.maxHeight} cm`);
  }

  if (totals?.candidateCount != null) {
    parts.push(`${totals.candidateCount} cands`);
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}

function formatCensusResult(totals: CensusTotals): string {
  if (!totals) return '—';
  if (totals.captured == null && totals.failed == null) return '—';
  const captured = totals.captured ?? 0;
  const failed = totals.failed ?? 0;
  return `${captured} ✓ / ${failed} ✗`;
}

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
