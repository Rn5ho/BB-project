import { describe, it, expect } from 'vitest';
import { caseFromScrapedHistory, replayCase, type ScrapedWeek } from './replay';
import { BBSCOUT } from './models/bbscout';
import { SKILL_KEYS } from './types';

const scraped: ScrapedWeek[] = [
  // chronological; age event between the two training weeks
  { date: '7/3/2026', label: 'One on One', trainingId: 15, minutes: 48, pops: [{ key: 'dr', from: 10, to: 11 }] },
  { date: '7/6/2026', label: 'AGE', trainingId: null, minutes: null, pops: [], ageEvent: 'Your player is now 19 years old' },
  { date: '7/10/2026', label: 'One on One', trainingId: 15, minutes: 48, pops: [{ key: 'stamina', from: 5, to: 6 }] },
];

describe('caseFromScrapedHistory', () => {
  it('builds weeks with threaded ages, back-tracked start skills, and unmodeled count', () => {
    const c = caseFromScrapedHistory({
      label: 'test', rawWeeks: scraped, heightCm: 190, potential: 8, snapshotAge: 19,
      endSkills: { js: 7, dr: 11 }, endStamina: 6, endFreeThrow: 4,
      coachLevel: 5, youthTrainerLevel: 5, gymLevel: 0, trainingCourtLevel: 0,
    });
    expect(c.startAge).toBe(18);                       // first age event says 19 → started at 18
    expect(c.weeks).toHaveLength(2);                   // age event is not a training week
    expect(c.weeks[0].ageAfterThis).toBe(19);          // age-up lands after the first week
    expect(c.weeks[0].observedPops).toEqual({ dr: 11 });
    expect(c.unmodeledPopCount).toBe(1);               // the stamina pop is not a rate skill
    const drIdx = SKILL_KEYS.indexOf('dr');
    expect(c.startSkills[drIdx]).toBe(10);             // back-tracked to the first dr pop's from-level
    const jsIdx = SKILL_KEYS.indexOf('js');
    expect(c.startSkills[jsIdx]).toBe(7);              // no js pop → end value
  });
});

describe('replayCase', () => {
  it('scores an unpredictable pop as a miss and stable end skills as exact', () => {
    // Age-30 player: weekly gains are near zero, so no model predicts the observed pop
    // and displayed end skills equal start skills.
    const c = {
      label: 'old-man',
      startSkills: [7, 6, 6, 8, 9, 7, 4, 4, 4, 3],
      startAge: 30, heightCm: 190, potential: 8,
      startStamina: 5, startFreeThrow: 5,
      coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0,
      weeks: [{ date: '7/10/2026', trainingId: 15, minutes: 48, observedPops: { dr: 10 } }],
      endSkills: [7, 6, 6, 8, 9, 7, 4, 4, 4, 3] as Array<number | null>,
      unmodeledPopCount: 0,
    };
    const r = replayCase(c, BBSCOUT);
    expect(r.hits).toBe(0);
    expect(r.misses).toBe(1);
    expect(r.events).toEqual([expect.objectContaining({ kind: 'miss', skill: 'dr', date: '7/10/2026' })]);
    expect(r.endCount).toBe(10);
    expect(r.endExact).toBe(10);
    expect(r.endAbsErr).toBe(0);
  });
});
