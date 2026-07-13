import { SKILLS, SkillDbKey } from './constants';

/** Sum of all 12 skills; null if any is missing (light snapshot). */
export function tsp(skills: Partial<Record<SkillDbKey, number | null>>): number | null {
  let sum = 0;
  for (const { dbKey } of SKILLS) {
    const v = skills[dbKey];
    if (v == null) return null;
    sum += v;
  }
  return sum;
}

/**
 * Per-skill change between two full-skill records: only non-zero, both-sides-present
 * deltas are returned. Null when either record is missing or nothing changed.
 * BB rule: skills cannot drop before age 35, so negative deltas are snapshot misreads
 * and discarded — except stamina, which really can drift down.
 */
export function computeSkillDeltas(
  latest: Partial<Record<SkillDbKey, number | null>> | null,
  baseline: Partial<Record<SkillDbKey, number | null>> | null,
): Record<string, number> | null {
  if (!latest || !baseline) return null;
  const out: Record<string, number> = {};
  for (const s of SKILLS) {
    const a = latest[s.dbKey];
    const b = baseline[s.dbKey];
    if (a == null || b == null) continue;
    if (a === b) continue;
    if (a < b && s.dbKey !== 'stamina') continue;
    out[s.dbKey] = a - b;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** BB rule: 18yo skills are 1–7, 19yo 1–10, everyone else up to the 20-point scale max. */
export function skillCapForAge(age: number): number {
  if (age <= 18) return 7;
  if (age === 19) return 10;
  return 20;
}

/** Players age +1 per season rollover: age at capture + seasons elapsed. */
export function currentAge(snapshotAge: number | null, snapshotSeason: number | null, currentSeason: number): number | null {
  if (snapshotAge == null || snapshotSeason == null) return null;
  return snapshotAge + (currentSeason - snapshotSeason);
}

export interface SeasonRow { id: number; start: Date; finish: Date | null }

/** Season containing `now`, else the highest-id season (between-season gap). */
export function pickCurrentSeason(seasons: SeasonRow[], now: Date): number {
  if (seasons.length === 0) throw new Error('No seasons provided');
  const active = seasons.find((s) => now >= s.start && (s.finish === null || now <= s.finish));
  if (active) return active.id;
  return Math.max(...seasons.map((s) => s.id));
}
