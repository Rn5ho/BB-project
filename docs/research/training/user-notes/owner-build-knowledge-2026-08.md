# Owner build knowledge — voice capture 2026-08-05

Seed corpus for the smart optimizer's build brain. Source: owner voice dumps in-session
(first entries; more to come — append, date each batch). These are DOMAIN JUDGMENTS,
not model parameters: they feed the value function, viability gates, and build library.

## Concepts

### Key vs supportive skills
Every build has KEY skills (the reason the player exists) and SUPPORTIVE skills (always
help, never the point). IS for an outside player is supportive; HA/DR for an outside
player are important but largely supportive too (HA carries ball-handling + od←ha
elastic; DR feeds js←dr elastic and affects inside-shot quality in the engine) — the
KEY outside skill is **OD**. "You can hide a player in offense, but you cannot hide
them on defense."

### The U-21 clock makes supportive skills conditional
Limited training weeks → a supportive skill is only worth carrying if its landing spot
STANDS OUT. Example: 18yo outside prospect with IS 1 — training IS to 6-8 is wasted
(most defenders have ID 6-8 anyway; it doesn't differentiate). Correct play: **1on1
(PG/SG) instead of 1on1 (SF/PF)** — the guards row has no IS cell, so its JS cell is
double the wings row (0.4 vs 0.2): faster JS now, compounding later.
→ Note: the beam search derives this choice AUTOMATICALLY when IS is simply left out
of the target set — the rule needs no special-casing, only correct targets.

### Gift skills on 19yo draftees
19yo draftees can arrive with skills you'd never train (e.g., RB 9-10 on an outside
player). Already-there ≠ worth-training: the optimizer must value existing levels as
free inheritance (keep, don't extend) and never plan training to "complete" them.
Analyze players at BOTH 18 and 19 — the 19yo intake is scouting-critical.

### Low-potential niche builds (cap-weight pockets)
Cap weights are wildly uneven per position shape → near-zero-weight skills are almost
FREE under the cap. Worked example (owner): pot-6 wing with LOW JS/JR, DR/HA 15-17,
OD 14-15, then finalize IS 15-17 → wing defender who attacks under the basket for
Look Inside. IS at wing shapes costs 0.03-0.05 cap points/level vs JS 0.45-0.58.
Not a build to *recommend* generally — an opportunity the optimizer should *recognize*.
Machine follow-up: sweep pot × height × shape for all such free-value pockets and
propose exploit-builds for owner blessing.

## Viability gates (entering the age-21 / U-21 season = our M1)

These are per-skill minimum bars for a player to be USABLE against one-year-older
competition — they complement the TSP NT-track benchmarks (benchmarks.ts) and should
replace the generic M1 relaxation (floor−2/definers−1) for known player classes.

**Outside players:**
- OD: **14 minimum** (13 borderline), 15-16 preferred. THE gate.
- DR/HA: important but supportive — no hard bar stated (yet).

**Big men ("normal center"):**
- ID: **≥15** (14 possible, 16 great) — defense first, always; finish the rest later.
- IS: **≥15** (16-17 preferred).
- RB: **~11 minimum** (10 possible, <10 really hard to play; 11-12 the target).
- SB: not prioritized by the owner — BUT see the Israeli-style build below.
- Big men reach minimum viability FASTER than outside players (tall height multipliers
  + fewer gated skills) — the optimizer should exploit that in sequencing.

**General principle:** a top prospect at ~20.5 with ~110 TSP but OD <13-14 is a failure
— can't even play rotation minutes. High TSP without the viability gates is misallocated
training.

## The objective has THREE time points (the "what's the aim" problem)

1. **Start of the U-21 season** — viability gates above (playable vs older players).
2. **Progression DURING the season** — the player should keep improving through the
   campaign (group stage → playoffs), not arrive finished-and-flat or arrive raw.
   (Ties to M2 = finalized by playoff start, week ~7.)
3. **End build** — the finished archetype (e.g., center finalizing IS → 20 in-season
   for Look Inside).
The optimizer's value function must score all three, not just the end state — and the
owner explicitly wants MULTIPLE ranked proposals with visible reasoning, not one answer.

## Build seeds (to encode as archetypes)

- **Inside-attacking wing (pot-6 exploit)** — DR/HA 15-17, OD 14-15, IS 15-17, JS/JR
  deliberately low. Role: wing defense + Look Inside scoring. Cheap under cap.
- **Israeli-style four-skill big** — combines ALL FOUR inside skills (IS/ID/RB/SB)
  toward the U-21 season start, then finalizes (e.g., IS → 20) during the season.
  Observed in Israeli U-21 rosters; contrast with the owner's "normal center" (SB
  deprioritized).

## Batch 2 (same day) — corrections + secondary-skill balance

### DR/HA bars for outside players (fills batch-1 gap)
Minimum **15-16**; most players run **17-19** in practice — partly because 1v1 trains
them so cheaply, partly pushed to 18-19 **for the ha→od elastic**. Whether 18-19 is
actually optimal vs stopping at 16-17 is an OPEN QUESTION the owner wants computed
(marginal HA week's elastic value to OD vs a direct OD week — engine can answer).
Principle: "never hurts to have too much; only hurts to not have enough."

### IS on outside players — refined (batch 1 was the degenerate case)
Meaningful band: **9-12**. Environment context: outside players never train ID — it
stays at draft level + passive gains (gym scatter; OD training's small 0.1 ID cell) —
so opposing outside defenders rarely have ID ≥9. An outsider with IS 10-11 therefore
already plays inside tactics QUITE WELL (his 10-11 beats their 6-8). Batch 1's "IS 1
→ 6-8 is wasted" stands ONLY for that from-1 case: below ~9 it doesn't stand out;
9-12 does. (Rare ID≥9 outsider builds exist — exceptions, not the rule.)
→ Computable check: we hold the full market+Slovenia universe — the actual ID
distribution of 18-21 outside players can verify the "defenders sit at 6-8" premise.

### The core tension, stated by the owner
Secondary skills: "the more the better" — but the whole optimization problem is
striking the balance between secondaries and PERFECTED primaries under the U-21 clock.
That balance IS the product.

### Correction: high TSP with low OD at age 20 is NOT a failure state
It may simply be mid-process (OD block still scheduled). **Judgment day = turning 21**
(entering the U-21 season); a 20yo has 5-10 weeks of runway before it. The value
function judges the age-21 state, not the age-20 snapshot.

### Value-function directive: never jeopardize the end build for an earlier call-up
Optimize for the player's BEST STATE THROUGH the age-21 U-21 season. Early
availability (the search's current hit-earliness tiebreaker, cf. the Župan /journey
discussion) must stay a weak tiebreaker — wherever earliness trades against M1/M2
quality, quality wins.

## Batch 3 (same day) — positional context: key skills + age-21 entry bands

Positions must each be filled every match (PG/SG/SF/PF/C) — archetypes live inside
that team-composition puzzle, plus tactic and opponent matchup. Bands below = entering
the age-21 U-21 season ("really rough descriptions", owner).

**PG (playmaker):** key = HA, PA, OD; rest tactic-dependent; all-around (JS+IS) best.
Bands: OD min 14 ideally 15-16 · PA ideally 11-12 · JS 13-16 · IS conditional on
draft: drafted with IS 5-7 + wings-1v1 training → 9-10; otherwise skip IS entirely
and put those weeks into JR instead.

**SG:** all-around with OD+PA, but the KEY is **high JS + high JR**. Team note:
with 2-3 players of this type they get slotted at PG or wing for outside-tactic games
— interchangeability is part of the value.

**Wing/SF:** tactic-dependent; more IS than guards: **11-14** · OD min 14-15 at
season start, trained on to 16-17 (OD floor applies to ALL outside positions) ·
PA nice, not crucial · some RB nice to have (helps team rebounding) · JS 14-17 ideal.

**JR mechanics (owner's operating model — important for the value function):** JR is
purely supportive: it only reduces how much JS quality decays with shot distance.
JS 7 + JR 20 still shoots like a 7 from anywhere. → **JR's value scales with JS** —
a JR target only makes sense on top of a high JS (SG builds), and JR-first training
is always wrong.

**PF:** most versatile — center-like defensive (SB/RB/ID) or offensive-classic (IS);
"not picky", often just a classic center. Selection heuristic: play the big with the
highest JS. Note: heavy IS training NATURALLY lands JS 12-13 by 21 (IS rows carry a
JS secondary cell — engine-consistent: rows 21-23 have js 0.1/0.075/0.04), so the
scouting move is spotting an 18yo ~215 cm with high OD + high JS → PF track (keeps
the outside skills while training inside).

**C:** classic defensive (SB/ID/RB) or Israeli all-four. **No secondary skills at
all — full-in on primaries** (talls train them very fast). Ambitious entry bands:
IS 18-20 · ID 16-17 · RB 12-16 · SB present (band unstated). Read together with
batch 1: those were the viability MINIMUMS (ID 15/IS 15/RB 11), these are the
full-in targets.

## Open items for the smart-pass design

- Encode viability gates as first-class M1 bars per class (outside/big; wing TBD).
- Value function components confirmed so far: M1 gates, in-season progression shape,
  end-build value, multiple proposals with reasoning.
- The build library is the bottleneck; capture method: owner voice-dumps → encode →
  engine sanity-check (reachability + cap cost). Community bug-reports fill gaps.
