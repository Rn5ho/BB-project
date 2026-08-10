# Season 73 update — what actually changed (research digest, 2026-08-05)

Status as of fetch time (2026-08-05 ~17:00 CET): the **official news post and dev Q&A are still
"upcoming"** — everything dev-side so far is (a) the home-page announcement and (b) BB-Marin's
Discord messages relayed on-forum by staffer EGM-Foto. The salary formula is **already live**
(applied 8/4–8/5) and is **still being adjusted** (dev-acknowledged guard-ID overshoot,
possible re-run). Training changes (elastic reduction) are being phased in "over a number of
seasons" starting now.

Provenance convention: `THREAD.POST` = buzzerbeater.com/community/forum/read.aspx?thread=THREAD&m=POST.
All quotes verbatim from logged-in fetches (raw text in this directory).

---

## UPDATE 2026-08-10 — the news post and Q&A have since been published and ANSWERED

*(Raw capture 2026-08-07 in `raw-0807/`; measured salary numbers in
`probe-outputs-2026-08-10.md`. Several statements below are superseded:)*

- **§1.2 RESOLVED**: a second salary update ran overnight 8/5→8/6 — ID cost for guards
  lowered vs the first version; **IS and SB raised for guards+SFs vs BOTH the old formula
  and the first version**; PF/C untouched (news post part 1 + Q&A 332391.42). ⚠ Marin's
  GROUP-8 answer originally said "OD" and was corrected 8/7 to "ID" (332391.53) — quote
  only the corrected text. **The salary-refit hold is lifted**; tag any refit S73-only
  (SB "might" rise again in S74 — 332391.43). Measured second-update effect (same-player
  8/7 vs 8/4): SG ×0.88, SF ×0.92 median; PG/PF/C ~×0.96.
- **§1.3 SUPERSEDED**: "Update since then, after reviewing data and code: **The cap has
  been set at higher levels than before** … most players will have more cap room"
  (332391.36).
- **§1.4 NUANCED**: "Elastics were reduced only marginally, so there is no need for any
  speed bumps" (332391.41) — BUT the news post says "**Expect skill progression to be a
  touch slower overall**": the earlier "training is not supposed to slow down" is walked
  back to a small net slowdown.
- **§1.5 QUANTIFIED + a second, previously unflagged matrix change**: "IS will be trained
  at the same level rebounding was, the tradeoff is both with ID and rebounding"
  (332391.38, answering Nowitzki's 332391.6) — AND "**Inside Scoring trains more inside
  defense and slightly less jump shot**" (news post part 1).
- **NEW dev facts**: the salary formula is now weights-based and deliberately tunable;
  ~85% of teams pay less, 180k+ players intentionally costlier; SB to become "a little
  bit more costly, especially in the extremes"; PA cost cuts for PG NOT planned; S72
  rookie scouting reports used the OLD formula (explains B+/A− salary inversions).
  Game engine: rebounding now depends on player energy (effect "will grow"); rarer
  position-dependent rebound tip-outs; multi-OT experience double-count bug fixed.
  **NEXT SEASON: 3-2 defense weakened, hoarding tax 10%→20% above 15M (was 25M) — S74
  is another era boundary.**
- Veteran no-pop salary jumps are intended recompute behavior, not a bug (332387).

---

## 1. DEV-CONFIRMED

### 1.1 New salary formula is live (applied during 8/4–8/5 offseason processing)
- Home page announcement, **BB-Marin, 8/5/2026 12:35:07 PM** (home-auth.txt):
  > "Note no.03: Player update completed, new salary formula has been applied. More information
  > about it in the upcoming news post and a special Q&A in the forums (link will be provided here)!"
- 332318.6 (EGM-Foto relaying BB-Marin, 8/3): draftees initially still had **old-formula
  salaries**; "Their salaries will be updated to the new formula along with all the other player
  later in the offseason processing."
- Design intent, 332318.18 (BB-Marin via EGM-Foto, 8/5):
  > "This is a new formula but it was engineered to follow the old one in most regards. It is
  > also intended to fix loopholes, as possible while adhering to the first principle. Most of
  > the salary increases you are seeing are a result of training, though, with some builds
  > becoming more expensive by design. Other builds have become cheaper, in order to offset that
  > so the total salary mass is slightly less than what it would be."
- Also 332318.18: "is there any skill that had a decrease? ... Most skills did. They are more
  spread out so the effects are not as visible." And on IS guards: "High IS guards are also more
  expensive, so the effect should balance out."
- Direction pre-announced in the **Season 72 news post (BB-Marin, 5/2/2026**, home-auth.txt):
  > "Shot blocking will return as a bigger factor in salary calculations, accompanied with some
  > other changes to the salary formula. The elastic effect in training will be reduced and
  > finally, there will be some game engine changes to address the trends in BB strategies.
  > We plan to implement these changes gently and over time."

### 1.2 Salary formula is IN FLUX — dev admits a mis-calibration, re-run possible
- 332318.26 (BB-Marin via EGM-Foto, 8/5 1:46 PM):
  > "SB changes are good, guard changes are not (ID effect changed more than IS, this was not
  > the intention). I take full responsibility and will see why this happened and if it should
  > be rectified."
- 332318.27 (8/5 2:14 PM): Q: "is it feasible the salaries are updated again to rectify this
  issue?" — A: **"Yes, of course. If we determine it is needed. Working on it now."**
- Corroborating observation 332329.11 (GM-MrJ, 8/5): a rookie's salary "was 12.05K like earlier
  today" then dropped — "Yeah. They made some adjustments." → salaries were already touched
  again during 8/5. **Do not hard-refit our salary model until this settles.**

### 1.3 Potential cap adjusted alongside salary
- 332318.17 (BB-Marin via EGM-Foto, 8/4):
  > "Cap is adjusted to emulate the same general levels as before. Since this is a new formula,
  > there will be players that will hit the cap sooner than they would have before, and those
  > are the exact ones that have their salaries increased comparing to what the old formula
  > would have given them. On the bright side, basically the same amount (or slightly more) of
  > players will hit their cap later than they would have, since their salaries decreased
  > comparing to before."
- Implication for our cap sub-model: the cap remains salary-coupled (weighted-skill-sum vs
  potential), so the NEW position weights flow straight into cap consumption. High-SB and
  high-ID/IS-perimeter builds now eat potential faster; PA/JR-heavy and classic low-SB bigs
  slower. (Coupling inference confirmed by community: 332391.7 Merimu — "potential is somehow
  linked with salary so with higher salary -> higher pot consumption" — community, not dev.)

### 1.4 Training: elastic effect reduced — gently, multi-season; overall speed NOT reduced
- 332318.12 (BB-Marin via EGM-Foto, 8/4):
  > "All will be explained in the news post, but for now, we are trying to reduce the elastic
  > effect but very gently, over a number of seasons, as it is currently had an unintended
  > effect of rewarding some undesirable training methods (focusing on one skill only for a
  > long time, rather than creating well rounded players). Training is not supposed to slow
  > down though, but it's a tough balancing act to offset the elastic effect with main training."
- Read: elastic (cross-skill towing) coefficients shrink; primary training rates get offset
  upward so net development speed stays ~flat. **No magnitudes given.** Phased over seasons —
  S73 is step 1 of several.

### 1.5 NEW training link: SB training will give slight IS gains
- 332318.17 (BB-Marin via EGM-Foto, 8/4): Q: "will SB training give some increments to IS now?"
  > "Yes, slight though, and this is planned for this training update."
- EGM-Foto's own reading (332391.8): "If I've understood it right, SB would train IS as well,
  but very slow." Exact rate/mechanism (secondary-slot vs elastic) unspecified; the owner's own
  question about ratios (332391.6, Nowitzki (SLO NT)) is queued for the Q&A.

### 1.6 DMI formula changed
- 332318.18 (BB-Marin via EGM-Foto, 8/5): Q: "DMI formula also changed?"
  > "Yes, since DMI is based on a hidden attribute which has changed. We will try to set it to
  > a similar level as before."
- Affects our Joey-Ka DMI inversion (GS-sublevel / virtual-salary estimation): the
  VirtSalary^(1/SalaryDeflator) input has changed shape. Expect drift in DMI-route estimates.

### 1.7 Meta-intent
- 332318.18 (BB-Marin): "Leaving things as they are for too long led to the situation where
  there were obvious loopholes and the whole game was shifting to some very specific builds and
  strategies. It is always better to try and fix things, even if it means breaking some eggs in
  the process. ... change was needed and, in my opinion, too late even."
- The 2024 announcement thread (324393, "[Official] Salary Formulas update", Suggestions,
  June 2024) laid out the same goal: "We aim to make the salary formulas reflect the skills that
  are trained ... an elite inside shot skill should reflect in the salary" (quoted at 324393.11).
  S73 is the delivery of that announcement.

---

## 2. COMMUNITY MEASUREMENTS / ESTIMATES (not dev; clearly labeled)

### 2.1 BuzzerIQ refit (Ubiond, buzzeriq.com article 2026-08-05 — "estimates from our BuzzerIQ
models, fitted on large live player samples ... Not official BB coefficients")
Per-role skill-weight deltas (new vs old):
- PG: PA ~−6%, JR ~−2%, ID "~0 → costs", IS "~0 → costs"
- SG: JR ~−8%, ID "~0 → costs", IS "~0 → costs"
- SF: ID ~+11%, IS "~0 → costs", JR ~−4%
- PF: IS/ID/RB ~−1..−3%, **SB ~+40%**
- C: IS/ID/RB ~−2..−6%, **SB ~+38%**
Build-level salary shifts: high-ID guard (ID≥13) ~+10%; high-ID SF ~+13%; high-IS guard (IS≥14)
~+8%; pure PG ~−5.5%; JR-heavy guard ~−3%; traditional low-SB big ~−3%; SB-heavy big (SB≥12)
~+11%. Overall "estimated salaries are a bit lower (roughly ~−4% median vs the old formula)".
Cap: "Soft cap was adjusted with the salary change ... Official weights are not published."
DMI: "No formula swap on day one" in BuzzerIQ's tooling; they are watching roster snapshots.
Estimator already updated: buzzeriq.com/tools/salary-estimator (cap levels still pending there).

### 2.2 Forum first-reactions (anecdotal)
- 332367.1 (Alonso, 8/4): "Seems like SB and ID on Guards got hit hard. sometimes more than 25%
  30%. ... IS Guards were not addressed at all it seems" (pre-dates Marin's guard-ID mea culpa,
  matches it).
- 332374.3 (Ubiond): "SG, PG, SF had a significant increase in ID, a slightly pricer IS. But got
  a slightly cheaper PA and JR. Bigs without SB will be slightly cheaper since IS, ID, RB got a
  bit cheaper. SB high increase on them."
- 332367.2 (JoviLux): SF shifts confusing; one SG decreased.

### 2.3 Our own data (repo probe, SELECT-only: scripts/training/centri-analysis/s73-salary-probe.mts,
run 2026-08-05; census #21 skills of 8/3 vs S73 salaries; n=354 Slovenian 18–21)
- Implied `deflationScale` vs our old-formula `estimateSalary`: median **0.739**
  (q1 0.701 / q3 0.790, p10 0.653 / p90 0.828) vs pre-update Neon refit **0.7144**.
  → At the median our old model + one global scale still lands close (consistent with
  "engineered to follow the old one in most regards"), but the wide per-player spread is the
  redistribution: one scalar no longer explains the cross-section — the position/skill weights
  moved.
- salary73/salary72 (same player, last S72 api salary): median **0.914** (q1 0.890, q3 0.940) —
  this cohort (young, mostly low-SB, outside-leaning) came out cheaper despite a season of
  training. Consistent with "total salary mass is slightly less" + BuzzerIQ's ~−4% median.
  Caveat: conflates annual salary recompute + any 8/5 re-adjustment.

---

## 3. NOT FOUND / NOT YET ANNOUNCED (honesty section)

- **No exact coefficients** for the new salary formula anywhere (BB never publishes them;
  BuzzerIQ numbers are fits).
- **No magnitude or schedule for the elastic reduction** — only "very gently, over a number of
  seasons". Nothing on WHICH pairs shrink or by how much, and nothing on the offsetting
  main-training boost size.
- **No statement that base training rates, age/height/trainer multipliers, or the training
  matrix changed** in S73 beyond the elastic reduction + SB→IS link. Absence of announcement is
  not proof of absence — our Friday self-trainer scorecard is the detector.
- **Game engine changes**: pre-announced directionally in the S72 news post ("game engine changes
  to address the trends in BB strategies"), but NOTHING concrete announced for S73 yet. Nothing
  on GS mechanics, stamina, sports psychologist (the S71 "minute management" workstream) in this
  update's communications.
- **Draft mechanics**: no changes found (only a processing-order note: draftee salaries were
  updated to the new formula later in offseason processing, 332318.6).
- The **official news post and Q&A answers did not exist yet** at fetch time. Q&A question
  thread: 332391 ("S73 - BB-Marin Q&A", opened by GM-Sergio 8/5). The Slovenia-relevant
  questions (SB cap consumption, SB→IS ratio — asked by Nowitzki (SLO NT), 332391.6) are
  unanswered as of this digest.

---

## 4. Implications for BB Scout recalibration (analyst notes, not sourced claims)

1. **Salary sub-model**: wait for the guard-ID rectification to settle (Marin "working on it
   now", 8/5) before any refit; then refit per-position coefficients (Josef-Ka structure may
   need SB/ID/IS weight changes, not just deflationScale). Our probe says the old shape +0.74
   scale is still a decent median-level approximation for the current Slovene U-21 pool.
2. **Cap ladder**: weights feeding Σ(pos-weights·skills) changed → cap-proximity estimates for
   SB-heavy and ID-heavy builds are now optimistic/pessimistic respectively until refit.
3. **Training engine**: expect bbscout elastic coefficients to become slightly too generous
   starting S73 (phased reduction); watch Friday scorecard MAE and the weekly per-pair
   residuals rather than pre-emptively changing parameters. Add SB→IS as a candidate link to
   watch in inference/scorecard (currently not in our elastic table).
4. **DMI**: DMI-based GS-sublevel/virtual-salary inversion needs re-validation before reuse.

---

## 5. Files in this directory

- `home-auth.html/.txt` — logged-in home.aspx (announcement + S70–S72 news posts archive)
- `t332318-offseason-p{1,2,3}.html/.txt` — "Offseason Updates" (EGM-Foto's Marin relays; the key thread)
- `t332391-qa.html/.txt` — "S73 - BB-Marin Q&A" (questions only so far)
- `t332367-newsalary.html/.txt` — "New Salary Formulas" (community reactions; closed by GM-Sergio)
- `t332374-estimator.html/.txt` — "New Salary Formula Estimator" (BuzzerIQ)
- `t332329-rookies-p{1,2}.html/.txt` — rookie salary/TSP + evidence of 8/5 salary re-adjustment
- `t324393-p1.html/.txt` — 2024 "[Official] Salary Formulas update" announcement thread (prior art)
- `buzzeriq-s73-article.html/.txt` — BuzzerIQ analysis article (community estimates)
- `t323477-guest.html`, `forum-index.html`, `forum-index-auth.html`, `allfolders.html`,
  `folder{1,2,3}.html`, `news.html`, `news2.html` — navigation/access artifacts

## 6. URLs fetched

Guest (curl): buzzerbeater.com/community/news.aspx (error page), /news.aspx (error page),
/community/forum/read.aspx?thread=323477&m=1, /community/forum/default.aspx,
/community/forum/read.aspx?thread=324393&m=1, buzzeriq.com/en/news/buzzerbeater-salary-formula-change-season-73.
Logged-in (BbWebSession, GET-only): /home.aspx, /community/forum/default.aspx,
/community/forum/AllFolders.aspx, read.aspx?folder=1|2|3,
read.aspx?thread=332391&m=1, ?thread=332367&m=1, ?thread=332374&m=1,
?thread=332318&m=1|11|21, ?thread=332329&m=1|11.
Also run: `v2/scripts/training/centri-analysis/s73-salary-probe.mts` (SELECT-only vs own Neon DB).
Helper created: `v2/scripts/research/fetch-s73-news.mts` (GET-only page fetcher, env-driven).
