// Cohort grouping for the market-archetypes analysis (spec §3).
import type { SkillKey } from '../../training/types';

export interface CohortPlayer {
  playerId: number; name: string; heightCm: number; potential: number;
  salary: number | null; startingPrice: number | null;
  ownerTeamName: string | null; nationality: string | null;
  skills: Record<SkillKey, number>; // displayed ints 1..20
  stamina: number | null; freeThrow: number | null;
  tsp: number; // 10-skill sum
}

export type Group = 'outside' | 'inside' | 'wing' | 'appendix';

const OSP_KEYS: SkillKey[] = ['js', 'jr', 'od', 'ha', 'dr', 'pa'];
const ISP_KEYS: SkillKey[] = ['is', 'id', 'rb', 'sb'];

export function osp(s: Record<SkillKey, number>): number {
  return OSP_KEYS.reduce((a, k) => a + s[k], 0);
}
export function isp(s: Record<SkillKey, number>): number {
  return ISP_KEYS.reduce((a, k) => a + s[k], 0);
}
/** b = mean(outside skills) − mean(inside skills); raw OSP>ISP is 6:4 biased. */
export function balance(s: Record<SkillKey, number>): number {
  return osp(s) / 6 - isp(s) / 4;
}

export function assignGroup(p: CohortPlayer, delta = 1.0): Group {
  const b = balance(p.skills);
  if (b >= delta && p.heightCm <= 201) return 'outside';
  if (b <= -delta && p.heightCm >= 203) return 'inside';
  if (b <= -delta && p.heightCm <= 201) return 'appendix'; // short inside-leaning (rare)
  return 'wing';
}
