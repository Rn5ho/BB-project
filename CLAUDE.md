# BB Scout - BuzzerBeater NT Player Tracker

## Overview
A Chrome Extension + Web App tool for BuzzerBeater National Team managers. Auto-captures player skills from the game's web UI and stores them in an online database for tracking, comparing, and scouting players across seasons. Built for Slovenia U-21 management.

## v2 Rework (in progress)

BB Scout is being rebuilt as v2. Design spec: `docs/superpowers/specs/2026-07-10-bb-scout-v2-design.md`. Phase 1 plan: `docs/superpowers/plans/2026-07-10-v2-phase1-foundation.md`.

**Phase 2 (Layer 1 automation) shipped 2026-07-10** — Daily Vercel cron `/api/cron/daily` (CRON_SECRET-protected, excluded from auth proxy). Jobs: seasons sync daily; players sync Mondays or on `?force=players`. Sync jobs in `v2/src/server/{bb,sync}/`. Settings page tracks countries, sync log, manual sync. Pages scope by `country_id` (66 = Slovenia) not nationality text. Slovenia page shows full ~820-player 18–21 universe (weekly refresh). Snapshot dedup: one 'api' snapshot per player per UTC day (delete+bulk-reinsert on same-day re-sync).

**Phase 3 (Market sweep) shipped 2026-07-10** *(scheduling + search shape superseded 2026-08-03 — see "Market flood fix" below; parser/session modules unchanged)* — Daily market sweep in `/api/cron/daily` runs every day after seasons. Scope: ages 18–21, potential ≥6, all countries, newest-first with 30h staleness stop-condition, MAX_PAGES 90 (configurable via MARKET_MAX_PAGES env override). Core modules: `src/server/bb/web-session.ts` (plain-HTTP buzzerbeater.com login — reused by Phase 4 census) and `src/server/bb/card-parser.ts` (fixture-tested). BB scraping gotchas: dates use BACKSLASH separators "7\10\2026", flag images identified by `id` containing `nationalFlag`, numeric skill values in `title` attributes. Market snapshots carry full skills + `starting_price` / `auction_ends_at` / `is_rookie_listing`. World page shows on-market/rookie chips. Settings has "Sync market now" button. Environment: `BB_WEB_PASSWORD` required (+ optional `BB_WEB_USERNAME`, falls back to `BB_API_USERNAME`) added to Vercel + `.env.local`. Cron route `maxDuration: 300`. Known minor: ~2.4% of market nationalities don't match the countries catalog (BB flag names like "Hellas" vs catalog) — future alias table.

**Phase 4 (Census CLI) shipped 2026-07-10** — Local CLI `npm run census` (from `v2/`) cycles every Slovenian 18–21 candidate through the U-21 NT roster in batches of ≤18: recruit → scrape full skills → dismiss → save `census` snapshots. NOT a Vercel job (performs write actions on the real NT account and runs for many minutes). Single-player live round-trip verified 2026-07-10.

CLI flags: `--dry-run` (list candidate plan + protected set, no roster actions), `--max N` (cap candidates), `--all` (include already-fresh-this-season), `--resume ID` (resume a prior run — first dismisses lingering `recruited` items), `--pause ms` (delay between actions, default 1500ms), `--min-tsp N` (TSP floor from latest full snapshot), `--nt-track-slack N` (keep only players within N TSP of the age NT-track benchmark, week-interpolated via `benchmarkTsp`; null TSP fails both).

**Census targeting upgrades (2026-07-20)**: candidate SQL moved to `src/server/census/candidate-rows.ts` (DB-only, no Playwright — importable from Next server actions). `/census` form gained: "Re-census already captured this season" checkbox (passes `all: true` — without it, mid-season re-runs only pick up never-captured players), Min TSP + NT-track slack filters, and a **Preview candidates** button (`previewCensus` server action — DB-only, lists matching players with TSP/Δbench/last-capture + ★ marks for players on the last known NT roster, who are protected → skipped unless "Clear roster" is ticked). Zero-candidate runs now finish cleanly without launching the browser (previously crashed on `values()` with an empty array). **TSP convention (owner-confirmed 2026-07-20)**: TSP NEVER includes stamina or free throw — it is BB's 10-rate-skill sum, exactly what the stored `snapshots.tsp` column holds (verified: always sum12 − ST − FT). The NT-track benchmarks (`benchmarks.ts`, thread 323477) are in the same 10-skill units. A Phase C bug had `board.ts` computing 12-skill projected TSP (incl. ST/FT) against those benchmarks — fixed to `tsp10` (planner TSP@21 / gap values shifted down accordingly). Anywhere TSP is computed from skills, sum the 10 rate skills only.

Recruit/dismiss driven by Playwright (`src/server/bb/nt-browser.ts`): raw-HTTP postback to BB's ASP.NET confirm buttons is unreplayable (requires prior client-side popup JS to prime hidden state) — Playwright drives a real browser. Login via `/login.aspx` using `#cphContent_txtUserName` / `#cphContent_txtPassword` / `#cphContent_btnLoginUser`. `BbWebSession` (plain HTTP) still used for read-only fetches (roster scrape reuses card-parser).

Safety model: (1) protected pre-existing roster — fetched at start, never dismissed; (2) only-dismiss-own-recruits — census only dismisses players it recorded as `recruited` in `census_items`; (3) try/finally roster cleanup — dismiss batch even on failure; (4) resume dismisses any lingering `recruited` items from a crashed run before continuing; (5) abort after 3 consecutive recruit failures (likely session death or rule change), roster cleaned first; (6) final roster-restored assertion — errors loudly if any unexpected players remain after run.

Source `census` snapshots; NT team 1066; roster page `/country/66/jnt/players.aspx`. DB tables: `census_runs` (status: running|finished|aborted|failed; totals jsonb) and `census_items` (status: pending|recruited|captured|failed|skipped). Settings page shows last 10 census runs + newest run's per-item status breakdown (read-only — runs are started locally). Resume with: `npm run census -- --resume <runId>`.

**Phase 4.5 (Hetzner census worker) shipped 2026-07-11** — Census no longer runs locally; now automated on a Hetzner VPS at `65.21.178.90` (Ubuntu, root user, apps in `/home/btcedge/`). Dashboard `/census` page enqueues a `census_runs` row with `status='requested'`, and a systemd service `bb-census` atomically claims requests, runs the census via Playwright headless chromium, and writes progress back to Neon. Do NOT disturb the user's separate `weather.service` or Tailscale also running on the box.
- **Push-triggered, NOT polled (reworked 2026-07-26)**: the original design polled Neon every 30 s. That never let Neon's compute scale to zero (~5 min idle threshold), so an idle worker held the DB awake 24/7 and consumed the entire 100 CU-hour monthly allowance by itself. Now `enqueueCensus` POSTs to the worker's wake endpoint (`http://65.21.178.90:8791/wake`, bearer `CENSUS_WAKE_SECRET`) right after inserting the row, and the worker's own DB poll is a 30 min safety net (`CENSUS_POLL_MS`). **Never lower `CENSUS_POLL_MS` below ~10 min** — that reintroduces the burn. The wake carries no payload: the `census_runs` queue stays the source of truth and the OFFSEASON/confirm gate is untouched. Env: `CENSUS_WAKE_SECRET` on both sides, `CENSUS_WAKE_URL` on Vercel, `CENSUS_WAKE_PORT` on the box (8791, opened in the Hetzner cloud firewall).
- **Update workflow**: SSH to `root@65.21.178.90`, then `cd /home/btcedge/bb-scout && git pull && cd v2 && sudo -u btcedge npm install && systemctl restart bb-census`. Use `npm install` NOT `npm ci` (Linux esbuild lockfile quirk). Repair browser: `./node_modules/.bin/playwright install chromium` (local playwright, not `npx`).
- **Logs & status**: `journalctl -u bb-census -f` (live logs), `systemctl status bb-census` (service state).
- **Daily cron moved to Hetzner, then fully local (2026-08-03)**: `/home/btcedge/bb-scout/bb-daily-cron.sh` in btcedge's crontab (06:00 UTC) runs BOTH jobs directly on the box via tsx — `MARKET_MAX_PAGES=100 npx tsx scripts/market-sweep.mts` (one search per age 18/19/20/21 so each stays under BB's 1000-result search cap, newest-first with staleness early-stop; oldest-first recovery pass if a single age band still exhausts the window) then `npx tsx scripts/daily-sync.mts` (seasons/minutes/inference; players+teams Mondays or `--force-players`). A second crontab entry runs market-sweep alone at 18:00 UTC while the season-end flood keeps both passes at BB's 1000-result cap (2000+ active listings; listings between the two windows can otherwise expire unseen between daily sweeps). The Vercel `/api/cron/daily` route still exists (with `?skip=market`) for manual/backup use, but grew past its 300 s `maxDuration` as the DB grew — 504s on Jul 20/27 and Aug 3 meant whole days of missed market capture. Vercel cron removed from `vercel.json` — Hetzner is the single scheduler.
- **Testing**: To enqueue without UI, insert directly: `insert into census_runs (status, totals) values ('requested', '{"opts":{"all":true,"minPotential":9,"max":1,"confirmed":true}}');`
- **Fallback**: Desktop `v2/census.bat` launcher still works for running census from the user's PC.

**Market flood fix + daily sync fully on Hetzner (2026-08-03)** — Investigation started from
high-potential 21yo Hellas listings missing from the dashboard. Two stacked root causes:
1. **Vercel 504s**: `/api/cron/daily` exceeded its 300 s `maxDuration` on Jul 20, Jul 27 and
   Aug 3 (whole days of lost market capture). Even with market removed the route still 504s —
   minutes+inference have outgrown the limit as the DB grew. All scheduled work now runs on
   Hetzner via tsx (see the cron bullet above); the Vercel route remains manual/backup only
   (`?skip=market` skips the sweep there).
2. **BB's transfer search caps results at 1000.** The old single 18–21 search hit the cap
   during the season-end flood (~1,700+ active pot≥6 listings) and, sorted newest-first,
   silently lost every older still-active listing — 7 of 8 listed Hellas stars were beyond
   the window. Fix: `runMarketSweep` gained `minAge`/`maxAge`/`oldestFirst` opts;
   `scripts/market-sweep.mts` sweeps **each age separately** (18/19/20/21 — verified totals
   387/511/380/444, all far under the cap, all reaching the staleness early-stop = full
   coverage), with an oldest-first recovery pass per band if one ever exhausts the window.
- New scripts (run from `v2/` with tsx; both log JSON counts): `scripts/market-sweep.mts`
  (per-age two-pass market) and `scripts/daily-sync.mts` (seasons/minutes/inference;
  players+teams on Mondays UTC or `--force-players`). Older phase notes saying jobs "run
  daily in `/api/cron/daily`" now mean "run daily via these scripts"; the route calls the
  same sync functions.
- **TEMPORARY: 18:00 UTC crontab entry** runs market-sweep a second time while the season-end
  flood lasts (belt-and-braces against >1000 listings/day per band). Remove it once the new
  season starts and `bb-market-sweep.log` shows small per-band totals again.
- **Write-safety audit (2026-08-03)**: the census (`NtBrowser` recruit/dismiss) is the ONLY
  code path that writes to BB. Market sweep, daily-sync and self-trainer are read-only —
  their only POSTs are search/pagination/`lbSwitchTeams` navigation postbacks. Census is
  triple-gated (dashboard-only enqueue, typed OFFSEASON confirm, worker never sets
  `confirmed`). Note: an enqueued census can start up to 24 h late via the worker's safety
  poll if the wake ping is lost — don't enqueue one within ~2 days of a season start.
  Known cosmetic: `census_runs` #9/#10 stuck at status 'running' since Jul 10 (crashed runs;
  inert — the worker only claims 'requested' rows).
- **Ops gotchas**: run long jobs detached (`nohup ... &`) — an SSH drop killed a daily-sync
  mid-run; logs live at `/home/btcedge/bb-cron.log` (06:00 run) and
  `/home/btcedge/bb-market-sweep.log` (18:00 run); if `git pull` on the box fails with
  "insufficient permission for .git/objects", fix with `chown -R btcedge:btcedge
  /home/btcedge/bb-scout`. Cost impact of the moves: sync bursts total ~0.4–0.6 Neon
  CU-hr/day (~$1.5–2/mo) — the scheduled load now lives on the flat-rate Hetzner box.

**Season-72→73 rollover prep + draft intake census (2026-08-03 evening)** —
- **Rookie age mechanics (important at every season boundary)**: derived age everywhere is
  `snap_age + (current_season − snap_season)` — there is NO stored age and nothing to
  migrate at rollover; existing players +1 automatically when the seasons sync sees the
  flip. BUT new draftees appear BEFORE the official rollover already showing their
  new-season age (rookies don't +1 at the rollover following their draft), so any rookie
  snapshot stamped with the old season derives +1 too old after the flip until a
  post-rollover snapshot restamps them. **Standing action: after each rollover run
  `npx tsx scripts/daily-sync.mts --force-players` on the box** (or wait for Monday's
  cron) to restamp the universe with the new season id.
- Related fix: `market-sweep.mts` now runs the seasons sync FIRST (before any sweeping) so
  rollover-day market snapshots can't pair post-rollover ages with the pre-rollover season.
- **Draft intake**: BB's Players API picked up the new Slovenian draft class the same day
  the intake appeared in-game (836 → 1,457 players 18–21; +621 new). A forced players sync
  pulls them in; the census preview only sees players already in the DB, so force the sync
  before queueing an intake census.
- **Census #21 (intake census, pre-rollover by user's choice)**: 365 candidates (18–19,
  pot ≥6, clear-roster) → 362 captured / 3 failed in ~48 min; 16-man roster auto-restored.
  Rookie snapshots carry season 72 → their derived ages read +1 after the flip until the
  post-rollover players sync (see standing action above); captured skills stay valid.
- **Wake button**: the enqueue→worker wake ping from Vercel can get lost (run #21 sat at
  'requested'). `/census` now has a "Wake worker now" button (`wakeWorkerNow` server
  action — same endpoint, but with user-visible success/error) plus a hint whenever a run
  is stuck at 'requested'. Manual fallback from the box: POST `localhost:8791/wake` with
  `CENSUS_WAKE_SECRET` from `v2/.env.local`.

**Phase 5.5 (Owner team/manager column + DMI fix) shipped 2026-07-11** — Player tables now display the owner TEAM name (links to BB team page) and owner MANAGER alias. New `teams` table (`team_id` pk, `name`, `owner_alias`, `updated_at`) populated via `teaminfo.aspx` API. Backfill: `npm run backfill:teams` (fetches distinct `players.owner_team_id`, ~865 teams). Daily cron calls `refreshTeams()` (in `src/server/sync/teams.ts`) after player sync to refresh >7 days old entries. Parsers/fetch: `parseTeamInfoXml`, `fetchTeamInfo` in `src/server/bb/xml-api.ts`. **DMI fix**: Census + market snapshots lack DMI (only `api` snapshots have it); players query previously read DMI from newest snapshot (often census with null DMI → showed "–"). Fixed with `latest_dmi` CTE in `src/queries/players.ts` reading DMI from most recent snapshot with non-null DMI. PlayerListRow gained `ownerTeamId`, `ownerTeamName`, `ownerManager`.

**Phase 5 (Player detail page) shipped 2026-07-10** — New `/players/[id]` route shows comprehensive player skill progression and history. Core components:

**Skill Progression Chart**: 12-line SVG chart (one per skill, X-axis = snapshot dates, Y-axis = skill level 1-20) with legend toggle. Hand-rolled dependency-free charts (`src/components/charts/TimeSeriesChart.tsx` + `src/lib/chart-scale.ts` + `src/lib/series.ts`).

**Metric Charts**: DMI + salary trajectory charts also rendered via hand-rolled SVG. Client wrapper `MetricChart` handles formatting because Next 16 forbids server→client function prop passing (e.g., `formatY`).

**Snapshot History Table**: The authoritative view for "when are these skills from". Columns: date, source badge (api/manual/census), per-skill deltas vs. previous full snapshot (green +N for gains, red -N for losses). Every capture row shows snapshot metadata + skill comparison.

**Position-over-Time Timeline**: Visual segment showing player's position edits across snapshots. Gotcha: `bestPosition` not yet stored per-snapshot, so currently shows one segment. Future enhancement: add position column to snapshots table for multi-segment timeline.

**Notes + Tags**: Editable notes and tags via server actions. Player names in tables now link to `/players/[id]` (external BB link kept as ↗).

**Known limitation**: per-snapshot `bestPosition` not stored yet — position timeline displays one segment (future enhancement).

All v2 phases complete (1 foundation, 2 sync, 3 market, 4 census, 4.5 worker, 5 detail) + training phases A, B, C.

**2026-07-13 UX batch shipped** — three features (specs + plans in `docs/superpowers/`):
1. **Settings rework**: `/settings` is three cards (tracked countries / data sync / sync log). Data sync card has one row per job (seasons/players/market/census) with schedule chip, plain-language description, live "last run" line (per-job `limit(1)` queries on `sync_log`), and Sync now buttons (census row links to `/census`). Census runs table removed from settings; its newest-run per-item breakdown moved to `/census`. Formatters shared in `src/lib/format-sync.tsx` + `src/lib/format-census.ts`.
2. **Ad-hoc skill filters**: "Skill filters ▾" row in the shared `FilterBar` — 12 per-skill min inputs (`FilterState.skillMins`, filtering in `filterRows`; null skill fails when set). Works on Slovenia + World; badge shows active count; persists via localStorage (special-cased in `PlayerTable.sanitizeFilter`).
3. **Progress since last review**: `review_marks` table (one row, scope 'slovenia') set by a "Mark as reviewed" button (`ReviewBar` + server action). `listPlayers` compares latest full snapshot vs latest at-or-before the mark (`baseline_full` CTE) → BB-style green `+N` / red `−N` superscripts on skill cells and a sortable Δ(TSP) column. No mark / no baseline → dormant.

Known pre-existing issue: hydration mismatch on player tables (`toLocaleString()` server en-US vs client sl-SI for DMI/salary).

**Training engine Phase A shipped 2026-07-14** — Pure-TS training model layer in
`v2/src/lib/training/`: three provenance-tagged parameter sets (`coach-parrot` extracted
from cp_2_1, `open-source-live` from recorded buzzeriq probes, `bbscout` synthesis =
default), `weekStep`/`project` engine (14-week seasons, decimal sublevels, ceil display),
ensemble min-max bands (`ensembleProject`), Josef Ka salary + potential-cap sub-models
(`salary.ts`; cap = Σ(pos-weights·skills) ≥ offset+2·potential — dev-blessed 3-stage ladder
×0.725/0.45/0.25 at offsets 8/9/10, per 2026 Discord dev Q&A; internal skills may exceed 20,
display clamps). bbscout elastic = ADDITIVE post-multiplier per-pair bonus (2026 Slovenian
community worked example, `docs/research/training/user-notes/dev-statements-2026.md` §0 —
not scaled by age/height/trainer; Dormouse coefficient table). Calibration:
CP worked-example gate (±1e-4), buzzeriq fixture replay (`docs/research/training/buzzeriq/probes/`,
worst open-source-live error 0.008), forum weeks-per-pop sanity. Scripts: `npm run training:simulate`,
`training:report`, `training:refit-salary` (2026-07-14 fit vs Neon: deflationScale 0.7144,
median |err| 11.7% on 58 players — the announced-2024 BB salary rework is real; refit on
better data in Phase B). Research archive + provenance chain: `docs/research/training/README.md`.
Design spec: `docs/superpowers/specs/2026-07-14-training-planner-v2-design.md` (Phases B–D:
position-minutes pipeline, inference flywheel, planner UI).

**Training Phase B shipped 2026-07-14** — Position-minutes pipeline + player-page Development
tab. Tables: `matches` (boxscore_fetched_at null = pending work), `player_match_minutes`
(per-position minutes per tracked player per match), `training_plans` (jsonb blocks,
one active per player); `teams.schedule_synced_at/_season` tracks per-club schedule
freshness. Sync: `runMinutesSync` in `src/server/sync/minutes.ts` (incremental, batch-limited:
distinct owner clubs of Slovenian prospects → `schedule.aspx` → countable finished matches
(`league.*`/`cup`/`friendly`/`pl.*`; NOT bbm/nt/b3/unknown) → `boxscore.aspx` per-position
minutes; runs daily in `/api/cron/daily` (`?force=minutes` = bigger batches); manual row on
/settings; `npm run backfill:minutes -- --season N` for backfills. Week bucketing: 7-day
season-weeks from `seasons.start` (`seasonWeekOf`). Player page: MinutesStrip (stacked
per-week position minutes + eligible-training chips), DevelopmentSection (ensemble TSP
band chart via client-side `ensembleProject`, per-skill projection table, dual CapBar
now/end-of-plan, PlanEditor seeded from `src/lib/training/templates.ts` archetypes, savePlan
server action). Bridge helpers (snapshot→PlayerState at displayed−0.5, `eligibleTrainings`,
`planToWeeks`, `bandSeries` — display-equivalent scale = sublevel+0.5 so untrained skills
hold their displayed value): `src/lib/training/bridge.ts`. Gotcha: use `toLocaleString('en-US')`
in client components (server/client locale hydration mismatch).

**Facilities + calibration shipped 2026-07-14 (late)** — Gym cross-training scatter
(EV: gym-added slots × 10% of primary spread over 12 skills incl. ST/FT; dev-specified)
and training-court passive FT (L1/2/3 ≈ 1/11, 1/7, 1/6 lvl/wk at 18, minutes-independent)
in the engine + plan editor + `training_plans.gym_level/training_court_level` (migration
0007). Sublevel uncertainty in the ensemble band (`sublevel-low/high` runs at displayed
−0.99/−0.01 — displayed ints hide ~1 level of unknowable variance, per owner).
Own-team ground truth: `npm run training:scrape-history -- --team N --coach C --yt Y
--gym G --tc T [--switch-team]` scrapes traininghistory.aspx (own players only;
--switch-team = second-team context via home.aspx lbSwitchTeams postback) into
`docs/research/training/calibration-cases/auto/`; `npm run training:replay <dir|file>`
scores models against observed pops. Current fit (7 trainees, 98 pops): bbscout MAE
0.41 displayed levels, 61% final skills exact, pop recall 45% — beats CP (0.61/50%) and
BuzzerIQ-OSL (0.64/47%); minutes gating vindicated (0-minute trainee: bbscout 10/10 exact,
CP/OSL 12 phantom pops).

**Training lab tab shipped 2026-07-14** — `/training` (nav: Training): pick a tracked
full-skill player (`?player=ID`, saves plans via the same server action) or "Build a player"
(manual age/height/potential + 12 skills; since 2026-07-22 also a Season week input, default
1 = fresh draftee at season start — it overrides `startWeekOfSeason` in manual mode only, so
hypothetical builds are no longer pinned to the real current week) → `ProjectionPanel` (extracted from
DevelopmentSection: band chart, projection table, cap bars, plan editor; Save hidden without
`onSave`). Query: `getProjectablePlayers()`. Catalog carries in-game `label`s ("One on One
(PG/SG)") alongside research keys ("DR for 12"). Gated-forum mining (logged-in BbWebSession):
Joey Ka's exact DMI/GS/salary formulas + BB-Justin cap-ladder confirmation in
`docs/research/training/forum-research/gated/` (FINDINGS.md = digest; rhyminsimon sheet
permanently lost, 410).

**Training Phase C shipped 2026-07-15** — Inference flywheel + `/planner` cohort board.
Tables: `skill_pops` (displayed-level changes between consecutive full snapshots; source
'snapshots' rebuilt each run, 'own-scrape' exact-date rows persist — written by
training:scrape-history) and `training_observations` (per club-window inferred training +
confidence; full rebuild each run). Job: `runTrainingInference` in
`src/server/sync/inference.ts` — DB-only (no BB calls), daily in `/api/cron/daily`, manual
row on /settings, local run `npm run training:infer`. Key design: BB clubs pick ONE
training/week, so pops pool across a club's tracked players; weekly api snapshots are
LIGHT (no skills), so pops come from census/market/manual windows (multi-week). Scoring:
`inferClubTraining` (`src/lib/training/infer.ts`) — score = explained − 0.5·contradiction
(explained = Σ min(predicted bbscout gain over the window's minutes, observed delta);
contradiction = predicted gains >1 level on non-popped skills); confidence from pop count +
margin vs best different-primary rival; ST/FT pops excluded (gym/TC pop them independently).
Pop-anchored sublevels: `sublevels.ts` + `boundsFromAnchors`/`applyAnchors` in bridge —
a pop observed at a known date pins that skill near x.0, tightening the ensemble band
(`ensembleProject` accepts per-skill `sublevelBounds`); wired into player page + training
lab. `/planner` (nav: Planner): all Slovene 18–21 full-skill prospects — inferred club
training, avg minutes, TSP vs NT-track benchmark (`benchmarks.ts`, thread 323477:
18:55/19:70/20:83/21:100), projected TSP@end-of-21 under current vs best archetype
template (neutral staff coach 5/YT 5), gap-sorted for outreach. Board math in
`src/lib/training/board.ts` (pure), data in `src/queries/planner.ts`. First live run:
1,027 pops, 196 club windows, 63 high + 42 medium confidence inferences; 115 exact-date
own-scrape anchors.

**Training horizons + reverse planner shipped 2026-07-15** — (A) Plans can target an
(age, season-week) horizon: `src/lib/training/horizon.ts` (absWeek grid; convention: the
CURRENT season week counts as UPCOMING — first plan week trains at the current week,
matching `project(startWeekOfSeason)`); PlanEditor picker (presets bounded at entering
age 22 via `MAX_HORIZON_AGE`) + auto-derived last block (`fitBlocksToHorizon`/
`normalizePlan`); `training_plans.horizon_age/horizon_week` (migration 0009) make saved
plans self-updating — ProjectionPanel re-derives the fitted blocks from TODAY's week at
render time (`fitted` memo) and saves/projects those, so editor display always matches
the projection; band chart shows dashed age-up markers. (B) Reverse planner
`src/lib/training/optimize.ts`: beam search (width 128, switch penalty 0.02, dedup on
rounded skills+last-training) over weekly skill-training choices stepped with the real
`weekStep`/BBSCOUT; lexicographic objective = weighted shortfall (priorities 3/1/0.4) →
weighted hit-earliness → TSP → fewer switches; τ(d) = d−1+1e-6 matches ceil display.
TargetBuildPanel (inside ProjectionPanel — player page + training lab): explicit-targets
model (`targets` holds only user-raised skills; missing key follows current — live skill
edits can't fabricate targets), results carry an input fingerprint and hide with a
"re-run" hint when any input changes. Known: `board.ts weeksToEndOfAge21` still uses the
old one-week convention (align in a follow-up); optimizer TSP tier is weak under beam
pruning (documented in optimize.ts). Spec:
`docs/superpowers/specs/2026-07-15-training-horizons-reverse-planner-design.md`.

**Smart plan defaults + archetype proposals (2026-07-20)** — unsaved plans no longer seed
the raw first template with no horizon (which overran U-21 for everyone): ProjectionPanel
seeds horizon = end of U-21 (`MAX_HORIZON_AGE`, age-aware) with the template trimmed via
`trimBlocksToHorizon` (horizon.ts — unlike fitBlocksToHorizon it never leaves earlier
blocks overshooting). TargetBuildPanel takes `archetypes` + `evalPlayer` (wired on player
page + both training-lab modes): on first open it picks the best-fitting archetype
(matches first, then fewest failing checks), loads its **age-21 tier** '>=' rate-skill
thresholds as targets (`src/lib/archetypes/targets.ts`; '<=', ST/FT and attribute rules
are constraints, not targets; skills already at target stay untargeted) and auto-runs the
beam search — switching archetype or deadline re-runs automatically. Deadline picker
unchanged (start-of-21 / end-of-U21 / custom age·week).

**Community-paste investigation 2026-07-18** — two anonymous pastes (training rates +
height multipliers) resolved via three-way diff + 10 fresh live probes as a transcription
of the CURRENTLY DEPLOYED buzzeriq.com open_source model, which has drifted past its
GitHub source. `open-source-live` updated to the probed deployed values (1v1/JS-SF-PF/HA
rows, HA-flat + DR-0.95 + IS-low-end height columns, JS re-based — the old ×1.04@201
reading was an artifact). bbscout UNCHANGED (lineage ≠ independent evidence; HA-flat
weakly favored at ≤185cm only, p≈0.31, tall datapoint against, BBMark 2022 dev quote
against). New weekly-scorecard variant `bbscout-ha-flat` arbitrates the HA question from
Friday runs. Full story + open era-conflict (JS→JR towing 2x?) + census-corpus test plan:
`docs/research/training/user-notes/community-paste-2026-07.md`; comparison script:
`v2/scripts/training/compare-community-2026.mts`; probes 33-42 in buzzeriq/probes/.

**Self-trainer shipped 2026-07-17** — automated weekly own-team calibration loop:
`runSelfTrainer` (`src/server/sync/self-trainer.ts`) scrapes traininghistory.aspx for
players owned by the configured club (single-row `self_trainer_config`: team + coach/YT/
gym/TC, editable on `/scorecard`), upserts exact-date 'own-scrape' pops, replays each
player's history through the 5-model panel (shared `src/lib/training/replay.ts` +
`src/server/bb/training-history.ts` — extracted from the CLIs, behavior-identical) and
writes per-model `model_scorecards` rows (migration 0010). Staff + facilities are
AUTO-SYNCED each run from `staff.aspx`/`arena.aspx` (`src/server/bb/team-pages.ts` —
staff level = `lblStaffSkillLevelDisplay` title attr, gym/TC = inline `var lvlGym`/
`var lvlTC`; stored config is bootstrap/fallback, only team id is required).
`/scorecard` page: config, Run now, MAE + pop-recall trend, latest-run breakdown. Cron: Hetzner btcedge crontab
Friday **11:30 UTC** (after BB's ~12:20 Berlin Friday training update) →
`/api/cron/self-trainer` (CRON_SECRET, maxDuration 300). Plan doc:
`docs/superpowers/plans/2026-07-17-self-trainer.md`.

**Inference guards shipped 2026-07-17** — four Phase C backlog fixes: club evidence
requires the window-end snapshot's own `ownerTeamId` (v1 owner-less windows: pops only,
no club attribution); same-day (< 12h) capture runs merged before pop pairing
(`collapseSameDaySnaps` in pops.ts + row-level mirror in sync/inference.ts) so a pop
between two same-day captures folds into the surrounding window; inference margin
denominator floored (`RIVAL_SCORE_FLOOR = 0.5`) so ∞/epsilon margins can't promote
noise past 'low'; planner picks the newest USABLE observation per club (non-null
training at high/medium, else fallback). Remaining backlog: tail of
`docs/superpowers/plans/2026-07-15-training-phase-c.md`.

**2026-08-04 filter maxes + In/Out TSP shipped** (spec docs/superpowers/specs/2026-08-04-filter-maxes-inside-outside-tsp-design.md): TSP/DMI/height filters are min–max ranges, new Inside TSP (IS+ID+RB+SB) and Outside TSP (JS+JR+OD+HA+DR+PA) always-visible sortable columns + range filters on both player tables; More button now shows an active-filter count. Row TSP is now derived from skills when complete (stored value fallback) so TSP = In + Out holds in the UI whenever In/Out are populated (partial captures fall back to stored tsp and render In/Out as –) and legacy 12-skill/partial v1 sums self-heal.

### Stack & layout
v2 lives in `v2/` — Next.js 16 App Router + Tailwind 4 + Drizzle ORM + Neon Postgres. v1 (`web/` + Supabase) stays live until cutover. As of 2026-07-10, Supabase is read-only legacy — all data has been migrated to Neon (540 players, 878 snapshots, 72 seasons; `nt_squad` table is season-scoped).

### Auth
Single-user: `APP_PASSWORD` env var + JWT cookie. Route guard in `src/proxy.ts` (Next 16 proxy convention — all pages/API routes pass through it).

### Environment
`v2/.env.local` (template: `v2/.env.local.example`). `DATABASE_URL` points to Neon. `CRON_SECRET` required for Vercel + `.env.local`.

### Scripts (run from `v2/`)
- `npm run migrate:data` — one-off Supabase → Neon migration (idempotent: wipes Neon tables then reloads)
- `npm run backfill:players` — identity backfill from BB Players JSON API
- `npm test` — vitest

### Domain gotchas
- BB API returns heights in **inches** — multiply by 2.54 to get cm.
- `seasons.aspx` marks the current season with `<inProgress/>` and omits a finish date.
- Player discovery backbone: BB Players JSON API (`api.buzzerbeater.com/BBAPI/api/Players`) — unauthenticated, returns rich player data. The XML API **cannot** read NT rosters.

### Known minor issues (fix in Phase 2)
- `PlayerTable` potential tooltip shows `'undefined'` if a player's potential value ever exceeds 11.

### Phase 1 status
Implementation complete. Vercel project deployed (second Vercel project, root directory `v2/`).

---

## Game Reference
Full BuzzerBeater game manual is checked in at `BBmanual.txt` (project root). Read it when designing features that touch game mechanics — skills, training, game shape, DMI, U-21 eligibility, draft, seasons, NT rules, etc. The Training Mechanics section below is a distilled extract; the manual is the authoritative source.

## Tech Stack
- **Web App:** Next.js 16 (React) + TypeScript + Tailwind CSS
- **Database + Auth + API:** Supabase (PostgreSQL + Auth + auto-generated REST API)
- **Chrome Extension:** Vanilla JavaScript, Manifest V3
- **XML Parsing:** fast-xml-parser (for BB API XML responses)
- **Hosting:** Vercel (web app) + Supabase Cloud (database)
- **Repo:** GitHub `Rn5ho/BB-project` (private)

## Project Structure
```
BB-project/
  CLAUDE.md
  supabase/
    schema.sql               # Database schema (run in Supabase SQL Editor)
  extension/
    manifest.json            # Chrome extension config (Manifest V3)
    content-scripts/
      common.js              # Skill mappings, constants, Supabase config, color maps
      player-parser.js       # DOM parser for BB player profile pages (/player/*)
      roster-parser.js       # DOM parser for NT roster pages (/national/*, /country/*/jnt/*)
      market-parser.js       # DOM parser for transfer market search results (/manage/transferlist*)
      overlay.css            # Extension overlay + floating mini button styles
    popup/
      popup.html             # Extension popup UI (login, sync, show overlay, dashboard link)
      popup.js               # Popup logic (login, sync, show overlay, clear local data)
    background/
      service-worker.js      # Auth token refresh, retry sync
    icons/                   # Extension icons (16, 48, 128px)
  web/
    app/
      page.tsx               # Home / landing page
      layout.tsx             # Root layout
      globals.css            # Global styles (dark theme)
      login/page.tsx         # Auth page
      slovenia/page.tsx      # Slovenia U-21 roster + prospects (sub-tabs)
      world/page.tsx         # World scouting view (multi-country multi-select, DMI + skills when available, Europe/Season Opponents presets, expandable skill rows, Skills column toggle)
      players/[id]/page.tsx  # Player detail + skill history + editable position
      compare/page.tsx       # Side-by-side player comparison
      training/page.tsx      # Training simulator (manual + database player mode)
      scout/page.tsx         # BB API scouting (fetch by player ID or team roster)
      manual-entry/page.tsx  # Manual skill data entry form
      api/
        scout/
          player/route.ts    # API route: fetch player(s) via BB API, upsert to DB
          roster/route.ts    # API route: fetch team roster via BB API, upsert to DB
          seasons/route.ts   # API route: fetch BB seasons, identify current season
          ingest/route.ts    # API route: accept pre-scraped player data, upsert to DB (no BB API needed)
    components/
      Navbar.tsx             # Navigation bar (Slovenia, World, Compare, Training, Scout, Manual Entry)
      SkillBadge.tsx         # Skill display with color coding
      SkillDelta.tsx         # Skill change indicator (+N green, -N red)
    lib/
      supabase.ts            # Supabase client config (browser-side, anon key)
      supabase-server.ts     # Supabase server client (service role key, bypasses RLS)
      constants.ts           # Skill levels, potentials, BB color maps, helper functions
      types.ts               # TypeScript interfaces (Player has is_nt_player field)
      bbapi.ts               # BuzzerBeater API client (login, fetch players/rosters/seasons, XML parsing)
      training/
        types.ts             # Training simulator type definitions
        data.ts              # Training data tables (age/height/trainer multipliers, training matrix)
        engine.ts            # Training calculation engine (weekly gains, multi-week projection)
    .env.local               # Environment variables (not committed, 5 vars — see Configuration)
    .env.local.example       # Template for env vars
```

## Development Commands
```bash
# Web app - development
cd web && npm run dev

# Web app - build (also validates TypeScript)
cd web && npm run build

# Web app - lint
cd web && npm run lint

# Chrome extension - load in browser
# Go to chrome://extensions > Enable Developer Mode > Load Unpacked > select extension/ folder
# After code changes: click the reload icon on the extension card
```

## Configuration
1. Create a Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in the Supabase SQL Editor
3. Copy `web/.env.local.example` to `web/.env.local` and fill in all 5 variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (used by API routes, bypasses RLS)
   - `BB_API_USERNAME` — BuzzerBeater username (for BB API scouting)
   - `BB_API_SECURITY_CODE` — BB API security code (get from BB Settings > BBAPI)
4. Supabase credentials are hardcoded in 3 extension files (no build step):
   - `extension/content-scripts/common.js` — SUPABASE_URL, SUPABASE_ANON_KEY
   - `extension/popup/popup.js` — SUPABASE_URL, SUPABASE_ANON_KEY, DASHBOARD_URL
   - `extension/background/service-worker.js` — SUPABASE_URL, SUPABASE_ANON_KEY

**Current Supabase instance:** `https://zhywajswbpdmhpeqyczc.supabase.co`
**Dashboard URL (popup.js):** `https://bb-project-eta.vercel.app`

## Coding Conventions
- Use TypeScript for all web app code
- Keep components focused and under ~200 lines
- Store skill values as integers (1-20), convert to text for display using SKILL_LEVELS map
- Store potential as integers (0-11), convert to text using POTENTIAL_LEVELS map
- Supabase queries use the auto-generated REST API via `@supabase/supabase-js` (web) or direct fetch (extension)
- Extension uses vanilla JS (no build step, no bundler)
- Dark theme throughout: `var(--accent)` = #e94560, `var(--card-bg)` = #1a1a2e, `var(--background)` = #0f0f23

## Data Flow

### Extension Path (DOM parsing)
```
BuzzerBeater Page (player, roster, or market search)
  → Extension content script parses DOM (player-parser.js, roster-parser.js, or market-parser.js)
  → Saves locally to chrome.storage.local (key: bb_scout_player_${bbPlayerId})
  → Upserts player to Supabase /rest/v1/players (on_conflict=bb_player_id)
  → Inserts/updates skill snapshot to Supabase /rest/v1/skill_snapshots (deduped per day)
  → Web dashboard displays data with history, colors, and comparisons
```

### BB API Path (server-side)
```
Web dashboard /scout page
  → User enters player IDs or team ID
  → POST to /api/scout/player or /api/scout/roster
  → API route logs into BB API (cookie auth), fetches XML, parses with fast-xml-parser
  → Maps BB API fields to DB schema (bbapi.ts → mapBbApiPlayerToDb)
  → Upserts player + inserts/updates snapshot via Supabase service role client (bypasses RLS)
  → Returns results to client for display
```

## Extension Architecture

### Content Scripts
All three parsers (player, roster, market) share `common.js` (loaded first via manifest) which provides:
- `SKILL_LEVELS` / `SKILL_LEVELS_REVERSE` — number↔text mapping (1-20)
- `POTENTIAL_LEVELS` / `POTENTIAL_LEVELS_REVERSE` — number↔text mapping (0-11)
- `SKILLS` array — 12 skills with `name`, `dbKey`, `parseKey` properties
- `SKILL_COLORS` — exact hex codes from BuzzerBeater's HTML for each skill level
- `getSkillColor(level)` — returns hex color for a skill level
- `parseSkillText(text)` / `parsePotentialText(text)` — text→number converters
- `normalizeNationality(name)` — maps BB local-language names to English (e.g., "Slovenija" → "Slovenia") via `NATIONALITY_MAP`
- `getCurrentBbSeason()` — fetches current season from dashboard API (`/api/scout/seasons`), cached 24h in `chrome.storage.local`
- `DASHBOARD_URL` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` — API endpoints and credentials

### Player Parser (`player-parser.js`)
Runs on `/player/*` pages. Parses single player profiles.

**4 skill parsing strategies (tried in order, stops when all 12 found):**
1. Regex on innerText: `"Jump Shot: strong (8)"` with 4 sub-patterns (colon, newline, tab, text-only)
2. ASP.NET element IDs: searches for `ctl00_cphContent_*` style IDs
3. Colored links scan: finds `<a>` tags whose text matches known skill level names
4. Brute force: for each missing skill, scans all text for skill name + nearby skill level word

**Name parsing** uses `[ ]` literal space (not `\s`) to avoid matching across lines/tabs. Limited to 2-4 word names. Fallback: if >4 words, takes last 2 words.

**Nationality parsing**: Matches "Nationality: CountryName" from page text, normalized via `normalizeNationality()`. Falls back to `null`.

**Position parsing** is best-effort from page text (not reliable — BB auto-classifies).

**TSP fallback**: if `Skill points:` regex fails, sums all individual skill values.

**Auth token refresh**: checks 60-second expiry buffer before saving, calls `/auth/v1/token?grant_type=refresh_token`.

### Roster Parser (`roster-parser.js`)
Runs on `/national/*` and `/country/*/jnt/*` pages. Batch-parses all players on roster page. Works for **both own NT and opponent NT rosters**.

**Two player types detected**:
1. **Full skills players** — Has 3+ skill keywords (Jump Shot, Handling, DMI, etc.) in the next 800 chars after the player ID
2. **DMI-only players** — Has 3+ DMI metadata keywords (DMI, Age, Potential, Game Shape, Weekly salary) but skills are hidden (typical for opponent rosters)

**Skill keywords for full validation**: Jump Shot, Jump Range, Handling, Driving, Passing, Inside Shot, Rebounding, Shot Blocking, Stamina, Free Throw, DMI
**DMI keywords for metadata-only validation**: DMI:, Age:, Potential:, Game Shape:, Weekly salary

**Nationality auto-detection**: Parses from page heading elements first, then falls back to body text regex matching "X U21 National Team". Normalized to English via `normalizeNationality()` from `common.js` (e.g., "Slovenija" → "Slovenia"). Falls back to null if no match.

**`is_nt_player` flag**: For Slovenian players (`nationality === 'Slovenia'`), `isNtPlayer` is set to `false` — the user manually promotes players to the roster via the ★ toggle on the dashboard. For opponent nationalities, `isNtPlayer` is auto-set to `true` (genuine intel about their squad composition).

**Batch save**: saves all locally first, then upserts each to Supabase with progress tracking. Player upsert includes `is_nt_player: true`. Shows `firstError` in overlay if any fail.

### Market Parser (`market-parser.js`)
Runs on `/manage/transferlist*` pages. Batch-parses all players from transfer market search results.

**Page detection**: Checks for "Player Market Search" or "Transfer List" text, plus "Showing results" or "Starting Price" to confirm results are present.

**Player detection**: Same strategy as roster-parser — finds all `(6+ digit ID)` patterns, validates by checking for 3+ skill keywords in the next 800 characters.

**Nationality parsing from flag images**: BB shows flag `<img>` elements inside `.boxheader` containers. The element ID contains `nationalFlag` (e.g., `cphContent_rptListedPlayers_nationalFlag_0`). The country name is in the `title` attribute (NOT `alt`). First flag = real nationality, second (`utopiaFlag`) = Utopia (fictional, ignored). Selector: `playerLink.closest('.boxheader').querySelector('img[id*="nationalFlag"]').title`.

**Batch save**: Same pattern as roster-parser — save all locally first, then upsert each to Supabase with progress tracking. Includes snapshot dedup (same player + same day = PATCH existing). Uses `nationality: p.nationality` (from flags) instead of hardcoded "Slovenia".

**Copy to clipboard**: Tab-separated format with header: Name, ID, Nat, Age, Pos, DMI, Pot, Salary, SP, then all 12 skills.

### Overlay Minimize/Restore
All three parsers support minimize/restore:
- **Close button (×)**: hides overlay (`display: none`), shows floating "BB" mini button (bottom-right corner)
- **Mini button click**: re-shows overlay, or re-runs `init()` if overlay was lost
- **Popup "Show Overlay on Page" button**: sends `chrome.tabs.sendMessage({action: 'showOverlay'})` to content script
- All three parsers have `chrome.runtime.onMessage` listener for `showOverlay` action

### Popup (`popup.html` + `popup.js`)
**Buttons available when logged in:**
- Sync Pending Data (primary) — syncs unsynced local players to Supabase
- Show Overlay on Page — sends message to content script to reshow overlay
- Clear Local Data (red) — deletes all `bb_scout_player_*` keys from chrome.storage.local
- Open Dashboard → — link to web app (Vercel URL, set in popup.js DASHBOARD_URL)
- Log Out

**Stats shown**: "Saved Locally" count, "Pending Sync" count

### Manifest URL Patterns
Uses `*://` prefix (matches both HTTP and HTTPS) because BB may serve over either:
- Player pages: `*://www.buzzerbeater.com/player/*`, `*://buzzerbeater.com/player/*`
- Roster pages: `*://www.buzzerbeater.com/national/*`, `*://buzzerbeater.com/national/*`, `*://www.buzzerbeater.com/country/*/jnt/*`, `*://buzzerbeater.com/country/*/jnt/*`
- Market pages: `*://www.buzzerbeater.com/manage/transferlist*`, `*://buzzerbeater.com/manage/transferlist*`

## Web Dashboard Features

### Slovenia (`/slovenia`)
Dedicated page for managing Slovenia U-21 national team players. Queries only Slovenian players (`nationality = 'Slovenia'` or NULL).

**Sub-tabs**:
- **U-21 Roster** — Players with `is_nt_player = true` (auto-set when scanned from NT roster page)
- **Prospects** — Slovenian players with `is_nt_player = false` (found on market, manually added, or individually scouted)

**Columns**: Checkbox, Name (with BB link ↗), Age (season-aware computed), Height (cm), Type (OUT/MID/IN), Position, Potential (number + color), Salary (formatted as Xk), DMI, TSP (power curve color-coded), OSP, ISP, +/- (TSP delta), Tags, Scouted (staleness indicator)
**OSP** = jump_shot + jump_range + outside_def + handling + driving + passing
**ISP** = inside_shot + inside_def + rebounding + shot_blocking

**Player type auto-classification**: Based on height — Outside (≤198cm, blue), Mid (199-205cm, purple), Inside (≥206cm, red). Matches evaluation criteria where inside players need higher potential (8+) vs outside (6+).

**Power curve benchmarks**: TSP is color-coded against expected range per age:
- Age 18: low=40, mid=50, high=60
- Age 19: low=55, mid=70, high=85
- Age 20: low=75, mid=90, high=110
- Age 21: low=90, mid=110, high=130
Red = below low, green = above high. Hover TSP to see benchmark range.

**TSP delta (+/-)**: Shows change from previous snapshot. Green for gains, red for losses.

**Staleness indicator**: "Scouted" column shows "this season", "1 season ago", "2w ago" etc. instead of raw dates. Uses `bb_season` when available, falls back to date-based calculation.

**Season-aware age**: Current age computed as `snapshot_age + (current_season - snapshot_season)`. Current season fetched from BB API via `/api/scout/seasons` and cached 24h in localStorage.

**Sorting**: all columns sortable including height, salary, type, TSP delta. Toggle asc/desc.
**Filters**: name search, age checkboxes (18-21), position dropdown, potential dropdown, type dropdown (Outside/Mid/Inside). "More filters" reveals: min TSP, min salary.
**Export**: button copies filtered list to clipboard as tab-separated data (all columns + all 12 skills). Paste into Excel.
**Bulk delete**: with RLS failure detection — if 0 rows deleted, shows SQL to add DELETE policy
**Empty states**: contextual messages explaining how to populate each sub-tab

### World (`/world`) — replaces legacy `/opponents`, which now 308-redirects here
Tracks and scouts opposing national teams' players. Queries only non-Slovenian players (`nationality != 'Slovenia'`, not null).

**Country pills**: Dynamic filter buttons generated from available nationalities (All / France / Ukraine / etc.). Shown inline next to the heading.
**"U-21 only" toggle**: Filters to `is_nt_player = true` to see only confirmed opposing NT roster players.

**Columns**: Checkbox, Name (with nationality tag + NT badge if applicable), Age, Position, Potential (colored), **DMI** (bold, default sort DESC), **Game Shape** (colored skill level), **Salary** (formatted), TSP, **Data** (badge), Updated
**Data badge**: "Full skills" (green) if any skill values present, "DMI only" (blue) if only metadata was captured (opponent roster where skills are hidden)

**Sorting**: all columns sortable including DMI (default), game shape, salary
**Filters**: name search, age checkboxes (18-21), position dropdown, potential dropdown, U-21 only toggle, country pills
**Bulk delete**: same pattern as Slovenia page

### Player Detail (`/players/[id]`)
- **Editable position dropdown** (PG/SG/SF/PF/C or blank) — saves immediately to Supabase
- **Current skills** in 2-column grid with colored text and background
- **Skill history table** with deltas (+N green, -N red) comparing snapshots
- **BB link**: "View on BuzzerBeater ↗" → `https://www.buzzerbeater.com/player/${bb_player_id}/overview.aspx`

### Training Simulator (`/training`)
Calculates projected weekly skill gains based on community-researched training formulas.

**Two input modes**:
- **From Database**: select a player from the DB, auto-loads latest snapshot (skills, age, height, potential)
- **Enter Manually**: input age, height (cm), potential, and all 12 skill levels by hand

**URL param**: `?player=ID` pre-selects a database player (linked from player detail page).

**Training configuration**:
- Training type (10 types: Pressure, Shot Blocking, Inside Defense, Rebounding, Inside Scoring, One on One, Outside Shooting, Jump Shot, Ball Handling, Passing)
- Training position (varies per training type — auto-filtered dropdown)
- Trainer level (1-7, shows name + multiplier)
- Minutes per week (0-96)
- Youth trainer level (1-7, shown only for ages 18-19, estimated 2.5%/level boost)

**Advanced settings** (collapsible):
- Gym level (0-3, adds cross-training slots)
- Potential cap model (off/on, experimental) with resistance setting (low/medium/high) — per-skill sigmoid slowdown as skills approach potential ceiling

**Results display**:
- Multiplier summary (age, trainer, youth trainer, minutes factor)
- Per-skill row: current badge → projected badge, decimal gain, "LVL UP" indicator
- Salary info (best position + estimated salary, shown when potential model is on)
- Collapsible detailed breakdown table: base, elastic, cross-training, total per skill
- Total SP gain summary

**Engine architecture** (`web/lib/training/`):
- `types.ts` — all type definitions (TrainingType, TrainingPosition, SkillState, PlayerParams, WeeklyTrainingResult, etc.)
- `data.ts` — lookup tables (age multipliers, height multipliers, trainer multipliers, youth trainer multipliers, training point matrix with 88 rows, elastic drag coefficients, potential skill caps, salary formula data)
- `engine.ts` — pure TypeScript calculation functions: `calculateWeeklyGains()`, `projectTrainingPath()`, `initializeSkillState()`, `calculatePlayerSalary()`. No React dependencies for testability.
- Key constant: `TRAINING_POINT_DIVISOR = 1000` (may need calibration against real training data)

### Scout (`/scout`)
Fetches player skills directly from the BuzzerBeater XML API (server-side), bypassing the need for the Chrome extension.

**Two fetch modes**:
- **Fetch by Player ID**: enter up to 20 BB player IDs (comma/newline separated, or paste BB URLs). IDs extracted via regex.
- **Fetch Team Roster**: enter a BB team ID to fetch all players on that roster.

**Limitations**: BB API `roster.aspx` only returns full skills for: your own club, your own NT roster, and market-listed players. Other rosters return basic info only.

**Results table**: Name (linked to player detail + BB), Status (New/Updated badge), Age, Height, Position, Potential (colored), Salary, TSP, OSP, ISP, then 10 individual skills with BB color coding.

**Recent scans**: stored in `localStorage` (key: `bb_scout_recent`), shows type, count, timestamp. Max 20 entries. Clearable.

**API routes** (`web/app/api/scout/`):
- `player/route.ts` — POST `{ playerIds: number[] }`. Logs into BB API, fetches each player, upserts to DB. Includes snapshot dedup (same player + same day = update). Tags snapshots with `bb_season`.
- `roster/route.ts` — POST `{ teamId: number }`. Same pattern but fetches entire roster. Tags snapshots with `bb_season`.
- `ingest/route.ts` — POST `{ players: PlayerInput[] }`. Accepts pre-scraped player data (no BB API call needed). Used by browser automation / cowork sessions that read skills from the DOM. Max 50 players per request. Auto-calculates `skill_points` from skills if not provided. Same dedup pattern. Tags with `bb_season`.
- `seasons/route.ts` — GET. Fetches all BB seasons via `seasons.aspx`, returns `{ currentSeason, seasons[] }`. Used by client for age computation.
- Player and roster routes use `bbApiLogin()` / `bbApiLogout()` for session management and return `{ results, errors }`.

**BB API client** (`web/lib/bbapi.ts`):
- Auth: cookie-based (`GET login.aspx` → Set-Cookie → use cookie on subsequent requests)
- Base URL: `https://bbapi.buzzerbeater.com`
- XML parsing via `fast-xml-parser` with `@_` attribute prefix
- `mapBbApiPlayerToDb(apiPlayer, bbSeason?)` maps API response to `players` + `skill_snapshots` table schema. Optional `bbSeason` param tags snapshots with season number.
- `fetchSeasons()` / `parseSeasonsXml()` / `getCurrentSeason()` — fetch BB seasons, determine current season from date range
- Also supports: `fetchCountries()`, `fetchLeagues()`, `fetchStandings()` (not yet used in UI)

**Server Supabase client** (`web/lib/supabase-server.ts`):
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (API routes insert snapshots without a `captured_by` user)
- Lazy singleton pattern: `getSupabaseServer()` creates client on first call
- Only used in API routes, never in client-side code

## BuzzerBeater Color Scheme
Exact hex codes extracted from BB's HTML source. Gradient: Black → Dark Blue → Purple → Red → Orange → Gold → Green/Teal.

### Skill Colors (1-20)
```
 1 atrocious:   #000000 (black)
 2 pitiful:     #121263 (dark navy)
 3 awful:       #221385 (dark blue)
 4 inept:       #30139F (blue)
 5 mediocre:    #700BA2 (dark purple)
 6 average:     #910B9D (purple)
 7 respectable: #AD0B88 (magenta-purple)
 8 strong:      #B70B5A (crimson)
 9 proficient:  #9C0B32 (dark red)
10 prominent:   #A70B00 (red)
11 prolific:    #BD2600 (red-orange)
12 sensational: #CB3100 (orange-red)
13 tremendous:  #D93C00 (dark orange)
14 wondrous:    #DB6E04 (orange)
15 marvelous:   #E5A64B (gold)
16 prodigious:  #AC860A (dark gold)
17 stupendous:  #8E9800 (olive-green)
18 phenomenal:  #498E00 (green)
19 colossal:    #0EAE28 (bright green)
20 legendary:   #0EB366 (teal-green)
```

### Potential Colors (0-11)
```
 0 announcer:         #700BA2 (dark purple)
 1 bench warmer:      #910B9D (purple)
 2 role player:       #AD0B88 (magenta-purple)
 3 6th man:           #B70B5A (crimson)
 4 starter:           #9C0B32 (dark red)
 5 star:              #A70B00 (red)
 6 allstar:           #BD2600 (red-orange)
 7 perennial allstar: #CB3100 (orange-red)
 8 superstar:         #D93C00 (dark orange)
 9 MVP:               #E5A64B (gold)
10 hall of famer:     #AC860A (dark gold)
11 all-time great:    #8E9800 (olive-green)
```

Colors are stored in:
- `web/lib/constants.ts` — `SKILL_COLORS`, `POTENTIAL_COLORS`, `getSkillColor()`, `getPotentialColor()`, `getSkillBgColor()`
- `extension/content-scripts/common.js` — `SKILL_COLORS`, `getSkillColor()`

## Database Schema (Supabase)
**Tables**: `profiles`, `players`, `skill_snapshots`, `player_notes`, `player_tags`

### `players` Table Key Columns
- `bb_player_id` — BuzzerBeater player ID (unique constraint, used for upsert)
- `name` — Player name
- `nationality` — Country name (e.g., "Slovenia", "Ukraina"). NULL for legacy data. Used to split Slovenia vs World views.
- `height` — Height string (e.g., "196 cm")
- `position` — Editable position (PG/SG/SF/PF/C or NULL)
- `is_nt_player` — Boolean (default FALSE). Auto-set to TRUE when player is scanned from an NT roster page. Used for U-21 Roster sub-tab (Slovenia). NOTE: flag is sticky — never auto-unset. World page uses age-based U-21 filter instead. A season-scoped rework is planned.

### Key RLS Policies
- All tables: authenticated users can SELECT
- `players`: authenticated users can INSERT, UPDATE, and DELETE (DELETE policy was added manually — must run SQL in Supabase if missing)
- `skill_snapshots`: INSERT restricted to `captured_by = auth.uid()`. UPDATE restricted to `captured_by = auth.uid()` (for snapshot dedup).
- `player_notes`/`player_tags`: users manage their own records

### Important: source CHECK constraint
The `skill_snapshots.source` column has a CHECK constraint. The schema ships with `CHECK (source IN ('extension', 'manual'))`. The BB API scout routes insert snapshots with `source = 'api'`. Run this SQL if the constraint hasn't been updated:
```sql
ALTER TABLE skill_snapshots DROP CONSTRAINT skill_snapshots_source_check;
ALTER TABLE skill_snapshots ADD CONSTRAINT skill_snapshots_source_check CHECK (source IN ('extension', 'manual', 'api'));
```

### Important: DELETE Policy
If bulk delete silently fails (returns success but 0 rows), the DELETE RLS policy is missing. Run:
```sql
CREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);
```

### Upsert Pattern
Extension uses PostgREST upsert: `POST /rest/v1/players?on_conflict=bb_player_id` with header `Prefer: resolution=merge-duplicates,return=representation`

## Known Issues & Gotchas
1. **BB positions are unreliable** — the game auto-classifies based on skills, not how managers use players. Position is editable on the dashboard for manual override.
2. **Auth token expiration** — if saves fail with 401/403, the extension auto-refreshes the token. If that fails, user needs to log out and back in via the popup.
3. **"Saved Locally" count stale after DB delete** — use "Clear Local Data" button in popup to reset local cache.
4. **Dev server dies** — if `npm run dev` stops responding, kill the process on port 3000 and restart. On Windows: `taskkill //PID <pid> //F` then `cd web && npm run dev`.
5. **Snapshot dedup** — same player captured multiple times on the same day updates the existing snapshot instead of creating duplicates. Requires UPDATE RLS policy on `skill_snapshots` (see schema.sql). Run this SQL if policy is missing: `CREATE POLICY "Users update own snapshots" ON skill_snapshots FOR UPDATE TO authenticated USING (captured_by = auth.uid());`
6. **BB serves HTTP sometimes** — manifest uses `*://` patterns to match both HTTP and HTTPS.

## Pending / Future Work
- **Training path optimizer** — The engine supports multi-week projection (`projectTrainingPath()`) but the UI only exposes single-week calculation. Ultimate goal: user sets a desired final build → tool outputs week-by-week training plan with optimal type/position selection.
- **Training history parser** — BB has training history pages showing per-week skill changes. Could be parsed to enrich player data and validate training simulator accuracy.
- **Calibrate TRAINING_POINT_DIVISOR** — Currently set to 1000, may need tuning against real training data. Youth trainer multipliers are estimates (2.5%/level).
- **Opponents page per-country dropdowns** — Add dedicated sections per opponent country. DMI-only tracking for opponent NT players whose skills are hidden. Useful for tracking week-to-week DMI changes.
- ~~**Training simulator**~~ — DONE. Weekly gain calculator with manual + database mode, all multipliers, elastic drag, cross-training, potential cap model. Files: `web/lib/training/` + `web/app/training/page.tsx`.
- ~~**BB API scouting**~~ — DONE. Server-side fetch via BB XML API. Fetch by player ID (up to 20) or team roster. Files: `web/lib/bbapi.ts`, `web/lib/supabase-server.ts`, `web/app/api/scout/`, `web/app/scout/page.tsx`.
- ~~**Market parser**~~ — DONE. Extension content script for transfer market search results. Nationality from flag images, batch save, clipboard export. File: `extension/content-scripts/market-parser.js`.
- ~~**Duplicate snapshot detection**~~ — DONE. Same player + same day = update existing snapshot. Implemented in all 3 extension parsers + API scout routes.
- ~~**Vercel deployment**~~ — DONE. Deployed via GitHub (`Rn5ho/BB-project`) → Vercel. Root directory set to `web/`. Env vars configured in Vercel dashboard.
- ~~**Multi-country support**~~ — DONE. Dedicated `/slovenia` page (U-21 Roster + Prospects sub-tabs) and `/opponents` page (country pill filters, DMI-focused, U-21 toggle). Roster parser auto-detects nationality from page headers and sets `is_nt_player` flag. Market parser extracts nationality from flag images. Opponents tracked with full skills or DMI-only metadata.
- ~~**Season-aware age**~~ — DONE. BB API `seasons.aspx` fetched via `/api/scout/seasons` route. Snapshots tagged with `bb_season` (both API routes and extension). Age computed as `snapshot_age + (current_season - snapshot_season)`. Cached 24h in localStorage (web) and chrome.storage (extension).
- ~~**Player type classification**~~ — DONE. Auto-classified by height: Outside (≤198cm), Mid (199-205cm), Inside (≥206cm). Filterable, sortable, color-coded (blue/purple/red). Height parsed from "X'Y\" / NNN cm" format (extracts cm value).
- ~~**Enhanced filters & columns**~~ — DONE. Slovenia page has: height, salary, type, TSP delta, power curve color-coding, staleness indicator, export to clipboard, advanced filters (min TSP, min salary).
- ~~**Power curve benchmarks**~~ — DONE. TSP color-coded red (below expected) / green (above expected) per age group. Hover for benchmark range.
- ~~**Nationality normalization**~~ — DONE. `normalizeNationality()` in `common.js` maps BB local-language names (Slovenija, Ukraina, etc.) to English. Used by all 3 parsers. Fixes nationality mismatch between BB pages and web app queries.
- ~~**Manual roster curation**~~ — DONE. Slovenia page: `is_nt_player` is now manually toggled via ★ star column (not auto-set from roster scans for Slovenian players). Roster parser still auto-flags opponent players. Default tab is Prospects.
- ~~**Skill columns toggle**~~ — DONE. "Skills" button on Slovenia page toggles 12 individual skill columns (JS, JR, OD, Han, Dri, Pas, IS, ID, Reb, SB, Sta, FT) with BB color coding, sortable. TSP moves to end of row when skills visible.
- ~~**Cowork scouting flow**~~ — DONE. `COWORK_SCOUTING.md` documents the automated recruit/drop workflow for Claude cowork sessions.

## BuzzerBeater Training Mechanics
All data below sourced from BB community research and forum posts. This is the foundation for the training simulator feature.

### Training Formula
```
weekly_skill_gain = base_training_points
  × age_multiplier[player_age]
  × height_multiplier[player_height][skill]
  × trainer_multiplier[trainer_level]
  × minutes_factor (0.0-1.0, based on playing time in relevant position)
  × potential_slowdown_factor (diminishes as skills approach potential cap)
  + elastic_training_bonus
```

### Age Multiplier
Young players train MUCH faster. This is why U-21 scouting/development is critical.
```
Age  Multiplier
18   1.00
19   0.95
20   0.88
21   0.78
22   0.70
23   0.60
24   0.51
25   0.42
26   0.35
27   0.27
28   0.21
29   0.16
30   0.11
31   0.07
32   0.05
33   0.03
34   0.02
35   0.01
36   0.00
```

### Height Multiplier (per skill)
Height affects training speed differently per skill. Short players train outside skills faster, tall players train inside skills faster. JS/DR/PA are height-independent.
```
Height  JS    JR    OD    HA    DR    PA    IS    ID    RB    SB
175     1     1.5   1.5   1.5   1     1     0.5   0.5   0.5   0.5
178     1     1.45  1.45  1.45  1     1     0.55  0.55  0.55  0.55
180     1     1.4   1.4   1.4   1     1     0.6   0.6   0.6   0.6
183     1     1.35  1.35  1.35  1     1     0.65  0.65  0.65  0.65
185     1     1.3   1.3   1.3   1     1     0.7   0.7   0.7   0.7
188     1     1.25  1.25  1.25  1     1     0.75  0.75  0.75  0.75
190     1     1.2   1.2   1.2   1     1     0.8   0.8   0.8   0.8
193     1     1.15  1.15  1.15  1     1     0.85  0.85  0.85  0.85
196     1     1.1   1.1   1.1   1     1     0.9   0.9   0.9   0.9
198     1     1.05  1.05  1.05  1     1     0.95  0.95  0.95  0.95
201     1     1     1     1     1     1     1     1     1     1
203     1     0.95  0.95  0.95  1     1     1.05  1.05  1.05  1.05
206     1     0.9   0.9   0.9   1     1     1.1   1.1   1.1   1.1
208     1     0.85  0.85  0.85  1     1     1.15  1.15  1.15  1.15
211     1     0.8   0.8   0.8   1     1     1.2   1.2   1.2   1.2
213     1     0.75  0.75  0.75  1     1     1.25  1.25  1.25  1.25
216     1     0.7   0.7   0.7   1     1     1.3   1.3   1.3   1.3
218     1     0.65  0.65  0.65  1     1     1.35  1.35  1.35  1.35
221     1     0.6   0.6   0.6   1     1     1.4   1.4   1.4   1.4
224     1     0.55  0.55  0.55  1     1     1.45  1.45  1.45  1.45
226     1     0.5   0.5   0.5   1     1     1.5   1.5   1.5   1.5
229     1     0.45  0.45  0.45  1     1     1.55  1.55  1.55  1.55
```

### Trainer Quality Multiplier
```
Level             Multiplier
1. minimal        0.88
2. basic          0.91
3. competent      0.94
4. advanced       0.97
5. superior       1.00
6. exceptional    1.03
7. world-renowned 1.06
```

### Elastic Training (Drag Coefficients)
When associated skills have a large gap, the lower skill gets a bonus when the higher one is trained. Formula: `bonus = coefficient × (higher_skill - lower_skill)`, added as percentage increase to training.
```
Trained Skill → Towed Skill → Drag Coefficient
JS → DR → 0.011
OD → HN → 0.007
HN → OD → 0.050  (big one!)
DR → HN → 0.005
PS → HN → 0.030
IS → ID → 0.001
ID → IS → 0.020
RB → IS and ID → 0.20 and 0.010
JR → JS → ?  (unknown coefficient)
SB → ID and RB → ?  (unknown coefficients)
```
Example: JS=5, DR=15 → coefficient 0.011 → drag = (15-5) × 0.011 = 0.11 (11% bonus to JS training)

### Training Types and Point Distribution
BB has many training types that distribute points across skills differently based on position. Key examples:
- **Pressure PG**: JS=0, JR=0, OD=430, HA=60, DR=40, PA=0, IS=0, ID=80, RB=0, SB=0 → Total=610
- **Shot Blocking C**: JS=30, JR=0, OD=0, HA=0, DR=0, PA=0, IS=0, ID=190, RB=80, SB=680 → Total=980
- **Inside Scoring PF**: JS=117, JR=0, OD=0, HA=0, DR=0, PA=0, IS=504, ID=45, RB=0, SB=0 → Total=666
- **Ball Handling PG**: JS=0, JR=0, OD=0, HA=100, DR=800, PA=350, IS=0, ID=0, RB=0, SB=0 → Total=1050
- **Passing PG**: JS=0, JR=0, OD=0, HA=0, DR=180, PA=190, IS=0, ID=720, RB=0, SB=0 → Total=1080
(Full training type × position matrix has ~100+ combinations — see forum data for complete table)

### Skill Rounding
BB stores skills as decimals internally but displays rounded-UP integers. A displayed "15" (marvelous) means the backend value is anywhere from 14.01 to 15.00. This means:
- Two players both showing "8" could differ by almost a full skill level internally
- A player at 14.01 displays as 15 but is dramatically weaker than 14.99 (also 15)
- Training gains may not show as visible level-ups for a while (accumulating decimals)

### Player Skill Ranges
- **Age 18 (drafted)**: Skills randomized between 1-7
- **Age 19 (drafted)**: Skills can be up to 10
- **Potential**: Acts as a soft cap — training slows dramatically (but never reaches zero) as skills approach the potential ceiling

### Key Insight for Training Optimizer
The optimal training path depends on:
1. **Age urgency** — training multiplier drops fast, so early seasons matter most
2. **Height advantage** — train skills where height gives a bonus first (more efficient)
3. **Elastic synergy** — training high-coefficient pairs first creates cascading bonuses
4. **Position requirements** — different positions need different skill distributions
5. **Minutes availability** — player must play the right position to get full training benefit

## Key Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-07 | Project created | Initial setup |
| 2026-02-07 | Next.js + Supabase + Chrome Extension | Best fit for non-web-dev maintainer: zero-config deploy, auto-generated API, no build step for extension |
| 2026-02-07 | Skills stored as integers 1-20 | Enables sorting, comparison, math. Text labels derived in UI |
| 2026-02-07 | Local-first extension storage | Saves to chrome.storage.local before network sync, preventing data loss during scouting |
| 2026-02-07 | Slovenia-specific for now | MVP scoped to one country, can expand later |
| 2026-02-07 | Position editable in dashboard | BB's auto-classified position is unreliable; managers override manually |
| 2026-02-07 | Skill keyword validation for roster parsing | Instead of requiring position near player ID, validate by checking for 3+ skill keywords in nearby text — more robust |
| 2026-02-07 | Overlay minimize instead of remove | Close button hides overlay + shows floating "BB" mini button. Can reopen via mini button or popup "Show Overlay" button |
| 2026-02-07 | Exact BB colors from HTML source | User extracted hex codes directly from BB's `<font color>` tags. Stored in constants.ts and common.js |
| 2026-02-07 | `*://` URL patterns in manifest | BB may serve over HTTP or HTTPS; wildcard protocol handles both |
| 2026-02-07 | Name regex uses literal space `[ ]` | `\s+` between name words matched across lines/tabs, pulling in nav text. Literal space prevents this |
| 2026-02-07 | Token auto-refresh in content scripts | Both parsers check 60-second expiry buffer and refresh via `/auth/v1/token?grant_type=refresh_token` before saving |
| 2026-02-07 | Training engine as pure TypeScript | Engine in `web/lib/training/engine.ts` has zero React dependencies — enables future testing and CLI usage without browser |
| 2026-02-09 | Cross-training deterministic model | ~10% average redistribution weighted to lower skills, rather than random pops, for reproducible results |
| 2026-02-09 | Potential model off by default | Sigmoid per-skill slowdown is experimental; users must opt in via Advanced Settings |
| 2026-02-12 | BB API scouting via server-side routes | Server routes with service role key bypass RLS, allowing snapshot inserts without user auth context |
| 2026-02-12 | Cookie-based BB API auth | BB API uses `GET login.aspx` → `Set-Cookie`; each API route does login → fetch → logout per request |
| 2026-02-12 | Nationality from flag DOM elements | Market parser reads `nationalFlag` img `title` attribute — text is unreliable due to Utopia dual-flag pattern |
| 2026-02-12 | fast-xml-parser for BB API | Zero-dependency XML→JSON conversion with attribute support (`@_` prefix convention) |
| 2026-02-21 | Slovenia + Opponents nav restructure | Replaced single `/players` page (My NT/Scouting toggle) with dedicated `/slovenia` (U-21 Roster + Prospects sub-tabs) and `/opponents` (country pills, DMI-focused, U-21 filter) pages |
| 2026-02-21 | `is_nt_player` auto-detection | Roster parser sets `is_nt_player = true` for all players scanned from NT roster pages, enabling automatic U-21 roster vs. prospect distinction |
| 2026-02-21 | DMI-only opponent tracking | Roster parser detects opponent players whose skills are hidden, captures DMI/age/potential/game shape/salary metadata only. Opponents page shows "Full skills" vs "DMI only" badge |
| 2026-02-21 | Nationality from roster page header | Roster parser extracts country from page header text (e.g., "Ukraina U21 National Team") instead of hardcoding "Slovenia" |
| 2026-04-07 | Season-aware computed age | Uses BB API `seasons.aspx` to determine current season, computes `snapshot_age + season_delta` instead of showing stale snapshot ages. Cached 24h in localStorage. |
| 2026-04-07 | Player type auto-classification | Height-based: Outside ≤198cm, Mid 199-205cm, Inside ≥206cm. Matches NT manager's evaluation criteria (inside needs pot 8+, outside pot 6+). |
| 2026-04-07 | TSP power curve benchmarks | Community-derived expected TSP ranges per age (18: 40-60, 19: 55-85, 20: 75-110, 21: 90-130). Color-coded in table. May need calibration. |

## Deployment
- **GitHub repo**: `Rn5ho/BB-project` (private)
- **Web app hosting**: Vercel, auto-deploys from `main` branch
  - Root directory: `web/`
  - Framework: Next.js (auto-detected)
  - Environment variables: configured in Vercel dashboard (all 5 from `.env.local`)
  - Production URL: `https://bb-project-eta.vercel.app`
- **Database**: Supabase Cloud at `https://zhywajswbpdmhpeqyczc.supabase.co`
- **Chrome extension**: loaded manually via `chrome://extensions` > Developer Mode > Load Unpacked > select `extension/` folder
