import { db, trackedCountries, syncLog } from '@/db';
import { desc } from 'drizzle-orm';
import { getCountriesCatalog } from '@/server/sync/countries';
import CountryPicker from '@/components/settings/CountryPicker';
import TrackedCountryList from '@/components/settings/TrackedCountryList';
import SyncButtons from '@/components/settings/SyncButtons';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function SettingsPage() {
  const [tracked, log, catalog] = await Promise.all([
    db.select().from(trackedCountries).orderBy(trackedCountries.name),
    db.select().from(syncLog).orderBy(desc(syncLog.startedAt)).limit(20),
    getCountriesCatalog().catch(() => []),
  ]);
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

      <section>
        <h2 className="font-medium mb-3">Sync log</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b border-neutral-800">
            <tr><th className="py-1 pr-3">Job</th><th className="pr-3">Started</th><th className="pr-3">Status</th><th>Result</th></tr>
          </thead>
          <tbody>
            {log.map((l) => (
              <tr key={l.id} className="border-b border-neutral-900">
                <td className="py-1 pr-3">{l.jobType}</td>
                <td className="pr-3 text-neutral-400">{l.startedAt.toISOString().replace('T', ' ').slice(0, 16)}</td>
                <td className="pr-3">{l.ok === null ? '…' : l.ok ? <span className="text-green-400">ok</span> : <span className="text-red-400">failed</span>}</td>
                <td className="text-neutral-400 text-xs">{l.error ?? JSON.stringify(l.counts ?? {})}</td>
              </tr>
            ))}
            {log.length === 0 && <tr><td colSpan={4} className="py-2 text-neutral-500">No syncs yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </main>
  );
}
