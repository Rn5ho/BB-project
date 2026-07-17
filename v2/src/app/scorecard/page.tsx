import type { ReactNode } from 'react';
import { asc, desc, eq } from 'drizzle-orm';
import { db, modelScorecards, selfTrainerConfig, syncLog } from '@/db';
import { formatStartedAt, formatDuration } from '@/lib/format-sync';
import ConfigForm from '@/components/scorecard/ConfigForm';
import RunNowButton from '@/components/scorecard/RunNowButton';
import ScorecardTrend from '@/components/scorecard/ScorecardTrend';
import type { Series } from '@/components/charts/TimeSeriesChart';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // manual self-trainer runs scrape ~1s/player

const MODEL_COLORS: Record<string, string> = {
  bbscout: '#34d399',
  'coach-parrot': '#38bdf8',
  'open-source-live': '#fbbf24',
  'bbscout-low': '#525252',
  'bbscout-high': '#a3a3a3',
};

interface PlayerDetail {
  playerId: number; name: string; weeks: number;
  hits: number; misses: number; falseAlarms: number;
  endAbsErr: number; endExact: number; endCount: number;
}

function Card({ title, blurb, children }: { title: string; blurb?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 mb-6">
      <h2 className="font-medium mb-1">{title}</h2>
      {blurb && <p className="text-sm text-neutral-500 mb-3">{blurb}</p>}
      {children}
    </section>
  );
}

const pct = (num: number, den: number) => (den === 0 ? '–' : `${Math.round((num / den) * 100)}%`);
const mae = (absErr: number, count: number) => (count === 0 ? null : absErr / count);

export default async function ScorecardPage() {
  const [cfgRows, cards, lastRunRows] = await Promise.all([
    db.select().from(selfTrainerConfig).limit(1),
    db.select().from(modelScorecards).orderBy(asc(modelScorecards.runAt)),
    db.select().from(syncLog).where(eq(syncLog.jobType, 'self-trainer')).orderBy(desc(syncLog.startedAt)).limit(1),
  ]);
  const cfg = cfgRows[0] ?? null;
  const lastRun = lastRunRows[0] ?? null;

  const modelIds = [...new Set(cards.map((c) => c.modelId))];
  const maeSeries: Series[] = modelIds.map((id) => ({
    key: id, color: MODEL_COLORS[id] ?? '#e5e5e5',
    points: cards.filter((c) => c.modelId === id && c.endCount > 0)
      .map((c) => ({ x: c.runAt.getTime(), y: mae(c.endAbsErr, c.endCount)! })),
  }));
  const recallSeries: Series[] = modelIds.map((id) => ({
    key: id, color: MODEL_COLORS[id] ?? '#e5e5e5',
    points: cards.filter((c) => c.modelId === id && c.popHits + c.popMisses > 0)
      .map((c) => ({ x: c.runAt.getTime(), y: (c.popHits / (c.popHits + c.popMisses)) * 100 })),
  }));
  const maeMax = Math.max(1, ...maeSeries.flatMap((s) => s.points.map((p) => p.y)));

  const latestRunAt = cards.length > 0 ? cards[cards.length - 1].runAt.getTime() : null;
  const latest = latestRunAt == null ? [] : cards.filter((c) => c.runAt.getTime() === latestRunAt);
  const latestBbscout = latest.find((c) => c.modelId === 'bbscout');

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Model scorecard</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Weekly self-trainer: every Friday after the training update, your own players&apos; training
        history is scraped and replayed through each model with your staff levels — predicted pops
        vs what actually happened. Exact-date pops also tighten the inference anchors.
      </p>

      <Card title="Own club & staff"
        blurb="The club whose players are scored, and the staff the models replay with. Update this whenever you change coach, gym, or training court.">
        <ConfigForm initial={{
          teamId: cfg?.teamId ?? null, switchTeam: cfg?.switchTeam ?? false,
          coachLevel: cfg?.coachLevel ?? 5, youthTrainerLevel: cfg?.youthTrainerLevel ?? 0,
          gymLevel: cfg?.gymLevel ?? 0, trainingCourtLevel: cfg?.trainingCourtLevel ?? 0,
        }} />
      </Card>

      <Card title="Runs"
        blurb="Scheduled Fridays 11:30 UTC (after BB's ~12:20 Berlin training update) via the Hetzner cron; run manually after changing config.">
        <RunNowButton configured={cfg != null} />
        {lastRun && (
          <p className="mt-3 text-xs text-neutral-500">
            Last run {formatStartedAt(lastRun.startedAt)} UTC ({lastRun.trigger}) — {' '}
            {lastRun.ok == null ? 'running…'
              : lastRun.ok ? `ok in ${formatDuration(lastRun.startedAt, lastRun.finishedAt)}`
              : <span className="text-red-400">failed: {lastRun.error}</span>}
          </p>
        )}
      </Card>

      <Card title="Model trend"
        blurb="Final-skill mean absolute error (levels, lower is better) and pop recall (higher is better) per run. Drift here means the model needs a recalibration pass.">
        {cards.length === 0 ? (
          <p className="text-sm text-neutral-500">No runs yet — configure the club above and run the self-trainer.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">MAE (displayed levels)</h3>
              <ScorecardTrend series={maeSeries} unit="lvl" yMax={maeMax * 1.15} />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Pop recall</h3>
              <ScorecardTrend series={recallSeries} unit="%" yMax={100} />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4 text-xs text-neutral-400">
              {modelIds.map((id) => (
                <span key={id} className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: MODEL_COLORS[id] ?? '#e5e5e5' }} />
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {latest.length > 0 && (
        <Card title="Latest run"
          blurb={`${formatStartedAt(latest[0].runAt)} UTC — ${latest[0].playerCount} players, ${latest[0].weekCount} training weeks.`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-1 pr-4">Model</th>
                  <th className="py-1 pr-4">Pop recall</th>
                  <th className="py-1 pr-4">False alarms</th>
                  <th className="py-1 pr-4">Exact finals</th>
                  <th className="py-1 pr-4">MAE</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((c) => (
                  <tr key={c.modelId} className="border-t border-neutral-800">
                    <td className="py-1.5 pr-4">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: MODEL_COLORS[c.modelId] ?? '#e5e5e5' }} />
                      {c.modelId}
                    </td>
                    <td className="py-1.5 pr-4">{pct(c.popHits, c.popHits + c.popMisses)} ({c.popHits}/{c.popHits + c.popMisses})</td>
                    <td className="py-1.5 pr-4">{c.falseAlarms}</td>
                    <td className="py-1.5 pr-4">{pct(c.endExact, c.endCount)} ({c.endExact}/{c.endCount})</td>
                    <td className="py-1.5 pr-4">{mae(c.endAbsErr, c.endCount)?.toFixed(2) ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {latestBbscout && (
            <div className="mt-5">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Per player (bbscout)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                      <th className="py-1 pr-4">Player</th>
                      <th className="py-1 pr-4">Weeks</th>
                      <th className="py-1 pr-4">Pops hit</th>
                      <th className="py-1 pr-4">False alarms</th>
                      <th className="py-1 pr-4">Exact finals</th>
                      <th className="py-1 pr-4">|err|</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(latestBbscout.details as PlayerDetail[]).map((d) => (
                      <tr key={d.playerId} className="border-t border-neutral-800">
                        <td className="py-1.5 pr-4">
                          <a href={`/players/${d.playerId}`} className="hover:underline">{d.name}</a>
                        </td>
                        <td className="py-1.5 pr-4">{d.weeks}</td>
                        <td className="py-1.5 pr-4">{d.hits}/{d.hits + d.misses}</td>
                        <td className="py-1.5 pr-4">{d.falseAlarms}</td>
                        <td className="py-1.5 pr-4">{d.endExact}/{d.endCount}</td>
                        <td className="py-1.5 pr-4">{d.endAbsErr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </main>
  );
}
