import { NextRequest, NextResponse } from 'next/server';
import { runSeasonsSync } from '@/server/sync/seasons';
import { runPlayersSync } from '@/server/sync/players';
import { runMarketSweep } from '@/server/sync/market';

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
  results.seasons = await runSeasonsSync();
  results.market = await runMarketSweep(); // incremental daily
  if (new Date().getUTCDay() === 1 || force === 'players' || force === 'all') {
    results.players = await runPlayersSync();
  }
  return NextResponse.json({ ok: true, ...results });
}
