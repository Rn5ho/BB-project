import { describe, expect, it } from 'vitest';
import { OPEN_SOURCE_LIVE } from './open-source-live';
import { weekStep, type PlayerState } from '../engine';
import { skillsFromArray } from '../types';

const flat7At201 = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9,
});

describe('open-source-live parameters (live buzzeriq behavior)', () => {
  it('age 21 multiplier is the live 0.80, not the community 0.78', () => {
    expect(OPEN_SOURCE_LIVE.age.value[21]).toBe(0.8);
  });

  it('HA for 1 matches probe 01 primary split (ha 0.5 primary, dr secondary)', () => {
    const rates = OPEN_SOURCE_LIVE.rates.value[12];
    expect(rates.ha).toBeCloseTo(0.5, 10);
    expect(rates.dr).toBeCloseTo(0.4, 10);
    expect(rates.od).toBeCloseTo(0.1, 10);
  });

  it('high-skill slowdown: skill >= 16 trains at x0.8 regardless of potential', () => {
    const p = { ...flat7At201(), skills: skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]), potential: 5 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, OPEN_SOURCE_LIVE);
    // probe 19-cap-open: HA gain 0.40 = 0.5 x 0.8 (equal skills -> no elastic)
    expect(r.gains.ha).toBeCloseTo(0.4, 2);
    expect(r.capped).toBe(false); // weighted-sum cap not used by this model
  });

  it('pair-linear elastic boosts a lagging trained skill', () => {
    const p = flat7At201();
    p.skills.ha = 3; // OD->HA pair etc. — trained ha lags others
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, OPEN_SOURCE_LIVE);
    expect(r.gains.ha).toBeGreaterThan(0.5); // boosted above base
  });

  it('ST/FT are no-ops in this model (live API behavior)', () => {
    const r = weekStep({ ...flat7At201(), ftSkill: 5 }, { trainingId: 33, coachLevel: 5 }, OPEN_SOURCE_LIVE);
    expect(r.ftAfter).toBe(5);
  });
});
