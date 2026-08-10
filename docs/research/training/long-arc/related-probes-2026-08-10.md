# Long-arc related probes — archived outputs (run 2026-08-10)

Two 2026-08-07 feasibility probes whose outputs were never persisted. Re-run 2026-08-10.

## Greek bronze cadence reconstruction: BLOCKED at the player-lookup step

`v2/scripts/research/greek-players-lookup.mts` matches the 17 Greek S72 bronze workbook names
(`docs/research/market-archetypes/greece-s72/greek_summary.csv`) against our `players` table by
`last_name` OR full `name`:

```json
{ "namesInWorkbook": 17, "matched": 0, "rows": [] }
```

**Zero matches** — none of the Greek bronze players exist in our DB at all. Expected in
hindsight: World players enter the DB almost exclusively via market listings (plus the
Slovenian census), and a medal squad's kept players were never listed during our capture era.

Consequence for the value-v1 "Greek cadence score" idea: their 18→21 minutes CAN still be
reconstructed (BB serves any team's schedule/boxscore ≥4 seasons back — proven by the 310/310
long-arc harvest), but the pipeline needs their **BB player ids and club team ids from BB
itself** (e.g. the Greek U-21 roster page / player search), not from our DB. That is a manual
or scraped lookup step nobody has built yet.

## Observation capability audit (what live apparatus exists for S73 model testing)

`v2/scripts/research/observation-capability-audit.mts`:

```json
{
 "span": { "first": "2026-02-06", "last": "2026-08-09", "snapshots": 45425, "players": 19305, "seasons": 3 },
 "selfTrainerConfig": { "team_id": 276888, "switch_team": true, "coach": 6, "yt": 6, "gym": 3, "tc": 3, "updated_at": "2026-08-07" },
 "scorecards": [
  { "model_id": "bbscout-ha-flat",   "runs": 6, "mae_displayed": 0.380, "pop_recall": 0.427, "false_alarms": 141 },
  { "model_id": "bbscout",           "runs": 7, "mae_displayed": 0.404, "pop_recall": 0.438, "false_alarms": 183 },
  { "model_id": "bbscout-low",       "runs": 7, "mae_displayed": 0.413, "pop_recall": 0.216 },
  { "model_id": "bbscout-high",      "runs": 7, "mae_displayed": 0.658, "pop_recall": 0.477 },
  { "model_id": "open-source-live",  "runs": 7, "mae_displayed": 0.663, "pop_recall": 0.340 },
  { "model_id": "coach-parrot",      "runs": 7, "mae_displayed": 0.663, "pop_recall": 0.362 }
 ],
 "latestScorecardRun": "2026-08-07 (Friday self-trainer)",
 "pops": { "snapshots": 4544, "own-scrape": 135 }
}
```

Notable: **`bbscout-ha-flat` currently leads the weekly scorecard** (MAE 0.380 vs bbscout's
0.404, fewer false alarms, over 6 runs / 4 players) — the HA-height-column arbitration variant
from the 2026-07-18 community-paste investigation is quietly outperforming the default. Small-n
(4 players), but it has held for six consecutive Friday runs; worth a look when the HA-column
open question is next reviewed, and a natural check-in point once a few S73-era Fridays
accumulate (the S73 elastic trim + IS-training rebalance will perturb all models equally).
