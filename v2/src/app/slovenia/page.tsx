import { listPlayers, listCaptureSweeps } from '@/queries/players';
import { getEffectiveArchetypes } from '@/queries/archetypes';
import { matchingArchetypes } from '@/lib/archetypes/evaluate';
import PlayerTable from '@/components/PlayerTable';
import ReviewBar from '@/components/ReviewBar';
import { db, reviewMarks } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function coverage(rows: Awaited<ReturnType<typeof listPlayers>>, minPot: number) {
  const pool = rows.filter((p) => p.ageNow != null && p.ageNow >= 18 && p.ageNow <= 21 && (p.potential ?? 0) >= minPot);
  const done = pool.filter((p) => p.scoutedThisSeason).length;
  const pct = pool.length ? Math.round((done / pool.length) * 100) : 0;
  return { done, total: pool.length, pct };
}

export default async function SloveniaPage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string }>;
}) {
  // ?since=YYYY-MM-DD pins the progress baseline to the end of that UTC day (so the day's
  // own captures ARE the baseline); no param falls back to the review mark.
  const { since: sinceParam } = await searchParams;
  const since = sinceParam && /^\d{4}-\d{2}-\d{2}$/.test(sinceParam) ? sinceParam : null;
  const baselineAt = since ? new Date(`${since}T23:59:59.999Z`) : undefined;

  const [rows, archetypes, markRows, sweeps] = await Promise.all([
    listPlayers('slovenia', { baselineAt }),
    getEffectiveArchetypes(),
    db.select().from(reviewMarks).where(eq(reviewMarks.scope, 'slovenia')).limit(1),
    listCaptureSweeps(),
  ]);
  const markedAtIso = markRows[0]?.markedAt.toISOString() ?? null;
  const cov = coverage(rows, 7);
  const covAll = coverage(rows, 0);

  const archetypeMatches: Record<number, string[]> = {};
  for (const r of rows) {
    archetypeMatches[r.bbPlayerId] = matchingArchetypes(r, archetypes).map((a) => a.name);
  }
  const archetypeNames = archetypes.map((a) => a.name);

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
      <ReviewBar markedAtIso={markedAtIso} sweeps={sweeps} since={since} />
      <PlayerTable rows={rows} variant="slovenia" defaultShowSkills archetypeMatches={archetypeMatches} archetypeNames={archetypeNames} />
    </main>
  );
}
