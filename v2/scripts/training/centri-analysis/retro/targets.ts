// Owner build knowledge encoded as machine targets for the retro-prescription study.
// Source: docs/research/training/user-notes/owner-build-knowledge-2026-08.md (batches 1-3).
// STUDY-LOCAL — not wired into DEFAULT_ARCHETYPES; owner reviews results first.
// gates = viability minimums entering age-21 (M1 bars); targets = preferred bands
// (midpoint-ish); floorSkill drives the journey search's M1 relaxation + priority.
import type { SkillKey } from '../../../../src/lib/training/types';
import type { SkillTarget } from '../../../../src/lib/training/optimize';

export interface StudyBuild {
  key: string;
  label: string;
  class: 'outside' | 'big';
  floorSkill: SkillKey | null;
  gates: Partial<Record<SkillKey, number>>;   // hard M1 minimums (owner batch 1/3)
  targets: Partial<Record<SkillKey, number>>; // preferred entering-21 bands
}

export const STUDY_BUILDS: StudyBuild[] = [
  {
    key: 'c-classic', label: 'Classic Center (defense first)', class: 'big', floorSkill: 'id',
    gates: { id: 15, is: 15, rb: 11 },
    targets: { is: 17, id: 16, rb: 12, sb: 8 },
  },
  {
    key: 'c-israeli', label: 'Israeli four-skill Center', class: 'big', floorSkill: 'id',
    gates: { id: 15, is: 15, rb: 11, sb: 8 },
    targets: { is: 19, id: 16, rb: 13, sb: 10 },
  },
  {
    key: 'pf-twoway', label: 'Two-way PF (highest-JS big)', class: 'big', floorSkill: 'id',
    gates: { id: 14, is: 14, rb: 11 },
    targets: { is: 16, id: 15, rb: 12, js: 12 },
  },
  {
    key: 'wing-twoway', label: 'Two-way Wing', class: 'outside', floorSkill: 'od',
    gates: { od: 14 },
    targets: { od: 15, js: 15, ha: 15, dr: 15, is: 12 },
  },
  {
    key: 'wing-inside', label: 'Inside-attacking Wing', class: 'outside', floorSkill: 'od',
    gates: { od: 14 },
    targets: { od: 14, ha: 16, dr: 16, is: 15 },
  },
  {
    key: 'sg-sniper', label: 'Shooting Guard (JS+JR)', class: 'outside', floorSkill: 'od',
    gates: { od: 14 },
    targets: { js: 16, jr: 14, od: 15, ha: 15, dr: 15, pa: 10 },
  },
  {
    key: 'pg-general', label: 'Playmaker (HA/PA/OD)', class: 'outside', floorSkill: 'od',
    gates: { od: 14 },
    targets: { ha: 17, pa: 12, od: 15, js: 13, dr: 16 },
  },
];

export function toSkillTargets(b: StudyBuild): SkillTarget[] {
  const merged: Partial<Record<SkillKey, number>> = { ...b.targets };
  for (const [k, v] of Object.entries(b.gates)) {
    const key = k as SkillKey;
    merged[key] = Math.max(merged[key] ?? 0, v as number);
  }
  return (Object.entries(merged) as Array<[SkillKey, number]>).map(([skill, displayed]) => ({
    skill, displayed,
    priority: skill === b.floorSkill ? 'high' : 'normal',
  }));
}

/** Which gates does a displayed skill vector clear? */
export function gateReport(b: StudyBuild, skills: Record<SkillKey, number>): { passed: string[]; failed: string[] } {
  const passed: string[] = [], failed: string[] = [];
  for (const [k, v] of Object.entries(b.gates)) {
    (skills[k as SkillKey] >= (v as number) ? passed : failed).push(`${k}≥${v}`);
  }
  return { passed, failed };
}
