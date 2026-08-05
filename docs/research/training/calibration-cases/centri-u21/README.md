# Centri U-21 calibration cases (Slovenian NT centers program, 2024-25)

16 replay cases built 2026-08-04 from the "Centri U-21 NT" Discord training log
(#report-treninga, Sept 2024 – Sept 2025): 8 centers/PFs, weekly cards + the training,
minutes and staff levels named in each post. Source export + parsed tables:
`C:\Users\Rn5ho\Downloads\centri-u21\parsed\` (series.csv / weeks.csv / pops.csv /
history_pops.csv); builder script in the session scratchpad (`build_cases.py`).

**Why these matter:** first independent ground truth for INSIDE skills across a full
18→21 arc. The engine's own-team calibration (`auto/`) is outside-skill and single-season;
`mkt72-inside-*` archetypes rest on rates that had never been tested this way.

## Provenance and construction

- One case per (player, staff-segment) — the engine takes one staff config per case and
  these clubs upgraded coach/youth-trainer mid-series. Segments break on staff change,
  week gaps, and unmappable trainings; minimum 5 weeks.
- Week-0 baselines (pre-first-training cards) excluded; alenokc's 17 missing weeks break
  his series into short segments, so most weight sits on pjtr576's gapless 53-week logs.
- **Facilities (owner-corrected 2026-08-04):** Slovenian `fitnes` = the **GYM** facility (not a
  fitness trainer) and `trening igrišče` = training court. Both clubs ran **gym 3** all year;
  alenokc also had training court 3, pjtr576 none. Cases carry these. (`weeks.csv` keeps the
  original column name `fitness_level` — read it as gym level.)
- Extraction integrity: every card prints its own TSP; recomputed sum matched on 253/253
  player-weeks. No skill decreases except stamina.

## Alignment (resolved empirically)

Ambiguity: does a week's report show the state *before* or *after* that week's training?
Both variants were built and scored. **After (align=N) wins decisively** — bbscout pop
recall 32% vs 26%, final-skill MAE 0.29 vs 0.50 levels. Only align=N is kept here.

> **SUPERSEDED 2026-08-05** — every number below ran with player ages frozen at segment
> start (`replay-case.mts` dropped `ageAfterThis`; fixed in a6229cf). Corrected baseline
> (bbscout 32.0% recall / FA 99 / 112,160 exact / MAE 0.300) and the full nine-angle
> deep-calibration results live in **`ANALYSIS-2026-08-05.md`** — including: club-scale
> tilt ×1.48 as the dominant error, SB cold-spot dissolving into it, timing-tolerant
> recall 71.8%, fitted-sublevel ceiling 72.9%, TC-FT validated to 1%, DMI = continuous
> internal-skill weekly probe, GS reset to 7 at rollover, and Centri evidence favoring
> is←id 0.0096. Read that file first; the tables below are kept for history.

## Results (bbscout, 2026-08-04, 16 cases / 184 weeks / 181 scored pops, gym 3)

| model | pop recall | false alarms | final-skill exact | MAE |
|---|---|---|---|---|
| bbscout | 35% (63/181) | 99 | 111/160 (69%) | **0.31** |
| coach-parrot | 27% | 82 | 112/160 (70%) | 0.38 |
| open-source-live | 38% | 97 | 112/160 (70%) | 0.34 |
| bbscout-low | 26% | 84 | 110/160 (69%) | 0.38 |
| bbscout-high | 45% | 126 | 94/160 (59%) | 0.47 |

**MAE 0.31 displayed levels beats the own-team benchmark (0.41)** — the rates, including
the inside skills, hold up over 6-month horizons. (A first pass mistakenly ran gym 0 and
scored MAE 0.29 / 71% exact; the correct gym-3 configuration trades a hair of end-skill
accuracy for explaining every off-program pop, see below.)

### The raw recall number is misleading — decomposition of the 118 misses

| category | n | meaning |
|---|---|---|
| phase-shift ±1 week | 56 | same skill, model fired one week early/late |
| phase-shift ±2 weeks | 14 | same, two weeks off |
| off-program (zero predicted gain) | **0** | gym-3 scatter accounts for all of them |
| genuine | 48 | real prediction failures |

70 of the 99 "false alarms" pair up with a phase-shifted miss — they are the *same* pop at
a different week, not spurious predictions. **Timing-tolerant recall (±2 weeks): 73%.**
Unmatched false alarms (29) vs genuine misses (48) — a mild under-prediction tilt once
scatter is modelled, consistent with the slightly high MAE.

## What this means

1. **Cumulative trajectories are trustworthy; week-level pop timing is not.** Hidden
   starting sublevels (displayed d = anything in (d−1, d]) put a ±1–2 week phase error on
   every prediction that never washes out. Plans should be read as "≈week 30", never "week 30".
2. **Inside-skill rates are validated** — the strongest evidence yet for the inside
   archetypes' targets and the ID/SB/RB secondaries.
3. **The gym-scatter model is VALIDATED at its real setting.** Every one of the 22 pops that
   looked unmodellable under the mistaken gym-0 run is accounted for by gym-3 scatter:
   off-program misses drop 22 → **0**. The dev-spec mechanism (each slot = 10% of the primary's
   pre-elastic amount landing on a uniformly random skill incl. ST/FT; gym adds 1-3 slots)
   reproduces real off-program pops at the right rate. Sensitivity, for the record:

   | gym slots | off-program misses left | pop recall | final exact | MAE |
   |---|---|---|---|---|
   | 0 (wrong config) | 22 | 32% | 71% | 0.294 |
   | 1 | 14 | 31% | 71% | 0.294 |
   | 2 | 5 | 34% | 71% | 0.287 |
   | **3 (actual)** | **0** | 35% | 69% | 0.306 |

   `baseSlots: 0` is therefore **unrefuted by this dataset** — with the true gym level fed in,
   no residual scatter needs explaining. Owner notes BB applies a small random element to every
   training regardless of gym; if such a base slot exists, its effect is small enough to sit
   inside the CP-fitted rates (as that parameter's own comment argues) and cannot be separated
   at gym 3. Isolating it needs a log from a gym-0 club.
4. bbscout-high buys recall with accuracy (45% recall, MAE 0.47) — the conservative default is right.
5. **Lesson for future imports:** Slovenian `fitnes` means the gym, not a fitness trainer. The
   first run of this analysis mis-mapped it, invented a "12% unmodelled scatter" finding, and
   nearly motivated a spurious `baseSlots` refit. Facility/staff glossary errors look exactly
   like model errors.

Re-run: `npm run training:replay -- ..\docs\research\training\calibration-cases\centri-u21`
