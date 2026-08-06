import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Rollover age reconciler (all countries; generalized 2026-08-05, fallbacks 2026-08-06).
 *
 * Failure class: a sync that runs in BB's rollover lag window (season flipped, page/API
 * ages not yet) stamps (new season, old age) pairs that derive wrong FOREVER — the
 * weekly 18-21 sync never re-fetches aged-out players, and the market sweep's staleness
 * early-stop skips still-active listings it has already seen (2026-08-04 poison window:
 * Aug 4 00:00 → Aug 5 07:00 UTC).
 *
 * Three-tier repair, per country in the players table:
 *  1. Fetch the true age 18-22 universe from the Players API; restamp DB players whose
 *     derived age mismatches.
 *  2. If that fetch dies on BB's 1000-row cap (big countries at ages 18/19): fetch
 *     single ages 18..23 individually, reconcile from whatever succeeded.
 *  3. --deep: residual players whose LATEST snapshot sits in the poison window and whose
 *     cohort stayed uncovered get their live player page fetched (BbWebSession, logged-in
 *     GET) and the page's "Age: N" is stamped directly. Read-only vs BB.
 *
 * Usage (from v2/): npx tsx scripts/fix-aged-out.mts [--dry-run] [--deep]
 */
import { inArray, and, eq, gte, sql } from 'drizzle-orm';

const dryRun = process.argv.includes('--dry-run');
const deep = process.argv.includes('--deep');

const { fetchCountryPlayers, mapApiPlayerToSnapshot } = await import('../src/server/bb/players-api');
const { getCurrentSeasonId } = await import('../src/queries/players');
const { db } = await import('../src/db/index');
const { snapshots } = await import('../src/db/schema');
type BbApiPlayer = import('../src/server/bb/players-api').BbApiPlayer;

const season = await getCurrentSeasonId();
const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
const POISON_START = '2026-08-04T00:00:00Z';
const POISON_END = '2026-08-05T07:00:00Z';

const countries = await db.execute(sql`
  select country_id, count(*) as n from players
  where country_id is not null group by country_id order by n desc`);
console.log(`season ${season}; ${countries.rows.length} countries; deep=${deep} dry=${dryRun}`);

async function reconcile(countryId: number, api: BbApiPlayer[]): Promise<number> {
  const apiById = new Map(api.map((p) => [p.playerId, p]));
  const ids = [...apiById.keys()];
  if (ids.length === 0) return 0;
  const latest = await db.execute(sql`
    select distinct on (player_id) player_id, age, season from snapshots
    where player_id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})
    order by player_id, captured_at desc`);
  const stale = (latest.rows as { player_id: number; age: number | null; season: number | null }[])
    .filter((r) => {
      const p = apiById.get(Number(r.player_id));
      return p && r.age != null && r.season != null && r.age + (season - r.season) !== p.age;
    })
    .map((r) => apiById.get(Number(r.player_id))!);
  if (stale.length > 0 && !dryRun) {
    const staleIds = stale.map((p) => p.playerId);
    const todays = await db.select({ id: snapshots.id }).from(snapshots)
      .where(and(eq(snapshots.source, 'api'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, staleIds)));
    if (todays.length > 0) await db.delete(snapshots).where(inArray(snapshots.id, todays.map((t) => t.id)));
    await db.insert(snapshots).values(stale.map((p) => mapApiPlayerToSnapshot(p, season)));
  }
  return stale.length;
}

let totalFixed = 0;
const coveredByCountry = new Map<number, Set<number>>();
const uncoveredAges = new Map<number, number[]>();

for (const row of countries.rows as { country_id: number }[]) {
  const countryId = Number(row.country_id);
  let api: BbApiPlayer[] = [];
  const missing: number[] = [];
  try {
    api = await fetchCountryPlayers(countryId, 18, 22);
  } catch {
    // tier 2: single-age windows, each on its own
    for (let a = 18; a <= 23; a++) {
      try {
        api.push(...await fetchCountryPlayers(countryId, a, a));
      } catch {
        missing.push(a);
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  coveredByCountry.set(countryId, new Set(api.map((p) => p.playerId)));
  if (missing.length > 0) uncoveredAges.set(countryId, missing);
  const fixed = await reconcile(countryId, api);
  totalFixed += fixed;
  if (fixed > 0 || missing.length > 0) {
    console.log(`country ${countryId}: ${fixed} fixed via API${missing.length ? `; uncovered ages ${missing.join(',')}` : ''}`);
  }
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`API tiers: ${dryRun ? 'would fix' : 'fixed'} ${totalFixed}`);

// ---- tier 3: page-verify residual poison-window players ----
if (deep) {
  const flagged = await db.execute(sql`
    with latest as (
      select distinct on (player_id) player_id, age, season, captured_at from snapshots
      order by player_id, captured_at desc
    )
    select p.bb_player_id, p.country_id, l.age as snap_age, l.season as snap_season
    from players p join latest l on l.player_id = p.bb_player_id
    where l.season = ${season}
      and l.captured_at >= ${POISON_START} and l.captured_at < ${POISON_END}
      and l.age + (${season} - l.season) between 18 and 21`);
  const residual = (flagged.rows as { bb_player_id: number; country_id: number | null; snap_age: number; snap_season: number }[])
    .filter((r) => !(r.country_id != null && coveredByCountry.get(Number(r.country_id))?.has(Number(r.bb_player_id))));
  console.log(`deep: ${flagged.rows.length} poison-window flagged, ${residual.length} residual after API coverage`);

  if (residual.length > 0) {
    const { BbWebSession } = await import('../src/server/bb/web-session');
    const web = new BbWebSession();
    await web.login();
    let pageFixed = 0, gone = 0, checked = 0;
    for (const r of residual) {
      const id = Number(r.bb_player_id);
      checked++;
      let html = '';
      try {
        html = await web.get(`/player/${id}/overview.aspx`);
      } catch {
        continue;
      }
      const m = html.match(/Age:\s*(\d+)/);
      if (!m) { gone++; continue; } // deleted player page — pruning is separate backlog
      const pageAge = Number(m[1]);
      const derived = r.snap_age + (season - r.snap_season);
      if (pageAge !== derived) {
        if (!dryRun) {
          // corrected light row: identity truth from the live page (age+season only)
          await db.insert(snapshots).values({ playerId: id, source: 'api', season, age: pageAge });
        }
        pageFixed++;
      }
      if (checked % 100 === 0) console.log(`deep progress: ${checked}/${residual.length} (${pageFixed} fixed, ${gone} gone)`);
      await new Promise((r2) => setTimeout(r2, 400));
    }
    console.log(`deep: checked ${checked}, ${dryRun ? 'would fix' : 'fixed'} ${pageFixed}, deleted/no-age ${gone}`);
  }
}
process.exit(0);
