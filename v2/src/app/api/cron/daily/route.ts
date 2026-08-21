import { NextRequest, NextResponse } from 'next/server';
import { runSeasonsSync } from '@/server/sync/seasons';
import { runPlayersSync } from '@/server/sync/players';
import { runMarketSweep, SENIOR_NT_SWEEP_OPTS } from '@/server/sync/market';
import { runMinutesSync } from '@/server/sync/minutes';
import { refreshTeams } from '@/server/sync/teams';
import { runTrainingInference } from '@/server/sync/inference';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Daily dispatcher: seasons every run; market every run (incremental, stopsEarly),
 * followed by the senior-NT sweep (age 22+, IsOnNT — non-fatal, jobType 'market-senior');
 * minutes every run (incremental, batch-limited); players weekly (Mondays UTC) or forced;
 * inference every run (DB-only, rebuilds pops + club-training observations from snapshots + minutes).
 * ?force=players  → forces player sync; market always runs (no special branch needed)
 * ?force=market   → no-op branch; market already runs unconditionally
 * ?force=minutes  → larger minutes batch (clubBatch 200, matchBatch 800)
 * ?force=all      → forces player sync (market already runs)
 * ?skip=market    → skip both market sweeps (the Hetzner cron runs them locally via
 *                   scripts/market-sweep.mts — no Vercel time limit, two-pass flood recovery)
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get('force'); // 'players' | 'market' | 'minutes' | 'all'
  const skip = req.nextUrl.searchParams.get('skip'); // 'market'
  const results: Record<string, unknown> = {};
  results.seasons = await runSeasonsSync('cron');
  if (skip !== 'market') {
    results.market = await runMarketSweep({}, 'cron'); // incremental daily
    try {
      results.marketSenior = await runMarketSweep(SENIOR_NT_SWEEP_OPTS, 'cron');
    } catch (err) {
      console.error('senior market sweep failed (non-fatal):', err);
      results.marketSenior = { error: String(err) };
    }
  }
  const minutesOpts = force === 'minutes'
    ? { clubBatch: 200, matchBatch: 800 }
    : { clubBatch: 100, matchBatch: 400 };
  try {
    results.minutes = await runMinutesSync(minutesOpts, 'cron');
  } catch (err) {
    console.error('minutes sync failed (non-fatal):', err);
    results.minutes = { error: String(err) };
  }
  try {
    results.inference = await runTrainingInference('cron');
  } catch (err) {
    console.error('training inference failed (non-fatal):', err);
    results.inference = { error: String(err) };
  }
  if (new Date().getUTCDay() === 1 || force === 'players' || force === 'all') {
    results.players = await runPlayersSync('cron');
    // Refresh teams for any owner_team_id that is missing or stale — non-fatal
    try {
      const { db } = await import('@/db');
      const { sql } = await import('drizzle-orm');
      const ownerRows = await db.execute(
        sql`select distinct owner_team_id from players where owner_team_id is not null`
      );
      const ownerIds = (ownerRows.rows as { owner_team_id: number }[]).map((r) => Number(r.owner_team_id));
      results.teams = await refreshTeams(ownerIds);
    } catch (err) {
      console.error('refreshTeams failed (non-fatal):', err);
      results.teams = { error: String(err) };
    }
  }
  return NextResponse.json({ ok: true, ...results });
}
