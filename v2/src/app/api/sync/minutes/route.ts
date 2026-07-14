import { NextResponse } from 'next/server';
import { runMinutesSync } from '@/server/sync/minutes';

/**
 * Manual "Sync now" endpoint for the minutes job. Protected by the app-wide
 * session proxy (src/proxy.ts) — no CRON_SECRET here since this route isn't
 * excluded from the auth matcher.
 */
export async function POST() {
  try {
    const counts = await runMinutesSync({}, 'manual');
    return NextResponse.json({ ok: true, counts });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
