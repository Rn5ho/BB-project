import { NextRequest, NextResponse } from 'next/server';
import { runSeasonsSync } from '@/server/sync/seasons';
import { runPlayersSync } from '@/server/sync/players';
import { runMarketSweep } from '@/server/sync/market';
import { refreshTeams } from '@/server/sync/teams';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Daily dispatcher: seasons every run; market every run (incremental, stopsEarly);
 * players weekly (Mondays UTC) or forced.
 * ?force=players  → forces player sync; market always runs (no special branch needed)
 * ?force=market   → no-op branch; market already runs unconditionally
 * ?force=all      → forces player sync (market already runs)
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get('force'); // 'players' | 'market' | 'all'
  const results: Record<string, unknown> = {};
  results.seasons = await runSeasonsSync('cron');
  results.market = await runMarketSweep({}, 'cron'); // incremental daily
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
