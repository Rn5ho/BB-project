# Market-Derived U-21 Archetypes + Training Plans — Design Spec

Date: 2026-08-04 · Season pin: **72** (rollover to 73 imminent, ~2026-08-13) · Status: awaiting owner sign-off
Reviewed by: 13-agent adversarial design review (data/domain/method/integration, all 8 substantive findings confirmed) + 10-agent Greek-workbook analysis. Owner corrections folded in (training-order balance, age-20 defense season, elastic catch-up mechanism).

## 1. Goal

Learn what the world's best **U-21 training programs** produce by analyzing the season-72 season-end transfer flood (finished U-21-track builds sold when eligibility ends), derive data-driven archetypes from it, and produce training plans that reach those builds with the payoff landing in the age-21 U-21 WC season. Season 73 (starting ~2026-08-13) IS a U-21 World Championship season — today's age-20 tier is the season-73 WC squad, making it the most operationally urgent output.

**Deliverable: analysis report first** (`docs/research/market-archetypes/REPORT.md`). Owner reviews; only approved archetypes/templates get encoded into `DEFAULT_ARCHETYPES` + `PLAN_TEMPLATES` in a second step.

Explicit non-goal: senior-NT-track builds (2–3 seasons of 1on1 → DR/HA 20+, defense deferred to suppress salary). Those are a different training economy and are deliberately absent from this cohort.

## 2. Data sources

1. **Market flood cohort** (primary): `snapshots` with `source='market'`, `season=72`, `age=21` (age-20 sheet: `age=20`), captured 2026-07-10 → season-72 end, latest full-skill snapshot per player, excluding `is_utopian` and `is_rookie_listing`. Pinned on raw snapshot fields — never derived age — so the analysis survives the rollover and re-runs next season by changing one `SEASON` constant. Known-bias note: Jul 23–Aug 2 coverage was suppressed by BB's 1000-result search cap (fixed Aug 3 by per-age sweeps); cohort skews toward Aug 3+ captures.
2. **Greek U-21 workbook** (external benchmark): weekly full-roster skills+GS, weeks 6–14 S72, Euro bronze. 14/17 players matched in our DB (all age 21; potentials 7×1, 8×4, 9×5, 10×4); 9 are in the flood (sellers: Arcadia Oaks, Aetolian Griffon Vultures, Rodon ×3 each); market snapshot skills identical to coach's wk-14 records (validates both datasets). Parsed CSVs to be checked into `docs/research/market-archetypes/greece-s72/`. **Benchmark, not ceiling** (owner-stated): the flood contains stronger builds than Greece's roster — measured, Greek outside starters sit ~p60–p75 of the elite market pool and the Greek inside median equals market p90. All thresholds/targets derive from the market cohort; Greece only validates shapes, floors, and in-season timing.
3. **Slovenian census universe** (`source='census'`): uncensored 18–21 population — the validation set for *young* tiers (on-track young players never appear on the market; market age-18/19/20 listings are washouts/rebalancing and serve as lower-bound context only).
4. Engine + archetype code: `v2/src/lib/training/` (bbscout calibrated MAE 0.41), `v2/src/lib/archetypes/`.

## 3. Part 1 — cohort construction

- **Three groups** via balance score `b = OSP/6 − ISP/4` (per-skill means; raw OSP>ISP is 6:4 biased), δ = 1.0 displayed level (tunable):
  - **Outside**: b ≥ +δ and height ≤ 201 cm
  - **Inside**: b ≤ −δ and height ≥ 203 cm
  - **Wing/Forward**: everyone else (measured ~260 at age 21) — recovers the 27% the two-group frame discarded, incl. tall wings and combo-PFs (23 elite members vs the entire elite Inside pool's 16). Short inside-leaning players (b ≤ −δ, h ≤ 201; n≈11) go to an appendix.
- **Filters before clustering**: exclusions above + potential floor only (≥7 outside/wing, ≥8 inside). **No defense floor, no TSP gate** — the review proved floor-first is circular (the report must be able to state the market's verdict on defense: 69% of elite-TSP outside carry OD≥15, 89% of inside carry ID≥16) and the TSP top-15% gate starved the sample to N=12/8. Measured pools at these settings: outside ~471, inside ~122, wing/forward ~260.
- Never use `players.best_position` for anything (Greek check: 183cm listed "C", 216cm listed "SF").

## 4. Clustering

- **Shape space**: 10 rate skills, each player's vector centered on his own 10-skill mean (removes the quality axis so clusters = build families, not tiers). No cross-player z-scoring (run z-scored variant once as sensitivity check; report adjusted-Rand).
- **Method**: Ward hierarchical primary (deterministic, dendrogram in report) + fixed-seed k-means cross-check (≥50 restarts, seed recorded). k via silhouette over k=2..5 (2..4 for Inside), with a **no-structure escape**: best silhouette < ~0.20–0.25 → one archetype for that group (median/p25 profile).
- **Stability**: ~100 bootstrap resamples, per-cluster Jaccard vs full-sample solution; mean < 0.6 → flagged untrustworthy (supersedes the naive size-8 flag). Split-half (capture-date halves) agreement reported with the coverage-gap caveat.

## 5. Per-cluster reporting

Size, centroid, p25/p50/p75 per skill (incl. ST/FT — needed to set data-driven ST/FT constraint values), height/potential/salary/starting-price distributions, elite share (TSP10 ≥ 100 = NT-track entering-21 benchmark), top-15%-TSP "cream" medians, OD/ID distribution + floor pass rates, near-cap % (existing cap model: ≥90% and ≥100% of `8+2·pot` pos-weighted), distinct-seller count (trust indicator), 3 example players with BB links. Salary labeled "as of season-72 start (lags final training)" — informational only, never a filter.

## 6. Archetype authoring (from clusters)

- Thresholds from each cluster's **floor-passing elite members'** p25 (per-cluster n printed; n<5 → fall back to cluster p75, mark provisional).
- **Lean rules**: 4–6 conditions max — defining skills only (centroid ≥ group elite mean + 1.5 levels, cap 5) + the group's defense floor + potential/height. Never all-10-skills (strict-AND evaluator: 0.75¹⁰ ≈ 5.6% joint pass).
- **Defense floors (authoring rules; calibrated by market pass rates + medal roster)**: SG/SF OD ≥ 15; PG OD ≥ 14 *with* elastic-feeder compensation (HA/DR elite); Inside ID ≥ 16 (medal-team mode; nobody on the bronze roster reaches 18 — do not author 17–18 floors); **Wing/Forward: cluster-conditional** — wing-shaped clusters (OSP-leaning, e.g. tall 3&D) get OD ≥ 14–15; forward-shaped clusters (combo-PFs, which carry OD 7–8 / ID 16) get ID ≥ 16; each cluster is floored on the defense skill its own members actually carry. Floors are minimums — cluster-derived `>=` thresholds come from the market elite p25 and may sit above them.
- **Gates before the report ships a rule**: self-match ≥ 70% of the source cluster (relax worst skill p25→p10 one at a time until passed); specificity columns (match rate vs full group elite + vs other clusters; majority-matcher flagged non-distinct); **executed match rates** through the real `merge.ts`/`evaluate.ts` against (a) source cluster, (b) full swept 18–21 market, (c) Slovenian roster.
- Keys `mkt72-*`, names prefixed `Market:` — coexist with (never silently replace) hand-authored defaults.
- **byAge tiers — asymmetric, mechanism-aware** (owner-specified, engine-verified):
  - *Outside*: 18/19 tiers require the **elastic feeders** (HA/DR on track), NOT defense — OD may lag (OD 7 @ 19 with HA 17 is on-track; same OD with HA 10 is not). Age-20 = the heavy-defense season (single-position OD at low levels runs ~0.45–0.5 lvl/wk + `od←ha` elastic 0.007·(HA−OD) ≈ OD 7 → 14–15 across the season; height/coach/youth-trainer/gym multipliers all apply and all live in the engine). Entering-21 band OD 12–15; floor finished during the WC season (~wk 10–13).
  - *Inside*: only 3–4 skills to train → ID rises early; 19/20 tiers carry real ID requirements; entering-21 ID ≥ 15 (Greek centers entered at 15–17). Bigs are the fieldable-at-20 group.
  - *Tier-21 semantics*: two checkpoints — entry band at season start (usable), hard floor by ~wk 10–13 of the WC season (finished). Season-end p25 build lives in the plan/report, not the matching tier.
  - Age-20 secondary sheet uses its own floors (OD ≥ 11 / ID ≥ 12, the percentile-equivalents; constants `AGE20_OD_FLOOR`/`AGE20_ID_FLOOR`) — the age-21 floors keep 8 of 556 twenty-year-olds and must never be reused there. Any back-projection landing at/above age-21 floors at age 20 = optimizer error.

## 7. Part 2 — training plans

- **Anchor**: entering age 21 = "great and usable" (primaries high, feeders in place, defense at entry band); the age-21 season is a **finishing phase** (+1–3 levels on primaries and defense; Greek observed closure capacity ≤ +2 OD / +3 ID per half-season at age 21). End-of-21 reported as stretch line only. Compute horizons with `horizonWeeks(now, {age, week})` — never `board.weeksToEndOfAge21` (stale convention; fix or bypass).
- **Flow**: beam search (`optimize.ts`) proposes a candidate plan per cluster (may target the fuller p25 profile; encoded rules stay lean) → owner rounds it into a blocky template → `project()` **forward-simulates** the approved template from three draftee starts (p25/p50/p75 of the 621-rookie intake census, carrying the height spread) → lower-envelope states entering each age = byAge tiers (displayed ints, −1 slack at 18/19, monotonicity enforced, loud failure if violated) → tiers validated against the **Slovenian census** (not market young listings).
- Defense floors enter the search as **soft penalties**, not hard constraints (a hard constraint prunes plans that replicate the actual medal roster, which fielded 3 sub-floor players).
- **Full-rule end-state validation**: run `evaluateArchetype` on the projected end state (incl. ST/FT via engine, TSP, height/potential) — catches `<=`-cap violations from secondary rates/elastic that `targets.ts` silently drops ('<=', ST/FT, attributes never become optimizer targets). Feasible = `reachable` AND full-rule match; every failing check listed.
- Feasibility reported under **neutral staff** (coach 5/YT 5 — the Slovenian-club prescription) and **elite staff** (L6–7 + gym 2–3 — how observed builds arose).
- Engine notes encoded in templates: season week 14 is a NORMAL training week but with fewer games (no 3-game week) — minutes scarcity makes narrow 1–2-position trainings underperform, so clubs commonly pick multi-position trainings that week; since projections assume full minutes, plans should prefer broad trainings for week 14 and treat narrow-training week-14 gains as optimistic *(owner-corrected 2026-08-04 — replaces an earlier wrong "clubs switch to GS training in week 14" note derived from an over-read of the Greek workbook's censored wk-14 capture)*; zero in-season ST weeks (budget decay ~−0.2/half-season); FT is passive training-court income (~0.06 pops/player-wk — never budget FT weeks in-season); plan annotation shows interleaved 2–3-week blocks + per-archetype finishing-delta table (what the final season adds), not a rigid phase story; sanity check: simulated elite-plan pop rate at levels 15–18 must fall in 0.6–0.85/wk (Greek observed 0.84).

## 8. Report structure (`docs/research/market-archetypes/REPORT.md`)

Header: season, window bounds, capture timestamp, re-run command. Sections **ordered by NT urgency** (age-20 tier first — they are the season-73 WC squad):

1. Cohort & funnel (counts at every step; coverage caveat)
2. Clusters per group (stats of §5, dendrograms, stability)
3. Proposed archetypes (paste-ready `DefaultArchetype[]`, gates of §6, executed match rates)
4. Training plans + feasibility (§7), finishing-delta tables
5. **External benchmark: Greece U-21 (Euro bronze S72)** — roster-vs-cluster nearest-centroid table (shared normalizer with the clustering), floor pass rates Greece vs market, TSP strip vs pool percentiles + NT-track curve, pops-by-skill×week heatmap (semis/finals annotated), and an **above-bronze share** per cluster: how many members strictly exceed Greece's position-equivalent starters — shows where the world frontier sits above the medal standard. Caveat box: n=17, one federation, no ages in workbook (DB supplied them), coach-recorded SB=21 above display cap, wk14 censored.
6. **Slovenia gap analysis** — every tracked 18–21 prospect: nearest cluster + distance, per-skill gap vs his age tier, feasibility from his own current state under his club's inferred training. **Age-conditional at-risk logic**: 18/19 graded on elastic feeders; 20 on whether defense training is happening (training_observations); entering-21 on gap vs ≤3-level closure capacity.
7. Caveats & provenance (selection framing: "what top U-21 programs sell"; senior-track exclusion is a feature; market young listings = censored lower bound)

## 9. Library changes proposed by the data (owner approves in report review)

- Relax `defensive-center` IS cap `<=7` → `<=9` (Antonopoulos-class rim protectors fail only that).
- New families expected from clustering, named by the Greek exemplars: shot-block-specialist PF (ID≥16, SB≥17, no IS req), driving-big / point-forward (HA≥15, DR≥16, IS≥16).
- Recalibrate or U-21-retire `playmaker` (PA≥13), `scoring-guard` (JR≥13), `sharpshooter` (JR≥15): elite U-21 reality tops out PA 10 / JR 12.
- `slasher` is too loose (matched 11/17 of the Greek roster) — tighten with a defining-skill condition or split.

## 10. Implementation artifacts

- Script: `v2/scripts/training/derive-archetypes.mts` (Part 1; Part 2 behind `--plans`), npm `training:archetypes`, tunable constants at top (SEASON, WINDOW, δ, floors, percentiles, seeds). Read-only vs BB; DB SELECTs only.
- Greek CSVs + a small parser note under `docs/research/market-archetypes/greece-s72/`.
- Non-blocking follow-ups (do NOT delay the report): extend market sweep to age 22 post-rollover (captures retained-then-sold keepers for an addendum); TargetBuildPanel rank by fail-fraction or exclude `mkt72-*` from auto-pick (small UI change).

## 11. Backlog (out of scope here)

- **NT week planner / GS tracker** (from the Greek analysis): weekly GS+minutes ingest for the Slovenian pool; alerts when a rotation player <8 within 3 weeks of a knockout; enthusiasm pacing (TIE group → cap by wk 9–10 → CT wk 13–14); club-contact lead time 2–3 weeks; no mid-campaign dismissals; benchmarks GS≥8 floor / ~8.7 rotation mean at knockouts.
- Salary model refit on flood data (announced-2024 rework; current median |err| 11.7%).
- Calibration watch: `od←ha` elastic 0.007 (Dormouse) vs owner's community experience of a stronger pull — arbitrate via Friday self-trainer scorecards.
- Data asks to the Greek coach (ranked): S71 sheet (two-season trajectories → fit real switch weeks), S72 weeks 1–5, ages/potentials for Chalkitis/Grafopoulos/Gittas.

## 12. Decisions log

Owner: cohort = TSP/salary percentile + OSP/ISP split with defense as the hard requirement (2026-08-04) → refined by review: defense floors moved from sample gate to authoring rules + reported market verdict; TSP gate → descriptive overlay. Report-first output. Cluster-within-groups discovery. Corrections: U-21-track ≠ senior-track selling context; balance-not-phases training order; entry-band usability at 21; **age-20 is the defense season for outside players, enabled by 18/19 elastic feeders; bigs build defense early and are fieldable at 20**.
