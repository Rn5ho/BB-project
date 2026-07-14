# In-Depth BB Training Guide — extraction (USA community, senior-NT focus)

Source: `In_Depth_buzzerbeater_Training_Guide.pdf` (ingested 2026-07-14). The
guide our web sweep could only read via a lossy summarizer — this is the full
original. USA community, aimed at building senior-NT (HOF-potential) players;
mechanics content generalizes, build targets do not (Slovenia U-21 works with
lower potentials and an age-21 deadline).

## The signed elastic chart (page 2) — most authoritative per-pair table

Rows = skill being trained; effect of each other skill on its training speed.
"For each level of [column skill] above [trained skill] you get coeff% change."

| Trained | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
|---------|----|----|----|----|----|----|----|----|----|----|
| JS |  | **−0.0045** |  |  | 0.0211 |  |  |  |  |  |
| JR |  |  | 0.0371 |  |  |  |  |  |  |  |
| OD |  |  |  | 0.0332 |  |  |  |  |  |  |
| HA |  |  | 0.0116 |  |  | 0.0103 |  |  |  |  |
| DR | 0.0296 |  |  |  |  | 0.0129 |  |  |  |  |
| PA |  |  |  | 0.0259 |  |  |  |  |  |  |
| IS | 0.0125 |  | **−0.0067** |  |  |  |  | 0.0289 | 0.0057 |  |
| ID |  |  |  |  |  |  | 0.0153 |  |  | **−0.0052** |
| RB |  | **−0.0046** |  |  |  |  |  | 0.0371 |  |  |
| SB |  |  |  |  |  |  |  | 0.0197 |  |  |

Key findings:
1. **Negative coefficients exist** (JS←JR, IS←OD, ID←SB, RB←JR): a higher
   related skill can SLOW training. No shipped model has negatives.
2. **Sergiu's GitHub table is a lossy copy of this chart**: IS→RB 0.0257 vs
   chart 0.0057 (digit error), PA←HA 0.04 vs 0.0259, an extra OD→ID 0.0455 the
   chart doesn't have, and all negatives dropped. Where they agree
   (JS←DR 0.0211, JR←OD 0.0371, OD←HA 0.0332, HA←OD/PA, DR←JS/PA, IS←JS/ID,
   ID←IS, RB←ID, SB←ID) the chart is the origin.
3. Confirms direction yet again: the TRAINED skill's speed is modified by
   higher other skills.
4. Encodable in our engine as `pair-linear` with signed coeffs (alternative to
   bbscout's CP-derived `exp-linked`); top calibration target for arbitration.

## Modern trainer ladder (disagrees with the classic table)

L7 100%, L6 99%, L5 97%, L4 93%, L3 86% ("L7 could be underestimated";
"each trainer level ≈ 1 pop per season"). Normalized to L5=1:
L7 1.031, L6 1.021, L4 0.959, L3 0.887 — vs classic 1.06/1.03/0.97/0.94.
The classic table is flatter. Calibration question; classic table retained in
models for now (single-lineage but CP-fitted).

## Training court = PASSIVE free-throw training (no weekly slot cost)

- TC L3: FT pop ~every 6 weeks (18yo), ~9 weeks (30+yo)
- TC L2: ~7 weeks / ~11 weeks
- TC L1: ~11 weeks / ~20+ weeks

I.e. FT improves passively from infrastructure, scaled by age. Our models only
have FT as an active training type (0.5 lvl/wk using the slot). Phase B: add
passive TC FT gain (≈ 1/6.5 lvl/wk at L3 for 18yo). Also confirms gym = 1–3
extra cross-training slots (matches dev statement).

## Potential / cap notes

- "Soft cap then hard cap" — consistent with the dev's 3-stage ladder.
- Buzzer-manager "generally underestimates potential — you can train further
  than its 100%" → treat BM potentialLim bands as conservative in calibration.
- Potential sublevels confirmed (MVP = 9.0–9.99 affects when capping starts).

## Senior-NT archetype plans (reverse-planner seed templates)

Format matches our planned plan-template schema (train X until skill hits N):
- **PG (inside PG)**: 1v1F→HA/DR 16; JSF→JS 18; IS→20; OD→20; PA→15; alt OD/PA→22/16
- **SG (score-first)**: 1v1F→HA/DR 17/18; JSF→JS 19; IS→20; OD→19; OS/JSG→22JS/15JR; PA→12; OD→20
- **SF (outside)**: ID→12; 1v1F/G→HA/DR 18; JSF/JSG→JS 18; IS→20; OD→20; ID→16; JSG→20/12; PA→12; round out
- **PF (combo fwd)**: 1v1F→HA/DR 14; OD→15/16; PA→14/15; 1v1G→HA/DR 19; ID→19; RB→12; IS→19
- **C (shot-blocking)**: HA→12/13; OD high; PA→18; ID/SB→20; RB→20; ID/SB beyond
- Builds show skills ABOVE 20 (OD 22, JS 22, SB 22) — corroborates no-20-cap.
- TSP checkpoints (senior-NT/HOF track): age 21 ≈ 100, age 24 ≈ 130s, 26 ≈ final.
  (Slovenia U-21 benchmarks are lower — v1 used 90–130 at 21.)
- NT trainee spec: HOF potential (specialized MVP sometimes), 50+ TSP at 18 on
  guards/SF, high starting skills in the slow-training skills for the height.

## Misc

- "Players train at the position they PLAY, not the position they are listed
  as" — restates the core assumption behind our position-minutes pipeline.
- Merchandise ≈ 15% of an NT player's salary (economics, not training).
