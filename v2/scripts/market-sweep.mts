import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Daily market sweep, run on the Hetzner worker (no Vercel time limit).
 * One search per age (18/19/20/21) so each stays under BB's 1000-result
 * search cap — a combined 18–21 search exceeded it during the season-end
 * flood and silently lost the older listings. Per age: newest-first with
 * the usual 30h staleness early-stop, plus an oldest-first recovery pass
 * in the rare case a single age band still exhausts the 1000-result window.
 */
const { runMarketSweep } = await import('../src/server/sync/market');

const AGES = [18, 19, 20, 21];
for (const age of AGES) {
  const first = await runMarketSweep({ minAge: age, maxAge: age }, 'cron');
  console.log(JSON.stringify({ age, pass: 'newest-first', ...first }));

  const floodBeyondWindow = first.hitPageCap || (!first.stoppedEarly && first.totalListed >= 1000);
  if (floodBeyondWindow) {
    const second = await runMarketSweep({ oldestFirst: true, minAge: age, maxAge: age }, 'cron');
    console.log(JSON.stringify({ age, pass: 'oldest-first', ...second }));
  }
}

process.exit(0);
