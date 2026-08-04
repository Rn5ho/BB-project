import { describe, it, expect } from 'vitest';
import { defenseFloorFor, eliteMembers, deriveArchetype, toEvalPlayer } from './rules';
import type { CohortPlayer } from './groups';
import { evaluateArchetype } from '../evaluate';
import type { SkillKey } from '../../training/types';

function member(skills: Record<SkillKey, number>, over: Partial<CohortPlayer> = {}): CohortPlayer {
  return { playerId: 1, name: 'M', heightCm: 190, potential: 9, salary: null, startingPrice: null,
    ownerTeamName: null, nationality: null, stamina: 5, freeThrow: 8,
    skills, tsp: Object.values(skills).reduce((a, b) => a + b, 0), ...over };
}
const SHOOTER: Record<SkillKey, number> = { js: 17, jr: 12, od: 15, ha: 14, dr: 15, pa: 8, is: 10, id: 6, rb: 5, sb: 4 };
const GROUP_MEAN: Record<SkillKey, number> = { js: 14, jr: 9, od: 15, ha: 14, dr: 15, pa: 8, is: 10, id: 7, rb: 6, sb: 5 };

describe('defenseFloorFor', () => {
  it('inside gets ID>=16', () => {
    expect(defenseFloorFor('inside', GROUP_MEAN)).toEqual({ field: 'inside_def', skill: 'id', min: 16 });
  });
  it('outside PG-shaped (high HA+DR) gets OD>=14, otherwise 15', () => {
    expect(defenseFloorFor('outside', { ...GROUP_MEAN, ha: 17, dr: 18 }).min).toBe(14);
    expect(defenseFloorFor('outside', { ...GROUP_MEAN, ha: 13, dr: 14 }).min).toBe(15);
  });
  it('wing floors on the defense skill its members carry', () => {
    expect(defenseFloorFor('wing', { ...GROUP_MEAN, od: 15, id: 8 }).skill).toBe('od');
    expect(defenseFloorFor('wing', { ...GROUP_MEAN, od: 7, id: 16 }).skill).toBe('id');
  });
});

describe('deriveArchetype', () => {
  const members = Array.from({ length: 12 }, (_, i) =>
    member({ ...SHOOTER, js: 16 + (i % 3), jr: 11 + (i % 2) }));
  it('emits lean rules that its own members pass (self-match gate)', () => {
    const d = deriveArchetype(
      { group: 'outside', index: 0, members, centroid: SHOOTER }, GROUP_MEAN);
    expect(d.archetype.key).toBe('mkt72-outside-1');
    expect(d.definers.length).toBeLessThanOrEqual(5);
    expect(d.definers).toContain('js'); // 17 vs group mean 14 -> definer
    expect(d.definers).not.toContain('od'); // floor skill is not a definer here (15 vs 15)
    expect(d.selfMatchRate).toBeGreaterThanOrEqual(0.7);
    const conds = d.archetype.rules.conditions;
    expect(conds.some((c) => c.kind === 'field' && c.field === 'outside_def')).toBe(true);
    expect(conds.every((c) => c.kind !== 'position')).toBe(true);
    expect(conds.every((c) => c.kind === 'field' && c.field !== 'stamina' && c.field !== 'free_throw')).toBe(true);
  });
  it('toEvalPlayer produces an evaluator-compatible age-21 player', () => {
    const p = toEvalPlayer(member(SHOOTER));
    expect(p.ageNow).toBe(21);
    expect(p.skills?.jump_shot).toBe(17);
    const d = deriveArchetype({ group: 'outside', index: 0, members, centroid: SHOOTER }, GROUP_MEAN);
    const r = evaluateArchetype(toEvalPlayer(members[5]), {
      id: d.archetype.key, key: d.archetype.key, dbId: null, name: d.archetype.name,
      rules: d.archetype.rules, source: 'default',
    });
    expect(r.ageTierUsed).toBe(21);
  });
});
