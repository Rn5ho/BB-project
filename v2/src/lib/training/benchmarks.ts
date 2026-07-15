import type { Param } from './types';

/** NT-track season-START 12-skill TSP by age, thread 323477 (2024).
 *  Ages 18–21 measured (21 = midpoint of the stated 95–105 range);
 *  22 is a slope extrapolation used only to interpolate inside age-21 seasons. */
export const TSP_BENCHMARKS: Param<Record<number, number>> = {
  value: { 18: 55, 19: 70, 20: 83, 21: 100, 22: 112 },
  source: 'docs/research/training/forum-research/gated/FINDINGS.md item 6 (thread 323477)',
  confidence: 'measured',
};

/** Benchmark TSP at a given age + season week (linear within the 14-week season).
 *  Null when the age is off-table (only 18–21 are NT-track ages; 22 is interpolation-only). */
export function benchmarkTsp(age: number, seasonWeek: number): number | null {
  if (age < 18 || age > 21) return null;
  const table = TSP_BENCHMARKS.value;
  const start = table[age];
  const next = table[age + 1];
  if (start === undefined) return null;
  if (next === undefined) return start;
  const frac = Math.min(1, Math.max(0, (seasonWeek - 1) / 14));
  return start + (next - start) * frac;
}

/** Player TSP minus the NT-track benchmark (positive = ahead). */
export function benchmarkDelta(tsp: number, age: number, seasonWeek: number): number | null {
  const b = benchmarkTsp(age, seasonWeek);
  return b == null ? null : tsp - b;
}
