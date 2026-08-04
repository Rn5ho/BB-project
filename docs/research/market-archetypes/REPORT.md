# Market Archetypes — Season 72 (age-21 flood)

Generated: 2026-08-04T17:41:19.123Z · window start 2026-07-10 · seed 72
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
- 5 of 5 builds are playable by a Slovenian-club draftee entering age 21 (M1) under neutral staff
- 5 of 5 builds are finalized by the playoff deadline (M2, wk 7) under neutral staff
- 5 of 5 builds are playable under the requested custom (coach 6/YT 6/gym 1/TC 1) staff
- under stress (worst-start draftee, 38min/wk), 0 of 5 builds remain playable entering 21 under neutral staff

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

Silhouette by k: {"2":0.13247741437590752,"3":0.11496372514485731,"4":0.08177631840672976,"5":0.07491609421198792} · ward-vs-kmeans agreement 0.68 · bootstrap Jaccard 0.64, 0.66

### Market: outside #1 (mkt72-outside-1)

237 members · 5 elite · floor OD>=15 passed by 13/237 · near-cap 8 · 170 distinct sellers · self-match 60% (BELOW 70% gate after full relaxation; relaxed: dr,js,ha)

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 7 | 7 | 7 | 7 | 8 | 6 | 4 | 3 | 4 | 3 |
| median | 9 | 8 | 9 | 10 | 10 | 8 | 6 | 5 | 6 | 5 |
| p75 | 12 | 10 | 10 | 11 | 12 | 9 | 9 | 7 | 8 | 7 |
| elite median | 15 | 10 | 15 | 13 | 15 | 9 | 11 | 9 | 6 | 7 |

Typical: height 190cm · TSP 77 · potential {"7":69,"8":58,"9":63,"10":47} · ST p50 5 · FT p50 8

Examples: [Olegas Sergadejevas](https://www.buzzerbeater.com/player/55061198/overview.aspx) (JS17 JR13 OD17 HA14 DR13 PA9 IS15 ID9 RB9 SB11) · [Nikos Karaindros](https://www.buzzerbeater.com/player/54699033/overview.aspx) (JS15 JR10 OD15 HA13 DR16 PA8 IS12 ID10 RB6 SB7) · [Vadim Silyanov](https://www.buzzerbeater.com/player/55042556/overview.aspx) (JS14 JR12 OD14 HA13 DR14 PA8 IS12 ID11 RB5 SB5)

### Market: outside #2 (mkt72-outside-2)

259 members · 61 elite · floor OD>=15 passed by 70/259 · near-cap 41 · 181 distinct sellers · self-match 70% (relaxed: dr)

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 11 | 7 | 8 | 13 | 13 | 6 | 5 | 5 | 4 | 3 |
| median | 13 | 8 | 10 | 15 | 15 | 8 | 8 | 7 | 5 | 5 |
| p75 | 15 | 10 | 15 | 16 | 17 | 9 | 11 | 9 | 7 | 7 |
| elite median | 16 | 10 | 16 | 16 | 17 | 8 | 9 | 8 | 5 | 5 |

Typical: height 190cm · TSP 95 · potential {"7":60,"8":59,"9":88,"10":51,"11":1} · ST p50 5 · FT p50 8

Examples: [Roberto Bellentani](https://www.buzzerbeater.com/player/54664566/overview.aspx) (JS20 JR12 OD18 HA19 DR19 PA9 IS5 ID9 RB8 SB8) · [Duilio Citti](https://www.buzzerbeater.com/player/54664855/overview.aspx) (JS20 JR11 OD17 HA19 DR19 PA7 IS9 ID10 RB5 SB8) · [Antonio Zaniolo](https://www.buzzerbeater.com/player/54666500/overview.aspx) (JS17 JR10 OD18 HA18 DR19 PA10 IS12 ID8 RB7 SB6)

## inside group — k=2

Silhouette by k: {"2":0.30488241934714905,"3":0.19922475948048723,"4":0.15988772558638023} · ward-vs-kmeans agreement 0.70 · bootstrap Jaccard 0.68, 0.88

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

Silhouette by k: {"2":0.1446373588992961,"3":0.09459507914034798,"4":0.08778956416111466,"5":0.08882373690600796} · ward-vs-kmeans agreement 1.00 · bootstrap Jaccard 1.00

### Market: wing #1 (mkt72-wing-1)

245 members · 6 elite · floor OD>=14 passed by 9/245 · near-cap 4 · 173 distinct sellers · self-match 83%

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 7 | 5 | 5 | 7 | 7 | 5 | 6 | 5 | 6 | 5 |
| median | 9 | 7 | 7 | 9 | 10 | 7 | 8 | 7 | 7 | 6 |
| p75 | 11 | 8 | 9 | 12 | 12 | 8 | 10 | 9 | 9 | 8 |
| elite median | 14 | 9 | 15 | 16 | 17 | 8 | 10 | 9 | 7 | 8 |

Typical: height 203cm · TSP 76 · potential {"7":82,"8":50,"9":66,"10":46,"11":1} · ST p50 5 · FT p50 8

Examples: [Jouni Skytta](https://www.buzzerbeater.com/player/54832628/overview.aspx) (JS18 JR10 OD15 HA19 DR20 PA8 IS7 ID9 RB6 SB6) · [José Badillo](https://www.buzzerbeater.com/player/54952067/overview.aspx) (JS14 JR11 OD13 HA15 DR15 PA9 IS9 ID12 RB10 SB7) · [Maurício Constante](https://www.buzzerbeater.com/player/55038789/overview.aspx) (JS12 JR9 OD15 HA15 DR15 PA9 IS12 ID11 RB7 SB10)

## Specificity (match rates across clusters)

Note: self-match % elsewhere in this report is measured over each build's threshold
population (its floor-passing elite); this table's diagonal is measured over the full
cluster — the two intentionally differ.

| archetype \ cluster | mkt72-outside-1 | mkt72-outside-2 | mkt72-inside-1 | mkt72-inside-2 | mkt72-wing-1 |
| --- | --- | --- | --- | --- | --- |
| mkt72-outside-1 | 2% | 27% | 0% | 0% | 1% |
| mkt72-outside-2 | 0% | 17% | 0% | 0% | 1% |
| mkt72-inside-1 | 0% | 0% | 52% | 2% | 0% |
| mkt72-inside-2 | 0% | 0% | 0% | 9% | 0% |
| mkt72-wing-1 | 0% | 22% | 0% | 0% | 2% |


## External benchmark: Greece U-21 (Euro bronze, S72)

Benchmark, not ceiling: Greek outside starters sit ~p60–p75 of the elite market pool;
thresholds derive from the market cohort. This section validates shapes and floors.

| player | pos | wk | skills | TSP10 | nearest build | dist |
| --- | --- | --- | --- | --- | --- | --- |
| Aristidis Vlastarakis | SF | 14 | JS17 JR11 OD17 HA16 DR17 PA10 IS13 ID9 RB9 SB2 | 121 | mkt72-outside-2 | 7.2 |
| Stilianos Theodoratos | PF | 14 | JS13 JR6 OD7 HA16 DR17 PA8 IS18 ID16 RB8 SB8 | 117 | mkt72-wing-1 | 11.7 |
| Akis Kotsalos | SF | 14 | JS16 JR11 OD17 HA16 DR17 PA7 IS13 ID9 RB6 SB4 | 116 | mkt72-outside-2 | 6.6 |
| Tasoulis Gittas | PG | 14 | JS14 JR9 OD14 HA18 DR19 PA8 IS16 ID9 RB5 SB4 | 116 | mkt72-outside-2 | 8.0 |
| Alexios Thanos | PG | 14 | JS17 JR11 OD14 HA15 DR16 PA10 IS12 ID6 RB7 SB7 | 115 | mkt72-outside-2 | 4.3 |
| Vlasis Tzougkarakis | SG | 14 | JS17 JR12 OD15 HA15 DR17 PA10 IS11 ID9 RB4 SB5 | 115 | mkt72-outside-2 | 5.2 |
| Nikos Karaindros | SF | 14 | JS15 JR10 OD15 HA13 DR16 PA8 IS12 ID10 RB6 SB7 | 112 | mkt72-outside-2 | 5.0 |
| Lefteris Sfikopoulos | SG | 14 | JS16 JR12 OD16 HA13 DR16 PA8 IS8 ID6 RB7 SB9 | 111 | mkt72-outside-2 | 6.5 |
| Nikos Loukoumis | SF | 14 | JS15 JR9 OD17 HA16 DR16 PA8 IS11 ID9 RB5 SB5 | 111 | mkt72-outside-2 | 5.5 |
| Vardis Alvanos | C | 14 | JS9 JR6 OD7 HA10 DR9 PA6 IS19 ID17 RB14 SB14 | 111 | mkt72-inside-2 | 6.3 |
| Themistoklis Chalkitis | PF | 14 | JS11 JR8 OD8 HA11 DR11 PA7 IS8 ID16 RB11 SB18 | 109 | mkt72-inside-2 | 9.4 |
| Stefanis Kotoulas | PF | 14 | JS15 JR5 OD7 HA16 DR17 PA5 IS17 ID13 RB5 SB6 | 106 | mkt72-outside-2 | 12.2 |
| Antonios Sterpis | C | 14 | JS10 JR4 OD4 HA8 DR9 PA9 IS18 ID16 RB13 SB13 | 104 | mkt72-inside-2 | 7.0 |
| Kostas Tampakis | C | 14 | JS9 JR8 OD4 HA8 DR9 PA8 IS18 ID16 RB12 SB10 | 102 | mkt72-inside-2 | 6.2 |
| Renos Grafopoulos | PG | 14 | JS14 JR8 OD16 HA16 DR17 PA7 IS3 ID5 RB7 SB5 | 98 | mkt72-outside-2 | 8.0 |
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

Owner U-21 calendar, two milestones: M1 = entering age-21 season week 1, the build must
be PLAYABLE (squad selection). M2 = entering age-21 season week 7 (group stage
ends, playoffs begin), the build must be FINALIZED — full targets met. After M2, only
polish. Feasibility shown under: neutral (coach 5/YT 5/gym 0/TC 0) · elite (coach 7/YT 7/gym 2/TC 2) · custom (coach 6/YT 6/gym 1/TC 1).
Ceiling vs floor: REACHABLE/NOT above is the CEILING — full minutes and midpoint
starting sublevels (a displayed skill of d assumed to sit at internal d−0.5). The
"stress floor" line adds the FLOOR — the same plan, forward-simulated from the worst
hidden sublevels (d−0.99; BB rounds displayed skills UP) under degraded minutes
(38/wk) for the worst (p25) draftee. A real player's outcome lives
somewhere between the two.
Week 14 is a normal training week but has fewer games (no 3-game week), so minutes are
scarcer: narrow 1-2-position trainings may miss full effective minutes that week, and clubs
commonly schedule multi-position trainings (e.g. Jump Shot, Rebounding) instead. Our
projections assume full minutes throughout — when executing a plan, prefer a broad training
for week 14 and treat week-14 gains from narrow trainings as optimistic (owner-corrected
mechanics, 2026-08-04).
Finishing deltas describe the age-21 season under the plan's final block extended to
season end; large deltas on a secondary skill mean the searcher finished its targets
early and the extension repeats its last block — treat those weeks as owner-discretionary
(e.g. swap for defense polish), not a recommendation.
Draftee profiles: outside from the top-25%-starting-TSP slice (15) of 59 pot>=7 Slovenian 18yos; inside from the top-25%-starting-TSP slice (8) of 19 pot>=8 Slovenian 18yos; wing from the top-25%-starting-TSP slice (13) of 50 pot>=7 Slovenian 18yos.

### Path to Market: outside #1

**neutral**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.86/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 100) · finalized-by-playoffs floor: NOT reachable

Plan: Outside Defense (PG)×10 → One on One (PG/SG)×32 → Outside Defense (PG)×4 → Passing (PG)×10

Finishing deltas during age-21 season: OD+2 PA+8

**elite**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.86/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 102) · finalized-by-playoffs floor: NOT reachable

Plan: Outside Defense (PG)×9 → One on One (PG/SG)×33 → Outside Defense (PG)×3 → Passing (PG)×11

Finishing deltas during age-21 season: OD+2 PA+7 ID+1

**custom (coach 6/YT 6/gym 1/TC 1)**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.84/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 101) · finalized-by-playoffs floor: NOT reachable

Plan: Outside Defense (PG)×9 → One on One (PG/SG)×33 → Outside Defense (PG)×4 → Passing (PG)×10

Finishing deltas during age-21 season: OD+2 PA+7

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 9 | 4 | 11 | 12 | 11 | 5 | 5 | 3 | 4 | 3 |
| 20 | 16 | 5 | 12 | 18 | 18 | 6 | 6 | 4 | 5 | 4 |
| 21 | 20 | 5 | 12 | 20 | 20 | 6 | 6 | 4 | 5 | 4 |

### Path to Market: outside #2

**neutral**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.86/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 100) · finalized-by-playoffs floor: NOT reachable

Plan: One on One (PG/SG)×2 → Outside Defense (PG)×9 → One on One (PG/SG)×6 → Ball Handling (PG)×1 → One on One (PG/SG)×24 → Outside Defense (PG)×4 → Passing (PG)×10

Finishing deltas during age-21 season: OD+2 PA+8

**elite**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.89/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 105) · finalized-by-playoffs floor: NOT reachable

Plan: One on One (PG/SG)×2 → Outside Defense (PG)×8 → One on One (PG/SG)×25 → Passing (PG)×7 → Ball Handling (PG/SG)×1 → Outside Defense (PG)×4 → Passing (PG)×9

Finishing deltas during age-21 season: OD+2 PA+3

**custom (coach 6/YT 6/gym 1/TC 1)**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.86/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 101) · finalized-by-playoffs floor: NOT reachable

Plan: Outside Defense (PG)×9 → One on One (PG/SG)×5 → Jump Shot (PG/SG)×1 → One on One (PG/SG)×27 → Outside Defense (PG)×4 → Passing (PG)×10

Finishing deltas during age-21 season: OD+2 PA+7

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 9 | 4 | 11 | 12 | 11 | 5 | 5 | 3 | 4 | 3 |
| 20 | 16 | 5 | 12 | 19 | 19 | 6 | 6 | 4 | 5 | 4 |
| 21 | 20 | 5 | 12 | 20 | 20 | 6 | 6 | 4 | 5 | 4 |

### Path to Market: inside #1

**neutral**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.86/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 78) · finalized-by-playoffs floor: NOT reachable

Plan: Shot Blocking (C)×2 → Inside Defense (C)×2 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×4 → Rebounding (PF/C)×3 → Shot Blocking (C)×7 → One on One (SF/PF)×14 → Rebounding (PF/C)×1 → Shot Blocking (C)×13

Finishing deltas during age-21 season: ID+2 RB+2 SB+3

**elite**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 1.14/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 84) · finalized-by-playoffs floor: NOT reachable

Plan: Shot Blocking (C)×2 → Inside Defense (C)×3 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Rebounding (PF/C)×3 → Shot Blocking (C)×6 → One on One (SF/PF)×18 → Shot Blocking (C)×3 → One on One (SF/PF)×11

Finishing deltas during age-21 season: JS+3 HA+3 DR+5 IS+3 RB+1 SB+1

**custom (coach 6/YT 6/gym 1/TC 1)**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.93/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 80) · finalized-by-playoffs floor: NOT reachable

Plan: Inside Defense (C)×1 → Shot Blocking (C)×3 → Inside Defense (C)×2 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×2 → Inside Defense (C)×1 → Shot Blocking (C)×1 → Inside Defense (C)×1 → Shot Blocking (C)×4 → Rebounding (PF/C)×3 → Shot Blocking (C)×6 → One on One (SF/PF)×16 → Rebounding (PF/C)×1 → Shot Blocking (C)×13

Finishing deltas during age-21 season: ID+2 RB+2 SB+3

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 3 | 1 | 3 | 2 | 1 | 3 | 5 | 12 | 7 | 11 |
| 20 | 4 | 2 | 4 | 3 | 2 | 4 | 7 | 16 | 12 | 17 |
| 21 | 7 | 2 | 4 | 7 | 8 | 4 | 10 | 16 | 12 | 17 |

### Path to Market: inside #2

**neutral**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.77/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 70) · finalized-by-playoffs floor: NOT reachable

Plan: Inside Defense (C)×13 → Rebounding (PF/C)×3 → Inside Scoring (C)×12 → Rebounding (PF/C)×1 → Inside Scoring (C)×6 → Shot Blocking (C)×7 → Inside Scoring (C)×3 → One on One (SF/PF)×11

Finishing deltas during age-21 season: JS+2 HA+3 DR+4 IS+1

**elite**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.95/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 77) · finalized-by-playoffs floor: NOT reachable

Plan: Inside Scoring (C)×1 → Inside Defense (C)×11 → Rebounding (PF/C)×3 → Inside Scoring (C)×14 → One on One (PG/SG)×13 → Inside Defense (C)×2 → Rebounding (PF/C)×1 → Inside Scoring (C)×2 → One on One (SF/PF)×9

Finishing deltas during age-21 season: JS+2 HA+3 DR+4 IS+1 ID+1 RB+1 SB+1

**custom (coach 6/YT 6/gym 1/TC 1)**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.84/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 74) · finalized-by-playoffs floor: NOT reachable

Plan: Inside Scoring (C)×1 → Inside Defense (C)×12 → Rebounding (PF/C)×3 → Inside Scoring (C)×15 → Shot Blocking (C)×11 → Inside Scoring (C)×2 → One on One (SF/PF)×12

Finishing deltas during age-21 season: JS+2 HA+3 DR+4 IS+1 RB+1

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 3 | 1 | 3 | 2 | 1 | 3 | 6 | 12 | 7 | 8 |
| 20 | 5 | 2 | 4 | 3 | 2 | 4 | 14 | 14 | 9 | 9 |
| 21 | 6 | 2 | 4 | 3 | 2 | 4 | 16 | 16 | 12 | 13 |

### Path to Market: wing #1

**neutral**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 0.98/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 93) · finalized-by-playoffs floor: NOT reachable

Plan: Outside Defense (PG)×6 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → Ball Handling (PG)×1 → Outside Defense (PG)×2 → One on One (PG/SG)×27 → Ball Handling (PG)×1 → Outside Defense (PG)×4 → Passing (PG)×9

Finishing deltas during age-21 season: OD+2 PA+8 ID+1

**elite**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 1.05/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 99) · finalized-by-playoffs floor: NOT reachable

Plan: Outside Defense (PG)×5 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×2 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×3 → Ball Handling (PG)×3 → One on One (SF/PF)×24 → Outside Defense (PG)×4 → Passing (PG)×10

Finishing deltas during age-21 season: OD+2 PA+9

**custom (coach 6/YT 6/gym 1/TC 1)**: PLAYABLE entering 21: yes · FINALIZED by playoffs (wk 7): yes · full-rule end check PASS · pop rate 1.02/wk · stress floor (worst-start, 38min/wk): NOT reachable (entering-21 TSP 96) · finalized-by-playoffs floor: NOT reachable

Plan: Outside Defense (PG)×2 → Ball Handling (PG)×1 → Outside Defense (PG)×5 → One on One (PG/SG)×2 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×1 → Outside Defense (PG)×1 → One on One (PG/SG)×27 → Outside Defense (PG)×4 → Passing (PG)×10

Finishing deltas during age-21 season: OD+2 PA+9

byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):

| age | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | 6 | 4 | 9 | 9 | 9 | 3 | 6 | 5 | 5 | 5 |
| 20 | 13 | 5 | 11 | 15 | 15 | 4 | 7 | 6 | 6 | 6 |
| 21 | 18 | 5 | 11 | 20 | 20 | 4 | 7 | 6 | 6 | 6 |

## Slovenia gap analysis

Every tracked Slovenian 18–21 prospect vs the nearest derived build. Status logic is
age-aware: at 18/19 we grade the elastic FEEDERS (HA/DR), not defense; at 20 we check the
defense season is actually happening; at 21 we check the floor is still closable.

The universe here is every tracked Slovenian 18–21 prospect (1183), most of
whom were never elite-track candidates; WATCH is therefore the expected mode, and the
ON-TRACK list (11) is the actual elite pipeline.

At season week 14, every age-21 floor gap is unclosable by definition ("0
weeks left" before the playoff deadline, wk 7), so the age-21 AT-RISK block
below is a graduating-class artifact right now — re-run early next season for
actionable age-21 grading.

| player | age | nearest build | status | gaps (next tier) | why |
| --- | --- | --- | --- | --- | --- |
| [Oskar Pezdirc](https://www.buzzerbeater.com/player/55135423/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 JR 4->5 OD 7->11 HA 6->20 DR 7->20 PA 3->4 IS 6->7 RB 2->6 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Valen Šušterčič](https://www.buzzerbeater.com/player/55135430/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 9->20 OD 7->12 HA 13->20 DR 14->20 ID 3->4 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Baltazar Mikš](https://www.buzzerbeater.com/player/55135431/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 6->11 HA 9->20 DR 6->20 PA 2->4 IS 3->7 ID 2->6 | defense season, not training OD (inferred: unknown) |
| [Kevin Turkoš](https://www.buzzerbeater.com/player/55135438/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 13->18 OD 10->11 HA 18->20 DR 18->20 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Aleksej Pevc](https://www.buzzerbeater.com/player/55135439/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 6->12 HA 7->20 DR 7->20 ID 3->4 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Božo Herceg](https://www.buzzerbeater.com/player/55135440/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->20 OD 6->12 HA 5->20 DR 7->20 IS 3->6 ID 1->4 RB 3->5 | defense season, not training OD (inferred: unknown) |
| [Silvo Bartol](https://www.buzzerbeater.com/player/55135447/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 9->12 HA 10->20 DR 12->20 IS 3->6 ID 1->4 SB 2->4 | defense season, not training OD (inferred: 15) |
| [Blaž Šušter](https://www.buzzerbeater.com/player/55135458/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 12->18 OD 7->11 HA 14->20 DR 15->20 RB 3->6 | defense season, not training OD (inferred: unknown) |
| [Miro Jecl](https://www.buzzerbeater.com/player/55135460/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 6->11 HA 7->20 DR 5->20 IS 4->7 RB 3->6 | defense season, not training OD (inferred: unknown) |
| [Alen Mac](https://www.buzzerbeater.com/player/55135484/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 9->12 HA 19->20 DR 18->20 | defense season, not training OD (inferred: unknown) |
| [Iztok Gorenčec](https://www.buzzerbeater.com/player/55135492/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 13->20 OD 10->12 HA 12->20 DR 15->20 IS 5->6 ID 2->4 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Janez Vrbnjak](https://www.buzzerbeater.com/player/55135494/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 10->16 ID 11->16 SB 11->13 | defense season, not training ID (inferred: unknown) |
| [Ahmed Pitamič](https://www.buzzerbeater.com/player/55135526/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | OD 3->4 IS 10->16 ID 9->16 RB 7->12 SB 7->13 | defense season, not training ID (inferred: unknown) |
| [Andi Pečevnik](https://www.buzzerbeater.com/player/55135537/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 7->12 HA 3->20 DR 6->20 PA 5->6 IS 4->6 RB 1->5 | defense season, not training OD (inferred: 21) |
| [Erik Verbič](https://www.buzzerbeater.com/player/55135543/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 15->20 OD 10->12 HA 11->20 DR 13->20 IS 5->6 RB 4->5 | defense season, not training OD (inferred: unknown) |
| [Ken Železnikar](https://www.buzzerbeater.com/player/55135546/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 9->11 HA 15->20 DR 14->20 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Lojz Kužnik](https://www.buzzerbeater.com/player/55135565/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 4->20 OD 7->12 HA 6->20 DR 6->20 IS 2->6 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Simon Neudauer](https://www.buzzerbeater.com/player/55135566/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 PA 3->4 IS 9->16 ID 9->16 RB 10->12 SB 6->13 | defense season, not training ID (inferred: unknown) |
| [Sandi Terčon](https://www.buzzerbeater.com/player/55135573/overview.aspx) | 20 | mkt72-inside-1 | AT-RISK | JS 1->7 JR 1->2 HA 1->7 DR 2->8 IS 4->10 ID 11->16 RB 7->12 SB 16->17 | defense season, not training ID (inferred: unknown) |
| [Leonard Vozel](https://www.buzzerbeater.com/player/55135581/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 7->12 HA 16->20 DR 17->20 PA 5->6 | defense season, not training OD (inferred: unknown) |
| [Valentin Šmejc](https://www.buzzerbeater.com/player/55135594/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 4->11 HA 6->20 DR 5->20 IS 6->7 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Arne Remič](https://www.buzzerbeater.com/player/55135645/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 JR 2->5 OD 1->11 HA 5->20 DR 3->20 IS 6->7 RB 1->6 | defense season, not training OD (inferred: unknown) |
| [Lovro Mayer](https://www.buzzerbeater.com/player/55135681/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 5->11 HA 10->20 DR 11->20 IS 5->7 ID 4->6 | defense season, not training OD (inferred: 5) |
| [Miha Vogrinčič](https://www.buzzerbeater.com/player/55135685/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 7->12 HA 6->20 DR 8->20 PA 5->6 IS 3->6 ID 2->4 RB 4->5 SB 3->4 | defense season, not training OD (inferred: 5) |
| [Herman Hvalica](https://www.buzzerbeater.com/player/55135702/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | PA 2->4 IS 10->16 ID 11->16 RB 10->12 SB 8->13 | defense season, not training ID (inferred: unknown) |
| [Aljaž Bolha](https://www.buzzerbeater.com/player/55135704/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 9->20 OD 5->12 HA 11->20 DR 13->20 PA 4->6 ID 3->4 RB 3->5 SB 1->4 | defense season, not training OD (inferred: unknown) |
| [France Svete](https://www.buzzerbeater.com/player/55135728/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 13->20 OD 7->12 HA 18->20 DR 18->20 PA 4->6 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Nino Grmek](https://www.buzzerbeater.com/player/55135749/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 1->6 PA 1->4 IS 7->16 ID 6->16 RB 6->12 SB 4->13 | defense season, not training ID (inferred: unknown) |
| [Miroslav Golob](https://www.buzzerbeater.com/player/55135758/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->18 OD 9->11 HA 11->20 DR 12->20 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Darko Skerlak](https://www.buzzerbeater.com/player/55135783/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 7->11 HA 10->20 DR 14->20 | defense season, not training OD (inferred: unknown) |
| [Paško Nemarić](https://www.buzzerbeater.com/player/55135791/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 7->11 HA 10->20 DR 9->20 IS 6->7 ID 4->6 SB 5->6 | defense season, not training OD (inferred: 16) |
| [Samir Maier](https://www.buzzerbeater.com/player/55135823/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 JR 3->5 OD 7->11 HA 12->20 DR 14->20 | defense season, not training OD (inferred: unknown) |
| [Uroš Volfengenber](https://www.buzzerbeater.com/player/55135826/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 7->20 OD 5->12 HA 15->20 DR 16->20 PA 4->6 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Dore Brigelj](https://www.buzzerbeater.com/player/55135861/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 4->20 OD 7->12 HA 7->20 DR 4->20 IS 3->6 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Zoki Vek](https://www.buzzerbeater.com/player/55135898/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 JR 4->5 OD 6->11 HA 8->20 DR 3->20 IS 6->7 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Erazem Bogataj](https://www.buzzerbeater.com/player/55135913/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 JR 4->5 OD 7->12 HA 4->20 DR 6->20 IS 1->6 RB 4->5 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Marjan Rom](https://www.buzzerbeater.com/player/55135915/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 4->11 HA 8->20 DR 6->20 IS 4->7 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Kristjan Rems](https://www.buzzerbeater.com/player/55135917/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->18 JR 3->5 OD 4->11 HA 7->20 DR 6->20 IS 4->7 SB 3->6 | defense season, not training OD (inferred: unknown) |
| [Vasja Mejač](https://www.buzzerbeater.com/player/55135918/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 1->20 OD 7->12 HA 6->20 DR 5->20 IS 2->6 ID 3->4 RB 3->5 | defense season, not training OD (inferred: unknown) |
| [Ranko Popivoda](https://www.buzzerbeater.com/player/55135924/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 2->11 HA 7->20 DR 5->20 IS 2->7 ID 1->6 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Milan Vidmar](https://www.buzzerbeater.com/player/55135926/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 OD 2->4 IS 10->16 ID 8->16 RB 10->12 SB 8->13 | defense season, not training ID (inferred: unknown) |
| [Rožle Urbanič](https://www.buzzerbeater.com/player/55135944/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 7->12 HA 6->20 DR 4->20 IS 1->6 ID 1->4 RB 1->5 | defense season, not training OD (inferred: unknown) |
| [Edvard Černezl](https://www.buzzerbeater.com/player/55135955/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 JR 1->5 OD 4->11 HA 13->20 DR 14->20 ID 5->6 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Emil Purgaj](https://www.buzzerbeater.com/player/55135975/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 PA 2->4 IS 7->16 ID 7->16 RB 6->12 SB 7->13 | defense season, not training ID (inferred: unknown) |
| [Avgust Tomič](https://www.buzzerbeater.com/player/55135984/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 3->20 JR 4->5 OD 7->12 HA 6->20 DR 5->20 PA 5->6 IS 1->6 RB 1->5 | defense season, not training OD (inferred: unknown) |
| [Robi Težak](https://www.buzzerbeater.com/player/55136018/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 9->11 HA 13->20 DR 14->20 IS 5->7 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Jan Salamar](https://www.buzzerbeater.com/player/55197360/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 JR 4->5 OD 2->11 HA 9->20 DR 7->20 PA 3->4 IS 5->7 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Izidor Mackotevc](https://www.buzzerbeater.com/player/55202826/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | HA 1->3 IS 7->16 ID 8->16 RB 7->12 SB 7->13 | defense season, not training ID (inferred: unknown) |
| [Hinko Pogac](https://www.buzzerbeater.com/player/55439683/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 10->11 HA 9->20 DR 5->20 IS 3->7 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Mike Adorjan](https://www.buzzerbeater.com/player/55439684/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 8->11 HA 6->20 DR 6->20 PA 2->4 IS 2->7 RB 5->6 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Žak Intihar](https://www.buzzerbeater.com/player/55439685/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 12->20 OD 5->12 HA 8->20 DR 11->20 IS 4->6 ID 2->4 RB 1->5 | defense season, not training OD (inferred: unknown) |
| [Leonard Verhovčak](https://www.buzzerbeater.com/player/55439689/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 10->12 HA 15->20 DR 17->20 | defense season, not training OD (inferred: unknown) |
| [Igor Bokal](https://www.buzzerbeater.com/player/55439691/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 6->12 HA 8->20 DR 9->20 IS 5->6 ID 1->4 SB 1->4 | defense season, not training OD (inferred: unknown) |
| [Ferdi Juršek](https://www.buzzerbeater.com/player/55439697/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 12->18 OD 8->11 HA 9->20 DR 11->20 PA 3->4 ID 5->6 RB 4->6 | defense season, not training OD (inferred: unknown) |
| [Urh Čuješ](https://www.buzzerbeater.com/player/55439702/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 5->11 HA 6->20 DR 9->20 RB 2->6 | defense season, not training OD (inferred: unknown) |
| [Avgust Mahorič](https://www.buzzerbeater.com/player/55439707/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 8->11 HA 7->20 DR 11->20 | defense season, not training OD (inferred: unknown) |
| [Pero Koren](https://www.buzzerbeater.com/player/55439708/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 8->11 HA 7->20 DR 7->20 IS 3->7 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Goran Lapanja](https://www.buzzerbeater.com/player/55439716/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->20 OD 8->12 HA 10->20 DR 9->20 PA 5->6 IS 5->6 ID 3->4 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Ferdinand Udovčič](https://www.buzzerbeater.com/player/55439730/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 8->11 HA 8->20 DR 6->20 IS 6->7 ID 2->6 | defense season, not training OD (inferred: unknown) |
| [Slavko Pajenk](https://www.buzzerbeater.com/player/55439743/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 8->12 HA 9->20 DR 10->20 | defense season, not training OD (inferred: unknown) |
| [Patrik Macok](https://www.buzzerbeater.com/player/55439766/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 4->11 HA 5->20 DR 11->20 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Nastja Oblak](https://www.buzzerbeater.com/player/55439770/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 JR 4->5 OD 10->11 HA 9->20 DR 6->20 PA 3->4 | defense season, not training OD (inferred: unknown) |
| [Viki Klemenčič](https://www.buzzerbeater.com/player/55439771/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 4->12 HA 13->20 DR 16->20 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Boško Volčanšek](https://www.buzzerbeater.com/player/55439774/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 JR 2->5 OD 8->11 HA 3->20 DR 8->20 ID 1->6 SB 2->6 | defense season, not training OD (inferred: unknown) |
| [Irvin Kisilak](https://www.buzzerbeater.com/player/55439791/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->20 OD 10->12 HA 13->20 DR 9->20 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Mirsad Pezder](https://www.buzzerbeater.com/player/55439796/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 3->6 OD 3->4 IS 10->16 ID 5->16 RB 9->12 SB 10->13 | defense season, not training ID (inferred: unknown) |
| [Egon Selan](https://www.buzzerbeater.com/player/55439799/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 7->11 HA 9->20 DR 10->20 IS 4->7 | defense season, not training OD (inferred: unknown) |
| [Darko Zgonc](https://www.buzzerbeater.com/player/55439804/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 5->12 HA 2->20 DR 10->20 IS 3->6 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Primož Vidic](https://www.buzzerbeater.com/player/55439809/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | PA 2->4 IS 10->16 ID 9->16 RB 10->12 SB 9->13 | defense season, not training ID (inferred: unknown) |
| [Aljaž Masterl](https://www.buzzerbeater.com/player/55439811/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 10->11 HA 6->20 DR 9->20 | defense season, not training OD (inferred: unknown) |
| [Mido Stanovnik](https://www.buzzerbeater.com/player/55439812/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 8->12 HA 10->20 DR 6->20 ID 3->4 RB 3->5 | defense season, not training OD (inferred: unknown) |
| [Patrik Šusteršič](https://www.buzzerbeater.com/player/55439814/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 8->11 HA 8->20 DR 7->20 RB 4->6 | defense season, not training OD (inferred: unknown) |
| [Urh Trochlik](https://www.buzzerbeater.com/player/55439816/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 10->11 HA 12->20 DR 10->20 | defense season, not training OD (inferred: unknown) |
| [Žan Madić](https://www.buzzerbeater.com/player/55439820/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 IS 10->16 ID 11->16 RB 10->12 SB 5->13 | defense season, not training ID (inferred: unknown) |
| [Miha Auer](https://www.buzzerbeater.com/player/55439830/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->20 JR 3->5 OD 8->12 HA 7->20 DR 6->20 IS 1->6 RB 3->5 | defense season, not training OD (inferred: unknown) |
| [Drejc Kožel](https://www.buzzerbeater.com/player/55439831/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 14->20 JR 4->5 OD 10->12 HA 17->20 DR 17->20 PA 5->6 | defense season, not training OD (inferred: unknown) |
| [Črt Žitek](https://www.buzzerbeater.com/player/55439832/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 5->12 HA 9->20 DR 8->20 IS 3->6 RB 2->5 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Matic Mali](https://www.buzzerbeater.com/player/55439834/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 1->11 HA 14->20 DR 13->20 ID 4->6 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Dare Tomše](https://www.buzzerbeater.com/player/55439838/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 JR 3->5 OD 7->11 HA 7->20 DR 3->20 IS 3->7 | defense season, not training OD (inferred: unknown) |
| [Rado Peterle](https://www.buzzerbeater.com/player/55439842/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 JR 2->5 OD 2->11 HA 10->20 DR 14->20 PA 1->4 | defense season, not training OD (inferred: unknown) |
| [Zlatan Mikšič](https://www.buzzerbeater.com/player/55439843/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 IS 8->16 ID 7->16 RB 8->12 SB 3->13 | defense season, not training ID (inferred: unknown) |
| [Nastja Rutar](https://www.buzzerbeater.com/player/55439850/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 7->11 HA 8->20 DR 8->20 RB 3->6 | defense season, not training OD (inferred: unknown) |
| [Miki Kozlar](https://www.buzzerbeater.com/player/55439854/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->20 OD 5->12 HA 17->20 DR 15->20 | defense season, not training OD (inferred: unknown) |
| [Bor Redžić](https://www.buzzerbeater.com/player/55439861/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 JR 1->5 OD 9->11 HA 9->20 DR 7->20 IS 5->7 | defense season, not training OD (inferred: unknown) |
| [Gregor Hoda](https://www.buzzerbeater.com/player/55439863/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 3->11 HA 4->20 DR 8->20 ID 4->6 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Teodor Šikur](https://www.buzzerbeater.com/player/55439864/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 2->11 HA 8->20 DR 10->20 | defense season, not training OD (inferred: unknown) |
| [Julijan Lep](https://www.buzzerbeater.com/player/55439867/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 IS 9->16 ID 10->16 RB 10->12 SB 9->13 | defense season, not training ID (inferred: unknown) |
| [Rene Janežič](https://www.buzzerbeater.com/player/55439872/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->20 OD 7->12 HA 16->20 DR 14->20 ID 3->4 RB 4->5 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Gabrijel Kac](https://www.buzzerbeater.com/player/55439876/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->20 OD 8->12 HA 5->20 DR 10->20 RB 4->5 SB 1->4 | defense season, not training OD (inferred: unknown) |
| [Lovro Bric](https://www.buzzerbeater.com/player/55439881/overview.aspx) | 20 | mkt72-inside-1 | AT-RISK | HA 6->7 DR 7->8 IS 4->10 ID 14->16 | defense season, not training ID (inferred: unknown) |
| [Sandi Svete](https://www.buzzerbeater.com/player/55439882/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 JR 3->5 OD 3->11 HA 9->20 DR 9->20 IS 2->7 ID 5->6 | defense season, not training OD (inferred: unknown) |
| [Urban Lorenjak](https://www.buzzerbeater.com/player/55439885/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 12->18 OD 9->11 HA 5->20 DR 11->20 | defense season, not training OD (inferred: unknown) |
| [Slavko Šimnovič](https://www.buzzerbeater.com/player/55439886/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 12->20 OD 6->12 HA 15->20 DR 14->20 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Dare Urbanja](https://www.buzzerbeater.com/player/55439889/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 JR 4->5 OD 7->12 HA 9->20 DR 9->20 ID 3->4 RB 1->5 | defense season, not training OD (inferred: unknown) |
| [Almir Tomšič](https://www.buzzerbeater.com/player/55439899/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 8->11 HA 6->20 DR 8->20 RB 3->6 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Brin Karabol](https://www.buzzerbeater.com/player/55439900/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 9->12 HA 7->20 DR 9->20 IS 3->6 RB 2->5 | defense season, not training OD (inferred: unknown) |
| [Goran Giacomelli](https://www.buzzerbeater.com/player/55439904/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 5->11 HA 10->20 DR 5->20 IS 6->7 | defense season, not training OD (inferred: unknown) |
| [Zvonimir Antončič](https://www.buzzerbeater.com/player/55439907/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 4->12 HA 8->20 DR 9->20 IS 1->6 RB 1->5 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Rastislav Luk](https://www.buzzerbeater.com/player/55439908/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 7->12 HA 11->20 DR 7->20 RB 3->5 | defense season, not training OD (inferred: 5) |
| [Damjan Brezovar](https://www.buzzerbeater.com/player/55439928/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 10->20 OD 10->12 HA 15->20 DR 15->20 PA 4->6 | defense season, not training OD (inferred: unknown) |
| [Oto Družič](https://www.buzzerbeater.com/player/55439932/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 JR 2->5 OD 8->11 HA 8->20 DR 7->20 ID 1->6 | defense season, not training OD (inferred: unknown) |
| [Igor Ranić](https://www.buzzerbeater.com/player/55439949/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 JR 4->5 OD 3->11 HA 11->20 DR 11->20 RB 1->6 | defense season, not training OD (inferred: unknown) |
| [Mitja Hrovat](https://www.buzzerbeater.com/player/55439950/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->18 JR 4->5 OD 6->11 HA 7->20 DR 6->20 IS 6->7 RB 3->6 SB 3->6 | defense season, not training OD (inferred: unknown) |
| [Aleksander Španič](https://www.buzzerbeater.com/player/55439951/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 6->11 HA 6->20 DR 5->20 RB 2->6 | defense season, not training OD (inferred: unknown) |
| [Lan Visenjak](https://www.buzzerbeater.com/player/55439954/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 OD 2->4 IS 7->16 ID 8->16 RB 10->12 SB 2->13 | defense season, not training ID (inferred: unknown) |
| [Matija Kotar](https://www.buzzerbeater.com/player/55439956/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->18 OD 2->11 HA 13->20 DR 13->20 | defense season, not training OD (inferred: unknown) |
| [Dare Veselić](https://www.buzzerbeater.com/player/55439957/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 JR 4->5 OD 6->11 HA 14->20 DR 12->20 | defense season, not training OD (inferred: unknown) |
| [Lenart Uranc](https://www.buzzerbeater.com/player/55439964/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 8->12 HA 14->20 DR 17->20 PA 4->6 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Jordan Keder](https://www.buzzerbeater.com/player/55439965/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 8->12 HA 4->20 DR 6->20 IS 2->6 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Arne Nago](https://www.buzzerbeater.com/player/55439975/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 5->11 HA 6->20 DR 2->20 | defense season, not training OD (inferred: unknown) |
| [Janez Šegina](https://www.buzzerbeater.com/player/55439982/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 JR 3->5 OD 6->11 HA 6->20 DR 7->20 RB 4->6 | defense season, not training OD (inferred: unknown) |
| [Vlado Neumeister](https://www.buzzerbeater.com/player/55439986/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 10->12 HA 11->20 DR 11->20 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Lovrenc Petrač](https://www.buzzerbeater.com/player/55439987/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 IS 6->16 ID 10->16 RB 6->12 SB 10->13 | defense season, not training ID (inferred: unknown) |
| [Erazem Ludoviko](https://www.buzzerbeater.com/player/55439991/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 6->12 HA 3->20 DR 4->20 IS 2->6 RB 1->5 | defense season, not training OD (inferred: unknown) |
| [Dore Balažic](https://www.buzzerbeater.com/player/55439996/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 6->12 HA 8->20 DR 8->20 IS 2->6 RB 4->5 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Braco Sinkovič](https://www.buzzerbeater.com/player/55440002/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 JR 1->2 IS 8->16 ID 8->16 RB 6->12 SB 9->13 | defense season, not training ID (inferred: unknown) |
| [Emil Varga](https://www.buzzerbeater.com/player/55440005/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 6->11 HA 3->20 DR 6->20 PA 2->4 IS 6->7 ID 4->6 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Kevin Babenko](https://www.buzzerbeater.com/player/55440007/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 JR 4->5 OD 4->11 HA 10->20 DR 7->20 IS 5->7 RB 1->6 SB 1->6 | defense season, not training OD (inferred: unknown) |
| [Cene Trobec](https://www.buzzerbeater.com/player/55440009/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 12->20 OD 11->12 HA 12->20 DR 10->20 | defense season, not training OD (inferred: unknown) |
| [Žiga Majerhofer](https://www.buzzerbeater.com/player/55440011/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | PA 3->4 IS 9->16 ID 7->16 RB 8->12 SB 8->13 | defense season, not training ID (inferred: unknown) |
| [Sašo Terkaj](https://www.buzzerbeater.com/player/55440016/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 JR 2->5 OD 7->11 HA 12->20 DR 10->20 | defense season, not training OD (inferred: unknown) |
| [Janez Ferčič](https://www.buzzerbeater.com/player/55440017/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 1->18 OD 7->11 HA 5->20 DR 8->20 PA 3->4 ID 3->6 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Eron Vutek](https://www.buzzerbeater.com/player/55440031/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | OD 1->4 IS 9->16 ID 6->16 RB 8->12 SB 6->13 | defense season, not training ID (inferred: unknown) |
| [Anže De Bello](https://www.buzzerbeater.com/player/55440032/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 9->11 HA 9->20 DR 10->20 | defense season, not training OD (inferred: unknown) |
| [Denis Burgar](https://www.buzzerbeater.com/player/55440033/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 IS 9->16 ID 9->16 RB 9->12 SB 9->13 | defense season, not training ID (inferred: unknown) |
| [Trpimir Regrat](https://www.buzzerbeater.com/player/55440045/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 JR 2->5 OD 7->11 HA 9->20 DR 5->20 RB 4->6 | defense season, not training OD (inferred: unknown) |
| [Nejc Toš](https://www.buzzerbeater.com/player/55440060/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 15->20 OD 5->12 HA 15->20 DR 15->20 | defense season, not training OD (inferred: unknown) |
| [Lucijan Jazbec](https://www.buzzerbeater.com/player/55440068/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->20 OD 6->12 HA 6->20 DR 5->20 IS 5->6 ID 2->4 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [David Bizovičar](https://www.buzzerbeater.com/player/55440071/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 7->11 HA 9->20 DR 7->20 IS 4->7 RB 3->6 | defense season, not training OD (inferred: unknown) |
| [Murat Brecko](https://www.buzzerbeater.com/player/55440076/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 JR 3->5 OD 7->11 HA 6->20 DR 3->20 SB 2->6 | defense season, not training OD (inferred: unknown) |
| [Grdimir Segarić](https://www.buzzerbeater.com/player/55440090/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 6->12 HA 9->20 DR 9->20 IS 5->6 | defense season, not training OD (inferred: unknown) |
| [Damir Purgstaler](https://www.buzzerbeater.com/player/55440095/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 4->20 OD 8->12 HA 5->20 DR 5->20 IS 5->6 ID 1->4 | defense season, not training OD (inferred: unknown) |
| [Jakob Ozimek](https://www.buzzerbeater.com/player/55440098/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->18 OD 8->11 HA 12->20 DR 16->20 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Egon Bergant](https://www.buzzerbeater.com/player/55440113/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 7->11 HA 10->20 DR 12->20 ID 4->6 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Amadej Udovc](https://www.buzzerbeater.com/player/55440120/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 7->11 HA 9->20 DR 3->20 PA 2->4 | defense season, not training OD (inferred: unknown) |
| [Rajko Krasnik](https://www.buzzerbeater.com/player/55440122/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 JR 3->5 OD 4->11 HA 12->20 DR 9->20 PA 3->4 IS 4->7 | defense season, not training OD (inferred: 5) |
| [Šimen Mitraković](https://www.buzzerbeater.com/player/55440124/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 6->11 HA 6->20 DR 6->20 IS 4->7 SB 3->6 | defense season, not training OD (inferred: unknown) |
| [Vanja Burčul](https://www.buzzerbeater.com/player/55440128/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 1->18 OD 6->11 HA 8->20 DR 3->20 PA 1->4 ID 4->6 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Daniel Nered](https://www.buzzerbeater.com/player/55440135/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 10->11 HA 4->20 DR 7->20 IS 5->7 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Rastko Volferl](https://www.buzzerbeater.com/player/55440144/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 7->11 HA 8->20 DR 5->20 ID 4->6 | defense season, not training OD (inferred: unknown) |
| [Žane Pucl](https://www.buzzerbeater.com/player/55440147/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 6->12 HA 7->20 DR 8->20 PA 4->6 IS 3->6 RB 4->5 | defense season, not training OD (inferred: unknown) |
| [Bojan Kačič](https://www.buzzerbeater.com/player/55440152/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->18 OD 8->11 HA 10->20 DR 14->20 | defense season, not training OD (inferred: unknown) |
| [Valentin Burg](https://www.buzzerbeater.com/player/55440159/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 8->11 HA 10->20 DR 10->20 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Mirsad Ivanič](https://www.buzzerbeater.com/player/55440160/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 9->12 HA 2->20 DR 5->20 RB 1->5 | defense season, not training OD (inferred: unknown) |
| [Zoran Purger](https://www.buzzerbeater.com/player/55440179/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 3->11 HA 4->20 DR 7->20 SB 3->6 | defense season, not training OD (inferred: unknown) |
| [France Pongrač](https://www.buzzerbeater.com/player/55440193/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 5->11 HA 6->20 DR 6->20 IS 4->7 RB 5->6 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Eron Bahovec](https://www.buzzerbeater.com/player/55440204/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 13->20 OD 9->12 HA 14->20 DR 17->20 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Goran Baznik](https://www.buzzerbeater.com/player/55440208/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 6->11 HA 7->20 DR 7->20 PA 3->4 IS 5->7 ID 2->6 | defense season, not training OD (inferred: unknown) |
| [Jonas Čergolj](https://www.buzzerbeater.com/player/55440212/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 13->20 OD 8->12 HA 10->20 DR 13->20 IS 2->6 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Nejc Škrlec](https://www.buzzerbeater.com/player/55440223/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 IS 11->16 ID 9->16 RB 9->12 SB 7->13 | defense season, not training ID (inferred: unknown) |
| [Albert Šegula](https://www.buzzerbeater.com/player/55440229/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 2->18 OD 8->11 HA 6->20 DR 5->20 PA 3->4 IS 5->7 RB 4->6 | defense season, not training OD (inferred: unknown) |
| [Silvo Zelen](https://www.buzzerbeater.com/player/55440235/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 7->11 HA 6->20 DR 4->20 IS 5->7 ID 3->6 RB 4->6 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Žan Delak](https://www.buzzerbeater.com/player/55440241/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 4->11 HA 3->20 DR 7->20 ID 3->6 | defense season, not training OD (inferred: unknown) |
| [Boštjan Janžević](https://www.buzzerbeater.com/player/55440242/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 5->11 HA 7->20 DR 3->20 IS 5->7 | defense season, not training OD (inferred: unknown) |
| [Jaka Vuzem](https://www.buzzerbeater.com/player/55440244/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 12->16 ID 11->16 RB 9->12 SB 3->13 | defense season, not training ID (inferred: unknown) |
| [Stojan Kobe](https://www.buzzerbeater.com/player/55440248/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 9->11 HA 3->20 DR 6->20 RB 2->6 | defense season, not training OD (inferred: unknown) |
| [Jakob Brajkovič](https://www.buzzerbeater.com/player/55440252/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 11->18 OD 4->11 HA 11->20 DR 7->20 IS 2->7 | defense season, not training OD (inferred: unknown) |
| [Milimir Kos](https://www.buzzerbeater.com/player/55440253/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 5->20 OD 8->12 HA 8->20 DR 10->20 PA 5->6 IS 3->6 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Edin Šimonc](https://www.buzzerbeater.com/player/55440258/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->20 OD 9->12 HA 7->20 DR 11->20 RB 2->5 | defense season, not training OD (inferred: unknown) |
| [Igor Lovrinović](https://www.buzzerbeater.com/player/55440264/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 JR 3->5 OD 10->11 HA 8->20 DR 9->20 | defense season, not training OD (inferred: unknown) |
| [Josip Žvab](https://www.buzzerbeater.com/player/55440269/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 9->12 HA 11->20 DR 10->20 IS 4->6 | defense season, not training OD (inferred: unknown) |
| [Dragomir Hebar](https://www.buzzerbeater.com/player/55440288/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 8->12 HA 2->20 DR 10->20 IS 3->6 ID 2->4 | defense season, not training OD (inferred: unknown) |
| [Maj Dobrinja](https://www.buzzerbeater.com/player/55440290/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 7->11 HA 11->20 DR 8->20 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Almir Volarič](https://www.buzzerbeater.com/player/55440292/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 13->20 OD 3->12 HA 8->20 DR 10->20 ID 3->4 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Nik Jurjavčič](https://www.buzzerbeater.com/player/55440293/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | OD 3->4 IS 8->16 ID 10->16 RB 10->12 SB 9->13 | defense season, not training ID (inferred: unknown) |
| [Marko Paradiž](https://www.buzzerbeater.com/player/55440301/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 11->20 OD 5->12 HA 5->20 DR 6->20 IS 2->6 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Aleksander Gojkošek](https://www.buzzerbeater.com/player/55440313/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 10->12 HA 7->20 DR 6->20 IS 4->6 RB 3->5 | defense season, not training OD (inferred: unknown) |
| [Miro Dragšič](https://www.buzzerbeater.com/player/55440324/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 8->11 HA 9->20 DR 3->20 IS 2->7 SB 2->6 | defense season, not training OD (inferred: unknown) |
| [Rusmin Kamnar](https://www.buzzerbeater.com/player/55440328/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 9->12 HA 6->20 DR 10->20 IS 3->6 ID 3->4 RB 3->5 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Boltežar Braznik](https://www.buzzerbeater.com/player/55440330/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 2->11 HA 10->20 DR 14->20 PA 3->4 | defense season, not training OD (inferred: unknown) |
| [Oto Pupaher](https://www.buzzerbeater.com/player/55440338/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 11->16 ID 11->16 RB 10->12 SB 8->13 | defense season, not training ID (inferred: unknown) |
| [Darijo Pugelj](https://www.buzzerbeater.com/player/55440343/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 2->11 HA 4->20 DR 9->20 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Nejc Smerdelj](https://www.buzzerbeater.com/player/55440349/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 10->12 HA 10->20 DR 9->20 RB 2->5 SB 1->4 | defense season, not training OD (inferred: unknown) |
| [Pero Kordežca](https://www.buzzerbeater.com/player/55440357/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 10->11 HA 12->20 DR 12->20 | defense season, not training OD (inferred: 17) |
| [Borut Trost](https://www.buzzerbeater.com/player/55440368/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 8->12 HA 5->20 DR 6->20 PA 5->6 IS 1->6 ID 1->4 RB 3->5 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Drejc Pivk](https://www.buzzerbeater.com/player/55440369/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 10->12 HA 9->20 DR 6->20 IS 3->6 ID 3->4 RB 2->5 | defense season, not training OD (inferred: unknown) |
| [Gregor Vinković](https://www.buzzerbeater.com/player/55440375/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 7->11 HA 6->20 DR 5->20 | defense season, not training OD (inferred: unknown) |
| [Vitomil Guček](https://www.buzzerbeater.com/player/55440392/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 5->11 HA 10->20 DR 8->20 IS 3->7 RB 2->6 | defense season, not training OD (inferred: unknown) |
| [Jordan Ferderber](https://www.buzzerbeater.com/player/55440395/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 9->11 HA 9->20 DR 11->20 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Zdravko Špeh](https://www.buzzerbeater.com/player/55461802/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 1->18 OD 5->11 HA 7->20 DR 5->20 PA 3->4 IS 6->7 RB 5->6 | defense season, not training OD (inferred: unknown) |
| [Miško Levičar](https://www.buzzerbeater.com/player/55461958/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 5->6 OD 2->4 IS 7->16 ID 8->16 RB 10->12 SB 8->13 | defense season, not training ID (inferred: unknown) |
| [Luka Kosmač](https://www.buzzerbeater.com/player/55462234/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 3->6 HA 1->3 IS 8->16 ID 4->16 RB 7->12 SB 10->13 | defense season, not training ID (inferred: unknown) |
| [Tonček Svete](https://www.buzzerbeater.com/player/55462238/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 9->11 HA 8->20 DR 4->20 ID 5->6 | defense season, not training OD (inferred: 5) |
| [David Prek](https://www.buzzerbeater.com/player/55462255/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | IS 11->16 ID 13->16 RB 11->12 SB 7->13 | defense season, not training ID (inferred: unknown) |
| [Vlado Horvat](https://www.buzzerbeater.com/player/55462415/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 9->12 HA 10->20 DR 8->20 IS 3->6 ID 3->4 | defense season, not training OD (inferred: unknown) |
| [Tibor Klajderič](https://www.buzzerbeater.com/player/55462692/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 5->11 HA 10->20 DR 9->20 RB 4->6 | defense season, not training OD (inferred: unknown) |
| [Zlatko Repovš](https://www.buzzerbeater.com/player/55463235/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 5->11 HA 9->20 DR 5->20 PA 3->4 IS 6->7 | defense season, not training OD (inferred: unknown) |
| [Jožef Mavec](https://www.buzzerbeater.com/player/55463993/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 8->12 HA 9->20 DR 4->20 PA 5->6 IS 1->6 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Braco Bučar](https://www.buzzerbeater.com/player/55464997/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 4->6 DR 1->2 IS 9->16 ID 9->16 RB 6->12 SB 10->13 | defense season, not training ID (inferred: 5) |
| [Denis Boncelj](https://www.buzzerbeater.com/player/55465098/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 3->11 HA 10->20 DR 10->20 PA 2->4 RB 5->6 | defense season, not training OD (inferred: 5) |
| [Vid Babič](https://www.buzzerbeater.com/player/55465895/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 6->12 HA 7->20 DR 5->20 IS 5->6 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Stojan Broz](https://www.buzzerbeater.com/player/55466675/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 6->12 HA 10->20 DR 5->20 ID 1->4 RB 4->5 | defense season, not training OD (inferred: unknown) |
| [Aljaž Drenšek](https://www.buzzerbeater.com/player/55466761/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 5->11 HA 10->20 DR 9->20 PA 3->4 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Lev Kociper](https://www.buzzerbeater.com/player/55466788/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 6->18 JR 4->5 OD 6->11 HA 8->20 DR 9->20 IS 6->7 ID 2->6 SB 4->6 | defense season, not training OD (inferred: unknown) |
| [Črtomir Kašnar](https://www.buzzerbeater.com/player/55474896/overview.aspx) | 20 | mkt72-outside-2 | AT-RISK | JS 12->20 OD 5->12 HA 16->20 DR 17->20 ID 3->4 RB 4->5 SB 3->4 | defense season, not training OD (inferred: unknown) |
| [Šimen Kezele](https://www.buzzerbeater.com/player/55477769/overview.aspx) | 20 | mkt72-inside-2 | AT-RISK | JS 2->6 JR 1->2 OD 1->4 HA 2->3 PA 1->4 IS 7->16 ID 4->16 RB 4->12 SB 7->13 | defense season, not training ID (inferred: unknown) |
| [Lovro Repina](https://www.buzzerbeater.com/player/55477770/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 4->12 HA 4->20 DR 6->20 ID 1->4 SB 2->4 | defense season, not training OD (inferred: unknown) |
| [Primož Mal](https://www.buzzerbeater.com/player/55477781/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->18 JR 2->5 OD 5->11 HA 6->20 DR 5->20 PA 3->4 ID 2->6 | defense season, not training OD (inferred: unknown) |
| [Andi Hebar](https://www.buzzerbeater.com/player/55741957/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 5->18 JR 4->5 OD 7->11 HA 7->20 DR 6->20 IS 6->7 ID 4->6 RB 4->6 | defense season, not training OD (inferred: unknown) |
| [Blaž Vinarnik](https://www.buzzerbeater.com/player/56009275/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 3->18 JR 4->5 OD 2->11 HA 3->20 DR 4->20 RB 1->6 SB 5->6 | defense season, not training OD (inferred: unknown) |
| [Pero Špes](https://www.buzzerbeater.com/player/56023188/overview.aspx) | 20 | mkt72-outside-1 | AT-RISK | JS 6->20 JR 4->5 OD 5->12 HA 6->20 DR 6->20 IS 2->6 RB 2->5 | defense season, not training OD (inferred: unknown) |
| [Daniel Šinkovec](https://www.buzzerbeater.com/player/56031974/overview.aspx) | 20 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 5->11 HA 4->20 DR 6->20 PA 3->4 IS 2->7 | defense season, not training OD (inferred: unknown) |
| [Arjan Plut](https://www.buzzerbeater.com/player/54827381/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 3->11 HA 7->20 DR 6->20 IS 4->7 RB 3->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dušan Tomažic](https://www.buzzerbeater.com/player/54827395/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 JR 2->5 OD 5->11 HA 4->20 DR 6->20 IS 3->7 RB 2->6 SB 4->6 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Taj Vavpotič](https://www.buzzerbeater.com/player/54827427/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 6->11 HA 13->20 DR 13->20 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Admir Aljančič](https://www.buzzerbeater.com/player/54827447/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 8->11 HA 7->20 DR 6->20 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jaša Dolenjc](https://www.buzzerbeater.com/player/54827482/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 11->18 JR 3->5 OD 8->11 HA 15->20 DR 17->20 PA 3->4 ID 4->6 RB 5->6 SB 5->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Šime Šajn](https://www.buzzerbeater.com/player/54827483/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 6->11 HA 4->20 DR 8->20 SB 5->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tibor Jager](https://www.buzzerbeater.com/player/54827485/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 5->11 HA 9->20 DR 8->20 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Trpimir Kamin](https://www.buzzerbeater.com/player/54827487/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 JR 1->5 OD 5->11 HA 6->20 DR 5->20 ID 4->6 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nastja Šimnić](https://www.buzzerbeater.com/player/54827518/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | ID 15->16 SB 9->13 | cannot close ID gap 1 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Orhan Podbevšek](https://www.buzzerbeater.com/player/54827520/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 14->20 OD 7->12 HA 18->20 DR 19->20 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Andraž Bratko](https://www.buzzerbeater.com/player/54827530/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 11->20 OD 7->12 HA 8->20 DR 8->20 IS 4->6 SB 3->4 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Maksimilijan Balažic](https://www.buzzerbeater.com/player/54827545/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->18 JR 3->5 OD 3->11 HA 4->20 DR 5->20 RB 3->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ivan Nikolić](https://www.buzzerbeater.com/player/54827558/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 16->20 HA 16->20 DR 16->20 RB 3->5 | cannot close OD gap 1 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Vid Sinkovic](https://www.buzzerbeater.com/player/54827581/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->20 HA 18->20 DR 18->20 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Cveto Volčanšek](https://www.buzzerbeater.com/player/54827582/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | HA 2->3 PA 3->4 IS 14->16 ID 15->16 | cannot close ID gap 1 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Bojan Resman](https://www.buzzerbeater.com/player/54827633/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->20 HA 19->20 DR 19->20 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Rastislav Tajnik](https://www.buzzerbeater.com/player/54827679/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 7->12 HA 12->20 DR 14->20 PA 5->6 SB 3->4 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Filip Smonkar](https://www.buzzerbeater.com/player/54827700/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->20 HA 15->20 DR 18->20 | cannot close OD gap 1 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dare Ule](https://www.buzzerbeater.com/player/54827706/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 8->11 HA 10->20 DR 9->20 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Valen Ribnikar](https://www.buzzerbeater.com/player/54827730/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 5->20 OD 6->12 HA 4->20 DR 6->20 IS 1->6 ID 3->4 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dušan Mocić](https://www.buzzerbeater.com/player/54827753/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 6->11 HA 1->20 DR 3->20 ID 5->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Teo Slavec](https://www.buzzerbeater.com/player/54827761/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->20 OD 8->12 HA 16->20 DR 17->20 PA 3->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Miha Poljšak](https://www.buzzerbeater.com/player/54827784/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 7->12 HA 3->20 DR 4->20 PA 4->6 IS 4->6 RB 1->5 SB 3->4 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Valuk Osterman](https://www.buzzerbeater.com/player/54827812/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 9->20 HA 15->20 DR 16->20 SB 2->4 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Branko Ulrich](https://www.buzzerbeater.com/player/54827826/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 JR 1->5 OD 4->11 HA 11->20 DR 10->20 PA 2->4 SB 4->6 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ermin Ploj](https://www.buzzerbeater.com/player/54827854/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | OD 6->11 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dušan Pirih](https://www.buzzerbeater.com/player/54827922/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 6->12 HA 6->20 DR 3->20 IS 5->6 ID 3->4 RB 3->5 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Rastko Zaletel](https://www.buzzerbeater.com/player/54827948/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 HA 9->20 DR 12->20 SB 4->6 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Aleksander Godec](https://www.buzzerbeater.com/player/54827949/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->20 HA 11->20 DR 12->20 | cannot close OD gap 3 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Vanja Vršić](https://www.buzzerbeater.com/player/54827991/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 11->18 JR 4->5 OD 3->11 HA 12->20 DR 11->20 ID 5->6 RB 4->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nel Krnec](https://www.buzzerbeater.com/player/54828043/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->20 OD 10->12 HA 5->20 DR 7->20 IS 3->6 RB 4->5 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ermin Ahac](https://www.buzzerbeater.com/player/54850112/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 3->11 HA 8->20 DR 5->20 ID 5->6 RB 4->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Edo Balagić](https://www.buzzerbeater.com/player/54850572/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 8->11 HA 12->20 DR 10->20 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Valentin Florijan](https://www.buzzerbeater.com/player/54851490/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 7->11 HA 6->20 DR 5->20 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Peter Smrdej](https://www.buzzerbeater.com/player/54898631/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 8->20 JR 4->5 OD 9->12 HA 13->20 DR 13->20 IS 5->6 RB 2->5 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [David Horvat](https://www.buzzerbeater.com/player/55135429/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 14->18 OD 9->11 HA 10->20 DR 10->20 PA 3->4 IS 6->7 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Vlado Črne](https://www.buzzerbeater.com/player/55135433/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->20 JR 3->5 OD 9->12 HA 5->20 DR 6->20 IS 1->6 RB 2->5 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Pepe Bratovš](https://www.buzzerbeater.com/player/55135434/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 HA 7->20 DR 4->20 PA 3->4 RB 3->6 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Lenart Kajzer](https://www.buzzerbeater.com/player/55135437/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 2->11 HA 6->20 DR 6->20 IS 5->7 SB 2->6 | cannot close OD gap 12 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tomo Oblak](https://www.buzzerbeater.com/player/55135441/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 8->11 HA 12->20 DR 10->20 IS 6->7 ID 4->6 SB 5->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Sandi Škrlec](https://www.buzzerbeater.com/player/55135442/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | PA 2->4 IS 8->16 ID 9->16 RB 9->12 SB 8->13 | cannot close ID gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Miha Brezavšček](https://www.buzzerbeater.com/player/55135446/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 4->11 HA 10->20 DR 10->20 PA 3->4 SB 2->6 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Miha Pakiž](https://www.buzzerbeater.com/player/55135449/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 9->12 HA 8->20 DR 6->20 IS 4->6 SB 1->4 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Sergej Konečnik](https://www.buzzerbeater.com/player/55135454/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 6->11 HA 10->20 DR 6->20 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tejo Cigoj](https://www.buzzerbeater.com/player/55135456/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 6->12 HA 9->20 DR 6->20 ID 3->4 SB 1->4 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Andrej Starman](https://www.buzzerbeater.com/player/55135457/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 5->11 HA 9->20 DR 5->20 IS 4->7 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Arne Pečolar](https://www.buzzerbeater.com/player/55135462/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 5->20 OD 8->12 HA 9->20 DR 11->20 IS 4->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Štefan Ilić](https://www.buzzerbeater.com/player/55135465/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JR 1->2 OD 1->4 IS 13->16 ID 13->16 SB 10->13 | cannot close ID gap 3 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tavž Dobovšek](https://www.buzzerbeater.com/player/55135466/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 13->18 HA 13->20 DR 15->20 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Aleš Ukmar](https://www.buzzerbeater.com/player/55135472/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 7->12 HA 15->20 DR 14->20 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Valuk De Bello](https://www.buzzerbeater.com/player/55135476/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->20 JR 4->5 OD 8->12 HA 16->20 DR 17->20 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Lenart Kos](https://www.buzzerbeater.com/player/55135481/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 17->20 HA 17->20 DR 18->20 IS 2->6 | cannot close OD gap 1 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Teo Glavina](https://www.buzzerbeater.com/player/55135486/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 12->18 HA 12->20 DR 10->20 RB 5->6 | cannot close OD gap 3 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [David Navotnik](https://www.buzzerbeater.com/player/55135487/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 7->11 HA 3->20 DR 4->20 SB 4->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dare Bahovec](https://www.buzzerbeater.com/player/55135488/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 12->18 JR 4->5 OD 7->11 HA 9->20 DR 13->20 ID 3->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Marko Peterec](https://www.buzzerbeater.com/player/55135491/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 JR 4->5 OD 9->11 HA 6->20 DR 13->20 IS 4->7 SB 5->6 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Stanko Brezovnik](https://www.buzzerbeater.com/player/55135501/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->18 JR 4->5 HA 12->20 DR 12->20 SB 5->6 | cannot close OD gap 1 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Erazem Strojan](https://www.buzzerbeater.com/player/55135506/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 12->20 OD 8->12 HA 17->20 DR 18->20 RB 3->5 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Amel Stupan](https://www.buzzerbeater.com/player/55135514/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 12->20 OD 8->12 HA 16->20 DR 17->20 PA 3->6 ID 3->4 RB 1->5 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ernest Habijan](https://www.buzzerbeater.com/player/55135515/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 17->20 HA 13->20 DR 15->20 RB 4->5 SB 1->4 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Pavel Berdajs](https://www.buzzerbeater.com/player/55135521/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->20 OD 9->12 HA 15->20 DR 14->20 SB 3->4 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Bogdan Perc](https://www.buzzerbeater.com/player/55135523/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 5->6 HA 2->3 IS 9->16 ID 5->16 RB 10->12 SB 7->13 | cannot close ID gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Bojan Mikša](https://www.buzzerbeater.com/player/55135527/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 14->18 OD 5->11 HA 8->20 DR 6->20 ID 1->6 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Aljoša Leskovar](https://www.buzzerbeater.com/player/55135535/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 3->20 OD 8->12 HA 9->20 DR 7->20 IS 3->6 RB 4->5 SB 3->4 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nastja Petrak](https://www.buzzerbeater.com/player/55135542/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 9->11 HA 6->20 DR 7->20 RB 3->6 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Krištof Simonc](https://www.buzzerbeater.com/player/55135547/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 HA 13->20 DR 14->20 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nik Bojovič](https://www.buzzerbeater.com/player/55135551/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->20 OD 10->12 HA 8->20 DR 8->20 ID 2->4 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Žarko Lovriha](https://www.buzzerbeater.com/player/55135556/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->20 OD 11->12 HA 13->20 DR 11->20 RB 2->5 | cannot close OD gap 4 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Josip Repe](https://www.buzzerbeater.com/player/55135588/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 11->18 JR 4->5 OD 10->11 HA 7->20 DR 10->20 | cannot close OD gap 4 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tejo Purg](https://www.buzzerbeater.com/player/55135603/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 3->20 OD 10->12 HA 5->20 DR 3->20 RB 4->5 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Mark Pavlović](https://www.buzzerbeater.com/player/55135604/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 10->12 HA 9->20 DR 8->20 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Lan Tominc](https://www.buzzerbeater.com/player/55135605/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->20 HA 15->20 DR 15->20 SB 3->4 | cannot close OD gap 3 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Božo Miklavčič](https://www.buzzerbeater.com/player/55135607/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 9->20 HA 7->20 DR 7->20 ID 3->4 RB 4->5 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Zmago Volčini](https://www.buzzerbeater.com/player/55135617/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 5->20 OD 7->12 HA 10->20 DR 9->20 IS 1->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nenad Dajčman](https://www.buzzerbeater.com/player/55135620/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 1->6 IS 9->16 ID 8->16 RB 9->12 SB 8->13 | cannot close ID gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Emil Vrhovnik](https://www.buzzerbeater.com/player/55135627/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 10->20 OD 10->12 HA 18->20 DR 19->20 PA 4->6 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Boško Bingl](https://www.buzzerbeater.com/player/55135629/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 13->16 ID 11->16 SB 11->13 | cannot close ID gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ferdinand Habjan](https://www.buzzerbeater.com/player/55135637/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 8->11 HA 8->20 DR 10->20 SB 3->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jure Podgornik](https://www.buzzerbeater.com/player/55135640/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 8->20 OD 9->12 HA 8->20 DR 11->20 RB 1->5 SB 1->4 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Žare Miš](https://www.buzzerbeater.com/player/55135644/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 7->11 HA 10->20 DR 11->20 ID 5->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Lojze Kordiš](https://www.buzzerbeater.com/player/55135668/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 3->11 HA 4->20 DR 8->20 RB 3->6 SB 5->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Edo Vitrih](https://www.buzzerbeater.com/player/55135669/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 JR 4->5 OD 6->11 HA 12->20 DR 14->20 SB 5->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Vasja Pungartnik](https://www.buzzerbeater.com/player/55135676/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 8->12 HA 11->20 DR 10->20 RB 3->5 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Matej Žmaher](https://www.buzzerbeater.com/player/55135677/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 9->11 HA 10->20 DR 12->20 PA 3->4 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Grega Fabčič](https://www.buzzerbeater.com/player/55135693/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 10->11 HA 10->20 DR 9->20 SB 4->6 | cannot close OD gap 4 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Mido Silovšek](https://www.buzzerbeater.com/player/55135710/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 10->12 HA 9->20 DR 10->20 PA 4->6 IS 3->6 ID 1->4 RB 3->5 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Sergej Celestin](https://www.buzzerbeater.com/player/55135713/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 13->16 ID 11->16 RB 8->12 SB 6->13 | cannot close ID gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nenad Vehovar](https://www.buzzerbeater.com/player/55135715/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 8->12 HA 7->20 DR 9->20 PA 5->6 IS 2->6 ID 1->4 RB 4->5 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Stipe Butrin](https://www.buzzerbeater.com/player/55135721/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 12->20 OD 10->12 HA 15->20 DR 17->20 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Luka Anzelj](https://www.buzzerbeater.com/player/55135744/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 5->12 HA 9->20 DR 10->20 RB 3->5 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jaka Kunc](https://www.buzzerbeater.com/player/55135754/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->18 OD 2->11 HA 8->20 DR 7->20 RB 3->6 SB 4->6 | cannot close OD gap 12 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Timotej Merl](https://www.buzzerbeater.com/player/55135756/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 9->12 HA 7->20 DR 9->20 ID 1->4 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Emil Skerijanc](https://www.buzzerbeater.com/player/55135764/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 8->11 HA 4->20 DR 8->20 SB 2->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Simon Simič](https://www.buzzerbeater.com/player/55135765/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->20 JR 4->5 OD 9->12 HA 4->20 DR 6->20 IS 5->6 SB 2->4 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dare Klevže](https://www.buzzerbeater.com/player/55135788/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 10->11 HA 8->20 DR 5->20 IS 5->7 SB 5->6 | cannot close OD gap 4 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Sergej Grizold](https://www.buzzerbeater.com/player/55135805/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 12->18 OD 8->11 HA 17->20 DR 17->20 SB 5->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dalibor Hrnčič](https://www.buzzerbeater.com/player/55135806/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 3->11 HA 10->20 DR 8->20 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tomi Bukovec](https://www.buzzerbeater.com/player/55135817/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 9->12 HA 14->20 DR 14->20 PA 3->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Oliver Volavšek](https://www.buzzerbeater.com/player/55135819/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 9->12 HA 10->20 DR 6->20 ID 2->4 RB 3->5 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jure Anžic](https://www.buzzerbeater.com/player/55135821/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 13->18 JR 2->5 HA 13->20 DR 13->20 | cannot close OD gap 3 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Šime Mohorič](https://www.buzzerbeater.com/player/55135825/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 11->20 OD 7->12 HA 10->20 DR 6->20 PA 1->6 IS 3->6 ID 1->4 SB 1->4 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Damir Milošević](https://www.buzzerbeater.com/player/55135837/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 9->12 HA 9->20 DR 9->20 IS 3->6 RB 3->5 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Vasja Pintarič](https://www.buzzerbeater.com/player/55135841/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->18 JR 4->5 OD 7->11 HA 9->20 DR 3->20 ID 3->6 SB 3->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Luka Nadarević](https://www.buzzerbeater.com/player/55135843/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 10->12 HA 1->20 DR 8->20 ID 3->4 RB 3->5 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Emanuel Gerzina](https://www.buzzerbeater.com/player/55135848/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 2->18 OD 3->11 HA 10->20 DR 6->20 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ožbolt Zabukovec](https://www.buzzerbeater.com/player/55135858/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JR 1->2 OD 2->4 IS 9->16 ID 9->16 RB 10->12 SB 2->13 | cannot close ID gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Črtomir Celestino](https://www.buzzerbeater.com/player/55135859/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->20 OD 9->12 HA 9->20 DR 10->20 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Aleksej Kravos](https://www.buzzerbeater.com/player/55135860/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 4->12 HA 7->20 DR 10->20 IS 3->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Gabrijel Brezavšek](https://www.buzzerbeater.com/player/55135877/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 3->11 HA 5->20 DR 3->20 RB 5->6 SB 5->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nejc Petkovšek](https://www.buzzerbeater.com/player/55135882/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 JR 4->5 OD 6->11 HA 10->20 DR 7->20 RB 3->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Grga Članković](https://www.buzzerbeater.com/player/55135886/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 9->16 ID 10->16 RB 10->12 SB 2->13 | cannot close ID gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Taj Miklavžina](https://www.buzzerbeater.com/player/55135893/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 JR 4->5 OD 9->11 HA 4->20 DR 8->20 PA 3->4 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Mirko Marolt](https://www.buzzerbeater.com/player/55135894/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 9->20 OD 7->12 HA 11->20 DR 11->20 PA 5->6 ID 2->4 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tonček Mastinšek](https://www.buzzerbeater.com/player/55135906/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 6->11 HA 10->20 DR 4->20 PA 3->4 SB 5->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tonček Perković](https://www.buzzerbeater.com/player/55135907/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 5->6 OD 3->4 PA 3->4 IS 7->16 ID 7->16 RB 6->12 SB 5->13 | cannot close ID gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Franc Batina](https://www.buzzerbeater.com/player/55135912/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 8->20 OD 9->12 HA 7->20 DR 8->20 IS 3->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ivor Kamnar](https://www.buzzerbeater.com/player/55135923/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 8->11 HA 8->20 DR 4->20 ID 5->6 SB 4->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Nastja Jerin](https://www.buzzerbeater.com/player/55135927/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 9->18 OD 8->11 HA 3->20 DR 3->20 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Stane Braznik](https://www.buzzerbeater.com/player/55135928/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 OD 2->11 HA 7->20 DR 7->20 | cannot close OD gap 12 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Domen Žitnik](https://www.buzzerbeater.com/player/55135929/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->18 JR 2->5 OD 8->11 HA 7->20 DR 8->20 PA 3->4 ID 3->6 SB 3->6 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Simon Žinić](https://www.buzzerbeater.com/player/55135931/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 7->12 HA 7->20 DR 9->20 IS 3->6 ID 2->4 RB 3->5 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ahmed Mozetič](https://www.buzzerbeater.com/player/55135935/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 4->20 OD 9->12 HA 9->20 DR 8->20 PA 4->6 IS 5->6 RB 2->5 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ive Pečnik](https://www.buzzerbeater.com/player/55135936/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 9->11 HA 7->20 DR 10->20 IS 4->7 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Aljoša Kožamelj](https://www.buzzerbeater.com/player/55135941/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->18 OD 7->11 HA 10->20 DR 2->20 PA 3->4 RB 3->6 SB 5->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Arne Peter](https://www.buzzerbeater.com/player/55135946/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 1->18 JR 2->5 OD 7->11 HA 4->20 DR 5->20 PA 2->4 IS 5->7 ID 3->6 RB 4->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Damjan Verhovec](https://www.buzzerbeater.com/player/55135950/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->18 JR 4->5 OD 5->11 HA 4->20 DR 3->20 IS 6->7 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jaro Nikolaj](https://www.buzzerbeater.com/player/55135959/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 4->12 HA 14->20 DR 15->20 RB 4->5 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tine Herič](https://www.buzzerbeater.com/player/55135967/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 14->20 JR 2->5 OD 7->12 HA 18->20 DR 19->20 RB 3->5 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Urh Simonovič](https://www.buzzerbeater.com/player/55135988/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 4->11 HA 11->20 DR 11->20 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tadej Volavec](https://www.buzzerbeater.com/player/55135991/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 10->18 HA 12->20 DR 14->20 | cannot close OD gap 3 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Borut Jesih](https://www.buzzerbeater.com/player/55135994/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 8->18 HA 12->20 DR 10->20 IS 6->7 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Darko Pirjevec](https://www.buzzerbeater.com/player/55135999/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 15->18 OD 7->11 HA 9->20 DR 8->20 ID 5->6 RB 5->6 SB 3->6 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Rožle Vidmar](https://www.buzzerbeater.com/player/55136001/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 9->11 HA 9->20 DR 8->20 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Emanuel Osterverh](https://www.buzzerbeater.com/player/55136014/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 11->20 OD 8->12 HA 12->20 DR 14->20 ID 3->4 SB 1->4 | cannot close OD gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Siniša Pezderc](https://www.buzzerbeater.com/player/55136016/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | OD 2->4 IS 13->16 ID 10->16 SB 10->13 | cannot close ID gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [France Galič](https://www.buzzerbeater.com/player/55137747/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | IS 11->16 ID 9->16 RB 9->12 SB 7->13 | cannot close ID gap 7 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tejo Serne](https://www.buzzerbeater.com/player/55137753/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->20 HA 17->20 DR 17->20 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Dušan Golob](https://www.buzzerbeater.com/player/55137756/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 6->11 HA 10->20 DR 5->20 RB 4->6 SB 4->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Ivo Žirovnik](https://www.buzzerbeater.com/player/55157872/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 OD 3->11 HA 8->20 DR 9->20 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Zdenko Lovec](https://www.buzzerbeater.com/player/55159037/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | OD 3->4 IS 12->16 ID 15->16 RB 9->12 SB 10->13 | cannot close ID gap 1 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Vid Glišić](https://www.buzzerbeater.com/player/55159210/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 2->11 HA 8->20 DR 9->20 | cannot close OD gap 12 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Vinko Vogrič](https://www.buzzerbeater.com/player/55159397/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 HA 11->20 DR 11->20 SB 1->4 | cannot close OD gap 3 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Lovro Gale](https://www.buzzerbeater.com/player/55159508/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 14->20 OD 9->12 HA 13->20 DR 18->20 SB 3->4 | cannot close OD gap 6 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tibor Levičar](https://www.buzzerbeater.com/player/55159713/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 10->20 OD 10->12 HA 10->20 DR 12->20 IS 4->6 | cannot close OD gap 5 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Matija Podlesnikar](https://www.buzzerbeater.com/player/55160286/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 OD 5->11 HA 9->20 DR 8->20 PA 3->4 ID 3->6 RB 5->6 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Klemen Plut](https://www.buzzerbeater.com/player/55160442/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 16->20 OD 5->12 HA 16->20 DR 18->20 RB 3->5 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Hotimir Šporn](https://www.buzzerbeater.com/player/55160522/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 2->18 OD 3->11 HA 10->20 DR 10->20 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Aleš Pintar](https://www.buzzerbeater.com/player/55161248/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 12->20 OD 11->12 HA 12->20 DR 11->20 IS 5->6 RB 4->5 SB 3->4 | cannot close OD gap 4 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Otokar Ujčić](https://www.buzzerbeater.com/player/55161353/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 14->20 HA 14->20 DR 14->20 IS 3->6 | cannot close OD gap 2 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jaša Pulko](https://www.buzzerbeater.com/player/55167761/overview.aspx) | 21 | mkt72-outside-2 | AT-RISK | JS 13->20 OD 11->12 HA 15->20 DR 16->20 | cannot close OD gap 4 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Admir Muc](https://www.buzzerbeater.com/player/55173735/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 5->11 HA 6->20 DR 4->20 RB 5->6 | cannot close OD gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Damjan Dukić](https://www.buzzerbeater.com/player/55184529/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 JR 4->5 OD 4->11 HA 8->20 DR 8->20 IS 3->7 RB 4->6 SB 2->6 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tibor Mandelc](https://www.buzzerbeater.com/player/55477784/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 3->11 HA 7->20 DR 4->20 PA 3->4 ID 5->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Sašo Godec](https://www.buzzerbeater.com/player/55493075/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 1->18 JR 1->5 OD 1->11 HA 5->20 DR 5->20 IS 4->7 ID 1->6 RB 5->6 | cannot close OD gap 13 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Bogo Lovinšek](https://www.buzzerbeater.com/player/55493079/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 4->18 JR 1->5 OD 3->11 HA 1->20 DR 6->20 PA 2->4 IS 4->7 RB 4->6 SB 5->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jelko Gašparič](https://www.buzzerbeater.com/player/55742965/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 3->18 OD 1->11 HA 4->20 DR 2->20 IS 4->7 ID 2->6 | cannot close OD gap 13 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Cveto Zakotnik](https://www.buzzerbeater.com/player/55742972/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 6->20 JR 3->5 OD 4->12 HA 5->20 DR 5->20 PA 4->6 IS 2->6 ID 1->4 RB 2->5 SB 1->4 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Darjan Marušič](https://www.buzzerbeater.com/player/55757018/overview.aspx) | 21 | mkt72-outside-1 | AT-RISK | JS 7->20 OD 4->12 HA 2->20 DR 4->20 PA 5->6 IS 1->6 RB 2->5 SB 2->4 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jan Bratušek](https://www.buzzerbeater.com/player/56023178/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 4->11 HA 4->20 DR 7->20 PA 1->4 IS 1->7 RB 4->6 SB 3->6 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Aljoša Ropret](https://www.buzzerbeater.com/player/56023190/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 5->18 OD 4->11 HA 2->20 DR 6->20 PA 1->4 IS 2->7 ID 4->6 RB 4->6 SB 3->6 | cannot close OD gap 10 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Smiljan Knez](https://www.buzzerbeater.com/player/56025535/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 2->18 OD 3->11 HA 4->20 DR 7->20 IS 4->7 ID 2->6 RB 5->6 SB 3->6 | cannot close OD gap 11 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jeremi Perne](https://www.buzzerbeater.com/player/56025537/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 7->18 JR 3->5 OD 1->11 HA 4->20 DR 4->20 PA 1->4 IS 3->7 ID 5->6 RB 5->6 | cannot close OD gap 13 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Kevin Purgar](https://www.buzzerbeater.com/player/56025547/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | OD 3->4 HA 1->3 IS 2->16 ID 7->16 RB 6->12 SB 7->13 | cannot close ID gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Tonček Pakiž](https://www.buzzerbeater.com/player/56026637/overview.aspx) | 21 | mkt72-inside-2 | AT-RISK | JS 1->6 OD 1->4 IS 7->16 ID 7->16 RB 5->12 SB 7->13 | cannot close ID gap 9 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Jaro Culič](https://www.buzzerbeater.com/player/56031608/overview.aspx) | 21 | mkt72-wing-1 | AT-RISK | JS 6->18 JR 4->5 OD 6->11 HA 7->20 DR 2->20 PA 3->4 RB 5->6 | cannot close OD gap 8 in 0 weeks before playoffs (wk 7) (≤0.0) |
| [Gojc Povše](https://www.buzzerbeater.com/player/55688839/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 2->3 IS 5->6 ID 4->12 SB 5->8 | ID behind the big-man early-defense track |
| [Joža Štor](https://www.buzzerbeater.com/player/55688840/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 7->9 HA 3->9 DR 7->9 IS 5->6 | feeders behind (HA+DR 10 vs track 28) |
| [Žiga Dvorančič](https://www.buzzerbeater.com/player/55688841/overview.aspx) | 18 | mkt72-outside-2 | WATCH | OD 6->11 IS 3->5 SB 2->3 | feeders behind (HA+DR 24 vs track 36) |
| [Artur Štrucl](https://www.buzzerbeater.com/player/55688847/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->6 JR 2->4 OD 5->9 HA 2->9 DR 2->9 ID 2->5 RB 2->5 | feeders behind (HA+DR 4 vs track 28) |
| [Jošt Jenštrle](https://www.buzzerbeater.com/player/55688849/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 10->12 IS 2->5 | feeders behind (HA+DR 22 vs track 34) |
| [Ciril Ropoša](https://www.buzzerbeater.com/player/55688859/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 8->9 | feeders behind (HA+DR 18 vs track 28) |
| [Janez Gotar](https://www.buzzerbeater.com/player/55688879/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 5->11 HA 4->12 DR 5->11 IS 3->5 ID 1->3 | feeders behind (HA+DR 9 vs track 34) |
| [Anel Jenštrle](https://www.buzzerbeater.com/player/55688889/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->9 HA 2->9 DR 6->9 SB 2->5 | feeders behind (HA+DR 8 vs track 28) |
| [Marjan Dvorančič](https://www.buzzerbeater.com/player/55688890/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 PA 2->3 ID 6->12 SB 3->8 | ID behind the big-man early-defense track |
| [Žan Novičić](https://www.buzzerbeater.com/player/55688897/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 PA 1->3 | feeders behind (HA+DR 20 vs track 28) |
| [Maksimilijan Kosmatin](https://www.buzzerbeater.com/player/55688911/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 2->9 OD 7->11 HA 3->12 DR 7->11 IS 3->5 RB 3->4 | feeders behind (HA+DR 10 vs track 34) |
| [Anže Wolfgruber](https://www.buzzerbeater.com/player/55688912/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 10->12 RB 3->4 | feeders behind (HA+DR 21 vs track 34) |
| [Črtomir Petek](https://www.buzzerbeater.com/player/55688917/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 7->12 DR 5->11 IS 2->5 | feeders behind (HA+DR 12 vs track 34) |
| [Matija Majerhofer](https://www.buzzerbeater.com/player/55688918/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 9->12 | ID behind the big-man early-defense track |
| [Teo Celestino](https://www.buzzerbeater.com/player/55688941/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 JR 3->4 OD 7->11 HA 7->12 DR 3->11 PA 3->5 IS 2->5 | feeders behind (HA+DR 10 vs track 34) |
| [Žak Lenardič](https://www.buzzerbeater.com/player/55688942/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 7->11 HA 7->12 DR 2->11 PA 4->5 IS 1->5 | feeders behind (HA+DR 9 vs track 34) |
| [Branko Bauer](https://www.buzzerbeater.com/player/55688947/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 10->12 DR 8->11 | feeders behind (HA+DR 18 vs track 34) |
| [Cene Kacin](https://www.buzzerbeater.com/player/55688954/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 ID 3->5 | feeders behind (HA+DR 20 vs track 28) |
| [Miha Auer](https://www.buzzerbeater.com/player/55688964/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 4->9 DR 4->9 ID 2->5 | feeders behind (HA+DR 8 vs track 28) |
| [Vojan Humek](https://www.buzzerbeater.com/player/55688971/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 | feeders behind (HA+DR 22 vs track 28) |
| [Peter Blaj](https://www.buzzerbeater.com/player/55688972/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 4->9 DR 7->9 PA 2->3 IS 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Nedžad Avbelj](https://www.buzzerbeater.com/player/55688974/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 6->12 DR 3->11 PA 3->5 IS 2->5 ID 1->3 RB 1->4 | feeders behind (HA+DR 9 vs track 34) |
| [Velimir Šimen](https://www.buzzerbeater.com/player/55688989/overview.aspx) | 18 | mkt72-outside-2 | WATCH | OD 6->11 HA 11->12 ID 2->3 | feeders behind (HA+DR 24 vs track 36) |
| [Jaro Bajc](https://www.buzzerbeater.com/player/55688996/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 7->12 DR 2->11 IS 3->5 ID 2->3 RB 1->4 SB 2->3 | feeders behind (HA+DR 9 vs track 34) |
| [Tadej Šurev](https://www.buzzerbeater.com/player/55689005/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 4->9 HA 8->9 DR 4->9 IS 4->6 ID 3->5 RB 1->5 | feeders behind (HA+DR 12 vs track 28) |
| [Luka Anzeljc](https://www.buzzerbeater.com/player/55689016/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->9 DR 6->9 ID 4->5 | feeders behind (HA+DR 15 vs track 28) |
| [Peter Fabčič](https://www.buzzerbeater.com/player/55689030/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 5->9 HA 7->9 DR 4->9 RB 2->5 SB 4->5 | feeders behind (HA+DR 11 vs track 28) |
| [Rok Dornig](https://www.buzzerbeater.com/player/55689031/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 5->9 HA 7->9 DR 8->9 | feeders behind (HA+DR 15 vs track 28) |
| [Uroš Kreslin](https://www.buzzerbeater.com/player/55689037/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 7->11 HA 5->12 DR 7->11 IS 3->5 SB 1->3 | feeders behind (HA+DR 12 vs track 34) |
| [Velimir Cimirotić](https://www.buzzerbeater.com/player/55689042/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 5->11 HA 4->12 DR 6->11 IS 4->5 SB 1->3 | feeders behind (HA+DR 10 vs track 34) |
| [Vanja Ahačevčič](https://www.buzzerbeater.com/player/55689044/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 7->9 | feeders behind (HA+DR 18 vs track 28) |
| [Valerij Rojec](https://www.buzzerbeater.com/player/55689045/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->9 OD 7->11 HA 6->12 DR 2->11 PA 4->5 SB 1->3 | feeders behind (HA+DR 8 vs track 34) |
| [Žane Jemec](https://www.buzzerbeater.com/player/55689047/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->9 HA 6->9 DR 4->9 PA 2->3 | feeders behind (HA+DR 10 vs track 28) |
| [Bogo Žinko](https://www.buzzerbeater.com/player/55689052/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 3->4 OD 6->9 IS 1->6 | feeders behind (HA+DR 24 vs track 28) |
| [Vid Potkonjak](https://www.buzzerbeater.com/player/55689076/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 3->9 HA 7->9 DR 4->9 RB 1->5 SB 1->5 | feeders behind (HA+DR 11 vs track 28) |
| [Tomaž Kerčan](https://www.buzzerbeater.com/player/55689082/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->9 RB 4->5 | feeders behind (HA+DR 23 vs track 28) |
| [Dario Maher](https://www.buzzerbeater.com/player/55689089/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 8->9 OD 7->11 HA 7->12 DR 8->11 RB 2->4 SB 1->3 | feeders behind (HA+DR 15 vs track 34) |
| [Rožle Grilec](https://www.buzzerbeater.com/player/55689102/overview.aspx) | 18 | mkt72-outside-2 | WATCH | JS 8->9 OD 6->11 HA 11->12 | feeders behind (HA+DR 23 vs track 36) |
| [Boško Korde](https://www.buzzerbeater.com/player/55689115/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 6->11 HA 8->12 DR 8->11 IS 4->5 RB 1->4 | feeders behind (HA+DR 16 vs track 34) |
| [Semir Flaker](https://www.buzzerbeater.com/player/55689116/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 8->11 HA 9->12 DR 8->11 IS 3->5 RB 2->4 | feeders behind (HA+DR 17 vs track 34) |
| [Oliver Mantelj](https://www.buzzerbeater.com/player/55689117/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 8->9 OD 7->11 HA 7->12 DR 10->11 | feeders behind (HA+DR 17 vs track 34) |
| [Cvetko Dobrinja](https://www.buzzerbeater.com/player/55689121/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 7->9 DR 5->9 PA 2->3 IS 3->6 ID 4->5 RB 3->5 SB 4->5 | feeders behind (HA+DR 12 vs track 28) |
| [Uroš Smrdel](https://www.buzzerbeater.com/player/55689124/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->9 HA 8->9 DR 8->9 IS 3->6 | feeders behind (HA+DR 16 vs track 28) |
| [Jožef Gams](https://www.buzzerbeater.com/player/55689130/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 ID 2->5 | feeders behind (HA+DR 22 vs track 28) |
| [Cene Vozelj](https://www.buzzerbeater.com/player/55689146/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 5->9 HA 1->9 DR 5->9 IS 4->6 RB 1->5 | feeders behind (HA+DR 6 vs track 28) |
| [Erik Berk](https://www.buzzerbeater.com/player/55689159/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 | feeders behind (HA+DR 20 vs track 28) |
| [Tibor Kozina](https://www.buzzerbeater.com/player/55689174/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 7->11 HA 7->12 DR 5->11 | feeders behind (HA+DR 12 vs track 34) |
| [Hotimir Tomažič](https://www.buzzerbeater.com/player/55689190/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 4->12 DR 4->11 PA 3->5 IS 3->5 RB 1->4 SB 1->3 | feeders behind (HA+DR 8 vs track 34) |
| [Boštjan Pukšič](https://www.buzzerbeater.com/player/55689194/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 7->11 HA 5->12 DR 3->11 IS 3->5 RB 1->4 | feeders behind (HA+DR 8 vs track 34) |
| [Dušan Peterman](https://www.buzzerbeater.com/player/55689200/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 7->12 RB 4->7 SB 4->8 | ID behind the big-man early-defense track |
| [Nikita Majarič](https://www.buzzerbeater.com/player/55689204/overview.aspx) | 18 | mkt72-inside-2 | WATCH | HA 1->2 IS 5->6 ID 5->12 RB 3->7 SB 6->8 | ID behind the big-man early-defense track |
| [Anže Fekonja](https://www.buzzerbeater.com/player/55689209/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 5->9 HA 1->9 DR 5->9 IS 5->6 RB 3->5 SB 3->5 | feeders behind (HA+DR 6 vs track 28) |
| [Gaj Jelovčan](https://www.buzzerbeater.com/player/55689218/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 8->9 OD 6->11 HA 11->12 DR 10->11 | feeders behind (HA+DR 21 vs track 34) |
| [Matjaž Lovro](https://www.buzzerbeater.com/player/55689231/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 1->4 OD 5->9 HA 1->9 DR 8->9 PA 1->3 ID 3->5 | feeders behind (HA+DR 9 vs track 28) |
| [Jaro Grabić](https://www.buzzerbeater.com/player/55689237/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 3->9 HA 4->9 DR 8->9 SB 1->5 | feeders behind (HA+DR 12 vs track 28) |
| [Pepe Tome](https://www.buzzerbeater.com/player/55689240/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 8->9 OD 8->11 HA 5->12 DR 8->11 RB 3->4 | feeders behind (HA+DR 13 vs track 34) |
| [Jakob Velečič](https://www.buzzerbeater.com/player/55689245/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 5->9 HA 2->9 DR 2->9 IS 5->6 SB 4->5 | feeders behind (HA+DR 4 vs track 28) |
| [Tugo Krašovc](https://www.buzzerbeater.com/player/55689247/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->9 OD 7->11 HA 7->12 DR 6->11 IS 1->5 | feeders behind (HA+DR 13 vs track 34) |
| [Pavel Purger](https://www.buzzerbeater.com/player/55689258/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 IS 3->6 ID 4->12 SB 7->8 | ID behind the big-man early-defense track |
| [Andraž Kosec](https://www.buzzerbeater.com/player/55689261/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 1->4 OD 4->9 HA 3->9 DR 2->9 ID 4->5 RB 3->5 | feeders behind (HA+DR 5 vs track 28) |
| [Nastja Repe](https://www.buzzerbeater.com/player/55689268/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 8->9 OD 9->11 HA 8->12 DR 8->11 PA 3->5 ID 2->3 | feeders behind (HA+DR 16 vs track 34) |
| [Aleš Kupčič](https://www.buzzerbeater.com/player/55689271/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 7->11 HA 6->12 DR 6->11 PA 3->5 IS 2->5 ID 2->3 SB 2->3 | feeders behind (HA+DR 12 vs track 34) |
| [Anel Volk](https://www.buzzerbeater.com/player/55689277/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->6 JR 2->4 OD 6->9 HA 3->9 DR 6->9 IS 3->6 SB 3->5 | feeders behind (HA+DR 9 vs track 28) |
| [Mišo Lauš](https://www.buzzerbeater.com/player/55689282/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 4->12 DR 7->11 IS 4->5 | feeders behind (HA+DR 11 vs track 34) |
| [Ermin Hrženjak](https://www.buzzerbeater.com/player/55689290/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 7->9 DR 8->9 IS 4->6 ID 4->5 | feeders behind (HA+DR 15 vs track 28) |
| [Boško Srne](https://www.buzzerbeater.com/player/55689291/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 6->11 HA 7->12 DR 7->11 RB 3->4 | feeders behind (HA+DR 14 vs track 34) |
| [Zdravko Smrdelj](https://www.buzzerbeater.com/player/55689300/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 5->9 DR 3->9 RB 3->5 | feeders behind (HA+DR 8 vs track 28) |
| [Boško Grims](https://www.buzzerbeater.com/player/55689308/overview.aspx) | 18 | mkt72-inside-2 | WATCH | PA 2->3 ID 7->12 SB 5->8 | ID behind the big-man early-defense track |
| [Lenart Hanc](https://www.buzzerbeater.com/player/55689309/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 2->4 OD 4->9 HA 6->9 DR 8->9 | feeders behind (HA+DR 14 vs track 28) |
| [Žiga Celestin](https://www.buzzerbeater.com/player/55689310/overview.aspx) | 18 | mkt72-inside-2 | WATCH | IS 3->6 ID 7->12 RB 6->7 SB 6->8 | ID behind the big-man early-defense track |
| [Šime Bebler](https://www.buzzerbeater.com/player/55689320/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 2->4 OD 6->9 HA 5->9 DR 7->9 IS 5->6 RB 3->5 | feeders behind (HA+DR 12 vs track 28) |
| [Dušan Ovšenek](https://www.buzzerbeater.com/player/55689336/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 6->9 HA 7->9 DR 5->9 IS 5->6 ID 3->5 RB 4->5 SB 2->5 | feeders behind (HA+DR 12 vs track 28) |
| [Rajko Vdovc](https://www.buzzerbeater.com/player/55689337/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 SB 3->5 | feeders behind (HA+DR 18 vs track 28) |
| [Jadranko Tomašek](https://www.buzzerbeater.com/player/55689338/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 JR 3->4 OD 4->9 HA 3->9 DR 6->9 IS 5->6 RB 1->5 | feeders behind (HA+DR 9 vs track 28) |
| [Žan Ostojić](https://www.buzzerbeater.com/player/55689341/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 3->9 SB 2->5 | feeders behind (HA+DR 19 vs track 28) |
| [Vid Ogorelc](https://www.buzzerbeater.com/player/55689378/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 5->9 DR 5->9 ID 2->5 | feeders behind (HA+DR 10 vs track 28) |
| [Džoni Javor](https://www.buzzerbeater.com/player/55689403/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 7->9 HA 7->9 DR 3->9 ID 4->5 RB 3->5 | feeders behind (HA+DR 10 vs track 28) |
| [Nikola Majerle](https://www.buzzerbeater.com/player/55689404/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 11->12 | feeders behind (HA+DR 22 vs track 34) |
| [Pepe Pršina](https://www.buzzerbeater.com/player/55689408/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 3->12 DR 7->11 PA 4->5 IS 4->5 RB 3->4 | feeders behind (HA+DR 10 vs track 34) |
| [Aljaž Teraž](https://www.buzzerbeater.com/player/55689414/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 6->9 DR 4->9 IS 5->6 RB 4->5 SB 4->5 | feeders behind (HA+DR 10 vs track 28) |
| [Drago Gotar](https://www.buzzerbeater.com/player/55689422/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 3->9 HA 4->9 DR 6->9 IS 4->6 RB 4->5 SB 3->5 | feeders behind (HA+DR 10 vs track 28) |
| [Vid Lipič](https://www.buzzerbeater.com/player/55689434/overview.aspx) | 18 | mkt72-inside-2 | WATCH | IS 5->6 ID 6->12 SB 7->8 | ID behind the big-man early-defense track |
| [Semir Jeram](https://www.buzzerbeater.com/player/55689449/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->9 HA 8->9 ID 2->5 SB 3->5 | feeders behind (HA+DR 17 vs track 28) |
| [Darko Krklec](https://www.buzzerbeater.com/player/55689463/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 3->9 DR 7->9 ID 4->5 RB 4->5 | feeders behind (HA+DR 10 vs track 28) |
| [Uroš Potočin](https://www.buzzerbeater.com/player/55689465/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 | feeders behind (HA+DR 22 vs track 28) |
| [Lenart Čepič](https://www.buzzerbeater.com/player/55689466/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 3->9 DR 7->9 RB 4->5 | feeders behind (HA+DR 10 vs track 28) |
| [Nikola Majarič](https://www.buzzerbeater.com/player/55689468/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 4->9 HA 5->9 DR 5->9 ID 2->5 RB 3->5 SB 1->5 | feeders behind (HA+DR 10 vs track 28) |
| [Žak Meško](https://www.buzzerbeater.com/player/55689472/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->9 HA 3->9 DR 4->9 IS 3->6 ID 3->5 SB 4->5 | feeders behind (HA+DR 7 vs track 28) |
| [Amir Štucin](https://www.buzzerbeater.com/player/55689474/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 3->9 HA 2->9 DR 5->9 IS 3->6 | feeders behind (HA+DR 7 vs track 28) |
| [Boštjan Slapar](https://www.buzzerbeater.com/player/55689476/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 3->9 HA 3->9 DR 5->9 IS 3->6 ID 4->5 | feeders behind (HA+DR 8 vs track 28) |
| [Ažbe Germic](https://www.buzzerbeater.com/player/55689482/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 3->4 OD 6->9 HA 2->9 DR 6->9 IS 4->6 ID 3->5 SB 4->5 | feeders behind (HA+DR 8 vs track 28) |
| [Leo Gačič](https://www.buzzerbeater.com/player/55689492/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 4->12 DR 5->11 RB 2->4 | feeders behind (HA+DR 9 vs track 34) |
| [Bane Pavšič](https://www.buzzerbeater.com/player/55689493/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 4->9 HA 7->9 DR 3->9 IS 2->6 RB 4->5 | feeders behind (HA+DR 10 vs track 28) |
| [Adrijan Supančič](https://www.buzzerbeater.com/player/55689503/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 4->9 HA 3->9 DR 4->9 IS 5->6 | feeders behind (HA+DR 7 vs track 28) |
| [Sandi Macun](https://www.buzzerbeater.com/player/55689558/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->9 HA 5->9 DR 7->9 IS 4->6 ID 3->5 | feeders behind (HA+DR 12 vs track 28) |
| [Ožbej Predalić](https://www.buzzerbeater.com/player/55710561/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 7->12 DR 5->11 IS 4->5 RB 2->4 | feeders behind (HA+DR 12 vs track 34) |
| [Stribor Jaunik](https://www.buzzerbeater.com/player/55710628/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 4->12 SB 6->8 | ID behind the big-man early-defense track |
| [Gabrijel Sagmajster](https://www.buzzerbeater.com/player/55710711/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 5->9 DR 1->9 IS 4->6 ID 3->5 RB 4->5 | feeders behind (HA+DR 6 vs track 28) |
| [Gaber Kordiš](https://www.buzzerbeater.com/player/55711713/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 9->11 HA 8->12 DR 9->11 IS 2->5 | feeders behind (HA+DR 17 vs track 34) |
| [Žak Plišić](https://www.buzzerbeater.com/player/55712420/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 | feeders behind (HA+DR 20 vs track 28) |
| [Saša Vižintin](https://www.buzzerbeater.com/player/55712894/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 2->4 OD 3->9 HA 6->9 DR 1->9 PA 1->3 IS 5->6 ID 3->5 RB 4->5 | feeders behind (HA+DR 7 vs track 28) |
| [Adam Perc](https://www.buzzerbeater.com/player/55713033/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 8->9 DR 7->9 | feeders behind (HA+DR 15 vs track 28) |
| [Bernard Lovrek](https://www.buzzerbeater.com/player/55713935/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 3->4 OD 3->9 HA 5->9 DR 8->9 | feeders behind (HA+DR 13 vs track 28) |
| [Žane Kastelic](https://www.buzzerbeater.com/player/55714167/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 SB 4->5 | feeders behind (HA+DR 19 vs track 28) |
| [Zlatimir Mežič](https://www.buzzerbeater.com/player/55714653/overview.aspx) | 18 | mkt72-outside-1 | WATCH | OD 7->11 HA 6->12 DR 7->11 PA 2->5 IS 1->5 RB 3->4 | feeders behind (HA+DR 13 vs track 34) |
| [Oton Pevec](https://www.buzzerbeater.com/player/55714661/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 6->9 DR 6->9 IS 1->6 | feeders behind (HA+DR 12 vs track 28) |
| [Anej Lampič](https://www.buzzerbeater.com/player/55715299/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 7->12 DR 6->11 RB 3->4 | feeders behind (HA+DR 13 vs track 34) |
| [Ahmed Grims](https://www.buzzerbeater.com/player/55717345/overview.aspx) | 18 | mkt72-inside-2 | WATCH | PA 2->3 ID 6->12 SB 7->8 | ID behind the big-man early-defense track |
| [Zlatko Perš](https://www.buzzerbeater.com/player/55757021/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 4->9 HA 7->9 DR 7->9 IS 5->6 RB 1->5 | feeders behind (HA+DR 14 vs track 28) |
| [Jani Korenc](https://www.buzzerbeater.com/player/55757026/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 7->12 DR 4->11 IS 1->5 ID 2->3 | feeders behind (HA+DR 11 vs track 34) |
| [Viljem Dajčman](https://www.buzzerbeater.com/player/55967309/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 5->9 HA 7->9 DR 6->9 IS 4->6 ID 4->5 RB 3->5 SB 1->5 | feeders behind (HA+DR 13 vs track 28) |
| [Stipe Zupanc](https://www.buzzerbeater.com/player/55967312/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 7->11 HA 6->12 DR 4->11 | feeders behind (HA+DR 10 vs track 34) |
| [Davor Lenasi](https://www.buzzerbeater.com/player/55967313/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 6->9 DR 4->9 | feeders behind (HA+DR 10 vs track 28) |
| [Janez Zadobovšek](https://www.buzzerbeater.com/player/55967318/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 2->4 OD 7->9 HA 7->9 DR 6->9 IS 4->6 ID 3->5 | feeders behind (HA+DR 13 vs track 28) |
| [Elvis Pavić](https://www.buzzerbeater.com/player/55967322/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->9 HA 7->9 DR 3->9 PA 1->3 IS 5->6 ID 4->5 | feeders behind (HA+DR 10 vs track 28) |
| [Miško Srne](https://www.buzzerbeater.com/player/55967323/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 6->9 HA 6->9 DR 7->9 IS 4->6 SB 4->5 | feeders behind (HA+DR 13 vs track 28) |
| [Bojan Lesnik](https://www.buzzerbeater.com/player/55967327/overview.aspx) | 18 | mkt72-inside-2 | WATCH | PA 1->3 ID 3->12 RB 6->7 SB 6->8 | ID behind the big-man early-defense track |
| [Jaka Hodalič](https://www.buzzerbeater.com/player/55967329/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->9 HA 5->9 DR 7->9 RB 4->5 | feeders behind (HA+DR 12 vs track 28) |
| [Vilko Štraus](https://www.buzzerbeater.com/player/55967334/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 JR 3->4 OD 7->9 HA 7->9 DR 6->9 IS 5->6 ID 4->5 | feeders behind (HA+DR 13 vs track 28) |
| [Davor Potočki](https://www.buzzerbeater.com/player/55967344/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->9 HA 2->9 DR 3->9 ID 3->5 | feeders behind (HA+DR 5 vs track 28) |
| [Tezej Ružić](https://www.buzzerbeater.com/player/55967345/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 2->3 IS 3->6 ID 7->12 SB 6->8 | ID behind the big-man early-defense track |
| [Timotej Dvoršak](https://www.buzzerbeater.com/player/55967356/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 2->4 OD 3->9 HA 1->9 DR 3->9 ID 2->5 RB 3->5 | feeders behind (HA+DR 4 vs track 28) |
| [Zmago Zablatnik](https://www.buzzerbeater.com/player/55967361/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 4->9 DR 7->9 IS 4->6 | feeders behind (HA+DR 11 vs track 28) |
| [Jovica Benčič](https://www.buzzerbeater.com/player/55967365/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 6->9 HA 7->9 DR 5->9 | feeders behind (HA+DR 12 vs track 28) |
| [Hinko Tosič](https://www.buzzerbeater.com/player/55967369/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->9 HA 3->9 DR 3->9 IS 3->6 | feeders behind (HA+DR 6 vs track 28) |
| [Žan Lovšin](https://www.buzzerbeater.com/player/55967371/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 3->4 OD 6->9 HA 7->9 DR 5->9 | feeders behind (HA+DR 12 vs track 28) |
| [Zlatimir Hander](https://www.buzzerbeater.com/player/55967372/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->9 HA 5->9 DR 7->9 PA 2->3 RB 2->5 | feeders behind (HA+DR 12 vs track 28) |
| [Kristjan Vakaričič](https://www.buzzerbeater.com/player/55967375/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 3->9 HA 4->9 DR 3->9 ID 3->5 | feeders behind (HA+DR 7 vs track 28) |
| [Valen Jenštrle](https://www.buzzerbeater.com/player/55967383/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->9 HA 4->9 DR 4->9 IS 3->6 RB 3->5 | feeders behind (HA+DR 8 vs track 28) |
| [Artur Milosavljević](https://www.buzzerbeater.com/player/55967385/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 4->9 HA 4->9 DR 1->9 RB 3->5 SB 4->5 | feeders behind (HA+DR 5 vs track 28) |
| [Gal Rijavec](https://www.buzzerbeater.com/player/55967387/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->6 JR 2->4 OD 5->9 HA 6->9 DR 6->9 IS 3->6 RB 2->5 SB 3->5 | feeders behind (HA+DR 12 vs track 28) |
| [Miško Mucelj](https://www.buzzerbeater.com/player/55967389/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 3->9 HA 5->9 DR 6->9 IS 1->6 RB 3->5 SB 1->5 | feeders behind (HA+DR 11 vs track 28) |
| [Tonček Čufer](https://www.buzzerbeater.com/player/55967390/overview.aspx) | 18 | mkt72-inside-2 | WATCH | PA 2->3 ID 7->12 RB 3->7 SB 7->8 | ID behind the big-man early-defense track |
| [Matevž Bajlec](https://www.buzzerbeater.com/player/55967393/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 7->9 HA 2->9 DR 5->9 RB 2->5 | feeders behind (HA+DR 7 vs track 28) |
| [Gal Ploj](https://www.buzzerbeater.com/player/55967395/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 6->9 HA 1->9 DR 6->9 ID 4->5 SB 4->5 | feeders behind (HA+DR 7 vs track 28) |
| [Robert Korenčič](https://www.buzzerbeater.com/player/55967407/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 2->9 HA 5->9 DR 1->9 RB 4->5 | feeders behind (HA+DR 6 vs track 28) |
| [Dušan Lisjak](https://www.buzzerbeater.com/player/55967411/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 6->9 DR 7->9 ID 4->5 SB 3->5 | feeders behind (HA+DR 13 vs track 28) |
| [Stojan Baša](https://www.buzzerbeater.com/player/55967419/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 1->4 OD 6->9 HA 7->9 DR 6->9 | feeders behind (HA+DR 13 vs track 28) |
| [Pino Minšek](https://www.buzzerbeater.com/player/55967427/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 2->4 OD 4->9 HA 6->9 DR 4->9 IS 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Zdravko Anzeljc](https://www.buzzerbeater.com/player/55967432/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 4->9 HA 4->9 DR 6->9 IS 5->6 ID 3->5 SB 4->5 | feeders behind (HA+DR 10 vs track 28) |
| [Maks Bratovčak](https://www.buzzerbeater.com/player/55967436/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 3->9 DR 5->9 IS 4->6 ID 4->5 SB 3->5 | feeders behind (HA+DR 8 vs track 28) |
| [Dino Potočnik](https://www.buzzerbeater.com/player/55967438/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 5->11 HA 7->12 DR 6->11 PA 3->5 IS 1->5 SB 2->3 | feeders behind (HA+DR 13 vs track 34) |
| [Pero Mal](https://www.buzzerbeater.com/player/55967446/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 6->11 HA 5->12 DR 7->11 PA 4->5 IS 2->5 | feeders behind (HA+DR 12 vs track 34) |
| [Izidor Marić](https://www.buzzerbeater.com/player/55967452/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 2->9 DR 7->9 | feeders behind (HA+DR 9 vs track 28) |
| [Joško Debevc](https://www.buzzerbeater.com/player/55967459/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 6->12 DR 7->11 IS 2->5 RB 3->4 | feeders behind (HA+DR 13 vs track 34) |
| [Šime Kozlar](https://www.buzzerbeater.com/player/55967461/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 5->9 HA 6->9 DR 3->9 IS 3->6 ID 3->5 SB 4->5 | feeders behind (HA+DR 9 vs track 28) |
| [Primož Dobrina](https://www.buzzerbeater.com/player/55967464/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 2->9 HA 5->9 DR 4->9 IS 5->6 ID 4->5 | feeders behind (HA+DR 9 vs track 28) |
| [Drejc Dukić](https://www.buzzerbeater.com/player/55967465/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 4->9 HA 5->9 DR 6->9 IS 2->6 RB 3->5 SB 3->5 | feeders behind (HA+DR 11 vs track 28) |
| [Jan Milošić](https://www.buzzerbeater.com/player/55967467/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 6->11 HA 7->12 DR 4->11 IS 3->5 ID 2->3 RB 3->4 | feeders behind (HA+DR 11 vs track 34) |
| [Matija Gorišek](https://www.buzzerbeater.com/player/55967506/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->6 OD 2->9 HA 4->9 DR 4->9 ID 3->5 | feeders behind (HA+DR 8 vs track 28) |
| [Tonček Osojnik](https://www.buzzerbeater.com/player/55967512/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 4->9 DR 3->9 PA 2->3 IS 3->6 RB 3->5 SB 2->5 | feeders behind (HA+DR 7 vs track 28) |
| [Taj Osenar](https://www.buzzerbeater.com/player/55967516/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 7->9 HA 7->9 DR 5->9 IS 4->6 ID 2->5 SB 2->5 | feeders behind (HA+DR 12 vs track 28) |
| [Klemen Štamcar](https://www.buzzerbeater.com/player/55967518/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 7->11 HA 6->12 DR 5->11 PA 3->5 SB 1->3 | feeders behind (HA+DR 11 vs track 34) |
| [Aljaž Kodermac](https://www.buzzerbeater.com/player/55967531/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 5->9 HA 7->9 DR 5->9 IS 2->6 | feeders behind (HA+DR 12 vs track 28) |
| [Rado Srebrnič](https://www.buzzerbeater.com/player/55967535/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 2->4 OD 3->9 HA 6->9 DR 3->9 RB 4->5 | feeders behind (HA+DR 9 vs track 28) |
| [Gal Tersoglav](https://www.buzzerbeater.com/player/55967537/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->6 OD 3->9 HA 6->9 DR 6->9 PA 1->3 | feeders behind (HA+DR 12 vs track 28) |
| [Luka Kodre](https://www.buzzerbeater.com/player/55967541/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->9 OD 6->11 HA 7->12 DR 3->11 ID 2->3 RB 1->4 | feeders behind (HA+DR 10 vs track 34) |
| [Mirko Jeram](https://www.buzzerbeater.com/player/55967550/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 7->11 HA 6->12 DR 6->11 PA 4->5 RB 3->4 SB 1->3 | feeders behind (HA+DR 12 vs track 34) |
| [Tomo Ališič](https://www.buzzerbeater.com/player/55967552/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 HA 1->2 PA 2->3 IS 4->6 ID 6->12 SB 6->8 | ID behind the big-man early-defense track |
| [Rok Žagovec](https://www.buzzerbeater.com/player/55967554/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 7->9 DR 3->9 | feeders behind (HA+DR 10 vs track 28) |
| [Rudi Vida](https://www.buzzerbeater.com/player/55967558/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 2->4 OD 6->9 HA 7->9 DR 2->9 PA 2->3 IS 5->6 | feeders behind (HA+DR 9 vs track 28) |
| [Štefan Magajna](https://www.buzzerbeater.com/player/55967560/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 7->11 HA 7->12 DR 7->11 IS 1->5 SB 2->3 | feeders behind (HA+DR 14 vs track 34) |
| [Miško Slakonja](https://www.buzzerbeater.com/player/55967563/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 7->9 HA 3->9 DR 7->9 IS 5->6 ID 3->5 | feeders behind (HA+DR 10 vs track 28) |
| [Mike Novinec](https://www.buzzerbeater.com/player/55967568/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 3->11 HA 7->12 DR 7->11 IS 1->5 ID 2->3 RB 3->4 | feeders behind (HA+DR 14 vs track 34) |
| [Boško Tomšič](https://www.buzzerbeater.com/player/55967569/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 5->11 HA 7->12 DR 7->11 IS 3->5 RB 3->4 SB 1->3 | feeders behind (HA+DR 14 vs track 34) |
| [Rusmin Kancijan](https://www.buzzerbeater.com/player/55967574/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 2->4 OD 2->9 HA 5->9 DR 6->9 IS 4->6 | feeders behind (HA+DR 11 vs track 28) |
| [Samir Miklavec](https://www.buzzerbeater.com/player/55967576/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 7->12 SB 7->8 | ID behind the big-man early-defense track |
| [Jaša Baloh](https://www.buzzerbeater.com/player/55967596/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 6->9 DR 7->9 IS 4->6 SB 4->5 | feeders behind (HA+DR 13 vs track 28) |
| [Jožef Županič](https://www.buzzerbeater.com/player/55967601/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 1->4 OD 3->9 HA 7->9 DR 4->9 RB 4->5 | feeders behind (HA+DR 11 vs track 28) |
| [Ciril Kozin](https://www.buzzerbeater.com/player/55967622/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->9 HA 3->9 DR 4->9 RB 4->5 SB 3->5 | feeders behind (HA+DR 7 vs track 28) |
| [Leon Škerlič](https://www.buzzerbeater.com/player/55967641/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 JR 3->4 OD 3->9 HA 4->9 DR 4->9 IS 4->6 RB 2->5 SB 4->5 | feeders behind (HA+DR 8 vs track 28) |
| [Matija Šparovec](https://www.buzzerbeater.com/player/55967648/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 JR 3->4 OD 7->11 HA 6->12 DR 6->11 ID 1->3 | feeders behind (HA+DR 12 vs track 34) |
| [Miško Berič](https://www.buzzerbeater.com/player/55967659/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 5->12 DR 5->11 RB 3->4 | feeders behind (HA+DR 10 vs track 34) |
| [Admir Gajser](https://www.buzzerbeater.com/player/55967664/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 5->9 HA 6->9 DR 7->9 PA 2->3 IS 2->6 ID 4->5 SB 4->5 | feeders behind (HA+DR 13 vs track 28) |
| [Klemen Rakovič](https://www.buzzerbeater.com/player/55967665/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 5->9 HA 4->9 DR 7->9 ID 2->5 SB 4->5 | feeders behind (HA+DR 11 vs track 28) |
| [Benjamin Jug](https://www.buzzerbeater.com/player/55967667/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 7->12 DR 6->11 PA 4->5 IS 1->5 ID 2->3 RB 2->4 | feeders behind (HA+DR 13 vs track 34) |
| [Vladislav Delavec](https://www.buzzerbeater.com/player/55967679/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 2->9 HA 4->9 DR 4->9 IS 3->6 | feeders behind (HA+DR 8 vs track 28) |
| [Vladimir Dovšek](https://www.buzzerbeater.com/player/55967686/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->9 HA 4->9 DR 7->9 IS 4->6 ID 4->5 RB 3->5 | feeders behind (HA+DR 11 vs track 28) |
| [Jože Piškur](https://www.buzzerbeater.com/player/55967689/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 5->9 DR 7->9 SB 3->5 | feeders behind (HA+DR 12 vs track 28) |
| [Drejc Malovrh](https://www.buzzerbeater.com/player/55967690/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 7->11 HA 4->12 DR 7->11 IS 4->5 ID 1->3 RB 2->4 | feeders behind (HA+DR 11 vs track 34) |
| [Daniel Klunec](https://www.buzzerbeater.com/player/55967693/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 3->4 OD 7->9 HA 4->9 DR 4->9 | feeders behind (HA+DR 8 vs track 28) |
| [Irvin Vogrin](https://www.buzzerbeater.com/player/55967698/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 5->9 HA 4->9 DR 6->9 IS 5->6 | feeders behind (HA+DR 10 vs track 28) |
| [Bane Goršak](https://www.buzzerbeater.com/player/55967701/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 ID 5->12 SB 5->8 | ID behind the big-man early-defense track |
| [Marin Rudan](https://www.buzzerbeater.com/player/55967703/overview.aspx) | 18 | mkt72-inside-2 | WATCH | PA 2->3 ID 6->12 SB 7->8 | ID behind the big-man early-defense track |
| [Domen Gogala](https://www.buzzerbeater.com/player/55967705/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 3->4 OD 6->9 HA 6->9 DR 7->9 RB 3->5 | feeders behind (HA+DR 13 vs track 28) |
| [Emil Bratovš](https://www.buzzerbeater.com/player/55967713/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 4->11 HA 7->12 DR 5->11 IS 3->5 RB 1->4 | feeders behind (HA+DR 12 vs track 34) |
| [Željko Batič](https://www.buzzerbeater.com/player/55967724/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 7->9 HA 4->9 DR 5->9 ID 3->5 | feeders behind (HA+DR 9 vs track 28) |
| [Tadej Lovrenčak](https://www.buzzerbeater.com/player/55967727/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 5->9 DR 5->9 ID 4->5 RB 4->5 | feeders behind (HA+DR 10 vs track 28) |
| [Erazem Zakrajšek](https://www.buzzerbeater.com/player/55967735/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 5->12 DR 7->11 PA 4->5 IS 1->5 SB 2->3 | feeders behind (HA+DR 12 vs track 34) |
| [Rudi Neuhauser](https://www.buzzerbeater.com/player/55967737/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 6->11 HA 5->12 DR 4->11 PA 2->5 IS 2->5 RB 3->4 | feeders behind (HA+DR 9 vs track 34) |
| [Nejc Šulc](https://www.buzzerbeater.com/player/55967748/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 HA 1->2 PA 1->3 ID 6->12 RB 6->7 SB 3->8 | ID behind the big-man early-defense track |
| [Taj Doler](https://www.buzzerbeater.com/player/55967754/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 5->11 HA 6->12 DR 7->11 IS 4->5 RB 2->4 | feeders behind (HA+DR 13 vs track 34) |
| [Mirt Erhatič](https://www.buzzerbeater.com/player/55967760/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 6->12 SB 6->8 | ID behind the big-man early-defense track |
| [Rastko Kadunc](https://www.buzzerbeater.com/player/55967762/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 PA 1->3 IS 5->6 ID 6->12 RB 3->7 SB 4->8 | ID behind the big-man early-defense track |
| [Rik Rot](https://www.buzzerbeater.com/player/55967766/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 4->9 HA 7->9 DR 7->9 PA 1->3 IS 3->6 ID 4->5 SB 2->5 | feeders behind (HA+DR 14 vs track 28) |
| [Kristjan Juričinec](https://www.buzzerbeater.com/player/55967767/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 7->9 HA 7->9 DR 2->9 SB 3->5 | feeders behind (HA+DR 9 vs track 28) |
| [Erazem Šuštarič](https://www.buzzerbeater.com/player/55967789/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 5->12 DR 4->11 ID 2->3 RB 1->4 SB 1->3 | feeders behind (HA+DR 9 vs track 34) |
| [Viktor Tušek](https://www.buzzerbeater.com/player/55967790/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 6->9 HA 7->9 DR 3->9 IS 5->6 | feeders behind (HA+DR 10 vs track 28) |
| [Robert Cigelšek](https://www.buzzerbeater.com/player/55967805/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 JR 3->4 OD 7->11 HA 6->12 DR 6->11 RB 1->4 | feeders behind (HA+DR 12 vs track 34) |
| [Eron Zalaznik](https://www.buzzerbeater.com/player/55967815/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 5->11 HA 5->12 DR 5->11 IS 1->5 | feeders behind (HA+DR 10 vs track 34) |
| [Štefan Ribnikar](https://www.buzzerbeater.com/player/55967827/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 1->6 OD 5->9 HA 1->9 DR 4->9 IS 4->6 ID 4->5 | feeders behind (HA+DR 5 vs track 28) |
| [Sandi Majerič](https://www.buzzerbeater.com/player/55967832/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 7->9 DR 4->9 PA 1->3 IS 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Dore Cedilnik](https://www.buzzerbeater.com/player/55967837/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 1->3 HA 1->2 ID 4->12 SB 7->8 | ID behind the big-man early-defense track |
| [Dejan Eržar](https://www.buzzerbeater.com/player/55967842/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 5->11 HA 4->12 DR 6->11 PA 4->5 IS 1->5 ID 2->3 RB 2->4 | feeders behind (HA+DR 10 vs track 34) |
| [Hasim Špan](https://www.buzzerbeater.com/player/55967850/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 5->9 DR 2->9 SB 3->5 | feeders behind (HA+DR 7 vs track 28) |
| [Robin Novaković](https://www.buzzerbeater.com/player/55967857/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 4->12 DR 7->11 IS 4->5 RB 3->4 | feeders behind (HA+DR 11 vs track 34) |
| [Anton Dolšak](https://www.buzzerbeater.com/player/55967861/overview.aspx) | 18 | mkt72-inside-2 | WATCH | HA 1->2 ID 6->12 SB 6->8 | ID behind the big-man early-defense track |
| [Fabijan Remič](https://www.buzzerbeater.com/player/55967877/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 6->12 SB 5->8 | ID behind the big-man early-defense track |
| [Aleks Mandelc](https://www.buzzerbeater.com/player/55967889/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 PA 1->3 ID 7->12 RB 6->7 SB 7->8 | ID behind the big-man early-defense track |
| [Jan Ilgo](https://www.buzzerbeater.com/player/55967897/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 5->11 HA 2->12 DR 3->11 IS 2->5 | feeders behind (HA+DR 5 vs track 34) |
| [Mladen Dragonja](https://www.buzzerbeater.com/player/55967898/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 JR 3->4 OD 6->9 HA 5->9 DR 3->9 IS 3->6 RB 4->5 | feeders behind (HA+DR 8 vs track 28) |
| [Silvo Vodopivec](https://www.buzzerbeater.com/player/55967903/overview.aspx) | 18 | mkt72-inside-2 | WATCH | ID 7->12 RB 6->7 SB 7->8 | ID behind the big-man early-defense track |
| [Dalibor Dobrajc](https://www.buzzerbeater.com/player/55967911/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 6->12 DR 4->11 IS 4->5 ID 2->3 SB 1->3 | feeders behind (HA+DR 10 vs track 34) |
| [Davor Baša](https://www.buzzerbeater.com/player/55967922/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->9 OD 7->11 HA 6->12 DR 4->11 IS 4->5 | feeders behind (HA+DR 10 vs track 34) |
| [Antonij Deželan](https://www.buzzerbeater.com/player/55967930/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 6->9 HA 4->9 DR 3->9 RB 3->5 SB 2->5 | feeders behind (HA+DR 7 vs track 28) |
| [Milan Završki](https://www.buzzerbeater.com/player/55967932/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 7->11 HA 6->12 DR 7->11 IS 1->5 RB 1->4 SB 1->3 | feeders behind (HA+DR 13 vs track 34) |
| [Klemen Grošelj](https://www.buzzerbeater.com/player/55967935/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 6->11 HA 6->12 DR 3->11 PA 4->5 IS 4->5 ID 1->3 RB 2->4 | feeders behind (HA+DR 9 vs track 34) |
| [Cveto Mrak](https://www.buzzerbeater.com/player/55967936/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 7->11 HA 6->12 DR 6->11 IS 2->5 RB 2->4 | feeders behind (HA+DR 12 vs track 34) |
| [Denis Remec](https://www.buzzerbeater.com/player/55967937/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 7->9 DR 7->9 ID 2->5 | feeders behind (HA+DR 14 vs track 28) |
| [Samir Repar](https://www.buzzerbeater.com/player/55967940/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 2->4 OD 6->9 HA 6->9 DR 5->9 ID 1->5 RB 4->5 | feeders behind (HA+DR 11 vs track 28) |
| [Danijel Cotman](https://www.buzzerbeater.com/player/55967941/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 6->9 HA 7->9 DR 3->9 IS 3->6 | feeders behind (HA+DR 10 vs track 28) |
| [Nik Prosen](https://www.buzzerbeater.com/player/55967943/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 5->9 HA 7->9 DR 6->9 IS 4->6 ID 4->5 SB 1->5 | feeders behind (HA+DR 13 vs track 28) |
| [Anže Franko](https://www.buzzerbeater.com/player/55967965/overview.aspx) | 18 | mkt72-inside-2 | WATCH | HA 1->2 ID 5->12 SB 5->8 | ID behind the big-man early-defense track |
| [Tilen Loranski](https://www.buzzerbeater.com/player/55967972/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 1->9 HA 7->9 DR 5->9 IS 4->6 RB 4->5 | feeders behind (HA+DR 12 vs track 28) |
| [Andi Goršek](https://www.buzzerbeater.com/player/55969570/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 3->4 OD 4->9 HA 7->9 DR 7->9 IS 2->6 ID 4->5 RB 2->5 | feeders behind (HA+DR 14 vs track 28) |
| [Vitomil Simonc](https://www.buzzerbeater.com/player/55969591/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 3->9 HA 7->9 DR 7->9 ID 2->5 | feeders behind (HA+DR 14 vs track 28) |
| [Damjan Malovrh](https://www.buzzerbeater.com/player/55969598/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 4->9 HA 6->9 DR 2->9 IS 4->6 RB 4->5 SB 2->5 | feeders behind (HA+DR 8 vs track 28) |
| [Ivica Novičić](https://www.buzzerbeater.com/player/55969599/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 JR 3->4 OD 7->11 HA 6->12 DR 6->11 RB 3->4 | feeders behind (HA+DR 12 vs track 34) |
| [Joco Zadnjik](https://www.buzzerbeater.com/player/55969604/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 1->9 DR 5->9 PA 2->3 IS 2->6 RB 4->5 | feeders behind (HA+DR 6 vs track 28) |
| [Miki Radovac](https://www.buzzerbeater.com/player/55989307/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 OD 3->9 HA 7->9 DR 6->9 IS 2->6 | feeders behind (HA+DR 13 vs track 28) |
| [Jasmin Čižman](https://www.buzzerbeater.com/player/55989367/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 2->4 OD 3->9 HA 2->9 DR 4->9 ID 3->5 SB 2->5 | feeders behind (HA+DR 6 vs track 28) |
| [Saša Troch](https://www.buzzerbeater.com/player/55989732/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 2->9 OD 5->11 HA 6->12 DR 7->11 IS 3->5 ID 2->3 SB 2->3 | feeders behind (HA+DR 13 vs track 34) |
| [Rok Železnikar](https://www.buzzerbeater.com/player/55989943/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 3->4 OD 3->9 HA 4->9 DR 3->9 IS 4->6 | feeders behind (HA+DR 7 vs track 28) |
| [Ernest Peterlic](https://www.buzzerbeater.com/player/55990005/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 5->9 HA 3->9 DR 5->9 ID 2->5 | feeders behind (HA+DR 8 vs track 28) |
| [Uroš Kumeršek](https://www.buzzerbeater.com/player/55990233/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 3->11 HA 3->12 DR 6->11 IS 3->5 | feeders behind (HA+DR 9 vs track 34) |
| [Vanja Štrucelj](https://www.buzzerbeater.com/player/55991284/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 1->9 HA 7->9 DR 4->9 IS 3->6 SB 3->5 | feeders behind (HA+DR 11 vs track 28) |
| [Ludvik Mikša](https://www.buzzerbeater.com/player/55991295/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 7->9 HA 5->9 DR 3->9 IS 4->6 RB 4->5 SB 2->5 | feeders behind (HA+DR 8 vs track 28) |
| [Joco Miklavić](https://www.buzzerbeater.com/player/55992359/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 4->6 JR 3->4 OD 6->9 HA 3->9 DR 5->9 PA 2->3 ID 4->5 | feeders behind (HA+DR 8 vs track 28) |
| [Andre Černak](https://www.buzzerbeater.com/player/55993206/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 6->9 DR 6->9 ID 4->5 SB 2->5 | feeders behind (HA+DR 12 vs track 28) |
| [Erik Dolenjc](https://www.buzzerbeater.com/player/55993520/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 4->9 OD 3->11 HA 6->12 DR 7->11 RB 2->4 SB 1->3 | feeders behind (HA+DR 13 vs track 34) |
| [Miha Jurajevćić](https://www.buzzerbeater.com/player/55993566/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->9 OD 7->11 HA 7->12 DR 7->11 PA 2->5 IS 1->5 | feeders behind (HA+DR 14 vs track 34) |
| [Matej Arih](https://www.buzzerbeater.com/player/55993952/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JR 1->4 OD 7->9 HA 6->9 DR 1->9 ID 3->5 RB 2->5 | feeders behind (HA+DR 7 vs track 28) |
| [Nastja Janc](https://www.buzzerbeater.com/player/55994289/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 7->9 HA 7->9 DR 4->9 IS 4->6 ID 4->5 SB 4->5 | feeders behind (HA+DR 11 vs track 28) |
| [Leon Seljanar](https://www.buzzerbeater.com/player/56009286/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 3->4 OD 4->9 HA 1->9 DR 4->9 PA 1->3 SB 2->5 | feeders behind (HA+DR 5 vs track 28) |
| [Davor Nared](https://www.buzzerbeater.com/player/56023176/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 3->6 OD 1->9 HA 3->9 DR 2->9 IS 1->6 RB 1->5 SB 2->5 | feeders behind (HA+DR 5 vs track 28) |
| [Matija Volk](https://www.buzzerbeater.com/player/56023182/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 7->11 HA 3->12 DR 6->11 | feeders behind (HA+DR 9 vs track 34) |
| [Zlatko Jeraj](https://www.buzzerbeater.com/player/56023183/overview.aspx) | 18 | mkt72-inside-2 | WATCH | JS 1->3 HA 1->2 ID 4->12 RB 4->7 SB 7->8 | ID behind the big-man early-defense track |
| [Jure Zvanut](https://www.buzzerbeater.com/player/56023186/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 3->11 HA 7->12 DR 7->11 RB 1->4 SB 1->3 | feeders behind (HA+DR 14 vs track 34) |
| [Viki Hanc](https://www.buzzerbeater.com/player/56025544/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 1->9 HA 7->9 DR 2->9 PA 2->3 IS 5->6 | feeders behind (HA+DR 9 vs track 28) |
| [Bojan Bertoncelj](https://www.buzzerbeater.com/player/56026643/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 7->9 OD 6->11 HA 6->12 DR 7->11 IS 3->5 ID 1->3 RB 1->4 | feeders behind (HA+DR 13 vs track 34) |
| [Rade Nachbar](https://www.buzzerbeater.com/player/56028833/overview.aspx) | 18 | mkt72-inside-2 | WATCH | OD 2->3 PA 1->3 IS 5->6 ID 3->12 SB 6->8 | ID behind the big-man early-defense track |
| [Vinko Osojnik](https://www.buzzerbeater.com/player/56031610/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 2->6 OD 2->9 HA 7->9 DR 7->9 IS 5->6 SB 2->5 | feeders behind (HA+DR 14 vs track 28) |
| [Ante Propadalo](https://www.buzzerbeater.com/player/56031971/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 7->11 HA 2->12 DR 7->11 IS 4->5 SB 1->3 | feeders behind (HA+DR 9 vs track 34) |
| [Vane Gruškovnjak](https://www.buzzerbeater.com/player/56032548/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 JR 2->4 OD 6->9 HA 7->9 DR 5->9 IS 3->6 SB 2->5 | feeders behind (HA+DR 12 vs track 28) |
| [Gal Udovc](https://www.buzzerbeater.com/player/56033829/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 7->11 HA 6->12 DR 7->11 IS 3->5 RB 1->4 | feeders behind (HA+DR 13 vs track 34) |
| [Vitomir Matekelj](https://www.buzzerbeater.com/player/56035040/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 1->9 HA 7->9 DR 5->9 PA 1->3 ID 4->5 SB 4->5 | feeders behind (HA+DR 12 vs track 28) |
| [Matej Ružić](https://www.buzzerbeater.com/player/56035042/overview.aspx) | 18 | mkt72-wing-1 | WATCH | JS 5->6 OD 3->9 HA 5->9 DR 2->9 PA 1->3 IS 1->6 SB 3->5 | feeders behind (HA+DR 7 vs track 28) |
| [Mark Mirt](https://www.buzzerbeater.com/player/56035586/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 3->9 OD 7->11 HA 4->12 DR 2->11 IS 3->5 | feeders behind (HA+DR 6 vs track 34) |
| [Oskar Umek](https://www.buzzerbeater.com/player/56035589/overview.aspx) | 18 | mkt72-wing-1 | WATCH | OD 4->9 HA 3->9 DR 3->9 IS 5->6 | feeders behind (HA+DR 6 vs track 28) |
| [Jordan Vošner](https://www.buzzerbeater.com/player/56035678/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 6->11 HA 5->12 DR 1->11 PA 4->5 IS 4->5 SB 1->3 | feeders behind (HA+DR 6 vs track 34) |
| [Albin Tajnik](https://www.buzzerbeater.com/player/56036498/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 5->9 OD 7->11 HA 6->12 DR 6->11 IS 2->5 ID 2->3 RB 2->4 | feeders behind (HA+DR 12 vs track 34) |
| [Mojmir Haber](https://www.buzzerbeater.com/player/56036507/overview.aspx) | 18 | mkt72-outside-1 | WATCH | JS 6->9 OD 7->11 HA 7->12 DR 7->11 PA 4->5 IS 4->5 | feeders behind (HA+DR 14 vs track 34) |
| [Dušan Ložar](https://www.buzzerbeater.com/player/55439681/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 5->12 HA 11->18 DR 9->18 IS 1->6 | feeders behind (HA+DR 20 vs track 34) |
| [Cene Tomašek](https://www.buzzerbeater.com/player/55439694/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 5->11 HA 9->15 DR 7->15 IS 4->7 SB 5->6 | feeders behind (HA+DR 16 vs track 28) |
| [Dušan Pilot](https://www.buzzerbeater.com/player/55439715/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 6->15 DR 2->15 IS 1->7 | feeders behind (HA+DR 8 vs track 28) |
| [Toni Pirc](https://www.buzzerbeater.com/player/55439719/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 2->5 OD 6->11 HA 2->15 DR 3->15 IS 3->7 ID 4->6 RB 4->6 SB 5->6 | feeders behind (HA+DR 5 vs track 28) |
| [Taj Gregorčič](https://www.buzzerbeater.com/player/55439720/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 4->5 OD 4->11 HA 7->15 DR 4->15 | feeders behind (HA+DR 11 vs track 28) |
| [Nace Žeželj](https://www.buzzerbeater.com/player/55439722/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 12->13 JR 4->5 OD 6->11 HA 11->15 DR 13->15 | feeders behind (HA+DR 24 vs track 28) |
| [Danilo Toplak](https://www.buzzerbeater.com/player/55439737/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 4->11 HA 5->15 DR 2->15 IS 6->7 ID 3->6 | feeders behind (HA+DR 7 vs track 28) |
| [Emil Dolenjšak](https://www.buzzerbeater.com/player/55439744/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 12->16 OD 4->12 HA 14->19 DR 16->19 RB 4->5 SB 2->4 | feeders behind (HA+DR 30 vs track 36) |
| [Nikolaj Gorinšek](https://www.buzzerbeater.com/player/55439747/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 HA 5->15 DR 5->15 IS 6->7 | feeders behind (HA+DR 10 vs track 28) |
| [Miha Lukovšek](https://www.buzzerbeater.com/player/55439758/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 OD 5->12 HA 5->18 DR 8->18 PA 4->6 IS 3->6 ID 1->4 RB 4->5 | feeders behind (HA+DR 13 vs track 34) |
| [Metod Glebov](https://www.buzzerbeater.com/player/55439765/overview.aspx) | 19 | mkt72-outside-2 | WATCH | OD 7->12 HA 14->19 DR 16->19 PA 5->6 | feeders behind (HA+DR 30 vs track 36) |
| [Valentin Pucelj](https://www.buzzerbeater.com/player/55439777/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 6->11 HA 2->15 DR 3->15 IS 2->7 ID 3->6 SB 3->6 | feeders behind (HA+DR 5 vs track 28) |
| [Gaber Jambrek](https://www.buzzerbeater.com/player/55439783/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 2->4 HA 1->3 PA 1->4 ID 10->14 RB 5->9 SB 7->9 | ID behind the big-man early-defense track |
| [Dominik Janže](https://www.buzzerbeater.com/player/55439790/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 10->14 ID 10->14 SB 6->9 | ID behind the big-man early-defense track |
| [Tugomir Turkuš](https://www.buzzerbeater.com/player/55439792/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 3->5 OD 3->11 HA 3->15 DR 1->15 IS 4->7 ID 5->6 SB 2->6 | feeders behind (HA+DR 4 vs track 28) |
| [Todor Šimenc](https://www.buzzerbeater.com/player/55439793/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 11->18 DR 10->18 IS 3->6 RB 3->5 | feeders behind (HA+DR 21 vs track 34) |
| [Štefan Pevec](https://www.buzzerbeater.com/player/55439798/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 JR 4->5 OD 5->11 HA 3->15 DR 4->15 PA 1->4 IS 2->7 ID 2->6 RB 4->6 SB 4->6 | feeders behind (HA+DR 7 vs track 28) |
| [Voranc Navotnik](https://www.buzzerbeater.com/player/55439805/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 3->11 HA 6->15 DR 7->15 IS 4->7 RB 1->6 | feeders behind (HA+DR 13 vs track 28) |
| [Sako Lončar](https://www.buzzerbeater.com/player/55439813/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->16 JR 4->5 OD 9->12 HA 11->19 DR 9->19 PA 5->6 IS 4->6 RB 4->5 | feeders behind (HA+DR 20 vs track 36) |
| [Zdravko Miklavžina](https://www.buzzerbeater.com/player/55439822/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 5->11 HA 11->15 DR 8->15 RB 5->6 SB 4->6 | feeders behind (HA+DR 19 vs track 28) |
| [Mark Koblenčer](https://www.buzzerbeater.com/player/55439826/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 5->15 DR 7->15 IS 5->7 ID 5->6 SB 3->6 | feeders behind (HA+DR 12 vs track 28) |
| [Branko Perec](https://www.buzzerbeater.com/player/55439856/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 8->11 HA 7->15 DR 9->15 PA 3->4 IS 5->7 SB 5->6 | feeders behind (HA+DR 16 vs track 28) |
| [Kristjan Lovrek](https://www.buzzerbeater.com/player/55439866/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 12->16 OD 8->12 HA 14->19 DR 16->19 PA 5->6 | feeders behind (HA+DR 30 vs track 36) |
| [Oto Žula](https://www.buzzerbeater.com/player/55439870/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 2->5 OD 7->11 HA 5->15 DR 7->15 ID 4->6 | feeders behind (HA+DR 12 vs track 28) |
| [Martin Černak](https://www.buzzerbeater.com/player/55439871/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 4->11 HA 6->15 DR 5->15 PA 3->4 IS 4->7 SB 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Bruno Milosavljević](https://www.buzzerbeater.com/player/55439887/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 11->12 HA 10->18 DR 12->18 PA 4->6 IS 4->6 | feeders behind (HA+DR 22 vs track 34) |
| [Vladimir Vrbnjak](https://www.buzzerbeater.com/player/55439901/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 4->15 DR 7->15 IS 5->7 SB 1->6 | feeders behind (HA+DR 11 vs track 28) |
| [Ožbej Bratušek](https://www.buzzerbeater.com/player/55439910/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 4->5 OD 2->11 HA 9->15 DR 7->15 IS 6->7 ID 5->6 SB 3->6 | feeders behind (HA+DR 16 vs track 28) |
| [Šime Jaunik](https://www.buzzerbeater.com/player/55439917/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 3->5 OD 7->11 HA 7->15 DR 4->15 PA 2->4 RB 5->6 SB 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Bor Grilanc](https://www.buzzerbeater.com/player/55439918/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 12->16 OD 8->12 HA 13->19 DR 15->19 RB 2->5 | feeders behind (HA+DR 28 vs track 36) |
| [Kevin Winkler](https://www.buzzerbeater.com/player/55439924/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 4->11 HA 3->15 DR 7->15 IS 5->7 ID 4->6 RB 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Darjan Aljančič](https://www.buzzerbeater.com/player/55439925/overview.aspx) | 19 | mkt72-inside-1 | WATCH | ID 13->16 | ID behind the big-man early-defense track |
| [Žiga Podbevšek](https://www.buzzerbeater.com/player/55439934/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 6->12 HA 14->18 DR 12->18 ID 3->4 RB 4->5 | feeders behind (HA+DR 26 vs track 34) |
| [Jožef Tome](https://www.buzzerbeater.com/player/55439942/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 4->12 HA 7->18 DR 7->18 IS 3->6 ID 2->4 | feeders behind (HA+DR 14 vs track 34) |
| [Borut Slavec](https://www.buzzerbeater.com/player/55439945/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 JR 4->5 OD 7->12 HA 7->18 DR 5->18 PA 4->6 IS 3->6 RB 2->5 | feeders behind (HA+DR 12 vs track 34) |
| [Anže Kolarič](https://www.buzzerbeater.com/player/55439947/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 3->11 HA 8->15 DR 5->15 IS 2->7 SB 1->6 | feeders behind (HA+DR 13 vs track 28) |
| [Štefan Bremec](https://www.buzzerbeater.com/player/55439962/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 7->11 HA 7->15 DR 7->15 IS 5->7 SB 4->6 | feeders behind (HA+DR 14 vs track 28) |
| [Gabrijel Uršnik](https://www.buzzerbeater.com/player/55439963/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 3->5 OD 7->11 HA 4->15 DR 4->15 ID 3->6 RB 4->6 | feeders behind (HA+DR 8 vs track 28) |
| [Jožko Peršina](https://www.buzzerbeater.com/player/55439971/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 7->11 HA 4->15 DR 5->15 IS 6->7 ID 5->6 RB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Tim Montanič](https://www.buzzerbeater.com/player/55439977/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 IS 4->14 ID 6->14 RB 6->9 SB 7->9 | ID behind the big-man early-defense track |
| [Viljem Tušek](https://www.buzzerbeater.com/player/55439978/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 4->5 OD 6->11 HA 7->15 DR 7->15 IS 2->7 ID 4->6 SB 5->6 | feeders behind (HA+DR 14 vs track 28) |
| [Borut Simoniti](https://www.buzzerbeater.com/player/55439994/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->16 OD 7->12 HA 12->19 DR 14->19 | feeders behind (HA+DR 26 vs track 36) |
| [Davorin Žele](https://www.buzzerbeater.com/player/55439998/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 7->12 HA 7->18 DR 7->18 PA 5->6 IS 4->6 ID 3->4 RB 2->5 | feeders behind (HA+DR 14 vs track 34) |
| [Kris Montanič](https://www.buzzerbeater.com/player/55440018/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 5->11 HA 7->15 DR 5->15 ID 5->6 RB 3->6 | feeders behind (HA+DR 12 vs track 28) |
| [Marjan Urih](https://www.buzzerbeater.com/player/55440021/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 10->12 HA 10->18 DR 10->18 PA 3->6 IS 4->6 | feeders behind (HA+DR 20 vs track 34) |
| [Patrik Urbanec](https://www.buzzerbeater.com/player/55440041/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 4->5 OD 7->11 HA 7->15 DR 2->15 IS 6->7 ID 5->6 RB 4->6 | feeders behind (HA+DR 9 vs track 28) |
| [Dario Kalin](https://www.buzzerbeater.com/player/55440043/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 4->11 HA 6->15 DR 2->15 SB 3->6 | feeders behind (HA+DR 8 vs track 28) |
| [Mihael Deželak](https://www.buzzerbeater.com/player/55440044/overview.aspx) | 19 | mkt72-wing-1 | WATCH | OD 3->11 HA 12->15 DR 13->15 ID 4->6 | feeders behind (HA+DR 25 vs track 28) |
| [Peter Papež](https://www.buzzerbeater.com/player/55440053/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->16 OD 7->12 HA 17->19 DR 17->19 RB 3->5 | feeders behind (HA+DR 34 vs track 36) |
| [Alfred Petras](https://www.buzzerbeater.com/player/55440063/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 HA 6->15 DR 8->15 ID 5->6 | feeders behind (HA+DR 14 vs track 28) |
| [Muamer Bracek](https://www.buzzerbeater.com/player/55440069/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 3->5 OD 4->11 HA 9->15 DR 9->15 | feeders behind (HA+DR 18 vs track 28) |
| [Samir Satler](https://www.buzzerbeater.com/player/55440073/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 6->11 HA 8->15 DR 9->15 ID 4->6 SB 3->6 | feeders behind (HA+DR 17 vs track 28) |
| [Robi Debeljak](https://www.buzzerbeater.com/player/55440078/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 7->15 DR 7->15 IS 4->7 RB 2->6 | feeders behind (HA+DR 14 vs track 28) |
| [Anže Pegan](https://www.buzzerbeater.com/player/55440082/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 OD 6->12 HA 4->18 DR 4->18 ID 1->4 SB 1->4 | feeders behind (HA+DR 8 vs track 34) |
| [Sašo Zatković](https://www.buzzerbeater.com/player/55440093/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 1->11 HA 1->15 DR 5->15 IS 4->7 RB 3->6 SB 4->6 | feeders behind (HA+DR 6 vs track 28) |
| [Franko Rosa](https://www.buzzerbeater.com/player/55440100/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 9->14 ID 9->14 | ID behind the big-man early-defense track |
| [Benjamin Jančar](https://www.buzzerbeater.com/player/55440106/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 4->5 OD 1->11 HA 7->15 DR 7->15 IS 3->7 ID 2->6 SB 1->6 | feeders behind (HA+DR 14 vs track 28) |
| [Izidor Škerlič](https://www.buzzerbeater.com/player/55440131/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 2->11 HA 4->15 DR 5->15 PA 3->4 IS 5->7 SB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Fabijan Lambergar](https://www.buzzerbeater.com/player/55440139/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 3->11 HA 9->15 DR 10->15 ID 3->6 SB 4->6 | feeders behind (HA+DR 19 vs track 28) |
| [Mirko Brlek](https://www.buzzerbeater.com/player/55440146/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 6->11 HA 13->15 DR 14->15 RB 5->6 | feeders behind (HA+DR 27 vs track 28) |
| [Teodor Perovšek](https://www.buzzerbeater.com/player/55440156/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 7->11 HA 5->15 DR 7->15 IS 5->7 ID 5->6 | feeders behind (HA+DR 12 vs track 28) |
| [Tihomir Zagorac](https://www.buzzerbeater.com/player/55440174/overview.aspx) | 19 | mkt72-inside-2 | WATCH | HA 1->3 PA 3->4 IS 5->14 ID 7->14 RB 6->9 SB 7->9 | ID behind the big-man early-defense track |
| [Stojan Rot](https://www.buzzerbeater.com/player/55440187/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 3->4 HA 2->3 IS 7->14 ID 7->14 RB 5->9 SB 6->9 | ID behind the big-man early-defense track |
| [Hasim Vidovič](https://www.buzzerbeater.com/player/55440194/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->16 OD 6->12 HA 15->19 DR 15->19 IS 4->6 RB 4->5 | feeders behind (HA+DR 30 vs track 36) |
| [Mišo Kušar](https://www.buzzerbeater.com/player/55440196/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 7->11 HA 7->15 DR 4->15 IS 6->7 ID 3->6 RB 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Mario Kolednik](https://www.buzzerbeater.com/player/55440213/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 5->11 HA 5->15 DR 7->15 PA 3->4 IS 3->7 ID 1->6 | feeders behind (HA+DR 12 vs track 28) |
| [Damjan Skale](https://www.buzzerbeater.com/player/55440216/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 5->11 HA 1->15 DR 2->15 ID 4->6 RB 3->6 SB 4->6 | feeders behind (HA+DR 3 vs track 28) |
| [Pavel Kranjec](https://www.buzzerbeater.com/player/55440219/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 12->16 OD 2->12 HA 16->19 DR 16->19 PA 5->6 ID 3->4 | feeders behind (HA+DR 32 vs track 36) |
| [Sebastijan Žigić](https://www.buzzerbeater.com/player/55440220/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 5->11 HA 4->15 DR 7->15 IS 5->7 RB 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Mladen Rotovnik](https://www.buzzerbeater.com/player/55440255/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 6->12 HA 9->18 DR 10->18 PA 5->6 IS 3->6 | feeders behind (HA+DR 19 vs track 34) |
| [Urh Pucl](https://www.buzzerbeater.com/player/55440283/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 IS 10->14 ID 10->14 RB 8->9 | ID behind the big-man early-defense track |
| [Ino Lozinšek](https://www.buzzerbeater.com/player/55440285/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 1->4 HA 2->3 IS 10->14 ID 10->14 RB 8->9 SB 5->9 | ID behind the big-man early-defense track |
| [Matjaž Cvitanič](https://www.buzzerbeater.com/player/55440299/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 7->11 HA 1->15 DR 5->15 PA 3->4 IS 3->7 ID 3->6 RB 5->6 | feeders behind (HA+DR 6 vs track 28) |
| [Miro Kumer](https://www.buzzerbeater.com/player/55440317/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->16 OD 7->12 HA 13->19 DR 14->19 ID 2->4 SB 3->4 | feeders behind (HA+DR 27 vs track 36) |
| [Lojze Nesterović](https://www.buzzerbeater.com/player/55440341/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 5->12 HA 9->18 DR 10->18 IS 4->6 SB 1->4 | feeders behind (HA+DR 19 vs track 34) |
| [Branko Vravnik](https://www.buzzerbeater.com/player/55440350/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 9->18 DR 10->18 PA 4->6 IS 3->6 SB 3->4 | feeders behind (HA+DR 19 vs track 34) |
| [Branko Bošnjak](https://www.buzzerbeater.com/player/55440353/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 HA 9->18 DR 5->18 IS 2->6 RB 4->5 | feeders behind (HA+DR 14 vs track 34) |
| [Manuel Žilavec](https://www.buzzerbeater.com/player/55440390/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 7->11 HA 8->15 DR 8->15 PA 2->4 IS 6->7 RB 1->6 SB 4->6 | feeders behind (HA+DR 16 vs track 28) |
| [Ratko Sotlar](https://www.buzzerbeater.com/player/55461936/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 7->12 HA 7->18 DR 5->18 PA 4->6 IS 2->6 ID 3->4 | feeders behind (HA+DR 12 vs track 34) |
| [Robert Tajnik](https://www.buzzerbeater.com/player/55462935/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 4->5 OD 7->11 HA 4->15 DR 5->15 IS 6->7 ID 5->6 RB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Mirko Veršič](https://www.buzzerbeater.com/player/55463315/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->16 OD 7->12 HA 4->18 DR 3->18 PA 5->6 IS 4->6 ID 2->4 | feeders behind (HA+DR 7 vs track 34) |
| [Jovica Zgonec](https://www.buzzerbeater.com/player/55463497/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 6->11 HA 6->15 DR 6->15 RB 2->6 | feeders behind (HA+DR 12 vs track 28) |
| [Edin Iljevec](https://www.buzzerbeater.com/player/55464019/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 1->11 HA 5->15 DR 9->15 IS 6->7 SB 3->6 | feeders behind (HA+DR 14 vs track 28) |
| [Damir Tosič](https://www.buzzerbeater.com/player/55464608/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 4->5 OD 10->11 HA 13->15 DR 14->15 ID 4->6 | feeders behind (HA+DR 27 vs track 28) |
| [Pepe Turkuš](https://www.buzzerbeater.com/player/55464877/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 10->16 JR 4->5 OD 8->12 HA 11->19 DR 12->19 ID 1->4 RB 3->5 SB 2->4 | feeders behind (HA+DR 23 vs track 36) |
| [Aleksander Pungartnik](https://www.buzzerbeater.com/player/55466724/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 5->11 HA 8->15 DR 7->15 SB 3->6 | feeders behind (HA+DR 15 vs track 28) |
| [Primož Urbas](https://www.buzzerbeater.com/player/55525821/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 IS 6->14 ID 4->14 RB 7->9 SB 6->9 | ID behind the big-man early-defense track |
| [Lan Lesjak](https://www.buzzerbeater.com/player/55688844/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 7->11 HA 10->15 DR 7->15 SB 5->6 | feeders behind (HA+DR 17 vs track 28) |
| [Alfred Zvonc](https://www.buzzerbeater.com/player/55688848/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 10->12 HA 8->18 DR 9->18 PA 5->6 | feeders behind (HA+DR 17 vs track 34) |
| [Dominik Gašperin](https://www.buzzerbeater.com/player/55688856/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 HA 10->15 DR 10->15 ID 4->6 RB 5->6 | feeders behind (HA+DR 20 vs track 28) |
| [Baltazar Vršić](https://www.buzzerbeater.com/player/55688860/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 5->11 HA 2->15 DR 4->15 IS 5->7 RB 3->6 | feeders behind (HA+DR 6 vs track 28) |
| [Aleksander Turk](https://www.buzzerbeater.com/player/55688862/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 3->4 IS 10->14 ID 8->14 | ID behind the big-man early-defense track |
| [Sebastjan Peteršič](https://www.buzzerbeater.com/player/55688866/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 3->5 OD 9->11 HA 5->15 DR 9->15 ID 3->6 RB 3->6 | feeders behind (HA+DR 14 vs track 28) |
| [Stane Pregelj](https://www.buzzerbeater.com/player/55688867/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 4->11 HA 4->15 DR 10->15 IS 5->7 | feeders behind (HA+DR 14 vs track 28) |
| [Marko Urbanček](https://www.buzzerbeater.com/player/55688869/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 8->11 HA 8->15 DR 9->15 SB 5->6 | feeders behind (HA+DR 17 vs track 28) |
| [Diego Štrucelj](https://www.buzzerbeater.com/player/55688872/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 9->12 HA 8->18 DR 11->18 | feeders behind (HA+DR 19 vs track 34) |
| [Šimen Roter](https://www.buzzerbeater.com/player/55688873/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 6->11 HA 8->15 DR 7->15 ID 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Janko Pamić](https://www.buzzerbeater.com/player/55688875/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 9->12 HA 3->18 DR 3->18 ID 3->4 | feeders behind (HA+DR 6 vs track 34) |
| [Zlatan Jecl](https://www.buzzerbeater.com/player/55688876/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 10->18 DR 10->18 IS 2->6 ID 3->4 RB 4->5 SB 1->4 | feeders behind (HA+DR 20 vs track 34) |
| [Jernej Kociper](https://www.buzzerbeater.com/player/55688880/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 9->11 HA 9->15 DR 8->15 IS 4->7 RB 3->6 SB 4->6 | feeders behind (HA+DR 17 vs track 28) |
| [Dare Kosovel](https://www.buzzerbeater.com/player/55688882/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 5->12 HA 10->18 DR 10->18 ID 2->4 RB 2->5 | feeders behind (HA+DR 20 vs track 34) |
| [Blaž Magdić](https://www.buzzerbeater.com/player/55688884/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 JR 3->5 OD 9->12 HA 11->18 DR 9->18 ID 1->4 RB 3->5 | feeders behind (HA+DR 20 vs track 34) |
| [Nace Tolar](https://www.buzzerbeater.com/player/55688885/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 8->11 HA 4->15 DR 9->15 SB 5->6 | feeders behind (HA+DR 13 vs track 28) |
| [Valentino Milošević](https://www.buzzerbeater.com/player/55688887/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 6->11 HA 10->15 DR 9->15 | feeders behind (HA+DR 19 vs track 28) |
| [Tavž Lovrenšcak](https://www.buzzerbeater.com/player/55688893/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 2->5 OD 3->11 HA 6->15 DR 9->15 IS 3->7 ID 3->6 SB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Fran Šajn](https://www.buzzerbeater.com/player/55688899/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 10->14 ID 11->14 RB 4->9 | ID behind the big-man early-defense track |
| [Tejo Belšak](https://www.buzzerbeater.com/player/55688902/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 JR 3->5 OD 9->12 HA 9->18 DR 8->18 PA 4->6 IS 3->6 RB 4->5 | feeders behind (HA+DR 17 vs track 34) |
| [Miško Ostroveršnik](https://www.buzzerbeater.com/player/55688905/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 3->5 OD 4->11 HA 5->15 DR 7->15 ID 4->6 RB 4->6 | feeders behind (HA+DR 12 vs track 28) |
| [Karel Korenčič](https://www.buzzerbeater.com/player/55688907/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 8->12 HA 9->18 DR 7->18 PA 5->6 RB 1->5 SB 3->4 | feeders behind (HA+DR 16 vs track 34) |
| [Marin Potočki](https://www.buzzerbeater.com/player/55688909/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 3->5 OD 6->11 HA 9->15 DR 4->15 IS 6->7 ID 3->6 SB 3->6 | feeders behind (HA+DR 13 vs track 28) |
| [Ivor Simoniti](https://www.buzzerbeater.com/player/55688910/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 4->11 HA 9->15 DR 8->15 | feeders behind (HA+DR 17 vs track 28) |
| [Mihael Košir](https://www.buzzerbeater.com/player/55688913/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 10->12 HA 5->18 DR 9->18 IS 5->6 RB 3->5 SB 2->4 | feeders behind (HA+DR 14 vs track 34) |
| [Damir Pezdirnik](https://www.buzzerbeater.com/player/55688916/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 2->11 HA 8->15 DR 6->15 IS 3->7 SB 4->6 | feeders behind (HA+DR 14 vs track 28) |
| [Dejan Delač](https://www.buzzerbeater.com/player/55688919/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 4->5 OD 8->11 HA 5->15 DR 7->15 RB 1->6 | feeders behind (HA+DR 12 vs track 28) |
| [Tim Wolfhart](https://www.buzzerbeater.com/player/55688934/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 1->5 OD 4->11 HA 8->15 DR 5->15 IS 6->7 RB 3->6 | feeders behind (HA+DR 13 vs track 28) |
| [Borja Rosić](https://www.buzzerbeater.com/player/55688935/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 HA 2->3 IS 13->14 ID 11->14 RB 7->9 SB 6->9 | ID behind the big-man early-defense track |
| [Vladimir Toman](https://www.buzzerbeater.com/player/55688936/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 3->4 PA 3->4 IS 6->14 ID 9->14 RB 7->9 SB 7->9 | ID behind the big-man early-defense track |
| [Matic Gale](https://www.buzzerbeater.com/player/55688938/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 JR 1->2 OD 3->4 PA 3->4 IS 9->14 ID 3->14 RB 6->9 | ID behind the big-man early-defense track |
| [Jovica Volčič](https://www.buzzerbeater.com/player/55688939/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 1->5 OD 5->11 HA 3->15 DR 9->15 RB 3->6 | feeders behind (HA+DR 12 vs track 28) |
| [Ljubiša Košmrl](https://www.buzzerbeater.com/player/55688945/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 JR 4->5 OD 4->12 HA 10->18 DR 8->18 IS 5->6 ID 1->4 | feeders behind (HA+DR 18 vs track 34) |
| [Dore Presterel](https://www.buzzerbeater.com/player/55688946/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 6->11 HA 12->15 DR 11->15 IS 6->7 RB 4->6 SB 4->6 | feeders behind (HA+DR 23 vs track 28) |
| [Dare Baksa](https://www.buzzerbeater.com/player/55688953/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 9->11 HA 4->15 DR 4->15 | feeders behind (HA+DR 8 vs track 28) |
| [Milimir Veselić](https://www.buzzerbeater.com/player/55688956/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 4->12 HA 5->18 DR 7->18 IS 3->6 ID 3->4 RB 2->5 SB 3->4 | feeders behind (HA+DR 12 vs track 34) |
| [Pavel Topolovec](https://www.buzzerbeater.com/player/55688958/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 3->5 OD 6->11 HA 10->15 DR 5->15 PA 3->4 SB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Vitan Cimirotić](https://www.buzzerbeater.com/player/55688959/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 10->11 HA 4->15 DR 5->15 SB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Aleksej Pucel](https://www.buzzerbeater.com/player/55688960/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 4->11 HA 11->15 DR 9->15 SB 3->6 | feeders behind (HA+DR 20 vs track 28) |
| [Milimir Valjavec](https://www.buzzerbeater.com/player/55688962/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->16 OD 7->12 HA 9->19 DR 11->19 PA 4->6 ID 2->4 RB 4->5 | feeders behind (HA+DR 20 vs track 36) |
| [Robert Povh](https://www.buzzerbeater.com/player/55688966/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 9->11 HA 5->15 DR 5->15 IS 6->7 SB 2->6 | feeders behind (HA+DR 10 vs track 28) |
| [Lovro Lorenjak](https://www.buzzerbeater.com/player/55688968/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 4->5 OD 5->11 HA 3->15 DR 6->15 IS 3->7 | feeders behind (HA+DR 9 vs track 28) |
| [Zvonimir Urbanec](https://www.buzzerbeater.com/player/55688969/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 8->12 HA 13->18 DR 11->18 RB 1->5 | feeders behind (HA+DR 24 vs track 34) |
| [Urban Miklavčič](https://www.buzzerbeater.com/player/55688985/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->16 OD 7->12 HA 6->18 DR 9->18 ID 3->4 | feeders behind (HA+DR 15 vs track 34) |
| [Mido Pretnar](https://www.buzzerbeater.com/player/55688986/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 6->12 HA 3->18 DR 9->18 ID 1->4 | feeders behind (HA+DR 12 vs track 34) |
| [Miha Brežan](https://www.buzzerbeater.com/player/55688991/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 8->12 HA 11->18 DR 8->18 PA 3->6 IS 2->6 ID 3->4 | feeders behind (HA+DR 19 vs track 34) |
| [Joc Preširen](https://www.buzzerbeater.com/player/55688992/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 3->5 OD 10->11 HA 6->15 DR 10->15 ID 3->6 SB 4->6 | feeders behind (HA+DR 16 vs track 28) |
| [Arjan Avguštinčič](https://www.buzzerbeater.com/player/55688995/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 9->11 HA 10->15 DR 13->15 ID 4->6 | feeders behind (HA+DR 23 vs track 28) |
| [Aljoša Ropoša](https://www.buzzerbeater.com/player/55688997/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 7->12 HA 10->18 DR 9->18 IS 4->6 SB 3->4 | feeders behind (HA+DR 19 vs track 34) |
| [Tim Zorec](https://www.buzzerbeater.com/player/55688998/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 12->16 OD 9->12 HA 11->19 DR 12->19 RB 1->5 | feeders behind (HA+DR 23 vs track 36) |
| [Lojze Bresnik](https://www.buzzerbeater.com/player/55688999/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 10->18 DR 9->18 | feeders behind (HA+DR 19 vs track 34) |
| [Lojz Mikložič](https://www.buzzerbeater.com/player/55689000/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 7->12 HA 3->18 DR 10->18 RB 4->5 SB 3->4 | feeders behind (HA+DR 13 vs track 34) |
| [Voranc Uršnik](https://www.buzzerbeater.com/player/55689001/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 10->12 HA 9->18 DR 11->18 ID 3->4 SB 1->4 | feeders behind (HA+DR 20 vs track 34) |
| [Ožbej Urbas](https://www.buzzerbeater.com/player/55689006/overview.aspx) | 19 | mkt72-inside-2 | WATCH | PA 1->4 IS 10->14 ID 5->14 SB 8->9 | ID behind the big-man early-defense track |
| [Boris Potočin](https://www.buzzerbeater.com/player/55689008/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 7->12 HA 5->18 DR 7->18 IS 1->6 | feeders behind (HA+DR 12 vs track 34) |
| [Matija Vulić](https://www.buzzerbeater.com/player/55689010/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 JR 3->5 OD 7->12 HA 6->18 DR 4->18 PA 5->6 IS 5->6 RB 4->5 | feeders behind (HA+DR 10 vs track 34) |
| [Jaka Zgonec](https://www.buzzerbeater.com/player/55689011/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 7->15 DR 6->15 IS 6->7 | feeders behind (HA+DR 13 vs track 28) |
| [Blaž Blažič](https://www.buzzerbeater.com/player/55689019/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 2->11 HA 7->15 DR 9->15 ID 5->6 RB 5->6 SB 3->6 | feeders behind (HA+DR 16 vs track 28) |
| [Žane Hanžek](https://www.buzzerbeater.com/player/55689021/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 2->5 OD 3->11 HA 8->15 DR 3->15 ID 5->6 RB 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Jernej Kenda](https://www.buzzerbeater.com/player/55689024/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 4->12 HA 7->18 DR 7->18 IS 3->6 RB 4->5 | feeders behind (HA+DR 14 vs track 34) |
| [Darko Kokelj](https://www.buzzerbeater.com/player/55689026/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 9->16 OD 9->12 HA 13->19 DR 14->19 PA 5->6 SB 3->4 | feeders behind (HA+DR 27 vs track 36) |
| [Črtomir Plesec](https://www.buzzerbeater.com/player/55689027/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 7->12 HA 11->18 DR 13->18 IS 4->6 | feeders behind (HA+DR 24 vs track 34) |
| [Rado Goršin](https://www.buzzerbeater.com/player/55689028/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 9->11 HA 10->15 DR 8->15 SB 4->6 | feeders behind (HA+DR 18 vs track 28) |
| [Anže Metelko](https://www.buzzerbeater.com/player/55689035/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 JR 4->5 OD 6->11 HA 7->15 DR 6->15 IS 4->7 RB 5->6 | feeders behind (HA+DR 13 vs track 28) |
| [Rožle Štibrič](https://www.buzzerbeater.com/player/55689041/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 JR 4->5 OD 5->12 HA 5->18 DR 4->18 IS 4->6 RB 3->5 | feeders behind (HA+DR 9 vs track 34) |
| [Mirsad Pulko](https://www.buzzerbeater.com/player/55689048/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 6->12 HA 4->18 DR 6->18 IS 3->6 RB 4->5 | feeders behind (HA+DR 10 vs track 34) |
| [Egon Sinkovič](https://www.buzzerbeater.com/player/55689049/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 7->11 HA 1->15 DR 3->15 IS 6->7 RB 3->6 | feeders behind (HA+DR 4 vs track 28) |
| [Gojko Balažič](https://www.buzzerbeater.com/player/55689053/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 10->14 ID 10->14 SB 8->9 | ID behind the big-man early-defense track |
| [Jaša Velej](https://www.buzzerbeater.com/player/55689055/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 IS 6->14 ID 10->14 | ID behind the big-man early-defense track |
| [Zlatan Žižmund](https://www.buzzerbeater.com/player/55689057/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 5->11 HA 12->15 DR 14->15 PA 3->4 | feeders behind (HA+DR 26 vs track 28) |
| [Črtomir Kodre](https://www.buzzerbeater.com/player/55689059/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 2->11 HA 2->15 DR 6->15 IS 3->7 ID 5->6 RB 3->6 | feeders behind (HA+DR 8 vs track 28) |
| [Voranc Sernelj](https://www.buzzerbeater.com/player/55689063/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 9->12 HA 12->18 DR 13->18 RB 3->5 | feeders behind (HA+DR 25 vs track 34) |
| [Kristijan Kapl](https://www.buzzerbeater.com/player/55689071/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 11->12 HA 11->18 DR 12->18 IS 3->6 | feeders behind (HA+DR 23 vs track 34) |
| [Taj Pezdir](https://www.buzzerbeater.com/player/55689078/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 11->16 OD 7->12 HA 10->19 DR 12->19 PA 4->6 ID 3->4 RB 2->5 SB 1->4 | feeders behind (HA+DR 22 vs track 36) |
| [Emanuel Miš](https://www.buzzerbeater.com/player/55689079/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 8->11 HA 12->15 DR 9->15 RB 4->6 | feeders behind (HA+DR 21 vs track 28) |
| [Zoki Šega](https://www.buzzerbeater.com/player/55689081/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 4->11 HA 7->15 DR 7->15 IS 5->7 RB 2->6 SB 4->6 | feeders behind (HA+DR 14 vs track 28) |
| [Oton Urbančič](https://www.buzzerbeater.com/player/55689085/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 8->12 HA 9->18 DR 6->18 IS 3->6 SB 1->4 | feeders behind (HA+DR 15 vs track 34) |
| [Žan Sočan](https://www.buzzerbeater.com/player/55689087/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 3->11 HA 6->15 DR 9->15 SB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Jeremi Uršnik](https://www.buzzerbeater.com/player/55689090/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 1->13 JR 3->5 OD 7->11 HA 9->15 DR 8->15 ID 5->6 SB 3->6 | feeders behind (HA+DR 17 vs track 28) |
| [Ivan Anzelj](https://www.buzzerbeater.com/player/55689096/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 3->11 HA 6->15 DR 5->15 ID 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Ervin Guček](https://www.buzzerbeater.com/player/55689097/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 5->11 HA 8->15 DR 3->15 IS 5->7 RB 2->6 SB 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Aleš Jamnišek](https://www.buzzerbeater.com/player/55689100/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 4->11 HA 6->15 DR 10->15 ID 2->6 | feeders behind (HA+DR 16 vs track 28) |
| [Štef Osaj](https://www.buzzerbeater.com/player/55689106/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 6->11 HA 9->15 DR 5->15 | feeders behind (HA+DR 14 vs track 28) |
| [Božo Bračko](https://www.buzzerbeater.com/player/55689110/overview.aspx) | 19 | mkt72-inside-1 | WATCH | OD 1->4 IS 3->7 ID 9->16 RB 10->12 SB 13->17 | ID behind the big-man early-defense track |
| [Valter Part](https://www.buzzerbeater.com/player/55689119/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 4->11 HA 6->15 DR 9->15 SB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Nik Mohor](https://www.buzzerbeater.com/player/55689126/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 10->11 HA 9->15 DR 5->15 IS 6->7 | feeders behind (HA+DR 14 vs track 28) |
| [Brin Kaluder](https://www.buzzerbeater.com/player/55689128/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 1->5 OD 3->11 HA 3->15 DR 8->15 SB 4->6 | feeders behind (HA+DR 11 vs track 28) |
| [Gvido Gojčič](https://www.buzzerbeater.com/player/55689131/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 9->11 HA 9->15 DR 4->15 PA 1->4 ID 4->6 RB 4->6 | feeders behind (HA+DR 13 vs track 28) |
| [David Gavrilović](https://www.buzzerbeater.com/player/55689139/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 6->11 HA 10->15 DR 6->15 PA 2->4 IS 4->7 RB 4->6 | feeders behind (HA+DR 16 vs track 28) |
| [Benjamin Apatič](https://www.buzzerbeater.com/player/55689148/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 7->12 HA 9->18 DR 10->18 | feeders behind (HA+DR 19 vs track 34) |
| [Matija Županec](https://www.buzzerbeater.com/player/55689149/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 HA 1->3 IS 4->14 ID 8->14 SB 5->9 | ID behind the big-man early-defense track |
| [Amel Muhić](https://www.buzzerbeater.com/player/55689153/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 4->11 HA 4->15 DR 6->15 | feeders behind (HA+DR 10 vs track 28) |
| [Mitja Štrumbelj](https://www.buzzerbeater.com/player/55689154/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 2->11 HA 8->15 DR 9->15 PA 2->4 | feeders behind (HA+DR 17 vs track 28) |
| [Hotimir Tretjak](https://www.buzzerbeater.com/player/55689158/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 10->12 HA 8->18 DR 9->18 PA 5->6 IS 5->6 RB 2->5 | feeders behind (HA+DR 17 vs track 34) |
| [Nace Koron](https://www.buzzerbeater.com/player/55689162/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 PA 1->4 IS 7->14 ID 8->14 RB 8->9 SB 8->9 | ID behind the big-man early-defense track |
| [Janez Arhar](https://www.buzzerbeater.com/player/55689163/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 7->12 HA 8->18 DR 5->18 IS 3->6 ID 3->4 RB 3->5 SB 2->4 | feeders behind (HA+DR 13 vs track 34) |
| [Josip Murn](https://www.buzzerbeater.com/player/55689164/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 JR 3->5 OD 5->12 HA 9->18 DR 10->18 IS 4->6 SB 1->4 | feeders behind (HA+DR 19 vs track 34) |
| [Metod Neubauer](https://www.buzzerbeater.com/player/55689166/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 5->14 ID 10->14 | ID behind the big-man early-defense track |
| [Alfonz Cedilnik](https://www.buzzerbeater.com/player/55689173/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 2->5 OD 10->11 HA 5->15 DR 10->15 PA 2->4 RB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Mirko Mežič](https://www.buzzerbeater.com/player/55689175/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 8->11 HA 10->15 DR 9->15 | feeders behind (HA+DR 19 vs track 28) |
| [Jani Puntar](https://www.buzzerbeater.com/player/55689183/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 IS 10->14 ID 5->14 | ID behind the big-man early-defense track |
| [Ratko Komel](https://www.buzzerbeater.com/player/55689189/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 6->11 HA 9->15 DR 9->15 IS 1->7 RB 4->6 | feeders behind (HA+DR 18 vs track 28) |
| [Slavko Vuzem](https://www.buzzerbeater.com/player/55689191/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 2->5 OD 10->11 HA 8->15 DR 9->15 ID 4->6 RB 4->6 | feeders behind (HA+DR 17 vs track 28) |
| [Vito Železnikar](https://www.buzzerbeater.com/player/55689192/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 3->18 DR 6->18 ID 2->4 | feeders behind (HA+DR 9 vs track 34) |
| [Zoki Balažic](https://www.buzzerbeater.com/player/55689193/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 HA 2->3 IS 8->14 ID 8->14 | ID behind the big-man early-defense track |
| [Ferdo Gregorec](https://www.buzzerbeater.com/player/55689197/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 4->11 HA 5->15 DR 8->15 IS 4->7 | feeders behind (HA+DR 13 vs track 28) |
| [Jure Culič](https://www.buzzerbeater.com/player/55689201/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 4->11 HA 8->15 DR 6->15 PA 1->4 IS 5->7 ID 4->6 RB 4->6 SB 3->6 | feeders behind (HA+DR 14 vs track 28) |
| [Leon Kos](https://www.buzzerbeater.com/player/55689203/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 3->5 OD 5->11 HA 8->15 DR 8->15 RB 4->6 SB 1->6 | feeders behind (HA+DR 16 vs track 28) |
| [Rudi Lovrinović](https://www.buzzerbeater.com/player/55689207/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 9->11 HA 4->15 DR 4->15 RB 5->6 SB 5->6 | feeders behind (HA+DR 8 vs track 28) |
| [Primož Suhadolc](https://www.buzzerbeater.com/player/55689212/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 9->11 HA 5->15 DR 10->15 IS 6->7 ID 3->6 RB 2->6 SB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Šime Gašpar](https://www.buzzerbeater.com/player/55689215/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 8->11 HA 3->15 DR 7->15 IS 4->7 RB 4->6 SB 5->6 | feeders behind (HA+DR 10 vs track 28) |
| [Matic Kržan](https://www.buzzerbeater.com/player/55689216/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 DR 1->2 IS 5->14 ID 10->14 | ID behind the big-man early-defense track |
| [Nik Ropret](https://www.buzzerbeater.com/player/55689217/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 9->12 HA 8->18 DR 8->18 IS 3->6 | feeders behind (HA+DR 16 vs track 34) |
| [Nedžad Lavrenčak](https://www.buzzerbeater.com/player/55689219/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 8->11 HA 8->15 DR 7->15 | feeders behind (HA+DR 15 vs track 28) |
| [Dominik Strojan](https://www.buzzerbeater.com/player/55689221/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 7->18 DR 9->18 ID 2->4 RB 2->5 | feeders behind (HA+DR 16 vs track 34) |
| [Viljem Slakonja](https://www.buzzerbeater.com/player/55689224/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 OD 7->12 HA 9->18 DR 10->18 ID 1->4 | feeders behind (HA+DR 19 vs track 34) |
| [Jurij Venier](https://www.buzzerbeater.com/player/55689229/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 7->12 HA 7->18 DR 7->18 IS 2->6 ID 3->4 RB 1->5 | feeders behind (HA+DR 14 vs track 34) |
| [Braco Brulc](https://www.buzzerbeater.com/player/55689230/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 3->11 HA 9->15 DR 4->15 | feeders behind (HA+DR 13 vs track 28) |
| [Tomo Lovič](https://www.buzzerbeater.com/player/55689232/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 4->5 OD 4->11 HA 7->15 DR 2->15 IS 6->7 SB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Tim Linasi](https://www.buzzerbeater.com/player/55689233/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 2->5 OD 4->11 HA 7->15 DR 7->15 | feeders behind (HA+DR 14 vs track 28) |
| [Aleksej Miklošic](https://www.buzzerbeater.com/player/55689234/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 9->11 HA 9->15 DR 11->15 PA 3->4 SB 2->6 | feeders behind (HA+DR 20 vs track 28) |
| [Tavž Hrušica](https://www.buzzerbeater.com/player/55689235/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 10->11 HA 4->15 DR 3->15 PA 2->4 IS 4->7 ID 5->6 | feeders behind (HA+DR 7 vs track 28) |
| [Dore Dagarin](https://www.buzzerbeater.com/player/55689238/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 4->11 HA 9->15 DR 7->15 IS 6->7 | feeders behind (HA+DR 16 vs track 28) |
| [Henrik Žigić](https://www.buzzerbeater.com/player/55689242/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 4->11 HA 8->15 DR 3->15 IS 4->7 ID 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Tine Golob](https://www.buzzerbeater.com/player/55689248/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 HA 10->15 DR 11->15 | feeders behind (HA+DR 21 vs track 28) |
| [Adrijan Šoster](https://www.buzzerbeater.com/player/55689264/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 8->11 HA 11->15 DR 8->15 SB 5->6 | feeders behind (HA+DR 19 vs track 28) |
| [Nikola Mal](https://www.buzzerbeater.com/player/55689265/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 9->11 HA 8->15 DR 8->15 SB 2->6 | feeders behind (HA+DR 16 vs track 28) |
| [Hugo Pavlič](https://www.buzzerbeater.com/player/55689279/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 4->12 HA 2->18 DR 9->18 SB 3->4 | feeders behind (HA+DR 11 vs track 34) |
| [Kris Turkuš](https://www.buzzerbeater.com/player/55689285/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 4->11 HA 5->15 DR 3->15 PA 1->4 ID 4->6 RB 5->6 SB 5->6 | feeders behind (HA+DR 8 vs track 28) |
| [Stribor Vencelj](https://www.buzzerbeater.com/player/55689287/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 4->11 HA 10->15 DR 5->15 IS 2->7 | feeders behind (HA+DR 15 vs track 28) |
| [Lenart Luk](https://www.buzzerbeater.com/player/55689297/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->16 OD 7->12 HA 3->18 DR 9->18 IS 1->6 ID 2->4 | feeders behind (HA+DR 12 vs track 34) |
| [Vanja Kralj](https://www.buzzerbeater.com/player/55689306/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 2->11 HA 8->15 DR 9->15 | feeders behind (HA+DR 17 vs track 28) |
| [Baltazar Falež](https://www.buzzerbeater.com/player/55689307/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 1->11 HA 9->15 DR 4->15 ID 4->6 | feeders behind (HA+DR 13 vs track 28) |
| [Slavko Korenc](https://www.buzzerbeater.com/player/55689311/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 8->14 ID 10->14 SB 5->9 | ID behind the big-man early-defense track |
| [Mario Jelinčič](https://www.buzzerbeater.com/player/55689314/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 4->11 HA 5->15 DR 3->15 IS 6->7 RB 4->6 | feeders behind (HA+DR 8 vs track 28) |
| [Črtomir Fink](https://www.buzzerbeater.com/player/55689315/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 8->12 HA 4->18 DR 5->18 IS 3->6 | feeders behind (HA+DR 9 vs track 34) |
| [Janez Lavrenčak](https://www.buzzerbeater.com/player/55689316/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 5->11 HA 6->15 DR 9->15 RB 5->6 SB 5->6 | feeders behind (HA+DR 15 vs track 28) |
| [Erazem Krnec](https://www.buzzerbeater.com/player/55689318/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 OD 1->4 HA 2->3 DR 1->2 PA 1->4 IS 10->14 ID 6->14 RB 7->9 | ID behind the big-man early-defense track |
| [Armin Zorić](https://www.buzzerbeater.com/player/55689324/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 4->11 HA 10->15 DR 7->15 | feeders behind (HA+DR 17 vs track 28) |
| [Ferdinand Dobovšek](https://www.buzzerbeater.com/player/55689332/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 8->11 HA 9->15 DR 13->15 ID 3->6 | feeders behind (HA+DR 22 vs track 28) |
| [Sako Kolman](https://www.buzzerbeater.com/player/55689344/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 3->12 HA 10->18 DR 7->18 IS 2->6 SB 3->4 | feeders behind (HA+DR 17 vs track 34) |
| [Miha Širca](https://www.buzzerbeater.com/player/55689345/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 7->12 HA 5->18 DR 5->18 IS 5->6 RB 2->5 | feeders behind (HA+DR 10 vs track 34) |
| [Štefan Jožetič](https://www.buzzerbeater.com/player/55689364/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 9->11 HA 7->15 DR 8->15 ID 5->6 SB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Gal Pakiž](https://www.buzzerbeater.com/player/55689365/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 9->11 HA 7->15 DR 8->15 IS 4->7 RB 1->6 SB 3->6 | feeders behind (HA+DR 15 vs track 28) |
| [Alojz Škorjanc](https://www.buzzerbeater.com/player/55689366/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 10->12 HA 7->18 DR 3->18 IS 3->6 | feeders behind (HA+DR 10 vs track 34) |
| [Jaša Hac](https://www.buzzerbeater.com/player/55689381/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 9->11 HA 5->15 DR 5->15 SB 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Kevin Hrvacki](https://www.buzzerbeater.com/player/55689382/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 9->12 HA 5->18 DR 7->18 RB 1->5 | feeders behind (HA+DR 12 vs track 34) |
| [Tibor Sovič](https://www.buzzerbeater.com/player/55689387/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 JR 3->5 OD 7->12 HA 8->18 DR 8->18 IS 3->6 ID 3->4 | feeders behind (HA+DR 16 vs track 34) |
| [Matej Plesavec](https://www.buzzerbeater.com/player/55689393/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 5->11 HA 9->15 DR 3->15 IS 4->7 | feeders behind (HA+DR 12 vs track 28) |
| [Erik Vrdev](https://www.buzzerbeater.com/player/55689396/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 7->12 HA 9->18 DR 2->18 IS 3->6 ID 2->4 | feeders behind (HA+DR 11 vs track 34) |
| [Boris Gornik](https://www.buzzerbeater.com/player/55689405/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 8->12 HA 9->18 DR 4->18 IS 2->6 RB 3->5 | feeders behind (HA+DR 13 vs track 34) |
| [Miroslav Smolar](https://www.buzzerbeater.com/player/55689406/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 7->12 HA 7->18 DR 7->18 | feeders behind (HA+DR 14 vs track 34) |
| [Matija Vrhovc](https://www.buzzerbeater.com/player/55689410/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 4->11 HA 9->15 DR 4->15 IS 6->7 SB 1->6 | feeders behind (HA+DR 13 vs track 28) |
| [Dominik Perne](https://www.buzzerbeater.com/player/55689411/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 OD 3->4 IS 10->14 ID 9->14 SB 5->9 | ID behind the big-man early-defense track |
| [Demis Janževec](https://www.buzzerbeater.com/player/55689412/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 7->12 HA 9->18 DR 10->18 IS 5->6 ID 2->4 RB 3->5 SB 1->4 | feeders behind (HA+DR 19 vs track 34) |
| [Tihomir Malovrh](https://www.buzzerbeater.com/player/55689417/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 7->11 HA 4->15 DR 10->15 IS 6->7 | feeders behind (HA+DR 14 vs track 28) |
| [Aljaž Čarek](https://www.buzzerbeater.com/player/55689445/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 1->11 HA 6->15 DR 9->15 IS 5->7 | feeders behind (HA+DR 15 vs track 28) |
| [Jan Kunc](https://www.buzzerbeater.com/player/55689446/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 1->5 OD 6->11 HA 10->15 DR 11->15 ID 5->6 RB 5->6 | feeders behind (HA+DR 21 vs track 28) |
| [Tibor Kroflič](https://www.buzzerbeater.com/player/55689447/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 3->11 HA 3->15 DR 7->15 IS 5->7 RB 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Matjaž Podbelšek](https://www.buzzerbeater.com/player/55689455/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 2->12 HA 9->18 DR 10->18 IS 4->6 ID 3->4 RB 4->5 | feeders behind (HA+DR 19 vs track 34) |
| [Janez Pulko](https://www.buzzerbeater.com/player/55689457/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 OD 1->4 IS 6->14 ID 10->14 RB 8->9 | ID behind the big-man early-defense track |
| [Igor Pivk](https://www.buzzerbeater.com/player/55689460/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 OD 9->12 HA 7->18 DR 6->18 IS 2->6 RB 2->5 | feeders behind (HA+DR 13 vs track 34) |
| [Nik Ludoviko](https://www.buzzerbeater.com/player/55689464/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 3->11 HA 10->15 DR 7->15 IS 3->7 ID 4->6 | feeders behind (HA+DR 17 vs track 28) |
| [Milimir Žlogar](https://www.buzzerbeater.com/player/55689484/overview.aspx) | 19 | mkt72-inside-2 | WATCH | PA 3->4 IS 10->14 ID 10->14 RB 8->9 | ID behind the big-man early-defense track |
| [Tit Barkovič](https://www.buzzerbeater.com/player/55689485/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 4->5 OD 9->11 HA 5->15 DR 8->15 IS 6->7 | feeders behind (HA+DR 13 vs track 28) |
| [Rafko Gavrilović](https://www.buzzerbeater.com/player/55689489/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->16 JR 4->5 OD 10->12 HA 4->18 DR 8->18 IS 3->6 ID 3->4 | feeders behind (HA+DR 12 vs track 34) |
| [Igor Bertoncelj](https://www.buzzerbeater.com/player/55689496/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 10->12 HA 6->18 DR 7->18 PA 5->6 ID 3->4 | feeders behind (HA+DR 13 vs track 34) |
| [Marko Marinčič](https://www.buzzerbeater.com/player/55689499/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 10->12 HA 9->18 DR 9->18 ID 2->4 | feeders behind (HA+DR 18 vs track 34) |
| [Jan Nauber](https://www.buzzerbeater.com/player/55689502/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 8->11 HA 4->15 DR 9->15 SB 3->6 | feeders behind (HA+DR 13 vs track 28) |
| [Aljoša Štiberc](https://www.buzzerbeater.com/player/55689504/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 JR 3->5 OD 7->12 HA 1->18 DR 9->18 IS 3->6 | feeders behind (HA+DR 10 vs track 34) |
| [Vladimir Rojnik](https://www.buzzerbeater.com/player/55689506/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 2->5 OD 5->11 HA 6->15 DR 7->15 ID 5->6 RB 3->6 SB 5->6 | feeders behind (HA+DR 13 vs track 28) |
| [Igor Zelen](https://www.buzzerbeater.com/player/55689509/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 6->12 HA 2->18 DR 8->18 RB 4->5 SB 3->4 | feeders behind (HA+DR 10 vs track 34) |
| [Nejc Brajovič](https://www.buzzerbeater.com/player/55689537/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 9->12 HA 2->18 DR 5->18 IS 3->6 SB 2->4 | feeders behind (HA+DR 7 vs track 34) |
| [Urh Kamberović](https://www.buzzerbeater.com/player/55689543/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 4->5 OD 4->11 HA 3->15 DR 6->15 IS 3->7 ID 5->6 RB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Gašper Zaveršnek](https://www.buzzerbeater.com/player/55689555/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 7->11 HA 3->15 DR 4->15 IS 3->7 ID 4->6 | feeders behind (HA+DR 7 vs track 28) |
| [Jani Mržek](https://www.buzzerbeater.com/player/55710577/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 6->12 HA 4->18 DR 10->18 PA 2->6 IS 1->6 SB 3->4 | feeders behind (HA+DR 14 vs track 34) |
| [Darjan Lahovec](https://www.buzzerbeater.com/player/55710707/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 OD 9->12 HA 5->18 DR 3->18 IS 4->6 RB 3->5 | feeders behind (HA+DR 8 vs track 34) |
| [Sebastjan Marinković](https://www.buzzerbeater.com/player/55710756/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 6->11 HA 10->15 DR 10->15 IS 4->7 | feeders behind (HA+DR 20 vs track 28) |
| [Leonard Lapajna](https://www.buzzerbeater.com/player/55710863/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 2->5 OD 5->11 HA 9->15 DR 6->15 IS 4->7 ID 4->6 RB 3->6 SB 5->6 | feeders behind (HA+DR 15 vs track 28) |
| [Andrej Šenica](https://www.buzzerbeater.com/player/55711671/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 11->12 HA 10->18 DR 9->18 IS 3->6 RB 3->5 | feeders behind (HA+DR 19 vs track 34) |
| [Anže Verovnik](https://www.buzzerbeater.com/player/55712395/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 10->11 HA 7->15 DR 4->15 | feeders behind (HA+DR 11 vs track 28) |
| [Uroš Buš](https://www.buzzerbeater.com/player/55712853/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 5->11 HA 11->15 DR 11->15 ID 3->6 RB 5->6 | feeders behind (HA+DR 22 vs track 28) |
| [Darko Adamič](https://www.buzzerbeater.com/player/55713195/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 4->5 OD 3->11 HA 8->15 DR 5->15 ID 2->6 RB 2->6 SB 3->6 | feeders behind (HA+DR 13 vs track 28) |
| [Slavko Košnik](https://www.buzzerbeater.com/player/55713357/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 9->16 OD 4->12 HA 13->19 DR 12->19 IS 5->6 RB 3->5 | feeders behind (HA+DR 25 vs track 36) |
| [Rade Mayr](https://www.buzzerbeater.com/player/55713545/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 12->13 OD 8->11 HA 11->15 DR 11->15 IS 4->7 | feeders behind (HA+DR 22 vs track 28) |
| [Amir Vrhovski](https://www.buzzerbeater.com/player/55713605/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 9->16 OD 8->12 HA 13->19 DR 13->19 PA 3->6 ID 3->4 RB 4->5 SB 1->4 | feeders behind (HA+DR 26 vs track 36) |
| [Bogomir Kraševič](https://www.buzzerbeater.com/player/55713768/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 8->12 HA 6->18 DR 9->18 IS 3->6 RB 4->5 | feeders behind (HA+DR 15 vs track 34) |
| [Luka Pirc](https://www.buzzerbeater.com/player/55713981/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 9->11 HA 8->15 DR 3->15 | feeders behind (HA+DR 11 vs track 28) |
| [Toni Avbelj](https://www.buzzerbeater.com/player/55714046/overview.aspx) | 19 | mkt72-outside-2 | WATCH | JS 9->16 OD 9->12 HA 13->19 DR 14->19 PA 2->6 SB 3->4 | feeders behind (HA+DR 27 vs track 36) |
| [Matevž Kocjančič](https://www.buzzerbeater.com/player/55714201/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 10->11 HA 12->15 DR 11->15 ID 3->6 | feeders behind (HA+DR 23 vs track 28) |
| [Lev Žugelj](https://www.buzzerbeater.com/player/55714232/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 3->5 OD 5->11 HA 8->15 DR 10->15 IS 6->7 RB 1->6 SB 5->6 | feeders behind (HA+DR 18 vs track 28) |
| [Domen Tomšek](https://www.buzzerbeater.com/player/55715671/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 8->12 HA 10->18 DR 12->18 IS 5->6 | feeders behind (HA+DR 22 vs track 34) |
| [Milenko Čebašek](https://www.buzzerbeater.com/player/55715732/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 9->12 HA 11->18 DR 13->18 IS 4->6 ID 1->4 SB 3->4 | feeders behind (HA+DR 24 vs track 34) |
| [Tihomir Pezderšek](https://www.buzzerbeater.com/player/55715937/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 4->5 OD 10->11 HA 8->15 DR 9->15 PA 2->4 IS 4->7 | feeders behind (HA+DR 17 vs track 28) |
| [Sergej Škerlj](https://www.buzzerbeater.com/player/55751962/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 11->16 OD 6->12 HA 10->18 DR 10->18 IS 2->6 | feeders behind (HA+DR 20 vs track 34) |
| [Nino Tomšič](https://www.buzzerbeater.com/player/55757014/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 2->11 HA 6->15 DR 2->15 IS 3->7 ID 2->6 RB 1->6 | feeders behind (HA+DR 8 vs track 28) |
| [Aljaž Benedejčič](https://www.buzzerbeater.com/player/55757016/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 3->5 OD 7->11 HA 7->15 DR 1->15 ID 5->6 | feeders behind (HA+DR 8 vs track 28) |
| [Žan Bober](https://www.buzzerbeater.com/player/55967305/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 4->11 HA 3->15 DR 8->15 PA 3->4 IS 6->7 | feeders behind (HA+DR 11 vs track 28) |
| [Miha Kampl](https://www.buzzerbeater.com/player/55967307/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 10->12 HA 6->18 DR 5->18 IS 1->6 ID 1->4 RB 3->5 SB 1->4 | feeders behind (HA+DR 11 vs track 34) |
| [Matej Linhart](https://www.buzzerbeater.com/player/55967308/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 3->5 OD 9->11 HA 9->15 DR 3->15 ID 3->6 RB 5->6 | feeders behind (HA+DR 12 vs track 28) |
| [Gašper Šolinc](https://www.buzzerbeater.com/player/55967310/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 10->11 HA 9->15 DR 5->15 ID 4->6 SB 2->6 | feeders behind (HA+DR 14 vs track 28) |
| [Rudi Turkoš](https://www.buzzerbeater.com/player/55967316/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 DR 1->2 IS 9->14 ID 8->14 SB 5->9 | ID behind the big-man early-defense track |
| [Andrej Sukič](https://www.buzzerbeater.com/player/55967321/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 6->11 HA 1->15 DR 4->15 RB 5->6 | feeders behind (HA+DR 5 vs track 28) |
| [Igor Šegovič](https://www.buzzerbeater.com/player/55967324/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 3->18 DR 5->18 IS 5->6 | feeders behind (HA+DR 8 vs track 34) |
| [Ernest Dolščak](https://www.buzzerbeater.com/player/55967333/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 8->12 HA 2->18 DR 10->18 ID 3->4 RB 3->5 | feeders behind (HA+DR 12 vs track 34) |
| [Mišo Gorenc](https://www.buzzerbeater.com/player/55967336/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 7->11 HA 5->15 DR 4->15 PA 1->4 IS 6->7 SB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Andraž Anžej](https://www.buzzerbeater.com/player/55967341/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 6->11 HA 4->15 DR 1->15 ID 3->6 SB 2->6 | feeders behind (HA+DR 5 vs track 28) |
| [Tine Merlak](https://www.buzzerbeater.com/player/55967346/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 4->5 OD 5->11 HA 9->15 DR 5->15 IS 6->7 ID 3->6 | feeders behind (HA+DR 14 vs track 28) |
| [Kostja Bračko](https://www.buzzerbeater.com/player/55967347/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 JR 1->5 OD 9->11 HA 4->15 DR 7->15 IS 3->7 ID 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Silvester Sviben](https://www.buzzerbeater.com/player/55967349/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 OD 9->12 HA 6->18 DR 10->18 IS 4->6 RB 2->5 | feeders behind (HA+DR 16 vs track 34) |
| [Simon Kordyš](https://www.buzzerbeater.com/player/55967351/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 6->12 HA 10->18 DR 4->18 IS 2->6 RB 3->5 SB 1->4 | feeders behind (HA+DR 14 vs track 34) |
| [Gal Bizant](https://www.buzzerbeater.com/player/55967358/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 4->5 OD 3->11 HA 9->15 DR 3->15 IS 4->7 ID 2->6 SB 5->6 | feeders behind (HA+DR 12 vs track 28) |
| [Aleš Požegar](https://www.buzzerbeater.com/player/55967359/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 8->11 HA 9->15 DR 4->15 IS 6->7 RB 5->6 | feeders behind (HA+DR 13 vs track 28) |
| [Viki Pupaher](https://www.buzzerbeater.com/player/55967360/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 8->12 HA 8->18 DR 9->18 IS 2->6 ID 2->4 RB 1->5 | feeders behind (HA+DR 17 vs track 34) |
| [Andraž Pajenk](https://www.buzzerbeater.com/player/55967366/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 4->11 HA 3->15 DR 9->15 IS 4->7 | feeders behind (HA+DR 12 vs track 28) |
| [Leonid Kordiš](https://www.buzzerbeater.com/player/55967370/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 5->11 HA 5->15 DR 2->15 ID 4->6 | feeders behind (HA+DR 7 vs track 28) |
| [Dejan Mayer](https://www.buzzerbeater.com/player/55967373/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 5->11 HA 5->15 DR 9->15 IS 1->7 | feeders behind (HA+DR 14 vs track 28) |
| [Luka Kordež](https://www.buzzerbeater.com/player/55967376/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 4->5 OD 3->11 HA 2->15 DR 4->15 PA 3->4 IS 3->7 RB 3->6 SB 5->6 | feeders behind (HA+DR 6 vs track 28) |
| [Julijan Gorza](https://www.buzzerbeater.com/player/55967378/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 6->11 HA 3->15 DR 1->15 IS 4->7 SB 5->6 | feeders behind (HA+DR 4 vs track 28) |
| [Urh Anžlovar](https://www.buzzerbeater.com/player/55967388/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 3->5 OD 9->11 HA 6->15 DR 7->15 RB 5->6 | feeders behind (HA+DR 13 vs track 28) |
| [Matej Župan](https://www.buzzerbeater.com/player/55967391/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 9->11 HA 9->15 DR 6->15 SB 5->6 | feeders behind (HA+DR 15 vs track 28) |
| [Marinko Indihar](https://www.buzzerbeater.com/player/55967392/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 4->5 OD 8->11 HA 4->15 DR 10->15 IS 3->7 | feeders behind (HA+DR 14 vs track 28) |
| [Tim Kutin](https://www.buzzerbeater.com/player/55967394/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 OD 5->12 HA 4->18 DR 3->18 IS 1->6 ID 2->4 RB 3->5 SB 1->4 | feeders behind (HA+DR 7 vs track 34) |
| [Peter Murovec](https://www.buzzerbeater.com/player/55967396/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 3->5 OD 3->11 HA 3->15 DR 8->15 PA 3->4 IS 5->7 RB 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Jurij Tomasini](https://www.buzzerbeater.com/player/55967398/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 9->11 HA 7->15 DR 4->15 IS 5->7 ID 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Davorin Lovka](https://www.buzzerbeater.com/player/55967399/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->16 OD 8->12 HA 3->18 DR 3->18 IS 2->6 ID 3->4 SB 2->4 | feeders behind (HA+DR 6 vs track 34) |
| [Gaj Krkoč](https://www.buzzerbeater.com/player/55967400/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 7->15 DR 5->15 PA 3->4 RB 4->6 | feeders behind (HA+DR 12 vs track 28) |
| [Nik Bizjak](https://www.buzzerbeater.com/player/55967412/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 OD 9->12 HA 6->18 DR 6->18 IS 2->6 | feeders behind (HA+DR 12 vs track 34) |
| [Slavko Podlipnik](https://www.buzzerbeater.com/player/55967413/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 7->12 HA 8->18 DR 8->18 PA 5->6 IS 4->6 ID 1->4 SB 3->4 | feeders behind (HA+DR 16 vs track 34) |
| [Goran Grilc](https://www.buzzerbeater.com/player/55967415/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 4->11 HA 7->15 DR 10->15 ID 5->6 | feeders behind (HA+DR 17 vs track 28) |
| [Franko Rugelj](https://www.buzzerbeater.com/player/55967420/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 6->11 HA 8->15 DR 5->15 IS 5->7 ID 2->6 | feeders behind (HA+DR 13 vs track 28) |
| [Marcel Majerčič](https://www.buzzerbeater.com/player/55967421/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 HA 2->3 DR 1->2 PA 3->4 IS 6->14 ID 8->14 SB 7->9 | ID behind the big-man early-defense track |
| [Vitan Kastelic](https://www.buzzerbeater.com/player/55967426/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 2->5 OD 9->11 HA 5->15 DR 7->15 ID 5->6 SB 4->6 | feeders behind (HA+DR 12 vs track 28) |
| [Damjan Horvatiček](https://www.buzzerbeater.com/player/55967428/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 9->11 HA 4->15 DR 4->15 ID 5->6 | feeders behind (HA+DR 8 vs track 28) |
| [Sašo Vrhovc](https://www.buzzerbeater.com/player/55967435/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 3->11 HA 9->15 DR 7->15 RB 5->6 | feeders behind (HA+DR 16 vs track 28) |
| [Mladen Maruško](https://www.buzzerbeater.com/player/55967437/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 7->11 HA 7->15 DR 7->15 IS 5->7 ID 5->6 | feeders behind (HA+DR 14 vs track 28) |
| [Hasim Škerjanec](https://www.buzzerbeater.com/player/55967439/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 JR 2->5 OD 10->12 HA 4->18 DR 10->18 IS 1->6 RB 2->5 | feeders behind (HA+DR 14 vs track 34) |
| [Miloš Bauer](https://www.buzzerbeater.com/player/55967441/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 JR 4->5 OD 8->11 HA 5->15 DR 9->15 PA 1->4 ID 5->6 SB 2->6 | feeders behind (HA+DR 14 vs track 28) |
| [Hasim Šen](https://www.buzzerbeater.com/player/55967443/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->16 OD 8->12 HA 7->18 DR 9->18 PA 5->6 ID 3->4 | feeders behind (HA+DR 16 vs track 34) |
| [Džoni Badovinac](https://www.buzzerbeater.com/player/55967444/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 2->11 HA 8->15 DR 4->15 IS 4->7 ID 3->6 RB 5->6 | feeders behind (HA+DR 12 vs track 28) |
| [Mario Penca](https://www.buzzerbeater.com/player/55967445/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 6->11 HA 10->15 DR 4->15 IS 5->7 ID 4->6 RB 4->6 SB 4->6 | feeders behind (HA+DR 14 vs track 28) |
| [Nikolaj Pustovrh](https://www.buzzerbeater.com/player/55967447/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 4->11 HA 10->15 DR 8->15 RB 2->6 | feeders behind (HA+DR 18 vs track 28) |
| [Luka Keder](https://www.buzzerbeater.com/player/55967453/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 8->12 HA 4->18 DR 10->18 ID 3->4 | feeders behind (HA+DR 14 vs track 34) |
| [Tibor Rozman](https://www.buzzerbeater.com/player/55967454/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 OD 2->4 HA 1->3 IS 7->14 ID 9->14 RB 8->9 SB 6->9 | ID behind the big-man early-defense track |
| [Emanuel Dušak](https://www.buzzerbeater.com/player/55967456/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 JR 4->5 OD 9->12 HA 10->18 DR 2->18 IS 3->6 SB 2->4 | feeders behind (HA+DR 12 vs track 34) |
| [Matic Sanković](https://www.buzzerbeater.com/player/55967460/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 HA 1->3 IS 9->14 ID 6->14 RB 8->9 | ID behind the big-man early-defense track |
| [Jože Kanič](https://www.buzzerbeater.com/player/55967468/overview.aspx) | 19 | mkt72-inside-2 | WATCH | DR 1->2 IS 7->14 ID 5->14 | ID behind the big-man early-defense track |
| [Ante Dobre](https://www.buzzerbeater.com/player/55967469/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 4->11 HA 6->15 DR 4->15 | feeders behind (HA+DR 10 vs track 28) |
| [Mirko Virtič](https://www.buzzerbeater.com/player/55967470/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 1->5 OD 1->11 HA 5->15 DR 3->15 RB 3->6 SB 2->6 | feeders behind (HA+DR 8 vs track 28) |
| [Nikita Sernek](https://www.buzzerbeater.com/player/55967471/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 5->11 HA 5->15 DR 5->15 SB 2->6 | feeders behind (HA+DR 10 vs track 28) |
| [Senad Marini](https://www.buzzerbeater.com/player/55967473/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 6->11 HA 9->15 DR 4->15 ID 5->6 SB 2->6 | feeders behind (HA+DR 13 vs track 28) |
| [Zoki Ivanc](https://www.buzzerbeater.com/player/55967475/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 10->12 HA 3->18 DR 9->18 PA 5->6 IS 3->6 RB 4->5 SB 1->4 | feeders behind (HA+DR 12 vs track 34) |
| [Jurica Peranić](https://www.buzzerbeater.com/player/55967477/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 4->11 HA 7->15 DR 3->15 | feeders behind (HA+DR 10 vs track 28) |
| [Črt Fakin](https://www.buzzerbeater.com/player/55967479/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 7->12 HA 9->18 DR 8->18 ID 2->4 RB 4->5 SB 3->4 | feeders behind (HA+DR 17 vs track 34) |
| [Armin Kadunc](https://www.buzzerbeater.com/player/55967481/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 4->11 HA 3->15 DR 6->15 ID 5->6 RB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Dušan Pestotnik](https://www.buzzerbeater.com/player/55967482/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 10->12 HA 10->18 DR 8->18 IS 3->6 ID 3->4 | feeders behind (HA+DR 18 vs track 34) |
| [Timotej Absec](https://www.buzzerbeater.com/player/55967485/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 7->11 HA 5->15 DR 4->15 RB 5->6 SB 4->6 | feeders behind (HA+DR 9 vs track 28) |
| [Andrej Kosten](https://www.buzzerbeater.com/player/55967488/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 HA 2->3 IS 5->14 ID 9->14 SB 3->9 | ID behind the big-man early-defense track |
| [Fredi Gorše](https://www.buzzerbeater.com/player/55967489/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->16 OD 7->12 HA 2->18 DR 3->18 PA 5->6 IS 3->6 | feeders behind (HA+DR 5 vs track 34) |
| [Diego Metelko](https://www.buzzerbeater.com/player/55967492/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 1->5 OD 9->11 HA 2->15 DR 7->15 IS 6->7 ID 4->6 SB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Leonard Kralj](https://www.buzzerbeater.com/player/55967493/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 9->11 HA 9->15 DR 4->15 IS 3->7 ID 3->6 RB 3->6 | feeders behind (HA+DR 13 vs track 28) |
| [Aleš Malačič](https://www.buzzerbeater.com/player/55967496/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 3->11 HA 9->15 DR 9->15 PA 3->4 RB 3->6 SB 3->6 | feeders behind (HA+DR 18 vs track 28) |
| [Žare Rašl](https://www.buzzerbeater.com/player/55967499/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 JR 4->5 OD 7->12 HA 10->18 DR 7->18 IS 3->6 RB 4->5 | feeders behind (HA+DR 17 vs track 34) |
| [Aljaž Završnik](https://www.buzzerbeater.com/player/55967500/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 4->11 HA 7->15 DR 5->15 RB 3->6 SB 5->6 | feeders behind (HA+DR 12 vs track 28) |
| [Florijan Božič](https://www.buzzerbeater.com/player/55967505/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 6->11 HA 10->15 DR 9->15 IS 5->7 ID 3->6 | feeders behind (HA+DR 19 vs track 28) |
| [Pavel Dobromer](https://www.buzzerbeater.com/player/55967508/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 3->5 OD 3->11 HA 9->15 DR 7->15 PA 2->4 ID 5->6 SB 3->6 | feeders behind (HA+DR 16 vs track 28) |
| [Jurij Setnikar](https://www.buzzerbeater.com/player/55967509/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 9->12 HA 4->18 DR 6->18 PA 4->6 ID 2->4 RB 1->5 SB 2->4 | feeders behind (HA+DR 10 vs track 34) |
| [Joža Ahac](https://www.buzzerbeater.com/player/55967511/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 3->5 OD 6->11 HA 9->15 DR 3->15 RB 2->6 | feeders behind (HA+DR 12 vs track 28) |
| [Lovro Ravnikar](https://www.buzzerbeater.com/player/55967515/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 6->14 ID 9->14 SB 7->9 | ID behind the big-man early-defense track |
| [Urh Jamar](https://www.buzzerbeater.com/player/55967519/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 4->11 HA 8->15 DR 2->15 | feeders behind (HA+DR 10 vs track 28) |
| [Juš Rapre](https://www.buzzerbeater.com/player/55967520/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 9->11 HA 9->15 DR 6->15 RB 4->6 | feeders behind (HA+DR 15 vs track 28) |
| [Rastislav Šoster](https://www.buzzerbeater.com/player/55967521/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 1->13 JR 4->5 OD 6->11 HA 9->15 DR 6->15 IS 4->7 ID 5->6 SB 5->6 | feeders behind (HA+DR 15 vs track 28) |
| [Braco Martinc](https://www.buzzerbeater.com/player/55967524/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 9->12 HA 4->18 DR 10->18 PA 5->6 IS 4->6 ID 3->4 SB 2->4 | feeders behind (HA+DR 14 vs track 34) |
| [Jure Volčajnk](https://www.buzzerbeater.com/player/55967528/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 6->12 HA 7->18 DR 5->18 IS 3->6 RB 3->5 | feeders behind (HA+DR 12 vs track 34) |
| [Jožef Englaro](https://www.buzzerbeater.com/player/55967529/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 6->11 HA 8->15 DR 7->15 PA 3->4 IS 5->7 RB 5->6 | feeders behind (HA+DR 15 vs track 28) |
| [Jaka Majerle](https://www.buzzerbeater.com/player/55967536/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 JR 4->5 OD 10->12 HA 5->18 DR 2->18 IS 5->6 | feeders behind (HA+DR 7 vs track 34) |
| [Bojan Ribarič](https://www.buzzerbeater.com/player/55967538/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 3->5 OD 8->11 HA 1->15 DR 3->15 IS 4->7 SB 4->6 | feeders behind (HA+DR 4 vs track 28) |
| [Pino Sever](https://www.buzzerbeater.com/player/55967539/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 5->11 HA 8->15 DR 10->15 IS 6->7 RB 4->6 | feeders behind (HA+DR 18 vs track 28) |
| [Henrik Preskar](https://www.buzzerbeater.com/player/55967546/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 8->18 DR 3->18 IS 5->6 RB 1->5 SB 1->4 | feeders behind (HA+DR 11 vs track 34) |
| [Rok Cirar](https://www.buzzerbeater.com/player/55967566/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 JR 4->5 OD 9->12 HA 1->18 DR 4->18 IS 1->6 RB 3->5 | feeders behind (HA+DR 5 vs track 34) |
| [Žane Roj](https://www.buzzerbeater.com/player/55967572/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 4->11 HA 1->15 DR 9->15 PA 3->4 IS 6->7 RB 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Suad Cetinski](https://www.buzzerbeater.com/player/55967577/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 7->11 HA 3->15 DR 6->15 PA 3->4 IS 5->7 RB 4->6 SB 2->6 | feeders behind (HA+DR 9 vs track 28) |
| [Andre Slovak](https://www.buzzerbeater.com/player/55967579/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 4->12 HA 6->18 DR 7->18 IS 4->6 ID 1->4 | feeders behind (HA+DR 13 vs track 34) |
| [Gaj Belšek](https://www.buzzerbeater.com/player/55967581/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 4->5 OD 7->11 HA 4->15 DR 3->15 ID 5->6 | feeders behind (HA+DR 7 vs track 28) |
| [Timo Lovro](https://www.buzzerbeater.com/player/55967584/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 2->5 OD 5->11 HA 4->15 DR 8->15 IS 6->7 ID 4->6 SB 4->6 | feeders behind (HA+DR 12 vs track 28) |
| [Rik Lovrač](https://www.buzzerbeater.com/player/55967586/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 5->11 HA 9->15 DR 10->15 RB 4->6 | feeders behind (HA+DR 19 vs track 28) |
| [Henrik Gerzina](https://www.buzzerbeater.com/player/55967588/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 2->11 HA 3->15 DR 8->15 RB 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Ernest Osterverh](https://www.buzzerbeater.com/player/55967589/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 5->11 HA 5->15 DR 8->15 ID 4->6 SB 5->6 | feeders behind (HA+DR 13 vs track 28) |
| [Urban Brljak](https://www.buzzerbeater.com/player/55967590/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 3->11 HA 3->15 DR 9->15 RB 5->6 SB 5->6 | feeders behind (HA+DR 12 vs track 28) |
| [Todor Šenica](https://www.buzzerbeater.com/player/55967595/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 JR 4->5 OD 1->11 HA 5->15 DR 8->15 IS 3->7 | feeders behind (HA+DR 13 vs track 28) |
| [Miki Peruš](https://www.buzzerbeater.com/player/55967597/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 9->11 HA 9->15 DR 6->15 PA 3->4 | feeders behind (HA+DR 15 vs track 28) |
| [Dare Dobrila](https://www.buzzerbeater.com/player/55967599/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 10->12 HA 9->18 DR 10->18 IS 1->6 RB 3->5 | feeders behind (HA+DR 19 vs track 34) |
| [Bor Vampelj](https://www.buzzerbeater.com/player/55967612/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 9->12 HA 1->18 DR 8->18 ID 2->4 | feeders behind (HA+DR 9 vs track 34) |
| [Alfonz Volovnik](https://www.buzzerbeater.com/player/55967613/overview.aspx) | 19 | mkt72-inside-2 | WATCH | HA 2->3 IS 9->14 ID 6->14 RB 6->9 SB 7->9 | ID behind the big-man early-defense track |
| [Admir Zabukovec](https://www.buzzerbeater.com/player/55967616/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 10->12 HA 6->18 DR 3->18 RB 4->5 | feeders behind (HA+DR 9 vs track 34) |
| [Gojmir Toma](https://www.buzzerbeater.com/player/55967617/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 10->11 HA 7->15 DR 9->15 IS 4->7 SB 5->6 | feeders behind (HA+DR 16 vs track 28) |
| [Miroslav Brglez](https://www.buzzerbeater.com/player/55967618/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 8->11 HA 10->15 DR 6->15 IS 6->7 SB 4->6 | feeders behind (HA+DR 16 vs track 28) |
| [Omar Vesel](https://www.buzzerbeater.com/player/55967621/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 OD 1->4 HA 2->3 PA 3->4 IS 7->14 ID 7->14 RB 8->9 SB 7->9 | ID behind the big-man early-defense track |
| [Nenad Klobučar](https://www.buzzerbeater.com/player/55967624/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 1->5 OD 5->11 HA 8->15 DR 7->15 IS 3->7 SB 5->6 | feeders behind (HA+DR 15 vs track 28) |
| [Klemen Mlakar](https://www.buzzerbeater.com/player/55967625/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 JR 1->2 PA 1->4 IS 8->14 ID 8->14 RB 7->9 SB 6->9 | ID behind the big-man early-defense track |
| [Branko Urukalo](https://www.buzzerbeater.com/player/55967627/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 7->11 HA 1->15 DR 5->15 | feeders behind (HA+DR 6 vs track 28) |
| [Sašo Linasi](https://www.buzzerbeater.com/player/55967629/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 OD 7->12 HA 9->18 DR 4->18 IS 5->6 RB 1->5 | feeders behind (HA+DR 13 vs track 34) |
| [Dario Lap](https://www.buzzerbeater.com/player/55967635/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 6->11 HA 9->15 DR 10->15 ID 3->6 RB 5->6 | feeders behind (HA+DR 19 vs track 28) |
| [Tugo Vrhušek](https://www.buzzerbeater.com/player/55967636/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 4->5 OD 3->11 HA 8->15 DR 10->15 ID 2->6 SB 5->6 | feeders behind (HA+DR 18 vs track 28) |
| [Rok Javorič](https://www.buzzerbeater.com/player/55967652/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 10->18 DR 9->18 | feeders behind (HA+DR 19 vs track 34) |
| [Herbert Brigelj](https://www.buzzerbeater.com/player/55967654/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 OD 1->4 IS 9->14 ID 8->14 RB 7->9 SB 6->9 | ID behind the big-man early-defense track |
| [Tibor Grah](https://www.buzzerbeater.com/player/55967660/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 8->12 HA 7->18 DR 10->18 IS 5->6 ID 3->4 RB 1->5 SB 3->4 | feeders behind (HA+DR 17 vs track 34) |
| [Ožbej Nardin](https://www.buzzerbeater.com/player/55967666/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 8->12 HA 6->18 DR 8->18 PA 5->6 IS 1->6 RB 2->5 | feeders behind (HA+DR 14 vs track 34) |
| [Trpimir Repa](https://www.buzzerbeater.com/player/55967668/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 7->12 HA 8->18 DR 8->18 IS 5->6 ID 1->4 RB 3->5 | feeders behind (HA+DR 16 vs track 34) |
| [Lan Šegovič](https://www.buzzerbeater.com/player/55967669/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 3->11 HA 10->15 DR 1->15 IS 6->7 | feeders behind (HA+DR 11 vs track 28) |
| [Marko Florjančič](https://www.buzzerbeater.com/player/55967670/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 6->11 HA 3->15 DR 4->15 IS 3->7 ID 5->6 | feeders behind (HA+DR 7 vs track 28) |
| [Ignac Brezar](https://www.buzzerbeater.com/player/55967675/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 5->11 HA 4->15 DR 7->15 RB 4->6 | feeders behind (HA+DR 11 vs track 28) |
| [Ferdo Ogrič](https://www.buzzerbeater.com/player/55967677/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 OD 4->11 HA 9->15 DR 7->15 ID 4->6 | feeders behind (HA+DR 16 vs track 28) |
| [Ljubiša Stupan](https://www.buzzerbeater.com/player/55967678/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 3->5 OD 9->11 HA 5->15 DR 4->15 | feeders behind (HA+DR 9 vs track 28) |
| [Matic Koblar](https://www.buzzerbeater.com/player/55967684/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 4->12 HA 5->18 DR 8->18 IS 4->6 SB 1->4 | feeders behind (HA+DR 13 vs track 34) |
| [Darko Žilavec](https://www.buzzerbeater.com/player/55967687/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 3->12 HA 9->18 DR 3->18 PA 3->6 IS 3->6 ID 3->4 RB 4->5 SB 1->4 | feeders behind (HA+DR 12 vs track 34) |
| [Aleš Toporišič](https://www.buzzerbeater.com/player/55967688/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 8->11 HA 5->15 DR 9->15 RB 5->6 | feeders behind (HA+DR 14 vs track 28) |
| [Boštjan Laharnar](https://www.buzzerbeater.com/player/55967704/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->16 OD 5->12 HA 9->18 DR 9->18 IS 1->6 ID 2->4 | feeders behind (HA+DR 18 vs track 34) |
| [Bojan Navinšek](https://www.buzzerbeater.com/player/55967708/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 9->14 ID 8->14 RB 4->9 | ID behind the big-man early-defense track |
| [Ferdinand Gojkošek](https://www.buzzerbeater.com/player/55967709/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 OD 2->4 IS 5->14 ID 9->14 RB 2->9 | ID behind the big-man early-defense track |
| [Anže Koblenčer](https://www.buzzerbeater.com/player/55967717/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 5->11 HA 2->15 DR 8->15 PA 3->4 RB 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Zlatko Veršček](https://www.buzzerbeater.com/player/55967721/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 8->11 HA 3->15 DR 9->15 PA 3->4 SB 5->6 | feeders behind (HA+DR 12 vs track 28) |
| [Franko Podergajs](https://www.buzzerbeater.com/player/55967722/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 3->5 OD 3->11 HA 4->15 DR 5->15 IS 3->7 SB 3->6 | feeders behind (HA+DR 9 vs track 28) |
| [Nik Slana](https://www.buzzerbeater.com/player/55967729/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 6->12 HA 9->18 DR 9->18 ID 2->4 RB 4->5 | feeders behind (HA+DR 18 vs track 34) |
| [Senad Srna](https://www.buzzerbeater.com/player/55967731/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 3->12 HA 10->18 DR 8->18 IS 2->6 ID 2->4 | feeders behind (HA+DR 18 vs track 34) |
| [Vanja Vogrinec](https://www.buzzerbeater.com/player/55967736/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 7->18 DR 9->18 IS 3->6 | feeders behind (HA+DR 16 vs track 34) |
| [Matej Terseglav](https://www.buzzerbeater.com/player/55967742/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 4->11 HA 9->15 DR 9->15 ID 5->6 RB 3->6 SB 3->6 | feeders behind (HA+DR 18 vs track 28) |
| [Vasja Milosavljević](https://www.buzzerbeater.com/player/55967743/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 5->11 HA 3->15 DR 8->15 RB 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Ratko Šimčič](https://www.buzzerbeater.com/player/55967747/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 5->11 HA 3->15 DR 4->15 IS 3->7 ID 5->6 SB 5->6 | feeders behind (HA+DR 7 vs track 28) |
| [Vid Šobar](https://www.buzzerbeater.com/player/55967749/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 7->11 HA 10->15 DR 8->15 SB 2->6 | feeders behind (HA+DR 18 vs track 28) |
| [Šime Dernovšček](https://www.buzzerbeater.com/player/55967750/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 8->12 HA 3->18 DR 7->18 IS 2->6 ID 2->4 | feeders behind (HA+DR 10 vs track 34) |
| [Jože Modrijan](https://www.buzzerbeater.com/player/55967752/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 1->11 HA 3->15 DR 8->15 ID 5->6 RB 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Zlatko Matavž](https://www.buzzerbeater.com/player/55967755/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 6->11 HA 8->15 DR 8->15 IS 5->7 SB 2->6 | feeders behind (HA+DR 16 vs track 28) |
| [Pepe Nežmahen](https://www.buzzerbeater.com/player/55967758/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 7->11 HA 7->15 DR 6->15 ID 4->6 RB 5->6 SB 4->6 | feeders behind (HA+DR 13 vs track 28) |
| [Janez Intihar](https://www.buzzerbeater.com/player/55967764/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 8->11 HA 9->15 DR 9->15 PA 1->4 ID 3->6 | feeders behind (HA+DR 18 vs track 28) |
| [Andrej Kranjc](https://www.buzzerbeater.com/player/55967765/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 9->11 HA 5->15 DR 4->15 IS 4->7 RB 3->6 SB 4->6 | feeders behind (HA+DR 9 vs track 28) |
| [Ožbej Travner](https://www.buzzerbeater.com/player/55967768/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 OD 9->12 HA 7->18 DR 7->18 IS 3->6 ID 2->4 RB 2->5 | feeders behind (HA+DR 14 vs track 34) |
| [Gal Muhovnik](https://www.buzzerbeater.com/player/55967770/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 5->11 HA 1->15 DR 9->15 IS 6->7 ID 5->6 | feeders behind (HA+DR 10 vs track 28) |
| [Erik Kjuder](https://www.buzzerbeater.com/player/55967775/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 4->5 OD 9->11 HA 4->15 DR 5->15 IS 4->7 | feeders behind (HA+DR 9 vs track 28) |
| [Martin Krklec](https://www.buzzerbeater.com/player/55967779/overview.aspx) | 19 | mkt72-inside-2 | WATCH | PA 3->4 IS 5->14 ID 8->14 RB 8->9 SB 4->9 | ID behind the big-man early-defense track |
| [Dušan Užmak](https://www.buzzerbeater.com/player/55967781/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 7->14 ID 10->14 RB 4->9 | ID behind the big-man early-defense track |
| [Jakob Pamić](https://www.buzzerbeater.com/player/55967793/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 7->11 HA 4->15 DR 8->15 PA 2->4 IS 5->7 ID 3->6 | feeders behind (HA+DR 12 vs track 28) |
| [Niki Kramberger](https://www.buzzerbeater.com/player/55967798/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 4->11 HA 7->15 DR 6->15 IS 5->7 | feeders behind (HA+DR 13 vs track 28) |
| [Krištof Dobrak](https://www.buzzerbeater.com/player/55967807/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 JR 4->5 OD 9->11 HA 10->15 DR 4->15 IS 6->7 | feeders behind (HA+DR 14 vs track 28) |
| [Timo Setnikar](https://www.buzzerbeater.com/player/55967809/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 8->11 HA 1->15 DR 4->15 PA 3->4 IS 5->7 ID 5->6 SB 5->6 | feeders behind (HA+DR 5 vs track 28) |
| [Dare Vižintin](https://www.buzzerbeater.com/player/55967811/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 6->11 HA 5->15 DR 9->15 PA 3->4 ID 5->6 RB 3->6 | feeders behind (HA+DR 14 vs track 28) |
| [Gojko Bošnjak](https://www.buzzerbeater.com/player/55967814/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 IS 9->14 ID 10->14 SB 8->9 | ID behind the big-man early-defense track |
| [Tugomir Bogataj](https://www.buzzerbeater.com/player/55967818/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 3->11 HA 7->15 DR 6->15 | feeders behind (HA+DR 13 vs track 28) |
| [Mico Pečečnik](https://www.buzzerbeater.com/player/55967821/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 6->11 HA 7->15 DR 10->15 PA 3->4 RB 2->6 | feeders behind (HA+DR 17 vs track 28) |
| [Rene Vukoje](https://www.buzzerbeater.com/player/55967831/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 4->18 DR 8->18 IS 4->6 ID 2->4 RB 3->5 | feeders behind (HA+DR 12 vs track 34) |
| [Teodor Mujaković](https://www.buzzerbeater.com/player/55967835/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 JR 3->5 OD 9->11 HA 9->15 DR 2->15 | feeders behind (HA+DR 11 vs track 28) |
| [Ignac Šošter](https://www.buzzerbeater.com/player/55967845/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 3->11 HA 5->15 DR 7->15 ID 2->6 SB 3->6 | feeders behind (HA+DR 12 vs track 28) |
| [Drejc Vidic](https://www.buzzerbeater.com/player/55967846/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 9->11 HA 5->15 DR 8->15 PA 3->4 RB 4->6 SB 4->6 | feeders behind (HA+DR 13 vs track 28) |
| [Gaj Pešič](https://www.buzzerbeater.com/player/55967853/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 9->12 HA 7->18 DR 8->18 PA 3->6 IS 1->6 RB 2->5 SB 1->4 | feeders behind (HA+DR 15 vs track 34) |
| [Marcel Bizjak](https://www.buzzerbeater.com/player/55967856/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 8->12 HA 5->18 DR 9->18 PA 5->6 IS 1->6 RB 3->5 SB 1->4 | feeders behind (HA+DR 14 vs track 34) |
| [Juš Kostanjevec](https://www.buzzerbeater.com/player/55967858/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 3->12 HA 8->18 DR 7->18 IS 4->6 RB 2->5 | feeders behind (HA+DR 15 vs track 34) |
| [Anže Vrtačnik](https://www.buzzerbeater.com/player/55967860/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 8->11 HA 8->15 DR 5->15 RB 3->6 | feeders behind (HA+DR 13 vs track 28) |
| [Franko Lisac](https://www.buzzerbeater.com/player/55967862/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 2->11 HA 3->15 DR 5->15 PA 3->4 | feeders behind (HA+DR 8 vs track 28) |
| [Dejan Mršnik](https://www.buzzerbeater.com/player/55967864/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 JR 2->5 OD 5->11 HA 10->15 DR 5->15 RB 4->6 SB 5->6 | feeders behind (HA+DR 15 vs track 28) |
| [Drejc Novak](https://www.buzzerbeater.com/player/55967865/overview.aspx) | 19 | mkt72-inside-2 | WATCH | IS 7->14 ID 7->14 RB 7->9 SB 7->9 | ID behind the big-man early-defense track |
| [Boštjan Vizjak](https://www.buzzerbeater.com/player/55967868/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 7->12 HA 8->18 DR 8->18 RB 4->5 | feeders behind (HA+DR 16 vs track 34) |
| [Jožef Funtek](https://www.buzzerbeater.com/player/55967870/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 9->12 HA 4->18 DR 3->18 IS 4->6 | feeders behind (HA+DR 7 vs track 34) |
| [Gal Podvinski](https://www.buzzerbeater.com/player/55967880/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 JR 3->5 OD 10->11 HA 8->15 DR 10->15 IS 3->7 | feeders behind (HA+DR 18 vs track 28) |
| [Oliver Kavka](https://www.buzzerbeater.com/player/55967890/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 JR 3->5 OD 7->12 HA 2->18 DR 4->18 IS 2->6 ID 3->4 | feeders behind (HA+DR 6 vs track 34) |
| [Dare Vasle](https://www.buzzerbeater.com/player/55967902/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 JR 4->5 OD 7->12 HA 9->18 DR 5->18 PA 4->6 IS 5->6 SB 3->4 | feeders behind (HA+DR 14 vs track 34) |
| [Avgust Anžlin](https://www.buzzerbeater.com/player/55967904/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 9->11 HA 7->15 DR 3->15 ID 3->6 RB 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Radomir Lavrinec](https://www.buzzerbeater.com/player/55967905/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 10->13 JR 3->5 OD 7->11 HA 4->15 DR 7->15 IS 6->7 SB 3->6 | feeders behind (HA+DR 11 vs track 28) |
| [Simon Vrčko](https://www.buzzerbeater.com/player/55967907/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 8->11 HA 4->15 DR 7->15 IS 6->7 | feeders behind (HA+DR 11 vs track 28) |
| [Milimir Dragšič](https://www.buzzerbeater.com/player/55967914/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 5->11 HA 3->15 DR 3->15 IS 4->7 SB 5->6 | feeders behind (HA+DR 6 vs track 28) |
| [Bojan Levičar](https://www.buzzerbeater.com/player/55967916/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 3->12 HA 1->18 DR 8->18 IS 2->6 RB 4->5 | feeders behind (HA+DR 9 vs track 34) |
| [Bartol Tomič](https://www.buzzerbeater.com/player/55967917/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 8->12 HA 9->18 DR 8->18 IS 1->6 RB 4->5 SB 3->4 | feeders behind (HA+DR 17 vs track 34) |
| [Simon Benčik](https://www.buzzerbeater.com/player/55967920/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 JR 3->5 OD 7->11 HA 5->15 DR 9->15 IS 3->7 RB 3->6 | feeders behind (HA+DR 14 vs track 28) |
| [Jurij Žerjav](https://www.buzzerbeater.com/player/55967921/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 OD 9->12 HA 6->18 DR 9->18 PA 5->6 IS 3->6 ID 3->4 RB 2->5 | feeders behind (HA+DR 15 vs track 34) |
| [Rihard Veselinović](https://www.buzzerbeater.com/player/55967923/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 7->12 HA 6->18 DR 9->18 IS 5->6 ID 3->4 RB 4->5 | feeders behind (HA+DR 15 vs track 34) |
| [Jošt Gorenjšček](https://www.buzzerbeater.com/player/55967924/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 8->11 HA 8->15 DR 9->15 RB 5->6 SB 4->6 | feeders behind (HA+DR 17 vs track 28) |
| [Viljem Vinkšel](https://www.buzzerbeater.com/player/55967925/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 8->11 HA 9->15 DR 1->15 PA 3->4 IS 3->7 | feeders behind (HA+DR 10 vs track 28) |
| [Rene Hac](https://www.buzzerbeater.com/player/55967927/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 3->11 HA 9->15 DR 4->15 SB 5->6 | feeders behind (HA+DR 13 vs track 28) |
| [Vojan Rodman](https://www.buzzerbeater.com/player/55967928/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 5->12 HA 2->18 DR 9->18 IS 1->6 ID 1->4 SB 2->4 | feeders behind (HA+DR 11 vs track 34) |
| [Luka Kordež](https://www.buzzerbeater.com/player/55967929/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 7->11 HA 1->15 DR 2->15 PA 3->4 IS 5->7 ID 5->6 SB 4->6 | feeders behind (HA+DR 3 vs track 28) |
| [Darjan Čopič](https://www.buzzerbeater.com/player/55967931/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 10->11 HA 9->15 DR 10->15 SB 2->6 | feeders behind (HA+DR 19 vs track 28) |
| [Igor Babnik](https://www.buzzerbeater.com/player/55967938/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 OD 9->12 HA 9->18 DR 10->18 ID 1->4 | feeders behind (HA+DR 19 vs track 34) |
| [Tim Bračko](https://www.buzzerbeater.com/player/55967944/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 3->11 HA 9->15 DR 6->15 PA 3->4 | feeders behind (HA+DR 15 vs track 28) |
| [Admir Holzner](https://www.buzzerbeater.com/player/55967951/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 4->15 DR 4->15 IS 5->7 ID 3->6 RB 5->6 | feeders behind (HA+DR 8 vs track 28) |
| [Leopold Kupljen](https://www.buzzerbeater.com/player/55967952/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 4->5 IS 8->14 ID 5->14 RB 6->9 | ID behind the big-man early-defense track |
| [Marjan Blatne](https://www.buzzerbeater.com/player/55967953/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 7->11 HA 7->15 DR 5->15 ID 4->6 | feeders behind (HA+DR 12 vs track 28) |
| [Gaber Skočir](https://www.buzzerbeater.com/player/55967954/overview.aspx) | 19 | mkt72-inside-2 | WATCH | OD 1->4 PA 1->4 IS 9->14 ID 7->14 RB 6->9 SB 7->9 | ID behind the big-man early-defense track |
| [Anže Korenc](https://www.buzzerbeater.com/player/55967957/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 OD 7->11 HA 8->15 DR 7->15 PA 3->4 ID 5->6 SB 3->6 | feeders behind (HA+DR 15 vs track 28) |
| [Alen Bručan](https://www.buzzerbeater.com/player/55967960/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 JR 2->5 OD 7->12 HA 5->18 DR 8->18 RB 1->5 | feeders behind (HA+DR 13 vs track 34) |
| [Suad Udovič](https://www.buzzerbeater.com/player/55967961/overview.aspx) | 19 | mkt72-inside-2 | WATCH | HA 1->3 IS 8->14 ID 8->14 RB 4->9 | ID behind the big-man early-defense track |
| [Blaž Dončec](https://www.buzzerbeater.com/player/55967963/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 8->12 HA 9->18 DR 5->18 IS 4->6 RB 1->5 | feeders behind (HA+DR 14 vs track 34) |
| [Ožbej Perc](https://www.buzzerbeater.com/player/55967964/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 OD 2->4 HA 2->3 PA 3->4 IS 4->14 ID 10->14 RB 8->9 SB 3->9 | ID behind the big-man early-defense track |
| [Sergej Kek](https://www.buzzerbeater.com/player/55967966/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 4->13 JR 4->5 OD 4->11 HA 4->15 DR 5->15 IS 5->7 RB 5->6 | feeders behind (HA+DR 9 vs track 28) |
| [Lojz Žarn](https://www.buzzerbeater.com/player/55967974/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 2->11 HA 2->15 DR 7->15 IS 6->7 ID 5->6 SB 2->6 | feeders behind (HA+DR 9 vs track 28) |
| [Armin Fajdiga](https://www.buzzerbeater.com/player/55969578/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 8->12 HA 9->18 DR 9->18 | feeders behind (HA+DR 18 vs track 34) |
| [Vili Bračun](https://www.buzzerbeater.com/player/55969579/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 3->11 HA 7->15 DR 6->15 ID 5->6 SB 4->6 | feeders behind (HA+DR 13 vs track 28) |
| [Matjaž Debevec](https://www.buzzerbeater.com/player/55969588/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 3->5 OD 3->11 HA 4->15 DR 3->15 ID 3->6 | feeders behind (HA+DR 7 vs track 28) |
| [Bogo Žager](https://www.buzzerbeater.com/player/55969597/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 2->5 HA 1->3 DR 1->2 IS 6->14 ID 6->14 RB 7->9 | ID behind the big-man early-defense track |
| [Maks Kreft](https://www.buzzerbeater.com/player/55969606/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 7->12 HA 7->18 DR 10->18 IS 5->6 | feeders behind (HA+DR 17 vs track 34) |
| [Vid Gagulić](https://www.buzzerbeater.com/player/55989113/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 OD 9->12 HA 9->18 DR 5->18 RB 4->5 | feeders behind (HA+DR 14 vs track 34) |
| [Lan Srne](https://www.buzzerbeater.com/player/55989318/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 JR 4->5 OD 7->11 HA 8->15 DR 8->15 IS 5->7 RB 2->6 | feeders behind (HA+DR 16 vs track 28) |
| [Leonard Dernač](https://www.buzzerbeater.com/player/55989952/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 9->12 HA 9->18 DR 6->18 IS 1->6 ID 3->4 | feeders behind (HA+DR 15 vs track 34) |
| [Stribor Kunstelj](https://www.buzzerbeater.com/player/55990691/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 10->11 HA 8->15 DR 3->15 SB 5->6 | feeders behind (HA+DR 11 vs track 28) |
| [Mico Lavrih](https://www.buzzerbeater.com/player/55990756/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 8->16 OD 8->12 HA 9->18 DR 6->18 | feeders behind (HA+DR 15 vs track 34) |
| [Nikolaj Jakše](https://www.buzzerbeater.com/player/55990812/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 10->16 OD 8->12 HA 7->18 DR 9->18 PA 5->6 ID 1->4 RB 4->5 | feeders behind (HA+DR 16 vs track 34) |
| [Dejan Gril](https://www.buzzerbeater.com/player/55990897/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 6->13 OD 6->11 HA 7->15 DR 7->15 | feeders behind (HA+DR 14 vs track 28) |
| [Marinko Begić](https://www.buzzerbeater.com/player/55991058/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 8->11 HA 7->15 DR 9->15 IS 2->7 ID 5->6 | feeders behind (HA+DR 16 vs track 28) |
| [Gregor Meško](https://www.buzzerbeater.com/player/55991165/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 7->11 HA 3->15 DR 6->15 IS 3->7 SB 4->6 | feeders behind (HA+DR 9 vs track 28) |
| [Vladislav Korenc](https://www.buzzerbeater.com/player/55991584/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 7->11 HA 9->15 DR 4->15 | feeders behind (HA+DR 13 vs track 28) |
| [Robert Kisilak](https://www.buzzerbeater.com/player/55992025/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 8->13 OD 10->11 HA 5->15 DR 5->15 RB 5->6 | feeders behind (HA+DR 10 vs track 28) |
| [Pavle Kordel](https://www.buzzerbeater.com/player/55992302/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 5->13 OD 1->11 HA 9->15 DR 9->15 | feeders behind (HA+DR 18 vs track 28) |
| [Patrik Tomec](https://www.buzzerbeater.com/player/55992514/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 9->16 OD 5->12 HA 4->18 DR 4->18 IS 4->6 ID 3->4 SB 2->4 | feeders behind (HA+DR 8 vs track 34) |
| [Janez Černač](https://www.buzzerbeater.com/player/55993467/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 3->16 OD 8->12 HA 7->18 DR 8->18 PA 5->6 IS 3->6 ID 2->4 | feeders behind (HA+DR 15 vs track 34) |
| [Vlado Pliberšek](https://www.buzzerbeater.com/player/55993875/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 1->5 OD 1->4 HA 2->3 IS 6->14 ID 5->14 RB 8->9 SB 7->9 | ID behind the big-man early-defense track |
| [Damjan Brezovec](https://www.buzzerbeater.com/player/55994025/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 9->13 OD 4->11 HA 4->15 DR 2->15 ID 4->6 RB 3->6 SB 4->6 | feeders behind (HA+DR 6 vs track 28) |
| [Amir Mileta](https://www.buzzerbeater.com/player/55994335/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 8->11 HA 4->15 DR 4->15 ID 3->6 RB 5->6 | feeders behind (HA+DR 8 vs track 28) |
| [Igor Dolenjšek](https://www.buzzerbeater.com/player/55994653/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 6->16 OD 8->12 HA 4->18 DR 3->18 IS 4->6 SB 2->4 | feeders behind (HA+DR 7 vs track 34) |
| [Alan Glad](https://www.buzzerbeater.com/player/55995650/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 8->11 HA 9->15 DR 7->15 SB 3->6 | feeders behind (HA+DR 16 vs track 28) |
| [Aljaž Madić](https://www.buzzerbeater.com/player/56009270/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 4->16 JR 4->5 OD 7->12 HA 6->18 DR 4->18 PA 5->6 IS 4->6 ID 3->4 RB 2->5 SB 2->4 | feeders behind (HA+DR 10 vs track 34) |
| [Tejo Lesjak](https://www.buzzerbeater.com/player/56023177/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 2->16 OD 5->12 HA 3->18 DR 6->18 PA 1->6 IS 1->6 ID 2->4 RB 3->5 SB 1->4 | feeders behind (HA+DR 9 vs track 34) |
| [Marin Vočanec](https://www.buzzerbeater.com/player/56023189/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 2->13 OD 6->11 HA 5->15 DR 4->15 PA 2->4 IS 6->7 ID 2->6 RB 4->6 SB 2->6 | feeders behind (HA+DR 9 vs track 28) |
| [Joško Hrastnik](https://www.buzzerbeater.com/player/56025548/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 7->13 OD 5->11 HA 7->15 DR 3->15 PA 2->4 IS 3->7 RB 1->6 SB 4->6 | feeders behind (HA+DR 10 vs track 28) |
| [Tine Pellis](https://www.buzzerbeater.com/player/56031968/overview.aspx) | 19 | mkt72-inside-2 | WATCH | JS 3->5 HA 1->3 PA 1->4 IS 7->14 ID 6->14 RB 6->9 SB 4->9 | ID behind the big-man early-defense track |
| [Mirko Sulejmanović](https://www.buzzerbeater.com/player/56033828/overview.aspx) | 19 | mkt72-wing-1 | WATCH | JS 3->13 OD 1->11 HA 4->15 DR 1->15 PA 2->4 IS 6->7 | feeders behind (HA+DR 5 vs track 28) |
| [Leopold Klinger](https://www.buzzerbeater.com/player/56035046/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 7->16 OD 7->12 HA 5->18 DR 6->18 PA 4->6 IS 2->6 ID 3->4 | feeders behind (HA+DR 11 vs track 34) |
| [Mihael Purkart](https://www.buzzerbeater.com/player/56035048/overview.aspx) | 19 | mkt72-outside-1 | WATCH | JS 5->16 JR 4->5 OD 6->12 HA 5->18 DR 6->18 IS 3->6 ID 2->4 SB 1->4 | feeders behind (HA+DR 11 vs track 34) |
| [Nejc Baltič](https://www.buzzerbeater.com/player/55135459/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 13->20 HA 14->20 DR 15->20 ID 3->4 | non-defense skills >3 behind the age-20 track |
| [Samir Lipušček](https://www.buzzerbeater.com/player/55135461/overview.aspx) | 20 | mkt72-inside-2 | WATCH | SB 9->13 | non-defense skills >3 behind the age-20 track |
| [Demis Tahiri](https://www.buzzerbeater.com/player/55135479/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 16->20 HA 13->20 DR 16->20 IS 3->6 | non-defense skills >3 behind the age-20 track |
| [Čarli Jurković](https://www.buzzerbeater.com/player/55135557/overview.aspx) | 20 | mkt72-inside-2 | WATCH | IS 14->16 ID 15->16 RB 7->12 SB 7->13 | non-defense skills >3 behind the age-20 track |
| [Dare Ogrinec](https://www.buzzerbeater.com/player/55135621/overview.aspx) | 20 | mkt72-inside-2 | WATCH | IS 15->16 SB 9->13 | non-defense skills >3 behind the age-20 track |
| [Urh Kapelj](https://www.buzzerbeater.com/player/55135670/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 12->20 OD 11->12 HA 13->20 DR 15->20 | defense season: below track but training OD now; non-defense skills >3 behind the age-20 track |
| [Anton Šuštar](https://www.buzzerbeater.com/player/55135792/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 10->18 JR 4->5 HA 13->20 DR 15->20 | non-defense skills >3 behind the age-20 track |
| [Gorazd Grandovec](https://www.buzzerbeater.com/player/55135833/overview.aspx) | 20 | mkt72-inside-2 | WATCH | JS 5->6 DR 1->2 IS 9->16 ID 14->16 RB 6->12 SB 10->13 | non-defense skills >3 behind the age-20 track |
| [Franc Dekleva](https://www.buzzerbeater.com/player/55157684/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 9->18 HA 12->20 DR 13->20 SB 4->6 | non-defense skills >3 behind the age-20 track |
| [Milan Peterec](https://www.buzzerbeater.com/player/55158715/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 12->20 HA 14->20 DR 16->20 RB 4->5 SB 1->4 | non-defense skills >3 behind the age-20 track |
| [Oskar Jukić](https://www.buzzerbeater.com/player/55159709/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 7->18 JR 2->5 HA 2->20 DR 8->20 ID 4->6 SB 5->6 | non-defense skills >3 behind the age-20 track |
| [Zoki Pohorec](https://www.buzzerbeater.com/player/55439767/overview.aspx) | 20 | mkt72-outside-1 | WATCH | JS 7->20 HA 10->20 DR 11->20 RB 4->5 SB 3->4 | non-defense skills >3 behind the age-20 track |
| [Tine Majer](https://www.buzzerbeater.com/player/55439787/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 5->18 JR 3->5 HA 7->20 DR 10->20 IS 3->7 | non-defense skills >3 behind the age-20 track |
| [Sašo Koprivnjak](https://www.buzzerbeater.com/player/55439789/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 1->18 HA 12->20 DR 11->20 IS 4->7 | non-defense skills >3 behind the age-20 track |
| [Timo Lep](https://www.buzzerbeater.com/player/55439841/overview.aspx) | 20 | mkt72-outside-2 | WATCH | JS 10->20 HA 15->20 DR 14->20 ID 2->4 SB 2->4 | non-defense skills >3 behind the age-20 track |
| [Aljoša Mikek](https://www.buzzerbeater.com/player/55439940/overview.aspx) | 20 | mkt72-wing-1 | WATCH | JS 6->18 HA 12->20 DR 8->20 SB 3->6 | non-defense skills >3 behind the age-20 track |
| [Sandi Vončina](https://www.buzzerbeater.com/player/54827339/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 17->20 HA 16->20 DR 17->20 IS 5->6 | – |
| [Jure Tuma](https://www.buzzerbeater.com/player/54827408/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 12->20 HA 19->20 DR 19->20 | – |
| [Urban Lauš](https://www.buzzerbeater.com/player/54827430/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 19->20 HA 16->20 DR 17->20 IS 5->6 RB 4->5 | – |
| [Bogomir Strojan](https://www.buzzerbeater.com/player/54827452/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 17->20 HA 15->20 DR 16->20 RB 4->5 SB 2->4 | – |
| [France Valh](https://www.buzzerbeater.com/player/54827479/overview.aspx) | 21 | mkt72-outside-1 | WATCH | JS 8->20 HA 13->20 DR 10->20 | – |
| [Braco Tomazin](https://www.buzzerbeater.com/player/54827509/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 13->20 HA 14->20 DR 14->20 RB 3->5 SB 3->4 | – |
| [Aleš Neumann](https://www.buzzerbeater.com/player/54827572/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 7->20 HA 17->20 DR 16->20 IS 3->6 | – |
| [Alojz Slak](https://www.buzzerbeater.com/player/54827597/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 18->20 HA 16->20 DR 18->20 RB 2->5 | – |
| [Dare Štrukelj](https://www.buzzerbeater.com/player/54827601/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 13->20 HA 17->20 DR 18->20 | – |
| [Robi Silovšek](https://www.buzzerbeater.com/player/54827708/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 12->20 HA 18->20 DR 17->20 | – |
| [Teo Dimec](https://www.buzzerbeater.com/player/54827880/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 14->20 HA 19->20 DR 19->20 RB 2->5 | – |
| [France Štamulak](https://www.buzzerbeater.com/player/54827927/overview.aspx) | 21 | mkt72-inside-2 | WATCH | HA 2->3 SB 6->13 | – |
| [Tomaž Voranc](https://www.buzzerbeater.com/player/54851161/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 13->20 HA 17->20 DR 18->20 SB 3->4 | – |
| [Bor Majetič](https://www.buzzerbeater.com/player/55135435/overview.aspx) | 21 | mkt72-outside-2 | WATCH | JS 14->20 HA 19->20 DR 19->20 SB 3->4 | – |
| [Aleš Terkaj](https://www.buzzerbeater.com/player/55135707/overview.aspx) | 21 | mkt72-inside-2 | WATCH | IS 15->16 RB 10->12 SB 7->13 | – |
| [Brane Vinkšelj](https://www.buzzerbeater.com/player/55689184/overview.aspx) | 18 | mkt72-inside-1 | ON-TRACK | HA 1->2 ID 10->12 | – |
| [Sašo Kranjec](https://www.buzzerbeater.com/player/55689371/overview.aspx) | 18 | mkt72-inside-2 | ON-TRACK | ID 10->12 | – |
| [Nik Neuhold](https://www.buzzerbeater.com/player/55689458/overview.aspx) | 18 | mkt72-inside-2 | ON-TRACK | PA 2->3 ID 10->12 | – |
| [Vlado Veršček](https://www.buzzerbeater.com/player/55440110/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 10->13 OD 7->11 HA 14->15 SB 2->6 | defense lag OK at this age — feeders on track |
| [Janez Rakuš](https://www.buzzerbeater.com/player/55440274/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 10->13 OD 6->11 | defense lag OK at this age — feeders on track |
| [Matevž Perme](https://www.buzzerbeater.com/player/55462658/overview.aspx) | 19 | mkt72-wing-1 | ON-TRACK | JS 10->13 OD 4->11 HA 14->15 SB 5->6 | defense lag OK at this age — feeders on track |
| [Mark Košmrl](https://www.buzzerbeater.com/player/55688921/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | JS 1->5 IS 8->14 ID 13->14 | – |
| [Tezej Tomaš](https://www.buzzerbeater.com/player/55688943/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | JS 4->5 OD 3->4 PA 2->4 ID 12->14 SB 5->9 | – |
| [Patrik Murko](https://www.buzzerbeater.com/player/55689054/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | OD 2->4 HA 1->3 IS 10->14 ID 12->14 RB 8->9 SB 4->9 | – |
| [Dore Lovreković](https://www.buzzerbeater.com/player/55689060/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | IS 13->14 ID 13->14 SB 8->9 | – |
| [Vasja Podkapnik](https://www.buzzerbeater.com/player/55689171/overview.aspx) | 19 | mkt72-inside-2 | ON-TRACK | JS 2->5 IS 7->14 | – |

## Caveats & provenance

- **Cohort, not population:** this report describes what top U-21 programs SOLD at age-21
  eligibility end; senior-NT-track builds that never reach the market are deliberately absent.
- **Age-18/19/20 tiers are simulated:** market listings at those ages are survivorship-censored
  (on-track players are held, not sold), so young byAge tiers come from forward-simulated
  training + the Slovenian rookie census — never from young market listings.
- **Coverage gap:** Jul 23–Aug 2 captures were suppressed by BB's 1000-result search cap
  (fixed 2026-08-03 by per-age sweeps); the cohort skews toward Aug 3+ captures.
- **Greece is a benchmark, not a ceiling:** validates cluster shapes/floors against one
  federation's U-21 Euro-bronze roster (n=17); it is not a pass/fail target.
- **Season pin:** SEASON=72, age-21 flood. Re-run next season with
  `npm run training:archetypes -- --plans` from v2/ after bumping SEASON.
- **Data sources:** market snapshot sweep (`snapshots`, source='market'), Slovenian 18yo
  census (`snapshots`+`players`, country_id=66), and the Greek workbook at
  `docs/research/market-archetypes/greece-s72/greek_tidy.csv`.
