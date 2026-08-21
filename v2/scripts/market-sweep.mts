import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Daily market sweep, run on the Hetzner worker (no Vercel time limit).
 * One search per age (18/19/20/21) so each stays under BB's 1000-result
 * search cap — a combined 18–21 search exceeded it during the season-end
 * flood and silently lost the older listings. Per age: newest-first with
 * the usual 30h staleness early-stop, plus an oldest-first recovery pass
 * in the rare case a single age band still exhausts the 1000-result window.
 * Each band runs in its own try/catch — a transient BB 503 in one band must
 * not kill the remaining bands (it did, observed 2026-08-06).
 * After the U21 bands: the senior-NT sweep (age 22+, IsOnNT, no potential
 * floor) — market cards expose the full skills senior NT rosters hide.
 */
const { runMarketSweep, SENIOR_NT_SWEEP_OPTS } = await import('../src/server/sync/market');
const { runSeasonsSync } = await import('../src/server/sync/seasons');

// Seasons FIRST, always: snapshots are stamped with the current season id, and derived
// age = snap_age + (current_season - snap_season). Sweeping with a stale season id on
// rollover day would stamp post-rollover ages with the pre-rollover season, skewing
// every swept player's derived age +1 until their next capture.
console.log(JSON.stringify({ seasons: await runSeasonsSync('cron') }));

const AGES = [18, 19, 20, 21];
for (const age of AGES) {
  try {
    const first = await runMarketSweep({ minAge: age, maxAge: age }, 'cron');
    console.log(JSON.stringify({ age, pass: 'newest-first', ...first }));

    const floodBeyondWindow = first.hitPageCap || (!first.stoppedEarly && first.totalListed >= 1000);
    if (floodBeyondWindow) {
      const second = await runMarketSweep({ oldestFirst: true, minAge: age, maxAge: age }, 'cron');
      console.log(JSON.stringify({ age, pass: 'oldest-first', ...second }));
    }
  } catch (e) {
    console.log(JSON.stringify({ age, error: String(e) }));
  }
}

try {
  const first = await runMarketSweep(SENIOR_NT_SWEEP_OPTS, 'cron');
  console.log(JSON.stringify({ scope: 'senior-nt', pass: 'newest-first', ...first }));

  const floodBeyondWindow = first.hitPageCap || (!first.stoppedEarly && first.totalListed >= 1000);
  if (floodBeyondWindow) {
    const second = await runMarketSweep({ ...SENIOR_NT_SWEEP_OPTS, oldestFirst: true }, 'cron');
    console.log(JSON.stringify({ scope: 'senior-nt', pass: 'oldest-first', ...second }));
  }
} catch (e) {
  console.log(JSON.stringify({ scope: 'senior-nt', error: String(e) }));
}

process.exit(0);
