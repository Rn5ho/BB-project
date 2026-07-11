import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { fetchTeamInfo } from '@/server/bb/xml-api';

const STALE_DAYS = 7;

/**
 * Refresh the teams table for any owner_team_id that is missing or older than STALE_DAYS.
 * Called after player sync. Failures are caught and logged — they must not fail the sync.
 */
export async function refreshTeams(ownerTeamIds: number[]): Promise<{ fetched: number; upserted: number }> {
  if (ownerTeamIds.length === 0) return { fetched: 0, upserted: 0 };

  const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 3600 * 1000).toISOString();

  // Find which of the supplied IDs are missing or stale
  const freshRows = await db.execute(
    sql`select team_id from teams where updated_at >= ${staleThreshold}`
  );
  const freshSet = new Set((freshRows.rows as { team_id: number }[]).map((r) => Number(r.team_id)));
  const staleIds = ownerTeamIds.filter((id) => !freshSet.has(id));

  if (staleIds.length === 0) return { fetched: 0, upserted: 0 };

  const infos = await fetchTeamInfo(staleIds);
  const now = new Date().toISOString();
  let upserted = 0;
  for (const t of infos) {
    await db.execute(
      sql`insert into teams (team_id, name, owner_alias, updated_at)
          values (${t.teamId}, ${t.name}, ${t.ownerAlias}, ${now})
          on conflict (team_id) do update set
            name = excluded.name,
            owner_alias = excluded.owner_alias,
            updated_at = excluded.updated_at`
    );
    upserted++;
  }
  return { fetched: infos.length, upserted };
}
