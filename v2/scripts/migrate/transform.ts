import { tsp } from '../../src/lib/domain';

export interface V1Player {
  id: number; bb_player_id: number; name: string; nationality: string | null;
  height: string | null; position: string | null; is_nt_player: boolean; created_at: string;
}

export interface V1Snapshot {
  id: number; player_id: number; captured_by: string | null; captured_at: string;
  source: 'extension' | 'manual' | 'api'; bb_season: number | null;
  age: number | null; salary: number | null; experience: number | null;
  skill_points: number | null; game_shape: number | null; potential: number | null; dmi: number | null;
  jump_shot: number | null; jump_range: number | null; outside_def: number | null;
  handling: number | null; driving: number | null; passing: number | null;
  inside_shot: number | null; inside_def: number | null; rebounding: number | null;
  shot_blocking: number | null; stamina: number | null; free_throw: number | null;
  owner_team_name: string | null; owner_team_id: number | null;
}

/**
 * Parses a height string and returns a value in centimetres.
 *
 * Handles two formats:
 *  - Extension-scraped rows: e.g. `6'5" / 196 cm` — the numeric part is already cm.
 *  - BB API-sourced (v1) rows: the API returns heights in **inches** but the v1
 *    migration stored them with a "cm" suffix (e.g. `"73 cm"` where 73 is inches).
 *    Basketball player heights are 165–236 cm / 65–93 in, so any value < 100
 *    is unambiguously inches and is converted via Math.round(n * 2.54).
 */
export function heightToCm(height: string | null): number | null {
  if (!height) return null;
  const m = height.match(/(\d{2,3})\s*cm/);
  if (!m) return null;
  const n = Number(m[1]);
  return n < 100 ? Math.round(n * 2.54) : n;
}

export function transformPlayer(p: V1Player) {
  return {
    bbPlayerId: p.bb_player_id,
    name: p.name,
    countryId: p.nationality === 'Slovenia' ? 66 : null,
    nationality: p.nationality,
    heightCm: heightToCm(p.height),
    bestPosition: p.position,
    firstSeenAt: new Date(p.created_at),
  };
}

export function transformSnapshot(s: V1Snapshot, v1IdToBbId: Map<number, number>) {
  const bbId = v1IdToBbId.get(s.player_id);
  if (!bbId) return null;
  const skills = {
    jump_shot: s.jump_shot, jump_range: s.jump_range, outside_def: s.outside_def,
    handling: s.handling, driving: s.driving, passing: s.passing,
    inside_shot: s.inside_shot, inside_def: s.inside_def, rebounding: s.rebounding,
    shot_blocking: s.shot_blocking, stamina: s.stamina, free_throw: s.free_throw,
  };
  return {
    playerId: bbId,
    capturedAt: new Date(s.captured_at),
    source: s.source,
    season: s.bb_season,
    age: s.age,
    dmi: s.dmi,
    gameShape: s.game_shape,
    salary: s.salary,
    potential: s.potential,
    experience: s.experience,
    jumpShot: s.jump_shot, jumpRange: s.jump_range, outsideDef: s.outside_def,
    handling: s.handling, driving: s.driving, passing: s.passing,
    insideShot: s.inside_shot, insideDef: s.inside_def, rebounding: s.rebounding,
    shotBlocking: s.shot_blocking, stamina: s.stamina, freeThrow: s.free_throw,
    tsp: (() => { const t = s.skill_points ?? tsp(skills); return t !== null && t >= 12 && t <= 240 ? t : null; })(),
    ownerTeamId: s.owner_team_id,
    ownerTeamName: s.owner_team_name,
  };
}
