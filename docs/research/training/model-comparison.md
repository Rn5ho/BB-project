# BB Training Model — Source-by-Source Parameter Comparison

Compiled 2026-07-14. Sources:

| ID | Source | Nature | Path |
|----|--------|--------|------|
| **V1** | Our v1 simulator | Community-derived tables + our own engine assumptions | `D:/ClaudeProjects/BB-project/web/lib/training/data.ts` + `engine.ts` |
| **SG** | Sergiu's open-source simulator (MIT) | Absolute weekly gain rates, community-derived | `scratchpad/biq/sergiu-logic.js` |
| **MAN** | Official BB game manual | Authoritative but qualitative (almost no numbers) | `D:/ClaudeProjects/BB-project/BBmanual.txt` (Training section lines 684–723; Potential line 456; Staff 507–560; Infrastructure 588–590) |
| **CMD** | CLAUDE.md distilled forum research | Forum-sourced tables (same lineage as V1, but with internal discrepancies vs data.ts) | `D:/ClaudeProjects/BB-project/CLAUDE.md` § "BuzzerBeater Training Mechanics" |

Unit convention used throughout: **sublevels/week** for an age-18 player, neutral height (201 cm), level-5 ("superior") trainer, full minutes. In these conditions V1's gain = `points / 1000` and SG's gain = raw table rate (assuming coachCoefficient = 1.0).

---

## 1. Formula structure

| Source | Formula |
|--------|---------|
| V1 | `gain = (points/1000) × age × height × trainer × youthTrainer × minutesFactor × potentialSlowdown`; then **elastic** (absolute add to the *towed* skill) and **cross-training** (redistribute ~10% of primary gains to untrained skills) |
| SG | `gain = rate × age × coach`; then **elastic** (% multiplier on the *trained* skill when a related skill is higher); then `× height`; then `× 0.8 if skill ≥ 16`. No minutes, no youth trainer, no potential, no cross-training |
| MAN | Qualitative: training area + position choice; more positions = less effective; minutes matter up to threshold; younger = faster; height matters per-skill; *"a more skilled player will improve more quickly"* (related skills accelerate training); potential = soft cap; cross-training ≈ 10% redistribution |
| CMD | Same structure as V1 (it is V1's source): base × age × height × trainer × minutes × potential + elastic bonus |

**Verdict: AGREE on multiplicative core (base rate × age × height × trainer).** The disagreements are in which extra terms exist (minutes, youth, potential, cross-training, ≥16 slowdown) and in the elastic mechanism (§8). SG omitting the minutes factor entirely means it silently assumes full training every week.

Also note: V1 `WEEKS_PER_SEASON = 16`; SG builds **14 training weeks per season** in its UI. The manual's schedule shows one Training Update per week but doesn't state weeks/season. → **CONFLICT (14 vs 16)** — a 14% systematic error on every full-season projection.

---

## 2. Age curve

| Age | V1 | SG | CMD | MAN |
|-----|----|----|-----|-----|
| 18 | 1.00 | 1.00 | 1.00 | "younger players improve more quickly" (no numbers) |
| 19 | 0.95 | 0.95 | 0.95 | — |
| 20 | 0.88 | 0.88 | 0.88 | — |
| 21 | 0.78 | 0.78 | 0.78 | — |
| 22–35 | 0.70 → 0.01 | identical | identical | — |
| 36+ | 0.00 | 0 (missing key → 0) | 0.00 | — |

**Verdict: AGREE — byte-identical table in all three numeric sources.** (They share a common forum ancestor, so this is one independent datapoint, not three.) Manual confirms direction only. For 18→21 the model claims a 22% slowdown over our whole horizon of interest.

---

## 3. Height curve

Common ground: JS and DR flat 1.0 at every height; JR/OD scale **down** with height (1.5 @175 → 0.45 @229); IS/ID/RB/SB scale **up** (0.5 @175 → 1.55 @229). Those six columns are numerically identical in V1, SG, CMD.

The two disputed columns:

| Column | V1 | SG | CMD | MAN |
|--------|----|----|-----|-----|
| **HA (Handling)** | Scales down with height like JR/OD (1.5 @175 → 0.45 @229) | **Flat 1.0 at every height** | Scales down (same as V1) | silent |
| **PA (Passing)** | Flat 1.0 | Flat 1.0 up to 196 cm, then **increases**: 1.1 @198, 1.2 @201, 1.3 @203, 1.4 @206–208, 1.5 @211–216, 1.7 @218, 2.0 @221+ | Flat 1.0 | silent |

**Verdict: CONFLICT on HA and PA.**
- HA: for a 175 cm PG this is a 50% disagreement on handling training speed; for a 211 cm project-guard center it's 0.8 vs 1.0 (25%).
- SG's PA column is bizarre (irregular steps, 1.4 repeated at 206 and 208, header comment says "parsed from table") — it reads like a transcription of a *different* community table, possibly one asserting tall passers train PA faster. No corroboration anywhere else. V1/CMD's "JS, DR, PA height-independent" matches the classic forum table.
- Manual only confirms that height-dependence exists in both directions; it names rebounding explicitly ("He'll learn more quickly though…" about a tall low-RB player — consistent with tall → faster RB, matching all sources).

---

## 4. Trainer multiplier

| Level | V1 / CMD | SG | MAN |
|-------|----------|----|-----|
| 1 minimal | 0.88 | user-supplied free input (`coachQuality`), no table | 7 named levels confirmed (minimal … world-renowned), "diminishing returns of higher levels", no numbers |
| 2 basic | 0.91 | — | — |
| 3 competent | 0.94 | — | — |
| 4 advanced | 0.97 | — | — |
| 5 superior | 1.00 | — | — |
| 6 exceptional | 1.03 | — | — |
| 7 world-renowned | 1.06 | — | — |

**Verdict: ONLY-IN-ONE (V1/CMD lineage).** SG deliberately punts (user enters the coefficient). Manual confirms the ladder exists and that returns diminish, but V1's linear +0.03/level actually contradicts "diminishing returns" in shape. Total spread is only ±12%, so error is bounded. Note manual says trainers help "both in-game and during the week" — no source models an in-game component.

---

## 5. Youth trainer

| Source | Claim |
|--------|-------|
| V1 | `1 + 0.025 × level`, applied only at ages 18–19; explicitly flagged as estimate |
| SG | Absent |
| MAN | Official: exists as secondary staff; affects **only 18- and 19-year-olds**; extra training "on top of" main trainer; "only top level youth trainers" give a felt effect (implies a convex, not linear, curve) |
| CMD | "estimated 2.5%/level", echoes V1 |

**Verdict: GAP.** Existence + age gating is official; magnitude is a guess. Manual's "only top level matters" hints V1's linear model overpays low levels and underpays level 7. Directly relevant to our U-21 population.

---

## 6. Minutes rule

| Source | Threshold | Below-threshold behavior |
|--------|-----------|--------------------------|
| MAN (**official numbers!**) | 18–19: **45** min/wk; 20–26: **48**; 27+: **40**; plus an official **1-minute buffer** (44 suffices at 18–19) | "will still improve, but less quickly" — shape unspecified. >48 min: harmless for training (but hurts game shape) |
| V1 | 45/48/40 (matches manual) | **Linear**: `minutes/threshold` (self-declared estimate); no 1-minute buffer |
| SG | No minutes model at all | implicitly always 1.0 |
| CMD | "Minutes factor (0.0–1.0, based on playing time in relevant position)" | memory note: "linear model, could be squared" |

**Verdict: AGREE on thresholds (one of the few officially numeric parameters — V1 matches). GAP on the sub-threshold curve.** Neither sim models the official 1-minute buffer nor minutes-*at-trained-position* (the manual ties training to playing the trained positions; both sims take a single global minutes number or none).

---

## 7. Training type tables (the big one)

### Structural differences

| Aspect | V1 | SG | MAN |
|--------|----|----|-----|
| Catalog | 10 types × up to 12 position rows (~100 combos), incl. dubious ones like "Shot Blocking PG" (SB 408) and every 1/2/3-position variant of everything | 31 fixed type+position combos, closer to BB's real dropdown (e.g. JR only as SG, PG, SG/SF, team) | Confirms: first menu = training area, second = position(s); 1–2 positions = "rapid improvement", 3+ = "reduced effectiveness"; Team Training = GS/FT/Stamina only |
| Multi-position scaling | 2-pos ≈ 0.62–0.73× of best single; 3-pos ≈ 0.28–0.59× (inconsistent by type) | 2-pos = crisp **0.75×**; 3-pos = crisp **0.4×**; team ≈ 0.25–0.55× (inconsistent) | qualitative only |
| Off-position rows | Smooth 0.9/0.8/0.7/0.6 stepdown (e.g. Pressure PG 430, SG 387, SF 344 …) — implies you can aim any drill at any position | Only the canonical positions exist | silent |

### Primary-skill rates, comparable units (sublevels/week, age 18, neutral height, coach 1.0)

| Drill (single-position) | V1 (pts/1000) | SG | Δ | Reading |
|------|------|------|-----|---------|
| Pressure/OD @PG | OD **0.430** (+HA .06, DR .04, ID .08) | OD **0.5** (+DR .05, HA .05, ID .1) | −14% | close |
| Inside Defense @C | ID **0.550** (+IS .05, SB .14) | ID **0.5** (+IS .05, SB .1) | +10% | close |
| Inside Scoring @C | IS **0.560** (+JS .13, ID .05) | IS **0.5** (+JS .1, ID .05) | +12% | close |
| Rebounding @C/PF | RB **0.560** (+ID .05) | RB **0.5** (+IS .05, ID .05) | +12% | close; SG adds IS secondary |
| One-on-One @PG/SG | DR **0.510**, HA .43, JS .39 | DR **0.5**, HA .4, JS .4 | ~0% | **best agreement in the file** |
| Jump Shot @guards | JS **0.470** (+JR .14) | JS **0.6** (+JR .2) | −22% | conflict |
| Shot Blocking @C | SB **0.680** (+ID .19, RB .08, JS .03) | SB **0.5** (+ID .2, RB .1) | +36% | conflict |
| Outside Shooting @SG | JR **0.450** (+JS .15) | JR **0.4** (+JS .2) | +13% | close-ish; PG variant 0.405 vs 0.3 = +35% |
| Passing @PG | PA **0.720** (+HA .18, DR .19) | PA **0.6** (+DR .16, HA .16) | +20% | moderate conflict |
| Ball Handling @PG | **HA 0.600**, DR .35, OD .10 | **DR 0.5**, HA .4, OD .1 | — | **CONFLICT: primary skill swapped** (see below) |
| 1v1 Team | DR **0.400**, HA .27, JS .05 | DR **0.176**, HA .22, JS .088, IS .088 | +127% on DR | **team rows diverge wildly** |

Order-of-magnitude check requested: v1 Pressure-PG OD = 430/1000 × 1.0 × … = **0.43/wk** vs Sergiu OD(PG) = **0.5/wk** → within 15%, i.e. the two independent-looking tables agree that a single-position primary skill moves ≈ 0.4–0.6 sublevels/week at age 18. Median absolute disagreement across the 11 comparable cells ≈ **±20%**; worst cells (SB, JS, team rows) ±30–130%.

### Intra-source corruption (our own lineage!)

CLAUDE.md's example rows do not match data.ts, which silently "repaired" them:

| Row | CMD literal | data.ts (V1) | SG |
|-----|-------------|--------------|-----|
| Ball Handling PG | HA=100, **DR=800**, PA=350 (total stated 1050, actual sum 1250) | OD=100, **HA=600**, DR=350 | OD=.1, **DR=.5**, HA=.4 |
| Passing PG | DR=180, PA=190, **ID=720** (ID obviously wrong) | HA=180, DR=190, **PA=720** | DR=.16, HA=.16, **PA=.6** |

For Passing, data.ts's repair (PA primary) matches SG → almost certainly right. For Ball Handling, **CMD's literal claim (DR primary) matches SG, and data.ts's repair (HA primary) is the odd one out.** Ball Handling being DR-dominant is also the classic forum consensus ("Ball Handling trains Driving hardest"). V1 likely mis-repaired this row.

**Verdict: AGREE on magnitude (±20% typical), CONFLICT on specific cells — worst: Ball Handling primary-skill swap, Shot Blocking +36%, Jump Shot −22%, all "Team" rows, and the multi-position scaling ratios (V1 ragged 0.62–0.73 / 0.28–0.59 vs SG clean 0.75 / 0.40).**

---

## 8. Elastic pairs — the direction conflict

This is the most important structural disagreement. Document precisely:

| Source | Trigger condition | Who gets the bonus | Bonus form |
|--------|-------------------|--------------------|------------|
| **V1 engine** (`calculateElasticBonuses`) | trained skill **higher** than towed skill | the **TOWED (lower, untrained)** skill | **absolute** sublevels: `coeff × (trained − towed) × age × trainer × youth × minutes` |
| **SG** (`simulateTraining` step 2) | related skill **higher** than the trained skill | the **TRAINED** skill itself | **percentage** of base gain: `gain × (1 + Σ (related − trained) × coeff)` |
| **MAN** (line 709, official) | *"a more skilled player will improve more quickly. For example, a great inside defender and rebounder will find it easier to improve his shot blocking…"* | the **TRAINED** skill (SB in the example) is accelerated by **higher related** skills (ID, RB) | unspecified |
| **CMD** | Prose says "the lower skill gets a bonus when the higher one is trained" **but its own worked example says the opposite**: JS=5, DR=15, coeff 0.011 → "(15−5)×0.011 = 0.11 → **11% bonus to JS training**" — i.e. trained JS accelerated because related DR is higher, as a **percentage** | example: TRAINED skill | percentage |

**Verdict: CONFLICT, and the official manual sides against our v1 engine.** MAN + SG + CMD's worked example all describe *higher related skills accelerating the trained skill* (a percentage boost). Only V1's engine implements *trained skill dragging up lower related skills* (an absolute transfer). V1's direction is not supported by any source here — it appears to be a misreading of CMD's ambiguous prose sentence. (Both effects could coexist in the real game, but only one has official backing.)

### Coefficient tables (semantics differ, so compare with care)

V1, 9 pairs (`trained→towed`, absolute): JS→DR .011, OD→HA .007, **HA→OD .050**, DR→HA .005, PA→HA .030, IS→ID .001, ID→IS .020, RB→IS .020, RB→ID .010. Explicitly missing: JR→JS, SB→ID, SB→RB.

SG, 15 pairs (`trained→helper`, %/level of gap): JS→DR .0211, JR→OD .0371, OD→HA .0332, PA→HA .04, DR→JS .0296, DR→PA .0129, HA→OD .0116, HA→PA .0103, IS→JS .0125, IS→ID .0289, IS→RB .0257, ID→IS .0153, RB→ID .0371, SB→ID .0197, **OD→ID .0455**.

Same-name pairs still disagree by 2–30×: JS→DR .011 vs .0211; OD→HA .007 vs .0332; HA→OD .050 vs .0116; IS→ID .001 vs .0289; PA→HA .030 vs .04; ID→IS .020 vs .0153. Pairs only in SG: JR→OD, DR→JS, DR→PA, HA→PA, IS→JS, IS→RB, SB→ID, OD→ID. Pairs only in V1: DR→HA, RB→IS.

**Verdict: CONFLICT on direction, units (absolute vs percent), pair list, and coefficients. Direction should be resolved in favor of MAN/SG/CMD-example. Coefficients: GAP.**

---

## 9. High-skill / potential slowdown

| Source | High-skill slowdown | Potential slowdown |
|--------|--------------------|--------------------|
| MAN | none stated | **Official**: potential is a **soft cap**; at max, training "slows down considerably, but will not become zero" (stated twice, lines 456 & 711). No numbers, no cap table |
| V1 | none | Sigmoid `1/(1+e^{k(skill−cap)})`, cap table announcer=11 … all-time-great=22, k ∈ {0.8, 1.2, 2.0}; **OFF by default**, labeled experimental. (Legacy salary-cap model kept only for display) |
| SG | `× 0.8` for any skill **≥ 16** — but the file's own header comment says "15% slowdown at level 18+" (code: 20% at 16+; comment: 15% at 18+ — **the source contradicts itself**) | Potential dropdown exists in the UI but is **never read by the simulation** — no effect |
| CMD | none | "soft cap — training slows dramatically (but never reaches zero)"; POTENTIAL_SKILL_CAP table echoes V1 |

**Verdict: GAP (potential), ONLY-IN-ONE + self-contradictory (SG's ≥16 slowdown).** Potential-as-soft-cap is officially confirmed; *where* the cap sits per potential level and the falloff shape are pure guesses. SG's flat 0.8 above 16 is unsourced but cheap to test empirically; it targets exactly the elite 16+ skills our best U-21s reach in season 3.

---

## 10. Cross-training / gym

| Source | Claim |
|--------|-------|
| MAN (**official, line 715**) | Every skill references every skill; average player loses **≈10%** of primary training, redistributed to other skills (≈ that 10%); well-rounded → smaller loss, one-dimensional → larger; **which unrelated skills improve weekly is unpredictable**; a set amount is always received. Gym building (line 588): adds cross-training **"slots"**, more per level |
| V1 | Deterministic: rate = `clamp(0.10 + (stdDev−3)×0.01 + 0.03×gymLevel, 0.05, 0.25)`; redistributes to untrained skills weighted toward lower skills |
| SG | Absent entirely |
| CMD | 10% deterministic redistribution decision recorded |

**Verdict: AGREE (V1 vs MAN) on the ~10% average and roundedness-dependence; V1's exact spread function, low-skill weighting, and +3%/gym-level are invented; official "slots" language suggests discrete random pops, not smooth redistribution. SG ignoring it inflates primary-skill projections ~10% per week compounding.**

---

## 11. FT / Stamina / Game-Shape training

| Source | Claim |
|--------|-------|
| MAN (official) | "Team Training" menu trains **Game Shape, Free Throws, or Stamina** for the **entire roster regardless of minutes**. Training Court building: in-season FT gains additional to normal training, weaker than a dedicated FT week. Nutritionist staff: slows stamina decay, top levels can stop or reverse it. Trainer Fitness specialty: smaller stamina drops. Offseason: GS+injuries reset; offseason GS training is wasted |
| V1 | `stamina`/`free_throw` exist in state but **no training type produces gains** for them; decay not modeled |
| SG | Absent (10 trainable skills only) |
| CMD | Mentions stamina-drop pain via nutritionist only |

**Verdict: GAP.** Officially FT/Stamina are whole-roster, minutes-free trainings, but no source has a single number for their gain rate or for stamina decay rate. Irrelevant for TSP-power-curve prediction except that every real-world week spent on Team Training is a **zero-progress week for the 10 core skills** — plan-level, not rate-level, uncertainty.

---

## 12. Game shape ↔ training interaction

| Source | Claim |
|--------|-------|
| MAN (official, line 717) | GS reflects practice sharpness → affects match performance; **"it is not an indicator of how effective his training sessions were"**. Minutes drive GS (too few or too many both bad, gradual over weeks). First-week players skip GS update |
| V1 / SG / CMD | None model GS affecting skill training |

**Verdict: AGREE — GS does not multiply skill training; both sims' omission is officially correct.** (Indirect coupling exists: chasing 45–48 training minutes can push players into >48 min GS penalties, a scheduling trade-off, not a rate term.)

Related official item no source models: **older-player skill drops** (Trainer "Career Extension" specialty reduces their frequency) — irrelevant under age 22, safely ignorable for us.

---

## Top agreements
1. **Age curve**: numerically identical across all numeric sources (18: 1.00 → 21: 0.78 → 35: 0.01).
2. **Height curve for 6 of 8 scaled columns** (JR/OD down, IS/ID/RB/SB up, JS/DR flat) — identical values.
3. **Magnitude of primary gains**: independent tables agree a single-position primary skill moves ≈ 0.4–0.6 sublevels/week at age 18 (median cell disagreement ±20%; One-on-One agrees to within rounding).
4. **Minutes thresholds** (45/48/40) — V1 matches the manual's official numbers exactly.
5. **Potential = soft cap, never zero** and **cross-training ≈ 10%** — V1's structure matches the manual's official description.

## Top conflicts
1. **Elastic direction**: V1 boosts the lower *towed* skill (absolute); SG + manual + CLAUDE.md's own worked example boost the *trained* skill when related skills are higher (percentage). Official text sides against V1.
2. **Ball Handling primary skill**: V1 says HA 0.6 / DR 0.35; SG and CLAUDE.md's literal row say DR-dominant (~0.5–0.8) — V1 likely mis-repaired a corrupted forum row.
3. **Height for HA and PA**: V1/CMD scale HA down with height, SG holds HA flat; SG scales PA up to 2.0 at 221+ cm, V1/CMD hold PA flat.
4. **High-skill slowdown**: SG's ×0.8 at skill ≥16 (self-contradicting its own comment saying 15% at 18+) vs nothing anywhere else.
5. **Multi-position & team scaling**: SG's clean 0.75×/0.40× vs V1's ragged 0.62–0.73/0.28–0.59; team rows differ by up to 2.3×.
6. **Weeks per season**: V1 projects 16 training weeks/season, SG 14.

## Top gaps (nobody knows)
- Potential cap placement per level and falloff shape (officially soft, numerically unknown).
- Elastic coefficients (2–30× spread between sources) + missing pairs (JR→JS, SB→RB).
- Sub-threshold minutes curve (linear? squared?) and minutes-at-trained-position accounting.
- Youth trainer magnitude (manual hints convex "only top levels matter"; V1 assumes linear 2.5%/level).
- FT/Stamina training rates and stamina decay rate (officially exist, zero numbers).
- Trainer multiplier true values (0.88–1.06 is plausible but single-lineage; manual's "diminishing returns" contradicts V1's linear ladder).

---

## Ranked: 10 most consequential unknowns/conflicts for 3-season prediction accuracy (ages 18–21)

1. **Elastic mechanism direction + units** — affects every week of every skill; the official manual contradicts our v1 engine; compounding a wrong-direction percentage-vs-absolute term for ~45 weeks distorts both the trained skill and its neighbors. Fix direction first (cheap, official backing), calibrate coefficients later.
2. **Training-table cell values (±20–36% on specific drills, Ball Handling primary-skill swap)** — a 25% rate error on the drill a plan leans on = ±1.5–2 full skill levels over 3 seasons. Ball Handling and Jump Shot are exactly the guard drills Slovenia's U-21 pipeline uses most.
3. **Potential soft-cap onset/shape** — for high-potential prospects it's negligible until skills hit the high teens, then dominates season 3; predicting *when* the brakes engage is currently pure guesswork (V1 ships with it off).
4. **Cross-training ~10% haircut + where it goes** — SG omits it (systematic +10%/wk optimism); V1's redistribution targets are invented; over 3 seasons this is ~4–6 sublevels of misallocated TSP.
5. **Multi-position/team scaling ratios (0.75/0.40 vs V1's ragged values)** — NT-relevant clubs routinely train 2–3 positions; a 0.62 vs 0.75 disagreement is a 20% rate error on most real weeks.
6. **High-skill ×0.8 slowdown at ≥16 (SG only)** — precisely targets elite U-21 skills in their final season; being wrong either way misprices the best prospects, the ones scouting decisions hinge on.
7. **Sub-threshold minutes curve** — juniors on strong club rosters often get 20–40 min/wk; linear vs squared changes their projected gains by up to ~40%, and neither sim models minutes-at-trained-position at all.
8. **Height multipliers for HA and PA** — 25–50% rate error on handling for short guards (our most common Slovenian archetype) and on passing for tall projects, exactly the corner cases scouts ask about.
9. **Youth trainer magnitude and shape** — applies to 100% of age-18/19 weeks; if the manual's "only top level matters" hint is right, V1's linear 2.5%/level is wrong at both ends (up to ±10% cumulative in the two fastest training years).
10. **Training weeks per season (14 vs 16) + trainer multiplier ladder** — pure scale errors: 14 vs 16 weeks is a flat 14% per season; the 0.88–1.06 trainer band another ±12%; both multiply everything else.

### Calibration note
We hold the raw material to settle #1, #2, #5 empirically: `skill_snapshots` deltas (api/census sources) are week-resolution observations of real training outcomes. A dozen tracked players with known club training regimes would discriminate between V1 and SG tables within one season.
