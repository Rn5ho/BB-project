# Self-trainer — weekly own-team model scoring (2026-07-17)

**Goal.** Close the calibration loop automatically: every Friday after BB's training
update (~12:20 Berlin), scrape the own club's traininghistory pages, persist exact-date
pops, replay each player's visible history through the model panel with the real staff
levels, and store per-model accuracy so drift is visible without anyone remembering to
run a CLI.

## What shipped

**Shared modules (extracted, behavior-identical).**
- `src/server/bb/training-history.ts` — `parseTrainingHistory` + `TRAINING_IDS` +
  `canonicalPositions` + `parseUsDate`, moved out of the scrape CLI. Fixture test
  (`__fixtures__/traininghistory.html`).
- `src/lib/training/replay.ts` — `replayCase` (scoring, returns structured miss/false-alarm
  events) + `caseFromScrapedHistory` (rawWeeks → ReplayCase: age threading from age-increase
  events, start skills back-tracked to first pops, end skills from latest full snapshot),
  moved out of replay-case CLI. Regression-verified: replaying
  `docs/research/training/calibration-cases/auto` reproduces the recorded aggregate exactly
  (bbscout 45% recall 44/98, 43/70 exact, MAE 0.41; CP 0.61/50%; OSL 0.64/47%).
- Both CLIs now import the shared code; behavior unchanged.

**DB (migration 0010_self_trainer).**
- `self_trainer_config` — single row: team_id, switch_team (second-team context toggle),
  coach/youth-trainer/gym/training-court levels, updated_at.
- `model_scorecards` — one row per model per run: run_at, model_id, pop hits/misses/false
  alarms, end_abs_err/end_count/end_exact, player_count, week_count, details jsonb
  (per-player breakdown). Index (model_id, run_at desc).

**Job.** `runSelfTrainer` in `src/server/sync/self-trainer.ts` — BbWebSession login
(plain HTTP, read-only; optional home.aspx switch-team postback), players owned by the
configured club, 1s pacing per traininghistory fetch, own-scrape pop upsert (idempotent
on uq_skill_pops — also tightens inference anchors as a side effect), replay through
bbscout + coach-parrot + open-source-live + bbscout-low/high, one scorecard row per
model, sync_log jobType 'self-trainer'. Skips (no history / no full snapshot / no
height) are counted, not fatal.

**Route.** `/api/cron/self-trainer` — CRON_SECRET bearer, maxDuration 300. The proxy
matcher already excludes `api/cron/*`.

**UI.** `/scorecard` (nav: Scorecard) — club+staff config card (server-action save,
clamped levels), Runs card (Run now + last sync_log line), Model trend card (MAE +
pop-recall per run, hand-rolled TimeSeriesChart via a unit-string client wrapper),
Latest run card (per-model table + per-player bbscout breakdown linking to player pages).

**Schedule.** Hetzner (btcedge crontab): Friday 11:30 UTC — 12:30 Berlin in winter,
13:30 in summer, always after the ~12:20 Berlin training update, no DST tricks.

## Staff auto-sync (added 2026-07-18)

`src/server/bb/team-pages.ts` (fixtures from live team pages): `parseStaffLevels`
reads staff.aspx — each role name ("Trainer", "Youth Trainer", "Doctor", "PR-Manager",
"Sports Psychologist") precedes a `lblStaffSkillLevelDisplay_N` span whose **title
attribute is the numeric level**; "Youth Trainer" must precede "Trainer" in the
alternation. `parseInfrastructure` reads arena.aspx — the levels are inline JS vars
(`var lvlGym = 3; var lvlTC = 2;`). Each run scrapes both pages for the configured
club, uses the live levels for the replay, and writes them back to
`self_trainer_config`; parse failure falls back to the stored row (non-fatal, logged).
Result counts carry `staff: {…, source: 'scraped'|'stored'}` and the /scorecard Run-now
line shows which was used. Manual config entry is now bootstrap/fallback only — the
required field is the team id.

## Notes / limitations

- The models replay the FULL visible history each run (not just the new week): sublevel
  state must thread from the backtracked start, and full-history aggregates make runs
  comparable; cost is trivial (pure TS).
- Staff auto-sync captures THIS week's levels; older history weeks still replay with the
  current levels — a dated staff-history table is the upgrade if it ever matters.
- Config row (team id) must exist before the first run (job errors with a pointer to
  /scorecard).
- traininghistory.aspx shows a bounded window of weeks; very long histories age out of
  the page and out of scoring.
