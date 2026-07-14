import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { currentAge } from '@/lib/domain';
import { getCurrentSeasonId } from '@/queries/players';

export interface ProjectablePlayer {
  bbPlayerId: number;
  name: string;
  age: number | null;
  potential: number | null;
  tsp: number | null;
}

/** Players with at least one full-skill snapshot, for the training-lab picker. */
export async function getProjectablePlayers(): Promise<ProjectablePlayer[]> {
  const season = await getCurrentSeasonId();

  const result = await db.execute(sql`
    with latest_full as (
      select distinct on (player_id) *
      from snapshots
      where jump_shot is not null
      order by player_id, captured_at desc
    )
    select p.bb_player_id, p.name, f.age, f.season, f.potential, f.tsp
    from players p
    join latest_full f on f.player_id = p.bb_player_id
    where p.country_id = 66 and p.archived = false
    order by p.name
  `);

  return (result.rows as Record<string, unknown>[]).map((r) => ({
    bbPlayerId: r.bb_player_id as number,
    name: r.name as string,
    age: currentAge(r.age as number | null, r.season as number | null, season),
    potential: r.potential as number | null,
    tsp: r.tsp as number | null,
  }));
}
