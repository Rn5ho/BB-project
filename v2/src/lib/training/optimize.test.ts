import { describe, expect, it } from 'vitest';
import { project, type PlayerState, type WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { collapseWeekly, evaluatePlan, optimizePlan, type SkillTarget } from './optimize';
import { SKILL_KEYS, type Skills } from './types';

const uniform = (v: number): Skills =>
  Object.fromEntries(SKILL_KEYS.map((k) => [k, v])) as Skills;

function player(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    skills: uniform(4.5), age: 18, heightCm: 203, potential: 9,
    ftSkill: 4.5, staminaSkill: 4.5, ...overrides,
  };
}

// beamWidth 64 keeps the suite fast; determinism doesn't depend on width.
const OPTS = {
  horizonWeeks: 20, startWeekOfSeason: 1, coachLevel: 5, youthTrainerLevel: 0,
  gymLevel: 0, trainingCourtLevel: 0, beamWidth: 64,
};
const EVAL_OPTS = {
  startWeekOfSeason: 1, coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0,
};

describe('collapseWeekly', () => {
  it('merges runs into blocks', () => {
    expect(collapseWeekly([1, 1, 9, 9, 9, 1])).toEqual([
      { trainingId: 1, weeks: 2 }, { trainingId: 9, weeks: 3 }, { trainingId: 1, weeks: 1 },
    ]);
  });
  it('empty → empty', () => {
    expect(collapseWeekly([])).toEqual([]);
  });
});

describe('optimizePlan', () => {
  it('single target: reaches it, IS trainings dominate pre-hit, finals match project()', () => {
    const targets: SkillTarget[] = [{ skill: 'is', displayed: 8, priority: 'normal' }];
    const res = optimizePlan(player(), targets, OPTS);
    expect(res.best).not.toBeNull();
    const best = res.best!;
    expect(best.reachable).toBe(true);
    expect(best.hitWeek.is).not.toBeNull();
    expect(best.weekly).toHaveLength(OPTS.horizonWeeks);

    // Pre-hit weeks are dominated by IS-primary trainings (ids 21, 22, 23).
    const upTo = best.weekly.slice(0, best.hitWeek.is!);
    const isShare = upTo.filter((id) => [21, 22, 23].includes(id)).length / upTo.length;
    expect(isShare).toBeGreaterThan(0.5);

    // Drift guard: the optimizer's stepping must equal the real engine's project().
    const cfgs: WeekConfig[] = best.weekly.map((id) => ({
      trainingId: id, coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0,
    }));
    const proj = project(player(), cfgs, BBSCOUT, { startWeekOfSeason: 1 });
    for (const k of SKILL_KEYS) {
      expect(proj.finalSkills[k]).toBeCloseTo(best.finalSkills[k], 9);
    }
  });

  it('is at least as good as either ordering of a two-skill hand plan', () => {
    const p = player({ heightCm: 190 });
    const targets: SkillTarget[] = [
      { skill: 'ha', displayed: 10, priority: 'normal' },
      { skill: 'od', displayed: 8, priority: 'normal' },
    ];
    const opts = { ...OPTS, horizonWeeks: 24 };
    const res = optimizePlan(p, targets, opts);
    // HA for 1 (id 12) ×12 then OD for 1 (id 9) ×12, and the reverse.
    const haFirst = [...Array(12).fill(12), ...Array(12).fill(9)] as number[];
    const odFirst = [...Array(12).fill(9), ...Array(12).fill(12)] as number[];
    const a = evaluatePlan(p, haFirst, targets, EVAL_OPTS);
    const b = evaluatePlan(p, odFirst, targets, EVAL_OPTS);
    expect(res.best!.totalShortfall).toBeLessThanOrEqual(
      Math.min(a.totalShortfall, b.totalShortfall) + 1e-9,
    );
  });

  it('unreachable target: best-effort plan, positive shortfall, full length', () => {
    const targets: SkillTarget[] = [{ skill: 'sb', displayed: 20, priority: 'high' }];
    const res = optimizePlan(player(), targets, { ...OPTS, horizonWeeks: 4 });
    const best = res.best!;
    expect(best.reachable).toBe(false);
    expect(best.totalShortfall).toBeGreaterThan(0);
    expect(best.weekly).toHaveLength(4);
    expect(best.hitWeek.sb).toBeNull();
  });

  it('switch penalty keeps plans blocky', () => {
    const res = optimizePlan(
      player(), [{ skill: 'rb', displayed: 9, priority: 'normal' }], OPTS,
    );
    expect(res.best!.blocks.length).toBeLessThanOrEqual(5);
  });

  it('high priority protects a skill better than low priority', () => {
    const mk = (isPrio: 'high' | 'low', odPrio: 'high' | 'low'): SkillTarget[] => [
      { skill: 'is', displayed: 9, priority: isPrio },
      { skill: 'od', displayed: 9, priority: odPrio },
    ];
    const opts = { ...OPTS, horizonWeeks: 10 };
    const r1 = optimizePlan(player(), mk('high', 'low'), opts);
    const r2 = optimizePlan(player(), mk('low', 'high'), opts);
    expect(r1.best!.shortfall.is ?? 0).toBeLessThanOrEqual((r2.best!.shortfall.is ?? 0) + 1e-9);
  });

  it('returns null best for zero horizon or already-met targets', () => {
    const t: SkillTarget[] = [{ skill: 'is', displayed: 8, priority: 'normal' }];
    expect(optimizePlan(player(), t, { ...OPTS, horizonWeeks: 0 }).best).toBeNull();
    // current sublevel 4.5 already displays 5 ≥ target 4 → filtered out
    expect(optimizePlan(player(), [{ skill: 'is', displayed: 4, priority: 'normal' }], OPTS).best).toBeNull();
  });

  it('alternatives have different block signatures than best', () => {
    const res = optimizePlan(
      player(), [{ skill: 'is', displayed: 8, priority: 'normal' }], OPTS,
    );
    const sig = (c: { blocks: Array<{ trainingId: number }> }) =>
      c.blocks.map((b) => b.trainingId).join('-');
    for (const alt of res.alternatives) {
      expect(sig(alt)).not.toBe(sig(res.best!));
    }
  });
});

describe('evaluatePlan', () => {
  it('season wrap: ages the player at week 14 like project()', () => {
    const p = player({ age: 20 });
    const weekly = Array(6).fill(21) as number[]; // 6 weeks from season week 10 → crosses boundary
    const targets: SkillTarget[] = [{ skill: 'is', displayed: 9, priority: 'normal' }];
    const cand = evaluatePlan(p, weekly, targets, { ...EVAL_OPTS, startWeekOfSeason: 10 });
    const cfgs: WeekConfig[] = weekly.map((id) => ({
      trainingId: id, coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0,
    }));
    const proj = project(p, cfgs, BBSCOUT, { startWeekOfSeason: 10 });
    for (const k of SKILL_KEYS) {
      expect(proj.finalSkills[k]).toBeCloseTo(cand.finalSkills[k], 9);
    }
  });
});
