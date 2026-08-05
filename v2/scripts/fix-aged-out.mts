import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Rollover repair: players whose latest snapshot pairs the NEW season with their
 * PRE-rollover age derive an age that is too low forever — and since the weekly
 * players sync only fetches ages 18-21, anyone who actually turned 22 never gets
 * restamped and pollutes census candidate lists with unrecruitable players
 * (root cause of census run #22's abort, 2026-08-05: free agents created at 21
 * days before the rollover, +1 at the flip, stamped season-73/age-21 by a sync).
 *
 * Fix: fetch the true age-22 universe from the Players API and insert corrected
 * light 'api' snapshots for exactly those players our DB still derives as <=21.
 * Run after every season rollover, alongside daily-sync --force-players.
 *
 * Usage (from v2/): npx tsx scripts/fix-aged-out.mts [--dry-run]
 */
import { inArray, and, eq, gte, sql } from 'drizzle-orm';

const dryRun = process.argv.includes('--dry-run');
const SLOVENIA = 66;

const { fetchCountryPlayers, mapApiPlayerToSnapshot } = await import('../src/server/bb/players-api');
const { getCurrentSeasonId } = await import('../src/queries/players');
const { db } = await import('../src/db/index');
const { snapshots } = await import('../src/db/schema');

const season = await getCurrentSeasonId();
const api22 = await fetchCountryPlayers(SLOVENIA, 22, 22);
const ids = api22.map((p) => p.playerId);
console.log(`season ${season}; API reports ${api22.length} Slovenian 22-year-olds`);

const latest = await db.execute(sql`
  select distinct on (player_id) player_id, age, season from snapshots
  where player_id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})
  order by player_id, captured_at desc`);
const staleIds = new Set(
  (latest.rows as { player_id: number; age: number | null; season: number | null }[])
    .filter((r) => r.age != null && r.season != null && r.age + (season - r.season) <= 21)
    .map((r) => Number(r.player_id)),
);
const stale = api22.filter((p) => staleIds.has(p.playerId));
console.log(`stale rows (derive <=21 but are 22 in-game): ${stale.length}`);
for (const p of stale) console.log(`  ${p.playerId} ${p.firstName} ${p.lastName} (team ${p.teamName ?? p.teamId ?? '-'})`);

if (!dryRun && stale.length > 0) {
  const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const staleIdList = stale.map((p) => p.playerId);
  const todays = await db.select({ id: snapshots.id }).from(snapshots)
    .where(and(eq(snapshots.source, 'api'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, staleIdList)));
  if (todays.length > 0) await db.delete(snapshots).where(inArray(snapshots.id, todays.map((t) => t.id)));
  await db.insert(snapshots).values(stale.map((p) => mapApiPlayerToSnapshot(p, season)));
  console.log(`inserted ${stale.length} corrected age-22 snapshots (replaced ${todays.length} same-day rows)`);
} else if (dryRun) {
  console.log('dry run — nothing written');
}
process.exit(0);
