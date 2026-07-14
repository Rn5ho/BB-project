import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from './models/coach-parrot';
import { project, type PlayerState } from './engine';
import { skillsFromArray } from './types';

const p = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9,
});

describe('project', () => {
  it('ages the player at 14-week season boundaries (startWeekOfSeason honored)', () => {
    const plan = Array.from({ length: 20 }, () => ({ trainingId: 12, coachLevel: 5 }));
    // starting at season week 10 -> 5 weeks left in season (10..14), age pops before week 6
    const proj = project(p(), plan, COACH_PARROT, { startWeekOfSeason: 10 });
    expect(proj.weeks[4].age).toBe(18); // season week 14
    expect(proj.weeks[5].age).toBe(19); // new season
    // Brief literal said 19, but 5 leftover weeks (10..14) + a full 14-week season
    // exactly exhausts week 19 of the 20-week plan, so week 20 starts a *third*
    // season and the player is 20, not 19. Verified with a Node calc — see report.
    expect(proj.finalAge).toBe(20);
    expect(proj.weeks[5].seasonWeek).toBe(1);
  });

  it('accumulates gains week over week and counts pops', () => {
    const plan = Array.from({ length: 4 }, () => ({ trainingId: 12, coachLevel: 5 }));
    const proj = project(p(), plan, COACH_PARROT);
    expect(proj.finalSkills.ha).toBeGreaterThan(8.8); // ~4x0.5 minus elastic drag as ha rises
    expect(proj.totalGains.ha).toBeCloseTo(proj.finalSkills.ha - 7, 10);
    expect(proj.displayedGains.ha).toBeGreaterThanOrEqual(1);
    expect(proj.popCount).toBeGreaterThanOrEqual(1);
  });

  it('later weeks train slower as the player ages', () => {
    const plan = Array.from({ length: 28 }, () => ({ trainingId: 12, coachLevel: 5 }));
    const proj = project(p(), plan, COACH_PARROT);
    const w1 = proj.weeks[0].result.gains.dr;
    const w28 = proj.weeks[27].result.gains.dr; // age 19 (or 20 depending on start), slower
    expect(w28).toBeLessThan(w1);
  });
});
