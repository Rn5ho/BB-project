import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Rollover age reconciler (generalized 2026-08-05 after the World-page report).
 *
 * Failure class: a players/market sync that runs in BB's rollover lag window (season
 * flipped, API/page ages not yet) stamps (new season, old age) — the derived age is
 * then wrong FOREVER because derivation = snap_age + (current − snap_season), and:
 *  - players who actually turned 22 keep deriving 21 (stuck on the World/Slovenia pages,
 *    unrecruitable in censuses — census #22's abort);
 *  - rookies stamped pre-rollover derive one year too OLD (documented Slovenian case).
 * World players are market-discovered (tracked_countries is empty), so nothing ever
 * restamps them unless they get re-listed.
 *
 * Fix: for EVERY country with players in our DB, fetch the true age 18-22 universe from
 * the Players API and insert corrected light 'api' snapshots for exactly those players
 * whose derived age differs from the API age. Updates only players we already hold —
 * never ingests new ones. Players absent from the API (deleted by BB) are counted and
 * left alone (pruning is a separate backlog item).
 *
 * Run after every season rollover (alongside daily-sync --force-players).
 * Usage (from v2/): npx tsx scripts/fix-aged-out.mts [--dry-run]
 */
import { inArray, and, eq, gte, sql } from 'drizzle-orm';

const dryRun = process.argv.includes('--dry-run');

const { fetchCountryPlayers, mapApiPlayerToSnapshot } = await import('../src/server/bb/players-api');
const { getCurrentSeasonId } = await import('../src/queries/players');
const { db } = await import('../src/db/index');
const { snapshots } = await import('../src/db/schema');

const season = await getCurrentSeasonId();
const countries = await db.execute(sql`
  select country_id, count(*) as n from players
  where country_id is not null group by country_id order by n desc`);
console.log(`season ${season}; ${countries.rows.length} countries in players table`);

const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
let totalFixed = 0;

for (const row of countries.rows as { country_id: number }[]) {
  const countryId = Number(row.country_id);
  let api;
  try {
    api = await fetchCountryPlayers(countryId, 18, 22);
  } catch (e) {
    console.log(`country ${countryId}: API fetch failed — ${String(e).slice(0, 120)}`);
    continue;
  }
  const apiById = new Map(api.map((p) => [p.playerId, p]));
  const ids = [...apiById.keys()];
  if (ids.length === 0) continue;

  const latest = await db.execute(sql`
    select distinct on (player_id) player_id, age, season from snapshots
    where player_id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})
    order by player_id, captured_at desc`);
  const stale = (latest.rows as { player_id: number; age: number | null; season: number | null }[])
    .filter((r) => {
      const p = apiById.get(Number(r.player_id));
      if (!p || r.age == null || r.season == null) return false;
      return r.age + (season - r.season) !== p.age;
    })
    .map((r) => apiById.get(Number(r.player_id))!);

  if (stale.length === 0) { console.log(`country ${countryId}: ${latest.rows.length} known, 0 stale`); continue; }
  console.log(`country ${countryId}: ${latest.rows.length} known in API window, ${stale.length} stale ages`);

  if (!dryRun) {
    const staleIds = stale.map((p) => p.playerId);
    const todays = await db.select({ id: snapshots.id }).from(snapshots)
      .where(and(eq(snapshots.source, 'api'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, staleIds)));
    if (todays.length > 0) await db.delete(snapshots).where(inArray(snapshots.id, todays.map((t) => t.id)));
    await db.insert(snapshots).values(stale.map((p) => mapApiPlayerToSnapshot(p, season)));
    totalFixed += stale.length;
  } else {
    totalFixed += stale.length;
  }
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`${dryRun ? 'DRY RUN — would fix' : 'fixed'} ${totalFixed} stale-age players across all countries`);
process.exit(0);
