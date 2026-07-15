# Training planner: flexible horizon targets + reverse planner — design

**Date:** 2026-07-15
**Status:** approved (user delegated design authority; conversation 2026-07-15)
**Depends on:** training engine Phases A–C (engine, bridge, ProjectionPanel, PlanEditor, training_plans)

## Problem

1. **Horizon math is manual.** To answer "what will this player look like when they turn 21?"
   the user must hand-compute: player's current age → seasons remaining → current season week →
   weeks remaining, then type per-block week counts that sum to it. Every week that passes
   invalidates the arithmetic. Variants matter too: "5–7 weeks *into* the age-21 season"
   (consolation-tournament prep) is a moving target of the same kind.
2. **Forward-only planning.** The tool answers "given this plan, what build results?" but not
   the question the user actually starts from: "given the build I want, what plan gets closest?"
   (Phase D product 4, pulled forward.)

Two features, one spec, shipped in two waves. Feature B builds on Feature A's horizon.

---

## Feature A — Flexible horizon targets

### Semantics (the load-bearing convention)

A **horizon target** is an `(age, week)` pair meaning: *project the player up to the moment
they enter season-week `week` of their age-`age` season* — i.e. train every week from now up
to but **not** including the target week.

Absolute week index: `absWeek(age, week) = age * 14 + (week − 1)`.
Horizon length: `horizonWeeks = max(0, absWeek(target) − absWeek(now))`.

**The current season week counts as upcoming** (not yet trained): `seasonWeekOf` buckets by
7-day windows from season start and BB's training update lands at the end of the bucket, so
mid-week the current week's training hasn't happened. This is consistent with
`project(startWeekOfSeason = w)`, whose first plan week trains *at* week `w`.
Worked example: age 20, week 6, target (21, 1) → `21·14 − (20·14 + 5) = 9` weeks
(trains weeks 6–14 inclusive, then the player enters age 21 week 1). This deliberately
resolves the horizon-boundary convention question flagged in the Phase C backlog
(board.ts still uses the other convention; aligning it is a separate follow-up, out of scope).

Presets (fill the two fields; the pair stays editable):
- **Start of age-21 season** → (21, 1)
- **End of U-21 / age-21 season complete** → (22, 1)
- **End of this season** → (currentAge + 1, 1)
- **Custom** → no target; today's behavior (raw week counts).

Target bounds: age 19–22, week 1–14. Target at or before now → `horizonWeeks = 0`, editor
shows "target is in the past" instead of projecting.

### Editor behavior (derived last block)

Pure helper `fitBlocksToHorizon(blocks, horizonWeeks)` → `{ blocks, overflowWeeks }`:
the **last** block's weeks are replaced by `max(0, horizonWeeks − Σ earlier blocks)`;
`overflowWeeks = max(0, Σ earlier blocks − horizonWeeks)`. With one block it absorbs the
whole horizon.

- With a target set, the last block's weeks input is disabled, shows the derived value,
  labeled "auto". Editing any *earlier* block just re-derives. To hand-edit the last block
  the user switches the picker to Custom (one click; blocks materialize as-is).
- `overflowWeeks > 0` → red note: "earlier blocks overshoot the target by N wks — projection
  stops at the target". Projection uses `planToWeeks(fitted).slice(0, horizonWeeks)`.
- Applying a template with a target set: template blocks load, last block immediately
  re-derived (template's own last-block length is advisory under a target).

### Persistence (self-updating plans)

`training_plans` gains nullable `horizon_age` + `horizon_week` int columns (migration 0009;
null = custom = all existing rows, fully backward compatible). Save materializes the
*fitted* blocks (so the row is meaningful standalone) plus the target. On load, when a
horizon is present the last block is **re-derived from today's** age/season-week — the plan
shrinks as real weeks pass, no manual recalc ever. `savePlan` relaxes per-block validation
from `weeks ≥ 1` to `weeks ≥ 0` (a derived last block can legitimately be 0 when earlier
blocks exactly fill the horizon); everything else unchanged.

### Ambient context

- Status line above blocks (when age known): `Now: age 20 · wk 6 · 9 wks to age-21 season ·
  23 wks to end of U-21` (both computed with the same helpers).
- Per-block annotation: where each block starts/ends in (age, week) terms, via pure
  `blockBoundaries(blocks, nowAge, nowWeek)` — e.g. `20·wk6 → 21·wk1`, muted text per row.
- Chart: `BandChart` gains optional `markers: Array<{ x, label }>` — vertical dashed lines;
  ProjectionPanel emits one per season boundary (where the projected player ages up),
  labeled with the new age. Derived from `result.central.weeks[i].seasonWeek === 14` →
  marker at `x = i + 1`, label `age (weeks[i].age + 1)`.

### Plumbing

- `PlanValue` gains `horizon: { age: number; week: number } | null`.
- PlanEditor gains `currentSeasonWeek` prop (the pages already compute `startWeekOfSeason`;
  same number, threaded through ProjectionPanel).
- Training-lab **manual mode** switches from hardcoded `startWeekOfSeason={1}` to the real
  current week (the manual player's age is "now" anyway) — makes horizon targets work there.
- `getActivePlan` returns the horizon; DevelopmentSection/TrainingLab pass it through and
  include it in `savePlan` calls.

### New module: `src/lib/training/horizon.ts` (pure, tested)

`absWeek`, `horizonWeeks(now, target)`, `HORIZON_PRESETS(currentAge)`,
`fitBlocksToHorizon`, `blockBoundaries`. Unit tests: worked example above; week-14 and
week-1 edges; past-target clamp to 0; overflow; zero-length last block; boundaries crossing
multiple seasons.

---

## Feature B — Reverse planner

### Input

`TargetSpec` = per-skill (10 engine skills; stamina/FT excluded in v1 — gym/TC/team weeks
cover them and they're outside `Skills`):
- `target` displayed level (1–20), defaulting to current displayed; a skill is **targeted**
  iff target > current.
- `priority`: High / Normal / Low → weights 3 / 1 / 0.4 (only meaningful when targeted).

Plus: horizon in weeks (from the Feature A picker — panel defaults to the plan's target, or
End-of-U-21 preset when the plan is Custom), staff/facilities from the current plan value
(coach, YT, gym, TC), full minutes assumed, model = BBSCOUT (single model for search speed;
the resulting plan gets the full ensemble band as usual once loaded into the editor).

### Objective (three tiers, lexicographic)

Internal-sublevel target threshold: `τ(T) = T − 1 + 0.01` (minimum sublevel whose
`ceil` displays T — the same ceil rule as engine pops). A skill **hits** at the first week
its sublevel ≥ τ; **shortfall** = `max(0, τ − final)`.

1. **Weighted shortfall at deadline**: `Σ weight_k · shortfall_k` over targeted skills.
2. **Weighted earliness**: `Σ weight_k · (hitWeek_k ?? horizon + 1)` — among equal-shortfall
   plans (including the reachable case where all shortfalls are 0), high-priority skills
   finish first. This is what answers "can HA be done by week 5–7 of the age-21 season".
3. **Total TSP** (desc) — leftover weeks go wherever they help most.
   Final tie-break: fewer training switches.

No hard per-skill deadlines in v1 — the hit-week column plus priorities is the soft version;
a "must finish by" knob is a future addition if needed.

### Search: beam search over weekly training choices

`src/lib/training/optimize.ts` (pure TS, client-side, no deps):

- Actions = skill trainings only (catalog ids 1–31; stamina/FT excluded from the action set).
- State per beam entry: engine skills + ft/stamina + age/seasonWeek cursor, last trainingId,
  plan-so-far, per-target hit weeks. Stepped with the real `weekStep` (BBSCOUT) — so evolving
  elastic (e.g. 1on1 inflating HA, then OD harvesting the HA→OD gap) is *discovered by
  search over the true simulator*, not hard-coded.
- Each week: expand every beam entry × every action, score, keep best `BEAM_WIDTH` (default
  ~128). Pruning score = tier-1 shortfall computed on the current state, plus a small
  **switch penalty** (~0.02 levels per switch accumulated) — enough to make blocky,
  club-communicable plans win among near-equals without distorting real trade-offs.
- Dedup within a beam step: key = lastTrainingId + skills rounded to 2 decimals; keep the
  better entry.
- Cost envelope: 56 weeks × 128 beam × 31 actions ≈ 220k `weekStep` calls — well under a
  second in the browser; runs synchronously behind an "Optimize" button with a busy state.
- Terminal ranking by the full three-tier objective. Runners-up: next-best entries whose
  **block signature** (sequence of distinct trainings after collapsing runs) differs from
  the best; up to 2 shown.
- Public `evaluatePlan(state, weeklyTrainingIds, opts)` helper returns the same score/hit
  structure for an explicit plan — used by tests to guarantee search stepping ≡ `project()`.

### Output UI — `TargetBuildPanel` (integrated in ProjectionPanel, so both the player page
and the training lab get it)

Collapsible "Target build" card:
- 10-row grid: skill name · current displayed → target `BoundedNumberInput` (1–20) ·
  priority select (N/H/L, shown once targeted).
- Horizon mini-picker (shared `HorizonPicker` component with Feature A) + Optimize button.
- Results: **verdict line** ("Build reachable by age 21 wk 4" / "Not fully reachable —
  best effort leaves HA −0.8, OD −1.5"), per-skill table (target, priority, projected,
  ✓ hit week or red shortfall), and best + runner-up candidates as selectable chips with
  block summaries. **"Use this plan"** loads the candidate's collapsed blocks into the
  PlanEditor (ordinary editable blocks; ensemble band, cap bars, save — everything works
  as for a hand-built plan).

### Optimizer tests

1. Single dominant target with generous horizon → plan is overwhelmingly that skill's
   training; hit week reported and consistent with `project()`.
2. Ordering discovery: a two-skill target where training A-then-B strictly beats B-then-A
   under the model (elastic pair) → optimizer's plan scores ≤ the reversed hand plan
   (via `evaluatePlan`).
3. Unreachable targets → verdict unreachable, positive shortfall, plan length = horizon.
4. Blockiness: single-target run yields a small number of contiguous blocks (≤3).
5. `evaluatePlan` ≡ `project()` finals for the returned plan (drift guard).
6. Priorities: High-priority target hits no later than it would as Normal in the same
   scenario (weak monotonicity sanity).

---

## Out of scope

Skill-priority hard deadlines; stamina/FT targets; minutes-forecast integration (full
minutes assumed); multi-player/club plan reconciliation; `/planner` board changes
(including aligning `weeksToEndOfAge21` to the new convention — noted as follow-up);
web-worker offloading (unnecessary at measured cost).

## File inventory

**Wave A:** `src/lib/training/horizon.ts` (+test) · `PlanEditor.tsx` (picker, derived last
block, status line, annotations) · `ProjectionPanel.tsx` (thread props, truncate at horizon,
markers) · `BandChart.tsx` (markers prop) · `DevelopmentSection.tsx` / `TrainingLab.tsx`
(plumbing, manual-mode week fix) · `players/[id]/actions.ts` (horizon param, weeks ≥ 0) ·
`db/schema.ts` + migration `0009_plan_horizon.sql` · `queries/minutes.ts` (getActivePlan).

**Wave B:** `src/lib/training/optimize.ts` (+test) · `HorizonPicker.tsx` ·
`TargetBuildPanel.tsx` · ProjectionPanel integration.
