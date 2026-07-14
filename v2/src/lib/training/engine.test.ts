import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from './models/coach-parrot';
import { displayed, heightMultiplier, weekStep, type PlayerState } from './engine';
import { skillsFromArray } from './types';

const flat7 = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9, ftSkill: 5, staminaSkill: 5,
});

describe('weekStep (coach-parrot semantics)', () => {
  it('flat skills, age 18, coach 5, 201cm: HA-for-1 gains ≈ base rates (elastic=1 on flat)', () => {
    // xtrain hits the max skill; with all skills equal, every skill ties for max — CP's
    // rule (skill == max) applies the malus, but delta = 0 so 0.925^0 = 1. No effect.
    const r = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    expect(r.gains.ha).toBeCloseTo(0.5, 10);
    // dr is a "height-independent" (flat) skill in CP, but the fitted flat constant is
    // ~0.9975273768433653, not exactly 1 — so dr's gain is base rate x that constant,
    // not the literal base rate.
    expect(r.gains.dr).toBeCloseTo(0.4 * heightMultiplier(COACH_PARROT, 201, 'dr'), 10);
    expect(r.gains.od).toBeCloseTo(0.1, 10);
    expect(r.gains.js).toBe(0);
    expect(r.capped).toBe(false);
  });

  it('applies age and coach multipliers', () => {
    const p = { ...flat7(), age: 21 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 7 }, COACH_PARROT);
    expect(r.gains.ha).toBeCloseTo(0.5 * 0.78 * 1.06, 10);
  });

  it('elastic: trained skill above its linked average trains slower (CP symmetric)', () => {
    const p = flat7();
    p.skills.ha = 10; // ha linked to avg(od,dr)=7 → delta 3 → 0.91^3
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    // ha is also the unique max skill → xtrain: 0.925^(10 - avg(all))
    const avgAll = (7 * 9 + 10) / 10;
    expect(r.gains.ha).toBeCloseTo(0.5 * Math.pow(0.91, 3) * Math.pow(0.925, 10 - avgAll), 10);
  });

  it('potential cap: capped player trains at 1/3', () => {
    const p = { ...flat7(), skills: skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]), potential: 5 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    expect(r.capped).toBe(true);
    expect(r.gains.ha).toBeCloseTo((0.5 / 3) * Math.pow(0.925, 0), 5);
  });

  it('stamina/FT: flat rates, no multipliers, skills untouched', () => {
    const p = { ...flat7(), age: 30 };
    const st = weekStep(p, { trainingId: 32, coachLevel: 1 }, COACH_PARROT);
    expect(st.staminaAfter).toBeCloseTo(5 + 2 / 3, 10);
    expect(st.gains.ha).toBe(0);
    const ft = weekStep(p, { trainingId: 33, coachLevel: 1 }, COACH_PARROT);
    expect(ft.ftAfter).toBeCloseTo(5.5, 10);
  });

  it('pops: integer boundary crossings, displayed = ceil clamped 1..20', () => {
    const p = flat7();
    p.skills.ha = 7.9;
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    expect(r.pops.ha).toBe(true); // 7.9 -> 8.33 crosses from displayed 8 to displayed 9
    // dr starts exactly at the integer 7.0 — the top of the "displays as 7" bucket
    // ((6,7] -> 7). displayed() is ceil(), so ANY positive gain pushes it into the
    // (7,8] bucket, which displays as 8. So dr DOES pop here (any nonzero gain off an
    // exact-integer skill always pops) — the opposite of the naive "7.0 -> 7.4 stays
    // at 7" intuition, which would only hold under floor/round semantics, not ceil.
    expect(r.pops.dr).toBe(true);
    expect(displayed(7.9)).toBe(8);
    expect(displayed(0.2)).toBe(1);
    expect(displayed(20.4)).toBe(20);
  });

  it('height: closest step lookup', () => {
    expect(heightMultiplier(COACH_PARROT, 200, 'is')).toBeCloseTo(1.0, 10); // closest = 201
    expect(heightMultiplier(COACH_PARROT, 176, 'jr')).toBeCloseTo(1.5, 10); // closest = 175
  });
});
