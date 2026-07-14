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

  it('cap slows training to x0.15 using Josef Ka weights', () => {
    const capped = { ...flat7(), skills: skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]), potential: 5 };
    const r = weekStep(capped, { trainingId: 12, coachLevel: 5 }, BBSCOUT);
    expect(r.capped).toBe(true);
    expect(r.gains.ha).toBeCloseTo(0.5 * 0.15, 5);
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
