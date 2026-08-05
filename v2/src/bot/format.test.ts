import { describe, it, expect } from 'vitest';
import { formatPlayerCard, formatPlan, formatProjection, formatJourney, checkpointTable } from './format';
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import type { SkillTarget } from '@/lib/training/optimize';

const skillsDb = {
  jump_shot: 9, jump_range: 7, outside_def: 7, handling: 9, driving: 9, passing: 5,
  inside_shot: 3, inside_def: 8, rebounding: 9, shot_blocking: 6, stamina: 6, free_throw: 6,
};
const disp = (v: Partial<Record<SkillKey, number>>) =>
  Object.fromEntries(SKILL_KEYS.map((k) => [k, v[k] ?? 5])) as Record<SkillKey, number>;

describe('formatPlayerCard', () => {
  const card = formatPlayerCard({
    name: 'Test Center', ageNow: 19, heightCm: 211, potential: 7, bestPosition: 'C',
    ownerTeamName: 'KK Test', skillsDb, tsp: 72, capturedAt: new Date('2026-08-03T10:00:00Z'),
    bbPlayerId: 123456,
  }, ['Defensive Center']);
  it('carries identity, totals and archetypes', () => {
    expect(card.title).toBe('Test Center');
    expect(card.description).toContain('Age **19**');
    expect(card.description).toContain('TSP **72**');
    expect(card.description).toContain('Out 46 / In 26'); // 9+7+7+9+9+5 / 3+8+9+6
    expect(card.description).toContain('Defensive Center');
    expect(card.url).toContain('123456');
  });
});

describe('formatPlan', () => {
  it('lists blocks and skips zero-week blocks', () => {
    const s = formatPlan({
      name: 'Journey: Defensive Center',
      blocks: [{ trainingId: 29, weeks: 10 }, { trainingId: 24, weeks: 0 }],
      coachLevel: 6, youthTrainerLevel: 6, gymLevel: 1, trainingCourtLevel: 1,
      horizon: { age: 22, week: 1 }, updatedAt: new Date('2026-08-05T00:00:00Z'),
    }, (id) => `T${id}`);
    expect(s).toContain('T29 × 10wk');
    expect(s).not.toContain('T24');
    expect(s).toContain('Total 10 weeks');
    expect(s).toContain('entering age 22 wk 1');
  });
});

describe('formatProjection', () => {
  it('shows only changed skills and the TSP arc', () => {
    const s = formatProjection({
      name: 'Test', planName: 'Plan', weeks: 14,
      nowDisplayed: disp({ sb: 6 }), endDisplayed: disp({ sb: 9 }),
      tspNow: 50, tspEnd: 53, popCount: 3,
    });
    expect(s).toContain('SB 6 → **9**');
    expect(s).not.toContain('JS 5 → ');
    expect(s).toContain('TSP 50 → **53**');
  });
});

describe('checkpointTable', () => {
  const targets: SkillTarget[] = [{ skill: 'sb', displayed: 12, priority: 'high' }];
  it('marks below-bar cells with * and renders missing checkpoints as —', () => {
    const t = checkpointTable([
      { label: 'now', skills: disp({ sb: 6 }), bar: targets },
      { label: 'M1', skills: null, bar: targets },
    ], targets);
    expect(t).toContain('6*');
    expect(t).toContain('—');
    expect(t).toContain('12'); // target row
    expect(t.startsWith('```')).toBe(true);
  });
});

describe('formatJourney', () => {
  it('renders phases, verdicts and the fine print', () => {
    const s = formatJourney({
      name: 'Test Center', ageNow: 19, currentSeason: 73, currentWeek: 2,
      tspNow: 72, potential: 7,
      buildName: 'Defensive Center',
      targets: [{ skill: 'sb', displayed: 12, priority: 'high' }],
      m1Targets: [{ skill: 'sb', displayed: 11, priority: 'high' }],
      floorSkill: 'id',
      staff: { coachLevel: 5, youthTrainerLevel: 5, gymLevel: 0, trainingCourtLevel: 0 },
      phases: [{ label: 'to M1', blocks: [{ trainingId: 29, weeks: 12 }] }],
      checkpoints: { m1: disp({ sb: 11 }), m2: disp({ sb: 12 }), end: disp({ sb: 13 }) },
      nowDisplayed: disp({ sb: 6 }),
      playable: true, finalized: true, weeklyPopRate: 0.62, finalizeWeek: 7,
      labelOf: (id) => `T${id}`,
    });
    expect(s).toContain('**[to M1]** 12wk: T29 ×12');
    expect(s).toContain('Playable (M1): **YES**');
    expect(s).toContain('Finalized (M2): **YES**');
    expect(s).toContain('0.62 pops/wk');
    expect(s.length).toBeLessThan(2000); // Discord content limit headroom
  });
});
