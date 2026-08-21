# Senior NT market sweep — design

**Date:** 2026-08-21
**Status:** approved, implemented same day
**Context:** The daily market sweep (Phase 3, reworked 2026-08-03) collects U-21 players only
(ages 18–21, potential ≥6, per-age-band searches). Senior NT rosters hide player skills, but a
player listed on the transfer market shows his FULL card — including internal skill values above
the displayed cap of 20. Sweeping the market for senior-NT players turns each listing into free
full-skill intel on senior national teams.

## Goal

Build and keep fresh a full-skill picture of senior national-team players, using the transfer
market as the source: every day, find every listed player who is age 22+ AND on a senior NT,
capture his card, and mark him as senior-NT material so the dashboard can show a dedicated
Seniors view.

## Data source

BB transfer search (`/manage/transferlist.aspx`), same session/parser modules the U-21 sweep
uses (`web-session.ts`, `card-parser.ts`). Live-verified facts (2026-08-21, real search from
the worker box):

- The "IsOnNT" checkbox posts as exactly `ctl00$cphContent$cbIsOnNT` (id `cphContent_cbIsOnNT`).
- Posting an EMPTY `tbMaxAge` works — open-ended age upper bound.
- The form PREFILLS `tbMaxSalary` / `tbMaxCurrentBid` with the current market maxima; both must
  be posted BLANK or a high-salary senior star silently falls out of the results.
- The senior search returned 58 listings (~6 pages) — far under BB's 1000-result cap, so no
  band-splitting is needed (the U-21 flood problem does not apply at this scope).
- Result cards parse cleanly with the existing card parser, including internal skills above 20
  in the `title` attrs (fixture card: outside def. 22, handling 24, driving 24, free throw 31).
- Pagination carries the search state entirely in hidden fields (results pages contain no search
  form), so the checkbox only matters on the initial Search POST.

Fixture: `v2/src/server/bb/__fixtures__/transferlist-seniornt-p1.html` (captured live), tested in
`card-parser.test.ts`.

## Sweep scope

`runMarketSweep` opts gained `ntOnly`, `minPotential` (default 6 = today's hardcoded floor) and
open-ended `maxAge: null` (posts empty `tbMaxAge`; `undefined` keeps the default '21'). One
shared constant defines the senior scope everywhere (cron script, Vercel route, settings action):

```ts
export const SENIOR_NT_SWEEP_OPTS = { minAge: 22, maxAge: null, ntOnly: true, minPotential: 0 };
```

No potential floor: a senior NT already selected the player — his potential is irrelevant to the
intel value. Search-field construction lives in the pure, unit-tested `applySweepScope(fields,
opts)` in `market.ts`; the U-21 path produces byte-identical fields to before.

## Persistence

- New nullable column `players.senior_nt_seen_at` (timestamptz, Drizzle `seniorNtSeenAt`,
  migration `0013_senior_nt_sweep`): last time a senior-NT sweep returned the player. Stamped
  `now()` for ALL swept ids (new + existing) after each senior sweep persists its players.
- Snapshots unchanged: senior sweeps write ordinary `market` snapshots (full skills, salary,
  auction fields), so all existing history/progression machinery applies.
- `sync_log` jobType: `'market-senior'` (U-21 sweep stays `'market'`); counts shape identical
  (`MarketSweepCounts`).

## UI surface

- `listPlayers` scope `'seniors'` → `senior_nt_seen_at is not null`. The `'world'` scope now
  additionally excludes seniors (`and senior_nt_seen_at is null`) so retired-from-market seniors
  don't pollute the U-21 scouting view; `'slovenia'` unchanged.
- New guest-visible `/seniors` page (nav "Seniors"): default sort TSP desc, default age filter
  22–45, skill columns shown by default, storage key `bbscout:table:seniors`.
- Settings: "Market (seniors)" row on the Data sync card (chip "cron: daily", Sync now button),
  last-run line and sync-log formatting shared with the market job.

## Ops

- `scripts/market-sweep.mts` (Hetzner daily cron): after the U-21 age bands, one senior pass —
  newest-first with the same staleness early-stop, plus the same oldest-first recovery pass
  guard (`floodBeyondWindow`) the bands use. Logged as JSON with `scope: 'senior-nt'`.
- Same script change also added per-band try/catch error isolation (ops backlog item from
  2026-08-06: one transient BB 503 previously killed all remaining bands).
- `/api/cron/daily` (manual/backup route): senior sweep runs after the U-21 sweep inside the
  `skip !== 'market'` branch, try/caught non-fatal like minutes/inference; `?skip=market` skips
  both sweeps.
- Scale: ~58 listings ≈ 6 pages ≈ seconds of extra runtime per day. No cap risk; if
  `hitPageCap`/`stoppedEarly` ever signal an exhausted window, the recovery pass covers the far
  end just like the age bands.
- **Deploy order (review finding)**: `listPlayers('world')` now references
  `senior_nt_seen_at`, so the column must exist BEFORE the code deploys — apply migration
  0013 to Neon FIRST, then push (additive nullable column: old code + new schema is fully
  compatible, so migrate-then-push is the zero-downtime order).
- **Bootstrap (review finding)**: the daily pass is newest-first with the 30h staleness
  stop, which assumes yesterday's sweep saw everything older — false on day one. The FIRST
  live run must be `{ ...SENIOR_NT_SWEEP_OPTS, oldestFirst: true }` (staleness stop off,
  reads the whole ~6-page universe); the incremental cron takes over from there.
