import { describe, expect, it } from 'vitest';
import { bandSeries, eligibleTrainings, fullTrainingMinutes, minutesAtPositions, planToWeeks, playerStateFromSnapshot } from './bridge';
import { ensembleProject } from './ensemble';

const wk = (m: Partial<Record<'minPg'|'minSg'|'minSf'|'minPf'|'minC', number>>) => ({
  season: 40, seasonWeek: 5, games: 2,
  minPg: 0, minSg: 0, minSf: 0, minPf: 0, minC: 0, ...m,
});

describe('bridge', () => {
  it('converts displayed skills to sublevel midpoints', () => {
    const p = playerStateFromSnapshot({
      skills: { jump_shot: 8, jump_range: 6, outside_def: 7, handling: 9, driving: 7, passing: 10,
                inside_shot: 4, inside_def: 3, rebounding: 5, shot_blocking: 2 },
      age: 19, heightCm: 190, potential: 8, stamina: 6, freeThrow: 5,
    });
    expect(p.skills.js).toBe(7.5);
    expect(p.skills.sb).toBe(1.5);
    expect(p.ftSkill).toBe(4.5);
    expect(p.age).toBe(19);
  });

  it('sums minutes over a training type qualifying positions', () => {
    const w = wk({ minPg: 20, minSg: 28 });
    expect(minutesAtPositions(w, 15)).toBe(48); // DR for 12 = PG+SG
    expect(minutesAtPositions(w, 21)).toBe(0);  // IS for 5 = C
  });

  it('eligible trainings respect the age threshold (18yo needs 44)', () => {
    const w = wk({ minPg: 24, minSg: 20 }); // 44 at guard slots
    const ids = eligibleTrainings(w, 18);
    expect(ids).toContain(15); // guards training reachable
    expect(ids).not.toContain(21); // no C minutes
    expect(ids).toContain(32); // stamina always
  });

  it('expands plan blocks to week configs', () => {
    const weeks = planToWeeks([{ trainingId: 15, weeks: 2 }, { trainingId: 9, weeks: 1 }], 6, 4);
    expect(weeks).toHaveLength(3);
    expect(weeks[0]).toEqual({ trainingId: 15, coachLevel: 6, youthTrainerLevel: 4 });
    expect(weeks[2].trainingId).toBe(9);
  });

  it('full training minutes follows the age bands (44 at 19, 47 at 21)', () => {
    expect(fullTrainingMinutes(19)).toBe(44);
    expect(fullTrainingMinutes(21)).toBe(47);
  });

  it('bandSeries maps ensemble weeks to a per-week TSP band with a starting point', () => {
    const player = playerStateFromSnapshot({
      skills: { jump_shot: 8, jump_range: 6, outside_def: 7, handling: 9, driving: 7, passing: 10,
                inside_shot: 4, inside_def: 3, rebounding: 5, shot_blocking: 2 },
      age: 19, heightCm: 190, potential: 8,
    });
    const plan = planToWeeks([{ trainingId: 15, weeks: 3 }], 5, 0);
    const result = ensembleProject(player, plan);
    const series = bandSeries(result);
    expect(series).toHaveLength(4); // starting point + 3 weeks
    expect(series[0].x).toBe(0);
    expect(series[0].central).toBe(series[0].low);
    expect(series[0].central).toBe(series[0].high);
    expect(series[3].x).toBe(3);
    expect(series[3].low).toBeLessThanOrEqual(series[3].central);
    expect(series[3].central).toBeLessThanOrEqual(series[3].high);
  });
});
