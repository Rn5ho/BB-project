# Long-arc own-team match minutes (seasons 69–73)

Per-position match minutes for the owner's **two own BuzzerBeater clubs**, reconstructed
from BB's XML API (`schedule.aspx` + `boxscore.aspx`) over five consecutive seasons.

Why this exists: minutes are the training model's gate, but the production
`player_match_minutes` table only covers the *current* season and only players tracked as
Slovenian prospects. For calibration we need the full multi-season minutes history of
players whose training program we also know (own clubs → `traininghistory.aspx` +
`self_trainer_config` staff/facility levels). This dataset is that missing half.

Harvested **2026-08-07** by `v2/scripts/research/long-arc-minutes.mts`
(re-runnable: `cd v2 && npx tsx scripts/research/long-arc-minutes.mts`).
The script is **read-only**: SELECT-only against Neon (season start dates + team names),
GET-only against BB. It writes nothing to any database table.

## Teams

| team_id | name | role |
|---|---|---|
| 114360 | Savlje BC | primary club (default `/home.aspx` context) |
| 276888 | Berlin BC | second club (reached via the `lbSwitchTeams` postback; `self_trainer_config.team_id`, `switch_team = true`) |

Both were confirmed two independent ways: they are the only two rows in `teams` with
`owner_alias = 'Mod-Rn5ho [SLO U-21]'`, and 114360 is the team id rendered on the
logged-in `/home.aspx` while its team-switch link is labelled "Berlin BC".
No team switching was performed — `schedule.aspx`/`boxscore.aspx` serve any team id, so
both clubs were read from the same unswitched session.

## Season coverage

| season | start (UTC) | finish |
|---|---|---|
| 69 | 2025-07-08 | 2025-10-14 |
| 70 | 2025-10-14 | 2026-01-20 |
| 71 | 2026-01-20 | 2026-04-29 |
| 72 | 2026-04-29 | 2026-08-04 |
| 73 | 2026-08-04 | in progress |

Season weeks are 1-indexed 7-day buckets from the `seasons.start` date
(`seasonWeekOf` from `src/server/sync/minutes.ts`). Seasons 69–72 are fully covered,
weeks 1–14. Season 73 is week 1 only — it started three days before the harvest.

## Fetch results

Both clubs existed and played in all five seasons; there are no missing-club gaps.
**Every boxscore requested was served — 310/310, zero `BoxscoreNotAvailableError`, zero
other failures.** BB retains boxscores at least 4 seasons back.

| team | season | schedule rows | countable | boxscores ok | failed | distinct players | minute rows | first → last match |
|---|---|---|---|---|---|---|---|---|
| 114360 | 69 | 67 | 56 | 56 | 0 | 14 | 446 | 2025-07-11 → 2025-10-12 |
| 114360 | 70 | 61 | 53 | 53 | 0 | 18 | 373 | 2025-10-16 → 2026-01-17 |
| 114360 | 71 | 46 | 38 | 38 | 0 | 16 | 314 | 2026-01-22 → 2026-04-25 |
| 114360 | 72 | 47 | 39 | 39 | 0 | 18 | 318 | 2026-04-30 → 2026-08-01 |
| 114360 | 73 | 26 | 1 | 1 | 0 | 7 | 7 | 2026-08-06 → 2026-08-06 |
| 276888 | 69 | 39 | 31 | 31 | 0 | 14 | 184 | 2025-07-10 → 2025-10-12 |
| 276888 | 70 | 35 | 27 | 27 | 0 | 13 | 173 | 2025-10-18 → 2026-01-18 |
| 276888 | 71 | 34 | 26 | 26 | 0 | 9 | 223 | 2026-01-24 → 2026-04-26 |
| 276888 | 72 | 46 | 38 | 38 | 0 | 16 | 314 | 2026-05-02 → 2026-08-02 |
| 276888 | 73 | 26 | 1 | 1 | 0 | 9 | 9 | 2026-08-07 → 2026-08-07 |
| **total** | | **427** | **310** | **310** | **0** | **58 unique** | **2361** | |

"schedule rows" counts everything `schedule.aspx` returned, including matches not yet
played. Season 73's 26 rows are almost entirely fixtures still in the future.

## Which match types were counted

Countability uses `isCountableType()` from `src/server/sync/minutes.ts` unchanged —
type prefixes `league.*`, `cup`, `friendly`, `pl.*` count toward training minutes.
A match is additionally required to have started more than 3 hours ago (BB's
"finished" buffer), so unplayed fixtures are excluded.

Counted, by observed subtype (minute rows):

| type | rows |
|---|---|
| league.rs | 1191 |
| friendly | 448 |
| cup | 211 |
| league.rs.tv | 192 |
| pl.rs | 191 |
| league.relegation | 49 |
| league.final | 25 |
| league.quarterfinal | 22 |
| league.semifinal | 17 |
| pl.final | 8 |
| pl.semifinal | 7 |

Excluded (per season, per club): 7 × `bbm` (BuzzerBeater Manager cup) — in season 69 that
appears as 3 × `bbm.playoff` + 7 × `bbm`, and in season 70 as 7 × `bbb`; plus exactly one
`unknown` row per club-season. That `unknown` row is a BB pseudo-fixture whose home and
away team ids are identical (e.g. match `1069002253`, both sides team `2253`) — it is not a
real match and carries no boxscore.

## Gaps and caveats

- **Season 73 is a stub** (1 match per club). Re-run after the season progresses.
- **Rosters, not careers.** A player-season row only covers the weeks he was on that club.
  A player sold mid-season shows partial minutes and no indication of where the rest went;
  18 of the 58 players appear in only one season.
- **`min_*` are per-match minutes at a position**, summed to `total_min`. BB assigns a
  player minutes at several positions within one match, so per-position columns are not
  mutually exclusive across a game — they partition that game's playing time.
- **No skills/training here.** Pair with `traininghistory.aspx` scrapes
  (`npm run training:scrape-history`) for the training program actually run those weeks,
  and with the staff/facility levels in `self_trainer_config` (which reflect *today's*
  levels — historical staff levels are not recoverable from BB).
- **Week 14 caveat** (documented elsewhere in this repo): week 14 has fewer games, so
  minutes are naturally scarce there; that shows up as real low-minute weeks, not a gap.
- The two clubs never played each other in any counted match, so no match appears under
  both team ids.

## Files

| file | contents |
|---|---|
| `minutes-<teamId>-s<season>.json` | 10 files: per club-season, the full row set plus that cell's coverage block, season start/finish, and fetch timestamp |
| `own-team-minutes.csv` | tidy combined table, 2361 rows: `team_id, season, season_week, match_id, match_date, match_type, player_id, min_pg, min_sg, min_sf, min_pf, min_c, total_min` |
| `player-season-summary.csv` | 134 rows, one per (player_id, season): `player_id, season, team_ids, countable_matches, matches_with_minutes, starts, weeks_covered, min_pg, min_sg, min_sf, min_pf, min_c, total_min, avg_min_per_match, first_match_date, last_match_date` |
| `coverage.json` | machine-readable version of the coverage table above, incl. skipped-type counts and any failed match ids |
| `training-cadence.json` | **not from the minutes harvester** — produced by `v2/scripts/research/training-cadence-probe.mts` (`traininghistory.aspx`, logged-in): per-player training-block sequences + per-training week budgets for 4 own players (2 per club incl. cross-checks). Analysed in `../concentration-study-2026-08-07/FINDINGS.md` ("Measured real cadence"). Caveats: the Savlje cross-check player (49983596) failed to parse, so Savlje's cadence is single-witness; every parsed history shows exactly 28 weeks observed — `traininghistory.aspx` appears to retain only ~2 seasons, unlike the 5-season boxscore retention above |

Totals across the dataset: **73,972 player-minutes**, 58 distinct players, 134
player-seasons. Arc lengths — 6 players span all 5 seasons, 7 span 4, 4 span 3, 23 span 2,
18 appear once. The 5-season players are the strongest calibration subjects.
