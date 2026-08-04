// Slovenia gap analysis: age-conditional at-risk grading (spec §8.6).
import { type SkillKey } from '../../training/types';
import { shapeVector, euclid } from './cluster';
import { FINALIZE_WEEK } from './plans';
import type { DefenseFloor } from './rules';

export type ProspectStatus = 'on-track' | 'watch' | 'at-risk';
export interface ProspectGrade {
  status: ProspectStatus; reasons: string[];
  nearestKey: string; distance: number;
  gaps: Array<{ skill: SkillKey; have: number; need: number }>;
}
export interface GapCluster {
  key: string; group: 'outside' | 'inside' | 'wing';
  centroid: Record<SkillKey, number>;
  tiers: Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>;
  floor: DefenseFloor;
}
interface GapProspect {
  age: number; heightCm: number; potential: number;
  skills: Record<SkillKey, number>;
  inferredTrainingId: number | null; currentSeasonWeek: number;
}

const OD_TRAININGS = [9, 10, 11];
const ID_TRAININGS = [24, 25, 26];

export function gradeProspect(
  p: GapProspect, clusters: GapCluster[], opts: { closurePerWeek?: number } = {},
): ProspectGrade {
  const closure = opts.closurePerWeek ?? 0.35;
  const admissible = clusters.filter((c) =>
    c.group === 'wing' ||
    (c.group === 'outside' && p.heightCm <= 201) ||
    (c.group === 'inside' && p.heightCm >= 203));
  const pool = admissible.length ? admissible : clusters;
  const v = shapeVector(p.skills);
  const nearest = pool.reduce((best, c) => {
    const d = euclid(v, shapeVector(c.centroid));
    return d < best.distance ? { cluster: c, distance: d } : best;
  }, { cluster: pool[0], distance: Infinity });
  const c = nearest.cluster;

  const tierAge = (Math.min(21, Math.max(19, p.age + 1))) as 19 | 20 | 21;
  const tier = c.tiers[p.age >= 21 ? 21 : tierAge] ?? {};
  const gaps = (Object.entries(tier) as Array<[SkillKey, number]>)
    .map(([skill, need]) => ({ skill, have: p.skills[skill], need }))
    .filter((g) => g.have < g.need);

  const reasons: string[] = [];
  let status: ProspectStatus = 'on-track';
  const floorSkill = c.floor.skill;
  const defenseIds = floorSkill === 'od' ? OD_TRAININGS : ID_TRAININGS;

  if (p.age <= 19) {
    if (floorSkill === 'od') {
      const feederNeed = (c.tiers[20].ha ?? 0) + (c.tiers[20].dr ?? 0) - 2;
      if (p.skills.ha + p.skills.dr < feederNeed) {
        status = 'watch'; reasons.push(`feeders behind (HA+DR ${p.skills.ha + p.skills.dr} vs track ${feederNeed})`);
      } else reasons.push('defense lag OK at this age — feeders on track');
    } else {
      const need = c.tiers[tierAge][floorSkill] ?? 0;
      if (p.skills[floorSkill] < need - 2) {
        status = 'watch'; reasons.push(`${floorSkill.toUpperCase()} behind the big-man early-defense track`);
      }
    }
  } else if (p.age === 20) {
    const need = c.tiers[20][floorSkill] ?? 0;
    if (p.skills[floorSkill] < need) {
      if (p.inferredTrainingId !== null && defenseIds.includes(p.inferredTrainingId)) {
        reasons.push(`defense season: below track but training ${floorSkill.toUpperCase()} now`);
      } else {
        status = 'at-risk';
        reasons.push(`defense season, not training ${floorSkill.toUpperCase()} (inferred: ${p.inferredTrainingId ?? 'unknown'})`);
      }
    }
  } else if (p.age >= 21) {
    const floorGap = c.floor.min - p.skills[floorSkill];
    // Owner U-21 calendar: the build must be FINALIZED entering age-21 week FINALIZE_WEEK
    // (playoffs begin) — that's the real closure deadline, not season end.
    const weeksLeft = Math.max(0, FINALIZE_WEEK - p.currentSeasonWeek);
    if (floorGap > weeksLeft * closure) {
      status = 'at-risk';
      reasons.push(`cannot close ${floorSkill.toUpperCase()} gap ${floorGap} in ${weeksLeft} weeks before playoffs (wk ${FINALIZE_WEEK}) (≤${(weeksLeft * closure).toFixed(1)})`);
    } else if (gaps.length > 0 && status === 'on-track') {
      status = 'watch';
    }
  }
  if (status === 'on-track' && p.age === 20 && gaps.some((g) => g.skill !== floorSkill && g.need - g.have > 3)) {
    status = 'watch'; reasons.push('non-defense skills >3 behind the age-20 track');
  }
  return { status, reasons, nearestKey: c.key, distance: nearest.distance, gaps };
}
