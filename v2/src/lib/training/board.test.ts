import { describe, expect, it } from 'vitest';
import { computeBoardRow, weeksToEndOfAge21, type BoardPlayerInput } from './board';
import { skillsFromArray } from './types';

const base: BoardPlayerInput = {
  bbPlayerId: 1, name: 'Test Guard', age: 19, heightCm: 190, potential: 8,
  state: { skills: skillsFromArray([7.5, 5.5, 6.5, 8.5, 9.5, 6.5, 3.5, 3.5, 3.5, 2.5]), age: 19, heightCm: 190, potential: 8, ftSkill: 5.5, staminaSkill: 5.5 },
  displayedSkills: [8, 6, 7, 9, 10, 7, 4, 4, 4, 3],
  tspNow: 73, ownerTeamId: 100, ownerTeamName: 'KK Test',
  inferred: { trainingId: 15, confidence: 'high', windowEndIso: '2026-07-10T00:00:00.000Z' },
  recentWeeks: [
    { season: 72, seasonWeek: 4, minPg: 30, minSg: 18, minSf: 0, minPf: 0, minC: 0, games: 2 },
    { season: 72, seasonWeek: 5, minPg: 40, minSg: 8, minSf: 0, minPf: 0, minC: 0, games: 2 },
  ],
  currentSeasonWeek: 6,
};

describe('weeksToEndOfAge21', () => {
  it('counts remaining weeks through the age-21 season', () => {
    expect(weeksToEndOfAge21(21, 14)).toBe(0);
    expect(weeksToEndOfAge21(21, 1)).toBe(13);
    expect(weeksToEndOfAge21(18, 1)).toBe(13 + 3 * 14);
  });
});

describe('computeBoardRow', () => {
  it('produces both projections and a positive optimal for a young player', () => {
    const row = computeBoardRow(base);
    expect(row.inferredLabel).toBe('One on One (PG/SG)');
    expect(row.avgMinutes).toBe(48); // (30+18+40+8)/2
    expect(row.tsp21Current).not.toBeNull();
    expect(row.tsp21Optimal).toBeGreaterThan(row.tspNow!);
    expect(row.gap).toBeCloseTo(row.tsp21Optimal - row.tsp21Current!, 5);
    expect(row.optimalTemplateKey).toBeTruthy();
    expect(row.capUsedPct).toBeGreaterThan(0);
    expect(row.benchmarkDelta).not.toBeNull();
  });

  it('null inference -> null current path and gap', () => {
    const row = computeBoardRow({ ...base, inferred: null });
    expect(row.tsp21Current).toBeNull();
    expect(row.gap).toBeNull();
    expect(row.tsp21Optimal).toBeGreaterThan(0);
  });

  it('age 21 at week 14 -> zero horizon, projections equal current state TSP', () => {
    const row = computeBoardRow({ ...base, age: 21, currentSeasonWeek: 14, state: { ...base.state, age: 21 } });
    expect(row.tsp21Optimal).toBeCloseTo(row.tsp21Current!, 5);
  });

  it('empty recentWeeks -> null avgMinutes and full-minutes current projection', () => {
    const lowMinutes = computeBoardRow({ ...base, recentWeeks: base.recentWeeks.map((w) => ({ ...w, minPg: 5, minSg: 5 })) });
    const noData = computeBoardRow({ ...base, recentWeeks: [] });
    expect(noData.avgMinutes).toBeNull();
    expect(noData.tsp21Current!).toBeGreaterThan(lowMinutes.tsp21Current!);
  });
});
