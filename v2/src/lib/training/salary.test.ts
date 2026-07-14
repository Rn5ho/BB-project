import { describe, expect, it } from 'vitest';
import { capThreshold, capUsagePct, estimateSalary, potentialScore } from './salary';
import { skillsFromArray } from './types';

describe('salary + potential cap', () => {
  it('all-7s: PG-ish salary profile, monotonic in skills', () => {
    const flat = estimateSalary(skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]));
    expect(flat.salary).toBeGreaterThan(1000);
    const better = estimateSalary(skillsFromArray([8, 8, 8, 8, 8, 8, 8, 8, 8, 8]));
    expect(better.salary).toBeGreaterThan(flat.salary);
  });

  it('an inside build is worth most at C, an outside build at a guard slot', () => {
    const big = estimateSalary(skillsFromArray([5, 3, 3, 3, 3, 3, 14, 13, 13, 10]));
    expect(['PF', 'C']).toContain(big.best);
    const guard = estimateSalary(skillsFromArray([13, 12, 12, 11, 10, 13, 3, 3, 4, 2]));
    expect(['PG', 'SG', 'SF']).toContain(guard.best);
  });

  it('potential score: all-7s scores ~13.5 at PG weights and is uncapped for potential 6+', () => {
    const flat = skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]);
    const ps = potentialScore(flat);
    expect(ps.score).toBeGreaterThan(12);
    expect(ps.score).toBeLessThan(15);
    expect(capThreshold(6)).toBe(20);
    expect(capUsagePct(flat, 6)).toBeCloseTo((ps.score / 20) * 100, 5);
  });

  it('capped detection matches the engine convention (score >= 8 + 2·potential)', () => {
    const nineteen = skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]);
    expect(potentialScore(nineteen).score).toBeGreaterThan(capThreshold(5));
  });
});
