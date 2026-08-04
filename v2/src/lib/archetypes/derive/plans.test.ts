import { describe, it, expect } from 'vitest';
import { targetsFor, planForCluster, STAFF_SCENARIOS, type DrafteeProfile } from './plans';
import type { DefaultArchetype } from '../types';

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
});
