# Market Archetypes — Season 72 (age-21 flood)

Generated: 2026-08-04T13:55:10.098Z · window start 2026-07-10 · seed 72
Re-run: `npm run training:archetypes` from v2/ (bump SEASON for next season's flood).

## What this says, in plain language

We looked at 1240 finished 21-year-old players that top U-21 training
programs sold at the end of season 72, split them into outside / inside / wing-forward
groups, and let the data reveal which distinct builds exist in each group. Each build below
comes with: how common it is, what the typical skills look like, how much defense the elite
versions carry, and (with --plans) the optimized week-by-week training path to reach it.

- outside: 496 candidates -> 2 distinct builds
- inside: 195 candidates -> 2 distinct builds
- wing: 245 candidates -> 1 distinct build
- 4 of 5 builds are reachable by a Slovenian-club draftee entering age 21 under neutral staff

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

Note: self-match % elsewhere in this report is measured over each build's threshold
population (its floor-passing elite); this table's diagonal is measured over the full
cluster — the two intentionally differ.

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
Finishing deltas describe the age-21 season under the plan's final block extended to
season end; large deltas on a secondary skill mean the searcher finished its targets
early and the extension repeats its last block — treat those weeks as owner-discretionary
(e.g. swap for defense polish), not a recommendation.
Draftee profiles: outside from 59 pot>=7 Slovenian 18yos; inside from 19 pot>=8 Slovenian 18yos; wing from 50 pot>=7 Slovenian 18yos.

### Path to Market: outside #1

**neutral**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.96/wk

Plan: Outside Defense (PG)×2 → Ball Handling (PG)×2 → Outside Defense (PG)×2 → Ball Handling (PG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×10 → One on One (PG/SG)×20 → Passing (PG)×17

Finishing deltas during age-21 season: HA+1 DR+1 PA+6

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.89/wk

Plan: Outside Defense (PG)×2 → Ball Handling (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×2 → Ball Handling (PG)×1 → Outside Defense (PG)×9 → Ball Handling (PG)×1 → One on One (PG/SG)×39

Finishing deltas during age-21 season: JS+1

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 5 | 4 | 11 | 9 | 8 | 4 | 2 | 3 | 1 | 2 |
| 20 | 11 | 5 | 14 | 15 | 14 | 5 | 3 | 4 | 2 | 3 |
| 21 | 15 | 5 | 14 | 18 | 18 | 8 | 3 | 4 | 2 | 3 |

### Path to Market: outside #2

**neutral**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.89/wk

Plan: Outside Defense (PG)×2 → One on One (PG/SG)×2 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Jump Shot (PG/SG)×2 → One on One (PG/SG)×29

Finishing deltas during age-21 season: JS+1

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.89/wk

Plan: Outside Defense (PG)×2 → One on One (PG/SG)×2 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Jump Shot (PG/SG)×2 → One on One (PG/SG)×33

Finishing deltas during age-21 season: none

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 8 | 4 | 9 | 10 | 9 | 4 | 2 | 3 | 1 | 2 |
| 20 | 13 | 6 | 14 | 14 | 14 | 5 | 3 | 4 | 2 | 3 |
| 21 | 18 | 6 | 14 | 19 | 19 | 5 | 3 | 4 | 2 | 3 |

### Path to Market: inside #1

**neutral**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.95/wk

Plan: Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×2 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Rebounding (PF/C)×4 → Shot Blocking (C)×6 → One on One (SF/PF)×24

Finishing deltas during age-21 season: JS+2 HA+3 DR+6 IS+3

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 1.20/wk

Plan: Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×2 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Rebounding (PF/C)×4 → Shot Blocking (C)×4 → One on One (SF/PF)×29

Finishing deltas during age-21 season: JS+4 JR+1 OD+1 HA+4 DR+5 PA+1 IS+3

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 3 | 1 | 3 | 2 | 2 | 1 | 5 | 11 | 6 | 11 |
| 20 | 4 | 2 | 4 | 3 | 3 | 2 | 7 | 15 | 11 | 16 |
| 21 | 6 | 2 | 4 | 6 | 7 | 2 | 9 | 16 | 12 | 17 |

### Path to Market: inside #2

**neutral**: NOT reachable entering 21 · full-rule end check PASS · pop rate 0.64/wk

Plan: Inside Defense (C)×1 → Rebounding (PF/C)×1 → Inside Defense (C)×17 → Inside Scoring (C)×1 → Rebounding (PF/C)×4 → Inside Scoring (C)×14 → Inside Defense (C)×1 → Inside Scoring (C)×17

Finishing deltas during age-21 season: JS+1 IS+3 ID+2

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.80/wk

Plan: Inside Defense (C)×1 → Rebounding (PF/C)×1 → Inside Defense (C)×15 → Inside Scoring (C)×2 → Rebounding (PF/C)×3 → Inside Scoring (C)×15 → Shot Blocking (C)×19

Finishing deltas during age-21 season: ID+2 RB+2 SB+5

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 3 | 1 | 3 | 2 | 2 | 1 | 6 | 11 | 6 | 7 |
| 20 | 5 | 2 | 4 | 3 | 3 | 2 | 11 | 14 | 10 | 9 |
| 21 | 6 | 2 | 4 | 3 | 3 | 2 | 16 | 16 | 10 | 10 |

### Path to Market: wing #1

**neutral**: REACHABLE entering 21 · full-rule end check PASS · pop rate 0.96/wk

Plan: Outside Defense (PG)×3 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×2 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (SF/PF)×2 → Ball Handling (PG)×1 → One on One (SF/PF)×26

Finishing deltas during age-21 season: JS+3 HA+2 DR+2 IS+2

**elite**: REACHABLE entering 21 · full-rule end check PASS · pop rate 1.09/wk

Plan: Outside Defense (PG)×5 → One on One (PG/SG)×3 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×2 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → One on One (SF/PF)×13 → Passing (PG)×19

Finishing deltas during age-21 season: JS+1 HA+1 DR+1 PA+5

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 7 | 3 | 7 | 7 | 7 | 3 | 3 | 4 | 3 | 3 |
| 20 | 11 | 4 | 12 | 12 | 12 | 4 | 4 | 6 | 4 | 4 |
| 21 | 13 | 4 | 12 | 16 | 17 | 4 | 6 | 6 | 4 | 4 |

## Slovenia gap analysis

Every tracked Slovenian 18–21 prospect vs the nearest derived build. Status logic is
age-aware: at 18/19 we grade the elastic FEEDERS (HA/DR), not defense; at 20 we check the
defense season is actually happening; at 21 we check the floor is still closable.

The universe here is every tracked Slovenian 18–21 prospect (1183), most of
whom were never elite-track candidates; WATCH is therefore the expected mode, and the
ON-TRACK list (46) is the actual elite pipeline.

At season week 14, every age-21 floor gap is unclosable by definition ("0
weeks left"), so the age-21 AT-RISK block below is a graduating-class artifact right
now — re-run early next season for actionable age-21 grading.

| player | age | nearest build | status | gaps (next tier) | why |
| --- | --- | --- | --- | --- | --- |
| [Oskar Pezdirc](https://www.buzzerbeater.com/player/55135423/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 7->12 HA 6->16 DR 7->17 PA 3->4 RB 2->4 | defense season, not training OD (inferred: unknown) |
| [Valen Šušterčič](https://www.buzzerbeater.com/player/55135430/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 9->18 OD 7->14 HA 13->19 DR 14->19 ID 3->4 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Baltazar Mikš](https://www.buzzerbeater.com/player/55135431/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 3->15 OD 6->14 HA 9->18 DR 6->18 PA 2->8 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Kevin Turkoš](https://www.buzzerbeater.com/player/55135438/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | OD 10->12 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Aleksej Pevc](https://www.buzzerbeater.com/player/55135439/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 6->14 HA 7->18 DR 7->18 PA 7->8 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Božo Herceg](https://www.buzzerbeater.com/player/55135440/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 6->14 HA 5->18 DR 7->18 PA 6->8 ID 1->4 | defense season, not training OD (inferred: unknown) |
| [Silvo Bartol](https://www.buzzerbeater.com/player/55135447/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 9->14 HA 10->19 DR 12->19 ID 1->4 SB 2->3 | defense season, not training OD (inferred: 15) |
| [Blaž Šušter](https://www.buzzerbeater.com/player/55135458/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 12->13 OD 7->12 HA 14->16 DR 15->17 RB 3->4 | defense season, not training OD (inferred: unknown) |
| [Miro Jecl](https://www.buzzerbeater.com/player/55135460/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 6->12 HA 7->16 DR 5->17 IS 4->6 RB 3->4 | defense season, not training OD (inferred: unknown) |
| [Alen Mac](https://www.buzzerbeater.com/player/55135484/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 9->14 DR 18->19 | defense season, not training OD (inferred: unknown) |
| [Iztok Gorenčec](https://www.buzzerbeater.com/player/55135492/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 13->18 OD 10->14 HA 12->19 DR 15->19 ID 2->4 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Janez Vrbnjak](https://www.buzzerbeater.com/player/55135494/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 10->16 ID 11->16 | defense season, not training ID (inferred: unknown) |
| [Ahmed Pitamič](https://www.buzzerbeater.com/player/55135526/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | OD 3->4 IS 10->16 ID 9->16 RB 7->10 SB 7->10 | defense season, not training ID (inferred: unknown) |
| [Andi Pečevnik](https://www.buzzerbeater.com/player/55135537/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 7->14 HA 3->18 DR 6->18 PA 5->8 RB 1->2 | defense season, not training OD (inferred: 21) |
| [Erik Verbič](https://www.buzzerbeater.com/player/55135543/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 15->18 OD 10->14 HA 11->19 DR 13->19 | defense season, not training OD (inferred: unknown) |
| [Ken Železnikar](https://www.buzzerbeater.com/player/55135546/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 9->12 HA 15->16 DR 14->17 | defense season, not training OD (inferred: unknown) |
| [Lojz Kužnik](https://www.buzzerbeater.com/player/55135565/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 4->15 OD 7->14 HA 6->18 DR 6->18 PA 7->8 IS 2->3 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Simon Neudauer](https://www.buzzerbeater.com/player/55135566/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 DR 2->3 IS 9->16 ID 9->16 SB 6->10 | defense season, not training ID (inferred: unknown) |
| [Sandi Terčon](https://www.buzzerbeater.com/player/55135573/overview.aspx) | 20 | mkt72-inside-1 | AT-RISK | JS 1->6 JR 1->2 HA 1->6 DR 2->7 IS 4->9 ID 11->16 RB 7->12 SB 16->17 | defense season, not training ID (inferred: unknown) |
| [Leonard Vozel](https://www.buzzerbeater.com/player/55135581/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->18 JR 5->6 OD 7->14 HA 16->19 DR 17->19 | defense season, not training OD (inferred: unknown) |
| [Valentin Šmejc](https://www.buzzerbeater.com/player/55135594/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 4->12 HA 6->16 DR 5->17 | defense season, not training OD (inferred: unknown) |
| [Arne Remič](https://www.buzzerbeater.com/player/55135645/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 JR 2->4 OD 1->12 HA 5->16 DR 3->17 RB 1->4 | defense season, not training OD (inferred: unknown) |
| [Lovro Mayer](https://www.buzzerbeater.com/player/55135681/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 5->12 HA 10->16 DR 11->17 IS 5->6 ID 4->6 | defense season, not training OD (inferred: 5) |
| [Miha Vogrinčič](https://www.buzzerbeater.com/player/55135685/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 7->14 HA 6->18 DR 8->18 PA 5->8 ID 2->4 | defense season, not training OD (inferred: 5) |
| [Herman Hvalica](https://www.buzzerbeater.com/player/55135702/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 10->16 ID 11->16 SB 8->10 | defense season, not training ID (inferred: unknown) |
| [Aljaž Bolha](https://www.buzzerbeater.com/player/55135704/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 9->18 OD 5->14 HA 11->19 DR 13->19 PA 4->5 ID 3->4 SB 1->3 | defense season, not training OD (inferred: unknown) |
| [France Svete](https://www.buzzerbeater.com/player/55135728/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 13->18 OD 7->14 HA 18->19 DR 18->19 PA 4->5 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Nino Grmek](https://www.buzzerbeater.com/player/55135749/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 1->6 DR 2->3 PA 1->2 IS 7->16 ID 6->16 RB 6->10 SB 4->10 | defense season, not training ID (inferred: unknown) |
| [Miroslav Golob](https://www.buzzerbeater.com/player/55135758/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->13 OD 9->12 HA 11->16 DR 12->17 | defense season, not training OD (inferred: unknown) |
| [Darko Skerlak](https://www.buzzerbeater.com/player/55135783/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 7->12 HA 10->16 DR 14->17 | defense season, not training OD (inferred: unknown) |
| [Paško Nemarić](https://www.buzzerbeater.com/player/55135791/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 7->12 HA 10->16 DR 9->17 ID 4->6 | defense season, not training OD (inferred: 16) |
| [Anton Šuštar](https://www.buzzerbeater.com/player/55135792/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 11->12 HA 13->16 DR 15->17 | defense season, not training OD (inferred: unknown) |
| [Samir Maier](https://www.buzzerbeater.com/player/55135823/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 JR 3->4 OD 7->12 HA 12->16 DR 14->17 | defense season, not training OD (inferred: unknown) |
| [Uroš Volfengenber](https://www.buzzerbeater.com/player/55135826/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 7->18 JR 5->6 OD 5->14 HA 15->19 DR 16->19 PA 4->5 | defense season, not training OD (inferred: unknown) |
| [Dore Brigelj](https://www.buzzerbeater.com/player/55135861/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 4->15 OD 7->14 HA 7->18 DR 4->18 PA 6->8 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Zoki Vek](https://www.buzzerbeater.com/player/55135898/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 6->12 HA 8->16 DR 3->17 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Erazem Bogataj](https://www.buzzerbeater.com/player/55135913/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 JR 4->5 OD 7->14 HA 4->18 DR 6->18 PA 6->8 IS 1->3 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Marjan Rom](https://www.buzzerbeater.com/player/55135915/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 4->12 HA 8->16 DR 6->17 IS 4->6 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Kristjan Rems](https://www.buzzerbeater.com/player/55135917/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->13 JR 3->4 OD 4->12 HA 7->16 DR 6->17 IS 4->6 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Vasja Mejač](https://www.buzzerbeater.com/player/55135918/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 1->15 OD 7->14 HA 6->18 DR 5->18 PA 7->8 IS 2->3 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Ranko Popivoda](https://www.buzzerbeater.com/player/55135924/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 2->12 HA 7->16 DR 5->17 IS 2->6 ID 1->6 | defense season, not training OD (inferred: unknown) |
| [Milan Vidmar](https://www.buzzerbeater.com/player/55135926/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 OD 2->4 IS 10->16 ID 8->16 SB 8->10 | defense season, not training ID (inferred: unknown) |
| [Rožle Urbanič](https://www.buzzerbeater.com/player/55135944/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 7->14 HA 6->18 DR 4->18 PA 7->8 IS 1->3 ID 1->4 RB 1->2 | defense season, not training OD (inferred: unknown) |
| [Edvard Černezl](https://www.buzzerbeater.com/player/55135955/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 JR 1->4 OD 4->12 HA 13->16 DR 14->17 ID 5->6 | defense season, not training OD (inferred: unknown) |
| [Emil Purgaj](https://www.buzzerbeater.com/player/55135975/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 IS 7->16 ID 7->16 RB 6->10 SB 7->10 | defense season, not training ID (inferred: unknown) |
| [Avgust Tomič](https://www.buzzerbeater.com/player/55135984/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 3->15 JR 4->5 OD 7->14 HA 6->18 DR 5->18 PA 5->8 IS 1->3 RB 1->2 | defense season, not training OD (inferred: unknown) |
| [Robi Težak](https://www.buzzerbeater.com/player/55136018/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 9->12 HA 13->16 DR 14->17 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Milan Peterec](https://www.buzzerbeater.com/player/55158715/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 12->18 OD 13->14 HA 14->19 DR 16->19 SB 1->3 | defense season, not training OD (inferred: unknown) |
| [Oskar Jukić](https://www.buzzerbeater.com/player/55159709/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 JR 2->4 OD 11->12 HA 2->16 DR 8->17 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Jan Salamar](https://www.buzzerbeater.com/player/55197360/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 2->12 HA 9->16 DR 7->17 PA 3->4 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Izidor Mackotevc](https://www.buzzerbeater.com/player/55202826/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | HA 1->3 IS 7->16 ID 8->16 RB 7->10 SB 7->10 | defense season, not training ID (inferred: unknown) |
| [Hinko Pogac](https://www.buzzerbeater.com/player/55439683/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 10->14 HA 9->18 DR 5->18 PA 6->8 | defense season, not training OD (inferred: unknown) |
| [Mike Adorjan](https://www.buzzerbeater.com/player/55439684/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 8->12 HA 6->16 DR 6->17 PA 2->4 IS 2->6 | defense season, not training OD (inferred: unknown) |
| [Žak Intihar](https://www.buzzerbeater.com/player/55439685/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 12->15 OD 5->14 HA 8->18 DR 11->18 ID 2->4 RB 1->2 | defense season, not training OD (inferred: unknown) |
| [Leonard Verhovčak](https://www.buzzerbeater.com/player/55439689/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 10->14 HA 15->19 DR 17->19 | defense season, not training OD (inferred: unknown) |
| [Igor Bokal](https://www.buzzerbeater.com/player/55439691/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 6->14 HA 8->18 DR 9->18 PA 6->8 ID 1->4 SB 1->3 | defense season, not training OD (inferred: unknown) |
| [Ferdi Juršek](https://www.buzzerbeater.com/player/55439697/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 12->13 OD 8->12 HA 9->16 DR 11->17 PA 3->4 ID 5->6 | defense season, not training OD (inferred: unknown) |
| [Urh Čuješ](https://www.buzzerbeater.com/player/55439702/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 5->12 HA 6->16 DR 9->17 RB 2->4 | defense season, not training OD (inferred: unknown) |
| [Avgust Mahorič](https://www.buzzerbeater.com/player/55439707/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 8->12 HA 7->16 DR 11->17 | defense season, not training OD (inferred: unknown) |
| [Pero Koren](https://www.buzzerbeater.com/player/55439708/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 8->12 HA 7->16 DR 7->17 IS 3->6 | defense season, not training OD (inferred: unknown) |
| [Goran Lapanja](https://www.buzzerbeater.com/player/55439716/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->15 OD 8->14 HA 10->18 DR 9->18 PA 5->8 ID 3->4 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Ferdinand Udovčič](https://www.buzzerbeater.com/player/55439730/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 8->14 HA 8->18 DR 6->18 PA 5->8 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Slavko Pajenk](https://www.buzzerbeater.com/player/55439743/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 8->14 HA 9->18 DR 10->18 | defense season, not training OD (inferred: unknown) |
| [Patrik Macok](https://www.buzzerbeater.com/player/55439766/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 4->12 HA 5->16 DR 11->17 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Nastja Oblak](https://www.buzzerbeater.com/player/55439770/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 10->12 HA 9->16 DR 6->17 PA 3->4 | defense season, not training OD (inferred: unknown) |
| [Viki Klemenčič](https://www.buzzerbeater.com/player/55439771/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 4->14 HA 13->19 DR 16->19 | defense season, not training OD (inferred: unknown) |
| [Boško Volčanšek](https://www.buzzerbeater.com/player/55439774/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 JR 2->4 OD 8->12 HA 3->16 DR 8->17 ID 1->6 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Irvin Kisilak](https://www.buzzerbeater.com/player/55439791/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->15 OD 10->14 HA 13->18 DR 9->18 | defense season, not training OD (inferred: unknown) |
| [Mirsad Pezder](https://www.buzzerbeater.com/player/55439796/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 3->6 OD 3->4 IS 10->16 ID 5->16 RB 9->10 | defense season, not training ID (inferred: unknown) |
| [Egon Selan](https://www.buzzerbeater.com/player/55439799/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 7->12 HA 9->16 DR 10->17 IS 4->6 | defense season, not training OD (inferred: unknown) |
| [Darko Zgonc](https://www.buzzerbeater.com/player/55439804/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 5->14 HA 2->18 DR 10->18 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Primož Vidic](https://www.buzzerbeater.com/player/55439809/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 10->16 ID 9->16 SB 9->10 | defense season, not training ID (inferred: unknown) |
| [Aljaž Masterl](https://www.buzzerbeater.com/player/55439811/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 10->12 HA 6->16 DR 9->17 | defense season, not training OD (inferred: unknown) |
| [Mido Stanovnik](https://www.buzzerbeater.com/player/55439812/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 8->14 HA 10->18 DR 6->18 PA 6->8 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Patrik Šusteršič](https://www.buzzerbeater.com/player/55439814/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 8->12 HA 8->16 DR 7->17 | defense season, not training OD (inferred: unknown) |
| [Urh Trochlik](https://www.buzzerbeater.com/player/55439816/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 10->12 HA 12->16 DR 10->17 | defense season, not training OD (inferred: unknown) |
| [Žan Madić](https://www.buzzerbeater.com/player/55439820/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 IS 10->16 ID 11->16 SB 5->10 | defense season, not training ID (inferred: unknown) |
| [Miha Auer](https://www.buzzerbeater.com/player/55439830/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->15 JR 3->5 OD 8->14 HA 7->18 DR 6->18 IS 1->3 | defense season, not training OD (inferred: unknown) |
| [Drejc Kožel](https://www.buzzerbeater.com/player/55439831/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 14->18 JR 4->6 OD 10->14 HA 17->19 DR 17->19 | defense season, not training OD (inferred: unknown) |
| [Črt Žitek](https://www.buzzerbeater.com/player/55439832/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 5->14 HA 9->18 DR 8->18 PA 6->8 | defense season, not training OD (inferred: unknown) |
| [Matic Mali](https://www.buzzerbeater.com/player/55439834/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 1->12 HA 14->16 DR 13->17 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Dare Tomše](https://www.buzzerbeater.com/player/55439838/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 JR 3->4 OD 7->12 HA 7->16 DR 3->17 IS 3->6 | defense season, not training OD (inferred: unknown) |
| [Timo Lep](https://www.buzzerbeater.com/player/55439841/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 13->14 HA 15->19 DR 14->19 ID 2->4 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Rado Peterle](https://www.buzzerbeater.com/player/55439842/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 JR 2->4 OD 2->12 HA 10->16 DR 14->17 PA 1->4 | defense season, not training OD (inferred: unknown) |
| [Zlatan Mikšič](https://www.buzzerbeater.com/player/55439843/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 IS 8->16 ID 7->16 RB 8->10 SB 3->10 | defense season, not training ID (inferred: unknown) |
| [Nastja Rutar](https://www.buzzerbeater.com/player/55439850/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 7->12 HA 8->16 DR 8->17 RB 3->4 | defense season, not training OD (inferred: unknown) |
| [Miki Kozlar](https://www.buzzerbeater.com/player/55439854/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 5->14 HA 17->19 DR 15->19 | defense season, not training OD (inferred: unknown) |
| [Bor Redžić](https://www.buzzerbeater.com/player/55439861/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 JR 1->4 OD 9->12 HA 9->16 DR 7->17 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Gregor Hoda](https://www.buzzerbeater.com/player/55439863/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 3->12 HA 4->16 DR 8->17 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Teodor Šikur](https://www.buzzerbeater.com/player/55439864/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 2->12 HA 8->16 DR 10->17 | defense season, not training OD (inferred: unknown) |
| [Julijan Lep](https://www.buzzerbeater.com/player/55439867/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 IS 9->16 ID 10->16 SB 9->10 | defense season, not training ID (inferred: unknown) |
| [Rene Janežič](https://www.buzzerbeater.com/player/55439872/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 7->14 HA 16->19 DR 14->19 ID 3->4 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Gabrijel Kac](https://www.buzzerbeater.com/player/55439876/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->15 OD 8->14 HA 5->18 DR 10->18 SB 1->3 | defense season, not training OD (inferred: unknown) |
| [Lovro Bric](https://www.buzzerbeater.com/player/55439881/overview.aspx) | 20 | mkt72-inside-1 | AT-RISK | IS 4->9 ID 14->16 | defense season, not training ID (inferred: unknown) |
| [Sandi Svete](https://www.buzzerbeater.com/player/55439882/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 JR 3->4 OD 3->12 HA 9->16 DR 9->17 IS 2->6 ID 5->6 | defense season, not training OD (inferred: unknown) |
| [Urban Lorenjak](https://www.buzzerbeater.com/player/55439885/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 12->13 OD 9->12 HA 5->16 DR 11->17 | defense season, not training OD (inferred: unknown) |
| [Slavko Šimnovič](https://www.buzzerbeater.com/player/55439886/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 12->18 OD 6->14 HA 15->19 DR 14->19 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Dare Urbanja](https://www.buzzerbeater.com/player/55439889/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 JR 4->5 OD 7->14 HA 9->18 DR 9->18 ID 3->4 RB 1->2 | defense season, not training OD (inferred: unknown) |
| [Almir Tomšič](https://www.buzzerbeater.com/player/55439899/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 8->12 HA 6->16 DR 8->17 RB 3->4 | defense season, not training OD (inferred: unknown) |
| [Brin Karabol](https://www.buzzerbeater.com/player/55439900/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 9->14 HA 7->18 DR 9->18 | defense season, not training OD (inferred: unknown) |
| [Goran Giacomelli](https://www.buzzerbeater.com/player/55439904/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 5->12 HA 10->16 DR 5->17 | defense season, not training OD (inferred: unknown) |
| [Zvonimir Antončič](https://www.buzzerbeater.com/player/55439907/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 4->14 HA 8->18 DR 9->18 PA 6->8 IS 1->3 RB 1->2 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Rastislav Luk](https://www.buzzerbeater.com/player/55439908/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 7->14 HA 11->18 DR 7->18 | defense season, not training OD (inferred: 5) |
| [Damjan Brezovar](https://www.buzzerbeater.com/player/55439928/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 10->14 HA 15->19 DR 15->19 PA 4->5 | defense season, not training OD (inferred: unknown) |
| [Oto Družič](https://www.buzzerbeater.com/player/55439932/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 JR 2->4 OD 8->12 HA 8->16 DR 7->17 ID 1->6 | defense season, not training OD (inferred: unknown) |
| [Aljoša Mikek](https://www.buzzerbeater.com/player/55439940/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 11->12 HA 12->16 DR 8->17 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Igor Ranić](https://www.buzzerbeater.com/player/55439949/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 3->12 HA 11->16 DR 11->17 RB 1->4 | defense season, not training OD (inferred: unknown) |
| [Mitja Hrovat](https://www.buzzerbeater.com/player/55439950/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 6->12 HA 7->16 DR 6->17 RB 3->4 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Aleksander Španič](https://www.buzzerbeater.com/player/55439951/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 6->12 HA 6->16 DR 5->17 RB 2->4 | defense season, not training OD (inferred: unknown) |
| [Lan Visenjak](https://www.buzzerbeater.com/player/55439954/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 OD 2->4 IS 7->16 ID 8->16 SB 2->10 | defense season, not training ID (inferred: unknown) |
| [Matija Kotar](https://www.buzzerbeater.com/player/55439956/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->13 OD 2->12 HA 13->16 DR 13->17 | defense season, not training OD (inferred: unknown) |
| [Dare Veselić](https://www.buzzerbeater.com/player/55439957/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 6->12 HA 14->16 DR 12->17 | defense season, not training OD (inferred: unknown) |
| [Lenart Uranc](https://www.buzzerbeater.com/player/55439964/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 8->14 HA 14->19 DR 17->19 PA 4->5 | defense season, not training OD (inferred: unknown) |
| [Jordan Keder](https://www.buzzerbeater.com/player/55439965/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 8->14 HA 4->18 DR 6->18 IS 2->3 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Arne Nago](https://www.buzzerbeater.com/player/55439975/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 5->12 HA 6->16 DR 2->17 | defense season, not training OD (inferred: unknown) |
| [Janez Šegina](https://www.buzzerbeater.com/player/55439982/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 JR 3->4 OD 6->12 HA 6->16 DR 7->17 | defense season, not training OD (inferred: unknown) |
| [Vlado Neumeister](https://www.buzzerbeater.com/player/55439986/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 10->12 HA 11->16 DR 11->17 ID 4->6 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Lovrenc Petrač](https://www.buzzerbeater.com/player/55439987/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 IS 6->16 ID 10->16 RB 6->10 | defense season, not training ID (inferred: unknown) |
| [Erazem Ludoviko](https://www.buzzerbeater.com/player/55439991/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 6->14 HA 3->18 DR 4->18 IS 2->3 RB 1->2 | defense season, not training OD (inferred: unknown) |
| [Dore Balažic](https://www.buzzerbeater.com/player/55439996/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 6->14 HA 8->18 DR 8->18 IS 2->3 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Braco Sinkovič](https://www.buzzerbeater.com/player/55440002/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 JR 1->2 DR 2->3 IS 8->16 ID 8->16 RB 6->10 SB 9->10 | defense season, not training ID (inferred: unknown) |
| [Emil Varga](https://www.buzzerbeater.com/player/55440005/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 6->14 HA 3->18 DR 6->18 PA 2->8 | defense season, not training OD (inferred: unknown) |
| [Kevin Babenko](https://www.buzzerbeater.com/player/55440007/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 4->12 HA 10->16 DR 7->17 IS 5->6 RB 1->4 SB 1->4 | defense season, not training OD (inferred: unknown) |
| [Cene Trobec](https://www.buzzerbeater.com/player/55440009/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 12->15 OD 11->14 HA 12->18 DR 10->18 PA 6->8 | defense season, not training OD (inferred: unknown) |
| [Žiga Majerhofer](https://www.buzzerbeater.com/player/55440011/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 9->16 ID 7->16 RB 8->10 SB 8->10 | defense season, not training ID (inferred: unknown) |
| [Sašo Terkaj](https://www.buzzerbeater.com/player/55440016/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 JR 2->4 OD 7->12 HA 12->16 DR 10->17 | defense season, not training OD (inferred: unknown) |
| [Janez Ferčič](https://www.buzzerbeater.com/player/55440017/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 1->13 OD 7->12 HA 5->16 DR 8->17 PA 3->4 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Eron Vutek](https://www.buzzerbeater.com/player/55440031/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | OD 1->4 IS 9->16 ID 6->16 RB 8->10 SB 6->10 | defense season, not training ID (inferred: unknown) |
| [Anže De Bello](https://www.buzzerbeater.com/player/55440032/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 9->12 HA 9->16 DR 10->17 | defense season, not training OD (inferred: unknown) |
| [Denis Burgar](https://www.buzzerbeater.com/player/55440033/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 IS 9->16 ID 9->16 RB 9->10 SB 9->10 | defense season, not training ID (inferred: unknown) |
| [Trpimir Regrat](https://www.buzzerbeater.com/player/55440045/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 JR 2->4 OD 7->12 HA 9->16 DR 5->17 | defense season, not training OD (inferred: unknown) |
| [Nejc Toš](https://www.buzzerbeater.com/player/55440060/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 15->18 OD 5->14 HA 15->19 DR 15->19 | defense season, not training OD (inferred: unknown) |
| [Lucijan Jazbec](https://www.buzzerbeater.com/player/55440068/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 6->14 HA 6->18 DR 5->18 PA 6->8 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [David Bizovičar](https://www.buzzerbeater.com/player/55440071/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 7->12 HA 9->16 DR 7->17 IS 4->6 RB 3->4 | defense season, not training OD (inferred: unknown) |
| [Murat Brecko](https://www.buzzerbeater.com/player/55440076/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 JR 3->4 OD 7->12 HA 6->16 DR 3->17 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Grdimir Segarić](https://www.buzzerbeater.com/player/55440090/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 6->14 HA 9->18 DR 9->18 | defense season, not training OD (inferred: unknown) |
| [Damir Purgstaler](https://www.buzzerbeater.com/player/55440095/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 4->15 OD 8->14 HA 5->18 DR 5->18 PA 6->8 ID 1->4 | defense season, not training OD (inferred: unknown) |
| [Jakob Ozimek](https://www.buzzerbeater.com/player/55440098/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->13 OD 8->12 HA 12->16 DR 16->17 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Egon Bergant](https://www.buzzerbeater.com/player/55440113/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 7->12 HA 10->16 DR 12->17 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Amadej Udovc](https://www.buzzerbeater.com/player/55440120/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 7->12 HA 9->16 DR 3->17 PA 2->4 | defense season, not training OD (inferred: unknown) |
| [Rajko Krasnik](https://www.buzzerbeater.com/player/55440122/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 JR 3->4 OD 4->12 HA 12->16 DR 9->17 PA 3->4 IS 4->6 | defense season, not training OD (inferred: 5) |
| [Šimen Mitraković](https://www.buzzerbeater.com/player/55440124/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 6->12 HA 6->16 DR 6->17 IS 4->6 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Vanja Burčul](https://www.buzzerbeater.com/player/55440128/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 1->13 OD 6->12 HA 8->16 DR 3->17 PA 1->4 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Daniel Nered](https://www.buzzerbeater.com/player/55440135/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 10->12 HA 4->16 DR 7->17 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Rastko Volferl](https://www.buzzerbeater.com/player/55440144/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 7->12 HA 8->16 DR 5->17 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Žane Pucl](https://www.buzzerbeater.com/player/55440147/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 6->14 HA 7->18 DR 8->18 PA 4->8 | defense season, not training OD (inferred: unknown) |
| [Bojan Kačič](https://www.buzzerbeater.com/player/55440152/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->13 OD 8->12 HA 10->16 DR 14->17 | defense season, not training OD (inferred: unknown) |
| [Valentin Burg](https://www.buzzerbeater.com/player/55440159/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 8->12 HA 10->16 DR 10->17 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Mirsad Ivanič](https://www.buzzerbeater.com/player/55440160/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 9->14 HA 2->18 DR 5->18 PA 7->8 RB 1->2 | defense season, not training OD (inferred: unknown) |
| [Zoran Purger](https://www.buzzerbeater.com/player/55440179/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 3->12 HA 4->16 DR 7->17 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [France Pongrač](https://www.buzzerbeater.com/player/55440193/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 5->12 HA 6->16 DR 6->17 IS 4->6 | defense season, not training OD (inferred: unknown) |
| [Eron Bahovec](https://www.buzzerbeater.com/player/55440204/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 13->18 OD 9->14 HA 14->19 DR 17->19 | defense season, not training OD (inferred: unknown) |
| [Goran Baznik](https://www.buzzerbeater.com/player/55440208/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 6->12 HA 7->16 DR 7->17 PA 3->4 IS 5->6 ID 2->6 | defense season, not training OD (inferred: unknown) |
| [Jonas Čergolj](https://www.buzzerbeater.com/player/55440212/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 13->15 OD 8->14 HA 10->18 DR 13->18 PA 7->8 IS 2->3 | defense season, not training OD (inferred: unknown) |
| [Nejc Škrlec](https://www.buzzerbeater.com/player/55440223/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 IS 11->16 ID 9->16 RB 9->10 SB 7->10 | defense season, not training ID (inferred: unknown) |
| [Albert Šegula](https://www.buzzerbeater.com/player/55440229/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 2->13 OD 8->12 HA 6->16 DR 5->17 PA 3->4 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Silvo Zelen](https://www.buzzerbeater.com/player/55440235/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 7->12 HA 6->16 DR 4->17 IS 5->6 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Žan Delak](https://www.buzzerbeater.com/player/55440241/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 4->12 HA 3->16 DR 7->17 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Boštjan Janžević](https://www.buzzerbeater.com/player/55440242/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 5->12 HA 7->16 DR 3->17 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Jaka Vuzem](https://www.buzzerbeater.com/player/55440244/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 12->16 ID 11->16 RB 9->10 SB 3->10 | defense season, not training ID (inferred: unknown) |
| [Stojan Kobe](https://www.buzzerbeater.com/player/55440248/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 9->14 HA 3->18 DR 6->18 PA 6->8 | defense season, not training OD (inferred: unknown) |
| [Jakob Brajkovič](https://www.buzzerbeater.com/player/55440252/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->13 OD 4->12 HA 11->16 DR 7->17 IS 2->6 | defense season, not training OD (inferred: unknown) |
| [Milimir Kos](https://www.buzzerbeater.com/player/55440253/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 8->14 HA 8->18 DR 10->18 PA 5->8 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Edin Šimonc](https://www.buzzerbeater.com/player/55440258/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->15 OD 9->14 HA 7->18 DR 11->18 PA 7->8 | defense season, not training OD (inferred: unknown) |
| [Igor Lovrinović](https://www.buzzerbeater.com/player/55440264/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 JR 3->4 OD 10->12 HA 8->16 DR 9->17 | defense season, not training OD (inferred: unknown) |
| [Josip Žvab](https://www.buzzerbeater.com/player/55440269/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 9->14 HA 11->18 DR 10->18 | defense season, not training OD (inferred: unknown) |
| [Dragomir Hebar](https://www.buzzerbeater.com/player/55440288/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 8->14 HA 2->18 DR 10->18 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Maj Dobrinja](https://www.buzzerbeater.com/player/55440290/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 7->12 HA 11->16 DR 8->17 | defense season, not training OD (inferred: unknown) |
| [Almir Volarič](https://www.buzzerbeater.com/player/55440292/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 13->15 OD 3->14 HA 8->18 DR 10->18 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Nik Jurjavčič](https://www.buzzerbeater.com/player/55440293/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | OD 3->4 IS 8->16 ID 10->16 SB 9->10 | defense season, not training ID (inferred: unknown) |
| [Marko Paradiž](https://www.buzzerbeater.com/player/55440301/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->15 OD 5->14 HA 5->18 DR 6->18 PA 6->8 IS 2->3 | defense season, not training OD (inferred: unknown) |
| [Aleksander Gojkošek](https://www.buzzerbeater.com/player/55440313/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 10->14 HA 7->18 DR 6->18 PA 6->8 | defense season, not training OD (inferred: unknown) |
| [Miro Dragšič](https://www.buzzerbeater.com/player/55440324/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 8->12 HA 9->16 DR 3->17 IS 2->6 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Rusmin Kamnar](https://www.buzzerbeater.com/player/55440328/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 9->14 HA 6->18 DR 10->18 PA 6->8 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Boltežar Braznik](https://www.buzzerbeater.com/player/55440330/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 2->12 HA 10->16 DR 14->17 PA 3->4 | defense season, not training OD (inferred: unknown) |
| [Oto Pupaher](https://www.buzzerbeater.com/player/55440338/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 11->16 ID 11->16 SB 8->10 | defense season, not training ID (inferred: unknown) |
| [Darijo Pugelj](https://www.buzzerbeater.com/player/55440343/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 2->12 HA 4->16 DR 9->17 | defense season, not training OD (inferred: unknown) |
| [Nejc Smerdelj](https://www.buzzerbeater.com/player/55440349/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 10->14 HA 10->18 DR 9->18 SB 1->3 | defense season, not training OD (inferred: unknown) |
| [Pero Kordežca](https://www.buzzerbeater.com/player/55440357/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 10->12 HA 12->16 DR 12->17 | defense season, not training OD (inferred: 17) |
| [Borut Trost](https://www.buzzerbeater.com/player/55440368/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 8->14 HA 5->18 DR 6->18 PA 5->8 IS 1->3 ID 1->4 | defense season, not training OD (inferred: unknown) |
| [Drejc Pivk](https://www.buzzerbeater.com/player/55440369/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 10->14 HA 9->18 DR 6->18 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Gregor Vinković](https://www.buzzerbeater.com/player/55440375/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 7->12 HA 6->16 DR 5->17 | defense season, not training OD (inferred: unknown) |
| [Vitomil Guček](https://www.buzzerbeater.com/player/55440392/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 5->12 HA 10->16 DR 8->17 IS 3->6 RB 2->4 | defense season, not training OD (inferred: unknown) |
| [Jordan Ferderber](https://www.buzzerbeater.com/player/55440395/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 9->12 HA 9->16 DR 11->17 | defense season, not training OD (inferred: unknown) |
| [Zdravko Špeh](https://www.buzzerbeater.com/player/55461802/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 1->13 OD 5->12 HA 7->16 DR 5->17 PA 3->4 | defense season, not training OD (inferred: unknown) |
| [Miško Levičar](https://www.buzzerbeater.com/player/55461958/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 OD 2->4 IS 7->16 ID 8->16 SB 8->10 | defense season, not training ID (inferred: unknown) |
| [Luka Kosmač](https://www.buzzerbeater.com/player/55462234/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 3->6 HA 1->3 IS 8->16 ID 4->16 RB 7->10 | defense season, not training ID (inferred: unknown) |
| [Tonček Svete](https://www.buzzerbeater.com/player/55462238/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 9->14 HA 8->18 DR 4->18 | defense season, not training OD (inferred: 5) |
| [David Prek](https://www.buzzerbeater.com/player/55462255/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 11->16 ID 13->16 SB 7->10 | defense season, not training ID (inferred: unknown) |
| [Vlado Horvat](https://www.buzzerbeater.com/player/55462415/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 9->14 HA 10->18 DR 8->18 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Tibor Klajderič](https://www.buzzerbeater.com/player/55462692/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 5->12 HA 10->16 DR 9->17 | defense season, not training OD (inferred: unknown) |
| [Zlatko Repovš](https://www.buzzerbeater.com/player/55463235/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 5->12 HA 9->16 DR 5->17 PA 3->4 | defense season, not training OD (inferred: unknown) |
| [Jožef Mavec](https://www.buzzerbeater.com/player/55463993/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 8->14 HA 9->18 DR 4->18 PA 5->8 IS 1->3 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Braco Bučar](https://www.buzzerbeater.com/player/55464997/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 DR 1->3 IS 9->16 ID 9->16 RB 6->10 | defense season, not training ID (inferred: 5) |
| [Denis Boncelj](https://www.buzzerbeater.com/player/55465098/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 3->12 HA 10->16 DR 10->17 PA 2->4 | defense season, not training OD (inferred: 5) |
| [Vid Babič](https://www.buzzerbeater.com/player/55465895/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 6->14 HA 7->18 DR 5->18 PA 7->8 | defense season, not training OD (inferred: unknown) |
| [Stojan Broz](https://www.buzzerbeater.com/player/55466675/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 6->14 HA 10->18 DR 5->18 PA 7->8 ID 1->4 | defense season, not training OD (inferred: unknown) |
| [Aljaž Drenšek](https://www.buzzerbeater.com/player/55466761/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 5->12 HA 10->16 DR 9->17 PA 3->4 | defense season, not training OD (inferred: unknown) |
| [Lev Kociper](https://www.buzzerbeater.com/player/55466788/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 6->12 HA 8->16 DR 9->17 ID 2->6 | defense season, not training OD (inferred: unknown) |
| [Črtomir Kašnar](https://www.buzzerbeater.com/player/55474896/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 12->18 OD 5->14 HA 16->19 DR 17->19 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Šimen Kezele](https://www.buzzerbeater.com/player/55477769/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 JR 1->2 OD 1->4 HA 2->3 PA 1->2 IS 7->16 ID 4->16 RB 4->10 SB 7->10 | defense season, not training ID (inferred: unknown) |
| [Lovro Repina](https://www.buzzerbeater.com/player/55477770/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 4->14 HA 4->18 DR 6->18 PA 7->8 ID 1->4 SB 2->3 | defense season, not training OD (inferred: unknown) |
| [Primož Mal](https://www.buzzerbeater.com/player/55477781/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->13 JR 2->4 OD 5->12 HA 6->16 DR 5->17 PA 3->4 ID 2->6 | defense season, not training OD (inferred: unknown) |
| [Andi Hebar](https://www.buzzerbeater.com/player/55741957/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 7->12 HA 7->16 DR 6->17 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Blaž Vinarnik](https://www.buzzerbeater.com/player/56009275/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 2->12 HA 3->16 DR 4->17 RB 1->4 | defense season, not training OD (inferred: unknown) |
| [Pero Špes](https://www.buzzerbeater.com/player/56023188/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->15 JR 4->5 OD 5->14 HA 6->18 DR 6->18 PA 7->8 IS 2->3 | defense season, not training OD (inferred: unknown) |
| [Daniel Šinkovec](https://www.buzzerbeater.com/player/56031974/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 5->12 HA 4->16 DR 6->17 PA 3->4 IS 2->6 | defense season, not training OD (inferred: unknown) |
| [Arjan Plut](https://www.buzzerbeater.com/player/54827381/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 3->12 HA 7->16 DR 6->17 IS 4->6 RB 3->4 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Dušan Tomažic](https://www.buzzerbeater.com/player/54827395/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 JR 2->4 OD 5->12 HA 4->16 DR 6->17 IS 3->6 RB 2->4 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Taj Vavpotič](https://www.buzzerbeater.com/player/54827427/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 6->12 HA 13->16 DR 13->17 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Admir Aljančič](https://www.buzzerbeater.com/player/54827447/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 8->12 HA 7->16 DR 6->17 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Jaša Dolenjc](https://www.buzzerbeater.com/player/54827482/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 11->13 JR 3->4 OD 8->12 HA 15->16 PA 3->4 ID 4->6 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Šime Šajn](https://www.buzzerbeater.com/player/54827483/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 6->12 HA 4->16 DR 8->17 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Tibor Jager](https://www.buzzerbeater.com/player/54827485/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 5->12 HA 9->16 DR 8->17 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Trpimir Kamin](https://www.buzzerbeater.com/player/54827487/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 JR 1->4 OD 5->12 HA 6->16 DR 5->17 ID 4->6 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Nastja Šimnić](https://www.buzzerbeater.com/player/54827518/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | ID 15->16 SB 9->10 | cannot close ID gap 1 in 0 weeks (≤0.0) |
| [Orhan Podbevšek](https://www.buzzerbeater.com/player/54827520/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 14->18 OD 7->14 HA 18->19 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Andraž Bratko](https://www.buzzerbeater.com/player/54827530/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 11->15 OD 7->14 HA 8->18 DR 8->18 PA 7->8 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Maksimilijan Balažic](https://www.buzzerbeater.com/player/54827545/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->13 JR 3->4 OD 3->12 HA 4->16 DR 5->17 RB 3->4 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Ivan Nikolić](https://www.buzzerbeater.com/player/54827558/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 16->18 HA 16->19 DR 16->19 | cannot close OD gap 1 in 0 weeks (≤0.0) |
| [Vid Sinkovic](https://www.buzzerbeater.com/player/54827581/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->18 OD 13->14 HA 18->19 DR 18->19 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Cveto Volčanšek](https://www.buzzerbeater.com/player/54827582/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | HA 2->3 IS 14->16 ID 15->16 | cannot close ID gap 1 in 0 weeks (≤0.0) |
| [Bojan Resman](https://www.buzzerbeater.com/player/54827633/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 13->14 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Rastislav Tajnik](https://www.buzzerbeater.com/player/54827679/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 7->14 HA 12->19 DR 14->19 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Filip Smonkar](https://www.buzzerbeater.com/player/54827700/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->18 HA 15->19 DR 18->19 | cannot close OD gap 1 in 0 weeks (≤0.0) |
| [Dare Ule](https://www.buzzerbeater.com/player/54827706/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 8->12 HA 10->16 DR 9->17 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Valen Ribnikar](https://www.buzzerbeater.com/player/54827730/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 6->14 HA 4->18 DR 6->18 PA 7->8 IS 1->3 ID 3->4 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Dušan Mocić](https://www.buzzerbeater.com/player/54827753/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 6->12 HA 1->16 DR 3->17 ID 5->6 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Teo Slavec](https://www.buzzerbeater.com/player/54827761/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->18 JR 5->6 OD 8->14 HA 16->19 DR 17->19 PA 3->5 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Miha Poljšak](https://www.buzzerbeater.com/player/54827784/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 7->14 HA 3->18 DR 4->18 PA 4->8 RB 1->2 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Valuk Osterman](https://www.buzzerbeater.com/player/54827812/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 9->18 OD 13->14 HA 15->19 DR 16->19 SB 2->3 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Branko Ulrich](https://www.buzzerbeater.com/player/54827826/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 JR 1->4 OD 4->12 HA 11->16 DR 10->17 PA 2->4 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Ermin Ploj](https://www.buzzerbeater.com/player/54827854/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | OD 6->12 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Dušan Pirih](https://www.buzzerbeater.com/player/54827922/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 6->14 HA 6->18 DR 3->18 PA 7->8 ID 3->4 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Rastko Zaletel](https://www.buzzerbeater.com/player/54827948/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 HA 9->16 DR 12->17 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Aleksander Godec](https://www.buzzerbeater.com/player/54827949/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 12->14 HA 11->18 DR 12->18 PA 7->8 | cannot close OD gap 3 in 0 weeks (≤0.0) |
| [Vanja Vršić](https://www.buzzerbeater.com/player/54827991/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 11->13 OD 3->12 HA 12->16 DR 11->17 ID 5->6 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Nel Krnec](https://www.buzzerbeater.com/player/54828043/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->15 OD 10->14 HA 5->18 DR 7->18 PA 6->8 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Ermin Ahac](https://www.buzzerbeater.com/player/54850112/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 3->12 HA 8->16 DR 5->17 ID 5->6 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Edo Balagić](https://www.buzzerbeater.com/player/54850572/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 8->12 HA 12->16 DR 10->17 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Valentin Florijan](https://www.buzzerbeater.com/player/54851490/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 7->12 HA 6->16 DR 5->17 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Peter Smrdej](https://www.buzzerbeater.com/player/54898631/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 8->18 JR 4->6 OD 9->14 HA 13->19 DR 13->19 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [David Horvat](https://www.buzzerbeater.com/player/55135429/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | OD 9->12 HA 10->16 DR 10->17 PA 3->4 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Vlado Črne](https://www.buzzerbeater.com/player/55135433/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->15 JR 3->5 OD 9->14 HA 5->18 DR 6->18 IS 1->3 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Pepe Bratovš](https://www.buzzerbeater.com/player/55135434/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 HA 7->16 DR 4->17 PA 3->4 RB 3->4 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Lenart Kajzer](https://www.buzzerbeater.com/player/55135437/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 2->12 HA 6->16 DR 6->17 IS 5->6 SB 2->4 | cannot close OD gap 12 in 0 weeks (≤0.0) |
| [Tomo Oblak](https://www.buzzerbeater.com/player/55135441/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 8->12 HA 12->16 DR 10->17 ID 4->6 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Sandi Škrlec](https://www.buzzerbeater.com/player/55135442/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 8->16 ID 9->16 RB 9->10 SB 8->10 | cannot close ID gap 7 in 0 weeks (≤0.0) |
| [Miha Brezavšček](https://www.buzzerbeater.com/player/55135446/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 4->12 HA 10->16 DR 10->17 PA 3->4 SB 2->4 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Miha Pakiž](https://www.buzzerbeater.com/player/55135449/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 9->14 HA 8->18 DR 6->18 SB 1->3 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Sergej Konečnik](https://www.buzzerbeater.com/player/55135454/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 6->12 HA 10->16 DR 6->17 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Tejo Cigoj](https://www.buzzerbeater.com/player/55135456/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 6->14 HA 9->18 DR 6->18 ID 3->4 SB 1->3 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Andrej Starman](https://www.buzzerbeater.com/player/55135457/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 5->12 HA 9->16 DR 5->17 IS 4->6 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Arne Pečolar](https://www.buzzerbeater.com/player/55135462/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 8->14 HA 9->18 DR 11->18 PA 7->8 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Štefan Ilić](https://www.buzzerbeater.com/player/55135465/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JR 1->2 OD 1->4 IS 13->16 ID 13->16 | cannot close ID gap 3 in 0 weeks (≤0.0) |
| [Tavž Dobovšek](https://www.buzzerbeater.com/player/55135466/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | HA 13->16 DR 15->17 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Aleš Ukmar](https://www.buzzerbeater.com/player/55135472/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 7->14 HA 15->19 DR 14->19 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Valuk De Bello](https://www.buzzerbeater.com/player/55135476/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->18 JR 4->6 OD 8->14 HA 16->19 DR 17->19 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Lenart Kos](https://www.buzzerbeater.com/player/55135481/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 17->18 HA 17->19 DR 18->19 IS 2->3 | cannot close OD gap 1 in 0 weeks (≤0.0) |
| [Teo Glavina](https://www.buzzerbeater.com/player/55135486/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->15 OD 11->14 HA 12->18 DR 10->18 | cannot close OD gap 4 in 0 weeks (≤0.0) |
| [David Navotnik](https://www.buzzerbeater.com/player/55135487/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 7->12 HA 3->16 DR 4->17 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Dare Bahovec](https://www.buzzerbeater.com/player/55135488/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 12->13 OD 7->12 HA 9->16 DR 13->17 ID 3->6 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Marko Peterec](https://www.buzzerbeater.com/player/55135491/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 9->12 HA 6->16 DR 13->17 IS 4->6 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Stanko Brezovnik](https://www.buzzerbeater.com/player/55135501/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->13 HA 12->16 DR 12->17 | cannot close OD gap 1 in 0 weeks (≤0.0) |
| [Erazem Strojan](https://www.buzzerbeater.com/player/55135506/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 12->18 OD 8->14 HA 17->19 DR 18->19 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Amel Stupan](https://www.buzzerbeater.com/player/55135514/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 12->18 OD 8->14 HA 16->19 DR 17->19 PA 3->5 ID 3->4 RB 1->2 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Ernest Habijan](https://www.buzzerbeater.com/player/55135515/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 17->18 OD 13->14 HA 13->19 DR 15->19 SB 1->3 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Pavel Berdajs](https://www.buzzerbeater.com/player/55135521/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 9->14 HA 15->19 DR 14->19 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Bogdan Perc](https://www.buzzerbeater.com/player/55135523/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 5->6 HA 2->3 IS 9->16 ID 5->16 SB 7->10 | cannot close ID gap 11 in 0 weeks (≤0.0) |
| [Bojan Mikša](https://www.buzzerbeater.com/player/55135527/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | OD 5->12 HA 8->16 DR 6->17 ID 1->6 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Aljoša Leskovar](https://www.buzzerbeater.com/player/55135535/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 3->15 OD 8->14 HA 9->18 DR 7->18 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Nastja Petrak](https://www.buzzerbeater.com/player/55135542/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 9->12 HA 6->16 DR 7->17 RB 3->4 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Krištof Simonc](https://www.buzzerbeater.com/player/55135547/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 HA 13->16 DR 14->17 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Nik Bojovič](https://www.buzzerbeater.com/player/55135551/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->15 OD 10->14 HA 8->18 DR 8->18 ID 2->4 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Žarko Lovriha](https://www.buzzerbeater.com/player/55135556/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->15 OD 11->14 HA 13->18 DR 11->18 | cannot close OD gap 4 in 0 weeks (≤0.0) |
| [Josip Repe](https://www.buzzerbeater.com/player/55135588/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 11->13 OD 10->12 HA 7->16 DR 10->17 | cannot close OD gap 4 in 0 weeks (≤0.0) |
| [Tejo Purg](https://www.buzzerbeater.com/player/55135603/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 3->15 OD 10->14 HA 5->18 DR 3->18 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Mark Pavlović](https://www.buzzerbeater.com/player/55135604/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 10->14 HA 9->18 DR 8->18 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Lan Tominc](https://www.buzzerbeater.com/player/55135605/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 12->14 HA 15->19 DR 15->19 | cannot close OD gap 3 in 0 weeks (≤0.0) |
| [Božo Miklavčič](https://www.buzzerbeater.com/player/55135607/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 13->14 HA 7->18 DR 7->18 PA 6->8 ID 3->4 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Zmago Volčini](https://www.buzzerbeater.com/player/55135617/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 5->15 OD 7->14 HA 10->18 DR 9->18 IS 1->3 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Nenad Dajčman](https://www.buzzerbeater.com/player/55135620/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 1->6 IS 9->16 ID 8->16 RB 9->10 SB 8->10 | cannot close ID gap 8 in 0 weeks (≤0.0) |
| [Emil Vrhovnik](https://www.buzzerbeater.com/player/55135627/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->18 OD 10->14 HA 18->19 PA 4->5 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Boško Bingl](https://www.buzzerbeater.com/player/55135629/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 13->16 ID 11->16 | cannot close ID gap 5 in 0 weeks (≤0.0) |
| [Ferdinand Habjan](https://www.buzzerbeater.com/player/55135637/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 8->12 HA 8->16 DR 10->17 SB 3->4 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Jure Podgornik](https://www.buzzerbeater.com/player/55135640/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 8->18 OD 9->14 HA 8->19 DR 11->19 RB 1->2 SB 1->3 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Žare Miš](https://www.buzzerbeater.com/player/55135644/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 7->12 HA 10->16 DR 11->17 ID 5->6 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Lojze Kordiš](https://www.buzzerbeater.com/player/55135668/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 3->12 HA 4->16 DR 8->17 RB 3->4 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Edo Vitrih](https://www.buzzerbeater.com/player/55135669/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 6->12 HA 12->16 DR 14->17 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Vasja Pungartnik](https://www.buzzerbeater.com/player/55135676/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 8->14 HA 11->18 DR 10->18 PA 7->8 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Matej Žmaher](https://www.buzzerbeater.com/player/55135677/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 9->12 HA 10->16 DR 12->17 PA 3->4 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Grega Fabčič](https://www.buzzerbeater.com/player/55135693/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 10->12 HA 10->16 DR 9->17 | cannot close OD gap 4 in 0 weeks (≤0.0) |
| [Mido Silovšek](https://www.buzzerbeater.com/player/55135710/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 10->14 HA 9->18 DR 10->18 PA 4->8 ID 1->4 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Sergej Celestin](https://www.buzzerbeater.com/player/55135713/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | DR 2->3 IS 13->16 ID 11->16 RB 8->10 SB 6->10 | cannot close ID gap 5 in 0 weeks (≤0.0) |
| [Nenad Vehovar](https://www.buzzerbeater.com/player/55135715/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 8->14 HA 7->18 DR 9->18 PA 5->8 IS 2->3 ID 1->4 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Stipe Butrin](https://www.buzzerbeater.com/player/55135721/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 12->18 OD 10->14 HA 15->19 DR 17->19 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Luka Anzelj](https://www.buzzerbeater.com/player/55135744/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 5->14 HA 9->18 DR 10->18 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Jaka Kunc](https://www.buzzerbeater.com/player/55135754/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->13 OD 2->12 HA 8->16 DR 7->17 RB 3->4 | cannot close OD gap 12 in 0 weeks (≤0.0) |
| [Timotej Merl](https://www.buzzerbeater.com/player/55135756/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 9->14 HA 7->18 DR 9->18 PA 7->8 ID 1->4 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Emil Skerijanc](https://www.buzzerbeater.com/player/55135764/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 8->12 HA 4->16 DR 8->17 SB 2->4 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Simon Simič](https://www.buzzerbeater.com/player/55135765/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->15 JR 4->5 OD 9->14 HA 4->18 DR 6->18 SB 2->3 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Dare Klevže](https://www.buzzerbeater.com/player/55135788/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 10->12 HA 8->16 DR 5->17 IS 5->6 | cannot close OD gap 4 in 0 weeks (≤0.0) |
| [Sergej Grizold](https://www.buzzerbeater.com/player/55135805/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 12->13 OD 8->12 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Dalibor Hrnčič](https://www.buzzerbeater.com/player/55135806/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 3->12 HA 10->16 DR 8->17 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Tomi Bukovec](https://www.buzzerbeater.com/player/55135817/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 9->14 HA 14->19 DR 14->19 PA 3->5 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Oliver Volavšek](https://www.buzzerbeater.com/player/55135819/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 9->14 HA 10->18 DR 6->18 ID 2->4 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Jure Anžic](https://www.buzzerbeater.com/player/55135821/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JR 2->4 OD 11->12 HA 13->16 DR 13->17 | cannot close OD gap 3 in 0 weeks (≤0.0) |
| [Šime Mohorič](https://www.buzzerbeater.com/player/55135825/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 11->15 OD 7->14 HA 10->18 DR 6->18 PA 1->8 ID 1->4 SB 1->3 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Damir Milošević](https://www.buzzerbeater.com/player/55135837/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 9->14 HA 9->18 DR 9->18 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Vasja Pintarič](https://www.buzzerbeater.com/player/55135841/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 7->12 HA 9->16 DR 3->17 ID 3->6 SB 3->4 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Luka Nadarević](https://www.buzzerbeater.com/player/55135843/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 10->14 HA 1->18 DR 8->18 ID 3->4 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Emanuel Gerzina](https://www.buzzerbeater.com/player/55135848/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 2->13 OD 3->12 HA 10->16 DR 6->17 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Ožbolt Zabukovec](https://www.buzzerbeater.com/player/55135858/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JR 1->2 OD 2->4 IS 9->16 ID 9->16 SB 2->10 | cannot close ID gap 7 in 0 weeks (≤0.0) |
| [Črtomir Celestino](https://www.buzzerbeater.com/player/55135859/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->15 OD 9->14 HA 9->18 DR 10->18 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Aleksej Kravos](https://www.buzzerbeater.com/player/55135860/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 4->14 HA 7->18 DR 10->18 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Gabrijel Brezavšek](https://www.buzzerbeater.com/player/55135877/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 3->12 HA 5->16 DR 3->17 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Nejc Petkovšek](https://www.buzzerbeater.com/player/55135882/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 6->12 HA 10->16 DR 7->17 RB 3->4 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Grga Članković](https://www.buzzerbeater.com/player/55135886/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 9->16 ID 10->16 SB 2->10 | cannot close ID gap 6 in 0 weeks (≤0.0) |
| [Taj Miklavžina](https://www.buzzerbeater.com/player/55135893/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 9->12 HA 4->16 DR 8->17 PA 3->4 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Mirko Marolt](https://www.buzzerbeater.com/player/55135894/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 9->15 OD 7->14 HA 11->18 DR 11->18 PA 5->8 ID 2->4 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Tonček Mastinšek](https://www.buzzerbeater.com/player/55135906/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 6->12 HA 10->16 DR 4->17 PA 3->4 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Tonček Perković](https://www.buzzerbeater.com/player/55135907/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 5->6 OD 3->4 DR 2->3 IS 7->16 ID 7->16 RB 6->10 SB 5->10 | cannot close ID gap 9 in 0 weeks (≤0.0) |
| [Franc Batina](https://www.buzzerbeater.com/player/55135912/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->15 OD 9->14 HA 7->18 DR 8->18 PA 6->8 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Ivor Kamnar](https://www.buzzerbeater.com/player/55135923/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 8->12 HA 8->16 DR 4->17 ID 5->6 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Nastja Jerin](https://www.buzzerbeater.com/player/55135927/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->13 OD 8->12 HA 3->16 DR 3->17 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Stane Braznik](https://www.buzzerbeater.com/player/55135928/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 2->12 HA 7->16 DR 7->17 | cannot close OD gap 12 in 0 weeks (≤0.0) |
| [Domen Žitnik](https://www.buzzerbeater.com/player/55135929/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->13 JR 2->4 OD 8->12 HA 7->16 DR 8->17 PA 3->4 ID 3->6 SB 3->4 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Simon Žinić](https://www.buzzerbeater.com/player/55135931/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 7->14 HA 7->18 DR 9->18 ID 2->4 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Ahmed Mozetič](https://www.buzzerbeater.com/player/55135935/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 4->15 OD 9->14 HA 9->18 DR 8->18 PA 4->8 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Ive Pečnik](https://www.buzzerbeater.com/player/55135936/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 9->12 HA 7->16 DR 10->17 IS 4->6 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Aljoša Kožamelj](https://www.buzzerbeater.com/player/55135941/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 7->12 HA 10->16 DR 2->17 PA 3->4 RB 3->4 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Arne Peter](https://www.buzzerbeater.com/player/55135946/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 1->13 JR 2->4 OD 7->12 HA 4->16 DR 5->17 PA 2->4 IS 5->6 ID 3->6 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Damjan Verhovec](https://www.buzzerbeater.com/player/55135950/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->13 OD 5->12 HA 4->16 DR 3->17 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Jaro Nikolaj](https://www.buzzerbeater.com/player/55135959/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 4->14 HA 14->19 DR 15->19 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Tine Herič](https://www.buzzerbeater.com/player/55135967/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 14->18 JR 2->6 OD 7->14 HA 18->19 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Urh Simonovič](https://www.buzzerbeater.com/player/55135988/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 4->12 HA 11->16 DR 11->17 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Tadej Volavec](https://www.buzzerbeater.com/player/55135991/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->13 OD 11->12 HA 12->16 DR 14->17 | cannot close OD gap 3 in 0 weeks (≤0.0) |
| [Borut Jesih](https://www.buzzerbeater.com/player/55135994/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->13 HA 12->16 DR 10->17 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Darko Pirjevec](https://www.buzzerbeater.com/player/55135999/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | OD 7->12 HA 9->16 DR 8->17 ID 5->6 SB 3->4 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Rožle Vidmar](https://www.buzzerbeater.com/player/55136001/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 9->12 HA 9->16 DR 8->17 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Emanuel Osterverh](https://www.buzzerbeater.com/player/55136014/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->18 OD 8->14 HA 12->19 DR 14->19 ID 3->4 SB 1->3 | cannot close OD gap 7 in 0 weeks (≤0.0) |
| [Siniša Pezderc](https://www.buzzerbeater.com/player/55136016/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | OD 2->4 IS 13->16 ID 10->16 | cannot close ID gap 6 in 0 weeks (≤0.0) |
| [France Galič](https://www.buzzerbeater.com/player/55137747/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 11->16 ID 9->16 RB 9->10 SB 7->10 | cannot close ID gap 7 in 0 weeks (≤0.0) |
| [Tejo Serne](https://www.buzzerbeater.com/player/55137753/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->18 OD 13->14 HA 17->19 DR 17->19 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Dušan Golob](https://www.buzzerbeater.com/player/55137756/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 6->12 HA 10->16 DR 5->17 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Ivo Žirovnik](https://www.buzzerbeater.com/player/55157872/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 3->12 HA 8->16 DR 9->17 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Zdenko Lovec](https://www.buzzerbeater.com/player/55159037/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | OD 3->4 IS 12->16 ID 15->16 RB 9->10 | cannot close ID gap 1 in 0 weeks (≤0.0) |
| [Vid Glišić](https://www.buzzerbeater.com/player/55159210/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 2->12 HA 8->16 DR 9->17 | cannot close OD gap 12 in 0 weeks (≤0.0) |
| [Vinko Vogrič](https://www.buzzerbeater.com/player/55159397/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 12->14 HA 11->18 DR 11->18 PA 6->8 SB 1->3 | cannot close OD gap 3 in 0 weeks (≤0.0) |
| [Lovro Gale](https://www.buzzerbeater.com/player/55159508/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 14->18 OD 9->14 HA 13->19 DR 18->19 | cannot close OD gap 6 in 0 weeks (≤0.0) |
| [Tibor Levičar](https://www.buzzerbeater.com/player/55159713/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->15 OD 10->14 HA 10->18 DR 12->18 | cannot close OD gap 5 in 0 weeks (≤0.0) |
| [Matija Podlesnikar](https://www.buzzerbeater.com/player/55160286/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 5->12 HA 9->16 DR 8->17 PA 3->4 ID 3->6 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Klemen Plut](https://www.buzzerbeater.com/player/55160442/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 16->18 OD 5->14 HA 16->19 DR 18->19 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Hotimir Šporn](https://www.buzzerbeater.com/player/55160522/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 2->13 OD 3->12 HA 10->16 DR 10->17 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Aleš Pintar](https://www.buzzerbeater.com/player/55161248/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 12->18 OD 11->14 HA 12->19 DR 11->19 | cannot close OD gap 4 in 0 weeks (≤0.0) |
| [Otokar Ujčić](https://www.buzzerbeater.com/player/55161353/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 14->15 OD 13->14 HA 14->18 DR 14->18 | cannot close OD gap 2 in 0 weeks (≤0.0) |
| [Jaša Pulko](https://www.buzzerbeater.com/player/55167761/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->18 OD 11->14 HA 15->19 DR 16->19 | cannot close OD gap 4 in 0 weeks (≤0.0) |
| [Admir Muc](https://www.buzzerbeater.com/player/55173735/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 5->12 HA 6->16 DR 4->17 | cannot close OD gap 9 in 0 weeks (≤0.0) |
| [Damjan Dukić](https://www.buzzerbeater.com/player/55184529/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 OD 4->12 HA 8->16 DR 8->17 IS 3->6 SB 2->4 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Tibor Mandelc](https://www.buzzerbeater.com/player/55477784/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 3->12 HA 7->16 DR 4->17 PA 3->4 ID 5->6 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Sašo Godec](https://www.buzzerbeater.com/player/55493075/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 1->13 JR 1->4 OD 1->12 HA 5->16 DR 5->17 IS 4->6 ID 1->6 | cannot close OD gap 13 in 0 weeks (≤0.0) |
| [Bogo Lovinšek](https://www.buzzerbeater.com/player/55493079/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->13 JR 1->4 OD 3->12 HA 1->16 DR 6->17 PA 2->4 IS 4->6 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Jelko Gašparič](https://www.buzzerbeater.com/player/55742965/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->13 OD 1->12 HA 4->16 DR 2->17 IS 4->6 ID 2->6 | cannot close OD gap 13 in 0 weeks (≤0.0) |
| [Cveto Zakotnik](https://www.buzzerbeater.com/player/55742972/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->15 JR 3->5 OD 4->14 HA 5->18 DR 5->18 PA 4->8 IS 2->3 ID 1->4 SB 1->3 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Darjan Marušič](https://www.buzzerbeater.com/player/55757018/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->15 OD 4->14 HA 2->18 DR 4->18 PA 5->8 IS 1->3 SB 2->3 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Jan Bratušek](https://www.buzzerbeater.com/player/56023178/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 4->12 HA 4->16 DR 7->17 PA 1->4 IS 1->6 SB 3->4 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Aljoša Ropret](https://www.buzzerbeater.com/player/56023190/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->13 OD 4->12 HA 2->16 DR 6->17 PA 1->4 IS 2->6 ID 4->6 SB 3->4 | cannot close OD gap 10 in 0 weeks (≤0.0) |
| [Smiljan Knez](https://www.buzzerbeater.com/player/56025535/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 2->13 OD 3->12 HA 4->16 DR 7->17 IS 4->6 ID 2->6 SB 3->4 | cannot close OD gap 11 in 0 weeks (≤0.0) |
| [Jeremi Perne](https://www.buzzerbeater.com/player/56025537/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->13 JR 3->4 OD 1->12 HA 4->16 DR 4->17 PA 1->4 IS 3->6 ID 5->6 | cannot close OD gap 13 in 0 weeks (≤0.0) |
| [Kevin Purgar](https://www.buzzerbeater.com/player/56025547/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | OD 3->4 HA 1->3 IS 2->16 ID 7->16 RB 6->10 SB 7->10 | cannot close ID gap 9 in 0 weeks (≤0.0) |
| [Tonček Pakiž](https://www.buzzerbeater.com/player/56026637/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 1->6 OD 1->4 IS 7->16 ID 7->16 RB 5->10 SB 7->10 | cannot close ID gap 9 in 0 weeks (≤0.0) |
| [Jaro Culič](https://www.buzzerbeater.com/player/56031608/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->13 OD 6->12 HA 7->16 DR 2->17 PA 3->4 | cannot close OD gap 8 in 0 weeks (≤0.0) |
| [Gojc Povše](https://www.buzzerbeater.com/player/55688839/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 2->3 DR 1->2 IS 5->6 ID 4->11 SB 5->7 | ID behind the big-man early-defense track |
| [Joža Štor](https://www.buzzerbeater.com/player/55688840/overview.aspx) | 18 | mkt72-wing-1 | WATCH | HA 3->7 | feeders behind (HA+DR 10 vs track 22) |
| [Žiga Dvorančič](https://www.buzzerbeater.com/player/55688841/overview.aspx) | 18 | mkt72-outside-2 | WATCH | OD 6->9 | feeders behind (HA+DR 24 vs track 26) |
| [Artur Štrucl](https://www.buzzerbeater.com/player/55688847/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->7 JR 2->3 OD 5->7 HA 2->7 DR 2->7 ID 2->4 RB 2->3 | feeders behind (HA+DR 4 vs track 22) |
| [Jošt Jenštrle](https://www.buzzerbeater.com/player/55688849/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 | feeders behind (HA+DR 22 vs track 27) |
| [Ciril Ropoša](https://www.buzzerbeater.com/player/55688859/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 | feeders behind (HA+DR 18 vs track 22) |
| [Janez Gotar](https://www.buzzerbeater.com/player/55688879/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 5->11 HA 4->9 DR 5->8 ID 1->3 | feeders behind (HA+DR 9 vs track 27) |
| [Anel Jenštrle](https://www.buzzerbeater.com/player/55688889/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->7 HA 2->7 DR 6->7 SB 2->3 | feeders behind (HA+DR 8 vs track 22) |
| [Marjan Dvorančič](https://www.buzzerbeater.com/player/55688890/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 ID 6->11 SB 3->7 | ID behind the big-man early-defense track |
| [Žan Novičić](https://www.buzzerbeater.com/player/55688897/overview.aspx) | 18 | mkt72-wing-1 | WATCH | PA 1->3 | feeders behind (HA+DR 20 vs track 22) |
| [Maksimilijan Kosmatin](https://www.buzzerbeater.com/player/55688911/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 2->5 OD 7->11 HA 3->9 DR 7->8 | feeders behind (HA+DR 10 vs track 27) |
| [Anže Wolfgruber](https://www.buzzerbeater.com/player/55688912/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 | feeders behind (HA+DR 21 vs track 27) |
| [Črtomir Petek](https://www.buzzerbeater.com/player/55688917/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 DR 5->8 | feeders behind (HA+DR 12 vs track 27) |
| [Teo Celestino](https://www.buzzerbeater.com/player/55688941/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JR 3->4 OD 7->11 HA 7->9 DR 3->8 PA 3->4 | feeders behind (HA+DR 10 vs track 27) |
| [Žak Lenardič](https://www.buzzerbeater.com/player/55688942/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 DR 2->8 IS 1->2 | feeders behind (HA+DR 9 vs track 27) |
| [Branko Bauer](https://www.buzzerbeater.com/player/55688947/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 | feeders behind (HA+DR 18 vs track 27) |
| [Cene Kacin](https://www.buzzerbeater.com/player/55688954/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 ID 3->4 | feeders behind (HA+DR 20 vs track 22) |
| [Miha Auer](https://www.buzzerbeater.com/player/55688964/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 4->7 DR 4->7 ID 2->4 | feeders behind (HA+DR 8 vs track 22) |
| [Peter Blaj](https://www.buzzerbeater.com/player/55688972/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 4->7 PA 2->3 | feeders behind (HA+DR 11 vs track 22) |
| [Nedžad Avbelj](https://www.buzzerbeater.com/player/55688974/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 3->8 PA 3->4 ID 1->3 | feeders behind (HA+DR 9 vs track 27) |
| [Velimir Šimen](https://www.buzzerbeater.com/player/55688989/overview.aspx) | 18 | mkt72-outside-2 | WATCH | OD 6->9 ID 2->3 | feeders behind (HA+DR 24 vs track 26) |
| [Jaro Bajc](https://www.buzzerbeater.com/player/55688996/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 DR 2->8 ID 2->3 | feeders behind (HA+DR 9 vs track 27) |
| [Tadej Šurev](https://www.buzzerbeater.com/player/55689005/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 4->7 DR 4->7 ID 3->4 RB 1->3 | feeders behind (HA+DR 12 vs track 22) |
| [Luka Anzeljc](https://www.buzzerbeater.com/player/55689016/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->7 DR 6->7 | feeders behind (HA+DR 15 vs track 22) |
| [Peter Fabčič](https://www.buzzerbeater.com/player/55689030/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 5->7 DR 4->7 RB 2->3 | feeders behind (HA+DR 11 vs track 22) |
| [Rok Dornig](https://www.buzzerbeater.com/player/55689031/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 5->7 | feeders behind (HA+DR 15 vs track 22) |
| [Uroš Kreslin](https://www.buzzerbeater.com/player/55689037/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 7->11 HA 5->9 DR 7->8 SB 1->2 | feeders behind (HA+DR 12 vs track 27) |
| [Velimir Cimirotić](https://www.buzzerbeater.com/player/55689042/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 5->11 HA 4->9 DR 6->8 SB 1->2 | feeders behind (HA+DR 10 vs track 27) |
| [Vanja Ahačevčič](https://www.buzzerbeater.com/player/55689044/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 | feeders behind (HA+DR 18 vs track 22) |
| [Valerij Rojec](https://www.buzzerbeater.com/player/55689045/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->5 OD 7->11 HA 6->9 DR 2->8 SB 1->2 | feeders behind (HA+DR 8 vs track 27) |
| [Žane Jemec](https://www.buzzerbeater.com/player/55689047/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->7 HA 6->7 DR 4->7 PA 2->3 | feeders behind (HA+DR 10 vs track 22) |
| [Vid Potkonjak](https://www.buzzerbeater.com/player/55689076/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 3->7 DR 4->7 RB 1->3 SB 1->3 | feeders behind (HA+DR 11 vs track 22) |
| [Dario Maher](https://www.buzzerbeater.com/player/55689089/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 SB 1->2 | feeders behind (HA+DR 15 vs track 27) |
| [Rožle Grilec](https://www.buzzerbeater.com/player/55689102/overview.aspx) | 18 | mkt72-outside-2 | WATCH | OD 6->9 | feeders behind (HA+DR 23 vs track 26) |
| [Boško Korde](https://www.buzzerbeater.com/player/55689115/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 8->9 | feeders behind (HA+DR 16 vs track 27) |
| [Semir Flaker](https://www.buzzerbeater.com/player/55689116/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 8->11 | feeders behind (HA+DR 17 vs track 27) |
| [Oliver Mantelj](https://www.buzzerbeater.com/player/55689117/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 | feeders behind (HA+DR 17 vs track 27) |
| [Cvetko Dobrinja](https://www.buzzerbeater.com/player/55689121/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 4->11 HA 7->9 DR 5->8 PA 2->4 | feeders behind (HA+DR 12 vs track 27) |
| [Uroš Smrdel](https://www.buzzerbeater.com/player/55689124/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->7 | feeders behind (HA+DR 16 vs track 22) |
| [Cene Vozelj](https://www.buzzerbeater.com/player/55689146/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 5->7 HA 1->7 DR 5->7 RB 1->3 | feeders behind (HA+DR 6 vs track 22) |
| [Erik Berk](https://www.buzzerbeater.com/player/55689159/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 | feeders behind (HA+DR 20 vs track 22) |
| [Tibor Kozina](https://www.buzzerbeater.com/player/55689174/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 7->11 HA 7->9 DR 5->8 | feeders behind (HA+DR 12 vs track 27) |
| [Hotimir Tomažič](https://www.buzzerbeater.com/player/55689190/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 4->9 DR 4->8 PA 3->4 SB 1->2 | feeders behind (HA+DR 8 vs track 27) |
| [Boštjan Pukšič](https://www.buzzerbeater.com/player/55689194/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 5->9 DR 3->8 | feeders behind (HA+DR 8 vs track 27) |
| [Dušan Peterman](https://www.buzzerbeater.com/player/55689200/overview.aspx) | 18 | mkt72-inside-2 | WATCH | DR 1->2 ID 7->11 RB 4->6 SB 4->7 | ID behind the big-man early-defense track |
| [Nikita Majarič](https://www.buzzerbeater.com/player/55689204/overview.aspx) | 18 | mkt72-inside-2 | WATCH | HA 1->2 DR 1->2 IS 5->6 ID 5->11 RB 3->6 SB 6->7 | ID behind the big-man early-defense track |
| [Anže Fekonja](https://www.buzzerbeater.com/player/55689209/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 5->7 HA 1->7 DR 5->7 | feeders behind (HA+DR 6 vs track 22) |
| [Gaj Jelovčan](https://www.buzzerbeater.com/player/55689218/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->7 | feeders behind (HA+DR 21 vs track 22) |
| [Matjaž Lovro](https://www.buzzerbeater.com/player/55689231/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 JR 1->3 OD 5->7 HA 1->7 PA 1->3 ID 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Jaro Grabić](https://www.buzzerbeater.com/player/55689237/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 3->7 HA 4->7 SB 1->3 | feeders behind (HA+DR 12 vs track 22) |
| [Pepe Tome](https://www.buzzerbeater.com/player/55689240/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 8->11 HA 5->9 | feeders behind (HA+DR 13 vs track 27) |
| [Jakob Velečič](https://www.buzzerbeater.com/player/55689245/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 5->7 HA 2->7 DR 2->7 | feeders behind (HA+DR 4 vs track 22) |
| [Tugo Krašovc](https://www.buzzerbeater.com/player/55689247/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->5 OD 7->11 HA 7->9 DR 6->8 IS 1->2 | feeders behind (HA+DR 13 vs track 27) |
| [Pavel Purger](https://www.buzzerbeater.com/player/55689258/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 IS 3->6 ID 4->11 | ID behind the big-man early-defense track |
| [Andraž Kosec](https://www.buzzerbeater.com/player/55689261/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 JR 1->3 OD 4->7 HA 3->7 DR 2->7 | feeders behind (HA+DR 5 vs track 22) |
| [Nastja Repe](https://www.buzzerbeater.com/player/55689268/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 9->11 HA 8->9 PA 3->4 ID 2->3 | feeders behind (HA+DR 16 vs track 27) |
| [Aleš Kupčič](https://www.buzzerbeater.com/player/55689271/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 6->8 PA 3->4 ID 2->3 | feeders behind (HA+DR 12 vs track 27) |
| [Anel Volk](https://www.buzzerbeater.com/player/55689277/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->7 JR 2->3 OD 6->7 HA 3->7 DR 6->7 | feeders behind (HA+DR 9 vs track 22) |
| [Mišo Lauš](https://www.buzzerbeater.com/player/55689282/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 4->9 DR 7->8 | feeders behind (HA+DR 11 vs track 27) |
| [Ermin Hrženjak](https://www.buzzerbeater.com/player/55689290/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 | feeders behind (HA+DR 15 vs track 22) |
| [Boško Srne](https://www.buzzerbeater.com/player/55689291/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 6->11 HA 7->9 DR 7->8 | feeders behind (HA+DR 14 vs track 27) |
| [Zdravko Smrdelj](https://www.buzzerbeater.com/player/55689300/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 5->9 DR 3->8 PA 3->4 | feeders behind (HA+DR 8 vs track 27) |
| [Boško Grims](https://www.buzzerbeater.com/player/55689308/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 7->11 SB 5->7 | ID behind the big-man early-defense track |
| [Lenart Hanc](https://www.buzzerbeater.com/player/55689309/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 JR 2->3 OD 4->7 HA 6->7 | feeders behind (HA+DR 14 vs track 22) |
| [Žiga Celestin](https://www.buzzerbeater.com/player/55689310/overview.aspx) | 18 | mkt72-inside-2 | WATCH | IS 3->6 ID 7->11 SB 6->7 | ID behind the big-man early-defense track |
| [Šime Bebler](https://www.buzzerbeater.com/player/55689320/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 JR 2->3 OD 6->7 HA 5->7 | feeders behind (HA+DR 12 vs track 22) |
| [Dušan Ovšenek](https://www.buzzerbeater.com/player/55689336/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 6->7 DR 5->7 ID 3->4 SB 2->3 | feeders behind (HA+DR 12 vs track 22) |
| [Rajko Vdovc](https://www.buzzerbeater.com/player/55689337/overview.aspx) | 18 | mkt72-wing-1 | WATCH | – | feeders behind (HA+DR 18 vs track 22) |
| [Jadranko Tomašek](https://www.buzzerbeater.com/player/55689338/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 4->7 HA 3->7 DR 6->7 RB 1->3 | feeders behind (HA+DR 9 vs track 22) |
| [Žan Ostojić](https://www.buzzerbeater.com/player/55689341/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->7 SB 2->3 | feeders behind (HA+DR 19 vs track 22) |
| [Vid Ogorelc](https://www.buzzerbeater.com/player/55689378/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 HA 5->7 DR 5->7 ID 2->4 | feeders behind (HA+DR 10 vs track 22) |
| [Džoni Javor](https://www.buzzerbeater.com/player/55689403/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 DR 3->7 | feeders behind (HA+DR 10 vs track 22) |
| [Nikola Majerle](https://www.buzzerbeater.com/player/55689404/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 | feeders behind (HA+DR 22 vs track 27) |
| [Pepe Pršina](https://www.buzzerbeater.com/player/55689408/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 3->9 DR 7->8 | feeders behind (HA+DR 10 vs track 27) |
| [Aljaž Teraž](https://www.buzzerbeater.com/player/55689414/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 4->8 | feeders behind (HA+DR 10 vs track 27) |
| [Drago Gotar](https://www.buzzerbeater.com/player/55689422/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 3->7 HA 4->7 DR 6->7 | feeders behind (HA+DR 10 vs track 22) |
| [Vid Lipič](https://www.buzzerbeater.com/player/55689434/overview.aspx) | 18 | mkt72-inside-2 | WATCH | IS 5->6 ID 6->11 | ID behind the big-man early-defense track |
| [Semir Jeram](https://www.buzzerbeater.com/player/55689449/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->7 ID 2->4 | feeders behind (HA+DR 17 vs track 22) |
| [Darko Krklec](https://www.buzzerbeater.com/player/55689463/overview.aspx) | 18 | mkt72-wing-1 | WATCH | HA 3->7 | feeders behind (HA+DR 10 vs track 22) |
| [Lenart Čepič](https://www.buzzerbeater.com/player/55689466/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 5->7 HA 3->7 | feeders behind (HA+DR 10 vs track 22) |
| [Nikola Majarič](https://www.buzzerbeater.com/player/55689468/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 4->7 HA 5->7 DR 5->7 ID 2->4 SB 1->3 | feeders behind (HA+DR 10 vs track 22) |
| [Žak Meško](https://www.buzzerbeater.com/player/55689472/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->7 HA 3->7 DR 4->7 ID 3->4 | feeders behind (HA+DR 7 vs track 22) |
| [Amir Štucin](https://www.buzzerbeater.com/player/55689474/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 3->7 HA 2->7 DR 5->7 | feeders behind (HA+DR 7 vs track 22) |
| [Boštjan Slapar](https://www.buzzerbeater.com/player/55689476/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 3->7 HA 3->7 DR 5->7 | feeders behind (HA+DR 8 vs track 22) |
| [Ažbe Germic](https://www.buzzerbeater.com/player/55689482/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 6->7 HA 2->7 DR 6->7 ID 3->4 | feeders behind (HA+DR 8 vs track 22) |
| [Leo Gačič](https://www.buzzerbeater.com/player/55689492/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 4->9 DR 5->8 | feeders behind (HA+DR 9 vs track 27) |
| [Bane Pavšič](https://www.buzzerbeater.com/player/55689493/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 4->11 HA 7->9 DR 3->8 | feeders behind (HA+DR 10 vs track 27) |
| [Adrijan Supančič](https://www.buzzerbeater.com/player/55689503/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 4->7 HA 3->7 DR 4->7 | feeders behind (HA+DR 7 vs track 22) |
| [Sandi Macun](https://www.buzzerbeater.com/player/55689558/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 5->9 DR 7->8 | feeders behind (HA+DR 12 vs track 27) |
| [Ožbej Predalić](https://www.buzzerbeater.com/player/55710561/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 DR 5->8 | feeders behind (HA+DR 12 vs track 27) |
| [Stribor Jaunik](https://www.buzzerbeater.com/player/55710628/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 4->11 SB 6->7 | ID behind the big-man early-defense track |
| [Gabrijel Sagmajster](https://www.buzzerbeater.com/player/55710711/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 HA 5->7 DR 1->7 ID 3->4 | feeders behind (HA+DR 6 vs track 22) |
| [Gaber Kordiš](https://www.buzzerbeater.com/player/55711713/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 9->11 HA 8->9 | feeders behind (HA+DR 17 vs track 27) |
| [Žak Plišić](https://www.buzzerbeater.com/player/55712420/overview.aspx) | 18 | mkt72-wing-1 | WATCH | – | feeders behind (HA+DR 20 vs track 22) |
| [Saša Vižintin](https://www.buzzerbeater.com/player/55712894/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 JR 2->3 OD 3->7 HA 6->7 DR 1->7 PA 1->3 ID 3->4 | feeders behind (HA+DR 7 vs track 22) |
| [Adam Perc](https://www.buzzerbeater.com/player/55713033/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 5->7 | feeders behind (HA+DR 15 vs track 22) |
| [Bernard Lovrek](https://www.buzzerbeater.com/player/55713935/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 3->7 HA 5->7 | feeders behind (HA+DR 13 vs track 22) |
| [Žane Kastelic](https://www.buzzerbeater.com/player/55714167/overview.aspx) | 18 | mkt72-wing-1 | WATCH | – | feeders behind (HA+DR 19 vs track 22) |
| [Zlatimir Mežič](https://www.buzzerbeater.com/player/55714653/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 7->8 PA 2->4 IS 1->2 | feeders behind (HA+DR 13 vs track 27) |
| [Oton Pevec](https://www.buzzerbeater.com/player/55714661/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 6->8 PA 3->4 IS 1->2 | feeders behind (HA+DR 12 vs track 27) |
| [Anej Lampič](https://www.buzzerbeater.com/player/55715299/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 7->9 DR 6->8 | feeders behind (HA+DR 13 vs track 27) |
| [Ahmed Grims](https://www.buzzerbeater.com/player/55717345/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 6->11 | ID behind the big-man early-defense track |
| [Zlatko Perš](https://www.buzzerbeater.com/player/55757021/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 4->7 RB 1->3 | feeders behind (HA+DR 14 vs track 22) |
| [Jani Korenc](https://www.buzzerbeater.com/player/55757026/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 DR 4->8 IS 1->2 ID 2->3 | feeders behind (HA+DR 11 vs track 27) |
| [Viljem Dajčman](https://www.buzzerbeater.com/player/55967309/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 5->7 DR 6->7 SB 1->3 | feeders behind (HA+DR 13 vs track 22) |
| [Stipe Zupanc](https://www.buzzerbeater.com/player/55967312/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 4->8 | feeders behind (HA+DR 10 vs track 27) |
| [Davor Lenasi](https://www.buzzerbeater.com/player/55967313/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 5->7 HA 6->7 DR 4->7 | feeders behind (HA+DR 10 vs track 22) |
| [Janez Zadobovšek](https://www.buzzerbeater.com/player/55967318/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 JR 2->3 DR 6->7 ID 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Elvis Pavić](https://www.buzzerbeater.com/player/55967322/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->7 DR 3->7 PA 1->3 | feeders behind (HA+DR 10 vs track 22) |
| [Miško Srne](https://www.buzzerbeater.com/player/55967323/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 6->7 HA 6->7 | feeders behind (HA+DR 13 vs track 22) |
| [Bojan Lesnik](https://www.buzzerbeater.com/player/55967327/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 3->11 SB 6->7 | ID behind the big-man early-defense track |
| [Jaka Hodalič](https://www.buzzerbeater.com/player/55967329/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->7 HA 5->7 | feeders behind (HA+DR 12 vs track 22) |
| [Vilko Štraus](https://www.buzzerbeater.com/player/55967334/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 DR 6->7 | feeders behind (HA+DR 13 vs track 22) |
| [Davor Potočki](https://www.buzzerbeater.com/player/55967344/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->7 HA 2->7 DR 3->7 ID 3->4 | feeders behind (HA+DR 5 vs track 22) |
| [Tezej Ružić](https://www.buzzerbeater.com/player/55967345/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 2->3 IS 3->6 ID 7->11 SB 6->7 | ID behind the big-man early-defense track |
| [Timotej Dvoršak](https://www.buzzerbeater.com/player/55967356/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 JR 2->3 OD 3->7 HA 1->7 DR 3->7 ID 2->4 | feeders behind (HA+DR 4 vs track 22) |
| [Zmago Zablatnik](https://www.buzzerbeater.com/player/55967361/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 HA 4->7 | feeders behind (HA+DR 11 vs track 22) |
| [Jovica Benčič](https://www.buzzerbeater.com/player/55967365/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 6->7 DR 5->7 | feeders behind (HA+DR 12 vs track 22) |
| [Hinko Tosič](https://www.buzzerbeater.com/player/55967369/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->7 HA 3->7 DR 3->7 | feeders behind (HA+DR 6 vs track 22) |
| [Žan Lovšin](https://www.buzzerbeater.com/player/55967371/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 6->7 DR 5->7 | feeders behind (HA+DR 12 vs track 22) |
| [Zlatimir Hander](https://www.buzzerbeater.com/player/55967372/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 2->7 HA 5->7 PA 2->3 RB 2->3 | feeders behind (HA+DR 12 vs track 22) |
| [Kristjan Vakaričič](https://www.buzzerbeater.com/player/55967375/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 3->7 HA 4->7 DR 3->7 ID 3->4 | feeders behind (HA+DR 7 vs track 22) |
| [Valen Jenštrle](https://www.buzzerbeater.com/player/55967383/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->7 HA 4->7 DR 4->7 | feeders behind (HA+DR 8 vs track 22) |
| [Artur Milosavljević](https://www.buzzerbeater.com/player/55967385/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 4->7 HA 4->7 DR 1->7 | feeders behind (HA+DR 5 vs track 22) |
| [Gal Rijavec](https://www.buzzerbeater.com/player/55967387/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->7 JR 2->3 OD 5->7 HA 6->7 DR 6->7 RB 2->3 | feeders behind (HA+DR 12 vs track 22) |
| [Miško Mucelj](https://www.buzzerbeater.com/player/55967389/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 3->7 HA 5->7 DR 6->7 IS 1->3 SB 1->3 | feeders behind (HA+DR 11 vs track 22) |
| [Tonček Čufer](https://www.buzzerbeater.com/player/55967390/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 7->11 RB 3->6 | ID behind the big-man early-defense track |
| [Matevž Bajlec](https://www.buzzerbeater.com/player/55967393/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 HA 2->7 DR 5->7 RB 2->3 | feeders behind (HA+DR 7 vs track 22) |
| [Gal Ploj](https://www.buzzerbeater.com/player/55967395/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 6->7 HA 1->7 DR 6->7 | feeders behind (HA+DR 7 vs track 22) |
| [Robert Korenčič](https://www.buzzerbeater.com/player/55967407/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 2->7 HA 5->7 DR 1->7 | feeders behind (HA+DR 6 vs track 22) |
| [Dušan Lisjak](https://www.buzzerbeater.com/player/55967411/overview.aspx) | 18 | mkt72-wing-1 | WATCH | HA 6->7 | feeders behind (HA+DR 13 vs track 22) |
| [Stojan Baša](https://www.buzzerbeater.com/player/55967419/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 JR 1->3 OD 6->7 DR 6->7 | feeders behind (HA+DR 13 vs track 22) |
| [Pino Minšek](https://www.buzzerbeater.com/player/55967427/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 JR 2->3 OD 4->7 HA 6->7 DR 4->7 | feeders behind (HA+DR 10 vs track 22) |
| [Zdravko Anzeljc](https://www.buzzerbeater.com/player/55967432/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 4->7 HA 4->7 DR 6->7 ID 3->4 | feeders behind (HA+DR 10 vs track 22) |
| [Maks Bratovčak](https://www.buzzerbeater.com/player/55967436/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 HA 3->7 DR 5->7 | feeders behind (HA+DR 8 vs track 22) |
| [Dino Potočnik](https://www.buzzerbeater.com/player/55967438/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 5->11 HA 7->9 DR 6->8 PA 3->4 IS 1->2 | feeders behind (HA+DR 13 vs track 27) |
| [Pero Mal](https://www.buzzerbeater.com/player/55967446/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 6->11 HA 5->9 DR 7->8 | feeders behind (HA+DR 12 vs track 27) |
| [Izidor Marić](https://www.buzzerbeater.com/player/55967452/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 4->7 HA 2->7 | feeders behind (HA+DR 9 vs track 22) |
| [Joško Debevc](https://www.buzzerbeater.com/player/55967459/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 7->8 | feeders behind (HA+DR 13 vs track 27) |
| [Šime Kozlar](https://www.buzzerbeater.com/player/55967461/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 5->7 HA 6->7 DR 3->7 ID 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Primož Dobrina](https://www.buzzerbeater.com/player/55967464/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 2->7 HA 5->7 DR 4->7 | feeders behind (HA+DR 9 vs track 22) |
| [Drejc Dukić](https://www.buzzerbeater.com/player/55967465/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 5->7 DR 6->7 IS 2->3 | feeders behind (HA+DR 11 vs track 22) |
| [Jan Milošić](https://www.buzzerbeater.com/player/55967467/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 7->9 DR 4->8 ID 2->3 | feeders behind (HA+DR 11 vs track 27) |
| [Matija Gorišek](https://www.buzzerbeater.com/player/55967506/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->7 OD 2->7 HA 4->7 DR 4->7 ID 3->4 | feeders behind (HA+DR 8 vs track 22) |
| [Tonček Osojnik](https://www.buzzerbeater.com/player/55967512/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 4->7 DR 3->7 PA 2->3 SB 2->3 | feeders behind (HA+DR 7 vs track 22) |
| [Taj Osenar](https://www.buzzerbeater.com/player/55967516/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 DR 5->7 ID 2->4 SB 2->3 | feeders behind (HA+DR 12 vs track 22) |
| [Klemen Štamcar](https://www.buzzerbeater.com/player/55967518/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 5->8 PA 3->4 SB 1->2 | feeders behind (HA+DR 11 vs track 27) |
| [Aljaž Kodermac](https://www.buzzerbeater.com/player/55967531/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 5->7 DR 5->7 IS 2->3 | feeders behind (HA+DR 12 vs track 22) |
| [Rado Srebrnič](https://www.buzzerbeater.com/player/55967535/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 JR 2->3 OD 3->7 HA 6->7 DR 3->7 | feeders behind (HA+DR 9 vs track 22) |
| [Gal Tersoglav](https://www.buzzerbeater.com/player/55967537/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->7 OD 3->7 HA 6->7 DR 6->7 PA 1->3 | feeders behind (HA+DR 12 vs track 22) |
| [Luka Kodre](https://www.buzzerbeater.com/player/55967541/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->5 OD 6->11 HA 7->9 DR 3->8 ID 2->3 | feeders behind (HA+DR 10 vs track 27) |
| [Mirko Jeram](https://www.buzzerbeater.com/player/55967550/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 6->8 SB 1->2 | feeders behind (HA+DR 12 vs track 27) |
| [Tomo Ališič](https://www.buzzerbeater.com/player/55967552/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 HA 1->2 IS 4->6 ID 6->11 SB 6->7 | ID behind the big-man early-defense track |
| [Rok Žagovec](https://www.buzzerbeater.com/player/55967554/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 4->7 DR 3->7 | feeders behind (HA+DR 10 vs track 22) |
| [Rudi Vida](https://www.buzzerbeater.com/player/55967558/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 JR 2->3 OD 6->7 DR 2->7 PA 2->3 | feeders behind (HA+DR 9 vs track 22) |
| [Štefan Magajna](https://www.buzzerbeater.com/player/55967560/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 7->11 HA 7->9 DR 7->8 IS 1->2 | feeders behind (HA+DR 14 vs track 27) |
| [Miško Slakonja](https://www.buzzerbeater.com/player/55967563/overview.aspx) | 18 | mkt72-wing-1 | WATCH | HA 3->7 ID 3->4 | feeders behind (HA+DR 10 vs track 22) |
| [Mike Novinec](https://www.buzzerbeater.com/player/55967568/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 3->11 HA 7->9 DR 7->8 IS 1->2 ID 2->3 | feeders behind (HA+DR 14 vs track 27) |
| [Boško Tomšič](https://www.buzzerbeater.com/player/55967569/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 5->11 HA 7->9 DR 7->8 SB 1->2 | feeders behind (HA+DR 14 vs track 27) |
| [Rusmin Kancijan](https://www.buzzerbeater.com/player/55967574/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 JR 2->3 OD 2->7 HA 5->7 DR 6->7 | feeders behind (HA+DR 11 vs track 22) |
| [Samir Miklavec](https://www.buzzerbeater.com/player/55967576/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 7->11 | ID behind the big-man early-defense track |
| [Jaša Baloh](https://www.buzzerbeater.com/player/55967596/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 HA 6->7 | feeders behind (HA+DR 13 vs track 22) |
| [Jožef Županič](https://www.buzzerbeater.com/player/55967601/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 JR 1->3 OD 3->7 DR 4->7 | feeders behind (HA+DR 11 vs track 22) |
| [Ciril Kozin](https://www.buzzerbeater.com/player/55967622/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 6->7 HA 3->7 DR 4->7 | feeders behind (HA+DR 7 vs track 22) |
| [Leon Škerlič](https://www.buzzerbeater.com/player/55967641/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 3->7 HA 4->7 DR 4->7 RB 2->3 | feeders behind (HA+DR 8 vs track 22) |
| [Matija Šparovec](https://www.buzzerbeater.com/player/55967648/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JR 3->4 OD 7->11 HA 6->9 DR 6->8 ID 1->3 | feeders behind (HA+DR 12 vs track 27) |
| [Miško Berič](https://www.buzzerbeater.com/player/55967659/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 5->9 DR 5->8 | feeders behind (HA+DR 10 vs track 27) |
| [Admir Gajser](https://www.buzzerbeater.com/player/55967664/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 5->7 HA 6->7 PA 2->3 IS 2->3 | feeders behind (HA+DR 13 vs track 22) |
| [Klemen Rakovič](https://www.buzzerbeater.com/player/55967665/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 5->7 HA 4->7 ID 2->4 | feeders behind (HA+DR 11 vs track 22) |
| [Benjamin Jug](https://www.buzzerbeater.com/player/55967667/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 7->9 DR 6->8 IS 1->2 ID 2->3 | feeders behind (HA+DR 13 vs track 27) |
| [Vladislav Delavec](https://www.buzzerbeater.com/player/55967679/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 2->7 HA 4->7 DR 4->7 | feeders behind (HA+DR 8 vs track 22) |
| [Vladimir Dovšek](https://www.buzzerbeater.com/player/55967686/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 4->9 DR 7->8 | feeders behind (HA+DR 11 vs track 27) |
| [Jože Piškur](https://www.buzzerbeater.com/player/55967689/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 5->7 | feeders behind (HA+DR 12 vs track 22) |
| [Drejc Malovrh](https://www.buzzerbeater.com/player/55967690/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 7->11 HA 4->9 DR 7->8 ID 1->3 | feeders behind (HA+DR 11 vs track 27) |
| [Daniel Klunec](https://www.buzzerbeater.com/player/55967693/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 HA 4->7 DR 4->7 | feeders behind (HA+DR 8 vs track 22) |
| [Irvin Vogrin](https://www.buzzerbeater.com/player/55967698/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 HA 4->7 DR 6->7 | feeders behind (HA+DR 10 vs track 22) |
| [Bane Goršak](https://www.buzzerbeater.com/player/55967701/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 DR 1->2 ID 5->11 SB 5->7 | ID behind the big-man early-defense track |
| [Marin Rudan](https://www.buzzerbeater.com/player/55967703/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 6->11 | ID behind the big-man early-defense track |
| [Domen Gogala](https://www.buzzerbeater.com/player/55967705/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 6->7 HA 6->7 | feeders behind (HA+DR 13 vs track 22) |
| [Emil Bratovš](https://www.buzzerbeater.com/player/55967713/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 4->11 HA 7->9 DR 5->8 | feeders behind (HA+DR 12 vs track 27) |
| [Željko Batič](https://www.buzzerbeater.com/player/55967724/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 HA 4->7 DR 5->7 ID 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Tadej Lovrenčak](https://www.buzzerbeater.com/player/55967727/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 HA 5->7 DR 5->7 | feeders behind (HA+DR 10 vs track 22) |
| [Erazem Zakrajšek](https://www.buzzerbeater.com/player/55967735/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 5->9 DR 7->8 IS 1->2 | feeders behind (HA+DR 12 vs track 27) |
| [Rudi Neuhauser](https://www.buzzerbeater.com/player/55967737/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 5->9 DR 4->8 PA 2->4 | feeders behind (HA+DR 9 vs track 27) |
| [Nejc Šulc](https://www.buzzerbeater.com/player/55967748/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 HA 1->2 DR 1->2 ID 6->11 SB 3->7 | ID behind the big-man early-defense track |
| [Taj Doler](https://www.buzzerbeater.com/player/55967754/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 5->11 HA 6->9 DR 7->8 | feeders behind (HA+DR 13 vs track 27) |
| [Mirt Erhatič](https://www.buzzerbeater.com/player/55967760/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 6->11 SB 6->7 | ID behind the big-man early-defense track |
| [Rastko Kadunc](https://www.buzzerbeater.com/player/55967762/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 IS 5->6 ID 6->11 RB 3->6 SB 4->7 | ID behind the big-man early-defense track |
| [Rik Rot](https://www.buzzerbeater.com/player/55967766/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 4->7 PA 1->3 SB 2->3 | feeders behind (HA+DR 14 vs track 22) |
| [Kristjan Juričinec](https://www.buzzerbeater.com/player/55967767/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 DR 2->7 | feeders behind (HA+DR 9 vs track 22) |
| [Erazem Šuštarič](https://www.buzzerbeater.com/player/55967789/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 5->9 DR 4->8 ID 2->3 SB 1->2 | feeders behind (HA+DR 9 vs track 27) |
| [Viktor Tušek](https://www.buzzerbeater.com/player/55967790/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 6->7 DR 3->7 | feeders behind (HA+DR 10 vs track 22) |
| [Robert Cigelšek](https://www.buzzerbeater.com/player/55967805/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JR 3->4 OD 7->11 HA 6->9 DR 6->8 | feeders behind (HA+DR 12 vs track 27) |
| [Eron Zalaznik](https://www.buzzerbeater.com/player/55967815/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 5->11 HA 5->9 DR 5->8 IS 1->2 | feeders behind (HA+DR 10 vs track 27) |
| [Štefan Ribnikar](https://www.buzzerbeater.com/player/55967827/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->7 OD 5->7 HA 1->7 DR 4->7 | feeders behind (HA+DR 5 vs track 22) |
| [Sandi Majerič](https://www.buzzerbeater.com/player/55967832/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 4->7 DR 4->7 PA 1->3 | feeders behind (HA+DR 11 vs track 22) |
| [Dore Cedilnik](https://www.buzzerbeater.com/player/55967837/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 HA 1->2 DR 1->2 ID 4->11 | ID behind the big-man early-defense track |
| [Dejan Eržar](https://www.buzzerbeater.com/player/55967842/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 5->11 HA 4->9 DR 6->8 IS 1->2 ID 2->3 | feeders behind (HA+DR 10 vs track 27) |
| [Hasim Špan](https://www.buzzerbeater.com/player/55967850/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 5->7 DR 2->7 | feeders behind (HA+DR 7 vs track 22) |
| [Robin Novaković](https://www.buzzerbeater.com/player/55967857/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 4->9 DR 7->8 | feeders behind (HA+DR 11 vs track 27) |
| [Anton Dolšak](https://www.buzzerbeater.com/player/55967861/overview.aspx) | 18 | mkt72-inside-2 | WATCH | HA 1->2 DR 1->2 ID 6->11 SB 6->7 | ID behind the big-man early-defense track |
| [Fabijan Remič](https://www.buzzerbeater.com/player/55967877/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 6->11 SB 5->7 | ID behind the big-man early-defense track |
| [Aleks Mandelc](https://www.buzzerbeater.com/player/55967889/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 ID 7->11 | ID behind the big-man early-defense track |
| [Jan Ilgo](https://www.buzzerbeater.com/player/55967897/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 5->11 HA 2->9 DR 3->8 | feeders behind (HA+DR 5 vs track 27) |
| [Mladen Dragonja](https://www.buzzerbeater.com/player/55967898/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 6->7 HA 5->7 DR 3->7 | feeders behind (HA+DR 8 vs track 22) |
| [Silvo Vodopivec](https://www.buzzerbeater.com/player/55967903/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 7->11 | ID behind the big-man early-defense track |
| [Dalibor Dobrajc](https://www.buzzerbeater.com/player/55967911/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 6->9 DR 4->8 ID 2->3 SB 1->2 | feeders behind (HA+DR 10 vs track 27) |
| [Davor Baša](https://www.buzzerbeater.com/player/55967922/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->5 OD 7->11 HA 6->9 DR 4->8 | feeders behind (HA+DR 10 vs track 27) |
| [Antonij Deželan](https://www.buzzerbeater.com/player/55967930/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 4->9 DR 3->8 | feeders behind (HA+DR 7 vs track 27) |
| [Milan Završki](https://www.buzzerbeater.com/player/55967932/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 7->8 IS 1->2 SB 1->2 | feeders behind (HA+DR 13 vs track 27) |
| [Klemen Grošelj](https://www.buzzerbeater.com/player/55967935/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 6->9 DR 3->8 ID 1->3 | feeders behind (HA+DR 9 vs track 27) |
| [Cveto Mrak](https://www.buzzerbeater.com/player/55967936/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 6->8 | feeders behind (HA+DR 12 vs track 27) |
| [Denis Remec](https://www.buzzerbeater.com/player/55967937/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 6->7 OD 4->7 ID 2->4 | feeders behind (HA+DR 14 vs track 22) |
| [Samir Repar](https://www.buzzerbeater.com/player/55967940/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 2->3 OD 6->7 HA 6->7 DR 5->7 ID 1->4 | feeders behind (HA+DR 11 vs track 22) |
| [Danijel Cotman](https://www.buzzerbeater.com/player/55967941/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 7->9 DR 3->8 | feeders behind (HA+DR 10 vs track 27) |
| [Nik Prosen](https://www.buzzerbeater.com/player/55967943/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 DR 6->7 SB 1->3 | feeders behind (HA+DR 13 vs track 22) |
| [Anže Franko](https://www.buzzerbeater.com/player/55967965/overview.aspx) | 18 | mkt72-inside-2 | WATCH | HA 1->2 ID 5->11 SB 5->7 | ID behind the big-man early-defense track |
| [Tilen Loranski](https://www.buzzerbeater.com/player/55967972/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 1->7 DR 5->7 | feeders behind (HA+DR 12 vs track 22) |
| [Andi Goršek](https://www.buzzerbeater.com/player/55969570/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 4->7 IS 2->3 RB 2->3 | feeders behind (HA+DR 14 vs track 22) |
| [Vitomil Simonc](https://www.buzzerbeater.com/player/55969591/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 3->7 ID 2->4 | feeders behind (HA+DR 14 vs track 22) |
| [Damjan Malovrh](https://www.buzzerbeater.com/player/55969598/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 4->7 HA 6->7 DR 2->7 SB 2->3 | feeders behind (HA+DR 8 vs track 22) |
| [Ivica Novičić](https://www.buzzerbeater.com/player/55969599/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JR 3->4 OD 7->11 HA 6->9 DR 6->8 | feeders behind (HA+DR 12 vs track 27) |
| [Joco Zadnjik](https://www.buzzerbeater.com/player/55969604/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 1->9 DR 5->8 PA 2->4 | feeders behind (HA+DR 6 vs track 27) |
| [Miki Radovac](https://www.buzzerbeater.com/player/55989307/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 3->7 DR 6->7 IS 2->3 | feeders behind (HA+DR 13 vs track 22) |
| [Jasmin Čižman](https://www.buzzerbeater.com/player/55989367/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 JR 2->3 OD 3->7 HA 2->7 DR 4->7 ID 3->4 SB 2->3 | feeders behind (HA+DR 6 vs track 22) |
| [Saša Troch](https://www.buzzerbeater.com/player/55989732/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 2->5 OD 5->11 HA 6->9 DR 7->8 ID 2->3 | feeders behind (HA+DR 13 vs track 27) |
| [Rok Železnikar](https://www.buzzerbeater.com/player/55989943/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->7 HA 4->7 DR 3->7 | feeders behind (HA+DR 7 vs track 22) |
| [Ernest Peterlic](https://www.buzzerbeater.com/player/55990005/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->7 HA 3->7 DR 5->7 ID 2->4 | feeders behind (HA+DR 8 vs track 22) |
| [Uroš Kumeršek](https://www.buzzerbeater.com/player/55990233/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 3->11 HA 3->9 DR 6->8 | feeders behind (HA+DR 9 vs track 27) |
| [Vanja Štrucelj](https://www.buzzerbeater.com/player/55991284/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 1->7 DR 4->7 | feeders behind (HA+DR 11 vs track 22) |
| [Ludvik Mikša](https://www.buzzerbeater.com/player/55991295/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 HA 5->7 DR 3->7 SB 2->3 | feeders behind (HA+DR 8 vs track 22) |
| [Joco Miklavić](https://www.buzzerbeater.com/player/55992359/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->7 OD 6->7 HA 3->7 DR 5->7 PA 2->3 | feeders behind (HA+DR 8 vs track 22) |
| [Andre Černak](https://www.buzzerbeater.com/player/55993206/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 6->7 DR 6->7 SB 2->3 | feeders behind (HA+DR 12 vs track 22) |
| [Erik Dolenjc](https://www.buzzerbeater.com/player/55993520/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->5 OD 3->11 HA 6->9 DR 7->8 SB 1->2 | feeders behind (HA+DR 13 vs track 27) |
| [Miha Jurajevćić](https://www.buzzerbeater.com/player/55993566/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->5 OD 7->11 HA 7->9 DR 7->8 PA 2->4 IS 1->2 | feeders behind (HA+DR 14 vs track 27) |
| [Matej Arih](https://www.buzzerbeater.com/player/55993952/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 1->3 HA 6->7 DR 1->7 ID 3->4 RB 2->3 | feeders behind (HA+DR 7 vs track 22) |
| [Nastja Janc](https://www.buzzerbeater.com/player/55994289/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 DR 4->8 | feeders behind (HA+DR 11 vs track 27) |
| [Leon Seljanar](https://www.buzzerbeater.com/player/56009286/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 4->7 HA 1->7 DR 4->7 PA 1->3 SB 2->3 | feeders behind (HA+DR 5 vs track 22) |
| [Davor Nared](https://www.buzzerbeater.com/player/56023176/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->7 OD 1->7 HA 3->7 DR 2->7 IS 1->3 RB 1->3 SB 2->3 | feeders behind (HA+DR 5 vs track 22) |
| [Matija Volk](https://www.buzzerbeater.com/player/56023182/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 3->9 DR 6->8 | feeders behind (HA+DR 9 vs track 27) |
| [Zlatko Jeraj](https://www.buzzerbeater.com/player/56023183/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 HA 1->2 ID 4->11 RB 4->6 | ID behind the big-man early-defense track |
| [Jure Zvanut](https://www.buzzerbeater.com/player/56023186/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->7 ID 3->4 RB 1->3 SB 1->3 | feeders behind (HA+DR 14 vs track 22) |
| [Viki Hanc](https://www.buzzerbeater.com/player/56025544/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 1->7 DR 2->7 PA 2->3 | feeders behind (HA+DR 9 vs track 22) |
| [Bojan Bertoncelj](https://www.buzzerbeater.com/player/56026643/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 6->9 DR 7->8 ID 1->3 | feeders behind (HA+DR 13 vs track 27) |
| [Rade Nachbar](https://www.buzzerbeater.com/player/56028833/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 2->3 IS 5->6 ID 3->11 SB 6->7 | ID behind the big-man early-defense track |
| [Vinko Osojnik](https://www.buzzerbeater.com/player/56031610/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->7 OD 2->7 SB 2->3 | feeders behind (HA+DR 14 vs track 22) |
| [Ante Propadalo](https://www.buzzerbeater.com/player/56031971/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 2->9 DR 7->8 SB 1->2 | feeders behind (HA+DR 9 vs track 27) |
| [Vane Gruškovnjak](https://www.buzzerbeater.com/player/56032548/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 JR 2->3 OD 6->7 DR 5->7 SB 2->3 | feeders behind (HA+DR 12 vs track 22) |
| [Gal Udovc](https://www.buzzerbeater.com/player/56033829/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 7->8 | feeders behind (HA+DR 13 vs track 27) |
| [Vitomir Matekelj](https://www.buzzerbeater.com/player/56035040/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 1->7 DR 5->7 PA 1->3 | feeders behind (HA+DR 12 vs track 22) |
| [Matej Ružić](https://www.buzzerbeater.com/player/56035042/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->7 OD 3->7 HA 5->7 DR 2->7 PA 1->3 IS 1->3 | feeders behind (HA+DR 7 vs track 22) |
| [Mark Mirt](https://www.buzzerbeater.com/player/56035586/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->5 OD 7->11 HA 4->9 DR 2->8 | feeders behind (HA+DR 6 vs track 27) |
| [Oskar Umek](https://www.buzzerbeater.com/player/56035589/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->7 HA 3->7 DR 3->7 | feeders behind (HA+DR 6 vs track 22) |
| [Jordan Vošner](https://www.buzzerbeater.com/player/56035678/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 5->9 DR 1->8 SB 1->2 | feeders behind (HA+DR 6 vs track 27) |
| [Albin Tajnik](https://www.buzzerbeater.com/player/56036498/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->9 DR 6->8 ID 2->3 | feeders behind (HA+DR 12 vs track 27) |
| [Mojmir Haber](https://www.buzzerbeater.com/player/56036507/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 7->9 DR 7->8 | feeders behind (HA+DR 14 vs track 27) |
| [Dušan Ložar](https://www.buzzerbeater.com/player/55439681/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 5->14 HA 11->15 DR 9->14 IS 1->3 | feeders behind (HA+DR 20 vs track 27) |
| [Cene Tomašek](https://www.buzzerbeater.com/player/55439694/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 5->12 HA 9->12 DR 7->12 | feeders behind (HA+DR 16 vs track 22) |
| [Dušan Pilot](https://www.buzzerbeater.com/player/55439715/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 7->12 HA 6->12 DR 2->12 IS 1->4 | feeders behind (HA+DR 8 vs track 22) |
| [Toni Pirc](https://www.buzzerbeater.com/player/55439719/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 2->4 OD 6->12 HA 2->12 DR 3->12 IS 3->4 ID 4->6 | feeders behind (HA+DR 5 vs track 22) |
| [Taj Gregorčič](https://www.buzzerbeater.com/player/55439720/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 4->12 HA 7->12 DR 4->12 | feeders behind (HA+DR 11 vs track 22) |
| [Danilo Toplak](https://www.buzzerbeater.com/player/55439737/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 4->12 HA 5->12 DR 2->12 ID 3->6 | feeders behind (HA+DR 7 vs track 22) |
| [Nikolaj Gorinšek](https://www.buzzerbeater.com/player/55439747/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 HA 5->12 DR 5->12 | feeders behind (HA+DR 10 vs track 22) |
| [Miha Lukovšek](https://www.buzzerbeater.com/player/55439758/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 5->14 HA 5->15 DR 8->14 PA 4->5 ID 1->4 | feeders behind (HA+DR 13 vs track 27) |
| [Valentin Pucelj](https://www.buzzerbeater.com/player/55439777/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 6->12 HA 2->12 DR 3->12 IS 2->4 ID 3->6 SB 3->4 | feeders behind (HA+DR 5 vs track 22) |
| [Gaber Jambrek](https://www.buzzerbeater.com/player/55439783/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 2->4 HA 1->3 PA 1->2 ID 10->14 RB 5->10 SB 7->9 | ID behind the big-man early-defense track |
| [Dominik Janže](https://www.buzzerbeater.com/player/55439790/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 10->11 ID 10->14 SB 6->9 | ID behind the big-man early-defense track |
| [Tugomir Turkuš](https://www.buzzerbeater.com/player/55439792/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 JR 3->4 OD 3->12 HA 3->12 DR 1->12 ID 5->6 SB 2->4 | feeders behind (HA+DR 4 vs track 22) |
| [Todor Šimenc](https://www.buzzerbeater.com/player/55439793/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 11->15 DR 10->14 | feeders behind (HA+DR 21 vs track 27) |
| [Štefan Pevec](https://www.buzzerbeater.com/player/55439798/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 5->12 HA 3->12 DR 4->12 PA 1->4 IS 2->4 ID 2->6 | feeders behind (HA+DR 7 vs track 22) |
| [Voranc Navotnik](https://www.buzzerbeater.com/player/55439805/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 3->12 HA 6->12 DR 7->12 RB 1->4 | feeders behind (HA+DR 13 vs track 22) |
| [Sako Lončar](https://www.buzzerbeater.com/player/55439813/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->13 JR 4->6 OD 9->14 HA 11->14 DR 9->14 | feeders behind (HA+DR 20 vs track 26) |
| [Zdravko Miklavžina](https://www.buzzerbeater.com/player/55439822/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 5->12 HA 11->12 DR 8->12 | feeders behind (HA+DR 19 vs track 22) |
| [Mark Koblenčer](https://www.buzzerbeater.com/player/55439826/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 7->14 HA 5->15 DR 7->14 | feeders behind (HA+DR 12 vs track 27) |
| [Branko Perec](https://www.buzzerbeater.com/player/55439856/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 8->12 HA 7->12 DR 9->12 PA 3->4 | feeders behind (HA+DR 16 vs track 22) |
| [Oto Žula](https://www.buzzerbeater.com/player/55439870/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 2->4 OD 7->12 HA 5->12 DR 7->12 ID 4->6 | feeders behind (HA+DR 12 vs track 22) |
| [Martin Černak](https://www.buzzerbeater.com/player/55439871/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 4->12 HA 6->12 DR 5->12 PA 3->4 SB 3->4 | feeders behind (HA+DR 11 vs track 22) |
| [Bruno Milosavljević](https://www.buzzerbeater.com/player/55439887/overview.aspx) | 19 | mkt72-outside-1 | WATCH | OD 11->14 HA 10->15 DR 12->14 PA 4->5 | feeders behind (HA+DR 22 vs track 27) |
| [Vladimir Vrbnjak](https://www.buzzerbeater.com/player/55439901/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 7->12 HA 4->12 DR 7->12 SB 1->4 | feeders behind (HA+DR 11 vs track 22) |
| [Ožbej Bratušek](https://www.buzzerbeater.com/player/55439910/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 2->12 HA 9->12 DR 7->12 ID 5->6 SB 3->4 | feeders behind (HA+DR 16 vs track 22) |
| [Šime Jaunik](https://www.buzzerbeater.com/player/55439917/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 3->4 OD 7->12 HA 7->12 DR 4->12 PA 2->4 | feeders behind (HA+DR 11 vs track 22) |
| [Kevin Winkler](https://www.buzzerbeater.com/player/55439924/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 4->12 HA 3->12 DR 7->12 ID 4->6 | feeders behind (HA+DR 10 vs track 22) |
| [Jožef Tome](https://www.buzzerbeater.com/player/55439942/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 4->14 HA 7->15 DR 7->14 ID 2->4 | feeders behind (HA+DR 14 vs track 27) |
| [Borut Slavec](https://www.buzzerbeater.com/player/55439945/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 JR 4->5 OD 7->14 HA 7->15 DR 5->14 PA 4->5 | feeders behind (HA+DR 12 vs track 27) |
| [Anže Kolarič](https://www.buzzerbeater.com/player/55439947/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 3->12 HA 8->12 DR 5->12 IS 2->4 SB 1->4 | feeders behind (HA+DR 13 vs track 22) |
| [Štefan Bremec](https://www.buzzerbeater.com/player/55439962/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 7->12 HA 7->12 DR 7->12 | feeders behind (HA+DR 14 vs track 22) |
| [Gabrijel Uršnik](https://www.buzzerbeater.com/player/55439963/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 JR 3->4 OD 7->12 HA 4->12 DR 4->12 ID 3->6 | feeders behind (HA+DR 8 vs track 22) |
| [Jožko Peršina](https://www.buzzerbeater.com/player/55439971/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 7->12 HA 4->12 DR 5->12 ID 5->6 RB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Tim Montanič](https://www.buzzerbeater.com/player/55439977/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 IS 4->11 ID 6->14 RB 6->10 SB 7->9 | ID behind the big-man early-defense track |
| [Viljem Tušek](https://www.buzzerbeater.com/player/55439978/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 6->12 HA 7->12 DR 7->12 IS 2->4 ID 4->6 | feeders behind (HA+DR 14 vs track 22) |
| [Davorin Žele](https://www.buzzerbeater.com/player/55439998/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 7->15 DR 7->14 ID 3->4 | feeders behind (HA+DR 14 vs track 27) |
| [Kris Montanič](https://www.buzzerbeater.com/player/55440018/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 5->12 HA 7->12 DR 5->12 ID 5->6 RB 3->4 | feeders behind (HA+DR 12 vs track 22) |
| [Marjan Urih](https://www.buzzerbeater.com/player/55440021/overview.aspx) | 19 | mkt72-outside-1 | WATCH | OD 10->14 HA 10->15 DR 10->14 PA 3->5 | feeders behind (HA+DR 20 vs track 27) |
| [Patrik Urbanec](https://www.buzzerbeater.com/player/55440041/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 7->12 HA 7->12 DR 2->12 ID 5->6 | feeders behind (HA+DR 9 vs track 22) |
| [Dario Kalin](https://www.buzzerbeater.com/player/55440043/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 4->12 HA 6->12 DR 2->12 SB 3->4 | feeders behind (HA+DR 8 vs track 22) |
| [Alfred Petras](https://www.buzzerbeater.com/player/55440063/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 11->12 HA 6->12 DR 8->12 ID 5->6 | feeders behind (HA+DR 14 vs track 22) |
| [Muamer Bracek](https://www.buzzerbeater.com/player/55440069/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 JR 3->4 OD 4->12 HA 9->12 DR 9->12 | feeders behind (HA+DR 18 vs track 22) |
| [Samir Satler](https://www.buzzerbeater.com/player/55440073/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 6->12 HA 8->12 DR 9->12 ID 4->6 SB 3->4 | feeders behind (HA+DR 17 vs track 22) |
| [Robi Debeljak](https://www.buzzerbeater.com/player/55440078/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 7->14 HA 7->15 DR 7->14 | feeders behind (HA+DR 14 vs track 27) |
| [Anže Pegan](https://www.buzzerbeater.com/player/55440082/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 6->14 HA 4->15 DR 4->14 ID 1->4 SB 1->3 | feeders behind (HA+DR 8 vs track 27) |
| [Sašo Zatković](https://www.buzzerbeater.com/player/55440093/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 1->12 HA 1->12 DR 5->12 RB 3->4 | feeders behind (HA+DR 6 vs track 22) |
| [Franko Rosa](https://www.buzzerbeater.com/player/55440100/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 9->11 ID 9->14 | ID behind the big-man early-defense track |
| [Benjamin Jančar](https://www.buzzerbeater.com/player/55440106/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 1->12 HA 7->12 DR 7->12 IS 3->4 ID 2->6 SB 1->4 | feeders behind (HA+DR 14 vs track 22) |
| [Izidor Škerlič](https://www.buzzerbeater.com/player/55440131/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 2->12 HA 4->12 DR 5->12 PA 3->4 SB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Fabijan Lambergar](https://www.buzzerbeater.com/player/55440139/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 3->12 HA 9->12 DR 10->12 ID 3->6 | feeders behind (HA+DR 19 vs track 22) |
| [Teodor Perovšek](https://www.buzzerbeater.com/player/55440156/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 5->15 DR 7->14 | feeders behind (HA+DR 12 vs track 27) |
| [Tihomir Zagorac](https://www.buzzerbeater.com/player/55440174/overview.aspx) | 19 | mkt72-inside-2 | WATCH | HA 1->3 IS 5->11 ID 7->14 RB 6->10 SB 7->9 | ID behind the big-man early-defense track |
| [Stojan Rot](https://www.buzzerbeater.com/player/55440187/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 3->4 HA 2->3 IS 7->11 ID 7->14 RB 5->10 SB 6->9 | ID behind the big-man early-defense track |
| [Mišo Kušar](https://www.buzzerbeater.com/player/55440196/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 7->15 DR 4->14 PA 4->5 ID 3->4 | feeders behind (HA+DR 11 vs track 27) |
| [Mario Kolednik](https://www.buzzerbeater.com/player/55440213/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 5->14 HA 5->15 DR 7->14 PA 3->5 ID 1->4 | feeders behind (HA+DR 12 vs track 27) |
| [Damjan Skale](https://www.buzzerbeater.com/player/55440216/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 5->12 HA 1->12 DR 2->12 ID 4->6 RB 3->4 | feeders behind (HA+DR 3 vs track 22) |
| [Sebastijan Žigić](https://www.buzzerbeater.com/player/55440220/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 5->12 HA 4->12 DR 7->12 | feeders behind (HA+DR 11 vs track 22) |
| [Mladen Rotovnik](https://www.buzzerbeater.com/player/55440255/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 6->14 HA 9->15 DR 10->14 | feeders behind (HA+DR 19 vs track 27) |
| [Urh Pucl](https://www.buzzerbeater.com/player/55440283/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 IS 10->11 ID 10->14 RB 8->10 | ID behind the big-man early-defense track |
| [Ino Lozinšek](https://www.buzzerbeater.com/player/55440285/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 1->4 HA 2->3 IS 10->11 ID 10->14 RB 8->10 SB 5->9 | ID behind the big-man early-defense track |
| [Matjaž Cvitanič](https://www.buzzerbeater.com/player/55440299/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 7->12 HA 1->12 DR 5->12 PA 3->4 IS 3->4 ID 3->6 | feeders behind (HA+DR 6 vs track 22) |
| [Lojze Nesterović](https://www.buzzerbeater.com/player/55440341/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 5->12 HA 9->12 DR 10->12 ID 4->6 SB 1->4 | feeders behind (HA+DR 19 vs track 22) |
| [Branko Vravnik](https://www.buzzerbeater.com/player/55440350/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 9->15 DR 10->14 PA 4->5 | feeders behind (HA+DR 19 vs track 27) |
| [Branko Bošnjak](https://www.buzzerbeater.com/player/55440353/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 HA 9->15 DR 5->14 IS 2->3 | feeders behind (HA+DR 14 vs track 27) |
| [Manuel Žilavec](https://www.buzzerbeater.com/player/55440390/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 7->12 HA 8->12 DR 8->12 PA 2->4 RB 1->4 | feeders behind (HA+DR 16 vs track 22) |
| [Ratko Sotlar](https://www.buzzerbeater.com/player/55461936/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 7->15 DR 5->14 PA 4->5 IS 2->3 ID 3->4 | feeders behind (HA+DR 12 vs track 27) |
| [Robert Tajnik](https://www.buzzerbeater.com/player/55462935/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 7->12 HA 4->12 DR 5->12 ID 5->6 RB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Mirko Veršič](https://www.buzzerbeater.com/player/55463315/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->11 OD 7->14 HA 4->15 DR 3->14 ID 2->4 | feeders behind (HA+DR 7 vs track 27) |
| [Jovica Zgonec](https://www.buzzerbeater.com/player/55463497/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 6->12 HA 6->12 DR 6->12 RB 2->4 | feeders behind (HA+DR 12 vs track 22) |
| [Edin Iljevec](https://www.buzzerbeater.com/player/55464019/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 1->12 HA 5->12 DR 9->12 SB 3->4 | feeders behind (HA+DR 14 vs track 22) |
| [Pepe Turkuš](https://www.buzzerbeater.com/player/55464877/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 10->13 JR 4->6 OD 8->14 HA 11->14 DR 12->14 ID 1->4 SB 2->3 | feeders behind (HA+DR 23 vs track 26) |
| [Aleksander Pungartnik](https://www.buzzerbeater.com/player/55466724/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 5->12 HA 8->12 DR 7->12 SB 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Primož Urbas](https://www.buzzerbeater.com/player/55525821/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 IS 6->11 ID 4->14 RB 7->10 SB 6->9 | ID behind the big-man early-defense track |
| [Lan Lesjak](https://www.buzzerbeater.com/player/55688844/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 7->12 HA 10->12 DR 7->12 | feeders behind (HA+DR 17 vs track 22) |
| [Alfred Zvonc](https://www.buzzerbeater.com/player/55688848/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 10->14 HA 8->15 DR 9->14 | feeders behind (HA+DR 17 vs track 27) |
| [Dominik Gašperin](https://www.buzzerbeater.com/player/55688856/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 11->12 HA 10->12 DR 10->12 ID 4->6 | feeders behind (HA+DR 20 vs track 22) |
| [Baltazar Vršić](https://www.buzzerbeater.com/player/55688860/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 5->12 HA 2->12 DR 4->12 RB 3->4 | feeders behind (HA+DR 6 vs track 22) |
| [Aleksander Turk](https://www.buzzerbeater.com/player/55688862/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 3->4 IS 10->11 ID 8->14 | ID behind the big-man early-defense track |
| [Sebastjan Peteršič](https://www.buzzerbeater.com/player/55688866/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 JR 3->4 OD 9->12 HA 5->12 DR 9->12 ID 3->6 RB 3->4 | feeders behind (HA+DR 14 vs track 22) |
| [Stane Pregelj](https://www.buzzerbeater.com/player/55688867/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 4->12 HA 4->12 DR 10->12 | feeders behind (HA+DR 14 vs track 22) |
| [Marko Urbanček](https://www.buzzerbeater.com/player/55688869/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 8->12 HA 8->12 DR 9->12 | feeders behind (HA+DR 17 vs track 22) |
| [Diego Štrucelj](https://www.buzzerbeater.com/player/55688872/overview.aspx) | 19 | mkt72-outside-1 | WATCH | OD 9->14 HA 8->15 DR 11->14 | feeders behind (HA+DR 19 vs track 27) |
| [Šimen Roter](https://www.buzzerbeater.com/player/55688873/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 6->12 HA 8->12 DR 7->12 ID 4->6 | feeders behind (HA+DR 15 vs track 22) |
| [Janko Pamić](https://www.buzzerbeater.com/player/55688875/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 9->14 HA 3->15 DR 3->14 ID 3->4 | feeders behind (HA+DR 6 vs track 27) |
| [Zlatan Jecl](https://www.buzzerbeater.com/player/55688876/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 10->15 DR 10->14 IS 2->3 ID 3->4 SB 1->3 | feeders behind (HA+DR 20 vs track 27) |
| [Jernej Kociper](https://www.buzzerbeater.com/player/55688880/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 9->12 HA 9->12 DR 8->12 RB 3->4 | feeders behind (HA+DR 17 vs track 22) |
| [Dare Kosovel](https://www.buzzerbeater.com/player/55688882/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 5->14 HA 10->15 DR 10->14 ID 2->4 | feeders behind (HA+DR 20 vs track 27) |
| [Blaž Magdić](https://www.buzzerbeater.com/player/55688884/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JR 3->5 OD 9->14 HA 11->15 DR 9->14 ID 1->4 | feeders behind (HA+DR 20 vs track 27) |
| [Nace Tolar](https://www.buzzerbeater.com/player/55688885/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 8->12 HA 4->12 DR 9->12 | feeders behind (HA+DR 13 vs track 22) |
| [Valentino Milošević](https://www.buzzerbeater.com/player/55688887/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 6->12 HA 10->12 DR 9->12 | feeders behind (HA+DR 19 vs track 22) |
| [Tavž Lovrenšcak](https://www.buzzerbeater.com/player/55688893/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 JR 2->4 OD 3->12 HA 6->12 DR 9->12 IS 3->4 ID 3->6 | feeders behind (HA+DR 15 vs track 22) |
| [Fran Šajn](https://www.buzzerbeater.com/player/55688899/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 10->11 ID 11->14 RB 4->10 | ID behind the big-man early-defense track |
| [Tejo Belšak](https://www.buzzerbeater.com/player/55688902/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 JR 3->5 OD 9->14 HA 9->15 DR 8->14 PA 4->5 | feeders behind (HA+DR 17 vs track 27) |
| [Miško Ostroveršnik](https://www.buzzerbeater.com/player/55688905/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 3->4 OD 4->12 HA 5->12 DR 7->12 ID 4->6 | feeders behind (HA+DR 12 vs track 22) |
| [Karel Korenčič](https://www.buzzerbeater.com/player/55688907/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 8->14 HA 9->15 DR 7->14 RB 1->2 | feeders behind (HA+DR 16 vs track 27) |
| [Marin Potočki](https://www.buzzerbeater.com/player/55688909/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 3->4 OD 6->12 HA 9->12 DR 4->12 ID 3->6 SB 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Ivor Simoniti](https://www.buzzerbeater.com/player/55688910/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 4->12 HA 9->12 DR 8->12 | feeders behind (HA+DR 17 vs track 22) |
| [Mihael Košir](https://www.buzzerbeater.com/player/55688913/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 10->14 HA 5->15 DR 9->14 SB 2->3 | feeders behind (HA+DR 14 vs track 27) |
| [Damir Pezdirnik](https://www.buzzerbeater.com/player/55688916/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 2->12 HA 8->12 DR 6->12 IS 3->4 | feeders behind (HA+DR 14 vs track 22) |
| [Dejan Delač](https://www.buzzerbeater.com/player/55688919/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 8->12 HA 5->12 DR 7->12 RB 1->4 | feeders behind (HA+DR 12 vs track 22) |
| [Tim Wolfhart](https://www.buzzerbeater.com/player/55688934/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 JR 1->4 OD 4->12 HA 8->12 DR 5->12 RB 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Borja Rosić](https://www.buzzerbeater.com/player/55688935/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 HA 2->3 ID 11->14 RB 7->10 SB 6->9 | ID behind the big-man early-defense track |
| [Vladimir Toman](https://www.buzzerbeater.com/player/55688936/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 3->4 IS 6->11 ID 9->14 RB 7->10 SB 7->9 | ID behind the big-man early-defense track |
| [Matic Gale](https://www.buzzerbeater.com/player/55688938/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 JR 1->2 OD 3->4 IS 9->11 ID 3->14 RB 6->10 | ID behind the big-man early-defense track |
| [Jovica Volčič](https://www.buzzerbeater.com/player/55688939/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 JR 1->4 OD 5->12 HA 3->12 DR 9->12 RB 3->4 | feeders behind (HA+DR 12 vs track 22) |
| [Ljubiša Košmrl](https://www.buzzerbeater.com/player/55688945/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 JR 4->5 OD 4->14 HA 10->15 DR 8->14 ID 1->4 | feeders behind (HA+DR 18 vs track 27) |
| [Dare Baksa](https://www.buzzerbeater.com/player/55688953/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 9->14 HA 4->15 DR 4->14 | feeders behind (HA+DR 8 vs track 27) |
| [Milimir Veselić](https://www.buzzerbeater.com/player/55688956/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 4->14 HA 5->15 DR 7->14 ID 3->4 | feeders behind (HA+DR 12 vs track 27) |
| [Pavel Topolovec](https://www.buzzerbeater.com/player/55688958/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 3->4 OD 6->12 HA 10->12 DR 5->12 PA 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Vitan Cimirotić](https://www.buzzerbeater.com/player/55688959/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 10->12 HA 4->12 DR 5->12 SB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Aleksej Pucel](https://www.buzzerbeater.com/player/55688960/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 4->12 HA 11->12 DR 9->12 SB 3->4 | feeders behind (HA+DR 20 vs track 22) |
| [Milimir Valjavec](https://www.buzzerbeater.com/player/55688962/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->13 OD 7->14 HA 9->14 DR 11->14 PA 4->5 ID 2->4 | feeders behind (HA+DR 20 vs track 26) |
| [Robert Povh](https://www.buzzerbeater.com/player/55688966/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 9->14 HA 5->15 DR 5->14 SB 2->3 | feeders behind (HA+DR 10 vs track 27) |
| [Lovro Lorenjak](https://www.buzzerbeater.com/player/55688968/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 5->12 HA 3->12 DR 6->12 IS 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Zvonimir Urbanec](https://www.buzzerbeater.com/player/55688969/overview.aspx) | 19 | mkt72-outside-1 | WATCH | OD 8->14 HA 13->15 DR 11->14 RB 1->2 | feeders behind (HA+DR 24 vs track 27) |
| [Urban Miklavčič](https://www.buzzerbeater.com/player/55688985/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->11 OD 7->14 HA 6->15 DR 9->14 ID 3->4 | feeders behind (HA+DR 15 vs track 27) |
| [Mido Pretnar](https://www.buzzerbeater.com/player/55688986/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 6->14 HA 3->15 DR 9->14 ID 1->4 | feeders behind (HA+DR 12 vs track 27) |
| [Miha Brežan](https://www.buzzerbeater.com/player/55688991/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 8->14 HA 11->15 DR 8->14 PA 3->5 IS 2->3 ID 3->4 | feeders behind (HA+DR 19 vs track 27) |
| [Joc Preširen](https://www.buzzerbeater.com/player/55688992/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 3->4 OD 10->12 HA 6->12 DR 10->12 ID 3->6 | feeders behind (HA+DR 16 vs track 22) |
| [Aljoša Ropoša](https://www.buzzerbeater.com/player/55688997/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 7->14 HA 10->15 DR 9->14 | feeders behind (HA+DR 19 vs track 27) |
| [Tim Zorec](https://www.buzzerbeater.com/player/55688998/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 12->13 OD 9->14 HA 11->14 DR 12->14 RB 1->2 | feeders behind (HA+DR 23 vs track 26) |
| [Lojze Bresnik](https://www.buzzerbeater.com/player/55688999/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 10->15 DR 9->14 | feeders behind (HA+DR 19 vs track 27) |
| [Lojz Mikložič](https://www.buzzerbeater.com/player/55689000/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 7->14 HA 3->15 DR 10->14 | feeders behind (HA+DR 13 vs track 27) |
| [Voranc Uršnik](https://www.buzzerbeater.com/player/55689001/overview.aspx) | 19 | mkt72-outside-1 | WATCH | OD 10->14 HA 9->15 DR 11->14 ID 3->4 SB 1->3 | feeders behind (HA+DR 20 vs track 27) |
| [Ožbej Urbas](https://www.buzzerbeater.com/player/55689006/overview.aspx) | 19 | mkt72-inside-2 | WATCH | PA 1->2 IS 10->11 ID 5->14 RB 9->10 SB 8->9 | ID behind the big-man early-defense track |
| [Boris Potočin](https://www.buzzerbeater.com/player/55689008/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 7->14 HA 5->15 DR 7->14 IS 1->3 | feeders behind (HA+DR 12 vs track 27) |
| [Matija Vulić](https://www.buzzerbeater.com/player/55689010/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 JR 3->5 OD 7->14 HA 6->15 DR 4->14 | feeders behind (HA+DR 10 vs track 27) |
| [Jaka Zgonec](https://www.buzzerbeater.com/player/55689011/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 7->12 HA 7->12 DR 6->12 | feeders behind (HA+DR 13 vs track 22) |
| [Blaž Blažič](https://www.buzzerbeater.com/player/55689019/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 2->12 HA 7->12 DR 9->12 ID 5->6 SB 3->4 | feeders behind (HA+DR 16 vs track 22) |
| [Žane Hanžek](https://www.buzzerbeater.com/player/55689021/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 JR 2->4 OD 3->12 HA 8->12 DR 3->12 ID 5->6 RB 3->4 | feeders behind (HA+DR 11 vs track 22) |
| [Jernej Kenda](https://www.buzzerbeater.com/player/55689024/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 4->14 HA 7->15 DR 7->14 | feeders behind (HA+DR 14 vs track 27) |
| [Črtomir Plesec](https://www.buzzerbeater.com/player/55689027/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 7->14 HA 11->15 DR 13->14 | feeders behind (HA+DR 24 vs track 27) |
| [Rado Goršin](https://www.buzzerbeater.com/player/55689028/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 9->12 HA 10->12 DR 8->12 | feeders behind (HA+DR 18 vs track 22) |
| [Anže Metelko](https://www.buzzerbeater.com/player/55689035/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 6->12 HA 7->12 DR 6->12 | feeders behind (HA+DR 13 vs track 22) |
| [Rožle Štibrič](https://www.buzzerbeater.com/player/55689041/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 JR 4->5 OD 5->14 HA 5->15 DR 4->14 | feeders behind (HA+DR 9 vs track 27) |
| [Mirsad Pulko](https://www.buzzerbeater.com/player/55689048/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 6->14 HA 4->15 DR 6->14 | feeders behind (HA+DR 10 vs track 27) |
| [Egon Sinkovič](https://www.buzzerbeater.com/player/55689049/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 7->12 HA 1->12 DR 3->12 RB 3->4 | feeders behind (HA+DR 4 vs track 22) |
| [Gojko Balažič](https://www.buzzerbeater.com/player/55689053/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 10->11 ID 10->14 SB 8->9 | ID behind the big-man early-defense track |
| [Jaša Velej](https://www.buzzerbeater.com/player/55689055/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 IS 6->11 ID 10->14 | ID behind the big-man early-defense track |
| [Črtomir Kodre](https://www.buzzerbeater.com/player/55689059/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 2->14 HA 2->15 DR 6->14 | feeders behind (HA+DR 8 vs track 27) |
| [Kristijan Kapl](https://www.buzzerbeater.com/player/55689071/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 11->14 HA 11->15 DR 12->14 | feeders behind (HA+DR 23 vs track 27) |
| [Taj Pezdir](https://www.buzzerbeater.com/player/55689078/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->13 JR 5->6 OD 7->14 HA 10->14 DR 12->14 PA 4->5 ID 3->4 SB 1->3 | feeders behind (HA+DR 22 vs track 26) |
| [Emanuel Miš](https://www.buzzerbeater.com/player/55689079/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 8->12 DR 9->12 | feeders behind (HA+DR 21 vs track 22) |
| [Zoki Šega](https://www.buzzerbeater.com/player/55689081/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 4->12 HA 7->12 DR 7->12 RB 2->4 | feeders behind (HA+DR 14 vs track 22) |
| [Oton Urbančič](https://www.buzzerbeater.com/player/55689085/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 8->14 HA 9->15 DR 6->14 SB 1->3 | feeders behind (HA+DR 15 vs track 27) |
| [Žan Sočan](https://www.buzzerbeater.com/player/55689087/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 3->12 HA 6->12 DR 9->12 | feeders behind (HA+DR 15 vs track 22) |
| [Jeremi Uršnik](https://www.buzzerbeater.com/player/55689090/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 1->11 JR 3->4 OD 7->12 HA 9->12 DR 8->12 ID 5->6 SB 3->4 | feeders behind (HA+DR 17 vs track 22) |
| [Ivan Anzelj](https://www.buzzerbeater.com/player/55689096/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 3->12 HA 6->12 DR 5->12 ID 3->6 | feeders behind (HA+DR 11 vs track 22) |
| [Ervin Guček](https://www.buzzerbeater.com/player/55689097/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 5->12 HA 8->12 DR 3->12 RB 2->4 SB 3->4 | feeders behind (HA+DR 11 vs track 22) |
| [Aleš Jamnišek](https://www.buzzerbeater.com/player/55689100/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 4->12 HA 6->12 DR 10->12 ID 2->6 | feeders behind (HA+DR 16 vs track 22) |
| [Štef Osaj](https://www.buzzerbeater.com/player/55689106/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 6->12 HA 9->12 DR 5->12 | feeders behind (HA+DR 14 vs track 22) |
| [Božo Bračko](https://www.buzzerbeater.com/player/55689110/overview.aspx) | 19 | mkt72-inside-1 | WATCH | OD 1->4 IS 3->7 ID 9->15 RB 10->11 SB 13->16 | ID behind the big-man early-defense track |
| [Valter Part](https://www.buzzerbeater.com/player/55689119/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 4->12 HA 6->12 DR 9->12 | feeders behind (HA+DR 15 vs track 22) |
| [Nik Mohor](https://www.buzzerbeater.com/player/55689126/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 10->12 HA 9->12 DR 5->12 | feeders behind (HA+DR 14 vs track 22) |
| [Brin Kaluder](https://www.buzzerbeater.com/player/55689128/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 1->4 OD 3->12 HA 3->12 DR 8->12 | feeders behind (HA+DR 11 vs track 22) |
| [Gvido Gojčič](https://www.buzzerbeater.com/player/55689131/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 9->12 HA 9->12 DR 4->12 PA 1->4 ID 4->6 | feeders behind (HA+DR 13 vs track 22) |
| [David Gavrilović](https://www.buzzerbeater.com/player/55689139/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 6->12 HA 10->12 DR 6->12 PA 2->4 | feeders behind (HA+DR 16 vs track 22) |
| [Benjamin Apatič](https://www.buzzerbeater.com/player/55689148/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 7->14 HA 9->15 DR 10->14 | feeders behind (HA+DR 19 vs track 27) |
| [Matija Županec](https://www.buzzerbeater.com/player/55689149/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 HA 1->3 IS 4->11 ID 8->14 RB 9->10 SB 5->9 | ID behind the big-man early-defense track |
| [Amel Muhić](https://www.buzzerbeater.com/player/55689153/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 4->12 HA 4->12 DR 6->12 | feeders behind (HA+DR 10 vs track 22) |
| [Mitja Štrumbelj](https://www.buzzerbeater.com/player/55689154/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 2->12 HA 8->12 DR 9->12 PA 2->4 | feeders behind (HA+DR 17 vs track 22) |
| [Hotimir Tretjak](https://www.buzzerbeater.com/player/55689158/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 10->14 HA 8->15 DR 9->14 | feeders behind (HA+DR 17 vs track 27) |
| [Nace Koron](https://www.buzzerbeater.com/player/55689162/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 PA 1->2 IS 7->11 ID 8->14 RB 8->10 SB 8->9 | ID behind the big-man early-defense track |
| [Janez Arhar](https://www.buzzerbeater.com/player/55689163/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 8->15 DR 5->14 ID 3->4 SB 2->3 | feeders behind (HA+DR 13 vs track 27) |
| [Josip Murn](https://www.buzzerbeater.com/player/55689164/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 JR 3->4 OD 5->12 HA 9->12 DR 10->12 ID 5->6 SB 1->4 | feeders behind (HA+DR 19 vs track 22) |
| [Metod Neubauer](https://www.buzzerbeater.com/player/55689166/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 5->11 ID 10->14 | ID behind the big-man early-defense track |
| [Alfonz Cedilnik](https://www.buzzerbeater.com/player/55689173/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 JR 2->4 OD 10->12 HA 5->12 DR 10->12 PA 2->4 | feeders behind (HA+DR 15 vs track 22) |
| [Mirko Mežič](https://www.buzzerbeater.com/player/55689175/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 8->12 HA 10->12 DR 9->12 | feeders behind (HA+DR 19 vs track 22) |
| [Jani Puntar](https://www.buzzerbeater.com/player/55689183/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 IS 10->11 ID 5->14 | ID behind the big-man early-defense track |
| [Ratko Komel](https://www.buzzerbeater.com/player/55689189/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 6->14 HA 9->15 DR 9->14 IS 1->3 | feeders behind (HA+DR 18 vs track 27) |
| [Slavko Vuzem](https://www.buzzerbeater.com/player/55689191/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 JR 2->4 OD 10->12 HA 8->12 DR 9->12 ID 4->6 | feeders behind (HA+DR 17 vs track 22) |
| [Vito Železnikar](https://www.buzzerbeater.com/player/55689192/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 3->15 DR 6->14 ID 2->4 | feeders behind (HA+DR 9 vs track 27) |
| [Zoki Balažic](https://www.buzzerbeater.com/player/55689193/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 HA 2->3 IS 8->11 ID 8->14 RB 9->10 | ID behind the big-man early-defense track |
| [Ferdo Gregorec](https://www.buzzerbeater.com/player/55689197/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 4->12 HA 5->12 DR 8->12 | feeders behind (HA+DR 13 vs track 22) |
| [Jure Culič](https://www.buzzerbeater.com/player/55689201/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 4->12 HA 8->12 DR 6->12 PA 1->4 ID 4->6 SB 3->4 | feeders behind (HA+DR 14 vs track 22) |
| [Leon Kos](https://www.buzzerbeater.com/player/55689203/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 3->4 OD 5->12 HA 8->12 DR 8->12 SB 1->4 | feeders behind (HA+DR 16 vs track 22) |
| [Rudi Lovrinović](https://www.buzzerbeater.com/player/55689207/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 9->14 HA 4->15 DR 4->14 | feeders behind (HA+DR 8 vs track 27) |
| [Primož Suhadolc](https://www.buzzerbeater.com/player/55689212/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 9->12 HA 5->12 DR 10->12 ID 3->6 RB 2->4 | feeders behind (HA+DR 15 vs track 22) |
| [Šime Gašpar](https://www.buzzerbeater.com/player/55689215/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 8->14 HA 3->15 DR 7->14 PA 4->5 | feeders behind (HA+DR 10 vs track 27) |
| [Matic Kržan](https://www.buzzerbeater.com/player/55689216/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 DR 1->3 IS 5->11 ID 10->14 | ID behind the big-man early-defense track |
| [Nik Ropret](https://www.buzzerbeater.com/player/55689217/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 9->14 HA 8->15 DR 8->14 | feeders behind (HA+DR 16 vs track 27) |
| [Nedžad Lavrenčak](https://www.buzzerbeater.com/player/55689219/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 8->12 HA 8->12 DR 7->12 | feeders behind (HA+DR 15 vs track 22) |
| [Dominik Strojan](https://www.buzzerbeater.com/player/55689221/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 7->15 DR 9->14 ID 2->4 | feeders behind (HA+DR 16 vs track 27) |
| [Viljem Slakonja](https://www.buzzerbeater.com/player/55689224/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 7->14 HA 9->15 DR 10->14 ID 1->4 | feeders behind (HA+DR 19 vs track 27) |
| [Jurij Venier](https://www.buzzerbeater.com/player/55689229/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 7->14 HA 7->15 DR 7->14 IS 2->3 ID 3->4 RB 1->2 | feeders behind (HA+DR 14 vs track 27) |
| [Braco Brulc](https://www.buzzerbeater.com/player/55689230/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 3->12 HA 9->12 DR 4->12 | feeders behind (HA+DR 13 vs track 22) |
| [Tomo Lovič](https://www.buzzerbeater.com/player/55689232/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 4->12 HA 7->12 DR 2->12 SB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Tim Linasi](https://www.buzzerbeater.com/player/55689233/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 2->4 OD 4->12 HA 7->12 DR 7->12 | feeders behind (HA+DR 14 vs track 22) |
| [Aleksej Miklošic](https://www.buzzerbeater.com/player/55689234/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 9->12 HA 9->12 DR 11->12 PA 3->4 SB 2->4 | feeders behind (HA+DR 20 vs track 22) |
| [Tavž Hrušica](https://www.buzzerbeater.com/player/55689235/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 10->14 HA 4->15 DR 3->14 PA 2->5 | feeders behind (HA+DR 7 vs track 27) |
| [Dore Dagarin](https://www.buzzerbeater.com/player/55689238/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 4->12 HA 9->12 DR 7->12 | feeders behind (HA+DR 16 vs track 22) |
| [Henrik Žigić](https://www.buzzerbeater.com/player/55689242/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 4->12 HA 8->12 DR 3->12 ID 3->6 | feeders behind (HA+DR 11 vs track 22) |
| [Tine Golob](https://www.buzzerbeater.com/player/55689248/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 11->12 HA 10->12 DR 11->12 | feeders behind (HA+DR 21 vs track 22) |
| [Adrijan Šoster](https://www.buzzerbeater.com/player/55689264/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 8->12 HA 11->12 DR 8->12 | feeders behind (HA+DR 19 vs track 22) |
| [Nikola Mal](https://www.buzzerbeater.com/player/55689265/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 9->12 HA 8->12 DR 8->12 SB 2->4 | feeders behind (HA+DR 16 vs track 22) |
| [Hugo Pavlič](https://www.buzzerbeater.com/player/55689279/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 4->14 HA 2->15 DR 9->14 | feeders behind (HA+DR 11 vs track 27) |
| [Kris Turkuš](https://www.buzzerbeater.com/player/55689285/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 4->12 HA 5->12 DR 3->12 PA 1->4 ID 4->6 | feeders behind (HA+DR 8 vs track 22) |
| [Stribor Vencelj](https://www.buzzerbeater.com/player/55689287/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 4->12 HA 10->12 DR 5->12 IS 2->4 | feeders behind (HA+DR 15 vs track 22) |
| [Lenart Luk](https://www.buzzerbeater.com/player/55689297/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->11 OD 7->14 HA 3->15 DR 9->14 IS 1->3 ID 2->4 | feeders behind (HA+DR 12 vs track 27) |
| [Vanja Kralj](https://www.buzzerbeater.com/player/55689306/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 2->12 HA 8->12 DR 9->12 | feeders behind (HA+DR 17 vs track 22) |
| [Baltazar Falež](https://www.buzzerbeater.com/player/55689307/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 1->12 HA 9->12 DR 4->12 ID 4->6 | feeders behind (HA+DR 13 vs track 22) |
| [Slavko Korenc](https://www.buzzerbeater.com/player/55689311/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 8->11 ID 10->14 SB 5->9 | ID behind the big-man early-defense track |
| [Mario Jelinčič](https://www.buzzerbeater.com/player/55689314/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 4->12 HA 5->12 DR 3->12 | feeders behind (HA+DR 8 vs track 22) |
| [Črtomir Fink](https://www.buzzerbeater.com/player/55689315/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 8->14 HA 4->15 DR 5->14 | feeders behind (HA+DR 9 vs track 27) |
| [Janez Lavrenčak](https://www.buzzerbeater.com/player/55689316/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 5->12 HA 6->12 DR 9->12 | feeders behind (HA+DR 15 vs track 22) |
| [Erazem Krnec](https://www.buzzerbeater.com/player/55689318/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 OD 1->4 HA 2->3 DR 1->3 PA 1->2 IS 10->11 ID 6->14 RB 7->10 | ID behind the big-man early-defense track |
| [Armin Zorić](https://www.buzzerbeater.com/player/55689324/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 4->12 HA 10->12 DR 7->12 | feeders behind (HA+DR 17 vs track 22) |
| [Sako Kolman](https://www.buzzerbeater.com/player/55689344/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 3->14 HA 10->15 DR 7->14 IS 2->3 | feeders behind (HA+DR 17 vs track 27) |
| [Miha Širca](https://www.buzzerbeater.com/player/55689345/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 5->15 DR 5->14 | feeders behind (HA+DR 10 vs track 27) |
| [Štefan Jožetič](https://www.buzzerbeater.com/player/55689364/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 9->12 HA 7->12 DR 8->12 ID 5->6 | feeders behind (HA+DR 15 vs track 22) |
| [Gal Pakiž](https://www.buzzerbeater.com/player/55689365/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 9->12 HA 7->12 DR 8->12 RB 1->4 SB 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Alojz Škorjanc](https://www.buzzerbeater.com/player/55689366/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 10->14 HA 7->15 DR 3->14 | feeders behind (HA+DR 10 vs track 27) |
| [Jaša Hac](https://www.buzzerbeater.com/player/55689381/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 9->12 HA 5->12 DR 5->12 | feeders behind (HA+DR 10 vs track 22) |
| [Kevin Hrvacki](https://www.buzzerbeater.com/player/55689382/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 9->14 HA 5->15 DR 7->14 RB 1->2 | feeders behind (HA+DR 12 vs track 27) |
| [Tibor Sovič](https://www.buzzerbeater.com/player/55689387/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 JR 3->5 OD 7->14 HA 8->15 DR 8->14 ID 3->4 | feeders behind (HA+DR 16 vs track 27) |
| [Matej Plesavec](https://www.buzzerbeater.com/player/55689393/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 5->12 HA 9->12 DR 3->12 | feeders behind (HA+DR 12 vs track 22) |
| [Erik Vrdev](https://www.buzzerbeater.com/player/55689396/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 7->14 HA 9->15 DR 2->14 ID 2->4 | feeders behind (HA+DR 11 vs track 27) |
| [Boris Gornik](https://www.buzzerbeater.com/player/55689405/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 8->14 HA 9->15 DR 4->14 IS 2->3 | feeders behind (HA+DR 13 vs track 27) |
| [Miroslav Smolar](https://www.buzzerbeater.com/player/55689406/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 7->12 HA 7->12 DR 7->12 ID 4->6 | feeders behind (HA+DR 14 vs track 22) |
| [Matija Vrhovc](https://www.buzzerbeater.com/player/55689410/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 4->12 HA 9->12 DR 4->12 SB 1->4 | feeders behind (HA+DR 13 vs track 22) |
| [Dominik Perne](https://www.buzzerbeater.com/player/55689411/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 OD 3->4 IS 10->11 ID 9->14 SB 5->9 | ID behind the big-man early-defense track |
| [Demis Janževec](https://www.buzzerbeater.com/player/55689412/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 9->13 OD 7->14 HA 9->14 DR 10->14 ID 2->4 SB 1->3 | feeders behind (HA+DR 19 vs track 26) |
| [Tihomir Malovrh](https://www.buzzerbeater.com/player/55689417/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 7->12 HA 4->12 DR 10->12 | feeders behind (HA+DR 14 vs track 22) |
| [Aljaž Čarek](https://www.buzzerbeater.com/player/55689445/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 1->12 HA 6->12 DR 9->12 | feeders behind (HA+DR 15 vs track 22) |
| [Jan Kunc](https://www.buzzerbeater.com/player/55689446/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 1->4 OD 6->12 HA 10->12 DR 11->12 ID 5->6 | feeders behind (HA+DR 21 vs track 22) |
| [Tibor Kroflič](https://www.buzzerbeater.com/player/55689447/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 3->12 HA 3->12 DR 7->12 | feeders behind (HA+DR 10 vs track 22) |
| [Matjaž Podbelšek](https://www.buzzerbeater.com/player/55689455/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 2->14 HA 9->15 DR 10->14 ID 3->4 | feeders behind (HA+DR 19 vs track 27) |
| [Janez Pulko](https://www.buzzerbeater.com/player/55689457/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 OD 1->4 IS 6->11 ID 10->14 RB 8->10 | ID behind the big-man early-defense track |
| [Igor Pivk](https://www.buzzerbeater.com/player/55689460/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 9->14 HA 7->15 DR 6->14 IS 2->3 | feeders behind (HA+DR 13 vs track 27) |
| [Nik Ludoviko](https://www.buzzerbeater.com/player/55689464/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 3->12 HA 10->12 DR 7->12 IS 3->4 ID 4->6 | feeders behind (HA+DR 17 vs track 22) |
| [Milimir Žlogar](https://www.buzzerbeater.com/player/55689484/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 10->11 ID 10->14 RB 8->10 | ID behind the big-man early-defense track |
| [Tit Barkovič](https://www.buzzerbeater.com/player/55689485/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 9->12 HA 5->12 DR 8->12 | feeders behind (HA+DR 13 vs track 22) |
| [Rafko Gavrilović](https://www.buzzerbeater.com/player/55689489/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 JR 4->5 OD 10->14 HA 4->15 DR 8->14 ID 3->4 | feeders behind (HA+DR 12 vs track 27) |
| [Igor Bertoncelj](https://www.buzzerbeater.com/player/55689496/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 10->14 HA 6->15 DR 7->14 ID 3->4 | feeders behind (HA+DR 13 vs track 27) |
| [Marko Marinčič](https://www.buzzerbeater.com/player/55689499/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 10->14 HA 9->15 DR 9->14 ID 2->4 | feeders behind (HA+DR 18 vs track 27) |
| [Jan Nauber](https://www.buzzerbeater.com/player/55689502/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 8->12 HA 4->12 DR 9->12 SB 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Aljoša Štiberc](https://www.buzzerbeater.com/player/55689504/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 JR 3->5 OD 7->14 HA 1->15 DR 9->14 | feeders behind (HA+DR 10 vs track 27) |
| [Vladimir Rojnik](https://www.buzzerbeater.com/player/55689506/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 2->4 OD 5->12 HA 6->12 DR 7->12 ID 5->6 RB 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Igor Zelen](https://www.buzzerbeater.com/player/55689509/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 6->14 HA 2->15 DR 8->14 | feeders behind (HA+DR 10 vs track 27) |
| [Nejc Brajovič](https://www.buzzerbeater.com/player/55689537/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 9->14 HA 2->15 DR 5->14 SB 2->3 | feeders behind (HA+DR 7 vs track 27) |
| [Urh Kamberović](https://www.buzzerbeater.com/player/55689543/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 4->12 HA 3->12 DR 6->12 IS 3->4 ID 5->6 RB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Gašper Zaveršnek](https://www.buzzerbeater.com/player/55689555/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 7->12 HA 3->12 DR 4->12 IS 3->4 ID 4->6 | feeders behind (HA+DR 7 vs track 22) |
| [Jani Mržek](https://www.buzzerbeater.com/player/55710577/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 6->14 HA 4->15 DR 10->14 PA 2->5 IS 1->3 | feeders behind (HA+DR 14 vs track 27) |
| [Darjan Lahovec](https://www.buzzerbeater.com/player/55710707/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 9->14 HA 5->15 DR 3->14 | feeders behind (HA+DR 8 vs track 27) |
| [Sebastjan Marinković](https://www.buzzerbeater.com/player/55710756/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 6->12 HA 10->12 DR 10->12 | feeders behind (HA+DR 20 vs track 22) |
| [Leonard Lapajna](https://www.buzzerbeater.com/player/55710863/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 JR 2->4 OD 5->12 HA 9->12 DR 6->12 ID 4->6 RB 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Andrej Šenica](https://www.buzzerbeater.com/player/55711671/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 11->14 HA 10->15 DR 9->14 | feeders behind (HA+DR 19 vs track 27) |
| [Anže Verovnik](https://www.buzzerbeater.com/player/55712395/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 10->12 HA 7->12 DR 4->12 | feeders behind (HA+DR 11 vs track 22) |
| [Darko Adamič](https://www.buzzerbeater.com/player/55713195/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 3->12 HA 8->12 DR 5->12 ID 2->6 RB 2->4 SB 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Slavko Košnik](https://www.buzzerbeater.com/player/55713357/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 9->13 OD 4->14 HA 13->14 DR 12->14 | feeders behind (HA+DR 25 vs track 26) |
| [Bogomir Kraševič](https://www.buzzerbeater.com/player/55713768/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 8->14 HA 6->15 DR 9->14 | feeders behind (HA+DR 15 vs track 27) |
| [Luka Pirc](https://www.buzzerbeater.com/player/55713981/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 9->12 HA 8->12 DR 3->12 | feeders behind (HA+DR 11 vs track 22) |
| [Lev Žugelj](https://www.buzzerbeater.com/player/55714232/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 3->4 OD 5->12 HA 8->12 DR 10->12 RB 1->4 | feeders behind (HA+DR 18 vs track 22) |
| [Domen Tomšek](https://www.buzzerbeater.com/player/55715671/overview.aspx) | 19 | mkt72-outside-1 | WATCH | OD 8->14 HA 10->15 DR 12->14 | feeders behind (HA+DR 22 vs track 27) |
| [Milenko Čebašek](https://www.buzzerbeater.com/player/55715732/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 9->14 HA 11->15 DR 13->14 ID 1->4 | feeders behind (HA+DR 24 vs track 27) |
| [Tihomir Pezderšek](https://www.buzzerbeater.com/player/55715937/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 10->12 HA 8->12 DR 9->12 PA 2->4 | feeders behind (HA+DR 17 vs track 22) |
| [Sergej Škerlj](https://www.buzzerbeater.com/player/55751962/overview.aspx) | 19 | mkt72-outside-1 | WATCH | OD 6->14 HA 10->15 DR 10->14 IS 2->3 | feeders behind (HA+DR 20 vs track 27) |
| [Nino Tomšič](https://www.buzzerbeater.com/player/55757014/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 2->12 HA 6->12 DR 2->12 IS 3->4 ID 2->6 RB 1->4 | feeders behind (HA+DR 8 vs track 22) |
| [Aljaž Benedejčič](https://www.buzzerbeater.com/player/55757016/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 JR 3->4 OD 7->12 HA 7->12 DR 1->12 ID 5->6 | feeders behind (HA+DR 8 vs track 22) |
| [Žan Bober](https://www.buzzerbeater.com/player/55967305/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 4->12 HA 3->12 DR 8->12 PA 3->4 | feeders behind (HA+DR 11 vs track 22) |
| [Miha Kampl](https://www.buzzerbeater.com/player/55967307/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 10->14 HA 6->15 DR 5->14 IS 1->3 ID 1->4 SB 1->3 | feeders behind (HA+DR 11 vs track 27) |
| [Matej Linhart](https://www.buzzerbeater.com/player/55967308/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 3->4 OD 9->12 HA 9->12 DR 3->12 ID 3->6 | feeders behind (HA+DR 12 vs track 22) |
| [Gašper Šolinc](https://www.buzzerbeater.com/player/55967310/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 10->12 HA 9->12 DR 5->12 ID 4->6 SB 2->4 | feeders behind (HA+DR 14 vs track 22) |
| [Rudi Turkoš](https://www.buzzerbeater.com/player/55967316/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 DR 1->3 IS 9->11 ID 8->14 SB 5->9 | ID behind the big-man early-defense track |
| [Andrej Sukič](https://www.buzzerbeater.com/player/55967321/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 6->12 HA 1->12 DR 4->12 | feeders behind (HA+DR 5 vs track 22) |
| [Igor Šegovič](https://www.buzzerbeater.com/player/55967324/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 3->15 DR 5->14 | feeders behind (HA+DR 8 vs track 27) |
| [Ernest Dolščak](https://www.buzzerbeater.com/player/55967333/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 8->14 HA 2->15 DR 10->14 ID 3->4 | feeders behind (HA+DR 12 vs track 27) |
| [Mišo Gorenc](https://www.buzzerbeater.com/player/55967336/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 7->12 HA 5->12 DR 4->12 PA 1->4 SB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Andraž Anžej](https://www.buzzerbeater.com/player/55967341/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 6->12 HA 4->12 DR 1->12 ID 3->6 SB 2->4 | feeders behind (HA+DR 5 vs track 22) |
| [Tine Merlak](https://www.buzzerbeater.com/player/55967346/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 5->12 HA 9->12 DR 5->12 ID 3->6 | feeders behind (HA+DR 14 vs track 22) |
| [Kostja Bračko](https://www.buzzerbeater.com/player/55967347/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 JR 1->5 OD 9->14 HA 4->15 DR 7->14 PA 4->5 ID 3->4 | feeders behind (HA+DR 11 vs track 27) |
| [Silvester Sviben](https://www.buzzerbeater.com/player/55967349/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 9->14 HA 6->15 DR 10->14 | feeders behind (HA+DR 16 vs track 27) |
| [Simon Kordyš](https://www.buzzerbeater.com/player/55967351/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 6->14 HA 10->15 DR 4->14 IS 2->3 SB 1->3 | feeders behind (HA+DR 14 vs track 27) |
| [Gal Bizant](https://www.buzzerbeater.com/player/55967358/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 3->12 HA 9->12 DR 3->12 ID 2->6 | feeders behind (HA+DR 12 vs track 22) |
| [Aleš Požegar](https://www.buzzerbeater.com/player/55967359/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 8->12 HA 9->12 DR 4->12 | feeders behind (HA+DR 13 vs track 22) |
| [Viki Pupaher](https://www.buzzerbeater.com/player/55967360/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 8->14 HA 8->15 DR 9->14 IS 2->3 ID 2->4 RB 1->2 | feeders behind (HA+DR 17 vs track 27) |
| [Andraž Pajenk](https://www.buzzerbeater.com/player/55967366/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 4->12 HA 3->12 DR 9->12 | feeders behind (HA+DR 12 vs track 22) |
| [Leonid Kordiš](https://www.buzzerbeater.com/player/55967370/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 5->12 HA 5->12 DR 2->12 ID 4->6 | feeders behind (HA+DR 7 vs track 22) |
| [Dejan Mayer](https://www.buzzerbeater.com/player/55967373/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 5->14 HA 5->15 DR 9->14 IS 1->3 | feeders behind (HA+DR 14 vs track 27) |
| [Luka Kordež](https://www.buzzerbeater.com/player/55967376/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 3->12 HA 2->12 DR 4->12 PA 3->4 IS 3->4 RB 3->4 | feeders behind (HA+DR 6 vs track 22) |
| [Julijan Gorza](https://www.buzzerbeater.com/player/55967378/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 6->12 HA 3->12 DR 1->12 | feeders behind (HA+DR 4 vs track 22) |
| [Urh Anžlovar](https://www.buzzerbeater.com/player/55967388/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 3->4 OD 9->12 HA 6->12 DR 7->12 | feeders behind (HA+DR 13 vs track 22) |
| [Matej Župan](https://www.buzzerbeater.com/player/55967391/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 9->12 HA 9->12 DR 6->12 | feeders behind (HA+DR 15 vs track 22) |
| [Marinko Indihar](https://www.buzzerbeater.com/player/55967392/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 8->12 HA 4->12 DR 10->12 IS 3->4 | feeders behind (HA+DR 14 vs track 22) |
| [Tim Kutin](https://www.buzzerbeater.com/player/55967394/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 5->14 HA 4->15 DR 3->14 IS 1->3 ID 2->4 SB 1->3 | feeders behind (HA+DR 7 vs track 27) |
| [Peter Murovec](https://www.buzzerbeater.com/player/55967396/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 3->4 OD 3->12 HA 3->12 DR 8->12 PA 3->4 | feeders behind (HA+DR 11 vs track 22) |
| [Jurij Tomasini](https://www.buzzerbeater.com/player/55967398/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 9->12 HA 7->12 DR 4->12 ID 5->6 | feeders behind (HA+DR 11 vs track 22) |
| [Davorin Lovka](https://www.buzzerbeater.com/player/55967399/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 8->14 HA 3->15 DR 3->14 IS 2->3 ID 3->4 SB 2->3 | feeders behind (HA+DR 6 vs track 27) |
| [Gaj Krkoč](https://www.buzzerbeater.com/player/55967400/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 7->12 HA 7->12 DR 5->12 PA 3->4 | feeders behind (HA+DR 12 vs track 22) |
| [Nik Bizjak](https://www.buzzerbeater.com/player/55967412/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 9->14 HA 6->15 DR 6->14 IS 2->3 | feeders behind (HA+DR 12 vs track 27) |
| [Slavko Podlipnik](https://www.buzzerbeater.com/player/55967413/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 7->14 HA 8->15 DR 8->14 ID 1->4 | feeders behind (HA+DR 16 vs track 27) |
| [Goran Grilc](https://www.buzzerbeater.com/player/55967415/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 4->12 HA 7->12 DR 10->12 ID 5->6 | feeders behind (HA+DR 17 vs track 22) |
| [Franko Rugelj](https://www.buzzerbeater.com/player/55967420/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 6->12 HA 8->12 DR 5->12 ID 2->6 | feeders behind (HA+DR 13 vs track 22) |
| [Marcel Majerčič](https://www.buzzerbeater.com/player/55967421/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 HA 2->3 DR 1->3 IS 6->11 ID 8->14 SB 7->9 | ID behind the big-man early-defense track |
| [Vitan Kastelic](https://www.buzzerbeater.com/player/55967426/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 JR 2->4 OD 9->12 HA 5->12 DR 7->12 ID 5->6 | feeders behind (HA+DR 12 vs track 22) |
| [Damjan Horvatiček](https://www.buzzerbeater.com/player/55967428/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 9->12 HA 4->12 DR 4->12 ID 5->6 | feeders behind (HA+DR 8 vs track 22) |
| [Sašo Vrhovc](https://www.buzzerbeater.com/player/55967435/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 3->12 HA 9->12 DR 7->12 | feeders behind (HA+DR 16 vs track 22) |
| [Mladen Maruško](https://www.buzzerbeater.com/player/55967437/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 7->12 HA 7->12 DR 7->12 ID 5->6 | feeders behind (HA+DR 14 vs track 22) |
| [Hasim Škerjanec](https://www.buzzerbeater.com/player/55967439/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 JR 2->5 OD 10->14 HA 4->15 DR 10->14 IS 1->3 | feeders behind (HA+DR 14 vs track 27) |
| [Miloš Bauer](https://www.buzzerbeater.com/player/55967441/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 8->12 HA 5->12 DR 9->12 PA 1->4 ID 5->6 SB 2->4 | feeders behind (HA+DR 14 vs track 22) |
| [Hasim Šen](https://www.buzzerbeater.com/player/55967443/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 8->14 HA 7->15 DR 9->14 ID 3->4 | feeders behind (HA+DR 16 vs track 27) |
| [Džoni Badovinac](https://www.buzzerbeater.com/player/55967444/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 2->12 HA 8->12 DR 4->12 ID 3->6 | feeders behind (HA+DR 12 vs track 22) |
| [Mario Penca](https://www.buzzerbeater.com/player/55967445/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 6->12 HA 10->12 DR 4->12 ID 4->6 | feeders behind (HA+DR 14 vs track 22) |
| [Nikolaj Pustovrh](https://www.buzzerbeater.com/player/55967447/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 4->12 HA 10->12 DR 8->12 RB 2->4 | feeders behind (HA+DR 18 vs track 22) |
| [Luka Keder](https://www.buzzerbeater.com/player/55967453/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 8->14 HA 4->15 DR 10->14 ID 3->4 | feeders behind (HA+DR 14 vs track 27) |
| [Tibor Rozman](https://www.buzzerbeater.com/player/55967454/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 OD 2->4 HA 1->3 IS 7->11 ID 9->14 RB 8->10 SB 6->9 | ID behind the big-man early-defense track |
| [Emanuel Dušak](https://www.buzzerbeater.com/player/55967456/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 JR 4->5 OD 9->14 HA 10->15 DR 2->14 SB 2->3 | feeders behind (HA+DR 12 vs track 27) |
| [Matic Sanković](https://www.buzzerbeater.com/player/55967460/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 HA 1->3 IS 9->11 ID 6->14 RB 8->10 | ID behind the big-man early-defense track |
| [Jože Kanič](https://www.buzzerbeater.com/player/55967468/overview.aspx) | 19 | mkt72-inside-2 | WATCH | DR 1->3 IS 7->11 ID 5->14 RB 9->10 | ID behind the big-man early-defense track |
| [Ante Dobre](https://www.buzzerbeater.com/player/55967469/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 4->12 HA 6->12 DR 4->12 | feeders behind (HA+DR 10 vs track 22) |
| [Mirko Virtič](https://www.buzzerbeater.com/player/55967470/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 1->4 OD 1->12 HA 5->12 DR 3->12 RB 3->4 SB 2->4 | feeders behind (HA+DR 8 vs track 22) |
| [Nikita Sernek](https://www.buzzerbeater.com/player/55967471/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 5->12 HA 5->12 DR 5->12 SB 2->4 | feeders behind (HA+DR 10 vs track 22) |
| [Senad Marini](https://www.buzzerbeater.com/player/55967473/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 6->12 HA 9->12 DR 4->12 ID 5->6 SB 2->4 | feeders behind (HA+DR 13 vs track 22) |
| [Zoki Ivanc](https://www.buzzerbeater.com/player/55967475/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 10->14 HA 3->15 DR 9->14 SB 1->3 | feeders behind (HA+DR 12 vs track 27) |
| [Jurica Peranić](https://www.buzzerbeater.com/player/55967477/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 4->12 HA 7->12 DR 3->12 | feeders behind (HA+DR 10 vs track 22) |
| [Črt Fakin](https://www.buzzerbeater.com/player/55967479/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 9->15 DR 8->14 ID 2->4 | feeders behind (HA+DR 17 vs track 27) |
| [Armin Kadunc](https://www.buzzerbeater.com/player/55967481/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 4->12 HA 3->12 DR 6->12 ID 5->6 RB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Dušan Pestotnik](https://www.buzzerbeater.com/player/55967482/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 10->14 HA 10->15 DR 8->14 ID 3->4 | feeders behind (HA+DR 18 vs track 27) |
| [Timotej Absec](https://www.buzzerbeater.com/player/55967485/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 7->12 HA 5->12 DR 4->12 | feeders behind (HA+DR 9 vs track 22) |
| [Andrej Kosten](https://www.buzzerbeater.com/player/55967488/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 HA 2->3 DR 2->3 IS 5->11 ID 9->14 RB 9->10 SB 3->9 | ID behind the big-man early-defense track |
| [Fredi Gorše](https://www.buzzerbeater.com/player/55967489/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 7->14 HA 2->15 DR 3->14 | feeders behind (HA+DR 5 vs track 27) |
| [Diego Metelko](https://www.buzzerbeater.com/player/55967492/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 1->4 OD 9->12 HA 2->12 DR 7->12 ID 4->6 SB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Leonard Kralj](https://www.buzzerbeater.com/player/55967493/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 9->12 HA 9->12 DR 4->12 IS 3->4 ID 3->6 RB 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Aleš Malačič](https://www.buzzerbeater.com/player/55967496/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 3->12 HA 9->12 DR 9->12 PA 3->4 RB 3->4 SB 3->4 | feeders behind (HA+DR 18 vs track 22) |
| [Žare Rašl](https://www.buzzerbeater.com/player/55967499/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 JR 4->5 OD 7->14 HA 10->15 DR 7->14 | feeders behind (HA+DR 17 vs track 27) |
| [Aljaž Završnik](https://www.buzzerbeater.com/player/55967500/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 4->12 HA 7->12 DR 5->12 RB 3->4 | feeders behind (HA+DR 12 vs track 22) |
| [Florijan Božič](https://www.buzzerbeater.com/player/55967505/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 6->12 HA 10->12 DR 9->12 ID 3->6 | feeders behind (HA+DR 19 vs track 22) |
| [Pavel Dobromer](https://www.buzzerbeater.com/player/55967508/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 3->4 OD 3->12 HA 9->12 DR 7->12 PA 2->4 ID 5->6 SB 3->4 | feeders behind (HA+DR 16 vs track 22) |
| [Jurij Setnikar](https://www.buzzerbeater.com/player/55967509/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 9->14 HA 4->15 DR 6->14 PA 4->5 ID 2->4 RB 1->2 SB 2->3 | feeders behind (HA+DR 10 vs track 27) |
| [Joža Ahac](https://www.buzzerbeater.com/player/55967511/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 3->4 OD 6->12 HA 9->12 DR 3->12 RB 2->4 | feeders behind (HA+DR 12 vs track 22) |
| [Lovro Ravnikar](https://www.buzzerbeater.com/player/55967515/overview.aspx) | 19 | mkt72-inside-2 | WATCH | DR 2->3 IS 6->11 ID 9->14 SB 7->9 | ID behind the big-man early-defense track |
| [Urh Jamar](https://www.buzzerbeater.com/player/55967519/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 4->12 HA 8->12 DR 2->12 | feeders behind (HA+DR 10 vs track 22) |
| [Juš Rapre](https://www.buzzerbeater.com/player/55967520/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 9->12 HA 9->12 DR 6->12 | feeders behind (HA+DR 15 vs track 22) |
| [Rastislav Šoster](https://www.buzzerbeater.com/player/55967521/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 1->11 OD 6->12 HA 9->12 DR 6->12 ID 5->6 | feeders behind (HA+DR 15 vs track 22) |
| [Braco Martinc](https://www.buzzerbeater.com/player/55967524/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 9->14 HA 4->15 DR 10->14 ID 3->4 SB 2->3 | feeders behind (HA+DR 14 vs track 27) |
| [Jure Volčajnk](https://www.buzzerbeater.com/player/55967528/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 6->14 HA 7->15 DR 5->14 | feeders behind (HA+DR 12 vs track 27) |
| [Jožef Englaro](https://www.buzzerbeater.com/player/55967529/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 6->12 HA 8->12 DR 7->12 PA 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Jaka Majerle](https://www.buzzerbeater.com/player/55967536/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 JR 4->5 OD 10->14 HA 5->15 DR 2->14 | feeders behind (HA+DR 7 vs track 27) |
| [Bojan Ribarič](https://www.buzzerbeater.com/player/55967538/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 3->4 OD 8->12 HA 1->12 DR 3->12 | feeders behind (HA+DR 4 vs track 22) |
| [Pino Sever](https://www.buzzerbeater.com/player/55967539/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 5->12 HA 8->12 DR 10->12 | feeders behind (HA+DR 18 vs track 22) |
| [Henrik Preskar](https://www.buzzerbeater.com/player/55967546/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 8->15 DR 3->14 RB 1->2 SB 1->3 | feeders behind (HA+DR 11 vs track 27) |
| [Rok Cirar](https://www.buzzerbeater.com/player/55967566/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 JR 4->5 OD 9->14 HA 1->15 DR 4->14 IS 1->3 | feeders behind (HA+DR 5 vs track 27) |
| [Žane Roj](https://www.buzzerbeater.com/player/55967572/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 4->12 HA 1->12 DR 9->12 PA 3->4 | feeders behind (HA+DR 10 vs track 22) |
| [Suad Cetinski](https://www.buzzerbeater.com/player/55967577/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 7->12 HA 3->12 DR 6->12 PA 3->4 SB 2->4 | feeders behind (HA+DR 9 vs track 22) |
| [Andre Slovak](https://www.buzzerbeater.com/player/55967579/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 4->14 HA 6->15 DR 7->14 ID 1->4 | feeders behind (HA+DR 13 vs track 27) |
| [Gaj Belšek](https://www.buzzerbeater.com/player/55967581/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 7->12 HA 4->12 DR 3->12 ID 5->6 | feeders behind (HA+DR 7 vs track 22) |
| [Timo Lovro](https://www.buzzerbeater.com/player/55967584/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 2->4 OD 5->12 HA 4->12 DR 8->12 ID 4->6 | feeders behind (HA+DR 12 vs track 22) |
| [Rik Lovrač](https://www.buzzerbeater.com/player/55967586/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 5->12 HA 9->12 DR 10->12 | feeders behind (HA+DR 19 vs track 22) |
| [Henrik Gerzina](https://www.buzzerbeater.com/player/55967588/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 2->12 HA 3->12 DR 8->12 | feeders behind (HA+DR 11 vs track 22) |
| [Ernest Osterverh](https://www.buzzerbeater.com/player/55967589/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 5->12 HA 5->12 DR 8->12 ID 4->6 | feeders behind (HA+DR 13 vs track 22) |
| [Urban Brljak](https://www.buzzerbeater.com/player/55967590/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 3->12 HA 3->12 DR 9->12 | feeders behind (HA+DR 12 vs track 22) |
| [Todor Šenica](https://www.buzzerbeater.com/player/55967595/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 1->12 HA 5->12 DR 8->12 IS 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Miki Peruš](https://www.buzzerbeater.com/player/55967597/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 9->12 HA 9->12 DR 6->12 PA 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Dare Dobrila](https://www.buzzerbeater.com/player/55967599/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 10->14 HA 9->15 DR 10->14 IS 1->3 | feeders behind (HA+DR 19 vs track 27) |
| [Bor Vampelj](https://www.buzzerbeater.com/player/55967612/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 9->14 HA 1->15 DR 8->14 ID 2->4 | feeders behind (HA+DR 9 vs track 27) |
| [Alfonz Volovnik](https://www.buzzerbeater.com/player/55967613/overview.aspx) | 19 | mkt72-inside-2 | WATCH | HA 2->3 IS 9->11 ID 6->14 RB 6->10 SB 7->9 | ID behind the big-man early-defense track |
| [Admir Zabukovec](https://www.buzzerbeater.com/player/55967616/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 10->14 HA 6->15 DR 3->14 | feeders behind (HA+DR 9 vs track 27) |
| [Gojmir Toma](https://www.buzzerbeater.com/player/55967617/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 10->12 HA 7->12 DR 9->12 | feeders behind (HA+DR 16 vs track 22) |
| [Miroslav Brglez](https://www.buzzerbeater.com/player/55967618/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 8->14 HA 10->15 DR 6->14 | feeders behind (HA+DR 16 vs track 27) |
| [Omar Vesel](https://www.buzzerbeater.com/player/55967621/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 OD 1->4 HA 2->3 IS 7->11 ID 7->14 RB 8->10 SB 7->9 | ID behind the big-man early-defense track |
| [Nenad Klobučar](https://www.buzzerbeater.com/player/55967624/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 JR 1->4 OD 5->12 HA 8->12 DR 7->12 IS 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Klemen Mlakar](https://www.buzzerbeater.com/player/55967625/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 DR 2->3 PA 1->2 IS 8->11 ID 8->14 RB 7->10 SB 6->9 | ID behind the big-man early-defense track |
| [Branko Urukalo](https://www.buzzerbeater.com/player/55967627/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 7->12 HA 1->12 DR 5->12 | feeders behind (HA+DR 6 vs track 22) |
| [Sašo Linasi](https://www.buzzerbeater.com/player/55967629/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 7->14 HA 9->15 DR 4->14 RB 1->2 | feeders behind (HA+DR 13 vs track 27) |
| [Dario Lap](https://www.buzzerbeater.com/player/55967635/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 6->12 HA 9->12 DR 10->12 ID 3->6 | feeders behind (HA+DR 19 vs track 22) |
| [Tugo Vrhušek](https://www.buzzerbeater.com/player/55967636/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 3->12 HA 8->12 DR 10->12 ID 2->6 | feeders behind (HA+DR 18 vs track 22) |
| [Rok Javorič](https://www.buzzerbeater.com/player/55967652/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 10->15 DR 9->14 | feeders behind (HA+DR 19 vs track 27) |
| [Herbert Brigelj](https://www.buzzerbeater.com/player/55967654/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 OD 1->4 IS 9->11 ID 8->14 RB 7->10 SB 6->9 | ID behind the big-man early-defense track |
| [Tibor Grah](https://www.buzzerbeater.com/player/55967660/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 8->14 HA 7->15 DR 10->14 ID 3->4 RB 1->2 | feeders behind (HA+DR 17 vs track 27) |
| [Ožbej Nardin](https://www.buzzerbeater.com/player/55967666/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 8->14 HA 6->15 DR 8->14 IS 1->3 | feeders behind (HA+DR 14 vs track 27) |
| [Trpimir Repa](https://www.buzzerbeater.com/player/55967668/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 7->14 HA 8->15 DR 8->14 ID 1->4 | feeders behind (HA+DR 16 vs track 27) |
| [Lan Šegovič](https://www.buzzerbeater.com/player/55967669/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 3->12 HA 10->12 DR 1->12 | feeders behind (HA+DR 11 vs track 22) |
| [Marko Florjančič](https://www.buzzerbeater.com/player/55967670/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 6->14 HA 3->15 DR 4->14 | feeders behind (HA+DR 7 vs track 27) |
| [Ignac Brezar](https://www.buzzerbeater.com/player/55967675/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 5->12 HA 4->12 DR 7->12 | feeders behind (HA+DR 11 vs track 22) |
| [Ferdo Ogrič](https://www.buzzerbeater.com/player/55967677/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 OD 4->12 HA 9->12 DR 7->12 ID 4->6 | feeders behind (HA+DR 16 vs track 22) |
| [Ljubiša Stupan](https://www.buzzerbeater.com/player/55967678/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 JR 3->4 OD 9->12 HA 5->12 DR 4->12 | feeders behind (HA+DR 9 vs track 22) |
| [Matic Koblar](https://www.buzzerbeater.com/player/55967684/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 4->14 HA 5->15 DR 8->14 SB 1->3 | feeders behind (HA+DR 13 vs track 27) |
| [Darko Žilavec](https://www.buzzerbeater.com/player/55967687/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 3->14 HA 9->15 DR 3->14 PA 3->5 ID 3->4 SB 1->3 | feeders behind (HA+DR 12 vs track 27) |
| [Aleš Toporišič](https://www.buzzerbeater.com/player/55967688/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 8->12 HA 5->12 DR 9->12 | feeders behind (HA+DR 14 vs track 22) |
| [Boštjan Laharnar](https://www.buzzerbeater.com/player/55967704/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->11 OD 5->14 HA 9->15 DR 9->14 IS 1->3 ID 2->4 | feeders behind (HA+DR 18 vs track 27) |
| [Bojan Navinšek](https://www.buzzerbeater.com/player/55967708/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 9->11 ID 8->14 RB 4->10 | ID behind the big-man early-defense track |
| [Ferdinand Gojkošek](https://www.buzzerbeater.com/player/55967709/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 OD 2->4 IS 5->11 ID 9->14 RB 2->10 | ID behind the big-man early-defense track |
| [Anže Koblenčer](https://www.buzzerbeater.com/player/55967717/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 5->12 HA 2->12 DR 8->12 PA 3->4 | feeders behind (HA+DR 10 vs track 22) |
| [Zlatko Veršček](https://www.buzzerbeater.com/player/55967721/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 8->12 HA 3->12 DR 9->12 PA 3->4 | feeders behind (HA+DR 12 vs track 22) |
| [Franko Podergajs](https://www.buzzerbeater.com/player/55967722/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 3->4 OD 3->12 HA 4->12 DR 5->12 IS 3->4 SB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Nik Slana](https://www.buzzerbeater.com/player/55967729/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 6->14 HA 9->15 DR 9->14 ID 2->4 | feeders behind (HA+DR 18 vs track 27) |
| [Senad Srna](https://www.buzzerbeater.com/player/55967731/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 3->14 HA 10->15 DR 8->14 IS 2->3 ID 2->4 | feeders behind (HA+DR 18 vs track 27) |
| [Vanja Vogrinec](https://www.buzzerbeater.com/player/55967736/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 7->15 DR 9->14 | feeders behind (HA+DR 16 vs track 27) |
| [Matej Terseglav](https://www.buzzerbeater.com/player/55967742/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 4->12 HA 9->12 DR 9->12 ID 5->6 RB 3->4 SB 3->4 | feeders behind (HA+DR 18 vs track 22) |
| [Vasja Milosavljević](https://www.buzzerbeater.com/player/55967743/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 5->12 HA 3->12 DR 8->12 | feeders behind (HA+DR 11 vs track 22) |
| [Ratko Šimčič](https://www.buzzerbeater.com/player/55967747/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 5->12 HA 3->12 DR 4->12 IS 3->4 ID 5->6 | feeders behind (HA+DR 7 vs track 22) |
| [Vid Šobar](https://www.buzzerbeater.com/player/55967749/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 7->12 HA 10->12 DR 8->12 SB 2->4 | feeders behind (HA+DR 18 vs track 22) |
| [Šime Dernovšček](https://www.buzzerbeater.com/player/55967750/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 8->14 HA 3->15 DR 7->14 IS 2->3 ID 2->4 | feeders behind (HA+DR 10 vs track 27) |
| [Jože Modrijan](https://www.buzzerbeater.com/player/55967752/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 1->12 HA 3->12 DR 8->12 ID 5->6 RB 3->4 | feeders behind (HA+DR 11 vs track 22) |
| [Zlatko Matavž](https://www.buzzerbeater.com/player/55967755/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 6->12 HA 8->12 DR 8->12 SB 2->4 | feeders behind (HA+DR 16 vs track 22) |
| [Pepe Nežmahen](https://www.buzzerbeater.com/player/55967758/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 7->12 HA 7->12 DR 6->12 ID 4->6 | feeders behind (HA+DR 13 vs track 22) |
| [Janez Intihar](https://www.buzzerbeater.com/player/55967764/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 8->12 HA 9->12 DR 9->12 PA 1->4 ID 3->6 | feeders behind (HA+DR 18 vs track 22) |
| [Andrej Kranjc](https://www.buzzerbeater.com/player/55967765/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 9->12 HA 5->12 DR 4->12 RB 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Ožbej Travner](https://www.buzzerbeater.com/player/55967768/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 9->14 HA 7->15 DR 7->14 ID 2->4 | feeders behind (HA+DR 14 vs track 27) |
| [Gal Muhovnik](https://www.buzzerbeater.com/player/55967770/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 5->12 HA 1->12 DR 9->12 ID 5->6 | feeders behind (HA+DR 10 vs track 22) |
| [Erik Kjuder](https://www.buzzerbeater.com/player/55967775/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 9->12 HA 4->12 DR 5->12 | feeders behind (HA+DR 9 vs track 22) |
| [Martin Krklec](https://www.buzzerbeater.com/player/55967779/overview.aspx) | 19 | mkt72-inside-2 | WATCH | DR 2->3 IS 5->11 ID 8->14 RB 8->10 SB 4->9 | ID behind the big-man early-defense track |
| [Dušan Užmak](https://www.buzzerbeater.com/player/55967781/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 7->11 ID 10->14 RB 4->10 | ID behind the big-man early-defense track |
| [Jakob Pamić](https://www.buzzerbeater.com/player/55967793/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 7->14 HA 4->15 DR 8->14 PA 2->5 ID 3->4 | feeders behind (HA+DR 12 vs track 27) |
| [Niki Kramberger](https://www.buzzerbeater.com/player/55967798/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 4->12 HA 7->12 DR 6->12 | feeders behind (HA+DR 13 vs track 22) |
| [Krištof Dobrak](https://www.buzzerbeater.com/player/55967807/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 9->12 HA 10->12 DR 4->12 | feeders behind (HA+DR 14 vs track 22) |
| [Timo Setnikar](https://www.buzzerbeater.com/player/55967809/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 8->14 HA 1->15 DR 4->14 PA 3->5 | feeders behind (HA+DR 5 vs track 27) |
| [Dare Vižintin](https://www.buzzerbeater.com/player/55967811/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 6->12 HA 5->12 DR 9->12 PA 3->4 ID 5->6 RB 3->4 | feeders behind (HA+DR 14 vs track 22) |
| [Gojko Bošnjak](https://www.buzzerbeater.com/player/55967814/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 IS 9->11 ID 10->14 SB 8->9 | ID behind the big-man early-defense track |
| [Tugomir Bogataj](https://www.buzzerbeater.com/player/55967818/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 3->12 HA 7->12 DR 6->12 | feeders behind (HA+DR 13 vs track 22) |
| [Mico Pečečnik](https://www.buzzerbeater.com/player/55967821/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 6->12 HA 7->12 DR 10->12 PA 3->4 RB 2->4 | feeders behind (HA+DR 17 vs track 22) |
| [Rene Vukoje](https://www.buzzerbeater.com/player/55967831/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 4->15 DR 8->14 ID 2->4 | feeders behind (HA+DR 12 vs track 27) |
| [Teodor Mujaković](https://www.buzzerbeater.com/player/55967835/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 JR 3->4 OD 9->12 HA 9->12 DR 2->12 | feeders behind (HA+DR 11 vs track 22) |
| [Ignac Šošter](https://www.buzzerbeater.com/player/55967845/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 3->12 HA 5->12 DR 7->12 ID 2->6 SB 3->4 | feeders behind (HA+DR 12 vs track 22) |
| [Drejc Vidic](https://www.buzzerbeater.com/player/55967846/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 9->12 HA 5->12 DR 8->12 PA 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Gaj Pešič](https://www.buzzerbeater.com/player/55967853/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 9->14 HA 7->15 DR 8->14 PA 3->5 IS 1->3 SB 1->3 | feeders behind (HA+DR 15 vs track 27) |
| [Marcel Bizjak](https://www.buzzerbeater.com/player/55967856/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 8->14 HA 5->15 DR 9->14 IS 1->3 SB 1->3 | feeders behind (HA+DR 14 vs track 27) |
| [Juš Kostanjevec](https://www.buzzerbeater.com/player/55967858/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 3->14 HA 8->15 DR 7->14 | feeders behind (HA+DR 15 vs track 27) |
| [Anže Vrtačnik](https://www.buzzerbeater.com/player/55967860/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 8->12 HA 8->12 DR 5->12 RB 3->4 | feeders behind (HA+DR 13 vs track 22) |
| [Franko Lisac](https://www.buzzerbeater.com/player/55967862/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 2->12 HA 3->12 DR 5->12 PA 3->4 | feeders behind (HA+DR 8 vs track 22) |
| [Dejan Mršnik](https://www.buzzerbeater.com/player/55967864/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 JR 2->4 OD 5->12 HA 10->12 DR 5->12 | feeders behind (HA+DR 15 vs track 22) |
| [Drejc Novak](https://www.buzzerbeater.com/player/55967865/overview.aspx) | 19 | mkt72-inside-2 | WATCH | DR 2->3 IS 7->11 ID 7->14 RB 7->10 SB 7->9 | ID behind the big-man early-defense track |
| [Boštjan Vizjak](https://www.buzzerbeater.com/player/55967868/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 7->14 HA 8->15 DR 8->14 | feeders behind (HA+DR 16 vs track 27) |
| [Jožef Funtek](https://www.buzzerbeater.com/player/55967870/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 9->14 HA 4->15 DR 3->14 | feeders behind (HA+DR 7 vs track 27) |
| [Gal Podvinski](https://www.buzzerbeater.com/player/55967880/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 JR 3->4 OD 10->12 HA 8->12 DR 10->12 IS 3->4 | feeders behind (HA+DR 18 vs track 22) |
| [Oliver Kavka](https://www.buzzerbeater.com/player/55967890/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 JR 3->5 OD 7->14 HA 2->15 DR 4->14 IS 2->3 ID 3->4 | feeders behind (HA+DR 6 vs track 27) |
| [Dare Vasle](https://www.buzzerbeater.com/player/55967902/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 JR 4->5 OD 7->14 HA 9->15 DR 5->14 PA 4->5 | feeders behind (HA+DR 14 vs track 27) |
| [Avgust Anžlin](https://www.buzzerbeater.com/player/55967904/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 9->14 HA 7->15 DR 3->14 PA 4->5 ID 3->4 | feeders behind (HA+DR 10 vs track 27) |
| [Radomir Lavrinec](https://www.buzzerbeater.com/player/55967905/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->11 JR 3->4 OD 7->12 HA 4->12 DR 7->12 SB 3->4 | feeders behind (HA+DR 11 vs track 22) |
| [Simon Vrčko](https://www.buzzerbeater.com/player/55967907/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 8->12 HA 4->12 DR 7->12 | feeders behind (HA+DR 11 vs track 22) |
| [Milimir Dragšič](https://www.buzzerbeater.com/player/55967914/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 5->12 HA 3->12 DR 3->12 | feeders behind (HA+DR 6 vs track 22) |
| [Bojan Levičar](https://www.buzzerbeater.com/player/55967916/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 3->14 HA 1->15 DR 8->14 IS 2->3 | feeders behind (HA+DR 9 vs track 27) |
| [Bartol Tomič](https://www.buzzerbeater.com/player/55967917/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 8->14 HA 9->15 DR 8->14 IS 1->3 | feeders behind (HA+DR 17 vs track 27) |
| [Simon Benčik](https://www.buzzerbeater.com/player/55967920/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 JR 3->4 OD 7->12 HA 5->12 DR 9->12 IS 3->4 RB 3->4 | feeders behind (HA+DR 14 vs track 22) |
| [Jurij Žerjav](https://www.buzzerbeater.com/player/55967921/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 9->14 HA 6->15 DR 9->14 ID 3->4 | feeders behind (HA+DR 15 vs track 27) |
| [Rihard Veselinović](https://www.buzzerbeater.com/player/55967923/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 7->14 HA 6->15 DR 9->14 ID 3->4 | feeders behind (HA+DR 15 vs track 27) |
| [Jošt Gorenjšček](https://www.buzzerbeater.com/player/55967924/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 8->12 HA 8->12 DR 9->12 | feeders behind (HA+DR 17 vs track 22) |
| [Viljem Vinkšel](https://www.buzzerbeater.com/player/55967925/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 8->12 HA 9->12 DR 1->12 PA 3->4 IS 3->4 | feeders behind (HA+DR 10 vs track 22) |
| [Rene Hac](https://www.buzzerbeater.com/player/55967927/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 3->12 HA 9->12 DR 4->12 | feeders behind (HA+DR 13 vs track 22) |
| [Vojan Rodman](https://www.buzzerbeater.com/player/55967928/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 5->14 HA 2->15 DR 9->14 IS 1->3 ID 1->4 SB 2->3 | feeders behind (HA+DR 11 vs track 27) |
| [Luka Kordež](https://www.buzzerbeater.com/player/55967929/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 7->12 HA 1->12 DR 2->12 PA 3->4 ID 5->6 | feeders behind (HA+DR 3 vs track 22) |
| [Darjan Čopič](https://www.buzzerbeater.com/player/55967931/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 10->12 HA 9->12 DR 10->12 SB 2->4 | feeders behind (HA+DR 19 vs track 22) |
| [Igor Babnik](https://www.buzzerbeater.com/player/55967938/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 OD 9->14 HA 9->15 DR 10->14 ID 1->4 | feeders behind (HA+DR 19 vs track 27) |
| [Tim Bračko](https://www.buzzerbeater.com/player/55967944/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 3->12 HA 9->12 DR 6->12 PA 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Admir Holzner](https://www.buzzerbeater.com/player/55967951/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 7->12 HA 4->12 DR 4->12 ID 3->6 | feeders behind (HA+DR 8 vs track 22) |
| [Leopold Kupljen](https://www.buzzerbeater.com/player/55967952/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 IS 8->11 ID 5->14 RB 6->10 | ID behind the big-man early-defense track |
| [Marjan Blatne](https://www.buzzerbeater.com/player/55967953/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 7->12 HA 7->12 DR 5->12 ID 4->6 | feeders behind (HA+DR 12 vs track 22) |
| [Gaber Skočir](https://www.buzzerbeater.com/player/55967954/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 1->4 PA 1->2 IS 9->11 ID 7->14 RB 6->10 SB 7->9 | ID behind the big-man early-defense track |
| [Anže Korenc](https://www.buzzerbeater.com/player/55967957/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 7->12 HA 8->12 DR 7->12 PA 3->4 ID 5->6 SB 3->4 | feeders behind (HA+DR 15 vs track 22) |
| [Alen Bručan](https://www.buzzerbeater.com/player/55967960/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 JR 2->5 OD 7->14 HA 5->15 DR 8->14 RB 1->2 | feeders behind (HA+DR 13 vs track 27) |
| [Suad Udovič](https://www.buzzerbeater.com/player/55967961/overview.aspx) | 19 | mkt72-inside-2 | WATCH | HA 1->3 IS 8->11 ID 8->14 RB 4->10 | ID behind the big-man early-defense track |
| [Blaž Dončec](https://www.buzzerbeater.com/player/55967963/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 8->14 HA 9->15 DR 5->14 RB 1->2 | feeders behind (HA+DR 14 vs track 27) |
| [Ožbej Perc](https://www.buzzerbeater.com/player/55967964/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 OD 2->4 HA 2->3 IS 4->11 ID 10->14 RB 8->10 SB 3->9 | ID behind the big-man early-defense track |
| [Sergej Kek](https://www.buzzerbeater.com/player/55967966/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->11 OD 4->12 HA 4->12 DR 5->12 | feeders behind (HA+DR 9 vs track 22) |
| [Lojz Žarn](https://www.buzzerbeater.com/player/55967974/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 2->12 HA 2->12 DR 7->12 ID 5->6 SB 2->4 | feeders behind (HA+DR 9 vs track 22) |
| [Armin Fajdiga](https://www.buzzerbeater.com/player/55969578/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 8->14 HA 9->15 DR 9->14 | feeders behind (HA+DR 18 vs track 27) |
| [Vili Bračun](https://www.buzzerbeater.com/player/55969579/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 3->12 HA 7->12 DR 6->12 ID 5->6 | feeders behind (HA+DR 13 vs track 22) |
| [Matjaž Debevec](https://www.buzzerbeater.com/player/55969588/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 JR 3->4 OD 3->12 HA 4->12 DR 3->12 ID 3->6 | feeders behind (HA+DR 7 vs track 22) |
| [Bogo Žager](https://www.buzzerbeater.com/player/55969597/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 HA 1->3 DR 1->3 IS 6->11 ID 6->14 RB 7->10 | ID behind the big-man early-defense track |
| [Maks Kreft](https://www.buzzerbeater.com/player/55969606/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 7->14 HA 7->15 DR 10->14 | feeders behind (HA+DR 17 vs track 27) |
| [Vid Gagulić](https://www.buzzerbeater.com/player/55989113/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 OD 9->14 HA 9->15 DR 5->14 | feeders behind (HA+DR 14 vs track 27) |
| [Lan Srne](https://www.buzzerbeater.com/player/55989318/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 7->12 HA 8->12 DR 8->12 RB 2->4 | feeders behind (HA+DR 16 vs track 22) |
| [Leonard Dernač](https://www.buzzerbeater.com/player/55989952/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 9->14 HA 9->15 DR 6->14 IS 1->3 ID 3->4 | feeders behind (HA+DR 15 vs track 27) |
| [Stribor Kunstelj](https://www.buzzerbeater.com/player/55990691/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->11 OD 10->12 HA 8->12 DR 3->12 | feeders behind (HA+DR 11 vs track 22) |
| [Mico Lavrih](https://www.buzzerbeater.com/player/55990756/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->11 OD 8->14 HA 9->15 DR 6->14 | feeders behind (HA+DR 15 vs track 27) |
| [Nikolaj Jakše](https://www.buzzerbeater.com/player/55990812/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->11 OD 8->14 HA 7->15 DR 9->14 ID 1->4 | feeders behind (HA+DR 16 vs track 27) |
| [Dejan Gril](https://www.buzzerbeater.com/player/55990897/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->11 OD 6->12 HA 7->12 DR 7->12 | feeders behind (HA+DR 14 vs track 22) |
| [Marinko Begić](https://www.buzzerbeater.com/player/55991058/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 8->12 HA 7->12 DR 9->12 IS 2->4 ID 5->6 | feeders behind (HA+DR 16 vs track 22) |
| [Gregor Meško](https://www.buzzerbeater.com/player/55991165/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 7->12 HA 3->12 DR 6->12 IS 3->4 | feeders behind (HA+DR 9 vs track 22) |
| [Vladislav Korenc](https://www.buzzerbeater.com/player/55991584/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 7->12 HA 9->12 DR 4->12 | feeders behind (HA+DR 13 vs track 22) |
| [Robert Kisilak](https://www.buzzerbeater.com/player/55992025/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->11 OD 10->12 HA 5->12 DR 5->12 | feeders behind (HA+DR 10 vs track 22) |
| [Pavle Kordel](https://www.buzzerbeater.com/player/55992302/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->11 OD 1->12 HA 9->12 DR 9->12 | feeders behind (HA+DR 18 vs track 22) |
| [Patrik Tomec](https://www.buzzerbeater.com/player/55992514/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->11 OD 5->14 HA 4->15 DR 4->14 ID 3->4 SB 2->3 | feeders behind (HA+DR 8 vs track 27) |
| [Janez Černač](https://www.buzzerbeater.com/player/55993467/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 8->14 HA 7->15 DR 8->14 ID 2->4 | feeders behind (HA+DR 15 vs track 27) |
| [Vlado Pliberšek](https://www.buzzerbeater.com/player/55993875/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 OD 1->4 HA 2->3 IS 6->11 ID 5->14 RB 8->10 SB 7->9 | ID behind the big-man early-defense track |
| [Damjan Brezovec](https://www.buzzerbeater.com/player/55994025/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->11 OD 4->12 HA 4->12 DR 2->12 ID 4->6 RB 3->4 | feeders behind (HA+DR 6 vs track 22) |
| [Amir Mileta](https://www.buzzerbeater.com/player/55994335/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->11 OD 8->14 HA 4->15 DR 4->14 ID 3->4 | feeders behind (HA+DR 8 vs track 27) |
| [Igor Dolenjšek](https://www.buzzerbeater.com/player/55994653/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->11 OD 8->14 HA 4->15 DR 3->14 SB 2->3 | feeders behind (HA+DR 7 vs track 27) |
| [Alan Glad](https://www.buzzerbeater.com/player/55995650/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->11 OD 8->12 HA 9->12 DR 7->12 SB 3->4 | feeders behind (HA+DR 16 vs track 22) |
| [Aljaž Madić](https://www.buzzerbeater.com/player/56009270/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->11 JR 4->5 OD 7->14 HA 6->15 DR 4->14 ID 3->4 SB 2->3 | feeders behind (HA+DR 10 vs track 27) |
| [Tejo Lesjak](https://www.buzzerbeater.com/player/56023177/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->11 OD 5->14 HA 3->15 DR 6->14 PA 1->5 IS 1->3 ID 2->4 SB 1->3 | feeders behind (HA+DR 9 vs track 27) |
| [Marin Vočanec](https://www.buzzerbeater.com/player/56023189/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->11 OD 6->14 HA 5->15 DR 4->14 PA 2->5 ID 2->4 SB 2->3 | feeders behind (HA+DR 9 vs track 27) |
| [Joško Hrastnik](https://www.buzzerbeater.com/player/56025548/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 5->14 HA 7->15 DR 3->14 PA 2->5 RB 1->2 | feeders behind (HA+DR 10 vs track 27) |
| [Tine Pellis](https://www.buzzerbeater.com/player/56031968/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 HA 1->3 PA 1->2 IS 7->11 ID 6->14 RB 6->10 SB 4->9 | ID behind the big-man early-defense track |
| [Mirko Sulejmanović](https://www.buzzerbeater.com/player/56033828/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->11 OD 1->12 HA 4->12 DR 1->12 PA 2->4 | feeders behind (HA+DR 5 vs track 22) |
| [Leopold Klinger](https://www.buzzerbeater.com/player/56035046/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->11 OD 7->14 HA 5->15 DR 6->14 PA 4->5 IS 2->3 ID 3->4 | feeders behind (HA+DR 11 vs track 27) |
| [Mihael Purkart](https://www.buzzerbeater.com/player/56035048/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->11 JR 4->5 OD 6->14 HA 5->15 DR 6->14 ID 2->4 SB 1->3 | feeders behind (HA+DR 11 vs track 27) |
| [Nejc Baltič](https://www.buzzerbeater.com/player/55135459/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 13->18 HA 14->19 DR 15->19 ID 3->4 | non-defense skills >3 behind the age-20 track |
| [Demis Tahiri](https://www.buzzerbeater.com/player/55135479/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 16->18 OD 12->14 HA 13->19 DR 16->19 | defense season: below track but training OD now; non-defense skills >3 behind the age-20 track |
| [Urh Kapelj](https://www.buzzerbeater.com/player/55135670/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 12->18 OD 11->14 HA 13->19 DR 15->19 | defense season: below track but training OD now; non-defense skills >3 behind the age-20 track |
| [Gorazd Grandovec](https://www.buzzerbeater.com/player/55135833/overview.aspx) | 20 | mkt72-inside-2 | WATCH | JS 5->6 DR 1->3 IS 9->16 ID 14->16 RB 6->10 | non-defense skills >3 behind the age-20 track |
| [Franc Dekleva](https://www.buzzerbeater.com/player/55157684/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 9->13 HA 12->16 DR 13->17 | non-defense skills >3 behind the age-20 track |
| [Zoki Pohorec](https://www.buzzerbeater.com/player/55439767/overview.aspx) | 20 | mkt72-outside-1 | WATCH | JS 7->15 HA 10->18 DR 11->18 | non-defense skills >3 behind the age-20 track |
| [Tine Majer](https://www.buzzerbeater.com/player/55439787/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 5->13 JR 3->4 HA 7->16 DR 10->17 IS 3->6 | non-defense skills >3 behind the age-20 track |
| [Sašo Koprivnjak](https://www.buzzerbeater.com/player/55439789/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 1->13 HA 12->16 DR 11->17 IS 4->6 | non-defense skills >3 behind the age-20 track |
| [Sandi Vončina](https://www.buzzerbeater.com/player/54827339/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 17->18 HA 16->19 DR 17->19 | – |
| [Jure Tuma](https://www.buzzerbeater.com/player/54827408/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 12->18 | – |
| [Urban Lauš](https://www.buzzerbeater.com/player/54827430/overview.aspx) | 21 | mkt72-outside-2 | WATCH | HA 16->19 DR 17->19 | – |
| [Bogomir Strojan](https://www.buzzerbeater.com/player/54827452/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 17->18 HA 15->19 DR 16->19 SB 2->3 | – |
| [France Valh](https://www.buzzerbeater.com/player/54827479/overview.aspx) | 21 | mkt72-outside-1 | WATCH | JS 8->15 HA 13->18 DR 10->18 | – |
| [Braco Tomazin](https://www.buzzerbeater.com/player/54827509/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 13->18 HA 14->19 DR 14->19 | – |
| [Aleš Neumann](https://www.buzzerbeater.com/player/54827572/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 7->18 HA 17->19 DR 16->19 | – |
| [Alojz Slak](https://www.buzzerbeater.com/player/54827597/overview.aspx) | 21 | mkt72-outside-2 | WATCH | HA 16->19 DR 18->19 | – |
| [Dare Štrukelj](https://www.buzzerbeater.com/player/54827601/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 13->18 HA 17->19 DR 18->19 | – |
| [Robi Silovšek](https://www.buzzerbeater.com/player/54827708/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 12->18 HA 18->19 DR 17->19 | – |
| [Teo Dimec](https://www.buzzerbeater.com/player/54827880/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 14->18 | – |
| [France Štamulak](https://www.buzzerbeater.com/player/54827927/overview.aspx) | 21 | mkt72-inside-2 | WATCH | HA 2->3 SB 6->10 | – |
| [Tomaž Voranc](https://www.buzzerbeater.com/player/54851161/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 13->18 HA 17->19 DR 18->19 | – |
| [Bor Majetič](https://www.buzzerbeater.com/player/55135435/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 14->18 | – |
| [Aleš Terkaj](https://www.buzzerbeater.com/player/55135707/overview.aspx) | 21 | mkt72-inside-2 | WATCH | IS 15->16 SB 7->10 | – |
| [Matija Majerhofer](https://www.buzzerbeater.com/player/55688918/overview.aspx) | 18 | mkt72-inside-2 | ON-TRACK | ID 9->11 | – |
| [Vojan Humek](https://www.buzzerbeater.com/player/55688971/overview.aspx) | 18 | mkt72-wing-1 | ON-TRACK | – | defense lag OK at this age — feeders on track |
| [Bogo Žinko](https://www.buzzerbeater.com/player/55689052/overview.aspx) | 18 | mkt72-wing-1 | ON-TRACK | JS 5->7 OD 6->7 IS 1->3 | defense lag OK at this age — feeders on track |
| [Tomaž Kerčan](https://www.buzzerbeater.com/player/55689082/overview.aspx) | 18 | mkt72-wing-1 | ON-TRACK | OD 3->7 | defense lag OK at this age — feeders on track |
| [Jožef Gams](https://www.buzzerbeater.com/player/55689130/overview.aspx) | 18 | mkt72-wing-1 | ON-TRACK | OD 5->7 ID 2->4 | defense lag OK at this age — feeders on track |
| [Brane Vinkšelj](https://www.buzzerbeater.com/player/55689184/overview.aspx) | 18 | mkt72-inside-1 | ON-TRACK | HA 1->2 ID 10->11 | – |
| [Sašo Kranjec](https://www.buzzerbeater.com/player/55689371/overview.aspx) | 18 | mkt72-inside-2 | ON-TRACK | ID 10->11 | – |
| [Nik Neuhold](https://www.buzzerbeater.com/player/55689458/overview.aspx) | 18 | mkt72-inside-2 | ON-TRACK | ID 10->11 | – |
| [Uroš Potočin](https://www.buzzerbeater.com/player/55689465/overview.aspx) | 18 | mkt72-wing-1 | ON-TRACK | OD 5->7 | defense lag OK at this age — feeders on track |
| [Nace Žeželj](https://www.buzzerbeater.com/player/55439722/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | OD 6->12 HA 11->12 | defense lag OK at this age — feeders on track |
| [Emil Dolenjšak](https://www.buzzerbeater.com/player/55439744/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 12->13 OD 4->14 SB 2->3 | defense lag OK at this age — feeders on track |
| [Metod Glebov](https://www.buzzerbeater.com/player/55439765/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | OD 7->14 | defense lag OK at this age — feeders on track |
| [Kristjan Lovrek](https://www.buzzerbeater.com/player/55439866/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 12->13 OD 8->14 | defense lag OK at this age — feeders on track |
| [Bor Grilanc](https://www.buzzerbeater.com/player/55439918/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 12->13 OD 8->14 HA 13->14 | defense lag OK at this age — feeders on track |
| [Darjan Aljančič](https://www.buzzerbeater.com/player/55439925/overview.aspx) | 19 | mkt72-inside-1 | ON-TRACK | ID 13->15 | – |
| [Žiga Podbevšek](https://www.buzzerbeater.com/player/55439934/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 8->13 OD 6->14 DR 12->14 ID 3->4 | defense lag OK at this age — feeders on track |
| [Borut Simoniti](https://www.buzzerbeater.com/player/55439994/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 11->13 JR 5->6 OD 7->14 HA 12->14 | defense lag OK at this age — feeders on track |
| [Mihael Deželak](https://www.buzzerbeater.com/player/55440044/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | OD 3->12 ID 4->6 | defense lag OK at this age — feeders on track |
| [Peter Papež](https://www.buzzerbeater.com/player/55440053/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 11->13 OD 7->14 | defense lag OK at this age — feeders on track |
| [Vlado Veršček](https://www.buzzerbeater.com/player/55440110/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 10->11 OD 7->12 SB 2->4 | defense lag OK at this age — feeders on track |
| [Mirko Brlek](https://www.buzzerbeater.com/player/55440146/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 9->11 OD 6->12 | defense lag OK at this age — feeders on track |
| [Hasim Vidovič](https://www.buzzerbeater.com/player/55440194/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 11->13 OD 6->14 | defense lag OK at this age — feeders on track |
| [Pavel Kranjec](https://www.buzzerbeater.com/player/55440219/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 12->13 OD 2->14 ID 3->4 | defense lag OK at this age — feeders on track |
| [Janez Rakuš](https://www.buzzerbeater.com/player/55440274/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 10->11 OD 6->12 | defense lag OK at this age — feeders on track |
| [Miro Kumer](https://www.buzzerbeater.com/player/55440317/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 11->13 OD 7->14 HA 13->14 ID 2->4 | defense lag OK at this age — feeders on track |
| [Matevž Perme](https://www.buzzerbeater.com/player/55462658/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 10->11 OD 4->12 | defense lag OK at this age — feeders on track |
| [Damir Tosič](https://www.buzzerbeater.com/player/55464608/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 7->11 OD 10->12 ID 4->6 | defense lag OK at this age — feeders on track |
| [Mark Košmrl](https://www.buzzerbeater.com/player/55688921/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | JS 1->5 IS 8->11 ID 13->14 | – |
| [Tezej Tomaš](https://www.buzzerbeater.com/player/55688943/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | JS 4->5 OD 3->4 ID 12->14 SB 5->9 | – |
| [Dore Presterel](https://www.buzzerbeater.com/player/55688946/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 10->11 OD 6->12 DR 11->12 | defense lag OK at this age — feeders on track |
| [Arjan Avguštinčič](https://www.buzzerbeater.com/player/55688995/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 9->11 OD 9->12 HA 10->12 ID 4->6 | defense lag OK at this age — feeders on track |
| [Darko Kokelj](https://www.buzzerbeater.com/player/55689026/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 9->13 JR 5->6 OD 9->14 HA 13->14 | defense lag OK at this age — feeders on track |
| [Patrik Murko](https://www.buzzerbeater.com/player/55689054/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | OD 2->4 HA 1->3 IS 10->11 ID 12->14 RB 8->10 SB 4->9 | – |
| [Zlatan Žižmund](https://www.buzzerbeater.com/player/55689057/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 6->11 OD 5->12 PA 3->4 | defense lag OK at this age — feeders on track |
| [Dore Lovreković](https://www.buzzerbeater.com/player/55689060/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | ID 13->14 SB 8->9 | – |
| [Voranc Sernelj](https://www.buzzerbeater.com/player/55689063/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | OD 9->12 RB 3->4 | defense lag OK at this age — feeders on track |
| [Vasja Podkapnik](https://www.buzzerbeater.com/player/55689171/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | JS 2->5 IS 7->11 | – |
| [Ferdinand Dobovšek](https://www.buzzerbeater.com/player/55689332/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 6->11 OD 8->12 HA 9->12 ID 3->6 | defense lag OK at this age — feeders on track |
| [Uroš Buš](https://www.buzzerbeater.com/player/55712853/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 7->11 OD 5->12 HA 11->12 DR 11->12 ID 3->6 | defense lag OK at this age — feeders on track |
| [Rade Mayr](https://www.buzzerbeater.com/player/55713545/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | OD 8->12 HA 11->12 DR 11->12 | defense lag OK at this age — feeders on track |
| [Amir Vrhovski](https://www.buzzerbeater.com/player/55713605/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 9->13 OD 8->14 HA 13->14 DR 13->14 PA 3->5 ID 3->4 SB 1->3 | defense lag OK at this age — feeders on track |
| [Toni Avbelj](https://www.buzzerbeater.com/player/55714046/overview.aspx) | 19 | mkt72-outside-2 | ON-TRACK | JS 9->13 OD 9->14 HA 13->14 PA 2->5 | defense lag OK at this age — feeders on track |
| [Matevž Kocjančič](https://www.buzzerbeater.com/player/55714201/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 5->11 OD 10->12 DR 11->12 ID 3->6 | defense lag OK at this age — feeders on track |
| [Samir Lipušček](https://www.buzzerbeater.com/player/55135461/overview.aspx) | 20 | mkt72-inside-2 | ON-TRACK | SB 9->10 | – |
| [Čarli Jurković](https://www.buzzerbeater.com/player/55135557/overview.aspx) | 20 | mkt72-inside-2 | ON-TRACK | IS 14->16 ID 15->16 RB 7->10 SB 7->10 | – |
| [Dare Ogrinec](https://www.buzzerbeater.com/player/55135621/overview.aspx) | 20 | mkt72-inside-2 | ON-TRACK | IS 15->16 SB 9->10 | – |
