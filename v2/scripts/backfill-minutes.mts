import { config } from 'dotenv';
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.log('backfill-minutes: DATABASE_URL not set — no-op.');
  process.exit(0);
}

const args = process.argv.slice(2);
const val = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

const { runMinutesSync } = await import('../src/server/sync/minutes');
const { getCurrentSeasonId } = await import('../src/queries/players');

const seasonArg = val('--season');
const season = seasonArg ? Number(seasonArg) : await getCurrentSeasonId();

console.log(`backfill-minutes: season ${season}`);

const MAX_ROUNDS = 50;
let round = 0;
for (; round < MAX_ROUNDS; round++) {
  const counts = await runMinutesSync(
    { clubBatch: 150, matchBatch: 500, season, forceSchedules: true },
    'backfill',
  );
  console.log(`round ${round + 1}:`, JSON.stringify(counts));
  if (counts.clubsRemaining === 0 && counts.matchesRemaining === 0) {
    console.log('backfill-minutes: complete.');
    process.exit(0);
  }
}

console.log(`backfill-minutes: stopped after ${MAX_ROUNDS} rounds — work may remain, rerun to continue.`);
process.exit(0);
