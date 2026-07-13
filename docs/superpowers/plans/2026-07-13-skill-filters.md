# Ad-hoc Skill Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-skill minimum filters (e.g. OD ≥ 11 AND JS ≥ 13 AND PA ≥ 8) in the shared filter bar, working on both the Slovenia and World player tables.

**Architecture:** Extend the pure filter layer (`src/lib/table.ts`: `FilterState` + `filterRows`) with a `skillMins` map, then add a collapsible 12-input row to the shared `FilterBar` and teach `PlayerTable`'s localStorage sanitizer about the new object-valued field. No server or schema changes.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind 4, vitest. Run all commands from `v2/`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-13-skill-filters-design.md`.
- Min-only filters; empty string = inactive (same convention as `minTsp`).
- A player whose skill is `null` FAILS when that skill's filter is set.
- Skill abbreviations must match the table's column headers: derive as `s.name.split(' ').map(w => w[0]).join('')` from `SKILLS` in `src/lib/constants.ts` (so "Outside Def." → "OD", "Free Throw" → "FT", "Stamina" → "S").

---

### Task 1: `skillMins` filter state + predicate (TDD)

**Files:**
- Modify: `v2/src/lib/table.ts`
- Test: `v2/src/lib/table.test.ts`

**Interfaces:**
- Consumes: `SKILLS`, `SkillDbKey` from `@/lib/constants`; existing `parseNum` helper in `table.ts`.
- Produces: `FilterState.skillMins: SkillMins` where `export type SkillMins = Partial<Record<SkillDbKey, string>>`; `export function countActiveSkillMins(mins: SkillMins): number`; `filterRows` honoring skill mins; `DEFAULT_FILTER.skillMins = {}`; `isFilterDefault` covering skill mins. Task 2 relies on all of these exact names.

- [ ] **Step 1: Write the failing tests** — append to `v2/src/lib/table.test.ts` (add `countActiveSkillMins` to the existing import from `./table`):

```ts
// ─── skill min filters ───────────────────────────────────────────────────────

function fullSkills(overrides: Partial<Record<string, number | null>> = {}): Record<string, number | null> {
  return {
    jump_shot: null, jump_range: null, outside_def: null, handling: null,
    driving: null, passing: null, inside_shot: null, inside_def: null,
    rebounding: null, shot_blocking: null, stamina: null, free_throw: null,
    ...overrides,
  };
}

describe('skill min filters', () => {
  it('passes players at/above threshold, fails below', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: 11 }) }),
      makePlayer({ bbPlayerId: 2, skills: fullSkills({ outside_def: 10 }) }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, skillMins: { outside_def: '11' } });
    expect(result.map((r) => r.bbPlayerId)).toEqual([1]);
  });

  it('null or missing skills fail when that filter is set', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: null }) }),
      makePlayer({ bbPlayerId: 2, skills: null }),
      makePlayer({ bbPlayerId: 3, skills: fullSkills({ outside_def: 12 }) }),
    ];
    const result = filterRows(rows, { ...DEFAULT_FILTER, skillMins: { outside_def: '5' } });
    expect(result.map((r) => r.bbPlayerId)).toEqual([3]);
  });

  it('multiple skill mins combine with AND', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, skills: fullSkills({ outside_def: 11, jump_shot: 13, passing: 8 }) }),
      makePlayer({ bbPlayerId: 2, skills: fullSkills({ outside_def: 11, jump_shot: 12, passing: 8 }) }),
    ];
    const result = filterRows(rows, {
      ...DEFAULT_FILTER,
      skillMins: { outside_def: '11', jump_shot: '13', passing: '8' },
    });
    expect(result.map((r) => r.bbPlayerId)).toEqual([1]);
  });

  it('empty-string min is inactive (nulls pass)', () => {
    const rows = [makePlayer({ skills: null })];
    expect(filterRows(rows, { ...DEFAULT_FILTER, skillMins: { outside_def: '' } })).toHaveLength(1);
  });

  it('isFilterDefault: {} and all-empty are default; a set min is not', () => {
    expect(isFilterDefault({ ...DEFAULT_FILTER, skillMins: {} })).toBe(true);
    expect(isFilterDefault({ ...DEFAULT_FILTER, skillMins: { passing: '' } })).toBe(true);
    expect(isFilterDefault({ ...DEFAULT_FILTER, skillMins: { passing: '8' } })).toBe(false);
  });

  it('countActiveSkillMins counts non-empty entries', () => {
    expect(countActiveSkillMins({})).toBe(0);
    expect(countActiveSkillMins({ passing: '8', outside_def: '', jump_shot: '13' })).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- run src/lib/table.test.ts` (from `v2/`)
Expected: FAIL — `countActiveSkillMins` not exported; TypeScript error `skillMins` not in `FilterState`.

- [ ] **Step 3: Implement in `v2/src/lib/table.ts`**

Add import at top:

```ts
import { SKILLS, type SkillDbKey } from '@/lib/constants';
```

Add to `FilterState` (after `discoveredWithinDays`):

```ts
  skillMins: SkillMins; // per-skill minimums; empty string / absent = inactive
```

Add type + helper near the types section:

```ts
export type SkillMins = Partial<Record<SkillDbKey, string>>;

export function countActiveSkillMins(mins: SkillMins): number {
  return Object.values(mins).filter((v) => v != null && v.trim() !== '').length;
}
```

Add to `DEFAULT_FILTER`:

```ts
  skillMins: {},
```

Add to the `isFilterDefault` conjunction:

```ts
    countActiveSkillMins(f.skillMins) === 0
```

In `filterRows`, before the `return rows.filter(...)`, precompute:

```ts
  const activeSkillMins: [SkillDbKey, number][] = [];
  for (const s of SKILLS) {
    const min = parseNum(f.skillMins[s.dbKey] ?? '');
    if (min !== null) activeSkillMins.push([s.dbKey, min]);
  }
```

Inside the predicate (after the discovered-within check, before `return true`):

```ts
    // Skill minimums — null/missing skill fails when that filter is set
    for (const [key, min] of activeSkillMins) {
      const v = p.skills?.[key] ?? null;
      if (v == null || v < min) return false;
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- run src/lib/table.test.ts`
Expected: PASS (all existing + 6 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/table.ts src/lib/table.test.ts
git commit -m "feat(v2): skillMins filter state + predicate in table lib"
```

---

### Task 2: FilterBar UI row + PlayerTable persistence

**Files:**
- Modify: `v2/src/components/FilterBar.tsx`
- Modify: `v2/src/components/PlayerTable.tsx` (sanitizeFilter only)

**Interfaces:**
- Consumes: `SkillMins`, `countActiveSkillMins` from `@/lib/table`; `SKILLS`, `SkillDbKey` from `@/lib/constants`; `FilterState.skillMins` from Task 1.
- Produces: user-facing "Skill filters ▾" toggle + 12-input row; localStorage round-trip for `skillMins`.

- [ ] **Step 1: FilterBar — add the toggle and collapsible row**

In `v2/src/components/FilterBar.tsx`:

Add imports:

```ts
import { SKILLS, type SkillDbKey } from '@/lib/constants';
import { countActiveSkillMins } from '@/lib/table';
```

(extend the existing `@/lib/table` import). Add state + helpers inside the component next to `moreOpen`:

```ts
  const [skillsOpen, setSkillsOpen] = useState(false);
  const activeSkillCount = countActiveSkillMins(filter.skillMins);

  function setSkillMin(key: SkillDbKey, value: string) {
    set('skillMins', { ...filter.skillMins, [key]: value });
  }
```

In `handleReset`, add `setSkillsOpen(false);` next to `setMoreOpen(false);`.

Insert a toggle button immediately after the "More ▾" button:

```tsx
        {/* Skill filters toggle */}
        <button
          type="button"
          onClick={() => setSkillsOpen((v) => !v)}
          className={`ml-1 px-2 py-0.5 rounded border text-sm ${
            activeSkillCount > 0
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-neutral-700 text-neutral-400 hover:text-white'
          }`}
        >
          Skill filters{activeSkillCount > 0 ? ` (${activeSkillCount})` : ''} {skillsOpen ? '▲' : '▾'}
        </button>
```

Insert the collapsible row after the existing `{moreOpen && (...)}` block:

```tsx
      {/* Collapsible skill-min row */}
      {skillsOpen && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm border-t border-neutral-800 pt-2">
          {SKILLS.map((s) => (
            <label key={s.dbKey} className="flex items-center gap-1 text-neutral-400" title={s.name}>
              <span>{s.name.split(' ').map((w) => w[0]).join('')} ≥</span>
              <input
                type="number"
                min={1}
                max={20}
                placeholder="—"
                value={filter.skillMins[s.dbKey] ?? ''}
                onChange={(e) => setSkillMin(s.dbKey, e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-1 text-white w-12 text-right focus:outline-none focus:border-amber-500"
              />
            </label>
          ))}
        </div>
      )}
```

- [ ] **Step 2: PlayerTable — persist `skillMins` through the sanitizer**

`sanitizeFilter` in `v2/src/components/PlayerTable.tsx` only copies primitive values, so `skillMins` (an object) would be silently dropped on load. Add a special case at the top of its `for` loop body (`SKILLS` is already imported in this file):

```ts
    if (_key === 'skillMins') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const mins: Record<string, string> = {};
        for (const s of SKILLS) {
          const v = (val as Record<string, unknown>)[s.dbKey];
          if (typeof v === 'string') mins[s.dbKey] = v;
        }
        (out as Record<string, unknown>)[_key] = mins;
      }
      continue;
    }
```

- [ ] **Step 3: Verify — tests, build, manual**

Run: `npm test -- run` → all pass. `npm run build` → compiles.
Manual (dev server): on `/slovenia`, open "Skill filters", set OD ≥ 11, JS ≥ 13, PA ≥ 8 → live count drops, table shows only matching players; collapse row → button reads "Skill filters (3)" in amber; reload page → filters persist; Reset clears them. Repeat one filter on `/world`.

- [ ] **Step 4: Commit**

```bash
git add src/components/FilterBar.tsx src/components/PlayerTable.tsx
git commit -m "feat(v2): ad-hoc per-skill min filters in filter bar"
```
