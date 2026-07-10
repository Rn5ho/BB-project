import type { PlayerListRow } from '@/queries/players';
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
  minDmi: string;
  minSalary: string;
  heightMin: string;
  heightMax: string;
  minGameShape: string;
}

export type Variant = 'slovenia' | 'world';

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_SORT: Record<Variant, SortState> = {
  slovenia: { key: 'tsp', direction: 'desc' },
  world: { key: 'dmi', direction: 'desc' },
};

export const DEFAULT_FILTER: FilterState = {
  name: '',
  ageMin: 18,
  ageMax: 21,
  position: '',
  potMin: 0,
  potMax: 11,
  fullSkillsOnly: false,
  archetype: '',
  minTsp: '',
  minDmi: '',
  minSalary: '',
  heightMin: '',
  heightMax: '',
  minGameShape: '',
};

// ─── Reset detection ─────────────────────────────────────────────────────────

export function isFilterDefault(f: FilterState): boolean {
  return (
    f.name === DEFAULT_FILTER.name &&
    f.ageMin === DEFAULT_FILTER.ageMin &&
    f.ageMax === DEFAULT_FILTER.ageMax &&
    f.position === DEFAULT_FILTER.position &&
    f.potMin === DEFAULT_FILTER.potMin &&
    f.potMax === DEFAULT_FILTER.potMax &&
    f.fullSkillsOnly === DEFAULT_FILTER.fullSkillsOnly &&
    f.archetype === DEFAULT_FILTER.archetype &&
    f.minTsp === DEFAULT_FILTER.minTsp &&
    f.minDmi === DEFAULT_FILTER.minDmi &&
    f.minSalary === DEFAULT_FILTER.minSalary &&
    f.heightMin === DEFAULT_FILTER.heightMin &&
    f.heightMax === DEFAULT_FILTER.heightMax &&
    f.minGameShape === DEFAULT_FILTER.minGameShape
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
  const minDmi = parseNum(f.minDmi);
  const minSalary = parseNum(f.minSalary);
  const heightMin = parseNum(f.heightMin);
  const heightMax = parseNum(f.heightMax);
  const minGameShape = parseNum(f.minGameShape);

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

    // Min TSP — null fails if filter is set
    if (minTsp !== null) {
      if (p.tsp == null || p.tsp < minTsp) return false;
    }

    // Min DMI — null fails if filter is set
    if (minDmi !== null) {
      if (p.dmi == null || p.dmi < minDmi) return false;
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
 * page-provided default (which differs per variant: true for Slovenia, false for World).
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
