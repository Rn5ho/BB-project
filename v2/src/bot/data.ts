// Read-only data layer for the Discord bot. Mirrors the loading pattern of
// scripts/training/journey.mts and the player page (latest full snapshot of any
// source for skills; NEWEST snapshot of ANY source for age; pop-anchored sublevels).
import { sql, eq } from 'drizzle-orm';
import { db, seasons } from '@/db';
import { seasonWeekOf } from '@/server/sync/minutes';
import { currentAge } from '@/lib/domain';
import { getCurrentSeasonId } from '@/queries/players';
import { getPopAnchors } from '@/queries/training';
import { playerStateFromSnapshot, boundsFromAnchors, applyAnchors } from '@/lib/training/bridge';
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import { displayed, type PlayerState } from '@/lib/training/engine';

export interface BotPlayer {
  bbPlayerId: number;
  name: string;
  heightCm: number;
  ageNow: number;
  potential: number;
  bestPosition: string | null;
  ownerTeamId: number | null;
  ownerTeamName: string | null;
  skillsDb: Record<string, number>;
  tsp: number;
  capturedAt: Date;
  state: PlayerState; // pop-anchored sublevels applied
  currentSeason: number;
  currentWeek: number;
}

export async function currentSeasonWeek(): Promise<{ season: number; week: number }> {
  const season = await getCurrentSeasonId();
  const [row] = await db.select().from(seasons).where(eq(seasons.id, season));
  const week = row ? Math.min(14, Math.max(1, seasonWeekOf(new Date(), row.start))) : 1;
  return { season, week };
}

/** Load a tracked player with a full 12-skill snapshot, ready to project.
 *  Throws human-readable errors (shown verbatim in the Discord reply). */
export async function loadBotPlayer(playerId: number): Promise<BotPlayer> {
  const { season: currentSeason, week: currentWeek } = await currentSeasonWeek();
  const rows = await db.execute(sql`
    with latest_full as (
      select distinct on (player_id) *
      from snapshots
      where jump_shot is not null and jump_range is not null and outside_def is not null
        and handling is not null and driving is not null and passing is not null
        and inside_shot is not null and inside_def is not null and rebounding is not null
        and shot_blocking is not null and stamina is not null and free_throw is not null
      order by player_id, captured_at desc
    ), latest_any as (
      select distinct on (player_id) player_id, age, season
      from snapshots
      where age is not null and season is not null
      order by player_id, captured_at desc
    )
    select p.bb_player_id, p.name, p.height_cm, p.best_position, p.owner_team_id, p.owner_team_name,
      a.age as snap_age, a.season as snap_season,
      f.potential, f.captured_at,
      f.jump_shot, f.jump_range, f.outside_def, f.handling, f.driving, f.passing,
      f.inside_shot, f.inside_def, f.rebounding, f.shot_blocking, f.stamina, f.free_throw
    from players p
    join latest_full f on f.player_id = p.bb_player_id
    join latest_any a on a.player_id = p.bb_player_id
    where p.bb_player_id = ${playerId}
  `);
  const row = (rows.rows as Record<string, unknown>[])[0];
  if (!row) throw new Error('No full-skill snapshot on file for that player — only fully scouted players can be projected.');
  if (row.height_cm == null) throw new Error('Player has no height on file — cannot project.');
  if (row.potential == null) throw new Error('Player has no potential on file — cannot project.');

  const ageNow = currentAge(row.snap_age as number | null, row.snap_season as number | null, currentSeason);
  if (ageNow == null) throw new Error('Player snapshot is missing age/season — cannot derive current age.');

  const SKILL_COLS = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing',
    'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw'] as const;
  const skillsDb = Object.fromEntries(SKILL_COLS.map((c) => [c, Number(row[c])])) as Record<string, number>;

  let state = playerStateFromSnapshot({
    skills: skillsDb, age: ageNow, heightCm: Number(row.height_cm), potential: Number(row.potential),
    stamina: skillsDb.stamina, freeThrow: skillsDb.free_throw,
  });
  const anchorRows = await getPopAnchors(playerId);
  const anchors = anchorRows
    .filter((a) => (SKILL_KEYS as readonly string[]).includes(a.skill))
    .map((a) => ({ skill: a.skill as SkillKey, toDisplayed: a.toDisplayed, windowStart: a.windowStart, windowEnd: a.windowEnd }));
  state = applyAnchors(state, boundsFromAnchors(skillsDb, anchors, new Date()));

  const tsp = SKILL_KEYS.reduce((a, k) => a + displayed(state.skills[k]), 0);

  return {
    bbPlayerId: Number(row.bb_player_id),
    name: String(row.name),
    heightCm: Number(row.height_cm),
    ageNow,
    potential: Number(row.potential),
    bestPosition: (row.best_position as string | null) ?? null,
    ownerTeamId: row.owner_team_id == null ? null : Number(row.owner_team_id),
    ownerTeamName: (row.owner_team_name as string | null) ?? null,
    skillsDb,
    tsp,
    capturedAt: new Date(row.captured_at as string),
    state,
    currentSeason,
    currentWeek,
  };
}

export interface PlayerSuggestion { bbPlayerId: number; name: string; ageNow: number | null; heightCm: number | null }

/** Name search for slash-command autocomplete (≤25 rows, fast). */
export async function searchPlayers(query: string, limit = 25): Promise<PlayerSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await db.execute(sql`
    with latest_any as (
      select distinct on (player_id) player_id, age, season
      from snapshots where age is not null and season is not null
      order by player_id, captured_at desc
    ), cur as (select max(id) as season from seasons)
    select p.bb_player_id, p.name, p.height_cm, a.age as snap_age, a.season as snap_season, cur.season as current_season
    from players p
    left join latest_any a on a.player_id = p.bb_player_id
    cross join cur
    where p.name ilike ${'%' + q + '%'}
    order by (p.name ilike ${q + '%'}) desc, p.name
    limit ${limit}
  `);
  return (rows.rows as Record<string, unknown>[]).map((r) => ({
    bbPlayerId: Number(r.bb_player_id),
    name: String(r.name),
    ageNow: currentAge(r.snap_age as number | null, r.snap_season as number | null, Number(r.current_season)),
    heightCm: r.height_cm == null ? null : Number(r.height_cm),
  }));
}
