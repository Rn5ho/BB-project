import { describe, it, expect } from 'vitest';
import { quantile, mean, median, histogram } from './stats';

describe('quantile', () => {
  it('interpolates linearly (type 7)', () => {
    expect(quantile([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75, 10);
    expect(quantile([1, 2, 3, 4], 0.5)).toBeCloseTo(2.5, 10);
    expect(quantile([3, 1, 4, 2], 1)).toBe(4); // sorts internally
  });
  it('throws on empty input', () => { expect(() => quantile([], 0.5)).toThrow(); });
});
describe('helpers', () => {
  it('mean/median/histogram', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 100])).toBeCloseTo(2.5, 10);
    expect(histogram([8, 9, 9, 10])).toEqual({ 8: 1, 9: 2, 10: 1 });
  });
});
