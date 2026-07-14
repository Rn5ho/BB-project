// Josef Ka salary formula — docs/research/training/salary-potential/chromebb-salarycalc.js
// Deflation: bb-salary-calc 1.0.6 (newer, no 0.86 factor) — salary-potential/EXTRACTS.md
// WARNING: BB announced a salary rework Jun 2024 (t324393); deflationScale is refit
// against our own Neon data by scripts/training/refit-salary.mts.
import { ALL_POSITIONS, SKILL_KEYS, type Position, type Skills } from './types';
import { JK_POTENTIAL_WEIGHTS } from './models/bbscout';

const SALARY_MULTIPLIERS: Record<Position, number[]> = {
  PG: [1.025, 1.045, 1.08, 1.08, 1.04, 1.155, 1.0, 1.0, 1.035, 1.0],
  SG: [1.125, 1.15, 1.13, 1.0, 1.0, 1.0, 1.0, 1.0, 1.065, 1.0],
  SF: [1.18, 1.085, 1.065, 1.0, 1.0, 1.0, 1.0, 1.06, 1.09, 1.005],
  PF: [1.08, 1.0, 1.0, 1.0, 1.0, 1.0, 1.115, 1.115, 1.115, 1.06],
  C: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.138, 1.135, 1.13, 1.065],
};
const SALARY_BASE = 300;
const DEFLATION = [
  { k: 0.9894173, d: 0.021658378 },
  { k: 2.276085, d: 0.1225621 },
];

function deflate(raw: number): number {
  return raw * Math.min(...DEFLATION.map(({ k, d }) => k - d * Math.log(raw)));
}

export function estimateSalary(
  skills: Skills,
  opts: { deflationScale?: number } = {},
): { salary: number; best: Position; byPosition: Record<Position, number> } {
  const scale = opts.deflationScale ?? 1;
  const arr = SKILL_KEYS.map((k) => Math.min(20, Math.max(1, Math.ceil(skills[k]))));
  const byPosition = {} as Record<Position, number>;
  let best: Position = 'PG';
  for (const pos of ALL_POSITIONS) {
    const raw =
      SALARY_BASE *
      Math.exp(SALARY_MULTIPLIERS[pos].reduce((a, m, i) => a + Math.log(m) * arr[i], 0));
    byPosition[pos] = Math.round(deflate(raw) * scale);
    if (byPosition[pos] > byPosition[best]) best = pos;
  }
  return { salary: byPosition[best], best, byPosition };
}

export function potentialScore(skills: Skills): {
  score: number;
  byPosition: Record<Position, number>;
  capPosition: Position;
} {
  const arr = SKILL_KEYS.map((k) => skills[k]);
  const byPosition = {} as Record<Position, number>;
  let capPosition: Position = 'PG';
  for (const pos of ALL_POSITIONS) {
    byPosition[pos] = JK_POTENTIAL_WEIGHTS[pos].reduce((a, w, i) => a + w * arr[i], 0);
    if (byPosition[pos] > byPosition[capPosition]) capPosition = pos;
  }
  return { score: byPosition[capPosition], byPosition, capPosition };
}

export function capThreshold(potential: number): number {
  return 8 + 2 * potential;
}

export function capUsagePct(skills: Skills, potential: number): number {
  return (potentialScore(skills).score / capThreshold(potential)) * 100;
}
