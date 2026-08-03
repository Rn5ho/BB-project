import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Daily market sweep, run on the Hetzner worker (no Vercel time limit).
 * Pass 1: newest-first with the usual 30h staleness early-stop.
 * Pass 2 (flood recovery): when pass 1 exhausted BB's 1000-result window
 * without reaching stale listings, the flood extends past what newest-first
 * can see — sweep again oldest-first to capture listings from the other end.
 */
const { runMarketSweep } = await import('../src/server/sync/market');

const first = await runMarketSweep({}, 'cron');
console.log(JSON.stringify({ pass: 'newest-first', ...first }));

const floodBeyondWindow = first.hitPageCap || (!first.stoppedEarly && first.totalListed >= 1000);
if (floodBeyondWindow) {
  const second = await runMarketSweep({ oldestFirst: true }, 'cron');
  console.log(JSON.stringify({ pass: 'oldest-first', ...second }));
}

process.exit(0);
