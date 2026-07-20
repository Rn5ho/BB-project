import { sql, eq } from 'drizzle-orm';
import { db, seasons } from '@/db';
import { seasonWeekOf } from '@/server/sync/minutes';
import type { CandidateRow } from './candidates';

/** CandidateRow plus display-only fields for the /census preview. */
export interface CandidateDetail extends CandidateRow {
  name: string | null;
  lastFullCapture: Date | null;
}

export async function currentSeasonWeek(season: number): Promise<number> {
  const [row] = await db.select().from(seasons).where(eq(seasons.id, season));
  return row ? Math.min(14, Math.max(1, seasonWeekOf(new Date(), row.start))) : 1;
}

export async function loadCandidateRows(season: number): Promise<CandidateDetail[]> {
  // Slovenian players + season-aware age from latest snapshot + fresh-full-this-season flag + oldest capture
  // Also pulls potential, salary from the latest snapshot, TSP + capture date from the latest FULL
  // snapshot, and height_cm from the players table.
  const result = await db.execute(sql`
    with latest as (
      select distinct on (player_id) player_id, age, season, potential, salary from snapshots order by player_id, captured_at desc
    ),
    fresh as (
      select distinct player_id from snapshots
      where jump_shot is not null and season = ${season} and source in ('census','market','manual')
    ),
    oldest as (
      select player_id, min(captured_at) as oldest_capture from snapshots where jump_shot is not null group by player_id
    ),
    latest_full as (
      -- 12-skill TSP to match the NT-track benchmarks; the stored tsp column is BB's page
      -- value, which excludes stamina + free throw (10-skill) — fallback only.
      select distinct on (player_id) player_id, captured_at as last_full_capture,
             coalesce(jump_shot + jump_range + outside_def + handling + driving + passing
                    + inside_shot + inside_def + rebounding + shot_blocking + stamina + free_throw, tsp) as tsp
      from snapshots where jump_shot is not null
      order by player_id, captured_at desc
    )
    select p.bb_player_id, p.name, l.age as snap_age, l.season as snap_season,
           (f.player_id is not null) as fresh_full, o.oldest_capture,
           l.potential, l.salary, p.height_cm, lf.tsp, lf.last_full_capture
    from players p
    left join latest l on l.player_id = p.bb_player_id
    left join fresh f on f.player_id = p.bb_player_id
    left join oldest o on o.player_id = p.bb_player_id
    left join latest_full lf on lf.player_id = p.bb_player_id
    where p.country_id = 66 or p.nationality in ('Slovenia', 'Slovenija')
  `);
  return (result.rows as Record<string, unknown>[]).map((r) => {
    const snapAge = r.snap_age as number | null;
    const snapSeason = r.snap_season as number | null;
    const ageNow = snapAge == null || snapSeason == null ? null : snapAge + (season - snapSeason);
    return {
      bbPlayerId: r.bb_player_id as number,
      name: (r.name as string | null) ?? null,
      ageNow,
      hasFreshFullThisSeason: r.fresh_full === true || r.fresh_full === 't' || r.fresh_full === 'true',
      oldestCapture: r.oldest_capture ? new Date(r.oldest_capture as string) : null,
      potential: r.potential != null ? Number(r.potential) : null,
      salary: r.salary != null ? Number(r.salary) : null,
      heightCm: r.height_cm != null ? Number(r.height_cm) : null,
      tsp: r.tsp != null ? Number(r.tsp) : null,
      lastFullCapture: r.last_full_capture ? new Date(r.last_full_capture as string) : null,
    };
  });
}

/** Best-effort "last known NT roster" — the originalRoster snapshot stored by the most
 *  recent clear-roster census run. Used by the preview to warn that rostered players are
 *  protected (never recruited → skipped) unless the run clears the roster first. */
export async function lastKnownRoster(): Promise<number[]> {
  const result = await db.execute(sql`
    select totals->'originalRoster' as roster from census_runs
    where totals ? 'originalRoster' order by id desc limit 1
  `);
  const roster = (result.rows as { roster: unknown }[])[0]?.roster;
  return Array.isArray(roster) ? roster.filter((v): v is number => typeof v === 'number') : [];
}
