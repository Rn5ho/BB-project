# Team-sheet comprehension test + smart-pass design (2026-08-05 session capture)

Owner tested the assistant's build understanding before commissioning the retro study:
"perfect U-21 starting five, within the realm of possible, per tactic × per time point."
Owner verdict: "generally not too bad at all" except one systematic error (below).
Kept as (a) seed material for the build library, (b) the design rules it produced.

## The error and the rule it produced

Original sheets ran SG/SF with JR 14-18 while HA/DR sat 12-13 — inverted on THREE
axes: HA/DR are the cheapest levels in time (1v1 byproducts — you cannot reach JS 16
via 1v1 without dragging HA/DR past 15) and nearly free under SG cap (0.05/0.04
weights), while JR is the most expensive skill on both axes (0.50 cap weight, trains
alone). Owner: "you almost never see players with JR 16+ at U-21" — verified in the
retro study: JR≥16 = 0/4,042 in the age-20/21 universe.

**DESIGN RULE (non-negotiable for the smart pass):** a build is only "possible" if a
realistic TRAINING SEQUENCE produces it — candidate builds must be validated by
forward-simulating a path (byproduct skills auto-fill, true time/cap costs surface),
never by checking a hand-drawn vector against a TSP budget.

## Corrected sheets (start → mid wk7 → end wk14 of the age-21 season)

### Neutral — Push the Ball
| Pos | pot | ht | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PG | 8 | 192 | 13→14→14 | 8 | 15→15→16 | 17→18→18 | 16 | 12→13→14 | 9 | 7 | 8 | 4 |
| SG | 8 | 196 | 16→17→18 | 13→14→15 | 14→15→15 | 15→16→16 | 15→15→16 | 9 | 9 | 6 | 8 | 3 |
| SF | 8 | 200 | 15→16→16 | 10→11→11 | 15→16→16 | 15 | 15 | 9→10→10 | 12→12→13 | 8 | 9 | 4 |
| PF | 8 | 208 | 12 | 6 | 8 | 8 | 7 | 5 | 15→16→17 | 15→16→16 | 12→12→13 | 8 |
| C | 9 | 213 | 8 | 4 | 4 | 7 | 6 | 4 | 17→18→19 | 16→16→17 | 12→13→13 | 8→8→9 |

### Outside — Run & Gun
| Pos | pot | ht | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PG | 8 | 190 | 15→15→16 | 10→11→12 | 15→16→16 | 17 | 17→18→18 | 11 | 8 | 6 | 8 | 3 |
| SG | 9 | 196 | 17→18→19 | 14→15→16 | 14→15→15 | 15→16→16 | 15 | 9 | 8 | 5 | 8 | 3 |
| SF | 8 | 199 | 16→17→17 | 12→13→14 | 15→15→16 | 15 | 15 | 8 | 10 | 7 | 9 | 3 |
| PF | 8 | 207 | 13→14→14 | 7 | 10 | 8 | 7 | 5 | 15→15→16 | 14→15→15 | 12 | 7 |
| C | 8 | 211 | 10 | 5 | 5 | 7 | 6 | 4 | 16→17→17 | 16→16→17 | 12→13→13 | 7 |

### Inside — Look Inside
| Pos | pot | ht | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PG | 8 | 192 | 12 | 7 | 15→15→16 | 17→17→18 | 15 | 14→15→15 | 9 | 7 | 8 | 4 |
| SG | 8 | 195 | 15→15→16 | 12 | 15→16→16 | 14 | 13 | 11→12→12 | 10→10→11 | 6 | 8 | 3 |
| SF | 8 | 201 | 12 | 7 | 15→16→16 | 16 | 16 | 9 | 13→14→14 | 8 | 9→9→10 | 4 |
| PF | 8 | 209 | 11 | 5 | 7 | 8 | 7 | 5 | 16→17→17 | 15→15→16 | 12→13→13 | 8 |
| C | 9 | 214 | 8 | 4 | 4 | 7 | 6 | 4 | 18→19→20 | 16→16→17 | 13 | 9→9→10 |

Notes: owner-approved apart from the (corrected) JR/HA-DR inversion; JR growth always
rides on established JS; Look-Inside C = Israeli-style finalizing IS→20 in-season,
crossing his pot-9 stage-1 cap exactly at the finish; Look-Inside SF = the
inside-attacking wing (luxury pot-8 version of the owner's pot-6 exploit).
Post-study amendments to consider: rim-protector C variant (Greek-validated),
PG PA band question, HA 16-17 sufficiency (retro-study §5).

## Smart-pass (/best) design, as agreed in-session

Per player: (1) hard gates — archetype height/cap math (target vector's JK score vs
8+2·pot ladder) — instant discards; (2) planJourney sweep over surviving builds
(real/assumed staff); (3) stress re-sim (worst sublevels displayed−0.99, 38-min
minutes) → robust-feasible only; (4) rank by explicit value function (owner gates
severity-weighted, in-season cadence per the Greek shape, end-build value, NT
positional need, robustness) — output TOP-3 WITH VISIBLE REASONING, never a single
oracle answer. Value-v1 fix order: C2 (owner gates into planJourney's M1 bar) → C1
(severity-weighted cross-class scoring) → stress axis → cadence score; full critique
list in retro-study REPORT §7. Surfaces: /best bot command, /journey auto-mode,
nightly planner-board sweep column.
