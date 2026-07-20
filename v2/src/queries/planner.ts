import { eq, sql } from 'drizzle-orm';
import { db, seasons } from '@/db';
import { currentAge } from '@/lib/domain';
import { applyAnchors, boundsFromAnchors, playerStateFromSnapshot } from '@/lib/training/bridge';
import type { BoardPlayerInput } from '@/lib/training/board';
import type { PopAnchor } from '@/lib/training/sublevels';
import { SKILL_DB_NAMES, SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import { getCurrentSeasonId } from '@/queries/players';
import type { WeekMinutes } from '@/queries/minutes';
import { seasonWeekOf } from '@/server/sync/minutes';

const SKILL_COLS = [
  'jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing',
  'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw',
] as const;

export interface PlannerData {
  players: BoardPlayerInput[];
  currentSeasonWeek: number;
}

export async function getPlannerData(): Promise<PlannerData> {
  const season = await getCurrentSeasonId();
  const [seasonRow] = await db.select().from(seasons).where(eq(seasons.id, season));
  const currentSeasonWeek = seasonRow ? Math.min(14, Math.max(1, seasonWeekOf(new Date(), seasonRow.start))) : 1;

  const [playersRes, obsRes, minutesRes, anchorsRes] = await Promise.all([
    db.execute(sql`
      with latest_full as (
        select distinct on (player_id) *
        from snapshots where jump_shot is not null
        order by player_id, captured_at desc
      )
      select p.bb_player_id, p.name, p.height_cm, p.owner_team_id, p.owner_team_name,
        f.age as snap_age, f.season as snap_season, f.potential,
        -- 12-skill TSP (board benchmarks are 12-skill); the stored tsp column is BB's page
        -- value, which excludes stamina + free throw — fallback only.
        coalesce(f.jump_shot + f.jump_range + f.outside_def + f.handling + f.driving + f.passing
               + f.inside_shot + f.inside_def + f.rebounding + f.shot_blocking + f.stamina + f.free_throw, f.tsp) as tsp,
        f.jump_shot, f.jump_range, f.outside_def, f.handling, f.driving, f.passing,
        f.inside_shot, f.inside_def, f.rebounding, f.shot_blocking, f.stamina, f.free_throw
      from players p
      join latest_full f on f.player_id = p.bb_player_id
      where (p.country_id = 66 or p.nationality in ('Slovenia', 'Slovenija'))
        and p.archived = false and p.height_cm is not null
    `),
    db.execute(sql`
      -- Per club: newest USABLE observation (inferred training at high/medium confidence);
      -- low/null windows only when nothing usable exists. Plain newest-first let a fresh
      -- 1-pop low/null window shadow an older high-confidence one; recency still decides
      -- among usable windows so a genuine training switch surfaces once re-inferred.
      select distinct on (team_id) team_id, window_end, inferred_training_id, confidence
      from training_observations
      order by team_id,
        (inferred_training_id is not null and confidence in ('high', 'medium')) desc,
        window_end desc
    `),
    db.execute(sql`
      select pmm.player_id, m.season, m.season_week,
        sum(pmm.min_pg)::int as min_pg, sum(pmm.min_sg)::int as min_sg, sum(pmm.min_sf)::int as min_sf,
        sum(pmm.min_pf)::int as min_pf, sum(pmm.min_c)::int as min_c, count(*)::int as games
      from player_match_minutes pmm
      join matches m using (match_id)
      where m.season = ${season} and m.season_week is not null and m.season_week >= ${currentSeasonWeek - 3}
      group by 1, 2, 3
    `),
    db.execute(sql`
      select distinct on (player_id, skill) player_id, skill, to_displayed, window_start, window_end
      from skill_pops
      where delta > 0
      order by player_id, skill, window_start desc, (window_end - window_start) asc
    `),
  ]);

  const obsByTeam = new Map<number, { trainingId: number | null; confidence: 'high' | 'medium' | 'low'; windowEndIso: string }>();
  for (const r of obsRes.rows as Record<string, unknown>[]) {
    obsByTeam.set(Number(r.team_id), {
      trainingId: r.inferred_training_id == null ? null : Number(r.inferred_training_id),
      confidence: r.confidence as 'high' | 'medium' | 'low',
      windowEndIso: new Date(r.window_end as string).toISOString(),
    });
  }

  const minutesByPlayer = new Map<number, WeekMinutes[]>();
  for (const r of minutesRes.rows as Record<string, unknown>[]) {
    const pid = Number(r.player_id);
    const list = minutesByPlayer.get(pid) ?? [];
    list.push({
      season: Number(r.season), seasonWeek: Number(r.season_week),
      minPg: Number(r.min_pg), minSg: Number(r.min_sg), minSf: Number(r.min_sf),
      minPf: Number(r.min_pf), minC: Number(r.min_c), games: Number(r.games),
    });
    minutesByPlayer.set(pid, list);
  }

  const anchorsByPlayer = new Map<number, PopAnchor[]>();
  for (const r of anchorsRes.rows as Record<string, unknown>[]) {
    const skill = String(r.skill);
    if (!(SKILL_KEYS as readonly string[]).includes(skill)) continue;
    const pid = Number(r.player_id);
    const list = anchorsByPlayer.get(pid) ?? [];
    list.push({
      skill: skill as SkillKey, toDisplayed: Number(r.to_displayed),
      windowStart: new Date(r.window_start as string), windowEnd: new Date(r.window_end as string),
    });
    anchorsByPlayer.set(pid, list);
  }

  const now = new Date();
  const players: BoardPlayerInput[] = [];
  for (const r of playersRes.rows as Record<string, unknown>[]) {
    const age = currentAge(r.snap_age as number | null, r.snap_season as number | null, season);
    if (age == null || age < 18 || age > 21) continue;
    if (SKILL_COLS.some((c) => r[c] == null)) continue;
    const pid = Number(r.bb_player_id);
    const skillsDb = Object.fromEntries(SKILL_COLS.map((c) => [c, Number(r[c])]));
    const potential = r.potential == null ? 0 : Number(r.potential);
    const state = playerStateFromSnapshot({
      skills: skillsDb, age, heightCm: Number(r.height_cm), potential,
      stamina: skillsDb.stamina, freeThrow: skillsDb.free_throw,
    });
    const bounds = boundsFromAnchors(skillsDb, anchorsByPlayer.get(pid) ?? [], now);
    const ownerTeamId = r.owner_team_id == null ? null : Number(r.owner_team_id);
    players.push({
      bbPlayerId: pid, name: String(r.name), age, heightCm: Number(r.height_cm), potential,
      state: applyAnchors(state, bounds),
      displayedSkills: SKILL_KEYS.map((k) => Number(r[SKILL_DB_NAMES[k]])),
      tspNow: r.tsp == null ? null : Number(r.tsp),
      ownerTeamId, ownerTeamName: r.owner_team_name == null ? null : String(r.owner_team_name),
      inferred: ownerTeamId != null ? obsByTeam.get(ownerTeamId) ?? null : null,
      recentWeeks: minutesByPlayer.get(pid) ?? [],
      currentSeasonWeek,
    });
  }

  return { players, currentSeasonWeek };
}
