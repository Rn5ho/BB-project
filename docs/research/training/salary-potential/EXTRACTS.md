# BB Salary / Sublevel / Potential-Cap / Game-Shape — extracted sources (2026-07-14)

Skill order everywhere: JS, JR, OD, HA, DR, PA, IS, ID, RB, SB (10 salary-relevant skills; ST/FT don't enter salary).

## 1. Josef Ka salary formula — canonical sources

Author is "Josef Ka" / forum alias "Joey Ka". His original posts on buzzerbeater.com are
HIDDEN for logged-out visitors (account apparently closed): thread 160760 ("Formula for
DMI, game shape, enthusiasm, and salary", Oct 2010, BB Global English) and thread 188524
("Formula for Potential Uncovered", Jul 2011) both render only OTHER users' replies to
guests. Formula survives verbatim in two implementations:

### 1a. chromebb extension (public domain) — `chromebb-salarycalc.js` (this dir)
Source: https://github.com/chromebb/chromebb/blob/master/src/salarycalc.js

```
salary_pos = 300 * exp( Σ_i ln(mult_pos[i]) * skill[i] )      # == 300 * Π mult^skill
deflate(s) = 0.86 * min( s*(0.9885151 - 0.0180707*ln s),
                         s*(2.3867857 - 0.1283662*ln s) )
salary     = max over {PG,SG,SF,PF,C} of round(deflate(salary_pos))
POSITION_MULTIPLIERS:
  pg: [1.025, 1.045, 1.080, 1.080, 1.040, 1.155, 1.000, 1.000, 1.035, 1.000]
  sg: [1.125, 1.150, 1.130, 1.000, 1.000, 1.000, 1.000, 1.000, 1.065, 1.000]
  sf: [1.180, 1.085, 1.065, 1.000, 1.000, 1.000, 1.000, 1.060, 1.090, 1.005]
  pf: [1.080, 1.000, 1.000, 1.000, 1.000, 1.000, 1.115, 1.115, 1.115, 1.060]
  c:  [1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.138, 1.135, 1.130, 1.065]
```
The 0.86 is chromebb's ad-hoc season-deflation correction ("TODO: Estimate parameters
properly at the beginning of the season, and remove the correction factor").

Also contains an independent **US-community formula** (base 245):
```
PG [1.0319,1.0460,1.0728,1.0725,1.0360,1.1515,1.0005,1.0010,1.0361,0.9996]
SG [1.1160,1.1466,1.1268,1.0012,1.0012,1.0019,0.9997,1.0010,1.0623,0.9993]
SF [1.1701,1.0839,1.0614,1.0027,0.9999,1.0007,1.0007,1.0581,1.0896,1.0016]
PF [1.0779,1.0013,1.0002,1.0014,1.0019,1.0003,1.1123,1.1101,1.1099,1.0528]
C  [1.0011,1.0009,1.0001,0.9996,1.0004,1.0007,1.1299,1.1283,1.1281,1.0619]
raw = 245 * Π coef^skill;  take max over positions = tmpsal
adj = (1.000404 + 0.001170*exp(-(ln tmpsal - 9.383502)^2 / 4.798096)) * (1 - 0.000113*ln tmpsal)
salary_US = exp( ln(tmpsal) / adj )
chromebb displays avg(JK,US) rounded to $1k.
```

### 1b. bb-salary-calc 1.0.6 (SourceForge, il7mago, last update 2013-04-15, public domain)
"based on josefka's LATEST salary formula". Files in this dir: `bb-salary-calc_1.0.6.ods`,
extracted dump `bb-salary-calc-content.txt`.
Same position multipliers and constant 300, but NEWER deflation coefficients and NO 0.86 factor:
```
deflate(s) = s * min( 0.9894173 - 0.021658378*ln s,      # "Normal1/Normal2"
                      2.276085  - 0.1225621 *ln s )      # "Monster1/Monster2"
```
Multiplier tier bands noted in sheet: 1.180 | 1.150–1.155 | 1.125–1.138 | 1.080–1.115 |
1.040–1.065 | 1.025–1.035 | 1.005 | 1.000 (free).

### 1c. Corroborations
- v1 repo memory `salary-research.md` validated vs buzzer-manager (Gregorio Sequeira: PG $68,317 …).
- buzzer-manager.com salary calculator credits Josef Ka (site fetch 2026-07-14; login = BB access key).
- Thread 324393.5 (tunjevinа) free-skill lists match multipliers=1.000 exactly.
- Salary formula was tweaked in-game around season 33 (~2015/16): "price of SB and JR go lower"
  (thread 277528.6, Big BO$$). Josef Ka tables are pre-that-change; buzzer-manager
  "tends to overestimate primary skills and underestimate secondary skills".

## 2. Josef Ka potential/cap formula ("Formula for Potential Uncovered", thread 188524, Jul 2011)

Implemented in bb-salary-calc.ods "Potential" sheet (originals hidden; il7mago transcription):
```
potential_required_pos = max(0, (Σ_i w_pos[i] * skill[i] - 8) / 2)
cap condition:  Σ_i w_pos[i]*skill[i]  >=  8 + 2*potential      (per position; capped if
                reached at ANY position — see question at 188524.112)
WEIGHTS (JS JR OD HA DR PA IS ID RB SB):
  PG: 0.18 0.26 0.30 0.24 0.12 0.52 0.03 0.04 0.20 0.03
  SG: 0.45 0.50 0.42 0.05 0.04 0.08 0.03 0.05 0.25 0.03
  SF: 0.58 0.34 0.26 0.05 0.03 0.03 0.05 0.25 0.33 0.03
  PF: 0.32 0.06 0.07 0.05 0.03 0.02 0.40 0.40 0.40 0.20
  C : 0.06 0.08 0.01 0.04 0.03 0.01 0.46 0.46 0.46 0.25
Potential integer scale: announcer=0 … all-time great=11; sublevels are thirds
(low <x.333, medium <x.667, high <x+1) in il7mago's sheet.
```
Method notes from thread: formula fitted on players whose displayed skill N = true value
in [N, N+0.99]; Josef used average values (rwystyrk: "he used 7.00-7.99 for respectable").
rhyminsimon (236748.8): "a player doesn't have a cap really, just a point at which training
slows down… josefka's formula describes cap as a RANGE within which training slow-down may
begin. It automatically takes into account the player type."

### Salary-at-cap empirical tables (independent corroboration)
- Mamba888 (188524.5, season 15): capped players' 5-position salary TOTALS cluster per
  potential regardless of build: PA 150–200K, SS 300–350K, MVP 450–500K, HOF 650–750K.
- LeYeNdiNhA study (orig. Spanish, thread 88737.4, May 2009; hundreds of tracked players):
  cap salary (best-position): announcer ~6k; bench warmer 8–9k; role player ≤13k;
  6th man 15–17k; starter 21–24k; star 33–40k; allstar 43–65k; per.allstar 80–100k;
  superstar 125–145k; MVP 165–195k; HOF 250k+ (specul.); ATG 350k+ (specul.).
  Key mechanics: SF is the FIRST position to cap at equal potential ("hay bases Allstar de
  60k sin colapsar y aleros de 45k que sí"); salary (not raw skills) is the best predictor
  of capping; potential has sublevels; **cap ≠ wall**: "la tabla dice donde dejan de mejorar
  a velocidad estandar… por muy lento que suba, acabará subiendo".
  English repost w/ updated low-pot correction: thread 98371.35 (bench warmer 8k, role
  player 13k, 6th man 15-17k, starter 21-24k, star 33-40k, allstar 40-65k, PA 80-100k,
  SS 125-145k, MVP 165-195k) — "role players and 6th man cap 3-4k earlier".
- Old BB FAQ table (quoted in thread 307658.3, matches v1 constants):
  announcer <6k, bench warmer <8k, role player <13k, 6th man 10–15k, starter 15–20k,
  star 20–30k, allstar 30–50k, per.allstar 50–85k, superstar 80–120k, MVP 100–200k,
  HOF 200k+, ATG 300k+.

### Slowdown near/at cap
- LeYeNdiNhA (98371.40): a capped trainee still pops "each 6-7 weeks" (vs ~weekly for prime
  trainees) → at-cap speed roughly 1/5–1/7 of normal, not zero. v1 memory says "~1/3 speed
  at cap, exponential decay"; both are community estimates, no hard curve published.
- CrazyEye (98371.39): height doesn't change the cap, only how fast you reach it; a fast
  (tall, inside-training) player can overshoot the cap salary because post-cap training continues.
- BB manual (official): "Potential acts as a 'soft' cap… a player who has trained to his full
  potential may still improve, but will improve much more slowly."

## 3. Sublevel estimation techniques

- **DMI method** (thread 304344, May 2020): DMI is computed from skill levels INCLUDING
  stamina + game shape, with sublevels included, via a hidden "today's salary" ("what his
  salary would be if salaries reset today" — Myles 304344.2; confirmed by Joey Ka in hidden
  post 304344.5, acknowledged by Jeründerbar 304344.6). At GS 9 ("proficient"), DMI ≈ 10 ×
  current true salary (community rule of thumb). Technique: hold GS constant (ideally 9) and
  watch weekly DMI deltas → skill sublevel progress even without pops; also reveals GS
  sublevels (Jeründerbar 304344.4: 1,000,000 DMI at GS9 → next week GS8 with 950,000 DMI
  ⇒ "high 8" game shape).
  Also capali (307658.2): "You will have to find out if he is capped through looking at his
  DMI at GS 9" — cap detection via stalled DMI.
- **Salary-inversion method**: season-start salary recalculation reveals sublevel sums via
  Josef Ka formula inversion (this is what wozzvt's Training Site + rhyminsimon's simulator
  automated: "estimate of how close the player is to capping and their estimated salary, and
  an estimate of how much a pop in each skill will affect the salary and cap value" — 203921.1).
- **Pop-timing method**: LeYeNdiNhA's cap study asked owners to report pop dates; time
  between pops ∝ inverse training speed → infers sublevel position and cap proximity.
- buzzer-manager displays potential as a %-of-cap bar (e.g. "88%–98%", thread 236748.1);
  training-simulator (rhyminsimon) displays cap as numeric range, e.g. "20,76 with cap
  range 20–22" (same thread).

## 4. Game shape / stamina / FT vs the weekly training slot

Official (BBmanual.txt lines ~705-723):
- Skill training needs 48+ min/week at trained position(s) for max effect; less minutes →
  proportionally less (community: "1-week training" at <48).
- "Team Training" = Game Shape / Free Throws / Stamina: trains ENTIRE roster regardless of
  minutes → these three compete with skill training for the ONE weekly slot.
- GS reset to 7 each offseason; GS not updated during offseason training week (bad week to
  train GS); first-ever training update doesn't touch GS.
- Staff: Nutritionist slows/stops stamina decay ("high level… can even stop the decay
  completely! The best ones can even give it a boost!"); Massage trainer reduces GS drop from
  playing too many minutes; Training Court (gym lvl) trains FT passively "additional to normal
  training" (In-Depth guide estimate: gym lvl 3 ⇒ FT pop ≈ every 6 weeks for an 18-y-o).
- Josef Ka's GS formula thread 160760 (Oct 2010): his formula posts hidden; surviving replies
  confirm "60 is the magic number" of weekly minutes for optimal GS gain, ±10% weekly random
  factor.
- Soel's Game Shape Guide (thread 127791, Jan 2010): GS golden number 72 min/wk (720 total
  min / 10 players), practical target 60–79; better under 72 than over; GS starts at 7, max
  ~9 in practice; effect ≈ ±1 player rating per GS level ("$40,000 player plays like $20,000
  with mediocre (5) GS"); advice "never train game shape".
- In-Depth BB Training Guide (pdfcoffee/scribd): minutes needed for full training by age:
  18-19 → 45+, 20-26 → 48+, 27+ → 40+ (community estimate, differs from official 48).
- Enthusiasm decay (bb-salary-calc.ods "Enthusiasm" sheet, josefka formula):
  next = 5 + (E-5) * 0.9535 * exp(-|E-5|/60); TIE: E → 4/3*E; CT: E → 0.5*E.

## 5. Live threat to model accuracy

Thread 324393 "[Official] Salary Formulas update" (Jun 2024, BB-Justin/official): BB announced
they WILL rework salary formulas — IS will start costing for PG/SG/SF, OD will cost for PF/C,
OD more expensive for guards, with long advance notice, salaries to stay "about the same"
overall. As of the thread snapshot no implementation date; verify current season's formulas
before hard-coding Josef Ka multipliers for future-season salary projection.

## 6. Related data source (other agents' angle, noted in passing)

- BB Training Project: thread 203921 (wozzvt, Dec 2011) — greasemonkey + bbapi crowd data at
  training.bb-usa.net (dead; Wayback has only login stubs of analysis pages
  showAvgRates/showAgeEffect/showTrLevEffect). Successor of "training analysis thread" 78242.
- rhyminsimon's Training Simulator spreadsheet v2.6.S25 (thread 229484): xls
  https://drive.google.com/file/d/0ByNXe6cWgZCed1FLd2dYWERXWTQ/edit  ods
  https://drive.google.com/file/d/0ByNXe6cWgZCedGF3NzlERGZ5R0E/edit  (2012-2013; models
  elastic effect; embeds josefka cap formula + BB Training Site salary estimator;
  claimed accuracy ±0.5 level over 3 seasons).

## Files in this directory
- chromebb-salarycalc.js — canonical JK + US salary formulas (code)
- bb-salary-calc_1.0.6.ods + ods/ + bb-salary-calc-content.txt — il7mago spreadsheet (JK
  latest salary + potential weights + enthusiasm)
- t160760-*, t188524-*, t98371-m35, t88737-m4, t127791-m1, t192758-m1, t203921-m1,
  t229484-m1, t236748-m1, t277528-m1, t304344-m1, t307658-m1, t324393-m1 — forum thread
  HTML + extracted text
