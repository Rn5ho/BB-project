import { NextResponse } from 'next/server';
import { bbApiLogin, bbApiLogout, fetchSeasons, getCurrentSeason } from '@/lib/bbapi';

export async function GET() {
  const username = process.env.BB_API_USERNAME;
  const securityCode = process.env.BB_API_SECURITY_CODE;
  if (!username || !securityCode) {
    return NextResponse.json({ error: 'BB API credentials not configured' }, { status: 500 });
  }

  let cookie: string | null = null;

  try {
    cookie = await bbApiLogin(username, securityCode);
    const seasons = await fetchSeasons(cookie);
    const current = getCurrentSeason(seasons);

    return NextResponse.json({
      currentSeason: current ? current.id : null,
      seasons: seasons.map(s => ({ id: s.id, start: s.start, finish: s.finish })),
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to fetch seasons',
    }, { status: 502 });
  } finally {
    if (cookie) {
      try { await bbApiLogout(cookie); } catch { /* ignore */ }
    }
  }
}
