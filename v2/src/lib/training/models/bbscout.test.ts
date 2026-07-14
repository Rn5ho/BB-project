import { describe, expect, it } from 'vitest';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from './bbscout';
import { weekStep, type PlayerState } from '../engine';
import { skillsFromArray } from '../types';

const flat7 = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9,
});

describe('bbscout parameters', () => {
  it('elastic is boost-only: a LEADING trained skill is not penalized', () => {
    const p = flat7();
    p.skills.pa = 12; // pa linked to avg(ha,dr)=7, leads by 5
    const r = weekStep(p, { trainingId: 18, coachLevel: 5 }, BBSCOUT);
    // no penalty (boostOnly) and pa is max skill -> only the xtrain malus applies
    const avgAll = (7 * 9 + 12) / 10;
    expect(r.gains.pa).toBeCloseTo(0.6 * Math.pow(0.925, 12 - avgAll), 10);
  });

  it('minutes factor: full at 44+ for age 18, linear below', () => {
    const full = weekStep(flat7(), { trainingId: 12, coachLevel: 5, minutes: 44 }, BBSCOUT);
    const half = weekStep(flat7(), { trainingId: 12, coachLevel: 5, minutes: 22 }, BBSCOUT);
    expect(full.multipliers.minutes).toBe(1);
    expect(half.multipliers.minutes).toBeCloseTo(0.5, 10);
    expect(half.gains.ha).toBeCloseTo(full.gains.ha * 0.5, 10);
  });

  it('deep past all cap stages: training slows to x0.25 (dev stage 3)', () => {
    const capped = { ...flat7(), skills: skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]), potential: 5 };
    const r = weekStep(capped, { trainingId: 12, coachLevel: 5 }, BBSCOUT);
    expect(r.capped).toBe(true);
    expect(r.gains.ha).toBeCloseTo(0.5 * 0.25, 5);
  });

  it('mid-ladder: score past stage 2 but not stage 3 slows to x0.45', () => {
    // all-10s, potential 5: max position score = SF/PF weights sum 1.95 x 10 = 19.5
    // stages at 18 / 19 / 20 -> deepest passed is stage 2 (offset 9)
    const p = { ...flat7(), skills: skillsFromArray([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]), potential: 5 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, BBSCOUT);
    expect(r.capped).toBe(true);
    expect(r.gains.ha).toBeCloseTo(0.5 * 0.45, 5);
  });

  it('reproduces the 2026 community worked example structure (additive elastic)', () => {
    // "trening OPK": 198cm, age 25, trainer L6, IS 19 / ID 10 ->
    // gain = rate x 0.42 x 0.95 x 1.03 + (19-10) x 0.02
    // (example uses rate 0.55 from the full matrix PDF; bbscout carries CP's 0.5 -
    // the structure and every multiplier are what this test pins down)
    const p = {
      skills: skillsFromArray([5, 5, 5, 5, 5, 5, 19, 10, 5, 5]),
      age: 25, heightCm: 198, potential: 11,
    };
    const r = weekStep(p, { trainingId: 24, coachLevel: 6 }, BBSCOUT);
    expect(r.gains.id).toBeCloseTo(0.5 * 0.42 * 0.95 * 1.03 + (19 - 10) * 0.02, 10);
  });

  it('internal skills grow past 20 (displayed clamps at 20)', () => {
    const p = { ...flat7(), skills: skillsFromArray([7, 7, 7, 19.9, 7, 7, 7, 7, 7, 7]), potential: 11 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, BBSCOUT);
    expect(r.skillsAfter.ha).toBeGreaterThan(20);
  });

  it('youth trainer boosts 18-19 year olds only', () => {
    const y = weekStep(flat7(), { trainingId: 12, coachLevel: 5, youthTrainerLevel: 4 }, BBSCOUT);
    expect(y.multipliers.youth).toBeCloseTo(1.1, 10);
    const old = weekStep({ ...flat7(), age: 21 }, { trainingId: 12, coachLevel: 5, youthTrainerLevel: 4 }, BBSCOUT);
    expect(old.multipliers.youth).toBe(1);
  });

  it('low/high variants bracket the central model', () => {
    const c = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, BBSCOUT).gains.ha;
    const lo = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, BBSCOUT_LOW).gains.ha;
    const hi = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, BBSCOUT_HIGH).gains.ha;
    expect(lo).toBeLessThan(c);
    expect(hi).toBeGreaterThan(c);
  });
});
