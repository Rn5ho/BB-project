# Training Planner v2 — Design

**Date:** 2026-07-14
**Status:** Approved (user: "Lets go", detailed feedback deferred to first testable build)
**Research archive:** `docs/research/training/` (all coefficients cited below live there)

> **Status update (end of 2026-07-14):** Phases A and B are SHIPPED, plus several
> items beyond this spec: the standalone `/training` lab (DB player or manual build),
> facilities modeling (gym cross-training scatter, training-court passive FT),
> sublevel-uncertainty ensemble bounds, the dev-validated additive elastic and
> 3-stage cap ladder, and — replacing the spec's "fixture class 5 grows in Phase C"
> assumption — a working own-team ground-truth pipeline TODAY
> (`training:scrape-history` + `training:replay`; 7 trainees, 98 pops, bbscout MAE
> 0.41 levels / 61% exact finals). See CLAUDE.md v2 section for the full shipped
> record. Remaining from §5: cohort board (product 2), coach handoff (3), reverse
> planner (4), ceiling evaluator (5) — i.e. Phase C/D. Phase C's inference now has
> both halves live (weekly position-minutes in DB + engine to explain pops), plus a
> new opportunity this spec didn't foresee: pop-anchored sublevel tracking from
> scraped/observed pop dates.

## Problem

v1's training simulator (`web/lib/training/`) produced predictions the user
couldn't trust: its constants were uncalibrated forum lore, its elastic-effect
direction is unsupported by any source (backwards vs. manual + both community
models), its Ball Handling table has a primary/secondary swap, and it projected
16 training weeks per season instead of the real 14. There was no way to
measure its accuracy, so there was no way to improve it.

The user (Slovenia U-21 NT manager) needs **long-horizon development planning**,
not a single-week calculator:

- project a prospect's skills over multiple seasons under a given training plan;
- plan backwards from a target NT build ("what training gets this 18-year-old
  NT-ready by 21?");
- evaluate recruits by potential-capped ceiling;
- see, for all ~820 tracked Slovenian 18–21 prospects, what training their club
  is *actually* running (inferred from position minutes + observed pops) vs.
  what it *should* run — and hand club coaches a concrete week-by-week plan.

Accuracy compounds over 50+ projected weeks, so calibration and honest
uncertainty are core requirements.

## What the recon established (2026-07-14, see research archive)

1. **CoachParrot's complete model extracted** from the SourceForge spreadsheet
   and verified against its own worked example. Provenance: least-squares fit
   of 2009–2013 crowd-sourced training logs.
2. **BuzzerIQ's API mapped** (33 training IDs, schemas, 37 recorded fixtures).
   Its two server-side models (coach_parrot, open_source) are usable as
   differential-test oracles. Its `solve` is erratic; its youth-trainer/court/
   FT/stamina handling is absent or a no-op — gaps we can beat.
3. **Weekly position-minutes are available**: BBAPI `boxscore.aspx` returns
   per-player minutes split by all five positions; `schedule.aspx` lists a
   club's matches. ~2,500–3,000 calls/week covers all tracked prospects
   (~10 min on Hetzner); a full-season backfill is ~1.5 h.
4. **The potential-cap formula is known** (Josef Ka, 2,276 samples): capped
   when `Σ(position_weights · skills) ≥ 8 + 2·potential` (max over positions);
   cap is a slowdown range (~pop every 6–7 weeks), not a wall.
5. **Salary formulas extracted** (Josef Ka base-300 + BB-USA base-245 variants),
   but BB announced a salary rework (Jun 2024, thread 324393) → multipliers
   must be refit against our own Neon salary+skills data, not hard-coded.
6. **One lineage warning**: nearly all community coefficients descend from the
   same 2009–2013 dataset. Agreement ≠ independent confirmation, and post-2013
   rebalances are the biggest systematic risk. Mitigation: our own
   observed-pops calibration flywheel (§5) + Discord dev-statement mining.

## Non-goals

- Not a general-audience public tool (single-user, like the rest of BB Scout v2).
- No game-shape/enthusiasm/DMI simulation in phase A–D (game shape is officially
  not a training-effectiveness input; GS/DMI modeling may inform sublevel
  estimation later).
- No automated actions on the BB account (plans are advisory; census infra is
  separate).
- v1 (`web/`) is untouched; everything lands in `v2/`.

## Architecture

Four layers, all in `v2/`:

```
src/lib/training/
  models/            # parameter sets (data only, provenance-tagged)
    coach-parrot.ts
    open-source-live.ts
    bbscout.ts       # our synthesis — the default
    types.ts         # Param<T> = { value, source, confidence }
  engine.ts          # pure TS weekly-step simulator (no React, no IO)
  ensemble.ts        # run N parameter sets -> central estimate + min/max bands
  optimizer.ts       # reverse planner (phase D)
  calibration/       # fixture replay + error reporting (vitest)
src/server/sync/minutes.ts   # weekly boxscore sync job (phase B)
src/server/training/infer.ts # eligibility + training inference (phase C)
```

### 1. Model layer

Three parameter sets implementing one shared shape (33 training types × 10
skills rate matrix + age/height/coach/youth curves + elastic spec + cap spec):

- **coach-parrot** — verbatim from the extraction
  (`docs/research/training/coachparrot/`).
- **open-source-live** — the deployed BuzzerIQ open_source behavior as recorded
  in `probes/` (NOT the stale GitHub file).
- **bbscout** (default) — CoachParrot structure with evidence-driven corrections
  and additions:
  - elastic: multiplicative on the trained skill. CP's symmetric form is
    `0.91^(trained − avg(linked))` (boosts when trained skill lags its linked
    set, penalizes when it leads); the boost-only variant clamps it at
    `max(1, ·)`. Which one the real game uses is exposed as a calibratable
    flag; forum consensus leans boost-only, so bbscout defaults to it;
  - potential cap: Josef Ka weighted-sum threshold, slowdown factor calibrated
    to the at-cap ~6–7-weeks-per-pop observation (≈ ×0.15) instead of CP's ×1/3
    — exposed as a parameter with wide uncertainty;
  - **minutes factor**: thresholds 45' (age 18–19, with 1' buffer) / 48'
    (20–26) / 40' (27+) from the manual; sub-threshold curve = linear
    (marked `estimate`, wide band);
  - youth trainer: multiplier for ages 18–19, seeded from BuzzerIQ coach_parrot
    probes (per-skill boost), confidence `estimate`;
  - ST/FT: CP flat rates (2/3 and 1/2 lvl/week) as `fitted`;
  - 14-week seasons.

Every parameter is `{ value, source: <research-archive citation>, confidence:
official | measured | fitted | estimate }`.

Sub-models (shared by products): salary (Josef Ka structure; deflation +
multipliers refit against current Neon data on a schedule, stored with the
fit date), potential cap, sublevel initialization (default displayed − 0.5;
pluggable for salary/DMI-informed estimates later).

### 2. Engine

Pure function: `(playerState, weekConfig, params) -> weekResult`, plus
`project(playerState, plan, params) -> projection` over up to ~10 seasons with
age pops at season boundaries. Skills are decimals (sublevels); displayed
values ceil; pops = integer crossings. Training eligibility: a week's training
applies at full rate only if the player's minutes at the training type's
qualifying positions meet the age threshold — the engine takes per-week minutes
(actual from DB, or assumed-full for hypothetical plans).

`ensemble.ts` runs {coach-parrot, open-source-live, bbscout, bbscout-low,
bbscout-high} and returns central estimate (bbscout) + band (min–max across
runs). All projections in the UI show bands. bbscout-low/high are built by
pushing each `estimate`/`fitted`-confidence parameter to its documented range
ends.

### 3. Calibration harness

`calibration/` contains fixture classes + a vitest suite + an error report
(a table printed by a script and checked in tests against regression
thresholds):

1. **Oracle fixtures** — our coach-parrot and open-source-live implementations
   must reproduce the 37 recorded BuzzerIQ responses within tolerance
   (proves faithful extraction; new fixtures recordable via `run-probes.sh`).
2. **Spreadsheet fixtures** — CoachParrot's worked examples.
3. **Forum observations** — digitized measured logs (weeks-per-pop table,
   polskidude/Ali24/CitB experiment rows) as weak assertions (right order of
   magnitude, right ranking).
4. **Salary refit** — least-squares fit of ln(salary) on skills over current
   Neon players; test asserts fit quality and stores refit coefficients.
5. **Own observations** (grows from phase C) — inferred training weeks +
   observed pops from our snapshot DB; the harness scores each model's
   predictions and reports per-model MAE. This is the long-term accuracy
   answer and the arbiter between conflicting coefficient sets.

### 4. Data pipeline (phase B/C)

New Drizzle tables:

- `matches` — match_id pk, home/away team ids, type, start_time, season.
- `player_match_minutes` — match_id + player_id pk, min_pg..min_c, is_starter.
- `training_observations` — player_id + week_start pk: eligible-training set
  (jsonb), observed pops (jsonb, from snapshot deltas), inferred training type
  + confidence, minutes summary. Source: own-team | inferred.
- `training_plans` — id, player_id, name, target build (jsonb), weeks (jsonb
  array of training-type ids + expected minutes), status, notes, updated_at.

Weekly Hetzner job (after player sync): distinct owner clubs of tracked 18–21
prospects → `schedule.aspx` (season) → new finished countable matches
(league/cup/scrimmage/PL; exclude B3/ASG/NT per manual) → `boxscore.aspx` →
upsert minutes for tracked players. 150–200 ms pacing, same session reuse as
existing sync. One-off season backfill script. Week bucketing keyed to the BB
training-update time (resolve empirically from our own team's update; store as
a setting).

Inference job (phase C): per player-week, minutes × the 33-type position
matrix → could-have-trained set; joined with pops between consecutive weekly
snapshots → likely training (simple scoring first: which eligible training
best explains the pops under bbscout rates; upgradeable later). Results feed
the cohort board and the calibration harness.

### 5. Products (priority order)

1. **Development tab** on `/players/[id]`: position-minutes strip per week,
   inferred club training, cap-proximity bar (weighted-sum % per position),
   multi-season projection chart with bands (reuse hand-rolled SVG charts),
   plan editor (week blocks with training-type picker seeded from archetype
   templates).
2. **U-21 cohort board** (`/planner`): all Slovenian 18–21 prospects, columns:
   inferred current training, projected age-21 TSP under current vs. optimal
   plan, gap, cap headroom. Sort by gap → outreach priorities.
3. **Coach handoff**: render a player's plan as pasteable BB-mail text
   (Slovene + English) with week-by-week schedule and minutes requirements.
4. **Reverse planner**: beam search over training-type sequences (archetype
   templates as starting population) maximizing target-build fit by a deadline
   age, respecting minutes reality and cap slowdown. Our own optimizer —
   BuzzerIQ solve is not reliable.
5. **Scout ceiling evaluator**: projection-at-optimal-training to age 21/22
   with cap, surfaced on player rows / archetype views.

Archetype plan templates (from the user's established U-21 conventions, edit-
able data): e.g. outside draftee ≈ 1–1.5 seasons 1on1 guards/wings → OD/JS/
PA/JR; bigs ≈ IS→ID→RB or SB→ID→RB.

## Phasing

- **A — model layer + engine + calibration harness** (pure lib + tests +
  tiny CLI for dev use). Shippable: trustworthy simulate with bands, proven
  faithful to both reference models.
- **B — minutes pipeline + Development tab** (tables, weekly job, backfill,
  projection UI + plan editor).
- **C — inference flywheel + cohort board** (+ observations feeding
  calibration; recalibration loop documented).
- **D — reverse planner + coach handoff + ceiling evaluator.**

Parallel data tasks (not blocking): Discord export mining of both servers for
dev statements (targets = the top-10 unknowns in `model-comparison.md`);
user's gathered files ingestion into `docs/research/training/user-notes/`;
forum re-request of rhyminsimon's spreadsheet.

## Risks & open questions

- **2013-era coefficients vs. 2026 game** — mitigated by phase-C flywheel;
  until then, bands stay honest about it.
- **Elastic boost-only vs. symmetric** — calibratable flag; forum evidence
  leans boost-only.
- **Sub-threshold minutes curve unknown** — plans always target full minutes,
  so this mainly affects inference confidence, not plan quality.
- **BB salary rework (2024)** — salary sub-model refit from own data; cap
  formula (skill-sum based) is season-invariant and unaffected.
- **BB training-week boundary** — resolve empirically in phase B.
- **Oracle courtesy** — BuzzerIQ/Buzzer-Manager probes stay rate-limited,
  recorded once, replayed from fixtures in CI (never live in tests); credit
  both tools in the UI footer/docs. Consider contacting BuzzerIQ's author via
  their Discord.

## References

- Research archive: `docs/research/training/` (README = index + provenance chain)
- Recon + sweep run journals: session workflows `wf_08c034e5-512`, `wf_890d53af-acd`
- v1 model for comparison: `web/lib/training/{data,engine}.ts`
- Manual: `BBmanual.txt` (training §, lines ~684–723)
