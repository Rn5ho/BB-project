# World Page Design

**Date:** 2026-04-12
**Status:** Draft — pending user review
**Parent spec:** [2026-04-12-dashboard-vision-design.md](./2026-04-12-dashboard-vision-design.md) (Priority 1)
**Replaces:** Current `web/app/opponents/page.tsx`

---

## 1. Purpose

World is the broad multi-country scouting view. It replaces the current Opponents page. It's a **historical record**: most tracked players have DMI-only snapshots, some have full skills (captured opportunistically via market scans), and skills are often 1–2 seasons stale. The view's job is to display that mixed data well and let the user filter down to relevant subsets — not to run precision filters or detect archetypes (those belong on Slovenia).

Current problems being solved:
- 60+ country pills wrap into 4+ rows, eating screen space
- Default DMI sort broken (most rows have null DMI) — but see note: underlying cause is a capture-pipeline bug tracked separately
- No way to view actual skills even when they exist
- No multi-country selection
- No presets for common filter sets (e.g. Europe)
- No player aging between seasons (Slovenia has it, World does not)
- `is_nt_player` flag used as "U-21 only" filter but is unreliable for non-Slovenian players

---

## 2. Route & Navbar

- Route: `/world` (renamed from `/opponents`)
- Navbar entry: "Opponents" → "World"
- Legacy: add a redirect from `/opponents` → `/world` so existing bookmarks still work
- Updated files: `web/app/world/page.tsx` (new), delete `web/app/opponents/page.tsx`, update `web/components/Navbar.tsx`, `CLAUDE.md` references

---

## 3. Data Model Changes

### 3.1 New `settings` table

Single-row-per-key key-value store for user preferences that need cross-device persistence.

```sql
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table settings enable row level security;
create policy "Authenticated read settings" on settings for select to authenticated using (true);
create policy "Authenticated upsert settings" on settings for insert to authenticated with check (true);
create policy "Authenticated update settings" on settings for update to authenticated using (true);
```

Used initially for:
- `key = 'season_opponents'`, `value = { "countries": ["Poland", "Hellas", ...] }` — starred countries for the Season Opponents preset.

Future keys (not in this spec): `europe_country_overrides`, other shared preferences.

### 3.2 No other schema changes

`is_nt_player` stays as-is. The World page simply does not rely on it. Its rework is tracked in the memory entry `project_nt_player_flag_rework.md`.

---

## 4. Shared Helpers (extracted from Slovenia)

Slovenia currently defines `computeCurrentAge` and `formatStaleness` inline in `web/app/slovenia/page.tsx`. Extract them to:

**`web/lib/season.ts`** (new):
- `computeCurrentAge(snapshot: SkillSnapshot | null, currentSeason: number | null): number | null`
- `formatStaleness(capturedAt: string, currentSeason: number | null, snapshotSeason: number | null): string`
- `staleSeasonDelta(currentSeason: number | null, snapshotSeason: number | null): number | null` — new helper returning numeric delta (0, 1, 2+, or null) for the color-badge logic.

Both Slovenia and World import from `lib/season.ts`. Slovenia's inline copies are removed.

**`web/lib/currentSeason.ts`** (new): wraps the existing `/api/scout/seasons` fetch + localStorage caching pattern currently inline in Slovenia. Exports a `useCurrentSeason()` React hook returning `{ currentSeason, loading }`. Both pages consume the hook.

---

## 5. Region Presets

### 5.1 Europe preset

**`web/lib/regions.ts`** (new):
```ts
export const EUROPE_COUNTRIES = [
  "Albania","Belarus","Belgium","Bosnia","Bulgaria","Crna Gora","Croatia","Cymru",
  "Česká Rep.","Danmark","Deutschland","Eesti","England","España","France","Germany",
  "Hellas","Hrvatska","Hungary","Ireland","Italia","Italy","Latvija","Lithuania",
  "Lubnan","Magyar","Nederland","Norge","Österreich","Polska","Poland","Portugal",
  "Rossiya","România","Sakartvelo","Scotland","Serbia","Slovensko","Slovenia",
  "Sverige","Türkiye","Ukraina"
  // Full list finalized by comparing current distinct nationalities in DB against BB's
  // European region list; pattern is "include both English and native name variants".
];
```

**Note on duplicate country names:** BB appears to have both English and native-language entries in the country dropdown (e.g. "Germany" and "Deutschland", "Greece" and "Hellas"). The Europe preset includes both forms defensively — if a player record uses the native name, it still matches.

The preset, when clicked, selects the intersection of `EUROPE_COUNTRIES` and the countries actually present in the current dataset (so the user doesn't get phantom chips for countries with zero players tracked).

### 5.2 Season Opponents preset

Loaded from `settings` table key `season_opponents`. Starts empty.

Setting mechanism: each country in the multi-select picker shows a small star icon (filled when starred, outline when not). Clicking the star toggles membership in `season_opponents`. Persisted immediately to Supabase.

Clicking the "Season Opponents" preset button selects all currently-starred countries.

### 5.3 All preset
Deselects all country filters (shows everyone in the table). Equivalent to Clear, but named explicitly for discoverability.

### 5.4 Clear preset
Resets every filter (country chips, age, position, potential, has-full-skills, U-21 toggle, Include Slovenia toggle, search). Preserves column visibility preferences.

---

## 6. UI Layout

Top-to-bottom on the page:

```
[Navbar]

┌─────────────────────────────────────────────────────────────────┐
│  World                            97 players  [⋮ Columns ▾]    │  ← header row
├─────────────────────────────────────────────────────────────────┤
│  [All] [Europe] [Season Opponents] [Clear]                     │  ← preset buttons
│                                                                 │
│  Countries: [chip][chip][chip] [+ type to add...]              │  ← country multi-select
│                                                                 │
│  [Search name...]  Age: [18][19][20][21]  [Position ▾]         │  ← filters row 1
│  [Potential ▾]  [☐ U-21 only]  [☐ Include Slovenia]            │  ← filters row 2
│  [☐ Has full skills only]                                      │
├─────────────────────────────────────────────────────────────────┤
│  [Bulk actions bar — appears only when rows selected]          │
├─────────────────────────────────────────────────────────────────┤
│  [Sortable table]                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Components

### 7.1 `web/components/CountryMultiSelect.tsx` (new)

Props:
```ts
{
  countries: string[];              // all known countries (from loaded players)
  selected: string[];               // currently selected
  starred: string[];                // starred (Season Opponents)
  onChange: (selected: string[]) => void;
  onToggleStar: (country: string) => void;
}
```

Behavior:
- Renders selected countries as removable chips (click × to remove).
- Input at end of chip row: typing filters a dropdown below showing `countries` that match (not already selected).
- Each dropdown row shows: `★ or ☆` (clickable, calls `onToggleStar`) + country name.
- Clicking a dropdown row adds it to selection.
- Backspace on empty input removes last selected chip.
- Escape closes dropdown.

### 7.2 `web/components/WorldPresets.tsx` (new)

Props:
```ts
{
  allCountries: string[];
  starredCountries: string[];
  currentSelection: string[];
  onPreset: (countries: string[]) => void;
  onClearAll: () => void;
}
```

Renders 4 preset buttons: All, Europe, Season Opponents, Clear. Each calls `onPreset` with the appropriate array (or `onClearAll` for the Clear button which additionally resets non-country filters).

Active-state visual: if `currentSelection` exactly matches a preset's output, highlight that preset button.

### 7.3 `web/components/ColumnVisibilityMenu.tsx` (new)

Props:
```ts
{
  columns: { key: string; label: string; default: boolean }[];
  visible: Record<string, boolean>;
  onChange: (visible: Record<string, boolean>) => void;
}
```

Dropdown menu triggered by a gear/columns icon. Checkbox per column. Persisted to `localStorage` key `bb_world_columns_v1`.

### 7.4 `web/components/PlayerRowExpanded.tsx` (new)

Shows a compact skill grid inline beneath a World row when expanded. Grid layout: 4 columns × 3 rows of skills, each cell shows `<skill abbreviation>: <level> (<level name>)` with color coding from `lib/constants.ts`. Only renders when `row.hasSk`.

### 7.5 `web/components/FullSkillsBadge.tsx` (new)

Props: `{ seasonDelta: number | null; hasFullSkills: boolean }`

Rendering:
- `!hasFullSkills` → "DMI only" in blue.
- `seasonDelta === 0` or null → "Full skills" in emerald.
- `seasonDelta === 1` → "Full skills" in amber (text like `Full skills · 1s ago`).
- `seasonDelta >= 2` → "Full skills" in red (`Full skills · Ns ago`).

Used on both World table rows and (future) Player detail.

### 7.6 `web/app/world/page.tsx` (new)

The page itself. Thin — loads data, wires the components, manages filter state, renders the table. Target under 400 lines; if it grows bigger, split the table render into `WorldTable.tsx`.

---

## 8. Filter Behavior

All filters are client-side (data is loaded once; 97 players is trivial to filter in-memory — no server-side pagination needed yet).

- **Country multi-select** — empty = no country restriction; one or more = show only players whose `player.nationality` matches any selected.
- **Search name** — case-insensitive substring match on `player.name`.
- **Age brackets (18/19/20/21)** — matches `computeCurrentAge(snapshot, currentSeason)`. Multi-toggle (select multiple). Empty = no age restriction.
- **Position dropdown** — single value `PG|SG|SF|PF|C|""`.
- **Potential dropdown** — min potential (0 = all, N = potential ≥ N).
- **U-21 only toggle** — when ON, restricts results to age ∈ {18,19,20,21}. Age brackets still apply on top (intersection). So `U-21 ON + 19 bracket ON` = only 19-year-olds. `U-21 ON + no brackets` = all 18–21-year-olds.
- **Include Slovenia toggle** — when OFF (default), excludes `player.nationality === "Slovenia"` from the results. When ON, Slovenia included.
- **Has full skills only** — when ON, hides rows where `hasSk` is false.

Clear resets all of the above. Column visibility is preserved.

---

## 9. Table

### 9.1 Columns (all sortable where meaningful)

| Key | Label | Default | Renderer |
|-----|-------|---------|----------|
| `select` | ☐ | ✅ | checkbox |
| `name` | Name | ✅ | link to `/players/[id]` + country + BB link + expand chevron |
| `age` | Age | ✅ | `computeCurrentAge` result |
| `position` | Pos | ✅ | player.position or "-" |
| `potential` | Potential | ✅ | color-coded name |
| `dmi` | DMI | ✅ | formatted number OR "-"; see sort rules |
| `game_shape` | GS | ✅ | visually adjacent to DMI — rendered in the same cell as `DMI @ GSx` |
| `data_badge` | Data | ✅ | `<FullSkillsBadge />` |
| `updated` | Updated | ✅ | date |
| `salary` | Salary | ❌ | `$N,NNN` or "-" |
| `skill_points` | TSP | ❌ | number or "-" |
| `height` | Height | ❌ | player.height or "-" |

Note: DMI and GS are visually combined into one cell for the DMI-in-context readout (e.g. `3.2M @ GS9`). They stay as two logical columns for sort purposes.

### 9.2 Sort rules

- Default sort: `dmi` descending.
- Missing DMI rows (`snapshot.dmi == null`) always sink to bottom, regardless of direction.
- Clicking a sortable header cycles: desc → asc → desc (no "unsorted" state).
- Name sorts case-insensitive.

### 9.3 Expandable rows

Each row (where `row.hasSk === true`) shows a chevron in the Name column. Click chevron to expand; row grows downward with `<PlayerRowExpanded />` showing the skill grid. Chevron rotates to indicate state. Expansion state is local component state (not persisted). Multiple rows can be expanded simultaneously.

Rows without skills (`hasSk === false`) show no chevron.

### 9.4 Bulk actions

Existing bulk-delete flow is kept as-is. One new action added:
- **Compare selected** button — navigates to `/compare?ids=<id1>,<id2>,...` with selected player IDs. Replaces any existing comparison on the Compare page. Disabled when 0 or 1 selected (needs at least 2).

---

## 10. Data Loading

On page mount:

1. Start `useCurrentSeason()` hook.
2. Fetch players: same query as current Opponents page, but drop the `.neq("nationality", "Slovenia")` filter — Slovenia is now a toggle. Default filter keeps Slovenia hidden client-side; toggling Include Slovenia reveals them without a re-fetch.
3. Fetch all latest snapshots per player (existing pattern).
4. Fetch `settings` row for `season_opponents` (if not present, empty array).
5. Merge into `PlayerRow[]` identical in shape to current code.

Initial render shows loading state until both queries complete.

---

## 11. What Gets Removed

- Country pill band at top of page (replaced by multi-select + presets).
- Hardcoded `.neq("nationality", "Slovenia")` in load query (Slovenia now a toggle).
- The `filterCountry` (single-string) state — replaced with `filterCountries: string[]`.
- Implicit default-sort on DMI being broken — sort logic will explicitly bucket null DMI to bottom.

Everything else (search, position dropdown, potential dropdown, checkbox multi-select, bulk delete, existing table cell renderers) is kept or lightly adjusted.

---

## 12. Out of Scope

- DMI-missing-on-market-snapshots bug — separate issue; tracked for later (see Section 1). World page displays "-" for null DMI rows without trying to fix the source.
- `is_nt_player` rework — separate project (memory: `project_nt_player_flag_rework.md`). World page uses age-based U-21 filter only.
- Server-side pagination — not needed at current scale (~100 players).
- Mobile-responsive overhaul — desktop-first; existing `overflow-x-auto` table pattern retained.
- Compare page rebuild — receiving IDs via URL works with the current Compare page as-is or with a trivial read-URL-params change. Compare's own redesign is a separate spec.

---

## 13. Open Questions

- **Europe country list:** Section 5.1 includes a best-effort list. Confirm with user after first use — we can trim/expand based on real data.
- **Height column format:** BB displays height like `6'5" / 196 cm`. Confirm current DB stores it as a string in that format (I assume yes; column just shows player.height verbatim).
- **Star icon placement:** In dropdown rows only, or also on selected chips? Proposed: dropdown rows only (keeps chip compact).

---

## 14. Rollout

Shipped in small incremental commits to main (per user's standing preference). Vercel auto-deploys; user tests live. Suggested commit slices — exact breakdown locked in during the implementation plan:

1. Add `settings` table migration + RLS policies (SQL only, no UI yet).
2. Extract `computeCurrentAge` / `formatStaleness` / `useCurrentSeason` to `web/lib/`; refactor Slovenia to use them (no behavior change).
3. Add `lib/regions.ts` with `EUROPE_COUNTRIES` list.
4. Build `CountryMultiSelect` + `WorldPresets` + `FullSkillsBadge` + `ColumnVisibilityMenu` + `PlayerRowExpanded` components in isolation (unused).
5. Scaffold `/world/page.tsx` using the components; keep `/opponents/page.tsx` intact (parallel availability for side-by-side testing).
6. Rename navbar entry; add `/opponents` → `/world` redirect; delete old `/opponents/page.tsx`.

Each slice is independently deployable; user can stop at any point without breaking anything.
