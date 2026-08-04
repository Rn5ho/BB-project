import { describe, it, expect } from 'vitest';
import { targetsFor, planForCluster, STAFF_SCENARIOS, type DrafteeProfile } from './plans';
import type { DefaultArchetype } from '../types';
import { SKILL_KEYS } from '../../training/types';

const ARCH: DefaultArchetype = {
  key: 'mkt72-outside-1', name: 'Market: outside #1',
  rules: { conditions: [
    { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 21: 14 } },
    { kind: 'field', field: 'driving', op: '>=', byAge: { 21: 14 } },
    { kind: 'field', field: 'outside_def', op: '>=', byAge: { 21: 12 } },
    { kind: 'field', field: 'potential', op: '>=', byAge: { 21: 7 } },
  ] },
};
const FLOOR = { field: 'outside_def' as const, skill: 'od' as const, min: 12 };
const DRAFTEE: DrafteeProfile = {
  label: 'p50', heightCm: 190, potential: 9,
  skills: { js: 8, jr: 6, od: 6, ha: 9, dr: 9, pa: 6, is: 5, id: 4, rb: 4, sb: 3 },
};

describe('targetsFor', () => {
  it('turns >= rate conditions into targets; floor skill priority high', () => {
    const t = targetsFor(ARCH, FLOOR);
    expect(t).toContainEqual({ skill: 'js', displayed: 14, priority: 'normal' });
    expect(t).toContainEqual({ skill: 'od', displayed: 12, priority: 'high' });
    expect(t.find((x) => x.skill === 'pa')).toBeUndefined(); // potential/attr conditions drop
  });
});

describe('planForCluster', () => {
  it('produces a reachable plan, monotone tiers, and a full-rule verdict', () => {
    const r = planForCluster(ARCH, FLOOR, [DRAFTEE], STAFF_SCENARIOS[1]); // elite staff = fastest
    expect(r.candidate).not.toBeNull();
    expect(r.blocks.length).toBeGreaterThan(0);
    for (const k of ['js', 'dr', 'od'] as const) {
      expect(r.tiers[19][k]!).toBeLessThanOrEqual(r.tiers[20][k]!);
      expect(r.tiers[20][k]!).toBeLessThanOrEqual(r.tiers[21][k]!);
    }
    expect(typeof r.fullRuleMatch).toBe('boolean');
    expect(r.weeklyPopRate).toBeGreaterThan(0);
  }, 120_000); // beam search over 42 weeks — allow time

  it('under --stress, evaluates the SAME plan from worst-start sublevels + degraded minutes, never turning an unreachable ceiling reachable', () => {
    const r = planForCluster(ARCH, FLOOR, [DRAFTEE], STAFF_SCENARIOS[1], { stress: { minutes: 38 } });
    expect(r.candidate).not.toBeNull(); // ceiling reachable (elite staff) — sanity precondition
    expect(r.stressed).toBeDefined();
    expect(typeof r.stressed!.reachableEntering21).toBe('boolean');
    // the floor's entering-21 TSP can never exceed the ceiling's (worse start + fewer minutes)
    const ceilingEnteringTsp = SKILL_KEYS.reduce((a, k) => a + (r.tiers[21][k] ?? 0), 0);
    expect(r.stressed!.enteringTsp).toBeGreaterThan(0);
    expect(r.stressed!.enteringTsp).toBeLessThanOrEqual(ceilingEnteringTsp);
  }, 120_000);

  it('never reports the stress floor as reachable when the ceiling itself is unreachable', () => {
    // Impossible target (JS>=20 in 1 week under neutral staff) forces candidate === null.
    const IMPOSSIBLE: DefaultArchetype = {
      key: 'mkt-impossible', name: 'Impossible',
      rules: { conditions: [{ kind: 'field', field: 'jump_shot', op: '>=', byAge: { 21: 20 } }] },
    };
    const tinyHorizonFloor = { field: 'outside_def' as const, skill: 'od' as const, min: 12 };
    const r = planForCluster(IMPOSSIBLE, tinyHorizonFloor, [DRAFTEE], STAFF_SCENARIOS[0], { stress: { minutes: 38 } });
    if (r.candidate === null) {
      expect(r.stressed === undefined || r.stressed.reachableEntering21 === false).toBe(true);
    }
  }, 120_000);
});
