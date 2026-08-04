# Market Archetypes — Season 72 (age-21 flood)

Generated: 2026-08-04T12:09:11.408Z · window start 2026-07-10 · seed 72
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

## outside group — k=1 (no clear structure; single profile)

Silhouette by k: {"2":0.14067782032145046,"3":0.10997216911599493,"4":0.08250655264386766,"5":0.07954759038212644} · ward-vs-kmeans agreement 1.00 · bootstrap Jaccard 1.00

### Market: outside #1 (mkt72-outside-1)

496 members · 66 elite · floor OD>=15 passed by 83/496 · near-cap 49 · 340 distinct sellers · self-match 17%

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 9 | 7 | 7 | 10 | 10 | 6 | 4 | 4 | 4 | 3 |
| median | 12 | 8 | 10 | 12 | 13 | 8 | 7 | 6 | 6 | 5 |
| p75 | 14 | 10 | 13 | 15 | 16 | 9 | 10 | 8 | 7 | 7 |
| elite median | 16 | 10 | 16 | 16 | 17 | 8 | 10 | 8 | 5 | 5 |

Typical: height 190cm · TSP 86 · potential {"7":129,"8":117,"9":151,"10":98,"11":1} · ST p50 5 · FT p50 8

Examples: [Olegas Sergadejevas](https://www.buzzerbeater.com/player/55061198/overview.aspx) (JS17 JR13 OD17 HA14 DR13 PA9 IS15 ID9 RB9 SB11) · [Roberto Bellentani](https://www.buzzerbeater.com/player/54664566/overview.aspx) (JS20 JR12 OD18 HA19 DR19 PA9 IS5 ID9 RB8 SB8) · [Duilio Citti](https://www.buzzerbeater.com/player/54664855/overview.aspx) (JS20 JR11 OD17 HA19 DR19 PA7 IS9 ID10 RB5 SB8)

## inside group — k=2

Silhouette by k: {"2":0.30488241934714916,"3":0.19922475948048693,"4":0.1598877255863802} · ward-vs-kmeans agreement 0.70 · bootstrap Jaccard 0.66, 0.88

### Market: inside #1 (mkt72-inside-1)

25 members · 6 elite · floor ID>=16 passed by 18/25 · near-cap 12 · 21 distinct sellers · self-match 60% (relaxed: sb)

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 3 | 3 | 4 | 4 | 4 | 4 | 4 | 15 | 12 | 17 |
| median | 5 | 4 | 6 | 5 | 5 | 8 | 6 | 17 | 14 | 19 |
| p75 | 7 | 7 | 8 | 7 | 6 | 10 | 8 | 18 | 16 | 20 |
| elite median | 6 | 7 | 7 | 7 | 5 | 9 | 8 | 19 | 16 | 21 |

Typical: height 208cm · TSP 89 · potential {"8":13,"9":6,"10":6} · ST p50 4 · FT p50 6

Examples: [Sergej Traparić](https://www.buzzerbeater.com/player/54771089/overview.aspx) (JS8 JR7 OD6 HA8 DR8 PA12 IS7 ID16 RB14 SB17) · [Quinn Ardley](https://www.buzzerbeater.com/player/55162472/overview.aspx) (JS5 JR10 OD11 HA6 DR5 PA7 IS8 ID20 RB11 SB20) · [Alfred Hoarau](https://www.buzzerbeater.com/player/54682871/overview.aspx) (JS2 JR4 OD7 HA5 DR4 PA8 IS9 ID20 RB18 SB23)

### Market: inside #2 (mkt72-inside-2)

170 members · 11 elite · floor ID>=16 passed by 36/170 · near-cap 38 · 125 distinct sellers · self-match 21%

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 5 | 3 | 3 | 4 | 4 | 3 | 9 | 8 | 8 | 7 |
| median | 7 | 4 | 4 | 6 | 7 | 5 | 11 | 11 | 11 | 9 |
| p75 | 9 | 7 | 7 | 8 | 9 | 7 | 14 | 15 | 13 | 10 |
| elite median | 10 | 7 | 6 | 8 | 9 | 6 | 18 | 17 | 13 | 12 |

Typical: height 211cm · TSP 78 · potential {"8":59,"9":71,"10":39,"11":1} · ST p50 4 · FT p50 7

Examples: [Leticijus Rozenblatas](https://www.buzzerbeater.com/player/55047695/overview.aspx) (JS13 JR9 OD10 HA11 DR11 PA11 IS20 ID17 RB11 SB11) · [Vardis Alvanos](https://www.buzzerbeater.com/player/54697198/overview.aspx) (JS9 JR6 OD7 HA10 DR9 PA6 IS19 ID17 RB14 SB14) · [Kristijonas Enikas](https://www.buzzerbeater.com/player/54740746/overview.aspx) (JS12 JR8 OD6 HA11 DR11 PA9 IS20 ID18 RB6 SB9)

## wing group — k=1 (no clear structure; single profile)

Silhouette by k: {"2":0.14457463171641582,"3":0.0962686654136707,"4":0.08724160136592764,"5":0.08667165557918702} · ward-vs-kmeans agreement 1.00 · bootstrap Jaccard 1.00

### Market: wing #1 (mkt72-wing-1) — PROVISIONAL (thin elite sample)

245 members · 0 elite · floor ID>=16 passed by 0/245 · near-cap 4 · 173 distinct sellers · self-match 0%

|  | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| p25 | 7 | 5 | 5 | 7 | 7 | 5 | 6 | 5 | 6 | 5 |
| median | 9 | 7 | 7 | 9 | 10 | 7 | 8 | 7 | 7 | 6 |
| p75 | 11 | 8 | 9 | 12 | 12 | 8 | 10 | 9 | 9 | 8 |
| elite median | – | – | – | – | – | – | – | – | – | – |

Typical: height 203cm · TSP 76 · potential {"7":82,"8":50,"9":66,"10":46,"11":1} · ST p50 5 · FT p50 8

Examples: [Jouni Skytta](https://www.buzzerbeater.com/player/54832628/overview.aspx) (JS18 JR10 OD15 HA19 DR20 PA8 IS7 ID9 RB6 SB6) · [Maurício Constante](https://www.buzzerbeater.com/player/55038789/overview.aspx) (JS12 JR9 OD15 HA15 DR15 PA9 IS12 ID11 RB7 SB10) · [José Badillo](https://www.buzzerbeater.com/player/54952067/overview.aspx) (JS14 JR11 OD13 HA15 DR15 PA9 IS9 ID12 RB10 SB7)

## Specificity (match rates across clusters)

| archetype \ cluster | mkt72-outside-1 | mkt72-inside-1 | mkt72-inside-2 | mkt72-wing-1 |
| --- | --- | --- | --- | --- |
| mkt72-outside-1 | 17% | 0% | 0% | 2% |
| mkt72-inside-1 | 0% | 60% | 2% | 0% |
| mkt72-inside-2 | 0% | 72% | 21% | 0% |
| mkt72-wing-1 | 0% | 72% | 21% | 0% |

## Proposed rules (paste-ready)

See `proposed-defaults.snippet.ts` next to this report. Younger byAge tiers are added by the --plans run.

## Plans

_Run with `-- --plans` to add training paths, byAge tiers, Greece benchmark, and the Slovenia gap analysis._
