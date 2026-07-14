import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from './coach-parrot';
import { SKILL_KEYS } from '../types';

describe('coach-parrot parameters', () => {
  it('rate matrix spot checks vs training_rate_matrix.csv', () => {
    expect(COACH_PARROT.rates.value[12]).toEqual({ od: 0.1, ha: 0.5, dr: 0.4 }); // HA for 1
    expect(COACH_PARROT.rates.value[29]).toEqual({ id: 0.2, rb: 0.1, sb: 0.5 }); // SB for 5
    expect(COACH_PARROT.rates.value[18]).toEqual({ ha: 0.16, dr: 0.16, pa: 0.6 }); // PA for 1
    expect(COACH_PARROT.rates.value[4]).toEqual({ js: 0.22, jr: 0.044, ha: 0.022, dr: 0.022 }); // JS team
    expect(Object.keys(COACH_PARROT.rates.value)).toHaveLength(31);
  });

  it('age/coach tables match the community tables', () => {
    expect(COACH_PARROT.age.value[18]).toBe(1.0);
    expect(COACH_PARROT.age.value[21]).toBe(0.78);
    expect(COACH_PARROT.age.value[36]).toBe(0);
    expect(COACH_PARROT.coach.value[5]).toBe(1.0);
    expect(COACH_PARROT.coach.value[1]).toBe(0.88);
    expect(COACH_PARROT.coach.value[7]).toBe(1.06);
  });

  it('height table: 22 steps, anchored at 201cm, JR declines / IS rises 0.05 per step', () => {
    const h = COACH_PARROT.height.value;
    expect(h.stepsCm).toHaveLength(22);
    const i201 = h.stepsCm.indexOf(201);
    expect(h.bySkill.jr[i201]).toBeCloseTo(1.0, 10);
    expect(h.bySkill.is[i201]).toBeCloseTo(1.0, 10);
    expect(h.bySkill.jr[0]).toBeCloseTo(1.5, 10); // 175cm
    expect(h.bySkill.is[0]).toBeCloseTo(0.5, 10);
    expect(h.bySkill.ha[h.stepsCm.length - 1]).toBeCloseTo(0.45, 10); // 229cm
    expect(h.bySkill.js[i201]).toBeCloseTo(0.9975273768433653, 12); // fitted constant
    for (const k of SKILL_KEYS) expect(h.bySkill[k]).toHaveLength(22);
  });

  it('mechanics specs', () => {
    expect(COACH_PARROT.elastic.value).toMatchObject({ kind: 'exp-linked', coeff: 0.91, boostOnly: false });
    expect(COACH_PARROT.xtrain.value).toEqual({ kind: 'top-skill-malus', coeff: 0.925 });
    expect(COACH_PARROT.cap.value).toMatchObject({ kind: 'weighted-sum', slowdown: 1 / 3 });
    expect(COACH_PARROT.minutes.value).toEqual({ kind: 'none' });
    expect(COACH_PARROT.stRate.value).toBeCloseTo(2 / 3, 10);
    expect(COACH_PARROT.ftRate.value).toBe(0.5);
    expect(COACH_PARROT.weeksPerSeason.value).toBe(14);
  });
});
