import { describe, it, expect } from 'vitest';
import { defenseFloorFor, eliteMembers, deriveArchetype, toEvalPlayer } from './rules';
import type { CohortPlayer } from './groups';
import { evaluateArchetype } from '../evaluate';
import { SKILL_KEYS, type SkillKey } from '../../training/types';

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
    const d = deriveArchetype({ group: 'outside', index: 0, members, centroid: SHOOTER });
    expect(d.archetype.key).toBe('mkt72-outside-1');
    expect(d.definers.length).toBeLessThanOrEqual(5);
    expect(d.definers).toContain('js'); // elite shape: js is well above the member's own 10-skill mean
    expect(d.definers).not.toContain('od'); // floor skill is never a definer
    expect(d.definers).not.toContain('id');
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
    const d = deriveArchetype({ group: 'outside', index: 0, members, centroid: SHOOTER });
    const r = evaluateArchetype(toEvalPlayer(members[5]), {
      id: d.archetype.key, key: d.archetype.key, dbId: null, name: d.archetype.name,
      rules: d.archetype.rules, source: 'default',
    });
    expect(r.ageTierUsed).toBe(21);
  });
});

describe('eliteMembers widening', () => {
  it('widens to floor-passing top-30% when TSP>=100 yields fewer players', () => {
    const tsps = [101, 100, 99, 98, 97, 96, 95, 94, 93, 92];
    const members = tsps.map((t, i) => {
      const skills = { ...SHOOTER, od: 15 };
      const base = Object.values(skills).reduce((a, b) => a + b, 0);
      skills.pa = skills.pa + (t - base); // tune 10-skill sum to the target tsp
      return member(skills, { playerId: i });
    });
    const out = eliteMembers(members, { field: 'outside_def', skill: 'od', min: 15 });
    expect(out).toHaveLength(3); // ceil(10 * 0.3) > the 2 players at TSP>=100
    expect(out.map((m) => m.tsp)).toContain(99);
  });
});

describe('self-match relaxation', () => {
  it('relaxes the worst-failing definers p25->p10, one at a time, until the gate passes', () => {
    // base skills shared by all 8 members; only (js, dr) vary.
    const base = { jr: 8, od: 15, ha: 14, pa: 8, is: 10, id: 6, rb: 5, sb: 4 };
    const skillsFor = (js: number, dr: number) => ({ ...base, js, dr });
    const members = [
      member(skillsFor(14, 16)), // m1
      member(skillsFor(15, 16)), // m2
      member(skillsFor(17, 14)), // m3
      member(skillsFor(17, 15)), // m4
      member(skillsFor(17, 16)), // m5
      member(skillsFor(17, 16)), // m6
      member(skillsFor(17, 16)), // m7
      member(skillsFor(17, 16)), // m8
    ];
    // all 8 have tsp in [100,103] and od 15 (floor pass) -> elite = all 8.
    const centroid = SKILL_KEYS.reduce((acc, k) => {
      acc[k] = members.reduce((a, m) => a + m.skills[k], 0) / members.length;
      return acc;
    }, {} as Record<SkillKey, number>);

    const d = deriveArchetype({ group: 'outside', index: 2, members, centroid });

    expect(d.relaxed).toEqual(['js', 'dr']);
    expect(d.selfMatchRate).toBe(0.75);
    const jsCond = d.archetype.rules.conditions.find((c) => c.kind === 'field' && c.field === 'jump_shot');
    expect(jsCond?.kind === 'field' && jsCond.byAge[21]).toBe(15);
    const drCond = d.archetype.rules.conditions.find((c) => c.kind === 'field' && c.field === 'driving');
    expect(drCond?.kind === 'field' && drCond.byAge[21]).toBe(15);
  });
});
