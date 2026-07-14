import { estimateSalary } from './salary';
import type { Skills } from './types';

/** True median of a pre-sorted numeric array: average of the two middle elements when
 *  even-length, the exact middle element when odd-length. */
function median(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Median ratio of actual/predicted salary = a robust global deflation-scale estimate.
 *  Phase A refits scale only; per-multiplier refit waits for more data (spec §1). */
export function fitDeflationScale(
  rows: Array<{ skills: Skills; actualSalary: number }>,
): { scale: number; medianAbsPctErr: number } {
  if (rows.length === 0) throw new Error('no rows to fit');
  const ratios = rows
    .map((r) => r.actualSalary / estimateSalary(r.skills).salary)
    .sort((a, b) => a - b);
  const scale = median(ratios);
  const errs = rows
    .map((r) => {
      const pred = estimateSalary(r.skills, { deflationScale: scale }).salary;
      return Math.abs(pred - r.actualSalary) / r.actualSalary * 100;
    })
    .sort((a, b) => a - b);
  return { scale, medianAbsPctErr: median(errs) };
}
