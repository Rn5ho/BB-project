import { describe, expect, it } from 'vitest';
import { benchmarkDelta, benchmarkTsp } from './benchmarks';

describe('benchmarkTsp', () => {
  it('returns season-start values at week 1', () => {
    expect(benchmarkTsp(18, 1)).toBe(55);
    expect(benchmarkTsp(21, 1)).toBe(100);
  });
  it('lerps toward the next age within the season', () => {
    // age 18 midway (week 8): 55 + (70-55) * 7/14 = 62.5
    expect(benchmarkTsp(18, 8)).toBeCloseTo(62.5, 5);
  });
  it('returns null off-table', () => {
    expect(benchmarkTsp(17, 1)).toBeNull();
    expect(benchmarkTsp(25, 1)).toBeNull();
  });
});

describe('benchmarkDelta', () => {
  it('positive = ahead of NT track', () => {
    expect(benchmarkDelta(60, 18, 1)).toBe(5);
    expect(benchmarkDelta(90, 21, 1)).toBe(-10);
  });
});
