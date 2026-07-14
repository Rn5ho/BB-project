import { describe, expect, it } from 'vitest';
import { fitDeflationScale } from './refit';
import { estimateSalary } from './salary';
import { skillsFromArray } from './types';

describe('fitDeflationScale', () => {
  it('recovers a known synthetic scale', () => {
    const TRUE_SCALE = 0.9;
    const rows = [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [12, 11, 10, 9, 8, 12, 3, 3, 4, 2],
      [5, 3, 3, 3, 3, 3, 14, 13, 13, 10],
      [9, 9, 9, 8, 8, 9, 8, 8, 8, 7],
      [15, 14, 13, 12, 11, 15, 5, 5, 6, 3],
    ].map((arr) => {
      const skills = skillsFromArray(arr);
      return { skills, actualSalary: estimateSalary(skills).salary * TRUE_SCALE };
    });
    const { scale, medianAbsPctErr } = fitDeflationScale(rows);
    expect(scale).toBeCloseTo(TRUE_SCALE, 2);
    expect(medianAbsPctErr).toBeLessThan(1);
  });

  it('recovers a known synthetic scale with an even number of rows', () => {
    const TRUE_SCALE = 0.9;
    const rows = [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [12, 11, 10, 9, 8, 12, 3, 3, 4, 2],
      [5, 3, 3, 3, 3, 3, 14, 13, 13, 10],
      [9, 9, 9, 8, 8, 9, 8, 8, 8, 7],
    ].map((arr) => {
      const skills = skillsFromArray(arr);
      return { skills, actualSalary: estimateSalary(skills).salary * TRUE_SCALE };
    });
    const { scale, medianAbsPctErr } = fitDeflationScale(rows);
    expect(scale).toBeCloseTo(TRUE_SCALE, 2);
    expect(medianAbsPctErr).toBeLessThan(1);
  });
});
