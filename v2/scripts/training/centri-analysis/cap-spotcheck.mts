// Spot-check dump: potentialScore + continuous-salary for test vectors, so the
// Python round-2 cap analysis can verify its port against the real TS code.
import { potentialScore } from '../../../src/lib/training/salary';
import { SKILL_KEYS, ALL_POSITIONS, type Skills, type Position } from '../../../src/lib/training/types';

// continuous VirtSalary (no ceil) — mirrors estimateSalary but skips display rounding,
// for DMI-creep work where internal skills matter.
const SALARY_MULTIPLIERS: Record<Position, number[]> = {
  PG: [1.025, 1.045, 1.08, 1.08, 1.04, 1.155, 1.0, 1.0, 1.035, 1.0],
  SG: [1.125, 1.15, 1.13, 1.0, 1.0, 1.0, 1.0, 1.0, 1.065, 1.0],
  SF: [1.18, 1.085, 1.065, 1.0, 1.0, 1.0, 1.0, 1.06, 1.09, 1.005],
  PF: [1.08, 1.0, 1.0, 1.0, 1.0, 1.0, 1.115, 1.115, 1.115, 1.06],
  C: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.138, 1.135, 1.13, 1.065],
};
const DEFLATION = [
  { k: 0.9894173, d: 0.021658378 },
  { k: 2.276085, d: 0.1225621 },
];
function contSalary(skills: Skills): { best: Position; raw: number; deflated: number } {
  let best: Position = 'PG';
  let bestV = -1;
  const rawBy = {} as Record<Position, number>;
  for (const pos of ALL_POSITIONS) {
    const raw =
      300 * Math.exp(SALARY_MULTIPLIERS[pos].reduce((a, m, i) => a + Math.log(m) * SKILL_KEYS.map((k) => skills[k])[i], 0));
    rawBy[pos] = raw;
    const defl = raw * Math.min(...DEFLATION.map(({ k, d }) => k - d * Math.log(raw)));
    if (defl > bestV) { bestV = defl; best = pos; }
  }
  return { best, raw: rawBy[best], deflated: bestV };
}

const vecs: Record<string, number[]> = {
  jalovec_seg5_mid: [8.5, 4.5, 4.5, 9.5, 9.5, 7.5, 15.5, 12.5, 12.5, 9.5],
  test_outside: [12.2, 9.7, 11.3, 13.1, 10.4, 14.9, 5.5, 6.2, 8.8, 3.3],
  test_big: [9.5, 6.5, 7.5, 10.5, 9.5, 8.5, 17.5, 15.5, 14.5, 11.5],
};
const out: Record<string, unknown> = {};
for (const [name, arr] of Object.entries(vecs)) {
  const skills = Object.fromEntries(SKILL_KEYS.map((k, i) => [k, arr[i]])) as Skills;
  const ps = potentialScore(skills);
  const cs = contSalary(skills);
  out[name] = { score: ps.score, capPosition: ps.capPosition, byPosition: ps.byPosition, contSalary: cs };
}
console.log(JSON.stringify(out, null, 1));
