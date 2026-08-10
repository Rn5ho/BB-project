# Build/order probe outputs (archived re-runs, 2026-08-10)

The two probes whose numbers seeded the concentration study printed to console only; the
original 2026-08-07 outputs were lost with that session. Re-run 2026-08-10 (representative
start = median pot≥8 age-18 draftee from our intake: js6 jr5 od6 ha5 dr5 pa5, 198 cm,
n=2,202 sampled; coach 5 / YT 5, full minutes; elastic swept for the unstated S73 trim).

## `order-inversion-probe.mts` — does 1v1-first vs 1v1-last matter?

Identical 56-week budget (1v1×14, OD×14, JS×14, JR×7, PA×7), only the order differs.
Δ = (B: 1v1-last) − (A: 1v1-first), displayed:

| elastic | ΔJS | ΔJR | ΔOD | ΔHA | ΔDR | ΔTSP10 |
|---|---|---|---|---|---|---|
| 100% | 0 | −1 | −1 | +2 | −1 | **−1** (107→106) |
| 75% | 0 | 0 | −1 | +2 | −1 | **0** (106→106) |
| 50% | 0 | 0 | −1 | +1 | −1 | **−1** (105→104) |
| 0% | 0 | 0 | −1 | −1 | −2 | **−4** (101→97) |

**Sequencing is a wash at any live elastic** — 1v1-last trades +1-2 HA for −1 each on
JR/OD/DR. Only with elastic removed entirely does classic 1v1-first clearly win (+4 TSP,
because late 1v1 then can't ride the od→ha tow). Consistent with the study's
"interleaving a fixed budget barely matters" conclusion; the build MIX, not the order,
is what matters.

## `hypothetical-build-probe.mts` — four 56-week builds, end of U-21

Displayed endpoints (age 22 wk 1). Note: the model still carries the **pre-S73 cap
ladder** and all four builds touch cap stage 1 (~26 weighted vs threshold 26, SG) — S73
set the real cap HIGHER, so these endpoints are conservative in cap terms.

| build | elastic 100% | 75% | 50% |
|---|---|---|---|
| trad_pure_1v1_rush | **JS 23 / HA 21 / DR 21**, PA 6 · TSP 122 | same shape · 122 | JS 23 / HA 21 / DR 21 · 121 |
| trad_balanced | JS 21 / HA 19 / DR 19 / PA 11 · **123** | 122 | **122** |
| owner_JSJR_OD_first | JS 19 / JR 15 / OD 17 / PA 12 · 121 | 120 | 117 |
| owner_mix_1v1_first | JS 19 / JR 15 / PA 14 / HA 17 · 121 | 120 | 119 |

Reads:

- The **rush endpoint (JS 23 / HA 21 / DR 21, PA 6)** is the projection that triggered
  the (retracted) over-concentration claim — reproduced here for the record. Per the
  study: such players DO exist in the wild (the owner-described 1v1 products with
  neglected OD/PA); they are rare because clubs don't actually run monolithic programs.
- All four builds land within **~2 TSP of each other at full elastic** — build choice is
  about SHAPE (where the levels sit), not total.
- Robustness to the S73 elastic trim differs: **trad_balanced loses nothing**
  (123→122), the rush loses ~1, while owner_JSJR_OD_first loses 4 (121→117) — the
  JS/JR-first path leans hardest on jr←od towing. Worth re-checking once the real trim
  magnitude shows up in the Friday scorecard.
- The rush's PA 6 / JR 12 is the neglected-skill signature the DR/HA study
  (`forum-research/dr-ha-2026-08/FINDINGS.md`) found on real elite outside players
  (median PA 7, JR 10) — the wild's elite look like moderated rush products, not
  balanced builds.
