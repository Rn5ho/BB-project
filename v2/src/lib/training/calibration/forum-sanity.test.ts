// v2/src/lib/training/calibration/forum-sanity.test.ts
// Weeks-per-pop magnitudes from the community table (forum-research/EXTRACTED-DATA.md §2):
// wide tolerances on purpose — these guard against order-of-magnitude regressions.
import { describe, expect, it } from 'vitest';
import { BBSCOUT } from '../models/bbscout';
import { weekStep } from '../engine';
import { skillsFromArray } from '../types';

function weeksPerPop(gain: number): number {
  return 1 / gain;
}

describe('forum weeks-per-pop sanity (18yo, level-5 trainer)', () => {
  it('single-position OD training pops OD roughly every 2 weeks for a 190cm guard', () => {
    const p = { skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]), age: 18, heightCm: 190, potential: 9 };
    const r = weekStep(p, { trainingId: 9, coachLevel: 5 }, BBSCOUT);
    expect(weeksPerPop(r.gains.od)).toBeGreaterThan(1);
    expect(weeksPerPop(r.gains.od)).toBeLessThan(3.5); // table: OD@2 (Pressure PG)
  });

  it('RB for 45 pops RB roughly every 1.75-2.5 weeks for a 206cm big', () => {
    const p = { skills: skillsFromArray([5, 4, 4, 4, 4, 4, 9, 9, 8, 7]), age: 18, heightCm: 206, potential: 9 };
    const r = weekStep(p, { trainingId: 27, coachLevel: 5 }, BBSCOUT);
    expect(weeksPerPop(r.gains.rb)).toBeGreaterThan(1);
    expect(weeksPerPop(r.gains.rb)).toBeLessThan(3.5); // table: RB@1.75
  });

  it('free throws pop about every 2 weeks regardless of trainer', () => {
    const p = { skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]), age: 18, heightCm: 196, potential: 9, ftSkill: 5 };
    const r = weekStep(p, { trainingId: 33, coachLevel: 1 }, BBSCOUT);
    expect(r.ftAfter - 5).toBeCloseTo(0.5, 10); // table: FT@2wks -> 0.5/week
  });
});
