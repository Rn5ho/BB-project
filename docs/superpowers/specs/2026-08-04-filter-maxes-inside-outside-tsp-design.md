# Filter maxes + Inside/Outside TSP — design

**Date:** 2026-08-04
**Status:** approved (brainstorm session 2026-08-04)

## Goal

Two QoL features on the Slovenia and World player tables:

1. **Max filter bounds** for TSP and DMI (both currently min-only).
2. **Inside TSP** and **Outside TSP** as first-class metrics: table columns, sortable, filterable with min/max bounds.

## Definitions

- **TSP** (existing): BB's 10-rate-skill sum — all skills except Stamina and Free Throw. New snapshots store this definition (`candidate-rows.ts` comment), **but migrated v1 rows can hold a 12-skill sum, a partial sum, or null** (`v2/scripts/migrate/transform.ts:74` falls back to the 12-skill `tsp()`; v1 parsers summed whatever skills parsed). See "Row shape" for how the list derives a consistent TSP.
- **Outside TSP**: `jump_shot + jump_range + driving + handling + outside_def + passing` (6 skills).
- **Inside TSP**: `inside_shot + inside_def + rebounding + shot_blocking` (4 skills).
- Invariant (UI rows): the list's displayed TSP, In, and Out always agree — `insideTsp + outsideTsp = tsp` whenever In and Out are non-null, guaranteed by deriving TSP from the same skills record (below).
- Null semantics: each sum is **null unless every component skill is present**. Partial captures exist (writers insert per-skill with no all-or-nothing gate), so a `hasFullSkills` row can legitimately render In/Out as `–`; tests cover this.

Note: `tsp()` in `v2/src/lib/domain.ts` is a *12-skill* sum used only by the training engine. It is intentionally untouched; the new helpers live beside it with distinct names **and doc comments stating they partition the 10-skill market TSP — `insideTsp(s) + outsideTsp(s) ≠ tsp(s)` from the same file** (off by stamina + FT). Tests must assert the invariant against a hand-computed 10-skill sum, never against `tsp()`.

## Approach (chosen: derive at read time)

Full snapshots carry per-skill columns, so inside/outside TSP is derivable at read time with no schema change — the helpers null-propagate per component, which also handles partial captures. Rejected alternatives: new snapshot columns + migration/backfill (adds no information, adds migration risk); a generic range-filter refactor of the filter bar (over-engineering for two paired inputs).

If historical inside/outside charts are wanted on the player detail page later, the same helpers apply to snapshot history rows — deferred (YAGNI).

## Changes by layer

### Domain helpers — `v2/src/lib/domain.ts`

```ts
export function insideTsp(skills): number | null  // IS + ID + RB + SB, null if any missing
export function outsideTsp(skills): number | null // JS + JR + DR + HA + OD + PA, null if any missing
```

Component key lists exported as constants (`INSIDE_SKILL_KEYS`, `OUTSIDE_SKILL_KEYS`) so the UI tooltips and tests share one source of truth. A cross-check test asserts these lists map onto the archetype module's existing partition (`v2/src/lib/archetypes/derive/groups.ts` `OSP_KEYS`/`ISP_KEYS`) via `SKILL_KEY_TO_DB`, so the two copies can't silently drift.

### Row shape — `v2/src/queries/players.ts`

`PlayerListRow` gains `insideTsp: number | null` and `outsideTsp: number | null`, computed in the row mapper from the latest-full-snapshot skills record (the same one that already populates `skills`). No SQL changes.

**TSP derivation fix (required for consistency):** the mapper currently passes stored `f.tsp` through raw, but stored tsp can be null or a legacy 12-skill/partial sum on migrated rows. The mapper now sets `tsp = insideTsp + outsideTsp` **whenever both are non-null**, falling back to stored `tsp` otherwise (note: candidate-rows.ts has the OPPOSITE preference — stored-first — which only heals missing values, not wrong ones; unifying the other surfaces is a known follow-up). Effects: displayed TSP, In, Out always agree; legacy rows self-heal to the true 10-skill value; `minTsp` filter, tsp sort, and archetype tsp conditions become strictly more complete for those rows. `tspDelta` is unaffected (derived from per-skill deltas only).

### Filter state — `v2/src/lib/table.ts`

`FilterState` gains six string fields, `''` = inactive (existing convention):

- `maxTsp`, `maxDmi`
- `minInsideTsp`, `maxInsideTsp`
- `minOutsideTsp`, `maxOutsideTsp`

`DEFAULT_FILTER`, `isFilterDefault`, and `filterRows` updated accordingly. Filter semantics match the existing min filters: **if any bound on a metric is set, rows with a null value for that metric fail**. Existing localStorage blobs hydrate safely (spread over `DEFAULT_FILTER`; `sanitizeFilter` passes through string fields).

`SortKey` gains `'insideTsp' | 'outsideTsp'`; `getValue` maps them to the new row fields. Nulls sink to the bottom as with every other key.

### UI — `v2/src/components/FilterBar.tsx`, `v2/src/components/PlayerTable.tsx`

- **More panel**: "Min TSP" and "Min DMI" single inputs become paired min/max inputs styled like the existing "Height cm min/max" pair. Two new pairs: "In TSP" and "Out TSP".
- **More button active indicator**: the More toggle currently gives no cue when a collapsed filter is active (unlike the Skill-filters button). Add one: highlight + active-count on the More button, computed by a new `countActiveMoreFilters(f)` helper in `table.ts` over an exported `MORE_PANEL_FIELDS` list (single maintenance point, unit-tested).
- **Table**: two new sortable columns **In** and **Out** on both variants, always visible like TSP (NOT gated behind the Skills toggle); on Slovenia they sit between TSP and Δ. `–` when null. Header `title` tooltips list the component skills (from the exported key constants).
- **Pinned e2e constraints**: header labels are exactly `In` and `Out` — they must not contain the substring "TSP" (`e2e-smoke.mts:221` uses `th:has-text("TSP")`, strict mode); columns insert AFTER TSP so td index 8 stays TSP (`TSP_COL_IDX = 8`). Refresh the stale column-order comment at `e2e-smoke.mts:196` while there.
- **colSpan bump**: the empty-state row at `PlayerTable.tsx:272` hardcodes base 11 → becomes 13.

### Tests

- `domain.test.ts`: sums, null propagation (any missing component → null), `insideTsp + outsideTsp` equals a **hand-computed 10-skill sum** (explicitly not `tsp()`), partition cross-check vs `groups.ts` `OSP_KEYS`/`ISP_KEYS`.
- `table.test.ts`: max-bound filtering (incl. null-fails-when-set), inside/outside min/max filtering, new sort keys, `isFilterDefault` with new fields, `countActiveMoreFilters`. Mechanical: extend the `makePlayer` fixture with `insideTsp: null, outsideTsp: null` (compile-time requirement).
- `queries` mapper: TSP derivation fix — derived-when-computable, stored fallback, null when both absent (test at whatever seam is practical; the mapper is currently untested SQL-adjacent code, so a pure helper `deriveRowTsp(stored, inside, outside)` in `lib/domain.ts` keeps it testable).

## Out of scope

- Player detail page charts/history for inside/outside TSP.
- Census candidate filters (`--min-tsp` etc.) — unchanged.
- Max bounds for salary/game shape (not requested).

## Deploy

Standard flow: full test suite → push to `main` → Vercel auto-deploy of `bb-scout-v2`. Append a dated "shipped" entry to root `CLAUDE.md` referencing this spec (repo convention).
