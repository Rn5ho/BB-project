// Pure Discord-markdown formatters for the bot — no IO, unit-tested.
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import type { SkillTarget } from '@/lib/training/optimize';

export const SKILL_SHORT: Record<string, string> = {
  jump_shot: 'JS', jump_range: 'JR', outside_def: 'OD', handling: 'HA', driving: 'DR',
  passing: 'PA', inside_shot: 'IS', inside_def: 'ID', rebounding: 'RB', shot_blocking: 'SB',
  stamina: 'ST', free_throw: 'FT',
};
const KEY_SHORT: Record<SkillKey, string> = {
  js: 'JS', jr: 'JR', od: 'OD', ha: 'HA', dr: 'DR', pa: 'PA', is: 'IS', id: 'ID', rb: 'RB', sb: 'SB',
};

const OUT_COLS = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing'];
const IN_COLS = ['inside_shot', 'inside_def', 'rebounding', 'shot_blocking'];

export function skillLine(skillsDb: Record<string, number>, cols: string[]): string {
  return cols.map((c) => `${SKILL_SHORT[c]} **${skillsDb[c]}**`).join(' · ');
}

export function formatPlayerCard(p: {
  name: string; ageNow: number; heightCm: number; potential: number;
  bestPosition: string | null; ownerTeamName: string | null;
  skillsDb: Record<string, number>; tsp: number; capturedAt: Date; bbPlayerId: number;
}, archetypeMatches: string[]): { title: string; description: string; url: string } {
  const osp = OUT_COLS.reduce((a, c) => a + p.skillsDb[c], 0);
  const isp = IN_COLS.reduce((a, c) => a + p.skillsDb[c], 0);
  const lines = [
    `Age **${p.ageNow}** · ${p.heightCm} cm · Pot **${p.potential}** · ${p.bestPosition ?? '–'}${p.ownerTeamName ? ` · ${p.ownerTeamName}` : ''}`,
    '',
    `Outside: ${skillLine(p.skillsDb, OUT_COLS)}`,
    `Inside:  ${skillLine(p.skillsDb, IN_COLS)}`,
    `Other:   ${skillLine(p.skillsDb, ['stamina', 'free_throw'])}`,
    '',
    `TSP **${p.tsp}** (Out ${osp} / In ${isp})`,
    archetypeMatches.length > 0 ? `Archetypes: ${archetypeMatches.join(', ')}` : 'Archetypes: no matches at this age',
    `_Last full scout: ${p.capturedAt.toISOString().slice(0, 10)}_`,
  ];
  return {
    title: p.name,
    description: lines.join('\n'),
    url: `https://buzzerbeater.com/player/${p.bbPlayerId}/overview.aspx`,
  };
}

export function formatPlan(plan: {
  name: string; blocks: Array<{ trainingId: number; weeks: number }>;
  coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number;
  horizon: { age: number; week: number } | null; updatedAt: Date;
}, labelOf: (trainingId: number) => string): string {
  const blocks = plan.blocks.filter((b) => b.weeks > 0);
  const total = blocks.reduce((a, b) => a + b.weeks, 0);
  return [
    `**${plan.name}** — coach ${plan.coachLevel} / YT ${plan.youthTrainerLevel} / gym ${plan.gymLevel} / TC ${plan.trainingCourtLevel}`,
    ...blocks.map((b) => `• ${labelOf(b.trainingId)} × ${b.weeks}wk`),
    `Total ${total} weeks${plan.horizon ? ` · target: entering age ${plan.horizon.age} wk ${plan.horizon.week}` : ''}`,
    `_Updated ${plan.updatedAt.toISOString().slice(0, 10)}_`,
  ].join('\n');
}

export function formatProjection(input: {
  name: string; planName: string; weeks: number;
  nowDisplayed: Record<SkillKey, number>; endDisplayed: Record<SkillKey, number>;
  tspNow: number; tspEnd: number; popCount: number;
}): string {
  const rows = SKILL_KEYS
    .filter((k) => input.endDisplayed[k] !== input.nowDisplayed[k])
    .map((k) => `${KEY_SHORT[k]} ${input.nowDisplayed[k]} → **${input.endDisplayed[k]}**`);
  return [
    `**${input.name}** — projecting active plan “${input.planName}” (${input.weeks} weeks, bbscout model)`,
    rows.length > 0 ? rows.join(' · ') : '_no displayed-level changes projected_',
    `TSP ${input.tspNow} → **${input.tspEnd}** · ~${input.popCount} pops`,
    `_Cumulative projections are solid (±1 level/skill per half-season); exact pop weeks are not — hidden sublevels._`,
  ].join('\n');
}

/** Monospace checkpoint table: milestones × 10 rate skills, '*' marks below-bar. */
export function checkpointTable(
  rows: Array<{ label: string; skills: Record<SkillKey, number> | null; bar: SkillTarget[] | null }>,
  targets: SkillTarget[],
): string {
  const header = ['milestone'.padEnd(22), ...SKILL_KEYS.map((k) => KEY_SHORT[k].padStart(4))].join('');
  const lines = rows.map((r) => {
    const cells = SKILL_KEYS.map((k) => {
      if (!r.skills) return '—'.padStart(4);
      const t = r.bar?.find((x) => x.skill === k);
      const miss = t !== undefined && r.skills[k] < t.displayed;
      return `${r.skills[k]}${miss ? '*' : ''}`.padStart(4);
    });
    return [r.label.padEnd(22), ...cells].join('');
  });
  const targetLine = ['target'.padEnd(22), ...SKILL_KEYS.map((k) => {
    const t = targets.find((x) => x.skill === k);
    return (t ? String(t.displayed) : '·').padStart(4);
  })].join('');
  return '```\n' + [header, ...lines, targetLine].join('\n') + '\n```';
}

export function formatJourney(input: {
  name: string; ageNow: number; currentSeason: number; currentWeek: number;
  tspNow: number; potential: number;
  buildName: string; targets: SkillTarget[]; m1Targets: SkillTarget[]; floorSkill: SkillKey | null;
  staff: { coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number };
  phases: Array<{ label: string; blocks: Array<{ trainingId: number; weeks: number }> }>;
  checkpoints: { m1: Record<SkillKey, number> | null; m2: Record<SkillKey, number> | null; end: Record<SkillKey, number> | null };
  nowDisplayed: Record<SkillKey, number>;
  playable: boolean; finalized: boolean; weeklyPopRate: number; finalizeWeek: number;
  labelOf: (trainingId: number) => string;
}): string {
  const targetStr = input.targets
    .map((t) => `${KEY_SHORT[t.skill]}≥${t.displayed}${t.priority === 'high' ? '*' : ''}`).join(' ');
  const phaseLines = input.phases.map((p) => {
    const weeks = p.blocks.reduce((a, b) => a + b.weeks, 0);
    const blockStr = p.blocks.map((b) => `${input.labelOf(b.trainingId)} ×${b.weeks}`).join(' → ') || '(targets already met)';
    return `**[${p.label}]** ${weeks}wk: ${blockStr}`;
  });
  const table = checkpointTable([
    { label: 'now', skills: input.nowDisplayed, bar: input.m1Targets },
    { label: 'M1 (enter 21 wk1)', skills: input.checkpoints.m1, bar: input.m1Targets },
    { label: `M2 (enter 21 wk${input.finalizeWeek})`, skills: input.checkpoints.m2, bar: input.targets },
    { label: 'end (enter 22 wk1)', skills: input.checkpoints.end, bar: input.targets },
  ], input.targets);
  const m2Ref = input.checkpoints.m2 ?? input.checkpoints.end;
  const misses = m2Ref
    ? input.targets.filter((t) => m2Ref[t.skill] < t.displayed).map((t) => `${KEY_SHORT[t.skill]} ${m2Ref[t.skill]}/${t.displayed}`)
    : [];
  return [
    `**${input.name}** — age ${input.ageNow}, S${input.currentSeason} wk${input.currentWeek} · TSP ${input.tspNow} · pot ${input.potential}`,
    `Build: **${input.buildName}** — ${targetStr}${input.floorSkill ? ` (floor ${KEY_SHORT[input.floorSkill]})` : ''}`,
    `Staff: coach ${input.staff.coachLevel} / YT ${input.staff.youthTrainerLevel} / gym ${input.staff.gymLevel} / TC ${input.staff.trainingCourtLevel}`,
    '',
    ...(phaseLines.length > 0 ? phaseLines : ['_No training phases — already past every U-21 milestone._']),
    '',
    table,
    `Playable (M1): ${input.playable ? '**YES**' : 'no'} · Finalized (M2): ${input.finalized ? '**YES**' : `no — missing ${misses.join(', ') || '(n/a)'}`} · ~${input.weeklyPopRate.toFixed(2)} pops/wk`,
    `_Read plans as "≈week N" — cumulative totals are validated, exact pop timing is sublevel-limited._`,
  ].join('\n');
}
