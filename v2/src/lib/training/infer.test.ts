import { describe, expect, it } from 'vitest';
import { inferClubTraining, type PlayerWindowEvidence } from './infer';
import { getTrainingType } from './catalog';
import { skillsFromArray } from './types';
import type { WeekMinutes } from '@/queries/minutes';

const week = (over: Partial<WeekMinutes>): WeekMinutes => ({
  season: 72, seasonWeek: 5, minPg: 0, minSg: 0, minSf: 0, minPf: 0, minC: 0, games: 1, ...over,
});

const guardState = {
  skills: skillsFromArray([7.5, 5.5, 6.5, 8.5, 9.5, 6.5, 3.5, 3.5, 3.5, 2.5]),
  age: 18, heightCm: 190, potential: 8,
};
const bigState = {
  skills: skillsFromArray([4.5, 2.5, 3.5, 4.5, 4.5, 3.5, 8.5, 6.5, 7.5, 5.5]),
  age: 18, heightCm: 210, potential: 9,
};

describe('inferClubTraining', () => {
  it('returns null inference when there are no rate-skill pops', () => {
    const r = inferClubTraining([{
      playerId: 1, state: guardState, windowWeeks: 4,
      pops: [{ skill: 'ft', toDisplayed: 6, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [week({ minPg: 40 })],
    }]);
    expect(r.inferredTrainingId).toBeNull();
    expect(r.confidence).toBe('low');
  });

  it('attributes a DR pop on a PG-minutes guard to a One-on-One variant', () => {
    const r = inferClubTraining([{
      playerId: 1, state: guardState, windowWeeks: 4,
      pops: [{ skill: 'dr', toDisplayed: 11, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [week({ minPg: 48 }), week({ seasonWeek: 6, minPg: 48 }), week({ seasonWeek: 7, minPg: 44 }), week({ seasonWeek: 8, minPg: 48 })],
    }]);
    expect(r.inferredTrainingId).not.toBeNull();
    expect(getTrainingType(r.inferredTrainingId!).primary).toBe('dr');
  });

  it('pooling two players raises confidence over one', () => {
    const one: PlayerWindowEvidence = {
      playerId: 1, state: bigState, windowWeeks: 4,
      pops: [{ skill: 'is', toDisplayed: 10, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [week({ minPf: 48 }), week({ seasonWeek: 6, minPf: 48 }), week({ seasonWeek: 7, minPf: 48 }), week({ seasonWeek: 8, minPf: 48 })],
    };
    const two: PlayerWindowEvidence = {
      ...one, playerId: 2,
      pops: [
        { skill: 'is', toDisplayed: 9, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 },
        { skill: 'is', toDisplayed: 10, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 },
      ],
      weeks: one.weeks.map((w) => ({ ...w, minPf: 0, minC: 48 })),
    };
    const solo = inferClubTraining([one]);
    const pooled = inferClubTraining([one, two]);
    expect(getTrainingType(pooled.inferredTrainingId!).primary).toBe('is');
    const rank = { low: 0, medium: 1, high: 2 } as const;
    expect(rank[pooled.confidence]).toBeGreaterThanOrEqual(rank[solo.confidence]);
    expect(pooled.popCount).toBe(3);
  });

  it('handles players with no minutes rows (falls back to assumed-full minutes)', () => {
    const r = inferClubTraining([{
      playerId: 1, state: bigState, windowWeeks: 4,
      pops: [{ skill: 'rb', toDisplayed: 9, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [],
    }]);
    expect(r.inferredTrainingId).not.toBeNull();
    expect(getTrainingType(r.inferredTrainingId!).primary).toBe('rb');
  });
});
