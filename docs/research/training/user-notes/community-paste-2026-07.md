# Community pastes 2026-07 — resolved as the deployed BuzzerIQ model

**Sources:** pastebin YkDVRdJJ ("trainingCoefficients", Guest, 2026-07-16) and 2DHDx0uG
("heightCoeffs", guest, 2026-07-17) — anonymous raw-JS pastes shared by the owner
2026-07-18 "for orientation, comparison rather than hard truth". Snapshot preserved in
the tables below; comparison script: `v2/scripts/training/compare-community-2026.mts`.

## Provenance (resolved by three-way diff + live probes)

The pastes are a **transcription of the CURRENTLY DEPLOYED buzzeriq.com `open_source`
model** — nothing more, nothing less:

- The training paste shares Sergiu's three label quirks verbatim ("JR (PG)", space-less
  "OD(PG/SG/SF)", "SB (team)" for the SF/PF/C drill) → Sergiu lineage.
- 4 cells matched the deployed-vs-GitHub deviations already recorded in probes 01-07
  (HA (PG) dr/ha swap, is↔id 0.1 doublings).
- 13 cells matched **neither** the archived `sergiu-logic.js` nor its live GitHub repo
  (v3.1, May 2025): the 1v1 reductions (js 0.35/0.18, dr 0.45, ha 0.38, is 0.19),
  JS (SF/PF) js 0.35, and the HA-family reshuffle. **Probes 33-37 (2026-07-18) confirmed
  every one of them is what the deployed simulator returns today** — BuzzerIQ's deployed
  model has drifted past its own GitHub source.
- Height paste: HA-flat confirmed live at 185/216cm (probes 38/39), DR ×0.95 at
  185/201/216 (33-39), IS 0.70@178 / 0.83@185 (42/40) — the paste's IS column, which
  looked like a two-point interpolation, matches the deployed oracle at every probed
  point. One paste error: IS@201 is deployed as 1.05, not the paste's 1.00 (probes
  05/34/35).
- Bonus finding: the old "JS ×1.04 at 201cm" quirk (probes 01/05) was an artifact of
  assuming base 0.5/0.125 — probe 40 (JS gain 0.13 raw at 185cm) shows the deployed
  bases are simply 0.52/0.13 with JS height flat.

**Consequences applied:** `open-source-live.ts` updated to the freshly probed deployed
values (ids 2/13/14/15/16, js re-basing, DR/HA/IS height columns; probes 33-42 saved in
`buzzeriq/probes/`). **bbscout unchanged** — per the provenance-chain warning
(README.md), BuzzerIQ agreement is lineage, not independent evidence about the real game.

## What the paste claims vs bbscout, and the verdicts

Rate matrix: 81/105 cells identical to CP_RATES; 24 differ. Height: HA flat (vs
declining 1.5→0.45), DR 0.95 flat (vs 1.0), IS gentler low-end (0.65@175 vs 0.5).

Calibration replay (7 own-team cases, 108 weeks, 98 pops, heights 185×3/201/216-221):

| variant | recall | fa | exact finals | MAE |
|---|---|---|---|---|
| bbscout | 45% (44/98) | 53 | 61% (43/70) | 0.414 |
| paste-height (all 3 height claims) | 39% | 53 | 64% | 0.357 |
| paste-rates | 38% | 58 | 67% | 0.329 |
| h-ha-flat (single ablation) | 44% | 51 | 63% | 0.371 |
| h-dr-095 (single) | 40% | 56 | 61% | 0.414 |
| h-is-curve (single) | 45% | 53 | 61% | 0.414 (no coverage) |

Adversarial review of these numbers (stats agent, 2026-07-18):

- **HA-flat**: the MAE gain rests on 4/70 cells (p≈0.31, sign test), concentrated in the
  three same-team 185cm guards; the sole tall datapoint (216cm) got WORSE (phantom HA
  pop). Fairest reading: *weak evidence bbscout's ×1.3 HA at 185cm is too high; no
  evidence for flat at tall heights, where the one datapoint favors the current curve.*
  Real-game counter-evidence: BBMark 2022 (t78242-tsa2-2022.txt line 516) — "shorter
  players bumps in handling in terms of how fast they train" — plus CP's independent fit.
  → tracked live as `bbscout-ha-flat` on the weekly self-trainer scorecard.
- **DR 0.95**: contradicted on pops (recall −5pts), MAE unchanged; CP's free fit sits at
  0.9975. Undecidable 5% effect; not adopted.
- **IS low-end curve**: measured real in the *BuzzerIQ model* (probes 24/40/42) but zero
  coverage in our ground truth (no short inside trainees). Open question for the real game.
- **paste-rates MAE gain**: metric-dependent (pop prediction materially worse: hits
  44→37, fa 53→58); driven ~half by the 1v1 reductions, ~half by JR/ID doublings.
- **JR-doubling on JS drills (0.2/0.15 vs 0.1/0.05)**: genuine era conflict — 2012
  measured logs (w_alloy, t203921) and weeks-per-pop tables refute doubling, but our
  2026 calibration cells (Tahiri/Zorec jr 9→10) mildly prefer it. Possibly a post-2024
  rebalance. **Best next test:** JR-pop frequency in high-confidence JS-drill windows of
  the census/market pop corpus (~1,027 pops, 196 windows; circularity-safe subset per
  README recalibration loop).

## Census-corpus tests (run 2026-07-18 — inconclusive, coverage-limited)

`v2/scripts/training/census-hypothesis-tests.mts` (run on the Hetzner box against Neon):
rebuilds the inference evidence with current code, restricts to confidence-filtered
windows per the recalibration-loop protocol, and compares observed pops on each
contested skill vs expected pops under both hypotheses (uniform-sublevel prior:
E[pops] = predicted gain).

Corpus 2026-07-18: 2,926 players, 412 club-windows — but only ~15 windows survive the
high/medium confidence bar under the post-guard inference (the 2026-07-17 owner guard +
margin floor correctly pruned the noise that had inflated Phase C's 63+42 count), and
they concentrate on drills where the hypotheses agree (top coverage: 1v1 SF/PF ×4,
PA PG ×2). Contested-cell results, all n=1-class:

- JS→JR towing (ids 1/2, ≥medium): observed 1 JR pop vs expected 3.1 (bbscout) / 4.4
  (doubled) — observed sits BELOW both; with the selection bias running TOWARD the
  doubled hypothesis, a faint point against doubling, but a single window.
- IS(C)→ID (≥medium): observed 1 vs 0.2 / 0.5 — above both, nearer doubled.
- ID(C)→IS (high): observed 1 vs 0.5 / 0.9 — nearer doubled.
- HA ≥206cm and IS ≤183cm: zero qualifying player-windows. No coverage.

Verdict: the corpus cannot arbitrate the contested cells **yet**. It grows automatically
(daily market sweep, census runs, minutes sync) — re-run the script as windows accumulate.
The owner's own club cannot supply the missing drills (fixed U-21 regime), so corpus
growth is the only evidence channel for these cells.

## Recommended next steps

1. Re-run `census-hypothesis-tests.mts` periodically (e.g. monthly) as the corpus grows;
   the JR-towing cell has the best odds of reaching useful n first (JS drills are common).
2. `bbscout-ha-flat` on the weekly self-trainer scorecard arbitrates the HA question from
   the own-team side (1v1 drills carry HA secondaries even under the fixed regime).
3. Re-run the full model panel (CP/OSL included) on the current case set before quoting
   README benchmark figures — the stats agent showed the recorded bbscout-low numbers do
   not reproduce on today's cases (0.457 MAE, not 0.35 — the 0.35 was the live 4-player
   scorecard, a different dataset).
