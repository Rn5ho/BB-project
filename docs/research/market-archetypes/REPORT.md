# Market Archetypes — Season 72 (age-21 flood)

Generated: 2026-08-04T13:19:04.831Z · window start 2026-07-10 · seed 72
Re-run: `npm run training:archetypes` from v2/ (bump SEASON for next season's flood).

## What this says, in plain language

We looked at 1240 finished 21-year-old players that top U-21 training
programs sold at the end of season 72, split them into outside / inside / wing-forward
groups, and let the data reveal which distinct builds exist in each group. Each build below
comes with: how common it is, what the typical skills look like, how much defense the elite
versions carry, and (with --plans) the optimized week-by-week training path to reach it.

## Cohort funnel

| step | n |
| --- | --- |
| age-21 full-skill market listings (deduped) | 1240 |
| outside (b>=+1, <=201cm) | 583 |
| inside (b<=-1, >=203cm) | 294 |
| wing/forward (between) | 298 |
| appendix: short inside-leaning | 65 |
| outside pool after pot>=7 | 496 |
| inside pool after pot>=8 | 195 |
| wing pool after pot>=7 | 245 |

Coverage caveat: Jul 23–Aug 2 captures were suppressed by BB's 1000-result search cap
(fixed 2026-08-03 by per-age sweeps); the cohort skews toward Aug 3+ captures.

## outside group — k=2

Silhouette by k: {"2":0.14067782032145046,"3":0.10997216911599493,"4":0.08250655264386766,"5":0.07954759038212644} · ward-vs-kmeans agreement 0.72 · bootstrap Jaccard 0.64, 0.68

### Market: outside #1 (mkt72-outside-1)

210 members · 5 elite · floor OD>=15 passed by 13/210 · near-cap 7 · 153 distinct sellers · self-match 60% (BELOW 70% gate after full relaxation; relaxed: ha,dr,js)

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 7 | 7 | 7 | 7 | 8 | 6 | 4 | 3 | 4 | 4 |
| median | 9 | 8 | 9 | 9 | 10 | 7 | 6 | 5 | 6 | 6 |
| p75 | 12 | 10 | 11 | 11 | 12 | 9 | 9 | 8 | 8 | 8 |
| elite median | 15 | 10 | 15 | 13 | 15 | 9 | 11 | 9 | 6 | 7 |

Typical: height 190cm · TSP 77 · potential {"7":63,"8":49,"9":57,"10":41} · ST p50 5 · FT p50 8

Examples: [Olegas Sergadejevas](https://www.buzzerbeater.com/player/55061198/overview.aspx) (JS17 JR13 OD17 HA14 DR13 PA9 IS15 ID9 RB9 SB11) · [Nikos Karaindros](https://www.buzzerbeater.com/player/54699033/overview.aspx) (JS15 JR10 OD15 HA13 DR16 PA8 IS12 ID10 RB6 SB7) · [Vadim Silyanov](https://www.buzzerbeater.com/player/55042556/overview.aspx) (JS14 JR12 OD14 HA13 DR14 PA8 IS12 ID11 RB5 SB5)

### Market: outside #2 (mkt72-outside-2)

286 members · 61 elite · floor OD>=15 passed by 70/286 · near-cap 42 · 198 distinct sellers · self-match 70% (relaxed: dr)

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 11 | 7 | 8 | 12 | 13 | 6 | 5 | 5 | 3 | 3 |
| median | 13 | 8 | 10 | 14 | 15 | 8 | 8 | 7 | 5 | 5 |
| p75 | 15 | 10 | 14 | 16 | 17 | 10 | 11 | 8 | 7 | 7 |
| elite median | 16 | 10 | 16 | 16 | 17 | 8 | 9 | 8 | 5 | 5 |

Typical: height 189cm · TSP 94 · potential {"7":66,"8":68,"9":94,"10":57,"11":1} · ST p50 5 · FT p50 8

Examples: [Roberto Bellentani](https://www.buzzerbeater.com/player/54664566/overview.aspx) (JS20 JR12 OD18 HA19 DR19 PA9 IS5 ID9 RB8 SB8) · [Duilio Citti](https://www.buzzerbeater.com/player/54664855/overview.aspx) (JS20 JR11 OD17 HA19 DR19 PA7 IS9 ID10 RB5 SB8) · [Antonio Zaniolo](https://www.buzzerbeater.com/player/54666500/overview.aspx) (JS17 JR10 OD18 HA18 DR19 PA10 IS12 ID8 RB7 SB6)

## inside group — k=2

Silhouette by k: {"2":0.30488241934714916,"3":0.19922475948048693,"4":0.1598877255863802} · ward-vs-kmeans agreement 0.70 · bootstrap Jaccard 0.66, 0.88

### Market: inside #1 (mkt72-inside-1)

25 members · 6 elite · floor ID>=16 passed by 18/25 · near-cap 12 · 21 distinct sellers · self-match 67% (BELOW 70% gate after full relaxation; relaxed: sb,rb)

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 3 | 3 | 4 | 4 | 4 | 4 | 4 | 15 | 12 | 17 |
| median | 5 | 4 | 6 | 5 | 5 | 8 | 6 | 17 | 14 | 19 |
| p75 | 7 | 7 | 8 | 7 | 6 | 10 | 8 | 18 | 16 | 20 |
| elite median | 6 | 7 | 7 | 7 | 5 | 9 | 8 | 19 | 16 | 21 |

Typical: height 208cm · TSP 89 · potential {"8":13,"9":6,"10":6} · ST p50 4 · FT p50 6

Examples: [Sergej Traparić](https://www.buzzerbeater.com/player/54771089/overview.aspx) (JS8 JR7 OD6 HA8 DR8 PA12 IS7 ID16 RB14 SB17) · [Quinn Ardley](https://www.buzzerbeater.com/player/55162472/overview.aspx) (JS5 JR10 OD11 HA6 DR5 PA7 IS8 ID20 RB11 SB20) · [Alfred Hoarau](https://www.buzzerbeater.com/player/54682871/overview.aspx) (JS2 JR4 OD7 HA5 DR4 PA8 IS9 ID20 RB18 SB23)

### Market: inside #2 (mkt72-inside-2)

170 members · 11 elite · floor ID>=16 passed by 36/170 · near-cap 38 · 125 distinct sellers · self-match 73% (relaxed: sb,rb)

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 5 | 3 | 3 | 4 | 4 | 3 | 9 | 8 | 8 | 7 |
| median | 7 | 4 | 4 | 6 | 7 | 5 | 11 | 11 | 11 | 9 |
| p75 | 9 | 7 | 7 | 8 | 9 | 7 | 14 | 15 | 13 | 10 |
| elite median | 10 | 7 | 6 | 8 | 9 | 6 | 18 | 17 | 13 | 12 |

Typical: height 211cm · TSP 78 · potential {"8":59,"9":71,"10":39,"11":1} · ST p50 4 · FT p50 7

Examples: [Leticijus Rozenblatas](https://www.buzzerbeater.com/player/55047695/overview.aspx) (JS13 JR9 OD10 HA11 DR11 PA11 IS20 ID17 RB11 SB11) · [Vardis Alvanos](https://www.buzzerbeater.com/player/54697198/overview.aspx) (JS9 JR6 OD7 HA10 DR9 PA6 IS19 ID17 RB14 SB14) · [Kristijonas Enikas](https://www.buzzerbeater.com/player/54740746/overview.aspx) (JS12 JR8 OD6 HA11 DR11 PA9 IS20 ID18 RB6 SB9)

## wing group — k=1 (k=2 unstable under bootstrap; collapsed)

Silhouette by k: {"2":0.14457463171641582,"3":0.0962686654136707,"4":0.08724160136592764,"5":0.08667165557918702} · ward-vs-kmeans agreement 1.00 · bootstrap Jaccard 1.00

### Market: wing #1 (mkt72-wing-1)

245 members · 6 elite · floor OD>=14 passed by 9/245 · near-cap 4 · 173 distinct sellers · self-match 83%

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 7 | 5 | 5 | 7 | 7 | 5 | 6 | 5 | 6 | 5 |
| median | 9 | 7 | 7 | 9 | 10 | 7 | 8 | 7 | 7 | 6 |
| p75 | 11 | 8 | 9 | 12 | 12 | 8 | 10 | 9 | 9 | 8 |
| elite median | 14 | 9 | 15 | 16 | 17 | 8 | 10 | 9 | 7 | 8 |

Typical: height 203cm · TSP 76 · potential {"7":82,"8":50,"9":66,"10":46,"11":1} · ST p50 5 · FT p50 8

Examples: [Jouni Skytta](https://www.buzzerbeater.com/player/54832628/overview.aspx) (JS18 JR10 OD15 HA19 DR20 PA8 IS7 ID9 RB6 SB6) · [Maurício Constante](https://www.buzzerbeater.com/player/55038789/overview.aspx) (JS12 JR9 OD15 HA15 DR15 PA9 IS12 ID11 RB7 SB10) · [José Badillo](https://www.buzzerbeater.com/player/54952067/overview.aspx) (JS14 JR11 OD13 HA15 DR15 PA9 IS9 ID12 RB10 SB7)

## Specificity (match rates across clusters)

| archetype \ cluster | mkt72-outside-1 | mkt72-outside-2 | mkt72-inside-1 | mkt72-inside-2 | mkt72-wing-1 |
| --- | --- | --- | --- | --- | --- |
| mkt72-outside-1 | 2% | 24% | 0% | 0% | 1% |
| mkt72-outside-2 | 0% | 16% | 0% | 0% | 1% |
| mkt72-inside-1 | 0% | 0% | 52% | 2% | 0% |
| mkt72-inside-2 | 0% | 0% | 0% | 9% | 0% |
| mkt72-wing-1 | 0% | 20% | 0% | 0% | 2% |


## External benchmark: Greece U-21 (Euro bronze, S72)

Benchmark, not ceiling: Greek outside starters sit ~p60–p75 of the elite market pool;
thresholds derive from the market cohort. This section validates shapes and floors.

| player | pos | wk | skills | TSP10 | nearest build | dist |
| --- | --- | --- | --- | --- | --- | --- |
| Aristidis Vlastarakis | SF | 14 | JS17 JR11 OD17 HA16 DR17 PA10 IS13 ID9 RB9 SB2 | 121 | mkt72-outside-2 | 7.2 |
| Stilianos Theodoratos | PF | 14 | JS13 JR6 OD7 HA16 DR17 PA8 IS18 ID16 RB8 SB8 | 117 | mkt72-wing-1 | 11.7 |
| Akis Kotsalos | SF | 14 | JS16 JR11 OD17 HA16 DR17 PA7 IS13 ID9 RB6 SB4 | 116 | mkt72-outside-2 | 6.7 |
| Tasoulis Gittas | PG | 14 | JS14 JR9 OD14 HA18 DR19 PA8 IS16 ID9 RB5 SB4 | 116 | mkt72-outside-2 | 8.0 |
| Alexios Thanos | PG | 14 | JS17 JR11 OD14 HA15 DR16 PA10 IS12 ID6 RB7 SB7 | 115 | mkt72-outside-2 | 4.2 |
| Vlasis Tzougkarakis | SG | 14 | JS17 JR12 OD15 HA15 DR17 PA10 IS11 ID9 RB4 SB5 | 115 | mkt72-outside-2 | 5.3 |
| Nikos Karaindros | SF | 14 | JS15 JR10 OD15 HA13 DR16 PA8 IS12 ID10 RB6 SB7 | 112 | mkt72-outside-2 | 5.0 |
| Lefteris Sfikopoulos | SG | 14 | JS16 JR12 OD16 HA13 DR16 PA8 IS8 ID6 RB7 SB9 | 111 | mkt72-outside-2 | 6.5 |
| Nikos Loukoumis | SF | 14 | JS15 JR9 OD17 HA16 DR16 PA8 IS11 ID9 RB5 SB5 | 111 | mkt72-outside-2 | 5.7 |
| Vardis Alvanos | C | 14 | JS9 JR6 OD7 HA10 DR9 PA6 IS19 ID17 RB14 SB14 | 111 | mkt72-inside-2 | 6.3 |
| Themistoklis Chalkitis | PF | 14 | JS11 JR8 OD8 HA11 DR11 PA7 IS8 ID16 RB11 SB18 | 109 | mkt72-inside-2 | 9.4 |
| Stefanis Kotoulas | PF | 14 | JS15 JR5 OD7 HA16 DR17 PA5 IS17 ID13 RB5 SB6 | 106 | mkt72-outside-2 | 12.3 |
| Antonios Sterpis | C | 14 | JS10 JR4 OD4 HA8 DR9 PA9 IS18 ID16 RB13 SB13 | 104 | mkt72-inside-2 | 7.0 |
| Kostas Tampakis | C | 14 | JS9 JR8 OD4 HA8 DR9 PA8 IS18 ID16 RB12 SB10 | 102 | mkt72-inside-2 | 6.2 |
| Renos Grafopoulos | PG | 14 | JS14 JR8 OD16 HA16 DR17 PA7 IS3 ID5 RB7 SB5 | 98 | mkt72-outside-2 | 8.2 |
| Gryllakis Antonopoulos | C | 14 | JS6 JR2 OD7 HA5 DR2 PA8 IS9 ID17 RB15 SB21 | 92 | mkt72-inside-1 | 5.5 |
| Panteleimon Amanatis | C | 14 | JS4 JR3 OD5 HA6 DR2 PA6 IS7 ID16 RB15 SB21 | 85 | mkt72-inside-1 | 4.4 |

| cluster | members above Greek best (outside 121 / inside 117) |
| --- | --- |
| mkt72-outside-1 | 1 |
| mkt72-outside-2 | 4 |
| mkt72-inside-1 | 0 |
| mkt72-inside-2 | 1 |
| mkt72-wing-1 | 0 |

Caveats: n=17, one federation; coach-recorded levels (two SB=21 above display cap);
wk14 censored; ages came from our DB (all 21), not the workbook.

## Proposed rules (paste-ready)

See `proposed-defaults.snippet.ts` next to this report. Younger byAge tiers are added by the --plans run.

| archetype | status |
| --- | --- |
| mkt72-outside-1 | below gate — review thresholds before adopting |
| mkt72-inside-1 | below gate — review thresholds before adopting |


## Training paths (per build)

Anchor: the build must be USABLE entering age 21 (WC squad selection); the age-21
season is a finishing phase. Feasibility shown under neutral (coach 5/YT 5) and elite
(coach 7/YT 7, gym 2, TC 2) staff. Week-14s are near-zero training weeks in reality
(clubs switch to Game Shape) — treat final-week pops as bonus, not plan.

### Path to Market: outside #1

**neutral**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.89/wk

Plan: Outside Defense (PG)×2 → Ball Handling (PG)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (SF/PF)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → Outside Defense (PG)×7 → One on One (PG/SG)×36

Finishing deltas during age-21 season: JS+3

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.88/wk

Plan: Outside Defense (PG)×3 → Ball Handling (PG)×2 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → Outside Defense (PG)×6 → Ball Handling (PG)×8 → Passing (PG)×31

Finishing deltas during age-21 season: HA+1 DR+1 PA+1

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 5 | 3 | 10 | 9 | 7 | 3 | 1 | 2 | 1 | 1 |
| 20 | 9 | 4 | 13 | 15 | 13 | 4 | 2 | 3 | 2 | 2 |
| 21 | 15 | 4 | 13 | 19 | 18 | 4 | 2 | 3 | 2 | 2 |

### Path to Market: outside #2

**neutral**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.89/wk

Plan: Outside Defense (PG)×2 → One on One (PG/SG)×2 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → Jump Shot (PG/SG)×1 → One on One (PG/SG)×29

Finishing deltas during age-21 season: JS+1

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 1.05/wk

Plan: Outside Defense (PG)×3 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×18 → Passing (PG)×17

Finishing deltas during age-21 season: PA+5

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 7 | 3 | 9 | 9 | 8 | 3 | 1 | 2 | 1 | 1 |
| 20 | 12 | 4 | 14 | 14 | 14 | 4 | 2 | 3 | 2 | 2 |
| 21 | 17 | 4 | 14 | 19 | 19 | 4 | 2 | 3 | 2 | 2 |

### Path to Market: inside #1

**neutral**: REACHABLE entering 21 · full-rule end check FAIL (potential >= 8 got 7) · pop rate 0.88/wk

Plan: Shot Blocking (C)×1 → Inside Defense (C)×2 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×3 → Inside Defense (C)×2 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×3 → Rebounding (PF/C)×4 → Shot Blocking (C)×6 → One on One (PG/SG)×21

Finishing deltas during age-21 season: JS+4 HA+3 DR+5

**elite**: REACHABLE entering 21 · full-rule end check FAIL (potential >= 8 got 7) · pop rate 1.02/wk

Plan: Inside Defense (C)×2 → Shot Blocking (C)×3 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Rebounding (PF/C)×3 → Shot Blocking (C)×5 → One on One (PG/SG)×27

Finishing deltas during age-21 season: JS+4 HA+3 DR+5

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 2 | 1 | 2 | 1 | 1 | 1 | 4 | 9 | 6 | 9 |
| 20 | 3 | 2 | 3 | 2 | 2 | 2 | 6 | 14 | 10 | 14 |
| 21 | 5 | 2 | 3 | 4 | 5 | 2 | 6 | 16 | 12 | 16 |

### Path to Market: inside #2

**neutral**: NOT reachable entering 21 · full-rule end check FAIL (potential >= 8 got 7) · pop rate 0.59/wk

Plan: Inside Defense (C)×2 → Rebounding (PF/C)×1 → Inside Defense (C)×10 → Inside Scoring (C)×1 → Inside Defense (C)×8 → Rebounding (PF/C)×3 → Inside Scoring (C)×12 → Rebounding (PF/C)×1 → Inside Scoring (C)×18

Finishing deltas during age-21 season: IS+2

**elite**: REACHABLE entering 21 · full-rule end check FAIL (potential >= 8 got 7) · pop rate 0.66/wk

Plan: Inside Defense (C)×2 → Rebounding (PF/C)×1 → Inside Defense (C)×15 → Rebounding (PF/C)×3 → Inside Scoring (C)×7 → Inside Scoring (PF/C)×1 → Inside Scoring (C)×11 → Shot Blocking (C)×16

Finishing deltas during age-21 season: ID+1 RB+1 SB+2

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 2 | 1 | 2 | 1 | 1 | 1 | 6 | 10 | 6 | 6 |
| 20 | 3 | 2 | 3 | 2 | 2 | 2 | 9 | 14 | 9 | 9 |
| 21 | 5 | 2 | 3 | 2 | 2 | 2 | 15 | 14 | 9 | 9 |

### Path to Market: wing #1

**neutral**: REACHABLE entering 21 · full-rule end check PASS · pop rate 1.02/wk

Plan: Outside Defense (PG)×3 → One on One (PG/SG)×2 → Outside Defense (PG)×3 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×11 → Passing (PG)×18

Finishing deltas during age-21 season: HA+1 DR+1 PA+8

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.98/wk

Plan: Outside Defense (PG)×4 → One on One (PG/SG)×3 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → One on One (PG/SG)×32

Finishing deltas during age-21 season: JS+2

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 6 | 3 | 7 | 7 | 7 | 3 | 2 | 4 | 3 | 3 |
| 20 | 10 | 4 | 12 | 12 | 12 | 4 | 3 | 6 | 4 | 4 |
| 21 | 14 | 4 | 12 | 16 | 16 | 7 | 3 | 6 | 4 | 4 |
