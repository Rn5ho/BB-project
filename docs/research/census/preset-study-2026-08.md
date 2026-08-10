# Census targeting presets — study (2026-08-07) and what actually ran (2026-08-09)

Scripts written **2026-08-07 21:09-21:14** (the session ended right after — no findings doc, no
saved outputs, no chosen preset). This write-up (**2026-08-10**) recovers the numbers by re-run
and records what the owner then actually ran on 2026-08-09.

**Owner's ask (2026-08-07)**: a tighter census — 18/19 restricted to genuine U-21 prospects,
20/21 restricted to actual U-21 material — to avoid another 365-candidate marathon (run #21) or
834-candidate OOM run (#23-era).

## Instruments

Six SELECT-only scripts in `v2/scripts/research/`: `census-preview-presets.mts` and
`census-final-presets.mts` import the **production** `loadCandidateRows` + `selectCandidates`,
so their counts are exactly what a real run's candidate selection would produce (nothing is
enqueued or written). `census-targeting-data.mts` (universe/TSP survey — note: uses a date-based
freshness cutoff that can diverge slightly from production's season+source definition),
`census-runs-recent.mts`, `census-snapshot-provenance.mts`, `fresh-capture-source.mts`
(provenance triangulation: how much of the pool the market flood + census #21/#23 already
covered).

Two honest limitations the preview scripts carry: (1) roster protection (`lastKnownRoster`) and
free-slot batching are not modeled — real captured counts run slightly below previewed
candidates without a clear-roster run; (2) **the null-trap**: null potential fails any pot
filter and null TSP (= never fully captured) fails any TSP/track filter, so a track-slack
preset systematically excludes never-captured players — the very players a census exists for.
The preview prints both null counts (2026-08-10: **71 null-potential, 292 null-TSP** in the
18-21 pool) so a chosen preset can be paired with a pot-based leg for the null-TSP population.

## What the owner actually ran (2026-08-09) — a third axis

The Aug-7 prototypes explored **potential** and **NT-track slack**. The runs enqueued on Aug 9
used neither: **per-age minimum-salary floors** (salary as a cheap "is he actually being
trained" signal — BB resets salary once per season from skills):

| run | filters | captured | failed | duration |
|---|---|---|---|---|
| #24 | age 21, minSalary 10,000, all | 60 | 0 | 9 min |
| #25 | age 20, minSalary 8,000, pot≥6, all | 48 | 0 | 7 min |
| #26 | age 19, minSalary 5,000, pot≥6, all | 82 | 0 | 12 min |
| #27 | age 18, minSalary 2,100, pot≥6, all | 78 | 0 | 11 min |
| | **total** | **268** | **0** | **~40 min** |

(Also in the log: #22 failed 2026-08-05 after 2 min — a 977-candidate 18-21 pot≥6 attempt;
#23 finished 2026-08-05 after 2.4 h with 4 captured.)

Four small age-split runs, zero failures, ~40 minutes total — the "no more marathons" goal was
achieved with the *existing* `minSalary` filter rather than a new preset mechanism. S73
Slovenian full-capture coverage after these runs: **780 census + 184 market players**
(`fresh-capture-source`, 2026-08-10).

## Where the pool stands now (previews re-run 2026-08-10, season 73 week 1)

Pool 18-21 by age: 307 / 465 / 306 / 220; already fully captured in S73: 126 / 305 / 212 / 167.
NT-track benchmark this week: 18:55, 19:70, 20:83, 21:100.

NEW candidates (not yet fully captured in S73) a run would pick today:

| preset | NEW | by age |
|---|---|---|
| 18-21, within 20 of NT track | 62 | 16/20/26/0 |
| 18-21, within 25 of NT track | 92 | 16/31/42/3 |
| 18-21, within 30 of NT track | 115 | 17/44/49/5 |
| 20-21, within 20 of NT track | 26 | 0/0/26/0 |
| 18-19, pot≥8 | 1 | 1/0/0/0 |
| 18-21, no filter (everything uncaptured) | 488 | 181/160/94/53 |

Reading: after the Aug-9 salary-floor runs, the **track-adjacent pool is essentially covered**
— a within-20 top-up run today is 62 players (~10 min). The 488 unfiltered stragglers are
overwhelmingly sub-floor players the salary filter deliberately skipped.

Slovenia TSP percentiles by age (age 18: p50 48 / p90 55; 19: 58/71; 20: 63/81; 21: 67/93)
against the NT track (55/70/83/100) make the same point from the other side: **the NT track
sits at ~p90 of the age cohort** — a within-20 slack preset is already a top-quartile filter.

## Open design fork for S74 (owner decision needed)

The **salary-stagnation filter** (owner idea 2026-08-05: at age promotion, salary barely moved
from last season's reset ⇒ didn't train ⇒ skip) is **still not implemented**. Two candidate
signals, not the same thing:

1. **Season-reset salary delta** (the original idea): compare consecutive per-season salary
   resets per player. Needs one api-source salary row per player per season — we have salaried
   api rows for S72 and S73, so this is buildable now.
2. **Friday salary/DMI pop detection** (what `census-targeting-data.mts` probed): use weekly
   api captures to see whether salary/DMI move at all during the season. Richer but depends on
   weekly api coverage of the whole pool.

The Aug-9 **absolute salary floors** are a static cousin of (1) — they worked, but an absolute
floor can't distinguish "trained but started low" from "untrained". Decide 1 vs 2 (or floors
again) before the S74 rollover census.
