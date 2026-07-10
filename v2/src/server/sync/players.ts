import { db, players, snapshots, syncLog, trackedCountries } from '@/db';
import { fetchCountryPlayers, mapApiPlayerToPlayer, mapApiPlayerToSnapshot } from '@/server/bb/players-api';
import { getCountriesCatalog } from './countries';
import { getCurrentSeasonId } from '@/queries/players';
import { sql, inArray, and, eq, gte } from 'drizzle-orm';

export function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SLOVENIA = 66;

export interface PlayersSyncCounts {
  countriesSynced: number;
  apiPlayers: number;
  newPlayers: number;
  snapshotsInserted: number;
  snapshotsUpdated: number;
}

export async function runPlayersSync(): Promise<PlayersSyncCounts> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'players' }).returning({ id: syncLog.id });
  try {
    const catalog = await getCountriesCatalog();
    const nameOf = new Map(catalog.map((c) => [c.id, c.name]));
    const tracked = await db.select().from(trackedCountries);
    const countryIds = [...new Set([SLOVENIA, ...tracked.map((t) => t.countryId).filter((x): x is number => x != null)])];

    const season = await getCurrentSeasonId();
    const counts: PlayersSyncCounts = { countriesSynced: 0, apiPlayers: 0, newPlayers: 0, snapshotsInserted: 0, snapshotsUpdated: 0 };

    for (const countryId of countryIds) {
      const apiPlayers = await fetchCountryPlayers(countryId, 18, 21);
      counts.countriesSynced++;
      counts.apiPlayers += apiPlayers.length;
      if (apiPlayers.length === 0) continue;

      const ids = apiPlayers.map((p) => p.playerId);
      const existing = await db.select({ id: players.bbPlayerId }).from(players).where(inArray(players.bbPlayerId, ids));
      const existingIds = new Set(existing.map((e) => e.id));
      counts.newPlayers += ids.length - existingIds.size;

      // upsert players (identity + current owner); nationality only set on insert
      const catalogName = nameOf.get(countryId) ?? String(countryId);
      const playerRows = apiPlayers.map((p) => mapApiPlayerToPlayer(p, catalogName));
      for (const chunk of chunks(playerRows, 500)) {
        await db.insert(players).values(chunk).onConflictDoUpdate({
          target: players.bbPlayerId,
          set: {
            name: sql`excluded.name`, firstName: sql`excluded.first_name`, lastName: sql`excluded.last_name`,
            countryId: sql`excluded.country_id`, heightCm: sql`excluded.height_cm`,
            bestPosition: sql`excluded.best_position`, isUtopian: sql`excluded.is_utopian`,
            seasonDrafted: sql`excluded.season_drafted`,
            ownerTeamId: sql`excluded.owner_team_id`, ownerTeamName: sql`excluded.owner_team_name`,
          },
        });
      }

      // dedup: one api snapshot per player per UTC day → update same-day, insert otherwise
      const todayStart = new Date(`${utcDayKey(new Date())}T00:00:00Z`);
      const todays = await db.select({ id: snapshots.id, playerId: snapshots.playerId }).from(snapshots)
        .where(and(eq(snapshots.source, 'api'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, ids)));
      const todayByPlayer = new Map(todays.map((t) => [t.playerId, t.id]));

      const inserts: ReturnType<typeof mapApiPlayerToSnapshot>[] = [];
      for (const p of apiPlayers) {
        const snap = mapApiPlayerToSnapshot(p, season);
        const existingId = todayByPlayer.get(p.playerId);
        if (existingId) {
          await db.update(snapshots).set(snap).where(eq(snapshots.id, existingId));
          counts.snapshotsUpdated++;
        } else {
          inserts.push(snap);
        }
      }
      for (const chunk of chunks(inserts, 500)) await db.insert(snapshots).values(chunk);
      counts.snapshotsInserted += inserts.length;
    }

    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(sql`id = ${logRow.id}`);
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(sql`id = ${logRow.id}`);
    throw e;
  }
}

function chunks<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
}
