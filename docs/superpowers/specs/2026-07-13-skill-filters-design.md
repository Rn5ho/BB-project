# Ad-hoc Skill Filters (Slovenia + World) — Design

**Status: approved 2026-07-13.**

## Problem

The NT manager needs to find callup candidates by per-skill thresholds — e.g. "all
players with OD ≥ 11, JS ≥ 13, PA ≥ 8". The archetype system can express this but
requires creating and saving a named archetype with per-age thresholds — too much
friction for ad-hoc queries. The filter bar has no per-skill filters.

## Design

### Filter state (`src/lib/table.ts`)

- `FilterState` gains `skillMins: Partial<Record<SkillKey, string>>` — one optional
  minimum per skill. Empty string / absent key = inactive (same convention as
  `minTsp` etc.). `SkillKey` = the 12 skill keys already used in `SortKey` /
  `PlayerListRow.skills` (`jump_shot` … `free_throw`).
- Min-only. No max filters until a real need appears (YAGNI).
- `filterRows` applies each active min: a player whose skill is `null` **fails**
  when that skill's filter is set — consistent with every other min-filter
  (`minTsp`, `minDmi`, …).
- `DEFAULT_FILTER.skillMins = {}`; `isFilterDefault` returns false when any
  skill min is set (non-empty value).

### UI (`src/components/FilterBar.tsx`)

- New **"Skill filters ▾"** toggle button next to "More ▾", opening a second
  collapsible row with 12 compact numeric inputs, one per skill, rendered as
  `OD ≥ [ ]`. Abbreviations match the table's skill column headers:
  JS, JR, OD, HA, DR, PA, IS, ID, RB, SB, ST, FT.
- When collapsed with N active skill filters, the button reads
  **"Skill filters (N)"** and uses the amber active styling (same as the Skills
  toggle) so active filters can't hide silently.
- Reset clears skill mins along with everything else.
- Inputs follow the existing `NumInput` pattern (string state, empty = inactive).

### Scope

`FilterBar` and `filterRows` are shared by the Slovenia and World pages, so skill
filters work on both automatically. No per-page code. No persistence beyond the
pages' existing filter-state handling.

## Testing

Unit tests in `src/lib/table.test.ts`, following existing patterns:

- Active skill min passes players at/above threshold, fails below.
- Player with `null`/missing skill fails when that filter is set, passes when not.
- Multiple skill mins combine with AND.
- `isFilterDefault` false when a skill min is set; true when `skillMins` is `{}`
  or all values empty.

Example acceptance query: OD ≥ 11, JS ≥ 13, PA ≥ 8 on the Slovenia page returns
exactly the players meeting all three thresholds, live count updating as typed.
