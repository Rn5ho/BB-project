# Progress Since Last Review (Slovenia page) — Design

**Status: approved 2026-07-13** (user delegated detail decisions; adjust UX after use).

## Problem

The NT manager wants a BB-style overview of training progress: green `+N` pops next
to skills showing how much each player improved **since he last reviewed the list** —
accumulating across syncs (a player unchecked since last offseason shows `+3/+4`),
resetting only when he says so.

## Design

### Baseline semantics

A global **"Mark as reviewed"** action stores one timestamp for the Slovenia list.
Deltas = latest full snapshot vs. the latest full snapshot at-or-before that
timestamp. Pops accumulate through any number of syncs until the button is pressed
again.

### Data

- New table `review_marks`: `id` serial pk, `scope` text unique (`'slovenia'`),
  `marked_at` timestamptz not null. Single row per scope, upserted. Drizzle schema
  entry + `drizzle-kit generate` migration.
- `listPlayers('slovenia')` adds a `baseline_full` CTE: per player, latest snapshot
  with `jump_shot is not null and captured_at <= marked_at`. When no mark row
  exists, the CTE matches nothing (deltas null; feature dormant).
- `PlayerListRow` gains:
  - `skillDeltas: Record<string, number> | null` — non-zero per-skill deltas
    (latest minus baseline), null when either side is missing;
  - `tspDelta: number | null` — latest TSP minus baseline TSP.
  Deltas are computed in JS by a pure helper `computeSkillDeltas(latest, baseline)`
  in `src/lib/domain.ts` (unit-tested).
- Edge cases: no mark yet → null deltas. Player with no pre-mark full snapshot
  (newly discovered) → null deltas (the existing "new" chip covers them).
- **Negative deltas (amended 2026-07-13)**: BB skills cannot drop before age 35, so
  a negative delta is a snapshot misread and is discarded — except **stamina**, the
  one skill that genuinely drifts down (~1 every few months), which is kept and
  shown red. `tspDelta` is the sum of surviving deltas (not raw TSP difference), so
  one misread skill can't drag Δ negative.

### UI (Slovenia variant only; World rows carry null deltas and render nothing new)

- **Skill cells**: `SkillCell` gains optional `delta` prop; renders a small
  superscript after the value — `+2` in `text-green-400`, `−1` in `text-red-400`.
- **Δ column**: TSP delta since review, right of TSP, sortable (`tspDelta` sort key,
  nulls sink), visible even when skill columns are hidden. Green positive / red
  negative / `–` when null.
- **ReviewBar** above the table on `/slovenia`: shows
  `Last reviewed: <Jul 13, 10:57 UTC>` (or "Never reviewed") + **Mark as reviewed**
  button. Client component calling server action `markReviewed()` (upsert
  `review_marks`, `revalidatePath('/slovenia')`). Pressing it zeroes all pops.

## Testing

- Unit: `computeSkillDeltas` (gain, drop, equal → omitted, null baseline/latest,
  missing single skill) and `sortRows` with the `tspDelta` key.
- Runtime: dev-server pass — deltas render, sort works, Mark as reviewed clears
  pops, next differing snapshot re-creates them.
