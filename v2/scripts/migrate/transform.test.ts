import { describe, it, expect } from 'vitest';
import { heightToCm, transformPlayer, transformSnapshot } from './transform';

describe('heightToCm', () => {
  it('parses "196 cm"', () => expect(heightToCm('196 cm')).toBe(196));
  it('parses combined form 6\'5" / 196 cm', () => expect(heightToCm(`6'5" / 196 cm`)).toBe(196));
  it('null-safe', () => expect(heightToCm(null)).toBeNull());
  it('garbage → null', () => expect(heightToCm('tall')).toBeNull());
  it('converts inch values mislabeled as cm (BB API bug): "73 cm" → 185', () => expect(heightToCm('73 cm')).toBe(185));
  it('converts "77 cm" → 196', () => expect(heightToCm('77 cm')).toBe(196));
  it('leaves real cm untouched at the boundary: "165 cm" → 165', () => expect(heightToCm('165 cm')).toBe(165));
});

const v1Player = {
  id: 42, bb_player_id: 55158715, name: 'Milan Peterec', nationality: 'Slovenia',
  height: '196 cm', position: 'PG', is_nt_player: true, created_at: '2026-02-01T00:00:00Z',
};

describe('transformPlayer', () => {
  const out = transformPlayer(v1Player);
  it('keys by bb_player_id', () => expect(out.bbPlayerId).toBe(55158715));
  it('maps Slovenia → countryId 66', () => expect(out.countryId).toBe(66));
  it('parses height', () => expect(out.heightCm).toBe(196));
  it('non-Slovenia has null countryId', () =>
    expect(transformPlayer({ ...v1Player, nationality: 'Ukraine' }).countryId).toBeNull());
  it('preserves first_seen from created_at', () =>
    expect(out.firstSeenAt.toISOString()).toBe('2026-02-01T00:00:00.000Z'));
});

const fullSkills = {
  jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8,
  inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3,
};

describe('transformSnapshot', () => {
  const idMap = new Map([[42, 55158715]]);
  const base = {
    id: 1, player_id: 42, captured_by: null, captured_at: '2026-04-01T10:00:00Z',
    source: 'extension' as const, bb_season: 69, age: 20, salary: 12346, experience: 3,
    skill_points: null, game_shape: 8, potential: 8, dmi: 157700,
    owner_team_name: 'Team X', owner_team_id: 999, ...fullSkills,
  };
  it('resolves the FK via the id map', () => expect(transformSnapshot(base, idMap)!.playerId).toBe(55158715));
  it('computes tsp when skill_points is null but skills are full', () =>
    expect(transformSnapshot(base, idMap)!.tsp).toBe(98));
  it('prefers stored skill_points', () =>
    expect(transformSnapshot({ ...base, skill_points: 97 }, idMap)!.tsp).toBe(97));
  it('light snapshot (no skills) → null tsp, null skills kept', () => {
    const light = transformSnapshot({ ...base, ...Object.fromEntries(Object.keys(fullSkills).map(k => [k, null])) } as never, idMap)!;
    expect(light.tsp).toBeNull();
    expect(light.jumpShot).toBeNull();
  });
  it('drops snapshots whose player is unknown', () =>
    expect(transformSnapshot({ ...base, player_id: 777 }, idMap)).toBeNull());
});
