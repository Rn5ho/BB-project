# Dev statements on training (Slovenian Discord translations, ingested 2026-07-14)

Source: screenshots from the user's Slovenian community Discord
(`discord-dev-trening1.png`, `discord-dev-crosstraining.png`, and the full
collection in `discord-collection/`) — Slovenian translations/compilations of
statements by BB dev "Justin" (official BB Discord Q&As), compiled by pjtr576
(ex-U21 NT staff) and Ketera, Feb–Mar 2026. These are the most recent, most
authoritative mechanics statements we have — they postdate every community model.

## 0. THE ELASTIC FORMULA (worked example, 19.3.2026 — "not yet verified by Justin")

`discord-collection/07-crosstraining-elastic-formula.png`, pjtr576:

> Elastika se upošteva na koncu, nanjo ne vplivajo višinski, starostni
> koeficient, stopnja trenerja.
> Primer: trening OPK [=ID], 198cm, 25 let, trener 6. stopnje, MPK [=IS] 19,
> OPK [=ID] 10:
> dodatek OPK = 0,55 × 0,42 × 0,95 × 1,03 + (19−10) × 0,02

I.e. `gain = rate × age × height × coach + Σ (linked_higher − trained) × pair_coeff`
— elastic is an **ADDITIVE sublevel bonus applied after the multiplier chain**,
NOT scaled by age/height/trainer (finally explains Dormouse's age-independence
claim). Cross-validations inside the example: rate 0.55 = the full-matrix PDF's
Inside Defense C row (550/1000 — supports the PDF over CP's 0.50); age 25 →
0.42 ✓; ID height @198cm → 0.95 ✓; trainer L6 → 1.03 ✓ (the CLASSIC ladder,
against the In-Depth guide's 99%); ID←IS coeff 0.02 ✓ Dormouse table.

**Adopted into bbscout 2026-07-14**: `additive-pair` elastic with the Dormouse
coefficient table (+ jr←od / sb←id filled from the In-Depth chart). Open
questions: whether minutes factor and cap slowdown apply to the elastic bonus
(we apply both to the whole gain), and Dormouse-vs-In-Depth-chart coefficient
disagreements (od←ha 0.007 vs 0.0332; ha←od 0.05 vs 0.0116 — suspiciously
swapped; calibration target).

## 1. Potential cap is a THREE-STAGE ladder (dev-blessed, approximate)

> Omejitev 1 → ~70–75 % učinkovitost treninga; Omejitev 2 → ~40–50 %;
> Omejitev 3 → 25 %. (Justin "blessed" the idea that potential has sublevels.)

Cap 1 ≈ 70–75% training effectiveness, cap 2 ≈ 40–50%, cap 3 = 25%.
Reconciles with Josef Ka's cap RANGE [8+2·pot, 10+2·pot]: the stages sit inside
the range. **Adopted into bbscout 2026-07-14**: staged-weighted-sum cap with
stages at score ≥ 8/9/10 + 2·pot → ×0.725 / ×0.45 / ×0.25 (replaces the single
×0.15 step, which was harsher than the dev's deepest stage).

## 2. Cross-training precisely specified

> Each cross-training slot is assigned a RANDOM skill (can be stamina or FT).
> All slots can land on the same skill. Each slot = 10% of the main skill's
> training amount BEFORE elastic. Elastic of the random skill then applies.
> The gym adds 1, 2 or 3 EXTRA cross-training slots by level.
> Justin on the 10%: "too many other factors to quantify with a single value."

Implications: CP's top-skill malus and v1's deterministic redistribution are
both wrong shapes. Correct EV model: `slots × 0.10 × mainGain`, spread across
all 12 skills (uniform random incl. ST/FT), elastic applied per landing skill.
Base slot count (without gym) still unknown — its effects are averaged into the
fitted rates. ADOPTED 2026-07-14 as EV: gym-added slots × 10% of primary spread
over 12 skills; validated on the owner gym-3 trainees (~2-3 off-pops/10wks ✓).
Also explains BuzzerIQ's training_court/gym no-op as a real gap.

## 3. Sub-threshold minutes: real data points (18–19yo)

> Displayed training minutes are rounded (46.50–47.49 shows as 47); 47.00+ is
> full training. 18/19-year-olds below 45': 94.7% of training at 43.8 min,
> 93.4% at 43.5 min. An 18yo displaying 44' without the full-training checkmark
> is really at 43.5–43.99 and "should have at least 97% of training".

Near-threshold slope ≈ 4.4 pp/min below 45' (vs our linear minutes/44 which
gives ~99.5% at 43.8 — too generous near the boundary; note the 94.7% and
"≥97%" statements are mutually tense — different sources/precision). Only
matters for inference confidence; plans target full minutes. NOT yet modeled.

## 4. Skills exceed 20 internally; elastic has no ceiling

> Elastic has no limit (e.g. 22 HA helps more than 20 HA); the effect above 20
> does not diminish.

Skills above 20 exist and keep working (matches BuzzerIQ accepting inputs to
27 and the In-Depth guide's builds showing OD 22 / SB 22). **Adopted
2026-07-14**: engine no longer clamps internal skill values at 20 (display
remains clamped 1..20).

## 5. Game-shape training has usage-based diminishing returns

> The effect of Game Shape training decreases with each use in the last
> 4 weeks; resets every season.

Phase B note for any GS advice features. Not modeled.

## 6. Misc confirmations / signals

- Ball Handling trains handling, driving and a little outside defense —
  matches the full matrix row (OD 100 / HA 600 / DR 350).
- Q: "Are IS, JS, DR trained at the same speed regardless of height in
  1on1F / JSF / 1on1G?" Justin: **"No."** — at least one of JS/DR is NOT
  height-flat in those trainings (or refers to IS which our table already
  scales). Weak signal against flat JS/DR height columns; calibration question.
- (Second screenshot, Ketera:) enthusiasm ≈ +5%/level to both defenses at 3
  levels ≈ home-court advantage — ratings context, not training.

## 7. Full collection (discord-collection/) — additional facts

Training/scouting-relevant:
- **Skills > 20 fully effective in the game engine** ("V GE ni prav nič
  drugačnega izračuna za skile > 20") — third confirmation; forum mantra that
  20+ is wasted is wrong. Tactics %-boosts scale with skill (20+10%=22).
- **Game shape**: each GS level ≈ ±10% on skills (offense slightly more than
  defense); GS shown as 7 at season start is really 6.001; max GS 9, no
  sublevels; stamina burn purely tactic-driven.
- **DMI is not used by the game engine** — display-only number over skills.
- **Potential sublevels are continuous bands**: e.g. all-time-great = 10.95+,
  HOF = 10.00–10.94 (top ~5% of the 10-range is relabeled) — supports
  cap-within-range placement by potential sublevel.
- **Draft**: each 48-player class is generated with a guarantee of ≥1 player
  of potential 9+ (if none rolled, one player is upgraded) — scouting note:
  every Slovenian draft season contains at least one MVP+ prospect per league.
- **Age 34+ decline**: twice-weekly 8% chance of a 10% drop in a random skill
  (excl. ST/FT), worsening each year past 34; career-extension specialist
  reduces it; ~2–3 drop events/season at 35 (Justin). Not U-21 relevant.
- Experience: more minutes = more XP; playoff/cup games weigh more; friendlies
  count. XP boosts skills in the last 5 minutes of games.
- Matchup advantage saturates around a 3-skill difference (old dev statement,
  believed still true).
Rest of the collection (tactics box-and-one/zones, fan survey, merchandise,
MVP voting, injuries, All-Star, attendance) — not training-relevant; archived
for general reference.
