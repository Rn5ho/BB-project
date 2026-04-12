# World Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing Opponents page with a new `/world` page: typeable country multi-select with chips + presets (All / Europe / Season Opponents / Clear), star-toggle per country for the Season Opponents preset, age-based U-21 filter, expandable skill-grid rows, DMI+GS linked display, stale-skills color-shifting badge, column visibility menu, multi-select → Compare via URL params, season-aging applied to all rows.

**Architecture:** New route `web/app/world/page.tsx`. Extract shared helpers (`computeCurrentAge`, `formatStaleness`, `useCurrentSeason`) from Slovenia page to `web/lib/`. New Supabase `settings` table stores starred countries. New components under `web/components/world/`. Shipped as 6 small commits to main — each independently deployable, user tests live on Vercel between commits.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Supabase. No test framework in project; verification is manual (checklists per task).

**Parent spec:** [../specs/2026-04-12-world-page-design.md](../specs/2026-04-12-world-page-design.md)

---

## Conventions for every task

- Each task ends with `npm run build` (in `web/`) passing — that's the build-level smoke test.
- Each task ends with a commit to `main`. Commit messages use conventional style: `feat:`, `refactor:`, `fix:`, `chore:`.
- After each commit, user tests on Vercel before the next task begins.
- Start dev server with `npm run dev` from `web/` when you need to click through the UI.
- Do not introduce new dependencies without flagging it.

---

## Task 1: Add `settings` table migration

**Files:**
- Modify: `D:/ClaudeProjects/BB-project/supabase/schema.sql` (append new table)
- The user will run the SQL in their Supabase SQL Editor manually. No migration runner.

**Context:** World needs a place to store the starred-countries list for the Season Opponents preset. A single general `settings` key-value table covers this and any future cross-device preferences.

- [ ] **Step 1: Read current schema tail**

Read the last 50 lines of `supabase/schema.sql` to match existing style (table creation + RLS pattern).

- [ ] **Step 2: Append the new table definition**

Append at the end of `supabase/schema.sql`:

```sql
-- Settings: cross-device user preferences (key-value, JSONB)
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table settings enable row level security;
create policy "Authenticated read settings"
  on settings for select
  to authenticated
  using (true);
create policy "Authenticated insert settings"
  on settings for insert
  to authenticated
  with check (true);
create policy "Authenticated update settings"
  on settings for update
  to authenticated
  using (true);
create policy "Authenticated delete settings"
  on settings for delete
  to authenticated
  using (true);
```

- [ ] **Step 3: Tell the user to run the SQL**

Output a short message:
> "Added `settings` table definition to `supabase/schema.sql`. Please paste the new block into your Supabase SQL Editor and run it, then confirm success before I continue."

**Manual verification (user):**
- In Supabase SQL Editor, run the new block.
- Confirm no errors.
- `select * from settings;` returns 0 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(db): add settings table for cross-device user preferences"
```

---

## Task 2: Extract season helpers to `lib/season.ts` + `lib/useCurrentSeason.ts`

**Files:**
- Create: `D:/ClaudeProjects/BB-project/web/lib/season.ts`
- Create: `D:/ClaudeProjects/BB-project/web/lib/useCurrentSeason.ts`
- Modify: `D:/ClaudeProjects/BB-project/web/app/slovenia/page.tsx` (swap inline helpers for imports)

**Context:** Slovenia currently defines `computeCurrentAge`, `formatStaleness`, and `loadCurrentSeason` inline. World will reuse them. Extract first (refactor, no behavior change), then Slovenia and World both import.

- [ ] **Step 1: Create `web/lib/season.ts`**

```ts
import type { SkillSnapshot } from "@/lib/types";

export function computeCurrentAge(
  snapshot: SkillSnapshot | null,
  currentSeason: number | null
): number | null {
  if (!snapshot?.age) return null;
  if (currentSeason && snapshot.bb_season && currentSeason > snapshot.bb_season) {
    return snapshot.age + (currentSeason - snapshot.bb_season);
  }
  return snapshot.age;
}

export function formatStaleness(
  capturedAt: string,
  currentSeason: number | null,
  snapshotSeason: number | null
): string {
  if (currentSeason && snapshotSeason) {
    const delta = currentSeason - snapshotSeason;
    if (delta === 0) return "this season";
    if (delta === 1) return "1 season ago";
    return `${delta} seasons ago`;
  }
  const days = Math.floor(
    (Date.now() - new Date(capturedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function staleSeasonDelta(
  currentSeason: number | null,
  snapshotSeason: number | null
): number | null {
  if (currentSeason == null || snapshotSeason == null) return null;
  return Math.max(0, currentSeason - snapshotSeason);
}
```

- [ ] **Step 2: Create `web/lib/useCurrentSeason.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

const CACHE_KEY = "bb_current_season";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function useCurrentSeason(): { currentSeason: number | null; loading: boolean } {
  const [currentSeason, setCurrentSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { season, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          setCurrentSeason(season);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to fetch
      }
    }

    (async () => {
      try {
        const res = await fetch("/api/scout/seasons");
        if (res.ok) {
          const data = await res.json();
          if (data.currentSeason) {
            setCurrentSeason(data.currentSeason);
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ season: data.currentSeason, timestamp: Date.now() })
            );
          }
        }
      } catch {
        // non-fatal: currentSeason stays null, ages display as captured
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { currentSeason, loading };
}
```

- [ ] **Step 3: Refactor Slovenia to use the shared helpers**

In `web/app/slovenia/page.tsx`:

- Remove the inline `computeCurrentAge` function (lines 93–99).
- Remove the inline `formatStaleness` function (lines 113–126).
- Remove the inline `loadCurrentSeason` function and the `currentSeason` useState + its `useEffect` call (search for `loadCurrentSeason`).
- Add at top with other imports:
  ```ts
  import { computeCurrentAge, formatStaleness } from "@/lib/season";
  import { useCurrentSeason } from "@/lib/useCurrentSeason";
  ```
- Replace the removed state + load with:
  ```ts
  const { currentSeason } = useCurrentSeason();
  ```
  (Placed where `const [currentSeason, setCurrentSeason] = useState<number | null>(null);` was.)

**Do not change any other behavior on the Slovenia page.**

- [ ] **Step 4: Build**

```bash
cd D:/ClaudeProjects/BB-project/web && npm run build
```

Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 5: Manual verification**

Start dev server (`npm run dev`), open Slovenia page:
- Ages render as before.
- Staleness text on snapshots renders as before.
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add web/lib/season.ts web/lib/useCurrentSeason.ts web/app/slovenia/page.tsx
git commit -m "refactor(season): extract age/staleness/currentSeason helpers to lib"
```

---

## Task 3: Add `lib/regions.ts` with Europe list

**Files:**
- Create: `D:/ClaudeProjects/BB-project/web/lib/regions.ts`

**Context:** Hardcoded list of European BB country names for the Europe preset. Includes both English and native-language forms defensively.

- [ ] **Step 1: Create the file**

```ts
// European BB countries. Includes both English and native-language variants
// defensively (BB's country list has both forms for several countries).
// List is filtered to "countries present in the current dataset" at use-site,
// so unused entries are harmless.
export const EUROPE_COUNTRIES: string[] = [
  "Albania",
  "Belarus",
  "Belgium",
  "Bosnia",
  "Bulgaria",
  "Crna Gora",
  "Croatia",
  "Cymru",
  "Česká Rep.",
  "Danmark",
  "Deutschland",
  "Eesti",
  "England",
  "España",
  "France",
  "Germany",
  "Hellas",
  "Hrvatska",
  "Hungary",
  "Ireland",
  "Italia",
  "Italy",
  "Latvija",
  "Latvia",
  "Lithuania",
  "Lubnan",
  "Magyar",
  "Nederland",
  "Norge",
  "Österreich",
  "Poland",
  "Polska",
  "Portugal",
  "România",
  "Rossiya",
  "Sakartvelo",
  "Scotland",
  "Serbia",
  "Slovakia",
  "Slovensko",
  "Slovenia",
  "Sverige",
  "Türkiye",
  "Turkey",
  "Ukraina",
  "Ukraine",
];

export function intersectWithDataset(
  preset: string[],
  dataset: string[]
): string[] {
  const set = new Set(dataset);
  return preset.filter((c) => set.has(c));
}
```

- [ ] **Step 2: Build**

```bash
cd D:/ClaudeProjects/BB-project/web && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/lib/regions.ts
git commit -m "feat(regions): add Europe country preset + dataset intersection helper"
```

---

## Task 4: Build standalone components (unused until Task 5)

**Files:**
- Create: `D:/ClaudeProjects/BB-project/web/components/world/CountryMultiSelect.tsx`
- Create: `D:/ClaudeProjects/BB-project/web/components/world/WorldPresets.tsx`
- Create: `D:/ClaudeProjects/BB-project/web/components/world/FullSkillsBadge.tsx`
- Create: `D:/ClaudeProjects/BB-project/web/components/world/ColumnVisibilityMenu.tsx`
- Create: `D:/ClaudeProjects/BB-project/web/components/world/PlayerRowExpanded.tsx`

**Context:** Build all World-specific components in isolation. They are not wired anywhere yet — Task 5 integrates them. This keeps Task 5's diff focused on page composition.

- [ ] **Step 1: `FullSkillsBadge.tsx`**

```tsx
"use client";

interface Props {
  hasFullSkills: boolean;
  seasonDelta: number | null;
}

export function FullSkillsBadge({ hasFullSkills, seasonDelta }: Props) {
  if (!hasFullSkills) {
    return <span className="text-blue-400">DMI only</span>;
  }
  if (seasonDelta == null || seasonDelta === 0) {
    return <span className="text-emerald-400">Full skills</span>;
  }
  if (seasonDelta === 1) {
    return <span className="text-amber-400">Full skills · 1s ago</span>;
  }
  return <span className="text-red-400">Full skills · {seasonDelta}s ago</span>;
}
```

- [ ] **Step 2: `ColumnVisibilityMenu.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
  alwaysVisible?: boolean; // e.g. Name
}

interface Props {
  columns: ColumnDef[];
  visible: Record<string, boolean>;
  onChange: (visible: Record<string, boolean>) => void;
}

export function ColumnVisibilityMenu({ columns, visible, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded text-xs text-gray-300 hover:text-white transition-colors"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        title="Column visibility"
      >
        ⋮ Columns
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 rounded-md p-2 z-20 min-w-[180px]"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {columns.map((col) => (
            <label
              key={col.key}
              className={`flex items-center gap-2 px-2 py-1 text-xs rounded ${
                col.alwaysVisible ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5 cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={col.alwaysVisible ? true : !!visible[col.key]}
                disabled={col.alwaysVisible}
                onChange={(e) =>
                  onChange({ ...visible, [col.key]: e.target.checked })
                }
              />
              <span className="text-gray-200">{col.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `CountryMultiSelect.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  countries: string[]; // all available (from dataset)
  selected: string[];
  starred: string[];
  onChange: (selected: string[]) => void;
  onToggleStar: (country: string) => void;
}

export function CountryMultiSelect({ countries, selected, starred, onChange, onToggleStar }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedSet = new Set(selected);
  const starredSet = new Set(starred);
  const q = query.trim().toLowerCase();
  const filtered = countries
    .filter((c) => !selectedSet.has(c))
    .filter((c) => (q === "" ? true : c.toLowerCase().includes(q)))
    .sort((a, b) => a.localeCompare(b));

  function addCountry(c: string) {
    onChange([...selected, c]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeCountry(c: string) {
    onChange(selected.filter((x) => x !== c));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && query === "" && selected.length > 0) {
      removeCountry(selected[selected.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      addCountry(filtered[0]);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex flex-wrap gap-1 items-center px-2 py-1 rounded-md min-h-[34px]"
        style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selected.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white"
            style={{ background: "var(--accent)" }}
          >
            {c}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeCountry(c);
              }}
              className="hover:text-gray-200"
              aria-label={`Remove ${c}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length === 0 ? "Type to add country..." : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-white"
        />
      </div>

      {open && filtered.length > 0 && (
        <div
          className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {filtered.map((c) => (
            <div
              key={c}
              className="flex items-center justify-between px-3 py-1.5 text-sm text-gray-200 hover:bg-white/5 cursor-pointer"
              onClick={() => addCountry(c)}
            >
              <span>{c}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(c);
                }}
                className="text-lg"
                title={starredSet.has(c) ? "Unstar (remove from Season Opponents)" : "Star (add to Season Opponents)"}
                style={{ color: starredSet.has(c) ? "var(--accent)" : "rgb(107 114 128)" }}
              >
                {starredSet.has(c) ? "★" : "☆"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `WorldPresets.tsx`**

```tsx
"use client";

import { EUROPE_COUNTRIES, intersectWithDataset } from "@/lib/regions";

interface Props {
  allCountriesInDataset: string[];
  starredCountries: string[];
  onSetCountries: (countries: string[]) => void;
  onClearAll: () => void;
}

export function WorldPresets({
  allCountriesInDataset,
  starredCountries,
  onSetCountries,
  onClearAll,
}: Props) {
  const europe = intersectWithDataset(EUROPE_COUNTRIES, allCountriesInDataset);
  const season = intersectWithDataset(starredCountries, allCountriesInDataset);

  const btn =
    "px-3 py-1 rounded-md text-xs font-medium text-gray-300 hover:text-white transition-colors";
  const bg = { background: "var(--card-bg)", border: "1px solid var(--card-border)" };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button className={btn} style={bg} onClick={() => onSetCountries([])}>
        All
      </button>
      <button className={btn} style={bg} onClick={() => onSetCountries(europe)}>
        Europe ({europe.length})
      </button>
      <button
        className={btn}
        style={bg}
        onClick={() => onSetCountries(season)}
        disabled={season.length === 0}
        title={season.length === 0 ? "Star countries in the picker to build this list" : undefined}
      >
        Season Opponents ({season.length})
      </button>
      <button className={btn} style={bg} onClick={onClearAll}>
        Clear
      </button>
    </div>
  );
}
```

- [ ] **Step 5: `PlayerRowExpanded.tsx`**

```tsx
"use client";

import type { SkillSnapshot } from "@/lib/types";
import { SKILL_LEVELS, getSkillColor } from "@/lib/constants";

interface Props {
  snapshot: SkillSnapshot;
}

const SKILLS: { key: keyof SkillSnapshot; label: string }[] = [
  { key: "jump_shot", label: "JS" },
  { key: "jump_range", label: "JR" },
  { key: "outside_def", label: "OD" },
  { key: "handling", label: "HA" },
  { key: "driving", label: "DR" },
  { key: "passing", label: "PA" },
  { key: "inside_shot", label: "IS" },
  { key: "inside_def", label: "ID" },
  { key: "rebounding", label: "RB" },
  { key: "shot_blocking", label: "SB" },
  { key: "stamina", label: "ST" },
  { key: "free_throw", label: "FT" },
];

export function PlayerRowExpanded({ snapshot }: Props) {
  return (
    <div
      className="px-4 py-3 grid grid-cols-4 gap-x-6 gap-y-1 text-sm"
      style={{ background: "var(--background)" }}
    >
      {SKILLS.map(({ key, label }) => {
        const value = snapshot[key] as number | null;
        if (value == null) {
          return (
            <div key={String(key)} className="flex justify-between text-gray-500">
              <span>{label}</span>
              <span>-</span>
            </div>
          );
        }
        return (
          <div key={String(key)} className="flex justify-between">
            <span className="text-gray-400">{label}</span>
            <span style={{ color: getSkillColor(value) }}>
              {value} <span className="text-gray-500 text-xs">({SKILL_LEVELS[value] || "?"})</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Build**

```bash
cd D:/ClaudeProjects/BB-project/web && npm run build
```

Expected: Build succeeds. All 5 files compile. No TypeScript errors. (Components are unused — that's fine; Next.js doesn't warn about unused files in `components/`.)

- [ ] **Step 7: Commit**

```bash
git add web/components/world
git commit -m "feat(world): add components (CountryMultiSelect, WorldPresets, FullSkillsBadge, ColumnVisibilityMenu, PlayerRowExpanded)"
```

---

## Task 5: Scaffold `/world/page.tsx` using the new components

**Files:**
- Create: `D:/ClaudeProjects/BB-project/web/app/world/page.tsx`
- Keep (untouched): `D:/ClaudeProjects/BB-project/web/app/opponents/page.tsx` — the old page stays live during this task so the user can compare side-by-side.

**Context:** Build the new page. Parallel to the existing Opponents page. Navbar still points to `/opponents`; user visits `/world` directly to test. Task 6 flips the switch.

- [ ] **Step 1: Create the page**

Create `web/app/world/page.tsx` with the following content. It's long; read carefully.

```tsx
"use client";

import { Fragment, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { POTENTIAL_LEVELS, getPotentialColor, getSkillColor } from "@/lib/constants";
import type { Player, SkillSnapshot } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { computeCurrentAge, staleSeasonDelta } from "@/lib/season";
import { useCurrentSeason } from "@/lib/useCurrentSeason";
import { CountryMultiSelect } from "@/components/world/CountryMultiSelect";
import { WorldPresets } from "@/components/world/WorldPresets";
import { FullSkillsBadge } from "@/components/world/FullSkillsBadge";
import { ColumnVisibilityMenu, type ColumnDef } from "@/components/world/ColumnVisibilityMenu";
import { PlayerRowExpanded } from "@/components/world/PlayerRowExpanded";

type SortField =
  | "name"
  | "age"
  | "position"
  | "potential"
  | "dmi"
  | "salary"
  | "skill_points"
  | "height"
  | "updated";

interface PlayerRow {
  player: Player;
  snapshot: SkillSnapshot | null;
  hasSk: boolean;
}

const SKILL_KEYS = [
  "jump_shot","jump_range","outside_def","handling","driving","passing",
  "inside_shot","inside_def","rebounding","shot_blocking","stamina","free_throw",
] as const;

const COLUMN_DEFS: ColumnDef[] = [
  { key: "age", label: "Age", defaultVisible: true },
  { key: "position", label: "Position", defaultVisible: true },
  { key: "potential", label: "Potential", defaultVisible: true },
  { key: "dmi_gs", label: "DMI + GS", defaultVisible: true },
  { key: "data", label: "Data", defaultVisible: true },
  { key: "updated", label: "Updated", defaultVisible: true },
  { key: "salary", label: "Salary", defaultVisible: false },
  { key: "skill_points", label: "TSP", defaultVisible: false },
  { key: "height", label: "Height", defaultVisible: false },
];

const COLUMN_STORAGE_KEY = "bb_world_columns_v1";
const SETTINGS_KEY_SEASON_OPPONENTS = "season_opponents";

function defaultVisible(): Record<string, boolean> {
  const v: Record<string, boolean> = {};
  for (const c of COLUMN_DEFS) v[c.key] = c.defaultVisible;
  return v;
}

export default function WorldPage() {
  const router = useRouter();
  const { currentSeason } = useCurrentSeason();

  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [starredCountries, setStarredCountries] = useState<string[]>([]);
  const [filterAge, setFilterAge] = useState<number[]>([]);
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterPotential, setFilterPotential] = useState<number>(0);
  const [filterU21, setFilterU21] = useState(false);
  const [filterIncludeSlovenia, setFilterIncludeSlovenia] = useState(false);
  const [filterHasFullSkills, setFilterHasFullSkills] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<SortField>("dmi");
  const [sortAsc, setSortAsc] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(defaultVisible);

  // --- Load column visibility from localStorage ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (raw) setVisibleColumns({ ...defaultVisible(), ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch {}
  }, [visibleColumns]);

  // --- Load starred countries from Supabase settings ---
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", SETTINGS_KEY_SEASON_OPPONENTS)
        .maybeSingle();
      if (data?.value?.countries && Array.isArray(data.value.countries)) {
        setStarredCountries(data.value.countries);
      }
    })();
  }, []);

  async function persistStarred(next: string[]) {
    await supabase
      .from("settings")
      .upsert({ key: SETTINGS_KEY_SEASON_OPPONENTS, value: { countries: next }, updated_at: new Date().toISOString() });
  }

  function toggleStar(country: string) {
    setStarredCountries((prev) => {
      const next = prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country];
      persistStarred(next);
      return next;
    });
  }

  // --- Load players + snapshots ---
  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);
    const { data: playersData } = await supabase
      .from("players")
      .select("*")
      .not("nationality", "is", null)
      .order("name");

    if (!playersData) {
      setLoading(false);
      return;
    }

    const playerIds = playersData.map((p) => p.id);
    const { data: snapshots } =
      playerIds.length > 0
        ? await supabase
            .from("skill_snapshots")
            .select("*")
            .in("player_id", playerIds)
            .order("captured_at", { ascending: false })
        : { data: [] };

    const latestMap = new Map<number, SkillSnapshot>();
    if (snapshots) {
      for (const s of snapshots) {
        if (!latestMap.has(s.player_id)) latestMap.set(s.player_id, s);
      }
    }

    const out: PlayerRow[] = playersData.map((p) => {
      const snap = latestMap.get(p.id) || null;
      const hasSk = snap ? SKILL_KEYS.some((k) => (snap as any)[k] != null) : false;
      return { player: p, snapshot: snap, hasSk };
    });

    setRows(out);
    setSelectedIds(new Set());
    setLoading(false);
  }

  // --- Derived: countries in dataset ---
  const allCountriesInDataset = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      if (r.player.nationality && r.player.nationality !== "Unknown") s.add(r.player.nationality);
    }
    return [...s].sort();
  }, [rows]);

  // --- Filtering & sorting ---
  const filtered = useMemo(() => {
    let result = rows;

    if (!filterIncludeSlovenia) {
      result = result.filter((r) => r.player.nationality !== "Slovenia");
    }
    if (filterCountries.length > 0) {
      const set = new Set(filterCountries);
      result = result.filter((r) => r.player.nationality && set.has(r.player.nationality));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => r.player.name.toLowerCase().includes(q));
    }
    if (filterU21) {
      result = result.filter((r) => {
        const a = computeCurrentAge(r.snapshot, currentSeason);
        return a != null && a >= 18 && a <= 21;
      });
    }
    if (filterAge.length > 0) {
      result = result.filter((r) => {
        const a = computeCurrentAge(r.snapshot, currentSeason);
        return a != null && filterAge.includes(a);
      });
    }
    if (filterPosition) {
      result = result.filter((r) => r.player.position === filterPosition);
    }
    if (filterPotential > 0) {
      result = result.filter(
        (r) => r.snapshot?.potential != null && r.snapshot.potential >= filterPotential
      );
    }
    if (filterHasFullSkills) {
      result = result.filter((r) => r.hasSk);
    }

    const sorted = [...result].sort((a, b) => {
      // DMI sort special case: empty DMI always sinks to bottom
      if (sortField === "dmi") {
        const av = a.snapshot?.dmi;
        const bv = b.snapshot?.dmi;
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return sortAsc ? av - bv : bv - av;
      }

      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortField) {
        case "name": aVal = a.player.name; bVal = b.player.name; break;
        case "age":
          aVal = computeCurrentAge(a.snapshot, currentSeason) || 0;
          bVal = computeCurrentAge(b.snapshot, currentSeason) || 0;
          break;
        case "position": aVal = a.player.position || ""; bVal = b.player.position || ""; break;
        case "potential": aVal = a.snapshot?.potential || 0; bVal = b.snapshot?.potential || 0; break;
        case "salary": aVal = a.snapshot?.salary || 0; bVal = b.snapshot?.salary || 0; break;
        case "skill_points": aVal = a.snapshot?.skill_points || 0; bVal = b.snapshot?.skill_points || 0; break;
        case "height": aVal = a.player.height || ""; bVal = b.player.height || ""; break;
        case "updated": aVal = a.snapshot?.captured_at || ""; bVal = b.snapshot?.captured_at || ""; break;
      }
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [
    rows, filterCountries, filterIncludeSlovenia, searchQuery, filterU21, filterAge,
    filterPosition, filterPotential, filterHasFullSkills, sortField, sortAsc, currentSeason,
  ]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === "name"); }
  }
  function toggleAge(age: number) {
    setFilterAge((p) => (p.includes(age) ? p.filter((a) => a !== age) : [...p, age]));
  }
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.player.id)));
  }
  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearAllFilters() {
    setFilterCountries([]);
    setFilterAge([]);
    setFilterPosition("");
    setFilterPotential(0);
    setFilterU21(false);
    setFilterIncludeSlovenia(false);
    setFilterHasFullSkills(false);
    setSearchQuery("");
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} players and all their snapshots? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const { data, error } = await supabase.from("players").delete().in("id", ids).select();
      if (error) alert(`Delete failed: ${error.message}`);
      else if (!data || data.length === 0) alert("Delete blocked by RLS policy. See opponents page for SQL hint.");
      else await loadPlayers();
    } catch (err) {
      alert(`Delete error: ${err}`);
    }
    setDeleting(false);
  }

  function handleCompareSelected() {
    if (selectedIds.size < 2) return;
    const ids = Array.from(selectedIds).join(",");
    router.push(`/compare?ids=${ids}`);
  }

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
      onClick={() => toggleSort(field)}
    >
      {children}
      {sortField === field && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
    </th>
  );

  const anyFilterActive =
    filterCountries.length > 0 || filterAge.length > 0 || filterPosition !== "" ||
    filterPotential > 0 || filterU21 || filterIncludeSlovenia || filterHasFullSkills ||
    searchQuery.trim() !== "";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">World</h1>
            <p className="text-xs text-gray-500 mt-1">{filtered.length} player{filtered.length !== 1 && "s"}</p>
          </div>
          <ColumnVisibilityMenu columns={COLUMN_DEFS} visible={visibleColumns} onChange={setVisibleColumns} />
        </div>

        <div className="mb-3">
          <WorldPresets
            allCountriesInDataset={allCountriesInDataset}
            starredCountries={starredCountries}
            onSetCountries={setFilterCountries}
            onClearAll={clearAllFilters}
          />
        </div>

        <div className="mb-4">
          <CountryMultiSelect
            countries={allCountriesInDataset}
            selected={filterCountries}
            starred={starredCountries}
            onChange={setFilterCountries}
            onToggleStar={toggleStar}
          />
        </div>

        <div
          className="rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm text-white focus:outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Age:</span>
            {[18, 19, 20, 21].map((age) => (
              <button
                key={age}
                onClick={() => toggleAge(age)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterAge.includes(age) ? "text-white" : "text-gray-400"
                }`}
                style={filterAge.includes(age) ? { background: "var(--accent)" } : { background: "var(--background)" }}
              >
                {age}
              </button>
            ))}
          </div>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-2 py-1 rounded text-xs text-white focus:outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
          >
            <option value="">All positions</option>
            {["PG", "SG", "SF", "PF", "C"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filterPotential}
            onChange={(e) => setFilterPotential(Number(e.target.value))}
            className="px-2 py-1 rounded text-xs text-white focus:outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
          >
            <option value={0}>All potentials</option>
            {Object.entries(POTENTIAL_LEVELS).map(([num, text]) => (
              <option key={num} value={num}>{num}+ ({text})</option>
            ))}
          </select>

          <button
            onClick={() => setFilterU21(!filterU21)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterU21 ? "text-white" : "text-gray-400"}`}
            style={filterU21 ? { background: "var(--accent)" } : { background: "var(--background)" }}
          >
            U-21 only
          </button>

          <button
            onClick={() => setFilterIncludeSlovenia(!filterIncludeSlovenia)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterIncludeSlovenia ? "text-white" : "text-gray-400"}`}
            style={filterIncludeSlovenia ? { background: "var(--accent)" } : { background: "var(--background)" }}
          >
            Include Slovenia
          </button>

          <button
            onClick={() => setFilterHasFullSkills(!filterHasFullSkills)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterHasFullSkills ? "text-white" : "text-gray-400"}`}
            style={filterHasFullSkills ? { background: "var(--accent)" } : { background: "var(--background)" }}
          >
            Full skills only
          </button>

          {anyFilterActive && (
            <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white transition-colors">
              Clear filters
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div
            className="rounded-lg p-3 mb-4 flex items-center justify-between"
            style={{ background: "var(--card-bg)", border: "1px solid var(--accent)" }}
          >
            <span className="text-sm">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={handleCompareSelected}
                disabled={selectedIds.size < 2}
                className="px-3 py-1 rounded text-xs text-white font-medium transition-colors disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Compare selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors"
                style={{ background: "var(--background)" }}
              >
                Deselect All
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-3 py-1 rounded text-xs text-white font-medium transition-colors"
                style={{ background: "#dc2626" }}
              >
                {deleting ? "Deleting..." : `Delete ${selectedIds.size}`}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {rows.length === 0
              ? "No players tracked yet. Scan rosters or the market with the extension."
              : "No players match your filters."}
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "var(--card-bg)" }}>
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2 w-8" />
                    <SortHeader field="name">Name</SortHeader>
                    {visibleColumns.age && <SortHeader field="age">Age</SortHeader>}
                    {visibleColumns.position && <SortHeader field="position">Pos</SortHeader>}
                    {visibleColumns.potential && <SortHeader field="potential">Potential</SortHeader>}
                    {visibleColumns.dmi_gs && <SortHeader field="dmi">DMI @ GS</SortHeader>}
                    {visibleColumns.salary && <SortHeader field="salary">Salary</SortHeader>}
                    {visibleColumns.skill_points && <SortHeader field="skill_points">TSP</SortHeader>}
                    {visibleColumns.height && <SortHeader field="height">Height</SortHeader>}
                    {visibleColumns.data && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                    )}
                    {visibleColumns.updated && <SortHeader field="updated">Updated</SortHeader>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const age = computeCurrentAge(row.snapshot, currentSeason);
                    const expanded = expandedIds.has(row.player.id);
                    const delta = staleSeasonDelta(currentSeason, row.snapshot?.bb_season ?? null);
                    return (
                      <Fragment key={row.player.id}>
                        <tr
                          className={`hover:bg-white/5 transition-colors ${
                            selectedIds.has(row.player.id) ? "bg-white/10" : ""
                          }`}
                          style={{ borderTop: i > 0 ? "1px solid var(--card-border)" : "none" }}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(row.player.id)}
                              onChange={() => toggleSelect(row.player.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {row.hasSk ? (
                              <button
                                onClick={() => toggleExpand(row.player.id)}
                                className="text-gray-400 hover:text-white text-xs"
                                aria-label={expanded ? "Collapse" : "Expand"}
                              >
                                {expanded ? "▼" : "▶"}
                              </button>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/players/${row.player.id}`}
                              className="font-medium hover:underline"
                              style={{ color: "var(--accent)" }}
                            >
                              {row.player.name}
                            </Link>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="text-gray-400">{row.player.nationality}</span>
                              <span>#{row.player.bb_player_id}</span>
                              <a
                                href={`https://www.buzzerbeater.com/player/${row.player.bb_player_id}/overview.aspx`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
                                title="Open in BuzzerBeater"
                                onClick={(e) => e.stopPropagation()}
                              >
                                ↗
                              </a>
                            </div>
                          </td>
                          {visibleColumns.age && (
                            <td className="px-3 py-2 text-sm">{age ?? "-"}</td>
                          )}
                          {visibleColumns.position && (
                            <td className="px-3 py-2 text-sm">{row.player.position || "-"}</td>
                          )}
                          {visibleColumns.potential && (
                            <td className="px-3 py-2 text-sm">
                              {row.snapshot?.potential != null ? (
                                <span style={{ color: getPotentialColor(row.snapshot.potential) }}>
                                  {POTENTIAL_LEVELS[row.snapshot.potential] || row.snapshot.potential}
                                </span>
                              ) : "-"}
                            </td>
                          )}
                          {visibleColumns.dmi_gs && (
                            <td className="px-3 py-2 text-sm font-mono">
                              {row.snapshot?.dmi != null ? (
                                <span>
                                  <span className="font-semibold">{row.snapshot.dmi.toLocaleString()}</span>
                                  {row.snapshot.game_shape != null && (
                                    <span className="text-gray-500">
                                      {" @ GS"}
                                      <span style={{ color: getSkillColor(row.snapshot.game_shape) }}>
                                        {row.snapshot.game_shape}
                                      </span>
                                    </span>
                                  )}
                                </span>
                              ) : "-"}
                            </td>
                          )}
                          {visibleColumns.salary && (
                            <td className="px-3 py-2 text-sm font-mono text-gray-300">
                              {row.snapshot?.salary != null ? `$${row.snapshot.salary.toLocaleString()}` : "-"}
                            </td>
                          )}
                          {visibleColumns.skill_points && (
                            <td className="px-3 py-2 text-sm font-mono">{row.snapshot?.skill_points ?? "-"}</td>
                          )}
                          {visibleColumns.height && (
                            <td className="px-3 py-2 text-sm text-gray-400">{row.player.height || "-"}</td>
                          )}
                          {visibleColumns.data && (
                            <td className="px-3 py-2 text-xs">
                              <FullSkillsBadge hasFullSkills={row.hasSk} seasonDelta={delta} />
                            </td>
                          )}
                          {visibleColumns.updated && (
                            <td className="px-3 py-2 text-xs text-gray-500">
                              {row.snapshot ? new Date(row.snapshot.captured_at).toLocaleDateString() : "-"}
                            </td>
                          )}
                        </tr>
                        {expanded && row.hasSk && row.snapshot && (
                          <tr>
                            <td colSpan={99} className="p-0">
                              <PlayerRowExpanded snapshot={row.snapshot} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd D:/ClaudeProjects/BB-project/web && npm run build
```

Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 3: Manual verification**

Run `npm run dev`, visit `/world` in the browser (not accessible from navbar yet — type URL manually):

- [ ] Page loads; players appear; default DMI sort descending (null DMI at bottom).
- [ ] Country picker: type "po" → Poland and Portugal surface; click to add as chip; backspace removes last chip.
- [ ] Star icon next to each country in the dropdown — click to toggle; refresh page, starred state persists (via Supabase settings row).
- [ ] Presets: All (clears countries), Europe (selects intersection with dataset), Season Opponents (only clickable after starring some countries), Clear (resets everything).
- [ ] Filters: search, age brackets, position, potential, U-21 only, Include Slovenia (toggling ON reveals Slovenian players), Full skills only.
- [ ] Columns menu: toggling Salary/TSP/Height adds/removes columns; refresh — preference persists.
- [ ] Expand chevron: appears only on rows with full skills; click expands inline skill grid; click again collapses. Works on multiple rows.
- [ ] Stale badge: Full skills color reflects seasonal delta (green this season, amber 1 season, red 2+).
- [ ] Multi-select: check 2+ rows → Compare selected button enabled → clicking routes to `/compare?ids=...`.
- [ ] Bulk delete still works (confirm, delete, row disappears).
- [ ] Name click navigates to `/players/[id]`.
- [ ] Old `/opponents` page still works identically (not broken).

- [ ] **Step 4: Commit**

```bash
git add web/app/world
git commit -m "feat(world): scaffold /world page alongside legacy /opponents"
```

---

## Task 6: Flip navbar to World + redirect /opponents + remove legacy page

**Files:**
- Modify: `D:/ClaudeProjects/BB-project/web/components/Navbar.tsx`
- Modify: `D:/ClaudeProjects/BB-project/web/next.config.ts` (add redirect `/opponents` → `/world`)
- Delete: `D:/ClaudeProjects/BB-project/web/app/opponents/page.tsx`
- Modify: `D:/ClaudeProjects/BB-project/CLAUDE.md` — update the Project Structure entry and any Web Dashboard Features references from "opponents" to "world".

**Context:** Once the user is satisfied with /world on live Vercel, cut over. Delete the old page, redirect the old URL, rename the navbar item.

- [ ] **Step 1: Update Navbar**

In `web/components/Navbar.tsx`, change the `navItems` array entry:

```ts
const navItems = [
  { href: "/slovenia", label: "Slovenia" },
  { href: "/world", label: "World" },
  { href: "/compare", label: "Compare" },
  { href: "/training", label: "Training" },
  { href: "/scout", label: "Scout" },
  { href: "/manual-entry", label: "Manual Entry" },
];
```

(Only the `/opponents` → `/world` line changes; `"Opponents"` → `"World"`. The rest of the navbar is untouched — Training/Scout removal is a later project's scope.)

- [ ] **Step 2: Add redirect in `next.config.ts`**

Read the current file. Add/merge a `redirects` async function:

```ts
// inside the Next config object
async redirects() {
  return [
    { source: "/opponents", destination: "/world", permanent: true },
  ];
},
```

If `next.config.ts` already exports a config with other options, merge in place. Do not overwrite unrelated keys.

- [ ] **Step 3: Delete legacy page**

```bash
rm D:/ClaudeProjects/BB-project/web/app/opponents/page.tsx
rmdir D:/ClaudeProjects/BB-project/web/app/opponents
```

- [ ] **Step 4: Update CLAUDE.md references**

Open `D:/ClaudeProjects/BB-project/CLAUDE.md`. Replace:

- `opponents/page.tsx` → `world/page.tsx`
- `# Opponent tracking by country (DMI-focused, country pills)` → `# World scouting view (multi-country, DMI + skills when available)`
- Any other `/opponents` mentions → `/world` (search the file).

- [ ] **Step 5: Build**

```bash
cd D:/ClaudeProjects/BB-project/web && npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Manual verification**

Run `npm run dev`:
- [ ] Navbar shows "World" between Slovenia and Compare.
- [ ] Clicking "World" → routes to `/world`.
- [ ] Visiting `/opponents` → 308/301 redirect to `/world`.
- [ ] `/world` page functional end-to-end (same checklist as Task 5 Step 3).
- [ ] No stray imports of the deleted page anywhere (TypeScript would have caught it).

- [ ] **Step 7: Commit**

```bash
git add web/components/Navbar.tsx web/next.config.ts web/app/opponents CLAUDE.md
git commit -m "feat(world): promote /world in navbar, redirect /opponents, remove legacy page"
```

---

## Post-plan: items deferred to separate work

Do **not** address these in this plan:

- Market-scan snapshots missing DMI (capture-pipeline bug) — separate investigation.
- `is_nt_player` rework (season-scoped semantics + roster parser unset logic) — separate project. Memory entry exists.
- Compare page rebuild (Futbin-style search + persistent set) — separate spec.
- Europe country list refinement based on real data — confirm with user after first use.

---

## Self-review notes

- **Spec coverage:** sections 2–11 of the design spec map to Tasks 1–6. Section 14 rollout slices align 1:1 with the tasks.
- **Type consistency:** `ColumnDef`, `SortField`, `PlayerRow`, `SkillSnapshot` usage is consistent across tasks.
- **No placeholders:** all code blocks are complete; no TBD or TODO markers.
- **Reversibility:** each task is a single commit; can `git revert` any one without breaking others (except Task 6 which deletes the legacy page — would need to restore from history).
