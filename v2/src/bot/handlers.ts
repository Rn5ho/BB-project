// Command handlers: load data → format → return a Discord reply payload.
// Thin over the pure formatters (format.ts) and the data layer (data.ts).
// All READ-ONLY. Thrown errors are shown verbatim to the user.
import { loadBotPlayer } from './data';
import { formatPlayerCard, formatPlan, formatProjection, formatJourney } from './format';
import { getActivePlan } from '@/queries/minutes';
import { getEffectiveArchetypes } from '@/queries/archetypes';
import { matchingArchetypes } from '@/lib/archetypes/evaluate';
import { archetypeTargets } from '@/lib/archetypes/targets';
import { planJourney, FINALIZE_WEEK } from '@/lib/archetypes/derive/plans';
import { planToWeeks } from '@/lib/training/bridge';
import { project, displayed } from '@/lib/training/engine';
import { BBSCOUT } from '@/lib/training/models/bbscout';
import { getTrainingType } from '@/lib/training/catalog';
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import type { SkillTarget } from '@/lib/training/optimize';

export interface ReplyPayload {
  content?: string;
  embed?: { title: string; description: string; url?: string };
}

const labelOf = (trainingId: number) => getTrainingType(trainingId).label;

export async function handlePlayer(playerId: number): Promise<ReplyPayload> {
  const p = await loadBotPlayer(playerId);
  const archetypes = await getEffectiveArchetypes();
  const matches = matchingArchetypes(
    { ageNow: p.ageNow, skills: p.skillsDb, potential: p.potential, heightCm: p.heightCm, tsp: p.tsp, bestPosition: p.bestPosition },
    archetypes,
  ).map((a) => a.name);
  return { embed: formatPlayerCard(p, matches) };
}

export async function handlePlan(playerId: number): Promise<ReplyPayload> {
  const p = await loadBotPlayer(playerId);
  const plan = await getActivePlan(playerId);
  if (!plan) return { content: `**${p.name}** has no active training plan. Generate one with \`/journey\`.` };
  return { content: `Active plan for **${p.name}**:\n${formatPlan(plan, labelOf)}` };
}

export async function handleProject(playerId: number): Promise<ReplyPayload> {
  const p = await loadBotPlayer(playerId);
  const plan = await getActivePlan(playerId);
  if (!plan) return { content: `**${p.name}** has no active plan to project — generate one with \`/journey\`.` };
  const weeks = planToWeeks(plan.blocks, plan.coachLevel, plan.youthTrainerLevel, {
    gymLevel: plan.gymLevel, trainingCourtLevel: plan.trainingCourtLevel,
  });
  const proj = project(p.state, weeks, BBSCOUT, { startWeekOfSeason: p.currentWeek });
  const nowDisplayed = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(p.state.skills[k])])) as Record<SkillKey, number>;
  const endDisplayed = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(proj.finalSkills[k])])) as Record<SkillKey, number>;
  const tspEnd = SKILL_KEYS.reduce((a, k) => a + endDisplayed[k], 0);
  return {
    content: formatProjection({
      name: p.name, planName: plan.name, weeks: weeks.length,
      nowDisplayed, endDisplayed, tspNow: p.tsp, tspEnd, popCount: proj.popCount,
    }),
  };
}

export async function handleJourney(
  playerId: number,
  buildQuery: string,
  staff: { coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number },
): Promise<ReplyPayload> {
  const p = await loadBotPlayer(playerId);
  if (p.ageNow > 21) throw new Error(`${p.name} is age ${p.ageNow} — the U-21 journey is over.`);

  const archetypes = await getEffectiveArchetypes();
  const q = buildQuery.trim().toLowerCase();
  const matches = archetypes.filter((a) => a.name.toLowerCase().includes(q) || (a.key !== null && a.key.toLowerCase() === q));
  if (matches.length !== 1) {
    const available = archetypes.map((a) => a.name).sort().join(', ');
    throw new Error(`${matches.length === 0 ? 'No' : 'Ambiguous'} build match for "${buildQuery}". Available: ${available}`);
  }
  const build = matches[0];

  const targetMap = archetypeTargets(build);
  const hasCond = (field: string) =>
    build.rules.conditions.some((c) => c.kind === 'field' && c.op === '>=' && c.field === field);
  const floorSkill: SkillKey | null = hasCond('outside_def') ? 'od' : hasCond('inside_def') ? 'id' : null;
  const targets: SkillTarget[] = SKILL_KEYS
    .filter((k) => targetMap[k] !== undefined)
    .map((k) => ({ skill: k, displayed: targetMap[k]!, priority: (k === 'od' || k === 'id') ? 'high' : 'normal' }));
  if (targets.length === 0) throw new Error(`Build "${build.name}" has no rate-skill '>=' conditions — nothing to train toward.`);
  const m1Targets: SkillTarget[] = targets.map((t) => ({
    ...t, displayed: Math.max(1, t.displayed - (t.skill === floorSkill ? 2 : 1)),
  }));

  const result = planJourney(p.state, { age: p.ageNow, week: p.currentWeek }, targets, floorSkill, { name: 'discord', ...staff });
  const nowDisplayed = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(p.state.skills[k])])) as Record<SkillKey, number>;

  return {
    content: formatJourney({
      name: p.name, ageNow: p.ageNow, currentSeason: p.currentSeason, currentWeek: p.currentWeek,
      tspNow: p.tsp, potential: p.potential,
      buildName: build.name, targets, m1Targets, floorSkill,
      staff,
      phases: result.phases, checkpoints: result.checkpoints, nowDisplayed,
      playable: result.playable, finalized: result.finalized, weeklyPopRate: result.weeklyPopRate,
      finalizeWeek: FINALIZE_WEEK, labelOf,
    }),
  };
}
