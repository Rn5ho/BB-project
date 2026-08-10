# S73 salary probes — archived outputs (run 2026-08-10)

The two measurement scripts written 2026-08-07 (`v2/scripts/research/s73-salary-market-probe.mts`,
`v2/scripts/research/s73-data-coverage.mts`) had no persisted output — the original session's
numbers were lost with its transcript. These are fresh runs against the live DB (which now
includes the Aug 8-10 market sweeps, i.e. more post-correction data than the original run saw).

## How wrong is the old-formula salary model per build? (`s73-salary-market-probe`)

`scale = actual S73 salary / our old-formula estimate (deflationScale=1)`, newest market
snapshot per player captured ≥ 2026-08-06 12:00 (post-second-correction). Pre-rework Neon refit
was a flat **0.7144**; a flat scale would mean the old *shape* still fits.

```json
{
 "nListings": 10780,
 "skillsOver20": 3,
 "impliedScale": {
  "overall": { "p10": 0.6657, "median": 0.7616, "p90": 0.8517 },
  "byBestPosition": {
   "PG": { "n": 2809, "median": 0.7864 },
   "PF": { "n": 2055, "median": 0.7804 },
   "C":  { "n": 2026, "median": 0.7768 },
   "SF": { "n": 2064, "median": 0.7344 },
   "SG": { "n": 1826, "median": 0.6965 }
  },
  "byShotBlocking": {
   "SB <9":   { "n": 9248, "median": 0.7587 },
   "SB 9-11": { "n": 1488, "median": 0.7795 },
   "SB 12-14":{ "n": 31,   "median": 0.7561 },
   "SB 15+":  { "n": 13,   "median": 0.7261 }
  }
 },
 "secondUpdateEffect": {
  "note": "salary on 8/7 (post-correction) / salary on 8/4 (first update), same player",
  "byBestPosition": {
   "C":  { "n": 530, "median": 0.9675 },
   "PG": { "n": 762, "median": 0.9582 },
   "PF": { "n": 562, "median": 0.9613 },
   "SF": { "n": 548, "median": 0.9151 },
   "SG": { "n": 506, "median": 0.8773 }
  }
 }
}
```

Reading (18-21 market universe only — NOT the whole game):

- Overall median scale **0.762** vs the old flat 0.714 — S73 salaries in this universe are a
  touch higher relative to the old model than pre-rework, and the p10-p90 spread
  (**0.67-0.85**) plus a ~0.09 median gap between SG (0.697) and PG (0.786) confirm the
  **shape changed**, not just the level: a flat rescale of the old formula is no longer a good
  salary model, per position least of all for guards.
- The **second correction** (night of 8/5→8/6) cut SG salaries ~12% and SF ~8% median vs the
  first update, with PG/PF/C nearly unchanged — consistent with the dev description (ID cost
  walked back for guards; IS/SB raised for guards+SFs).
- `skillsOver20: 3` — market listings with a stored skill above 20 exist but are vanishingly
  rare in this age band.
- Any refit on these numbers must be **season-tagged S73**: SB salary "might" rise again in
  S74 (dev, Q&A), and the salary formula is explicitly still being tuned.

## Which capture windows bracket the salary updates? (`s73-data-coverage`)

Per-day, per-source S73 snapshot counts (rows / with_salary / with_skills), latest
salary-bearing capture `2026-08-10T06:05Z`. Market rows carry full skills + live salary on the
same row every day 8/3-8/10 (4,780 → 1,840 rows/day as the flood recedes); api rows carry
salary+DMI but no skills. The valid post-correction comparison window opens with the
**8/6 18:00 UTC** market sweep. Full JSON retained in the script — re-run for current state.
