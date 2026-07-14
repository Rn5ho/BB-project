import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from '../models/coach-parrot';
import { weekStep } from '../engine';
import { skillsFromArray } from '../types';

describe('CoachParrot built-in worked example (model_formula.md, verified vs the sheet)', () => {
  it('OD for 1, age 27, 201cm, coach L4, JS5 JR5 OD4 HA3 DR2 PA5 IS3 ID2 RB3 SB1 -> OD +0.11190', () => {
    const player = {
      skills: skillsFromArray([5, 5, 4, 3, 2, 5, 3, 2, 3, 1]),
      age: 27, heightCm: 201, potential: 11,
    };
    const r = weekStep(player, { trainingId: 9, coachLevel: 4 }, COACH_PARROT);
    // 0.5 (rate) x 0.27 (age27) x ~1.0 (height OD@201) x 0.91^(4 - (3+2+2)/3) (elastic)
    //   x 1 (not max skill) x 1 (not capped) x 0.97 (coach L4) = 0.11190
    expect(r.gains.od).toBeCloseTo(0.1119, 4);
  });
});
