# Filter maxes + Inside/Outside TSP — design

**Date:** 2026-08-04
**Status:** approved (brainstorm session 2026-08-04)

## Goal

Two QoL features on the Slovenia and World player tables:

1. **Max filter bounds** for TSP and DMI (both currently min-only).
2. **Inside TSP** and **Outside TSP** as first-class metrics: table columns, sortable, filterable with min/max bounds.

## Definitions

- **TSP** (existing): BB's 10-rate-skill sum — all skills except Stamina and Free Throw. The stored `snapshots.tsp` column already uses this definition (see comment in `v2/src/server/census/candidate-rows.ts`).
- **Outside TSP**: `jump_shot + jump_range + driving + handling + outside_def + passing` (6 skills).
- **Inside TSP**: `inside_shot + inside_def + rebounding + shot_blocking` (4 skills).
- Invariant: `insideTsp + outsideTsp = tsp` whenever all three are non-null.
- Null semantics: each sum is **null unless every component skill is present** — identical to how `tsp` behaves for light (skill-less) snapshots.

Note: `tsp()` in `v2/src/lib/domain.ts` is a *12-skill* sum used only by the training engine. It is intentionally untouched; the new helpers live beside it with distinct names.

## Approach (chosen: derive at read time)

Every full snapshot already stores all 12 skills, so inside/outside TSP is derivable at read time with no schema change. Rejected alternatives: new snapshot columns + migration/backfill (adds no information, adds migration risk); a generic range-filter refactor of the filter bar (over-engineering for two paired inputs).

If historical inside/outside charts are wanted on the player detail page later, the same helpers apply to snapshot history rows — deferred (YAGNI).

## Changes by layer

### Domain helpers — `v2/src/lib/domain.ts`

```ts
export function insideTsp(skills): number | null  // IS + ID + RB + SB, null if any missing
export function outsideTsp(skills): number | null // JS + JR + DR + HA + OD + PA, null if any missing
```

Component key lists exported as constants (`INSIDE_SKILL_KEYS`, `OUTSIDE_SKILL_KEYS`) so the UI tooltips and tests share one source of truth.

### Row shape — `v2/src/queries/players.ts`

`PlayerListRow` gains `insideTsp: number | null` and `outsideTsp: number | null`, computed in the row mapper from the latest-full-snapshot skills record (the same one that already populates `skills`). No SQL changes.

### Filter state — `v2/src/lib/table.ts`

`FilterState` gains six string fields, `''` = inactive (existing convention):

- `maxTsp`, `maxDmi`
- `minInsideTsp`, `maxInsideTsp`
- `minOutsideTsp`, `maxOutsideTsp`

`DEFAULT_FILTER`, `isFilterDefault`, and `filterRows` updated accordingly. Filter semantics match the existing min filters: **if any bound on a metric is set, rows with a null value for that metric fail**. Existing localStorage blobs hydrate safely (spread over `DEFAULT_FILTER`; `sanitizeFilter` passes through string fields).

`SortKey` gains `'insideTsp' | 'outsideTsp'`; `getValue` maps them to the new row fields. Nulls sink to the bottom as with every other key.

### UI — `v2/src/components/FilterBar.tsx`, `v2/src/components/PlayerTable.tsx`

- **More panel**: "Min TSP" and "Min DMI" single inputs become paired min/max inputs styled like the existing "Height cm min/max" pair. Two new pairs: "In TSP" and "Out TSP".
- **Table**: two new sortable columns **In** and **Out** immediately after TSP, on both variants, `–` when null. Header `title` tooltips list the component skills (from the exported key constants).

### Tests

- `domain.test.ts`: sums, null propagation (any missing component → null), `inside + outside = tsp` invariant against a full skill set.
- `table.test.ts`: max-bound filtering (incl. null-fails-when-set), inside/outside min/max filtering, new sort keys, `isFilterDefault` with new fields.

## Out of scope

- Player detail page charts/history for inside/outside TSP.
- Census candidate filters (`--min-tsp` etc.) — unchanged.
- Max bounds for salary/game shape (not requested).

## Deploy

Standard flow: full test suite → push to `main` → Vercel auto-deploy of `bb-scout-v2`.
