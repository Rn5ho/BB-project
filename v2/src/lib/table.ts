import type { PlayerListRow } from '@/queries/players';
import { SKILLS, type SkillDbKey } from '@/lib/constants';
export type { PlayerListRow };

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export type SortKey =
  | 'name'
  | 'nationality'
  | 'ageNow'
  | 'bestPosition'
  | 'heightCm'
  | 'potential'
  | 'salary'
  | 'dmi'
  | 'gameShape'
  | 'tsp'
  | 'tspDelta'
  | 'insideTsp'
  | 'outsideTsp'
  | 'jump_shot'
  | 'jump_range'
  | 'outside_def'
  | 'handling'
  | 'driving'
  | 'passing'
  | 'inside_shot'
  | 'inside_def'
  | 'rebounding'
  | 'shot_blocking'
  | 'stamina'
  | 'free_throw';

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export interface FilterState {
  name: string;
  ageMin: number;
  ageMax: number;
  position: string; // '' = All
  potMin: number;
  potMax: number;
  fullSkillsOnly: boolean;
  archetype: string; // '' = All; filtering happens in PlayerTable where match results are available, not here
  // "More" panel
  minTsp: string;   // empty string = inactive
  maxTsp: string;
  minDmi: string;
  maxDmi: string;
  minInsideTsp: string;
  maxInsideTsp: string;
  minOutsideTsp: string;
  maxOutsideTsp: string;
  minSalary: string;
  heightMin: string;
  heightMax: string;
  minGameShape: string;
  discoveredWithinDays: string; // '' = Any; '1' | '7' | '30'
  skillMins: SkillMins; // per-skill minimums; empty string / absent = inactive
}

export type SkillMins = Partial<Record<SkillDbKey, string>>;

export function countActiveSkillMins(mins: SkillMins): number {
  return Object.values(mins).filter((v) => v != null && v.trim() !== '').length;
}

/** Every string filter that lives in the collapsed "More" panel — drives the More
 *  button's active indicator and isFilterDefault. Update when the panel changes. */
export const MORE_PANEL_FIELDS = [
  'minTsp', 'maxTsp', 'minDmi', 'maxDmi',
  'minInsideTsp', 'maxInsideTsp', 'minOutsideTsp', 'maxOutsideTsp',
  'minSalary', 'heightMin', 'heightMax', 'minGameShape',
] as const;

export function countActiveMoreFilters(f: FilterState): number {
  return MORE_PANEL_FIELDS.filter((k) => f[k].trim() !== '').length;
}

export type Variant = 'slovenia' | 'world' | 'seniors';

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_SORT: Record<Variant, SortState> = {
  slovenia: { key: 'tsp', direction: 'desc' },
  world: { key: 'dmi', direction: 'desc' },
  seniors: { key: 'tsp', direction: 'desc' },
};

// Shared base — variants only diverge on the default age window.
const BASE_FILTER: FilterState = {
  name: '',
  ageMin: 18,
  ageMax: 21,
  position: '',
  potMin: 0,
  potMax: 11,
  fullSkillsOnly: false,
  archetype: '',
  minTsp: '',
  maxTsp: '',
  minDmi: '',
  maxDmi: '',
  minInsideTsp: '',
  maxInsideTsp: '',
  minOutsideTsp: '',
  maxOutsideTsp: '',
  minSalary: '',
  heightMin: '',
  heightMax: '',
  minGameShape: '',
  discoveredWithinDays: '',
  skillMins: {},
};

// Per-variant filter defaults (compile-enforced like DEFAULT_SORT): the U-21 pages
// default to 18–21, the seniors page to its 22+ market-sweep universe.
export const DEFAULT_FILTER: Record<Variant, FilterState> = {
  slovenia: BASE_FILTER,
  world: BASE_FILTER,
  seniors: { ...BASE_FILTER, ageMin: 22, ageMax: 45 },
};

// ─── Reset detection ─────────────────────────────────────────────────────────

export function isFilterDefault(f: FilterState, variant: Variant): boolean {
  const d = DEFAULT_FILTER[variant];
  return (
    f.name === d.name &&
    f.ageMin === d.ageMin &&
    f.ageMax === d.ageMax &&
    f.position === d.position &&
    f.potMin === d.potMin &&
    f.potMax === d.potMax &&
    f.fullSkillsOnly === d.fullSkillsOnly &&
    f.archetype === d.archetype &&
    countActiveMoreFilters(f) === 0 &&
    f.discoveredWithinDays === d.discoveredWithinDays &&
    countActiveSkillMins(f.skillMins) === 0
  );
}

// NOTE: archetype filtering is intentionally NOT in filterRows. It requires
// archetypeMatches (computed per-player in the page/component), which are not
// available here. Apply it in PlayerTable after calling filterRows.

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

// ─── Filter predicate ─────────────────────────────────────────────────────────

export function filterRows(rows: PlayerListRow[], f: FilterState): PlayerListRow[] {
  const nameNorm = normalize(f.name);
  const minTsp = parseNum(f.minTsp);
  const maxTsp = parseNum(f.maxTsp);
  const minDmi = parseNum(f.minDmi);
  const maxDmi = parseNum(f.maxDmi);
  const minInside = parseNum(f.minInsideTsp);
  const maxInside = parseNum(f.maxInsideTsp);
  const minOutside = parseNum(f.minOutsideTsp);
  const maxOutside = parseNum(f.maxOutsideTsp);
  const minSalary = parseNum(f.minSalary);
  const heightMin = parseNum(f.heightMin);
  const heightMax = parseNum(f.heightMax);
  const minGameShape = parseNum(f.minGameShape);
  const discoveredDays = parseNum(f.discoveredWithinDays);
  const discoveredCutoff = discoveredDays != null
    ? new Date(Date.now() - discoveredDays * 86_400_000)
    : null;
  const activeSkillMins: [SkillDbKey, number][] = [];
  for (const s of SKILLS) {
    const min = parseNum(f.skillMins[s.dbKey] ?? '');
    if (min !== null) activeSkillMins.push([s.dbKey, min]);
  }

  return rows.filter((p) => {
    // Name search (diacritic-insensitive)
    if (nameNorm && !normalize(p.name).includes(nameNorm)) return false;

    // Age filter — nulls PASS
    if (p.ageNow != null) {
      if (p.ageNow < f.ageMin || p.ageNow > f.ageMax) return false;
    }

    // Position
    if (f.position && p.bestPosition !== f.position) return false;

    // Potential min/max — nulls fail if range is tighter than default
    if (f.potMin > 0 || f.potMax < 11) {
      if (p.potential == null) return false;
      if (p.potential < f.potMin || p.potential > f.potMax) return false;
    }

    // Full skills only
    if (f.fullSkillsOnly && !p.hasFullSkills) return false;

    // TSP band — null fails if either bound is set
    if (minTsp !== null || maxTsp !== null) {
      if (p.tsp == null) return false;
      if (minTsp !== null && p.tsp < minTsp) return false;
      if (maxTsp !== null && p.tsp > maxTsp) return false;
    }

    // DMI band — null fails if either bound is set
    if (minDmi !== null || maxDmi !== null) {
      if (p.dmi == null) return false;
      if (minDmi !== null && p.dmi < minDmi) return false;
      if (maxDmi !== null && p.dmi > maxDmi) return false;
    }

    // Inside TSP band — null fails if either bound is set
    if (minInside !== null || maxInside !== null) {
      if (p.insideTsp == null) return false;
      if (minInside !== null && p.insideTsp < minInside) return false;
      if (maxInside !== null && p.insideTsp > maxInside) return false;
    }

    // Outside TSP band — null fails if either bound is set
    if (minOutside !== null || maxOutside !== null) {
      if (p.outsideTsp == null) return false;
      if (minOutside !== null && p.outsideTsp < minOutside) return false;
      if (maxOutside !== null && p.outsideTsp > maxOutside) return false;
    }

    // Min Salary — null fails if filter is set
    if (minSalary !== null) {
      if (p.salary == null || p.salary < minSalary) return false;
    }

    // Height min/max — null fails if filter is set
    if (heightMin !== null) {
      if (p.heightCm == null || p.heightCm < heightMin) return false;
    }
    if (heightMax !== null) {
      if (p.heightCm == null || p.heightCm > heightMax) return false;
    }

    // Min game shape — null fails if filter is set
    if (minGameShape !== null) {
      if (p.gameShape == null || p.gameShape < minGameShape) return false;
    }

    // Discovered within N days — null firstSeenAt fails when filter is active
    if (discoveredCutoff !== null) {
      if (p.firstSeenAt == null || p.firstSeenAt < discoveredCutoff) return false;
    }

    // Skill minimums — null/missing skill fails when that filter is set
    for (const [key, min] of activeSkillMins) {
      const v = p.skills?.[key] ?? null;
      if (v == null || v < min) return false;
    }

    return true;
  });
}

// ─── Sort ────────────────────────────────────────────────────────────────────

/**
 * Get the raw value for a sort key from a row.
 * Skill keys are looked up in p.skills.
 */
function getValue(p: PlayerListRow, key: SortKey): string | number | null {
  switch (key) {
    case 'name':        return p.name;
    case 'nationality': return p.nationality;
    case 'ageNow':      return p.ageNow;
    case 'bestPosition':return p.bestPosition;
    case 'heightCm':    return p.heightCm;
    case 'potential':   return p.potential;
    case 'salary':      return p.salary;
    case 'dmi':         return p.dmi;
    case 'gameShape':   return p.gameShape;
    case 'tsp':         return p.tsp;
    case 'tspDelta':    return p.tspDelta;
    case 'insideTsp':   return p.insideTsp;
    case 'outsideTsp':  return p.outsideTsp;
    default:
      // skill key
      return p.skills?.[key] ?? null;
  }
}

export function sortRows(rows: PlayerListRow[], sort: SortState): PlayerListRow[] {
  const { key, direction } = sort;
  const asc = direction === 'asc';

  return [...rows].sort((a, b) => {
    const av = getValue(a, key);
    const bv = getValue(b, key);

    // Nulls always sink to bottom regardless of direction
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    let cmp: number;
    if (typeof av === 'string' && typeof bv === 'string') {
      cmp = av.localeCompare(bv);
    } else {
      cmp = (av as number) - (bv as number);
    }

    return asc ? cmp : -cmp;
  });
}

// ─── showSkills sanitizer ─────────────────────────────────────────────────────

/**
 * Sanitize a `showSkills` value from a stored blob.
 * Returns the stored value if it's a boolean, otherwise falls back to the
 * page-provided default (which differs per variant: true for Slovenia and Seniors, false for World).
 */
export function sanitizeShowSkills(stored: boolean | undefined, pageDefault: boolean): boolean {
  if (typeof stored === 'boolean') return stored;
  return pageDefault;
}

// ─── Cycle sort direction ─────────────────────────────────────────────────────

/**
 * Clicking a column:
 * - If it's not the active key → go desc (max first)
 * - If already active desc → go asc
 * - If already active asc → stay asc (or could toggle back, but spec says first=desc, second=asc)
 */
export function nextSortState(current: SortState, clickedKey: SortKey): SortState {
  if (current.key !== clickedKey) {
    return { key: clickedKey, direction: 'desc' };
  }
  // Same key: toggle
  return { key: clickedKey, direction: current.direction === 'desc' ? 'asc' : 'desc' };
}
