import { describe, it, expect } from 'vitest';
import { gradeProspect } from './gap';
import type { SkillKey } from '../../training/types';

const OUT_CLUSTER = {
  key: 'mkt72-outside-1', group: 'outside' as const,
  centroid: { js: 16, jr: 11, od: 15, ha: 15, dr: 16, pa: 8, is: 10, id: 7, rb: 5, sb: 4 } as Record<SkillKey, number>,
  tiers: {
    19: { js: 10, ha: 12, dr: 12, od: 6 }, 20: { js: 13, ha: 14, dr: 15, od: 8 },
    21: { js: 16, ha: 15, dr: 16, od: 14 },
  } as Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>,
  floor: { field: 'outside_def' as const, skill: 'od' as const, min: 15 },
};
const base = { heightCm: 190, potential: 8, currentSeasonWeek: 5, inferredTrainingId: null as number | null };
const skills = (o: Partial<Record<SkillKey, number>>): Record<SkillKey, number> =>
  ({ js: 10, jr: 7, od: 7, ha: 13, dr: 13, pa: 6, is: 7, id: 5, rb: 5, sb: 4, ...o });

describe('gradeProspect — age-conditional defense logic', () => {
  it('19yo with strong feeders and low OD is ON TRACK (elastic pathway)', () => {
    const g = gradeProspect({ ...base, age: 19, skills: skills({ ha: 15, dr: 16, od: 7 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('on-track');
  });
  it('19yo with weak feeders is WATCH regardless of defense', () => {
    const g = gradeProspect({ ...base, age: 19, skills: skills({ ha: 9, dr: 9, od: 7 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('watch');
    expect(g.reasons.join(' ')).toMatch(/feeders/);
  });
  it('20yo below the OD track and NOT training OD is AT RISK', () => {
    const g = gradeProspect({ ...base, age: 20, inferredTrainingId: 1, skills: skills({ od: 6 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('at-risk');
  });
  it('20yo below track but training OD (id 10) is ON TRACK', () => {
    const g = gradeProspect({ ...base, age: 20, inferredTrainingId: 10, skills: skills({ od: 6, ha: 15, dr: 16, js: 14 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('on-track');
  });
  it('21yo with an unclosable floor gap is AT RISK (0.35/wk closure cap)', () => {
    // week 5 -> 9 weeks left -> max ~3.15 levels; gap OD 10->15 = 5
    const g = gradeProspect({ ...base, age: 21, currentSeasonWeek: 5, skills: skills({ od: 10, js: 16, ha: 15, dr: 16 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('at-risk');
  });
});
