# What the training model considers — plain-language reference

*(bbscout engine, as implemented in `v2/src/lib/training/engine.ts` + `models/bbscout.ts`.
Written 2026-08-05 so nobody has to re-read the engine to answer "does the model know about X?".
If the engine changes, update this doc in the same commit.)*

## The one-paragraph version

Every simulated week, the model takes **which training the club ran**, **how many minutes
the player played at the qualifying positions**, and the player's **age, height, current
skills, and potential**, plus the club's **coach level, youth trainer level, gym level and
training-court level**. It looks up how many "levels per week" that training gives each
skill, scales that by age / height / coach / youth-trainer multipliers, adds elastic
bonuses from linked skills, applies the minutes factor and the potential-cap slowdown,
adds gym cross-training scatter and passive training-court free throws — and accumulates
the result into hidden decimal skill values. A skill "pops" when its decimal value crosses
an integer boundary (BB displays the ceiling of the internal value).

## The weekly gain, factor by factor

For each skill the chosen training touches:

```
gain = rate × age × coach × youthTrainer × height × topSkillMalus   ← multiplier chain
gain = (gain + elasticBonus) × minutesFactor × capSlowdown          ← post-chain steps
```

| # | Factor | What it is | Values | Confidence |
|---|--------|-----------|--------|------------|
| 1 | **Training rate matrix** | Levels/week each training gives each skill, per position group. One row per training id (31 rows). Position dilution (e.g. "C only" vs "all positions") is baked into the rows. | e.g. Shot Blocking (C): SB 0.50, ID 0.20, RB 0.10 | Fitted on ~30k real training weeks (CoachParrot) |
| 2 | **Age multiplier** | Younger = faster. The whole reason U-21 development matters. | 18: 1.00 · 19: 0.95 · 20: 0.88 · 21: 0.78 · 22: 0.70 … 36: 0 | Fitted (CP) |
| 3 | **Height multiplier** | Short players train outside skills faster, tall players inside skills faster. JS/DR/PA unaffected. | ±0.05 per 2.5 cm step from 201 cm; e.g. 211 cm → IS/ID/RB/SB ×1.20, JR/OD/HA ×0.80 | Fitted (CP). Open question: HA may actually be flat (`bbscout-ha-flat` variant arbitrates) |
| 4 | **Coach level** | Head coach quality. | L1 0.88 → L5 1.00 → L7 1.06 (+3%/level) | Fitted (CP) + community-confirmed |
| 5 | **Youth trainer** | Extra speed for ages 18–19 only. | +2.5%/level (estimate — weakest-sourced multiplier in the chain) | Estimate |
| 6 | **Top-skill malus** | Training your single highest skill is slightly slower the further it sits above your average. | ×0.925^(skill − avg of all 10) when trained skill = max skill | Fitted (CP) |
| 7 | **Elastic bonuses** | A lower skill trains faster when a linked higher skill is far above it. ADDITIVE after the multiplier chain, NOT scaled by age/height/coach (2026 dev worked example). | Pair table, e.g. ha←od 0.05, id←is 0.02, pa←ha 0.03, rb←is 0.02, sb←id 0.0197, jr←od 0.0371, is←id 0.001 (disputed — one forum measurement says 0.0096) | Measured (worked example validates id←is) |
| 8 | **Minutes factor** | Full speed at ≥44 min/week (age ≤19; 47 at 20–26, 39 at 27+), linearly less below. Minutes must be at the training's qualifying positions. | ×min(1, minutes/44) | Threshold official (BB manual); linear shape below is an estimate |
| 9 | **Potential cap** | When the best-position weighted sum of skills reaches the potential ceiling, training slows in three stages (never stops). | ×0.725 / ×0.45 / ×0.25 at weighted-sum ≥ 8/9/10 + 2·potential (Josef Ka weights) | Dev-blessed ladder + 2,276-sample weights |
| 10 | **Gym cross-training scatter** | Each gym level adds a "slot": 10% of the primary skill's training amount lands on a random skill (any of the 12, incl. ST/FT). Modeled as expected value: spread evenly over all 12. | gym 3 → 3 × 10% of primary / 12 per skill | Dev spec + validated on gym-3 ground truth (Centri: explains 100% of off-program pops) |
| 11 | **Training court** | Passive free-throw gain, independent of minutes and of the weekly training choice. Mild age falloff. | L1 ≈ 1/11, L2 ≈ 1/7, L3 ≈ 1/6 level/week at 18 | Measured (In-Depth guide + own-team) |
| 12 | **Stamina / FT team training** | If the club trains Stamina or Free Throws as the weekly slot: flat gain, no multipliers. | ST +0.667, FT +0.5 per week | Fitted (CP) |

## Hidden sublevels and "pops"

- Skills are decimals internally; BB **displays the ceiling**: a displayed 9 means the
  internal value is anywhere in (8.00, 9.00] — ~1 full level of invisible spread.
- The engine starts a replay/projection at **displayed − 0.5** (midpoint) unless a pop
  anchor pins the sublevel (a pop observed on a known date means the skill was ≈ x.0 then).
- This is why week-level pop timing carries a ±1–2 week phase error even when the rates
  are exactly right (Centri finding: 73% of pops match within ±2 weeks vs 35% exact-week).
- Internal skills may exceed 20; only the display clamps at 20.

## Season structure

- 14 weeks per season; the player's age increments at season rollover.
- Week 14 is a NORMAL training week (owner-confirmed) but with fewer games in practice,
  so real minutes are scarce — projections assuming full minutes are optimistic there.

## Related sub-models (not part of the weekly gain)

- **Salary** (`salary.ts`): Josef Ka per-position exponential over displayed skills +
  deflation; `deflationScale` refit vs our own data (BB's 2024 salary rework makes the
  absolute level uncertain, median |err| ~12%).
- **Potential cap score** (`salary.ts potentialScore`): the same weighted sums used by
  factor 9; also drives the planner's cap bars.
- **DMI / Game shape** (reference only, `forum-research/gated/FINDINGS.md`): Joey Ka's
  exact formulas — DMI from virtual salary + GS + ST + FT; weekly GS update from minutes
  (optimum 60 min/week). Not implemented in the engine; DMI is display-only in BB.

## What the model does NOT consider (deliberately or not)

| Not considered | Why / status |
|---|---|
| **Game shape** | BB training speed does not depend on GS (dev-confirmed display chain only affects match performance). GS is not an input anywhere. |
| **Stamina decay** | Real data shows stamina DROPS over time when untrained; the engine never decreases any skill. Cosmetic for planning (ST excluded from TSP) but a known blind spot. |
| **Randomness** | The engine is expected-value only: gym scatter is spread evenly instead of landing on random skills; real weeks will scatter pops the EV can't time. |
| **Negative elastic** | Forum claims (~−0.005/level: jr slows js+rb, od slows is, sb slows id) are NOT modeled — positive-only pair table. Open calibration question. |
| **Per-slot elastic on scatter** | A gym slot landing on a skill does not get that skill's elastic bonus in the EV model. |
| **Injuries / suspensions** | Only indirectly: they reduce minutes, and minutes are an input. No injury model. |
| **Experience, DMI feedback** | Neither affects training in BB; ignored. |
| **Enthusiasm** | Match-engine concern; irrelevant to training. |
| **Multi-training weeks** | BB clubs pick exactly ONE training per week; the model assumes the same. |
| **Trainer "specialties"** | Don't exist in BB — trainers only have a level. |
| **Game-shape-week / week-14 special rules** | None exist (owner-confirmed); handled as a normal week. |

## Model variants on the scorecard

- `bbscout` — default synthesis above.
- `bbscout-low` / `bbscout-high` — rates ×0.85 / ×1.15 (median cross-source disagreement),
  cap-stage spread, YT 0 / 0.05: the ensemble band edges.
- `bbscout-ha-flat` — HA height column flattened (open question arbitration).
- `coach-parrot` — the original CP 2.1 (multiplicative exp-linked elastic, no minutes
  gating, no gym/TC/YT).
- `open-source-live` — the deployed buzzeriq.com model as probed 2026-07.

> **ERA NOTE (2026-08-05):** BB's S73-season update slightly changes the training and
> salary formulas (owner report). This doc and all calibration describe the PRE-update
> engine; watch the Friday self-trainer scorecard for post-update drift.

## Standing open questions (ranked by planning impact; 2026-08-05 Centri evidence noted)

1. **Top-skill malus shape** (NEW, round 2): ×0.925^(gap) reaches ×0.5–0.6 for
   specialist bigs and three independent within-club tests contradict it; malus-off
   removes the pjtr576 cold tilt but overshoots globally → shape (cap the exponent?)
   is the question, not existence. Owner review.
   (The round-1 "×1.48 club tilt" is CLOSED as a rate issue — the quantization-free DMI
   channel puts weekly rates at 0.991 obs/pred and excludes 1.48 at P<5e-5.)
2. **Gym scatter EV ~1.5× light** (round 2): pooled corpus ≈27 obs off-program pops vs
   ~17 EV; needs one unified recount across methods before any slotShare/baseSlots talk.
3. is←id elastic: 0.001 (Dormouse) vs 0.0096 (forum) — **Centri data favors 0.0096**
   (gap-proportional signature; fixes the 3 worst IS cases, none worsen). Owner decision pending.
4. **HA height column open at tall heights**: scaled ×0.75@213cm EXCLUDED by third-club
   ground truth (implied ×1.19); 206v201 still weakly favors scaled — shape unclear,
   tall end lands flat-or-above.
5. Minutes-factor shape below the threshold (linear is a guess).
6. Youth trainer per-level value (2.5% estimate) — weak ~4:1 lean AGAINST the age-≤19
   gate (underpowered); a designed own-team season test is feasible (~18 wks/side).
7. js→jr towing: first quantitative datapoint (Umek ×9 JR under-prediction, implied
   ~0.25 coupling) — the community-paste era-conflict is live.
8. Potential-cap stages 2–3 untested; per-player cap heterogeneity above stage 1 is real
   (Jalovec's freeze refutes ×0.725 for him; pooled stage 1 otherwise validates at 0.743).
9. Negative elastic pairs — id←sb −0.005 disfavored at claimed magnitude; others untested.
10. Base cross-training slot at gym 0 (needs a gym-0 club log).

Full evidence: `calibration-cases/centri-u21/ANALYSIS-2026-08-05.md`. Also established
there: DMI reads CONTINUOUS internal skills (weekly training probe), BB salary is set
once per season with a per-season deflator, game shape resets to 7 at rollover.
