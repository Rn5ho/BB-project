import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { currentAge, pickCurrentSeason } from '@/lib/domain';

export interface PlayerListRow {
  bbPlayerId: number;
  name: string;
  nationality: string | null;
  heightCm: number | null;
  bestPosition: string | null;
  // from latest snapshot (any source)
  ageNow: number | null;
  dmi: number | null;
  gameShape: number | null;
  salary: number | null;
  potential: number | null;
  capturedAt: Date | null;
  snapshotSeason: number | null;
  // from latest FULL snapshot (skills present)
  tsp: number | null;
  skills: Record<string, number | null> | null;
  skillsCapturedAt: Date | null;
  hasFullSkills: boolean;
  // from latest market snapshot
  onMarketUntil: Date | null;   // set only when auction_ends_at > now at query time
  lastListedPrice: number | null;
  isRookie: boolean;
}

export async function getCurrentSeasonId(): Promise<number> {
  const rows = await db.query.seasons.findMany();
  return pickCurrentSeason(rows, new Date());
}

export type PlayerScope = 'slovenia' | 'world';

export async function listPlayers(scope: PlayerScope): Promise<PlayerListRow[]> {
  const slovene = sql`(p.country_id = 66 or p.nationality = 'Slovenia')`;
  const notSlovene = sql`(p.country_id is distinct from 66 and p.nationality is distinct from 'Slovenia')`;
  const where = scope === 'slovenia' ? sql`where ${slovene}` : sql`where ${notSlovene}`;

  const result = await db.execute(sql`
    with latest as (
      select distinct on (player_id) *
      from snapshots order by player_id, captured_at desc
    ),
    latest_full as (
      select distinct on (player_id) *
      from snapshots where jump_shot is not null
      order by player_id, captured_at desc
    ),
    latest_market as (
      select distinct on (player_id) player_id, auction_ends_at, starting_price, is_rookie_listing
      from snapshots where source = 'market'
      order by player_id, captured_at desc
    )
    select
      p.bb_player_id, p.name, p.nationality, p.height_cm, p.best_position,
      l.age as snap_age, l.season as snap_season, l.dmi, l.game_shape, l.salary, l.potential, l.captured_at,
      f.tsp, f.captured_at as skills_captured_at,
      f.jump_shot, f.jump_range, f.outside_def, f.handling, f.driving, f.passing,
      f.inside_shot, f.inside_def, f.rebounding, f.shot_blocking, f.stamina, f.free_throw,
      m.auction_ends_at, m.starting_price, m.is_rookie_listing
    from players p
    left join latest l on l.player_id = p.bb_player_id
    left join latest_full f on f.player_id = p.bb_player_id
    left join latest_market m on m.player_id = p.bb_player_id
    ${where}
  `);

  const season = await getCurrentSeasonId();
  const now = new Date();
  return (result.rows as Record<string, unknown>[]).map((r) => {
    const auctionEndsAt = r.auction_ends_at ? r.auction_ends_at as Date : null;
    const onMarketUntil = auctionEndsAt != null && auctionEndsAt > now ? auctionEndsAt : null;
    return {
      bbPlayerId: r.bb_player_id as number,
      name: r.name as string,
      nationality: r.nationality as string | null,
      heightCm: r.height_cm as number | null,
      bestPosition: r.best_position as string | null,
      ageNow: currentAge(r.snap_age as number | null, r.snap_season as number | null, season),
      dmi: r.dmi == null ? null : Number(r.dmi),
      gameShape: r.game_shape as number | null,
      salary: r.salary as number | null,
      potential: r.potential as number | null,
      capturedAt: r.captured_at ? r.captured_at as Date : null,
      snapshotSeason: r.snap_season as number | null,
      tsp: r.tsp as number | null,
      skills: r.jump_shot == null ? null : {
        jump_shot: r.jump_shot as number | null, jump_range: r.jump_range as number | null,
        outside_def: r.outside_def as number | null, handling: r.handling as number | null,
        driving: r.driving as number | null, passing: r.passing as number | null,
        inside_shot: r.inside_shot as number | null, inside_def: r.inside_def as number | null,
        rebounding: r.rebounding as number | null, shot_blocking: r.shot_blocking as number | null,
        stamina: r.stamina as number | null, free_throw: r.free_throw as number | null,
      },
      skillsCapturedAt: r.skills_captured_at ? r.skills_captured_at as Date : null,
      hasFullSkills: r.jump_shot != null,
      onMarketUntil,
      lastListedPrice: r.starting_price == null ? null : Number(r.starting_price),
      isRookie: r.is_rookie_listing === true,
    };
  });
}
