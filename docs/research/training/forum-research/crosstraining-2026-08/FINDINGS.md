# Cross-training in BuzzerBeater — full evidence review (2026-08-07)

Commissioned to test whether base cross-training is the missing "concentration brake" in our
engine. **Answer: it is not.** Raw thread captures (13, `.html` + `.txt`) are in this directory;
the new SELECT-only probe is `v2/scripts/research/xtrain-gap-distribution.mts`.

## 1. DEV-STATED

### 1.1 The core statement (`BBmanual.txt:715`; identical text = the July-2011 season-17 launch announcement, quoted at forum `191779.26`, reposted as `191959`)

> "improvement in driving is related not just to related skills (like handling), but also more
> weakly to unrelated skills (like shot blocking). **For the average player in the game, this
> will result in approximately 10% slower training in their primary skill than before, and
> additional training in other skills approximately corresponding to that 10% loss. A
> particularly well-rounded player will continue to receive cross-training but will see a much
> lower reduction in primary skill training, while a particularly one-dimensional player will
> see a larger loss.** Although players will always receive a set amount of cross-training, it
> is difficult to predict which unrelated skills will improve on a weekly basis."

Four load-bearing claims: (1) ~10% of primary for the *average* player; (2) conserved — others
gain ≈ what the primary loses; (3) the penalty **scales with one-dimensionality**, *never
quantified anywhere*; (4) a **set amount** is always received, destination unpredictable.

### 1.2 Gym = MORE slots (`BBmanual.txt:588`)
> "The effect is very similar to the **already existing** cross training, in essence, the gym is
> giving your team **more** cross training 'slots'."

Strongest evidence that a base (gym-0) slot exists. Never says how many.

### 1.3 BB-Justin, 2026 Discord Q&A (`user-notes/discord-dev-crosstraining.png`, digest in `user-notes/dev-statements-2026.md` §2)
> "Each cross-training [slot] is assigned to a random skill (it can also be stamina or free
> throws). Because the choice is random, all slots within one training can be filled with the
> same skill. **Each slot is 10% of the main skill's training amount before elastic.** … The
> cross-training is then also affected by the elastic of that random skill."

Same source: the gym adds **1, 2 or 3 extra slots by level**; Justin declined to quantify the
10% further — *"too many other factors to quantify with a single value."*

### 1.4 Justin relayed (forum `317043`)
> "**Cross training can go to all skills, even the trained ones!** Yes, it is possible that all
> 'cross training' will go to the same skill."

### 1.5 NOT in the dev record
- **Base slot count at gym 0.** "A set amount", "already existing", "extra slots" all imply ≥1;
  none says 1.
- **The one-dimensionality scaling is never quantified.** No formula, no example, no bound.

## 2. COMMUNITY MEASURED (estimates)

- **"90/10, one base slot"** is the universal reading since 2011 (`192339.10`, `317043`), with a
  worked example (*"+0.25 OD → +0.025 in a random skill"*). Widely repeated, **never measured**.
  In `317043` an experienced manager asks *"I have never been completely sure about the actual
  number of 'default' (no gym) slots… Is it officially just one?"* — and is never answered.
- **Thread `192339` "Analyzing pops in Cross-training!"** (562 posts) catalogues ~60
  trained→popped pairs. Establishes destinations include ST/FT and non-low skills, and vary
  per player per week. **No post in 562 measures the magnitude.** The recurring "does it go to
  the skill closest to popping?" hypothesis is retired by §1.3 (uniformly random).
- **The "~0.93" figure** (`gated/t295510.txt`) is **not independent** — it is CoachParrot's own
  `xtrain_coeff` (0.925) rounded, with the exponent dropped. Discount it.
- **CoachParrot (forum `291954`, 2018)** is the only *fitted* source, and it splits the manual
  explicitly: *"we can consider cross-training as two effects happening at once. The first one
  is the cross-training malus to best skill training … The second half is random training of
  other skills."* CP models half A only. The people who built that dataset noted (`302291.21`):
  *"We could never really figure out how to estimate the effect of cross training."*
- **Gym slot magnitude**: never measured either — `309316`: *"Nobody ever made serious
  evaluations."* Singapore guide `326268`: *"the nature of how exactly it works is still unknown."*
- **Third-party models**: buzzeriq's deployed `open_source` models cross-training **not at all**
  (no gym input); its `coach_parrot` mode inherits CP's malus. Our v1 legacy engine invented a
  formula weighted toward low skills — **refuted** by §1.3/§1.4 (uniform random).

## 3. HOW OUR ENGINE MAPS TO THIS

| manual half | our parameter | value | status |
|---|---|---|---|
| A. primary loses ~10%, more if one-dimensional | `xtrain: top-skill-malus, coeff 0.925` | **shipped, active** | CP-fitted |
| B. that amount lands on random skills | `crossTraining: slot-scatter, baseSlots 0, slotShare 0.1` | **base disabled** | dev-spec, untested |

`engine.ts:162-183`: the malus multiplies the trained skill's core gain **only when it is the
current max**, exponent `max − avg over the 10 rate skills`. Scatter is **purely additive**
(`slots × 0.1 × primaryCore / 12` to all 12 skills, nothing subtracted), `slots = baseSlots + gymLevel`.

### The basis for `baseSlots: 0` is weaker than it reads
`models/bbscout.ts:88-96` argues the CP-fitted rates "already average in the base slot's
effects". Problems: (1) it is an argument, not a measurement, and is internally inconsistent
with keeping the CP-fitted *malus* as an explicit term; (2) absorption cannot work for
destination skills the training row does not touch — no rate cell exists there; (3) **every
corpus we own is gym-3**, so "unrefuted" means **untested** (`MODEL-FACTORS.md` #10 says so);
(4) the one quantitative signal points the other way — `centri-u21/ANALYSIS-2026-08-05.md` R2.2
finds ~27 observed vs ~17 EV scatter pops (**1.6× light**, one-sided p≈0.014) at gym 3;
**4 slots (base 1 + gym 3) predicts 22.7 → ratio 1.19, inside noise.**

## 4. NEW MEASUREMENT — the shipped malus is ~2× too STRONG

`v2/scripts/research/xtrain-gap-distribution.mts`, `max − avg10` on the newest full snapshot of
every player we hold, **n = 16,492** (re-run and verified 2026-08-07):

```
meanGap 3.345   medianGap 3.10   p10 1.80   p90 5.10   p99 8.70
0.925^gap:  mean ×0.770   median ×0.785   p90 ×0.672   p99 ×0.507
gap implying exactly a 10% loss: 1.351
```

Re-run **2026-08-10** on the grown corpus, **n = 19,305**: meanGap 3.315, medianGap 3.10,
p90 5.0, p99 8.5 → malus ×0.772 mean / ×0.785 median. Stable as the corpus grows.

The **median** player already loses **~21%** of primary training when training his top skill,
against a manual saying the **average** player loses **~10%**. Only the most balanced decile
sits near 10%.

Caveats: our corpus is 18-21 market/census players (skewed to untrained rookies and to listed
specialists), not "the average player in the game"; the malus only fires when the trained skill
*is* the max; displayed integers slightly overstate the gap vs internal decimals. The direction
survives all three, and it agrees with an independent line — Centri R2.1: *"three independent
within-club tests contradict the ×0.925 malus … the malus shape (≈×0.5-0.6 for specialist
centers) [is] too strong at large gaps."*

## 5. BEST ESTIMATES

| quantity | estimate | confidence |
|---|---|---|
| Base slots at gym 0 | **1** | MEDIUM (≥1 near-certain from manual; exactly 1 never dev-stated or measured) |
| Value of a slot | **10% of primary's pre-elastic weekly amount**, per slot | HIGH (dev-stated + worked example) |
| Destination | uniform random over all 12 incl. ST/FT, independent per slot, may hit the trained skill; landing skill's elastic then applies | HIGH (dev-stated; "goes to lowest" folklore refuted) |
| Gym slots | +1 per level, additive | MEDIUM-HIGH (count dev-stated; additive is community reading) |
| Should we subtract the base 10% from the primary? | **No** — our rates are CP-fitted on post-2011 pops, already net of it | MEDIUM |

On the last row: Centri total displayed growth is **−2.8%** and the quantization-free
DMI-inversion channel sits at **obs/pred 0.991**, so multiplying primaries by 0.9 would make
them ~10% cold against both. Adding a base slot as a pure addition costs ≈ **+0.8% of primary
per skill** — inside both checks' noise, and it is what the off-program pop residual asks for.

**Candidate change (NOT applied): `baseSlots: 0 → 1`, `slotShare` unchanged, primary untouched.**
Effect on a 56-week U-21 arc at a typical 0.45 lvl/wk primary: 0.1 × 0.45 / 12 ≈ 0.00375 lvl/wk
per skill → ≈ **+0.21 levels on each of the 12 skills, ≈ +2.1 TSP10**, ST/FT likewise.
*(Corrected 2026-08-10: originally published as +0.38 / +3.8, which contradicted this doc's own
"+0.8% of primary per skill" line two paragraphs up. The smaller number only strengthens §6.)*

## 6. DIRECT ANSWER TO THE COMMISSIONING QUESTION

**Cross-training is not the missing concentration brake, and turning it up will not fix a
runaway top skill.**
- A base slot moves ~0.004 lvl/wk into each skill — ~0.2 levels per skill across the whole arc.
  It cannot bend a trajectory that overshoots by 2-4 levels.
- Even as a literal *loss* (×0.9 weekly), it is a **flat** penalty applying equally to balanced
  builds; it does not selectively punish concentration. And our rates are already validated net
  of it, so applying it would double-count.
- The selective brake is the **top-skill malus** — which is already on, and which every
  measurement says is **over-strong**, not weak.

This independently corroborates
`docs/research/training/concentration-study-2026-08-07/FINDINGS.md`, which retracted the
over-concentration claim on separate grounds (simulated programs were unrealistically
monolithic; real clubs spread their budget over ~5 trainings).

## 7. OPEN QUESTIONS / NOT FOUND

1. **Base slot count is not in the dev record.** Two ways to close it: ask Justin on Discord
   (same channel that produced §1.3), or obtain a **gym-0 club training log**. Data-acquisition
   problem, not analysis.
2. **The one-dimensionality scaling has no dev number.** CP's exponent is the only candidate and
   its 2× disagreement with the manual is unexplained — possibly the manual's 10% was a
   launch-day approximation, or CP's malus is absorbing the potential cap (the two are
   confounded in any fit lacking cap data).
3. **Do gym slots also reduce the primary?** If yes, gym-3 primaries are 30% slower and **all**
   our calibration corpora (all gym 3) are mis-specified. One direct question would settle it.
4. **Did the base slot exist before the CP fit?** CP's data spans ~2009-2013, straddling the
   July-2011 introduction. If the matrix is partly pre-2011 it is *not* net of the loss and the
   "don't subtract" recommendation flips. DMI-inversion (0.991) is the empirical answer and says
   the shipped rates are right for the modern game.
5. **`slotShare` timing**: dev says 10% of the primary *before elastic*; our engine applies it to
   `primaryCore` *after* minutes and cap. Defensible, never confirmed.
6. **Nobody has ever measured cross-training magnitude** — not in 562 posts, not by the US
   crowd-sourcing project, not by CP (models half), not by buzzeriq (models none). Our Centri
   "1.6× EV at gym 3" appears to be the best quantitative estimate that exists in the BB world.
   That is a statement about how thin the field is, not about how good our number is.

## 8. WHERE TO HUNT INSTEAD (from this evidence)

1. **The potential-cap ladder** — stages 2-3 never tested (`MODEL-FACTORS.md` #8). A cap biting
   too late is exactly how one skill runs away.
2. **Absence of negative elastic** — `user-notes/in-depth-guide-extraction.md` records a signed
   per-pair chart with **negative** coefficients (JS←JR, IS←OD, ID←SB, RB←JR) and notes
   *"No shipped model has negatives"* and *"Encodable in our engine as `pair-linear` with signed
   coeffs."* Documented in our own repo, never acted on. **Top untested mechanism.**
3. **Minutes/position realism** over long single-training plans — superseded by the cadence
   measurement (real clubs run ~5 trainings, 2-week blocks; see the concentration study).

## Sources fetched (GET only, logged-in) → this directory
`t191779-m26` (launch news post) · `t191959-crosstraining` · `t192339-analyzingpops` +
`-m100/-m200/-m300/-m424/-m550` · `t317043-gymvtc` · `t309316-gym` · `t326268-sg-guide` ·
`t141616-canada-guide` · `t313486-learning`, `t309066-conundrum`, `t270987-progression`,
`t316237-crosstraining-it` (swept, no magnitude claims).
