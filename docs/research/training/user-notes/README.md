# User-gathered training research (BB-U21-tool folder, ingested 2026-07-14)

Files collected by the NT manager over time, assessed against the Phase A
research archive. Verdicts below reference `../model-comparison.md` and the
Phase A models in `v2/src/lib/training/models/`.

Later additions (same day):
- `dev-statements-2026.md` + `discord-dev-*.png` — 2026 dev (Justin) Q&A
  translations from the Slovenian Discord: 3-stage potential-cap ladder
  (ADOPTED into bbscout), precise cross-training spec, sub-threshold minutes
  data points, skills-exceed-20 (ADOPTED), GS-training diminishing returns.
- `in-depth-guide-extraction.md` + `In_Depth_buzzerbeater_Training_Guide.pdf` —
  USA community senior-NT guide: the ORIGINAL signed elastic chart (negatives!,
  proves Sergiu's table is a lossy copy), modern trainer ladder (86-100%),
  passive training-court FT rates, senior archetype plan templates.

## `TrainingBB (40).pdf` → digested to `training-matrix-full.csv` — THE BIG ONE

The full ~100-row training points matrix: every training type × every position
combination (single positions PG–C, all 2-position pairs, 3-position combos,
team), in points (÷1000 ≈ levels/week at age 18 / level-5 trainer). This is the
source of v1's `TRAINING_POINT_MATRIX` (v1 transcribed 88 rows of it).

What it adds beyond CoachParrot's 33-type table:

1. **Cross-position effectiveness gradient**: single-position rows decay ~×0.9
   per position-step away from the training's natural position (Pressure:
   PG 610 → SG 549 → SF 488 → PF 427 → C 366). Neither CP nor Sergiu model
   this — they only cover the natural-position presets. Directly relevant to
   Phase C training inference (a prospect playing SF while the club runs
   guard training still trains, at reduced rate) and to plan quality checks.
2. **Exact 2-pos / 3-pos / team rows** that are NOT a constant fraction of the
   1-pos row (e.g. Pressure PG/SG OD=310, not 0.75×430=322) — richer than
   CP's baked-in dilution factors.
3. **Settles the v1 Ball Handling question**: BH PG = OD 100 / HA 600 / DR 350 —
   HA is the primary. Agrees with CP and the live BuzzerIQ open_source model
   (HA 0.5 / DR 0.38-0.4); v1's row came from this PDF and was not a
   mis-repair. The Sergiu GitHub file (DR primary) is the outlier.
4. Corroborates the Passing PG repair (HA 180 / DR 190 / PA 720 — v1's PA=720
   was right; CLAUDE.md's old ID=720 row was corrupted).

Cross-check vs CP (÷1000 vs CP levels/week): same ballpark, disagreements up
to ~20% on some primaries (BH HA 0.60 vs CP 0.50; Passing PA 0.72 vs 0.60;
Pressure OD 0.43 vs 0.50). These two tables are the main candidates for the
Phase C calibration flywheel to arbitrate.

## `elastic.png` — elastic DIRECTION confirmed + a new claim

Slovenian forum thread 307729.7 (Dormouse, Dec 2020) — the per-pair elastic
coefficient table that v1 used (JS→DR 0.011, HN→OD 0.050, PS→HN 0.030, …)
WITH its worked example: JS=5, DR=15 → JS training gets +11%. So the boost
applies to the TRAINED skill when the linked skill is higher — confirming the
bbscout direction (v1 had it backwards; this screenshot is the original source
v1 misread). Coefficient values differ from Sergiu's 15-pair table (JS→DR
0.011 vs 0.0211) — a third elastic parameterization, encodable as
`pair-linear` if calibration ever prefers it.

**New claim not seen elsewhere**: "this growth [from elastic] is not
influenced by the age of the players." If true, elastic bonuses are additive
and age-independent, not a multiplier on the age-scaled gain (all three Phase A
models scale elastic by age). Negligible for 18–21s (age mult 0.78–1.0), but a
calibration question for older-player accuracy. Unverified single source.

## `elastic2.png` — CP elastic link topology corroborated

BB forum 293585.15 (CM-Alonso, 2018, U21 world champion ×2), explicitly "from
the Parrot calculations": qualitative per-skill elastic sources matching CP's
linked sets (OD←HA,DR,ID; JS←HA,DR,JR; PA←HA,DR; IS←JS,ID; ID←SB,IS; RB←IS,ID;
SB←ID …). Two nuances: JS also towed by IS in 1on1-forwards training, and
HA←OD possibly only during HA training — context-dependent links that CP's
static topology ignores.

## `height-coeficients.png` — sides with CP on the disputed HA column

Community height table: JS/DR/PA flat 1, JR/OD/HA declining 1.5→0.45, inside
skills rising 0.5→1.55. Identical to CP's table (and bbscout's). Contradicts
Sergiu's HA-flat / PA-rising columns. bbscout already chose CP here — this is
supporting evidence.

## `age-trainer.jpg` — same single-lineage tables

Age 18:1.00 … 36:0 and trainer 0.88–1.06 tables, identical to CP/community.
No new information (same ancestry), but confirms these are THE tables the
community operates on.

## Impact on shipped Phase A models

No changes required — bbscout's contested choices (elastic direction, HA height
column) are confirmed rather than contradicted. Items recorded for Phase B/C:
the cross-position gradient (inference + planner), the PDF-vs-CP rate
disagreements (calibration targets), and the elastic-age-independence question.
