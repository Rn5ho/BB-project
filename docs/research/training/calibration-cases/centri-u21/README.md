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
- `gymLevel: 0` — the reports name coach, youth trainer, fitness and training court but
  **not gym**. Off-program pops are therefore unmodellable here (see findings).
- Extraction integrity: every card prints its own TSP; recomputed sum matched on 253/253
  player-weeks. No skill decreases except stamina.

## Alignment (resolved empirically)

Ambiguity: does a week's report show the state *before* or *after* that week's training?
Both variants were built and scored. **After (align=N) wins decisively** — bbscout pop
recall 32% vs 26%, final-skill MAE 0.29 vs 0.50 levels. Only align=N is kept here.

## Results (bbscout, 2026-08-04, 16 cases / 184 weeks / 181 scored pops)

| model | pop recall | false alarms | final-skill exact | MAE |
|---|---|---|---|---|
| bbscout | 32% (58/181) | 98 | 113/160 (71%) | **0.29** |
| coach-parrot | 27% | 82 | 112/160 | 0.38 |
| open-source-live | 38% | 97 | 112/160 | 0.34 |
| bbscout-low | 29% | 72 | 109/160 | 0.39 |
| bbscout-high | 40% | 126 | 98/160 (61%) | 0.44 |

**MAE 0.29 displayed levels beats the own-team benchmark (0.41)** — the rates, including
the inside skills, hold up over 6-month horizons.

### The raw recall number is misleading — decomposition of the 123 misses

| category | n | meaning |
|---|---|---|
| phase-shift ±1 week | 55 | same skill, model fired one week early/late |
| phase-shift ±2 weeks | 19 | same, two weeks off |
| off-program (zero predicted gain) | 22 | gym scatter — unmodellable, gym level unknown |
| genuine | 27 | real prediction failures |

74 of the 98 "false alarms" pair up with a phase-shifted miss — they are the *same* pop at
a different week, not spurious predictions. **Timing-tolerant recall (±2 weeks): 73%.**
Unmatched false alarms (24) ≈ genuine misses (27): the model is neither systematically
over- nor under-predicting.

## What this means

1. **Cumulative trajectories are trustworthy; week-level pop timing is not.** Hidden
   starting sublevels (displayed d = anything in (d−1, d]) put a ±1–2 week phase error on
   every prediction that never washes out. Plans should be read as "≈week 30", never "week 30".
2. **Inside-skill rates are validated** — the strongest evidence yet for the inside
   archetypes' targets and the ID/SB/RB secondaries.
3. **Gym scatter is a real unmodelled source** (22/181 = 12% of observed pops landed on
   skills the program never trained). Future logs should record gym level.
4. bbscout-high buys recall with accuracy (MAE 0.44) — the conservative default is right.

Re-run: `npm run training:replay -- ..\docs\research\training\calibration-cases\centri-u21`
