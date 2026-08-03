import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Daily non-market sync, run on the Hetzner worker. Mirrors /api/cron/daily
 * (which regularly blew Vercel's 300 s maxDuration as the DB grew — 504s):
 * seasons every run; minutes every run (incremental, batch-limited);
 * inference every run (DB-only); players + teams weekly (Mondays UTC) or
 * with `--force-players`. Market is NOT here — market-sweep.mts runs it.
 */
const forcePlayers = process.argv.includes('--force-players');

const { runSeasonsSync } = await import('../src/server/sync/seasons');
const { runPlayersSync } = await import('../src/server/sync/players');
const { runMinutesSync } = await import('../src/server/sync/minutes');
const { refreshTeams } = await import('../src/server/sync/teams');
const { runTrainingInference } = await import('../src/server/sync/inference');

const results: Record<string, unknown> = {};
results.seasons = await runSeasonsSync('cron');
try {
  results.minutes = await runMinutesSync({ clubBatch: 100, matchBatch: 400 }, 'cron');
} catch (err) {
  console.error('minutes sync failed (non-fatal):', err);
  results.minutes = { error: String(err) };
}
try {
  results.inference = await runTrainingInference('cron');
} catch (err) {
  console.error('training inference failed (non-fatal):', err);
  results.inference = { error: String(err) };
}
if (new Date().getUTCDay() === 1 || forcePlayers) {
  results.players = await runPlayersSync('cron');
  try {
    const { db } = await import('../src/db/index');
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
console.log(JSON.stringify(results));
process.exit(0);
