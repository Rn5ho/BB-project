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

## Open items for the smart-pass design

- Encode viability gates as first-class M1 bars per class (outside/big; wing TBD).
- Value function components confirmed so far: M1 gates, in-season progression shape,
  end-build value, multiple proposals with reasoning.
- The build library is the bottleneck; capture method: owner voice-dumps → encode →
  engine sanity-check (reachability + cap cost). Community bug-reports fill gaps.
