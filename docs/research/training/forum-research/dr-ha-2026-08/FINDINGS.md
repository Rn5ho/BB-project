# DR/HA for outside builds — how much is enough?

Raw threads captured **2026-08-07**; this write-up + probe re-runs **2026-08-10** (the original
session's probe output was never persisted — numbers below are from re-runs against the live DB,
which has grown a few market/census days since capture).

**Decision context**: pending owner decision (3) — *revise HA/DR club advice to 16-17* (versus
the community's habitual 18-19)? Same question as `user-notes/owner-build-knowledge-2026-08.md`
batch 2's open item ("is HA 18-19 optimal, or stop at 16-17?"). Three evidence legs: the forum
record, a wild-population shape probe, and an engine marginal-value computation.

## 1. The question

The classic "1v1 rush" opens outside builds with long One-on-One blocks (HA/DR primaries),
prized for cheap multi-skill gains and the biggest elastic pair (**ha→od 0.050**). Is that still
right, or should those weeks go to JS/JR/OD/PA while HA/DR settle lower?

## 2. Forum record (6 threads, 2010–2020 — all pre-S73)

Anchor thread `t305413` ("Driving/Handling", 2020) asks literally this question:

- Dominant explanation for very high DR/HA on market players: **training economics, not engine
  necessity** — first-season 1v1 for the ha→od boost plus 6-trainee intensity produces sellable
  high-TSP guards (".3"); recommended balance **guards 15+**, C/PF ~10+ (".3"); at equal TSP
  experienced buyers prefer the **lower**-DR/HA player (".2"); excessive HA/DR = "wasting his
  potential", TSP "to fool potential buyers" (".7"); train 1v1 **only until one of DR/HA reaches
  15-16**, then rely on cross-training pops (".7").
- Dissent exists: Coach Lambini (".6") — consistent guards have very solid HA/DR, "too much
  JS/JR without it makes the player much much less effective". Bernspin's priority list puts
  handling/driving 12th of 13 (".4").

Supporting threads: `t141183` — DR = shot-creation volume ("5 up to 7 shots a game"); Italian NT
reportedly ran guards without DR successfully; "the first stat I leave out on a guard";
counterpoint: drives are frequent under Look Inside and DR has near-zero salary cost. `t234215` —
drive outcome is a DR>HA>IS combination; JS/JR only affect the shoot-vs-drive decision; DR "at
best a secondary skill… not above OD or PA for a PG". `t245682` — every posted position
hierarchy lists HA/DR as **secondary** for PG/SG (primaries OD/PA/JS, OD/JS/JR). `t268367` —
"useful player: OD+PA first; best-possible: lagging skills first, then HA up for the elastic".
`t318561` — PA drives offensive flow; starting guards want **HA above ~16** to limit turnovers;
DR cheap, "shouldn't be overlooked".

**Aggregate**: the recurring "enough" band for guards is **~15-16** (three independent posters);
the 17-19 community norm is repeatedly attributed to 1v1 training convenience + elastic
strategy, not direct engine value.

**Caveats**: (a) all threads predate S73, and the main pro-high-HA argument (ha→od elastic) is
exactly what S73 phases down — the forum record likely **overstates** the case for HA 18-19
today; (b) four of the six captures end at exactly post `.11` and look page-1-only (`t305413`
had 14 posts at capture; we hold 11) — missing tails could contain rebuttals.

## 3. Wild-population shape probe (`v2/scripts/research/dr-ha-shape-probe.mts`, re-run 2026-08-10)

Newest full-skill snapshot per player, derived age 20-21, "outside-leaning" = OSP > 1.3×ISP,
elite gate = OD≥14 (owner's validated viability gate) + JS≥16:

```json
{
 "universe": { "allFullSkill": 19285, "age20_21": 5892, "outsideLeaning": 4226, "eliteOutside": 24 },
 "eliteOutside_skillDistribution": {
  "DR": { "p10": 15, "median": 16, "p90": 18 },
  "HA": { "p10": 15, "median": 16, "p90": 17 },
  "JS": { "p10": 16, "median": 17, "p90": 18 },
  "JR": { "p10": 8,  "median": 10, "p90": 12 },
  "OD": { "p10": 16, "median": 17, "p90": 18 },
  "PA": { "p10": 5,  "median": 7,  "p90": 10 }
 },
 "thresholds_amongEliteOutside": {
  "DR>=16": "87.5%", "HA>=16": "83.3%", "DR<=13": "0.0%", "HA<=13": "4.2%",
  "JR>=15": "0.0%", "PA>=11": "8.3%"
 },
 "shapeCounts_amongOutside": {
  "proposedExact": 0, "proposedRelaxed_lowDrHa_goodJsOd": 0, "classic1v1_highDr": 21
 },
 "tsp10Comparison": { "lowDrHa": { "n": 0 }, "classic1v1": { "n": 21, "p10": 102, "median": 110, "p90": 115 } }
}
```

Three readings, in decreasing strength:

1. **The proposed low-DR/HA elite build does not exist in the wild** — 0 of 4,226
   outside-leaning 20-21s match even the relaxed shape (JS≥17, OD≥14, DR≤13, HA≤13). Prevalence
   is not causation (nobody *trains* that way, so absence cannot prove nonviability — and the
   probe universe is market-biased toward exactly the 1v1 products under study), but there is no
   existence proof for the radical version of the idea.
2. **The wild's elite do NOT sit at 18-19 either**: elite-outside median DR 16 / HA 16, p90
   18/17. The Greek bronze motivation ("DR 16-19 on 9/9 outside players") reads, on the broader
   population, as **16-17-centred with a tail**, not as an 18-19 requirement.
3. What elite outside players actually skimp on is **JR (median 10) and PA (median 7)** — not
   DR/HA.

## 4. Engine marginal value (`v2/scripts/research/dr-ha-marginal-value.mts`, 2026-08-10)

56-week arc from age 18 wk 1 (median pot≥8 draftee start: js6 jr5 od6 ha5 dr5 pa5, 198 cm,
n=2,202 sampled; coach 5 / YT 5, full minutes), plan = **1v1 × w, then OD × (56−w)**, elastic
swept for the unstated S73 trim. Displayed endpoints:

| elastic | w=0 | w=8 | w=16 | w=24 | w=28 |
|---|---|---|---|---|---|
| 100% | HA **19** DR 10 OD 23 · TSP 96 | HA 18 DR 13 OD 22 · 100 | HA 18 DR 15 OD 21 · 103 | HA 18 DR 18 OD 20 · 107 | HA 19 DR 19 OD 20 · 111 |
| 75% | HA **18** DR 9 OD 22 · 93 | HA 17 DR 12 OD 22 · 98 | HA 17 DR 15 OD 20 · 101 | HA 18 DR 18 OD 20 · 107 | HA 19 DR 19 OD 19 · 110 |
| 50% | HA **16** DR 9 OD 22 · 91 | HA 16 DR 12 OD 21 · 96 | HA 17 DR 15 OD 20 · 101 | HA 18 DR 18 OD 20 · 107 | HA 19 DR 19 OD 19 · 110 |

Marginal per extra 4-week 1v1 tranche: **+1-2 DR, +2-4 TSP10, −0.25…−0.52 internal OD**
(roughly −0.1 OD per 1v1 week), at every elastic scale.

Key reads:

- **HA 16-17 arrives nearly free.** OD training's own HA secondary + elastic carry HA to
  19 / 18 / 16 (elastic 100 / 75 / 50%) with *zero* 1v1 weeks on this arc. The thing 1v1
  actually buys is **DR** (stuck at 9-10 without it; ~16-20 weeks of 1v1 to reach DR 16) plus
  raw TSP.
- **Under the S73 trim the free ride shrinks** (HA 16 at 50% elastic instead of 19) — so
  *some* 1v1 becomes more necessary if the target is HA 18+, but the 16-17 band still arrives
  almost free. Cost of pushing HA/DR from ~16 to 18-19 via long 1v1: **~2-3 displayed OD** on
  the same arc.
- Caveats: monolithic two-block plans (a marginal-value instrument, not a realistic program —
  see the concentration study on real ~2-week cadence); endpoints sit in the cap/malus regime
  at OD 20+, where an OD week is worth little — this flatters 1v1's TSP marginal; at lower OD
  levels the OD week is worth correspondingly more.

## 5. Where this leaves decision (3)

All three legs point the same way, **with honest counterpoints**:

- Forum "enough" band ~15-16 (economics explains the higher norm) — *counterpoint: Lambini-style
  dissent on guard consistency; captures possibly missing rebuttal tails.*
- Wild elite median DR/HA 16, p90 17-18 — *counterpoint: zero wild examples of elite DR/HA≤13,
  so only the moderate revision (16-17), not a radical one, has population support.*
- Engine: 16-17 ≈ free via secondaries+elastic at every plausible S73 elastic; 18-19 costs ~2-3
  OD — *counterpoint: measured on a monolithic plan in the cap regime.*
- The S73 elastic phase-down **strengthens** the 16-17 side: the elastic dividend that justified
  HA 18-19 is shrinking by dev statement ("trimmed very slightly across the board", with skill
  progression "a touch slower overall").

The revision to **16-17 looks well-supported**; the decision remains the owner's. If revised,
the outside-archetype DR/HA bands in the build library should be updated **before** value-v1's
C1 severity scoring encodes them.

## 6. Files

Raw captures in this directory (saved logged-in pages → `v2/scripts/research/html2txt.mts`
tag-stripper; owner session chrome embedded, no secrets): `t141183-drivingstat`,
`t234215-driving`, `t245682-top3skills`, `t268367-guardstraining`, `t305413-drha` (anchor),
`t318561-offensiveflow` (`.html` + `.txt` each). Four captures likely page-1-only (end at post
`.11`). Probes: `v2/scripts/research/dr-ha-shape-probe.mts` (SELECT-only; output embedded in §3),
`v2/scripts/research/dr-ha-marginal-value.mts` (SELECT-only + pure engine sim; §4).
