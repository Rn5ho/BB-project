// Cluster -> lean archetype rules with self-match gating (spec §6).
import type { DefaultArchetype, EvalPlayer, SkillCondition } from '../types';
import { evaluateArchetype } from '../evaluate';
import { SKILL_KEYS, SKILL_DB_NAMES, type SkillKey } from '../../training/types';
import { quantile } from './stats';
import { shapeVector } from './cluster';
import type { CohortPlayer, Group } from './groups';

export interface ClusterProfile {
  group: Group; index: number;
  members: CohortPlayer[];
  centroid: Record<SkillKey, number>;
}
export interface DefenseFloor { field: 'outside_def' | 'inside_def'; skill: 'od' | 'id'; min: number }
export interface DerivedArchetype {
  archetype: DefaultArchetype;
  definers: SkillKey[];
  eliteN: number;
  provisional: boolean;
  selfMatchRate: number;
  relaxed: SkillKey[];
}

const GROUP_POT_FLOOR: Record<Group, number> = { outside: 7, wing: 7, inside: 8, appendix: 7 };

export function defenseFloorFor(
  group: Group, centroid: Record<SkillKey, number>, pgFeederSum = 32,
): DefenseFloor {
  if (group === 'inside') return { field: 'inside_def', skill: 'id', min: 16 };
  if (group === 'outside') {
    const pgShaped = centroid.ha + centroid.dr >= pgFeederSum;
    return { field: 'outside_def', skill: 'od', min: pgShaped ? 14 : 15 };
  }
  // wing: floor on whichever defense the cluster actually carries
  return centroid.od >= centroid.id
    ? { field: 'outside_def', skill: 'od', min: 14 }
    : { field: 'inside_def', skill: 'id', min: 16 };
}

export function eliteMembers(
  members: CohortPlayer[], floor: DefenseFloor, eliteTsp = 100, topShare = 0.3,
): CohortPlayer[] {
  const pass = members.filter((m) => m.skills[floor.skill] >= floor.min);
  const byTsp = pass.filter((m) => m.tsp >= eliteTsp);
  const top = [...pass].sort((a, b) => b.tsp - a.tsp).slice(0, Math.ceil(pass.length * topShare));
  return byTsp.length >= top.length ? byTsp : top;
}

export function toEvalPlayer(p: CohortPlayer): EvalPlayer {
  const skills: Record<string, number | null> = {};
  for (const k of SKILL_KEYS) skills[SKILL_DB_NAMES[k]] = p.skills[k];
  skills.stamina = p.stamina; skills.free_throw = p.freeThrow;
  return { ageNow: 21, skills, potential: p.potential, heightCm: p.heightCm, tsp: p.tsp, bestPosition: null };
}

export function selfMatchRate(members: CohortPlayer[], a: DefaultArchetype): number {
  const eff = { id: a.key, key: a.key, dbId: null, name: a.name, rules: a.rules, source: 'default' as const };
  const hits = members.filter((m) => evaluateArchetype(toEvalPlayer(m), eff).matches).length;
  return members.length === 0 ? 0 : hits / members.length;
}

export function deriveArchetype(
  cluster: ClusterProfile,
  opts: { minEliteForP25?: number; selfMatchMin?: number; definerGap?: number; maxDefiners?: number } = {},
): DerivedArchetype {
  const { minEliteForP25 = 5, selfMatchMin = 0.7, definerGap = 1.5, maxDefiners = 5 } = opts;
  const floor = defenseFloorFor(cluster.group, cluster.centroid);
  const elite = eliteMembers(cluster.members, floor);
  const provisional = elite.length < minEliteForP25;
  const floorPassers = cluster.members.filter((m) => m.skills[floor.skill] >= floor.min);
  const source = provisional
    ? (floorPassers.length >= minEliteForP25 ? floorPassers : cluster.members)
    : elite;
  const q = provisional ? 0.75 : 0.25; // spec: n<5 elite -> cluster p75 fallback, marked provisional

  // Definers come from the ELITE SHAPE (row-centered), not a displayed-level gap vs a
  // group elite mean: shape is quality-independent and still works when a group
  // collapses to k=1 (cluster centroid == pool mean, which is <= any of its own elite
  // subsets' means by construction — a displayed-gap comparison would always be empty).
  const shapeMean: Record<SkillKey, number> = Object.fromEntries(
    SKILL_KEYS.map((k, i) => [
      k,
      source.length
        ? source.reduce((a, m) => a + shapeVector(m.skills)[i], 0) / source.length
        : 0,
    ]),
  ) as Record<SkillKey, number>;
  const definers = SKILL_KEYS
    .filter((k) => k !== floor.skill && shapeMean[k] >= definerGap)
    .sort((a, b) => shapeMean[b] - shapeMean[a])
    .slice(0, maxDefiners);

  const level: Partial<Record<SkillKey, number>> = {};
  for (const k of definers) level[k] = Math.round(quantile(source.map((m) => m.skills[k]), q));

  const key = `mkt72-${cluster.group}-${cluster.index + 1}`;
  const build = (): DefaultArchetype => {
    const conditions: SkillCondition[] = [
      ...definers.map((k) => ({
        kind: 'field' as const, field: SKILL_DB_NAMES[k] as SkillCondition['field'],
        op: '>=' as const, byAge: { 21: level[k]! },
      })),
      { kind: 'field', field: floor.field, op: '>=', byAge: { 21: floor.min } },
      { kind: 'field', field: 'potential', op: '>=', byAge: { 21: GROUP_POT_FLOOR[cluster.group] } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 21: Math.min(...cluster.members.map((m) => m.heightCm)) } },
    ];
    return {
      key, name: `Market: ${cluster.group} #${cluster.index + 1}`,
      description: `Derived from S72 market flood (${cluster.members.length} members, ${elite.length} elite).`,
      rules: { conditions },
    };
  };

  const relaxed: SkillKey[] = [];
  let archetype = build();
  // Gate over `source` — the population the thresholds were fit to — not all cluster
  // members. Floor pass-rate over ALL members is a separate report column (the
  // market's verdict); it is not this gate.
  let rate = selfMatchRate(source, archetype);
  // Relax worst-failing definer p25 -> p10, one at a time, until the gate passes.
  while (rate < selfMatchMin && relaxed.length < definers.length) {
    const failCounts = new Map<SkillKey, number>();
    for (const m of source)
      for (const k of definers)
        if (m.skills[k] < (level[k] ?? 0)) failCounts.set(k, (failCounts.get(k) ?? 0) + 1);
    const worst = [...failCounts.entries()].filter(([k]) => !relaxed.includes(k))
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!worst) break;
    level[worst] = Math.round(quantile(source.map((m) => m.skills[worst]), 0.1));
    relaxed.push(worst);
    archetype = build();
    rate = selfMatchRate(source, archetype);
  }

  return { archetype, definers, eliteN: elite.length, provisional, selfMatchRate: rate, relaxed };
}
