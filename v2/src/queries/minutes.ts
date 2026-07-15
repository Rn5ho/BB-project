import { sql, eq, and } from 'drizzle-orm';
import { db, trainingPlans } from '@/db';

export interface WeekMinutes {
  season: number; seasonWeek: number;
  minPg: number; minSg: number; minSf: number; minPf: number; minC: number;
  games: number;
}

/** Last `weeks` season-weeks of per-position minutes, oldest→newest. */
export async function getPlayerWeeklyMinutes(playerId: number, weeks?: number): Promise<WeekMinutes[]> {
  const limit = weeks ?? 20;
  const result = await db.execute(sql`
    select * from (
      select m.season, m.season_week,
        sum(pmm.min_pg) as min_pg, sum(pmm.min_sg) as min_sg, sum(pmm.min_sf) as min_sf,
        sum(pmm.min_pf) as min_pf, sum(pmm.min_c) as min_c,
        count(*) as games
      from player_match_minutes pmm
      join matches m using (match_id)
      where pmm.player_id = ${playerId} and m.season_week is not null
      group by 1, 2
      order by 1 desc, 2 desc
      limit ${limit}
    ) sub
    order by season, season_week
  `);

  return (result.rows as Record<string, unknown>[]).map((r) => ({
    season: Number(r.season),
    seasonWeek: Number(r.season_week),
    minPg: Number(r.min_pg),
    minSg: Number(r.min_sg),
    minSf: Number(r.min_sf),
    minPf: Number(r.min_pf),
    minC: Number(r.min_c),
    games: Number(r.games),
  }));
}

export interface PlanRow {
  id: number; playerId: number; name: string;
  blocks: Array<{ trainingId: number; weeks: number }>;
  coachLevel: number; youthTrainerLevel: number;
  gymLevel: number; trainingCourtLevel: number;
  horizon: { age: number; week: number } | null;
  planNotes: string | null; updatedAt: Date;
}

export async function getActivePlan(playerId: number): Promise<PlanRow | null> {
  const [row] = await db.select().from(trainingPlans)
    .where(and(eq(trainingPlans.playerId, playerId), eq(trainingPlans.isActive, true)))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    playerId: row.playerId,
    name: row.name,
    blocks: row.blocks as Array<{ trainingId: number; weeks: number }>,
    coachLevel: row.coachLevel,
    youthTrainerLevel: row.youthTrainerLevel,
    gymLevel: row.gymLevel,
    trainingCourtLevel: row.trainingCourtLevel,
    horizon: row.horizonAge != null && row.horizonWeek != null
      ? { age: row.horizonAge, week: row.horizonWeek }
      : null,
    planNotes: row.planNotes,
    updatedAt: row.updatedAt,
  };
}
