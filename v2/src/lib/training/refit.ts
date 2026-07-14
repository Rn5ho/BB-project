import { estimateSalary } from './salary';
import type { Skills } from './types';

/** Median ratio of actual/predicted salary = a robust global deflation-scale estimate.
 *  Phase A refits scale only; per-multiplier refit waits for more data (spec §1). */
export function fitDeflationScale(
  rows: Array<{ skills: Skills; actualSalary: number }>,
): { scale: number; medianAbsPctErr: number } {
  if (rows.length === 0) throw new Error('no rows to fit');
  const ratios = rows
    .map((r) => r.actualSalary / estimateSalary(r.skills).salary)
    .sort((a, b) => a - b);
  const scale = ratios[Math.floor(ratios.length / 2)];
  const errs = rows
    .map((r) => {
      const pred = estimateSalary(r.skills, { deflationScale: scale }).salary;
      return Math.abs(pred - r.actualSalary) / r.actualSalary * 100;
    })
    .sort((a, b) => a - b);
  return { scale, medianAbsPctErr: errs[Math.floor(errs.length / 2)] };
}
