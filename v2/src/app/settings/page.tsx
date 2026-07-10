import { db, trackedCountries, syncLog, censusRuns, censusItems } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { getCountriesCatalog } from '@/server/sync/countries';
import CountryPicker from '@/components/settings/CountryPicker';
import TrackedCountryList from '@/components/settings/TrackedCountryList';
import SyncButtons from '@/components/settings/SyncButtons';

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
  candidateCount?: number;
  originalRoster?: unknown;
} | null;

function formatCensusFilters(totals: CensusTotals): string {
  if (!totals) return '—';
  const f = totals.filters;
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

  if (totals.candidateCount != null) {
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

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function SettingsPage() {
  const [tracked, log, catalog, runs] = await Promise.all([
    db.select().from(trackedCountries).orderBy(trackedCountries.name),
    db.select().from(syncLog).orderBy(desc(syncLog.startedAt)).limit(20),
    getCountriesCatalog().catch(() => []),
    db.select().from(censusRuns).orderBy(desc(censusRuns.startedAt)).limit(10),
  ]);

  // For the newest run, fetch item counts by status
  const newestRun = runs[0] ?? null;
  let newestItemCounts: Record<string, number> = {};
  if (newestRun) {
    const items = await db.select({ status: censusItems.status }).from(censusItems).where(eq(censusItems.runId, newestRun.id));
    for (const item of items) {
      newestItemCounts[item.status] = (newestItemCounts[item.status] ?? 0) + 1;
    }
  }
  const trackedIds = new Set(tracked.map((t) => t.countryId));
  const available = catalog.filter((c) => !trackedIds.has(c.id) && c.id !== 66);
  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold mb-4">Settings</h1>

      <section className="mb-8">
        <h2 className="font-medium mb-1">Tracked countries</h2>
        <p className="text-sm text-neutral-500 mb-3">
          Synced weekly (ages 18–21) alongside Slovenia. Star season opponents.
        </p>
        <CountryPicker available={available} />
        <TrackedCountryList tracked={tracked} />
      </section>

      <section className="mb-8">
        <h2 className="font-medium mb-3">Manual sync</h2>
        <SyncButtons />
      </section>

      <section className="mb-8">
        <h2 className="font-medium mb-1">Census runs</h2>
        <p className="text-xs text-neutral-500 mb-3">
          Runs are started locally with <code className="bg-neutral-800 px-1 rounded">npm run census</code> — see project docs.
        </p>
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
                <td className="pr-3 text-neutral-400">{r.startedAt.toISOString().replace('T', ' ').slice(0, 16)}</td>
                <td className="pr-3">
                  {r.status === 'finished' ? <span className="text-green-400">finished</span>
                    : r.status === 'running' ? <span className="text-yellow-400">running</span>
                    : r.status === 'aborted' ? <span className="text-orange-400">aborted</span>
                    : <span className="text-red-400">{r.status}</span>}
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
              <tr><td colSpan={5} className="py-2 text-neutral-500">No census runs yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-medium mb-3">Sync log</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b border-neutral-800">
            <tr><th className="py-1 pr-3">Job</th><th className="pr-3">Via</th><th className="pr-3">Started</th><th className="pr-3">Status</th><th>Result</th></tr>
          </thead>
          <tbody>
            {log.map((l) => (
              <tr key={l.id} className="border-b border-neutral-900">
                <td className="py-1 pr-3">{l.jobType}</td>
                <td className="pr-3">
                  {l.trigger === 'cron'
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">cron</span>
                    : <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-sky-400">manual</span>}
                </td>
                <td className="pr-3 text-neutral-400">{l.startedAt.toISOString().replace('T', ' ').slice(0, 16)}</td>
                <td className="pr-3">{l.ok === null ? '…' : l.ok ? <span className="text-green-400">ok</span> : <span className="text-red-400">failed</span>}</td>
                <td className="text-neutral-400 text-xs">{l.error ?? JSON.stringify(l.counts ?? {})}</td>
              </tr>
            ))}
            {log.length === 0 && <tr><td colSpan={5} className="py-2 text-neutral-500">No syncs yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </main>
  );
}
