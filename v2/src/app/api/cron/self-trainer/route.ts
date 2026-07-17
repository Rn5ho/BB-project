import { NextRequest, NextResponse } from 'next/server';
import { runSelfTrainer } from '@/server/sync/self-trainer';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Weekly self-trainer: own-team training-history scrape + model scoring.
 * Fired by the Hetzner crontab Fridays 11:30 UTC — after BB's Friday training
 * update (~12:20 Berlin = 10:20/11:20 UTC depending on DST). Like /api/cron/daily
 * this route is excluded from the auth proxy and protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const counts = await runSelfTrainer('cron');
    return NextResponse.json({ ok: true, ...counts });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
