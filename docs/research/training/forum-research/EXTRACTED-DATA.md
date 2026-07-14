# BuzzerBeater Training Research — Extracted Data
Collected 2026-07-14. Raw page captures live in this directory (.html originals + .txt extractions).

## 1. Josef Ka's Potential Cap Formula (thread 188524, "Formula for Potential Uncovered", 2011)
Source: t188524-potential-2011.txt (Wayback 2011-09-03 capture of posts 188524.1-.11).
Final results based on **2,276 player samples** (post 188524.1, last edited 07/19/2011).

Potential Score PU(X) = max over 5 positions of sum(weight * skill).
Weights (JS JR OD HA DR PA IS ID RB SB):

| Pos | JS | JR | OD | HA | DR | PA | IS | ID | RB | SB |
|-----|----|----|----|----|----|----|----|----|----|----|
| PG | .18 | .26 | .30 | .24 | .12 | .52 | .03 | .04 | .20 | .03 |
| SG | .45 | .50 | .42 | .05 | .04 | .08 | .03 | .05 | .25 | .03 |
| SF | .58 | .34 | .26 | .05 | .03 | .03 | .05 | .25 | .33 | .03 |
| PF | .32 | .06 | .07 | .05 | .03 | .02 | .40 | .40 | .40 | .20 |
| C  | .06 | .08 | .01 | .04 | .03 | .01 | .46 | .46 | .46 | .25 |

Caps (Potential Score at which training slows ~3x, gradual transition; sublevels of potential decide where in the range):
- 0 announcer: 10 (= min sublevel of bench-warmer)
- 1 bench-warmer: 10-12 | 2 role player: 12-14 | 3 6th man: 14-16 | 4 starter: 16-18
- 5 star: 18-20 | 6 allstar: 20-22 | 7 per. allstar: 22-24 | 8 superstar: 24-26
- 9 MVP: 26-28 | 10 hall of famer: 28-30 | 11 all-time great: 30 (= max sublevel of HOF)

Notes from Josef Ka: potential weights differ from salary weights (offense weighted heavier); a player can be capped by a NEIGHBOURING position's formula; cap slowdown is gradual and "not understood yet how this slowdown progresses exactly"; after cap training is ~3x slower (estimate).
Methodology (posts .2-.4): sampled highest-salary players per potential x position on the transfer list, used the constraint that potential must equalize across positions to fit 50 coefficients. Earlier method credited to HeadPaperPusher (could not distinguish sublevels).

## 2. Community Training-Speed Table (thread 78242.1, "Training Speed Analysis 2", 2009-2016, 860 posts)
Source: t78242-tsa2-2022.txt (Wayback 2022-08-13). Maintained by WFU03, GM-edited by GM-kozlodoev.
Weeks-per-pop, assumes old lvl 9/10 trainer = new **level 5** trainer, 18/19yo trainee:
- Free Throws: 2 wks (trainer level does NOT affect FT or Stamina); Stamina: 1-2 wks
- Pressure PG: OD@2, ID/HN/DV@8+ | PG/SG: OD@3-4, ID/HN/DV@14-16 | PG/SG/SF: OD@4-5
- Shotblocking C: SB@1-2 | C/PF: SB@2-3, ID/RB@7-8
- Inside Defense C: ID@1-2 | C/PF: ID@2-3, DV/IS/SB@7-8
- Rebounding C/PF: RB@1.75 (~2.5 at age 24), ID/IS@10
- Inside Scoring C: IS@1-2 | C/PF: IS@2-3, ID/JS@7-8
- One-on-One Guards: DV@2-3, HN@3-4, JS@3-4 | Forwards: DV@1.8, HN@2.3, IS/JS@4-5 | Team: DV@4 (3 if low), HN@4-5, IS/JS@14-16
- Outside Shooting SG: JR@2-3, JS@4-6, DV/HN@7-8 | PG/SG: JR@3-4, JS@4-5
- Jump Shot Guards: JS@2-3, JR/HN/DV@7-8 | Forwards: JS@2-3, JR/IS@7-8 | Wingmen: JS@2-3, JR/DV/HN/IS@7-8
- Ball Handling PG: HN@1-2 | PG/SG: HN@2-3, DV@3-4, OD@7-8
- Passing PG: PS@1-2 | PG/SG: PS@2-3, HN@7-8...

Dev quotes (post 78242.2):
- BBMark: "We do give taller player bumps in rebounding, and shorter players bumps in handling in terms of how fast they train"
- BBCharles: "Driving and handling are very, very similar skills, and training either one will now also result in about **80%** of training on the other."
- BBDomenico: "we don't have osmosis training."

## 3. Raw measured logs (thread 381 "Training Speed Analysis", 2007-2009, 1000 posts, closed)
Source: t381-m937.txt (Wayback 2010 capture of posts 381.937-.947).
- polskidude (381.937): Pressure PG/SG, lvl 5 trainer, 6 players x 10 weeks, per-week minutes + pop markers. Findings: 6'0" players popped OD ~every 2 wks, 6'5" ~3 wks; secondaries (HN/DV/ID) at 14-16 wks not 7-8; potential doesn't slow training until near cap.
- Ali24 (381.941): One-on-One team training lvl 4 trainer, 12 players x 4 weeks with pops.
- CitB (381.942): 55 weeks guard training on allstar-potential player: pops = 7 JS, 3 JR, 4 OD, 6 HN, 7 DV, 5 PS, 1 ID, 1 ST = 34 total + 2 XP.

## 4. The BB Training Crowd-Sourcing Project (thread 203921, 2011-2013, 410+ posts) — THE dataset
Run by **wozzvt** on **training.bb-usa.net** (dead; Wayback captures exist but all pages are login-gated, incl. blog).
Site had: analysis.php, showAgeEffect.php, showAvgRates.php, showTrLevEffect.php, showSinglePopData.php, planner.php, errplot.php.
441+ weeks of user-contributed training data + US database. Public outputs were charts of decimal pops/week by training type, height, age, trainer level.
Example derived numbers quoted by w_alloy (203921.329, Sept 2012), 18yo 6'0":
- 1 week IS@C + 1 week JS@guards: .60 JS, .44 IS, .16 JR, .07 HA/DR, .04 ID = 1.31 pops
- 2 weeks JS@forwards: .74 JS, .68 IS, .12 JR = 1.54 pops
Tangosz: for big-man training JS guards/wingmen + IS@C beats JS forwards for talls.
Known data gaps (229484.3, Tangosz): trainer level effect "still a bit cloudy", shotblocking underdata.

## 5. rhyminsimon's Training Simulator (thread 229484, v2.1-2.3 2012; later v2.6.S25)
Excel/ODS model built directly on BB Training Project data, includes elastic effect. Claimed accuracy: "within .5 of a level" over 3 seasons for a 6'2" trainee (229484.4). Distributed via Google Drive links (original id 0ByNXe6cWgZCe..., truncated in archive). Later thread: "Latest version of training simulator" (302236), "Training Simulator" (302291, 271204).

## 6. Elastic effect research
- Definition + magnitude estimate: "for each level of handling above driving you get a 3.3% increase in training" (forum threads 220653, 197824); exponential S-curve; double pops at +10 gaps; recommended to keep gaps <= 5.
- CoachParrot coefficients discussion: thread 291954 "Coefficients in Coach Parrot" (27 posts; Evaristo, Minimalus Treneris, Joey Ka, Siwy, Manon) — elasticCoeff^levelDiff form, e.g. 0.91^3 = 0.754 multiplier (per search snippet; posts JS-gated on live site).
- Elastic evidence: Mod-Acajou (78242.338, 2010): 10 wks RB training w/ 9 skillups then IS training -> DOUBLE pop 5->7 in IS, lvl 7 trainer, no secondary pops. Josef Ka: "elastic effect can be quite dramatic" (78242.342).
- Other elastic threads: 287629 "Elastic Training", 310552 "Elastic effect (SB/ID)", 280711 "Elastic Training for Bigs" (guide).

## 7. Salary / DMI / game shape formulas
- Thread 160760 "Formula for DMI, game shape, enthusiasm, and salary" by Joey Ka (Josef Ka). Not in Wayback; live site JS-gated. Snippet: "60 is the magic number" for game-shape minutes.
- **bb-salary-calc.sourceforge.io** — Josef Ka's OpenOffice salary calculator v1.0.6 (2013-04-15), public domain: skill-dependent salaries all 5 positions, potential pane, enthusiasm pane. DOWNLOADABLE -> formulas extractable from the .ods.
- buzzer-manager.com (live, login-key required) credits "Josef Ka for his formulas" for its salary calc.
- Official change discussion: thread 324393 "[Official] Salary Formulas update".
- how8.com/bb — old external salary calculator (referenced 2011, likely dead).

## 8. Trainer level & FT court (modern, from "In Depth BB Training Guide" PDF, pdfcoffee/scribd)
- Trainer effectiveness: lvl7=100%, lvl6=99%, lvl5=97%, lvl4=93%, lvl3=86% (~3%/level near top; matches CoachParrot ~3%/level per thread 292157.1)
- Minutes thresholds: 18-19yo need 45+ min; 20-26 need 48; 27+ need 40 (as stated by that guide)
- Training court FT pops: lvl3 ~1/6wks @18 (1/9 @30+); lvl2 ~1/7 (1/11); lvl1 ~1/11 (1/20+)
- Cross-training: ~10% slower primary, distributed to secondaries
- Cites Discord "#training-graphs" channel (USA community) as a current data source.

## 9. Modern-era threads (live site, JS-gated — need logged-in browser to scrape)
- 302642 "Training Analysis" (Help-English)
- 323477 "Training Guide: Including Benchmarks by Age"
- 313486 "Learning the training system"
- 292157 "Training speed" (2018; sensiman SVN U21 participates — trainer level ~1 pop/season/level discussion)
- "My Utopia Training Experiment" (Help-English, 7 posts, seen in sidebar 2026)
- 144856.33 — potential->salary-cap guide referenced from 187979.2 (salary caps per potential: allstar 60-80k etc.)

## Scraping gotcha (important for follow-up)
Live buzzerbeater.com forum loads post bodies via ASP.NET AJAX; anonymous curl/Playwright gets ONLY thread metadata (participant list). Wayback captures from <=2013 and ~2022 contain full server-rendered posts. Recipe used: query CDX for read.aspx?thread=NNN&m=M captures, fetch, strip HTML. A logged-in session (user has BB accounts) would render posts and unlock threads 291954, 160760, 302642, 323477, 310552, 287629.
