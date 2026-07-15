import { describe, expect, it } from 'vitest';
import {
  absWeek, blockBoundaries, fitBlocksToHorizon, fromAbsWeek, horizonPresets, horizonWeeks,
  normalizePlan,
} from './horizon';

describe('horizonWeeks', () => {
  it('spec worked example: age 20 wk 6 → start of age-21 season = 9', () => {
    expect(horizonWeeks({ age: 20, week: 6 }, { age: 21, week: 1 })).toBe(9);
  });
  it('age 20 wk 6 → end of U-21 (22,1) = 23', () => {
    expect(horizonWeeks({ age: 20, week: 6 }, { age: 22, week: 1 })).toBe(23);
  });
  it('current week counts as upcoming: (20,14) → (21,1) = 1', () => {
    expect(horizonWeeks({ age: 20, week: 14 }, { age: 21, week: 1 })).toBe(1);
  });
  it('same point = 0', () => {
    expect(horizonWeeks({ age: 21, week: 1 }, { age: 21, week: 1 })).toBe(0);
  });
  it('past target clamps to 0', () => {
    expect(horizonWeeks({ age: 21, week: 3 }, { age: 21, week: 1 })).toBe(0);
    expect(horizonWeeks({ age: 22, week: 1 }, { age: 21, week: 14 })).toBe(0);
  });
  it('mid-season target: (20,6) → (21,8) = 16', () => {
    expect(horizonWeeks({ age: 20, week: 6 }, { age: 21, week: 8 })).toBe(16);
  });
});

describe('absWeek/fromAbsWeek', () => {
  it('roundtrips', () => {
    for (const p of [{ age: 18, week: 1 }, { age: 20, week: 14 }, { age: 21, week: 7 }]) {
      expect(fromAbsWeek(absWeek(p))).toEqual(p);
    }
  });
});

describe('horizonPresets', () => {
  it('includes start-21, end-21, end-season with correct targets', () => {
    const ps = horizonPresets(19);
    expect(ps.find((p) => p.key === 'start-21')?.target).toEqual({ age: 21, week: 1 });
    expect(ps.find((p) => p.key === 'end-21')?.target).toEqual({ age: 22, week: 1 });
    expect(ps.find((p) => p.key === 'end-season')?.target).toEqual({ age: 20, week: 1 });
  });
  it('omits presets past the age-22 bound (no out-of-range save targets)', () => {
    const ps = horizonPresets(22);
    expect(ps.find((p) => p.key === 'end-season')).toBeUndefined();
    expect(ps.map((p) => p.key)).toEqual(['start-21', 'end-21']);
    for (const p of horizonPresets(21)) expect(p.target.age).toBeLessThanOrEqual(22);
  });
});

describe('fitBlocksToHorizon', () => {
  const blocks = [
    { trainingId: 15, weeks: 21 }, { trainingId: 9, weeks: 10 }, { trainingId: 1, weeks: 8 },
  ];
  it('last block absorbs the remainder', () => {
    const { blocks: fitted, overflowWeeks } = fitBlocksToHorizon(blocks, 40);
    expect(fitted.map((b) => b.weeks)).toEqual([21, 10, 9]);
    expect(overflowWeeks).toBe(0);
  });
  it('earlier blocks overshoot → last 0, overflow reported', () => {
    const { blocks: fitted, overflowWeeks } = fitBlocksToHorizon(blocks, 25);
    expect(fitted.map((b) => b.weeks)).toEqual([21, 10, 0]);
    expect(overflowWeeks).toBe(6);
  });
  it('exact fill → last 0, no overflow', () => {
    const { blocks: fitted, overflowWeeks } = fitBlocksToHorizon(blocks, 31);
    expect(fitted.map((b) => b.weeks)).toEqual([21, 10, 0]);
    expect(overflowWeeks).toBe(0);
  });
  it('single block absorbs the whole horizon', () => {
    expect(fitBlocksToHorizon([{ trainingId: 21, weeks: 3 }], 12).blocks).toEqual([
      { trainingId: 21, weeks: 12 },
    ]);
  });
  it('empty blocks → empty, no overflow', () => {
    expect(fitBlocksToHorizon([], 10)).toEqual({ blocks: [], overflowWeeks: 0 });
  });
  it('does not mutate its input', () => {
    const input = [{ trainingId: 1, weeks: 5 }];
    fitBlocksToHorizon(input, 9);
    expect(input[0].weeks).toBe(5);
  });
});

describe('blockBoundaries', () => {
  it('walks (age, week) across season boundaries', () => {
    const bs = blockBoundaries(
      [{ trainingId: 15, weeks: 9 }, { trainingId: 9, weeks: 5 }],
      { age: 20, week: 6 },
    );
    expect(bs).toEqual([
      { start: { age: 20, week: 6 }, end: { age: 21, week: 1 } },
      { start: { age: 21, week: 1 }, end: { age: 21, week: 6 } },
    ]);
  });
  it('multi-season block', () => {
    const bs = blockBoundaries([{ trainingId: 15, weeks: 30 }], { age: 18, week: 1 });
    expect(bs).toEqual([{ start: { age: 18, week: 1 }, end: { age: 20, week: 3 } }]);
  });
});

describe('normalizePlan', () => {
  const now = { age: 20, week: 6 };
  it('derives the last block from the horizon', () => {
    const plan = {
      blocks: [{ trainingId: 15, weeks: 4 }, { trainingId: 9, weeks: 99 }],
      horizon: { age: 21, week: 1 },
    };
    expect(normalizePlan(plan, now).blocks.map((b) => b.weeks)).toEqual([4, 5]);
  });
  it('no horizon / no now / no blocks → unchanged', () => {
    const plan = { blocks: [{ trainingId: 15, weeks: 4 }], horizon: null };
    expect(normalizePlan(plan, now)).toBe(plan);
    const plan2 = { blocks: [{ trainingId: 15, weeks: 4 }], horizon: { age: 21, week: 1 } };
    expect(normalizePlan(plan2, null)).toBe(plan2);
    const plan3 = { blocks: [], horizon: { age: 21, week: 1 } };
    expect(normalizePlan(plan3, now)).toBe(plan3);
  });
  it('preserves extra fields (generic passthrough)', () => {
    const plan = {
      blocks: [{ trainingId: 15, weeks: 4 }], horizon: { age: 21, week: 1 }, coachLevel: 6,
    };
    expect(normalizePlan(plan, now).coachLevel).toBe(6);
  });
});
