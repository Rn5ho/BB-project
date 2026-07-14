# Gated-thread mining findings (2026-07-14, logged-in extraction)

Fetched with the project BB login (BbWebSession) — guest requests get no post bodies.
Raw cleaned threads: `t<id>.txt` in this directory. Key result: **Joey Ka's
guest-hidden posts are fully visible when logged in.**

## Recovered formulas (thread 160760, Joey Ka 2010, ~800 samples)

- **DMI**: `DMI = 100·int( VirtSalary^(1/SalaryDeflator) · (0.1 + 0.76·e^(−1.13567746·(9−GS)) + 0.015780656·GS^0.9) · (1 − 0.035·(10−ST)) · (1 + 0.018·(FT−1)) / 10 )`.
  DMI is derived from skills+GS+ST+FT (dev-confirmed display-only). INVERTIBLE:
  from our weekly DMI snapshots we can estimate GS sublevels (at GS 7/8) and
  virtual salary (at GS 9) — a future sublevel-estimation input (Phase C+).
- **Game shape weekly update**: `nextGS = (8.75 − 0.36·(9−GS)^1.2 − 0.00036·|min−60|^2.145) · U(0.9..1.1)` — 60 min optimal, no memory beyond current GS.
- **Enthusiasm daily decay**: `5 + (E−5)·0.9535·e^(−|E−5|/60)`.
- **Salary**: original `(300·Π coeff^skill)^deflator` + a **season-48 re-fit**
  (buzzer-manager): new per-position constants 228.0/220.7/242.9/246.6/241.9
  replacing 300 and a new coefficient table — candidate replacement for our
  chromebb-based salary sub-model (calibrate vs our Neon refit).

## Model confirmations

- **3-stage potential cap ladder independently confirmed** (323477.20: "3 levels
  of decreasing training speed … confirmed by BB-Justin") — our staged cap stands.
- Per-skill potential caps DEBUNKED in-thread by U21 staff — weighted-sum cap stands.
- Rate/age/height cross-check hit (323477.9): 27yo 6'0" ID@C 0.09/wk observed vs
  our 0.5×0.27×0.65 = 0.088 ✓.
- Trainer ladder 0.88–1.06 matches community numbers (292157); "1 pop/season/level"
  is folklore — realistic ≈ 2–3 extra pops per level over a full career.
- CP fitted on ~30,000 weekly training results (Joey Ka, 310552.13); CP deliberately
  EXCLUDES youth trainer/gym/court → real speeds slightly higher than CP
  (supports the full-matrix-PDF 0.55 vs CP 0.50 lean, and BBSCOUT_HIGH).
- 1v1 guards/forwards HA/DR rates identical; guards secondary all-JS, forwards
  split JS/IS — matches our matrix rows.

## Open conflicts (calibration targets — model NOT changed)

1. **is←id elastic 10× dispute**: measured claim (302291.2) ≈ 0.0096/level vs our
   Dormouse 0.001. (Our id←is 0.02 is worked-example-validated; the reverse pair
   is the uncertain one.)
2. **Disputed elastic links**: is←js and id←sb claimed by Lemonshine (US data),
   denied by a wozzvt-project member. Not in our table.
3. **Negative elastic** (~−0.005/level: jr slows js+rb, od slows is, sb slows id)
   claimed by DrChristopher (323477), partially walked back; matches the In-Depth
   chart's negative cells. Our table is positive-only (dev worked example is too).
4. **1on1 Team row**: 295510.11 says DR .16/HA .15/JS .09/IS .09 vs our CP row 17
   (.22/.176/.088/.088) — only row that disagrees.
5. **HA height scaling**: another "HA/DR height-independent" claim (302291) — adds
   to the standing HA-column question.
6. **TSP benchmarks** (323477, 2024): NT-track season-START TSP 18:55, 19:70,
   20:~83, 21:~95–105, 28:145 finished. v1's power-curve bands look generous at
   the top (our 21-high 130). Use for cohort-board benchmarks in Phase C.
7. Big-gap elastic anecdote (287629.4): DR 17 / JR 2 → JR +1.6 in one week at 21-22
   — no linear pair table produces this; supports an S-curve/superlinear gap term.

## Dead ends

- rhyminsimon Google Sheet (1CwTrcEAGffB…): HTTP 410 Gone, zero Wayback captures —
  permanently lost unless re-shared on the forum. `../rhyminsimon/` left empty.
- CoachParrot internals as imgur screenshots (302291.20): smjYhlI / gm8zvYB /
  2YbTZLX — not yet fetched (we already have the full spreadsheet extraction).
