import { NextRequest, NextResponse } from 'next/server';
import { runSeasonsSync } from '@/server/sync/seasons';
import { runPlayersSync } from '@/server/sync/players';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Daily dispatcher: seasons every run; players weekly (Mondays UTC) or when forced. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get('force');
  const results: Record<string, unknown> = {};
  results.seasons = await runSeasonsSync();
  if (new Date().getUTCDay() === 1 || force === 'players') {
    results.players = await runPlayersSync();
  }
  return NextResponse.json({ ok: true, ...results });
}
