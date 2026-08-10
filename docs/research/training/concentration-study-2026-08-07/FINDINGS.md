# Does our engine over-concentrate skills over a full U-21 arc? — No (claim retracted)

Date: 2026-08-07. All scripts under `v2/scripts/research/`, SELECT-only DB, shipped engine
and models **unmodified**; every variant was a local `ModelParams` copy.

## The claim that started this

While comparing training orders for a U-21 build, our engine projected a 56-week plan
(1v1 ×28 → OD ×14 → JS ×14, coach 5 / YT 6 / gym 3, full minutes, pot 9) to end at
**JS 23 / HA 21 / DR 21** — three skills at 20+.

The owner objected from experience: *"I had literally never seen a serious U-21 player that
had multiple skills at 20, let alone over 20. Only when player trained only 1on1 for 3
seasons with no OD/pa/etc."*

The data agreed with him. Among **1,649** MVP-potential (≥9) age-20/21 players:

| | count |
|---|---|
| ≥1 skill at 20+ | 13 (0.8%) |
| ≥2 skills at 20+ | 1 |
| ≥3 skills at 20+ | 0 |
| highest single skill observed | 21 |

and 0 of 5,265 matched the shape the engine predicted for a 1v1 rush (DR≥19 ∧ HA≥19 ∧ JS≥19).

I concluded this was an engine defect — a missing "concentration brake" — and proposed the
base cross-training slot (`baseSlots`, currently 0) as the culprit, citing the game manual's
statement that *"a particularly one-dimensional player will see a larger loss."*

## The control that killed it

`scripts/research/program-realism-control.mts`. Rival hypothesis: my simulated programs used
**long single-training blocks** (2-3 switches over 56 weeks). Real clubs switch training far
more often — they serve several trainees, chase needs, and lose players to transfers. If
switch cadence alone reproduces the wild concentration under the **shipped, unmodified**
model, there is no defect to fix.

Identical 56-week budget, identical staff distribution, position-appropriate training pools,
**only the switch cadence varies**:

| block length | switches | TSP10 | max skill | top3/TSP10 |
|---|---|---|---|---|
| 28 wk | 2 | 97.2 | 19.05 | **0.529** |
| 14 wk | 4 | 101.2 | 18.19 | 0.497 |
| 8 wk | 7 | 104.0 | 17.64 | 0.479 |
| 4 wk | 14 | 103.8 | 16.85 | 0.463 |
| 2 wk | 28 | 105.4 | 16.55 | 0.453 |
| 1 wk | 56 | 104.8 | 16.23 | **0.449** |

Reference points: wild age-20/21 pot≥8 → concentration **0.438-0.447**; Greek S72 bronze
squad (kept roster, medal-winning, immune to market-listing bias) → **0.459**, mean
per-player max 17.8 (highest single skill: SB 21, two loophole centers), TSP10 108.3.

**Switch cadence alone moves concentration across the entire observed range**, with no model
change whatsoever. At a realistic 4-8 week cadence the shipped model produces 0.463-0.479
against the Greek control's 0.459 — essentially a match.

## Mechanism corrected: it is training-budget DIVERSITY, not switch frequency

The control above varied two things at once. Each block picked a **random** training from the
pool, so more blocks also meant more *distinct trainings sampled* — the budget itself spread
across more skills. Cadence and diversity were confounded.

`scripts/research/cadence-vs-build-order.mts` disentangles them by holding the training
**budget fixed** and varying only delivery (monolithic vs 2/4/1-week proportional interleave):

| build | monolithic | 2wk blocks | 4wk blocks | 1wk blocks |
|---|---|---|---|---|
| owner JS/JR build | TSP 121 | 121 | 121 | 121 |
| trad pure 1v1 | 122 | 122 | 122 | 122 |
| trad balanced | 123 | 123 | 121 | 121 |

Endpoints move by at most ±1 per skill. **Interleaving a fixed budget barely matters.** So the
wild population is less concentrated because real clubs *spread their budget over more skills*,
not because they switch often per se. The retraction stands; the mechanism statement is
corrected.

## Measured real cadence and budget (own clubs, 28 weeks each)

`scripts/research/training-cadence-probe.mts` — `traininghistory.aspx`, both clubs. Two Berlin
players return identical sequences, confirming these are club-level records. The Savlje
cross-check player (49983596) returned **no parseable training rows**, so the Savlje sequence
rests on a single player's history (`long-arc/training-cadence.json` records the failure).

| club | blocks | mean block | median | max | switches / 14wk season | distinct trainings |
|---|---|---|---|---|---|---|
| Savlje BC (114360, outside) | 14 | 2.0 wk | 2 | 5 | **7** | 5 |
| Berlin BC (276888, inside) | 12 | 2.33 wk | 1 | 7 | **6** | 5 |

These are genuine training-TYPE changes, not position rotations, and both clubs accelerate
from 5-7 week blocks early to 1-week blocks late in the season.

Savlje's actual 28-week budget: **1v1 10wk (36%), OD 8wk (29%), Outside Shooting 5wk (18%),
JS 4wk (14%), PA 1wk (4%)** *(corrected 2026-08-10: 1v1 was originally tallied 9wk/32%; the
archived JSON has 10 — rows now sum to the full 28 observed weeks)*. Even a sophisticated,
NT-coach-run club spends only about a third of its weeks
on 1v1 — nowhere near the "1v1 rush" that the community narrative and our simulated programs
both assume. Berlin (inside): RB 10, IS 10, ID 6, 1v1 1, SB 1.

## Parameter sweep (superseded, kept for the record)

`scripts/research/concentration-backtest.mts` swept candidate brakes against concentration
conditional on TSP10. Best "fit" was a strengthened top-skill malus (0.925 → ~0.80). It is
recorded here **as a warning, not a recommendation**: it was fitting a confound. `baseSlots`
1-3 barely moved concentration at all (0.488 → 0.478) and *raised* total TSP, because the
current `slot-scatter` implementation ADDS scatter rather than redistributing it away from
the primary skill — so it could not have been the mechanism regardless.

## What the wild actually contains

`scripts/research/top-skill-players-profile.mts` — all 24 age-20/21 players with any skill
at 20+:

- **14 of 24 are shot-blocking bigs** (208-221 cm): SB 20-21, ID 15-18, RB 11-15, everything
  else single digits, TSP10 only 74-100. These are the "loophole" builds Marin repriced in S73.
- The outside ones are **exactly what the owner described** — 1v1 products with neglected
  OD/PA. Clearest case: 193 cm, pot 10, **HA 20 / DR 20**, JS 17, **OD 8, PA 6**.
- Skill tally reaching 20+: SB 14, OD 3, DR 3, HA 2, JS 2, RB 1, ID 1.

So the engine is broadly right about what a monolithic program produces. Such players exist;
they are rare **because clubs switch training**, not because a mechanic prevents them.

## Conclusion

1. **The over-concentration claim is retracted.** It does not survive the program-realism
   control. No engine change is warranted on this evidence.
2. **Do not refit `baseSlots` or the top-skill malus on this basis.** The apparent
   mis-calibration was an artefact of unrealistically monolithic simulated programs.
3. The real determinant of endpoint shape is **club switch cadence**, which the planner does
   not model — it projects the plan as written. A plan with 2-3 long blocks *will* produce
   extreme single skills if a club actually follows it; almost none do.
4. Residual uncertainty: against the wild (0.442) the model at realistic cadence still sits
   ~0.02 high, but the wild is confounded by transfers and partial training, and the
   high-TSP bins are thin (n=33 at 105-115, n=10 at 115-130). Against the clean Greek
   control there is no residual.

## Note on a repeating trap

This is the **second** time this project has nearly refit `baseSlots` against a confound. The
first was the Slovenian `fitnes` glossary error (see CLAUDE.md), which "manufactured a false
'unmodelled scatter' finding and nearly drove a spurious `baseSlots` refit". Same parameter,
same failure mode: an unexplained spread attributed to a missing mechanic before controlling
for the mundane explanation. Worth a standing rule — **before touching a scatter/brake
parameter, control for training-program realism and facility/staff glossary first.**

## Reframed open question (measurable)

Not "what brake is missing" but **"what switch cadence do real clubs actually run?"** That is
directly measurable from per-position match minutes, which BB serves at least 5 seasons back
(verified: schedules and boxscores resolve for seasons 69-73, with `minPg/minSg/minSf/minPf/minC`
per player). If typical cadence is 4-8 weeks, the planner's long-block plans are systematically
optimistic **as advice**, and the useful product change is an adherence/realism warning — not
an engine refit.

## Scripts

- `scripts/research/concentration-backtest.mts` — variant sweep vs conditional concentration
- `scripts/research/program-realism-control.mts` — **the decisive control**
- `scripts/research/top-skill-players-profile.mts` — profiles of the 24 wild 20+ players
- `scripts/research/skill20-reality-check.mts` — prevalence of 20+ by potential tier
- `scripts/research/history-retention-probe.mts` — BB history availability (seasons 69-73)
