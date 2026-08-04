# Filter Max Bounds + Inside/Outside TSP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Max bounds for the TSP/DMI filters plus Inside TSP and Outside TSP as sortable, filterable, always-visible columns on the Slovenia and World player tables.

**Architecture:** Derive inside/outside TSP at read time from the per-skill columns already on each row (no schema change). New pure helpers in `lib/domain.ts` feed the row mapper in `queries/players.ts`; filtering/sorting stays fully client-side in `lib/table.ts`; UI changes confined to `FilterBar.tsx` and `PlayerTable.tsx`. The row mapper also starts deriving the displayed TSP from the skills (stored fallback) so TSP, In, and Out always agree — legacy v1-migrated rows carry 12-skill or partial stored sums.

**Tech Stack:** Next.js 16 (app router), TypeScript, vitest, Tailwind classes inline, Neon Postgres via drizzle (untouched here).

**Spec:** `docs/superpowers/specs/2026-08-04-filter-maxes-inside-outside-tsp-design.md`

## Global Constraints

- Repo root `C:\ClaudeProjects\BB-project`; all npm commands run from `v2/` (`npm test` = `vitest run`, `npm run lint`, `npm run build`, `npm run e2e`).
- Table header labels for the new columns are exactly `In` and `Out` — they must NOT contain the substring "TSP" (`scripts/e2e-smoke.mts:221` locates `th:has-text("TSP")` in Playwright strict mode).
- The new columns insert AFTER the TSP column so TSP stays at td index 8 (`e2e-smoke.mts:197` `TSP_COL_IDX = 8`).
- In/Out columns render unconditionally like TSP (NOT gated behind the Skills toggle); on Slovenia they sit between TSP and Δ.
- Outside skills: `jump_shot, jump_range, outside_def, handling, driving, passing`. Inside skills: `inside_shot, inside_def, rebounding, shot_blocking`.
- `tsp()` in `lib/domain.ts` (12-skill training sum) must NOT be modified or used by the new code paths.
- No database schema changes.
- Filter convention: string fields, `''` = inactive; when any bound on a metric is set, rows with a null value for that metric fail.
- Commit after every task; conventional-commit style messages, each ending with the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.

---

### Task 1: Domain helpers — inside/outside sums + row-TSP derivation

**Files:**
- Modify: `v2/src/lib/domain.ts` (append after `tsp()`, i.e. after line 12)
- Modify: `v2/src/lib/archetypes/derive/groups.ts:15-16` (export two consts)
- Test: `v2/src/lib/domain.test.ts` (append)

**Interfaces:**
- Consumes: `SKILLS`, `SkillDbKey` from `./constants`; `SKILL_DB_NAMES` from `./training/types`; `OSP_KEYS`/`ISP_KEYS` from `./archetypes/derive/groups` (exported in this task).
- Produces (used by Tasks 2, 5):
  - `export const OUTSIDE_SKILL_KEYS: readonly SkillDbKey[]`
  - `export const INSIDE_SKILL_KEYS: readonly SkillDbKey[]`
  - `export function outsideTsp(skills: Partial<Record<SkillDbKey, number | null>>): number | null`
  - `export function insideTsp(skills: Partial<Record<SkillDbKey, number | null>>): number | null`
  - `export function deriveRowTsp(stored: number | null, inside: number | null, outside: number | null): number | null`

- [x] **Step 1: Export the archetype partition keys**

In `v2/src/lib/archetypes/derive/groups.ts`, change lines 15-16 from `const OSP_KEYS ...` / `const ISP_KEYS ...` to:

```ts
export const OSP_KEYS: SkillKey[] = ['js', 'jr', 'od', 'ha', 'dr', 'pa'];
export const ISP_KEYS: SkillKey[] = ['is', 'id', 'rb', 'sb'];
```

- [x] **Step 2: Write the failing tests**

Append to `v2/src/lib/domain.test.ts` (it already imports from `./domain` — extend that import with `insideTsp, outsideTsp, deriveRowTsp, INSIDE_SKILL_KEYS, OUTSIDE_SKILL_KEYS`; `tsp` is already imported):

```ts
import { SKILL_DB_NAMES } from './training/types';
import { OSP_KEYS, ISP_KEYS } from './archetypes/derive/groups';

const FULL = {
  jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8,
  inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3,
};

describe('insideTsp / outsideTsp', () => {
  it('sums the 6 outside skills', () => expect(outsideTsp(FULL)).toBe(69));
  it('sums the 4 inside skills', () => expect(insideTsp(FULL)).toBe(21));
  it('null-propagates per component', () => {
    expect(outsideTsp({ ...FULL, passing: null })).toBeNull();
    expect(insideTsp({ ...FULL, passing: null })).toBe(21); // outside gap doesn't hurt inside
    expect(insideTsp({ ...FULL, rebounding: null })).toBeNull();
    expect(outsideTsp({})).toBeNull();
    expect(insideTsp({})).toBeNull();
  });
  it('in + out equals the hand-computed 10-skill sum, NOT the 12-skill tsp()', () => {
    expect(insideTsp(FULL)! + outsideTsp(FULL)!).toBe(90); // 98 minus stamina 5 minus FT 3
    expect(insideTsp(FULL)! + outsideTsp(FULL)!).not.toBe(tsp(FULL));
  });
  it('partition matches the archetype OSP/ISP grouping', () => {
    expect(new Set(OSP_KEYS.map((k) => SKILL_DB_NAMES[k]))).toEqual(new Set(OUTSIDE_SKILL_KEYS));
    expect(new Set(ISP_KEYS.map((k) => SKILL_DB_NAMES[k]))).toEqual(new Set(INSIDE_SKILL_KEYS));
  });
});

describe('deriveRowTsp', () => {
  it('prefers the computed 10-skill sum over legacy stored values', () => {
    expect(deriveRowTsp(98, 21, 69)).toBe(90);
  });
  it('falls back to stored when either component is null', () => {
    expect(deriveRowTsp(95, null, 69)).toBe(95);
    expect(deriveRowTsp(95, 21, null)).toBe(95);
    expect(deriveRowTsp(95, null, null)).toBe(95);
  });
  it('null when neither derivable nor stored', () => {
    expect(deriveRowTsp(null, null, null)).toBeNull();
  });
});
```

- [x] **Step 3: Run tests to verify they fail**

Run: `cd v2 && npm test -- src/lib/domain.test.ts`
Expected: FAIL — `insideTsp` etc. are not exported.

- [x] **Step 4: Implement the helpers**

Append to `v2/src/lib/domain.ts` after the `tsp()` function (line 12):

```ts
/**
 * Inside/outside partition of BB's 10-rate-skill TSP (never stamina/free throw).
 * Same partition as OSP_KEYS/ISP_KEYS in archetypes/derive/groups.ts (cross-checked in tests).
 * NOTE: insideTsp(s) + outsideTsp(s) is the 10-skill market TSP — NOT tsp(s) above,
 * which is the 12-skill training sum (off by stamina + free throw).
 */
export const OUTSIDE_SKILL_KEYS: readonly SkillDbKey[] = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing'];
export const INSIDE_SKILL_KEYS: readonly SkillDbKey[] = ['inside_shot', 'inside_def', 'rebounding', 'shot_blocking'];

function sumKeys(skills: Partial<Record<SkillDbKey, number | null>>, keys: readonly SkillDbKey[]): number | null {
  let sum = 0;
  for (const k of keys) {
    const v = skills[k];
    if (v == null) return null;
    sum += v;
  }
  return sum;
}

export function outsideTsp(skills: Partial<Record<SkillDbKey, number | null>>): number | null {
  return sumKeys(skills, OUTSIDE_SKILL_KEYS);
}

export function insideTsp(skills: Partial<Record<SkillDbKey, number | null>>): number | null {
  return sumKeys(skills, INSIDE_SKILL_KEYS);
}

/**
 * List-row TSP: the computed 10-skill sum when all components are present (self-heals
 * legacy v1 stored values that were 12-skill or partial sums), else the stored snapshot tsp.
 */
export function deriveRowTsp(stored: number | null, inside: number | null, outside: number | null): number | null {
  if (inside != null && outside != null) return inside + outside;
  return stored;
}
```

- [x] **Step 5: Run tests to verify they pass**

Run: `cd v2 && npm test -- src/lib/domain.test.ts`
Expected: PASS (all new + existing).

- [x] **Step 6: Commit**

```bash
git add v2/src/lib/domain.ts v2/src/lib/domain.test.ts v2/src/lib/archetypes/derive/groups.ts
git commit -m "feat(v2): insideTsp/outsideTsp helpers + deriveRowTsp"
```

---

### Task 2: Row shape — expose insideTsp/outsideTsp, derive row TSP

**Files:**
- Modify: `v2/src/queries/players.ts` (interface ~line 20, mapper ~lines 151-199)
- Modify: `v2/src/lib/table.test.ts:18-48` (`makePlayer` fixture — compile-time requirement)

**Interfaces:**
- Consumes: `insideTsp`, `outsideTsp`, `deriveRowTsp` from `@/lib/domain` (Task 1).
- Produces (used by Tasks 3, 5): `PlayerListRow.insideTsp: number | null`, `PlayerListRow.outsideTsp: number | null`; `PlayerListRow.tsp` is now derived-preferring-computed.

- [x] **Step 1: Extend the interface**

In `v2/src/queries/players.ts`, after the `tsp: number | null;` line (~line 20):

```ts
  tsp: number | null;
  insideTsp: number | null;  // IS+ID+RB+SB from latest full snapshot; null if any component missing
  outsideTsp: number | null; // JS+JR+OD+HA+DR+PA; null if any component missing
```

- [x] **Step 2: Extend the domain import**

The file imports from `@/lib/domain` already (`currentAge`, `computeSkillDeltas`, …). Add `insideTsp`, `outsideTsp`, `deriveRowTsp` to that import. Because the local mapper variables would shadow the function names, alias in the import:

```ts
import { computeSkillDeltas, currentAge, insideTsp as computeInsideTsp, outsideTsp as computeOutsideTsp, deriveRowTsp } from '@/lib/domain';
```

(Match whatever names the existing import line actually has — only ADD the three new ones.)

- [x] **Step 3: Compute in the mapper**

In the `.map((r) => {` body, after the `skills` object is built (~line 161) add:

```ts
    const inTsp = skills ? computeInsideTsp(skills) : null;
    const outTsp = skills ? computeOutsideTsp(skills) : null;
```

and in the returned object replace `tsp: r.tsp as number | null,` with:

```ts
      tsp: deriveRowTsp(r.tsp as number | null, inTsp, outTsp),
      insideTsp: inTsp,
      outsideTsp: outTsp,
```

- [x] **Step 4: Fix the test fixture (compile-time)**

In `v2/src/lib/table.test.ts` `makePlayer`, after `tsp: 100,` add:

```ts
    insideTsp: null,
    outsideTsp: null,
```

- [x] **Step 5: Type-check and run the full suite**

Run: `cd v2 && npx tsc --noEmit && npm test`
Expected: clean compile, all tests PASS.

- [x] **Step 6: Commit**

```bash
git add v2/src/queries/players.ts v2/src/lib/table.test.ts
git commit -m "feat(v2): insideTsp/outsideTsp on PlayerListRow; derive row TSP from skills"
```

---

### Task 3: Filter/sort logic in lib/table.ts

**Files:**
- Modify: `v2/src/lib/table.ts`
- Test: `v2/src/lib/table.test.ts` (append)

**Interfaces:**
- Consumes: `PlayerListRow.insideTsp/outsideTsp` (Task 2).
- Produces (used by Task 4, 5):
  - `FilterState` gains `maxTsp, maxDmi, minInsideTsp, maxInsideTsp, minOutsideTsp, maxOutsideTsp` (all `string`, `''` = inactive)
  - `SortKey` gains `'insideTsp' | 'outsideTsp'`
  - `export const MORE_PANEL_FIELDS` and `export function countActiveMoreFilters(f: FilterState): number`

- [x] **Step 1: Write the failing tests**

Append to `v2/src/lib/table.test.ts` (extend the top import with `countActiveMoreFilters` — note it's a NEW export, and `filterRows`, `sortRows`, `isFilterDefault`, `DEFAULT_FILTER`, `makePlayer` already exist in the file):

```ts
describe('max bounds + inside/outside filters', () => {
  it('maxTsp excludes rows above the bound and null-tsp rows', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: 80 }),
      makePlayer({ bbPlayerId: 2, tsp: 120 }),
      makePlayer({ bbPlayerId: 3, tsp: null }),
    ];
    const out = filterRows(rows, { ...DEFAULT_FILTER, maxTsp: '100' });
    expect(out.map((r) => r.bbPlayerId)).toEqual([1]);
  });
  it('min+max TSP form a band', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tsp: 50 }),
      makePlayer({ bbPlayerId: 2, tsp: 90 }),
      makePlayer({ bbPlayerId: 3, tsp: 130 }),
    ];
    const out = filterRows(rows, { ...DEFAULT_FILTER, minTsp: '60', maxTsp: '100' });
    expect(out.map((r) => r.bbPlayerId)).toEqual([2]);
  });
  it('maxDmi excludes rows above the bound and null-dmi rows', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, dmi: 5000 }),
      makePlayer({ bbPlayerId: 2, dmi: 20000 }),
      makePlayer({ bbPlayerId: 3, dmi: null }),
    ];
    const out = filterRows(rows, { ...DEFAULT_FILTER, maxDmi: '10000' });
    expect(out.map((r) => r.bbPlayerId)).toEqual([1]);
  });
  it('inside TSP min/max; nulls fail when a bound is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, insideTsp: 20 }),
      makePlayer({ bbPlayerId: 2, insideTsp: 45 }),
      makePlayer({ bbPlayerId: 3, insideTsp: null }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER, minInsideTsp: '30' }).map((r) => r.bbPlayerId)).toEqual([2]);
    expect(filterRows(rows, { ...DEFAULT_FILTER, maxInsideTsp: '30' }).map((r) => r.bbPlayerId)).toEqual([1]);
  });
  it('outside TSP min/max; nulls fail when a bound is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, outsideTsp: 40 }),
      makePlayer({ bbPlayerId: 2, outsideTsp: 70 }),
      makePlayer({ bbPlayerId: 3, outsideTsp: null }),
    ];
    expect(filterRows(rows, { ...DEFAULT_FILTER, minOutsideTsp: '50' }).map((r) => r.bbPlayerId)).toEqual([2]);
    expect(filterRows(rows, { ...DEFAULT_FILTER, maxOutsideTsp: '50' }).map((r) => r.bbPlayerId)).toEqual([1]);
  });
});

describe('inside/outside sort keys', () => {
  it('sorts insideTsp desc with nulls last', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, insideTsp: null }),
      makePlayer({ bbPlayerId: 2, insideTsp: 30 }),
      makePlayer({ bbPlayerId: 3, insideTsp: 50 }),
    ];
    const sorted = sortRows(rows, { key: 'insideTsp', direction: 'desc' });
    expect(sorted.map((r) => r.bbPlayerId)).toEqual([3, 2, 1]);
  });
  it('sorts outsideTsp asc with nulls last', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, outsideTsp: 70 }),
      makePlayer({ bbPlayerId: 2, outsideTsp: null }),
      makePlayer({ bbPlayerId: 3, outsideTsp: 40 }),
    ];
    const sorted = sortRows(rows, { key: 'outsideTsp', direction: 'asc' });
    expect(sorted.map((r) => r.bbPlayerId)).toEqual([3, 1, 2]);
  });
});

describe('countActiveMoreFilters', () => {
  it('is 0 on defaults', () => expect(countActiveMoreFilters(DEFAULT_FILTER)).toBe(0));
  it('counts each non-empty More-panel field', () => {
    expect(countActiveMoreFilters({ ...DEFAULT_FILTER, maxTsp: '100', heightMin: '190' })).toBe(2);
    expect(countActiveMoreFilters({ ...DEFAULT_FILTER, minOutsideTsp: '50' })).toBe(1);
  });
  it('ignores whitespace-only values', () => {
    expect(countActiveMoreFilters({ ...DEFAULT_FILTER, minDmi: '  ' })).toBe(0);
  });
});

describe('isFilterDefault with new fields', () => {
  it('is false when any new bound is set', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER, maxTsp: '100' })).toBe(false);
    expect(isFilterDefault({ ...DEFAULT_FILTER, maxDmi: '9' })).toBe(false);
    expect(isFilterDefault({ ...DEFAULT_FILTER, minInsideTsp: '1' })).toBe(false);
    expect(isFilterDefault({ ...DEFAULT_FILTER, maxOutsideTsp: '1' })).toBe(false);
  });
  it('is true on defaults', () => expect(isFilterDefault(DEFAULT_FILTER)).toBe(true));
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd v2 && npm test -- src/lib/table.test.ts`
Expected: FAIL — new FilterState fields / `countActiveMoreFilters` don't exist. (TS errors surface as vitest transform errors here; that counts as the failing state.)

- [x] **Step 3: Implement in `v2/src/lib/table.ts`**

3a. `SortKey` union (line 9-32): after `| 'tspDelta'` add:

```ts
  | 'insideTsp'
  | 'outsideTsp'
```

3b. `FilterState` (line 39-57): replace the two lines `minTsp: string;` / `minDmi: string;` with:

```ts
  minTsp: string;   // empty string = inactive
  maxTsp: string;
  minDmi: string;
  maxDmi: string;
  minInsideTsp: string;
  maxInsideTsp: string;
  minOutsideTsp: string;
  maxOutsideTsp: string;
```

3c. `DEFAULT_FILTER` (line 74-91): after `minTsp: '',` / `minDmi: '',` entries make the block:

```ts
  minTsp: '',
  maxTsp: '',
  minDmi: '',
  maxDmi: '',
  minInsideTsp: '',
  maxInsideTsp: '',
  minOutsideTsp: '',
  maxOutsideTsp: '',
```

3d. Add the More-panel registry right after `countActiveSkillMins` (line 63):

```ts
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
```

3e. `isFilterDefault` (line 95-114): replace the six lines comparing `minTsp`, `minDmi`, `minSalary`, `heightMin`, `heightMax`, `minGameShape` with a single:

```ts
    countActiveMoreFilters(f) === 0 &&
```

(keep the `name/age/position/pot/fullSkillsOnly/archetype/discoveredWithinDays/skillMins` comparisons as they are).

3f. `filterRows` (line 137-217): next to the existing `const minTsp = parseNum(f.minTsp);` block add:

```ts
  const maxTsp = parseNum(f.maxTsp);
  const maxDmi = parseNum(f.maxDmi);
  const minInside = parseNum(f.minInsideTsp);
  const maxInside = parseNum(f.maxInsideTsp);
  const minOutside = parseNum(f.minOutsideTsp);
  const maxOutside = parseNum(f.maxOutsideTsp);
```

Replace the "Min TSP" and "Min DMI" predicates with banded versions, and add In/Out bands after them:

```ts
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
```

3g. `getValue` (line 225-242): after `case 'tspDelta':` add:

```ts
    case 'insideTsp':   return p.insideTsp;
    case 'outsideTsp':  return p.outsideTsp;
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd v2 && npm test -- src/lib/table.test.ts`
Expected: PASS (new and existing — existing min-only tests must still pass unchanged).

- [x] **Step 5: Commit**

```bash
git add v2/src/lib/table.ts v2/src/lib/table.test.ts
git commit -m "feat(v2): TSP/DMI max bounds + inside/outside TSP filter and sort"
```

---

### Task 4: FilterBar — range pairs + More-button indicator

**Files:**
- Modify: `v2/src/components/FilterBar.tsx`

**Interfaces:**
- Consumes: `FilterState` fields and `countActiveMoreFilters` from `@/lib/table` (Task 3).
- Produces: UI only; no new exports.

- [x] **Step 1: Import and compute the active count**

Extend the `@/lib/table` import (line 5) with `countActiveMoreFilters`. Next to `const activeSkillCount = ...` (line 21) add:

```ts
  const activeMoreCount = countActiveMoreFilters(filter);
```

- [x] **Step 2: More button active indicator**

Replace the More toggle button (lines 195-202) with the same active styling the Skill-filters button uses:

```tsx
        {/* More toggle */}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={`ml-1 px-2 py-0.5 rounded border text-sm ${
            activeMoreCount > 0
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-neutral-700 text-neutral-400 hover:text-white'
          }`}
        >
          More{activeMoreCount > 0 ? ` (${activeMoreCount})` : ''} {moreOpen ? '▲' : '▾'}
        </button>
```

- [x] **Step 3: Add a RangeInput component**

Below the existing `NumInput` component (line 288-309) add:

```tsx
function RangeInput({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
}) {
  const cls = 'bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white w-16 text-right focus:outline-none focus:border-amber-500';
  return (
    <div className="flex items-center gap-1 text-neutral-400">
      <span>{label}</span>
      <input type="number" placeholder="min" value={minValue} onChange={(e) => onMinChange(e.target.value)} className={cls} />
      <span>–</span>
      <input type="number" placeholder="max" value={maxValue} onChange={(e) => onMaxChange(e.target.value)} className={cls} />
    </div>
  );
}
```

- [x] **Step 4: Rebuild the More row**

Replace the More-row contents (lines 230-255) with — note the inline height pair collapses into `RangeInput`, behavior identical:

```tsx
      {moreOpen && (
        <div className="flex flex-wrap items-center gap-2 text-sm border-t border-neutral-800 pt-2">
          <RangeInput label="TSP" minValue={filter.minTsp} maxValue={filter.maxTsp} onMinChange={(v) => set('minTsp', v)} onMaxChange={(v) => set('maxTsp', v)} />
          <RangeInput label="In TSP" minValue={filter.minInsideTsp} maxValue={filter.maxInsideTsp} onMinChange={(v) => set('minInsideTsp', v)} onMaxChange={(v) => set('maxInsideTsp', v)} />
          <RangeInput label="Out TSP" minValue={filter.minOutsideTsp} maxValue={filter.maxOutsideTsp} onMinChange={(v) => set('minOutsideTsp', v)} onMaxChange={(v) => set('maxOutsideTsp', v)} />
          <RangeInput label="DMI" minValue={filter.minDmi} maxValue={filter.maxDmi} onMinChange={(v) => set('minDmi', v)} onMaxChange={(v) => set('maxDmi', v)} />
          <NumInput label="Min salary" value={filter.minSalary} onChange={(v) => set('minSalary', v)} />
          <RangeInput label="Height cm" minValue={filter.heightMin} maxValue={filter.heightMax} onMinChange={(v) => set('heightMin', v)} onMaxChange={(v) => set('heightMax', v)} />
          <NumInput label="Min GS" value={filter.minGameShape} onChange={(v) => set('minGameShape', v)} />
        </div>
      )}
```

- [x] **Step 5: Verify**

Run: `cd v2 && npx tsc --noEmit && npm test && npm run lint`
Expected: clean.

- [x] **Step 6: Commit**

```bash
git add v2/src/components/FilterBar.tsx
git commit -m "feat(v2): range filter inputs for TSP/In/Out/DMI + More-button active indicator"
```

---

### Task 5: PlayerTable — In/Out columns

**Files:**
- Modify: `v2/src/components/PlayerTable.tsx` (headers ~line 176, cells ~line 236, colSpan line 272)
- Modify: `v2/scripts/e2e-smoke.mts:196` (stale comment only)

**Interfaces:**
- Consumes: `PlayerListRow.insideTsp/outsideTsp` (Task 2), `SortKey` values `'insideTsp'/'outsideTsp'` (Task 3), `INSIDE_SKILL_KEYS`/`OUTSIDE_SKILL_KEYS` from `@/lib/domain` (Task 1).
- Produces: UI only.

- [x] **Step 1: Tooltip constants**

In `PlayerTable.tsx`, import `INSIDE_SKILL_KEYS, OUTSIDE_SKILL_KEYS` from `@/lib/domain` (`SKILLS` is already imported from `@/lib/constants`). At module level (next to `const RENDER_CAP = 300;`):

```tsx
const skillName = (k: string) => SKILLS.find((s) => s.dbKey === k)?.name ?? k;
const IN_TSP_TITLE = `Inside TSP: ${INSIDE_SKILL_KEYS.map(skillName).join(' + ')}`;
const OUT_TSP_TITLE = `Outside TSP: ${OUTSIDE_SKILL_KEYS.map(skillName).join(' + ')}`;
```

- [x] **Step 2: Headers**

After the TSP `SortTh` (line 176), BEFORE the Slovenia Δ block, add (labels exactly `In` / `Out` — e2e constraint):

```tsx
              <SortTh label="In" sortKey="insideTsp" sort={sort} onClick={handleSortClick} className="pr-3 text-right" title={IN_TSP_TITLE} />
              <SortTh label="Out" sortKey="outsideTsp" sort={sort} onClick={handleSortClick} className="pr-3 text-right" title={OUT_TSP_TITLE} />
```

- [x] **Step 3: Cells**

After the TSP cell (line 236), BEFORE the Slovenia Δ cell, add:

```tsx
                <td className="pr-3 text-right">{p.insideTsp ?? '–'}</td>
                <td className="pr-3 text-right">{p.outsideTsp ?? '–'}</td>
```

- [x] **Step 4: colSpan bump**

Line 272: change `colSpan={11 + ...}` to `colSpan={13 + ...}` (base now counts Player/Age/Pos/Ht/Pot/Salary/DMI/GS/TSP/In/Out/Owner/Data).

- [x] **Step 5: Refresh the stale e2e comment**

`v2/scripts/e2e-smoke.mts:195-196` — replace the column-order comment with:

```ts
    // TSP column index in the Slovenia table (showSkills=true, showCountry=false):
    // 0=name, 1=age, 2=pos, 3=ht, 4=pot, 5=salary, 6=dmi, 7=gs, 8=tsp, 9=in, 10=out, 11=Δ, 12+=skills, last=Data
```

(`TSP_COL_IDX = 8` stays correct — columns were inserted after TSP.)

- [x] **Step 6: Verify**

Run: `cd v2 && npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: all clean.

- [x] **Step 7: Commit**

```bash
git add v2/src/components/PlayerTable.tsx v2/scripts/e2e-smoke.mts
git commit -m "feat(v2): In/Out TSP columns on player tables"
```

---

### Task 6: Ship — deploy, e2e, changelog

**Files:**
- Modify: `CLAUDE.md` (root — append changelog entry)

- [x] **Step 1: Full local verification**

Run: `cd v2 && npm test && npm run lint && npm run build`
Expected: everything green. If anything fails, fix before pushing.

- [x] **Step 2: Push (triggers Vercel deploy)**

```bash
git push origin main
```

- [x] **Step 3: Verify prod + e2e**

Wait for the Vercel deploy of `bb-scout-v2` to finish (~2 min), then:

Run: `cd v2 && npm run e2e`
Expected: all checks pass, including check5 (TSP sorting — guards the td-index-8 and `th:has-text("TSP")` constraints).

- [x] **Step 4: Changelog entry (repo convention)**

Append to the dated changelog section of root `CLAUDE.md`:

```markdown
**2026-08-04 filter maxes + In/Out TSP shipped** (spec docs/superpowers/specs/2026-08-04-filter-maxes-inside-outside-tsp-design.md): TSP/DMI/height filters are min–max ranges, new Inside TSP (IS+ID+RB+SB) and Outside TSP (JS+JR+OD+HA+DR+PA) always-visible sortable columns + range filters on both player tables; More button now shows an active-filter count. Row TSP is now derived from skills when complete (stored value fallback) so TSP = In + Out always holds in the UI and legacy 12-skill/partial v1 sums self-heal.
```

- [x] **Step 5: Commit + push docs**

```bash
git add CLAUDE.md
git commit -m "docs: changelog for filter maxes + In/Out TSP"
git push origin main
```
