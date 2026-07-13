# Settings Page UX Rework — Design

**Status: approved 2026-07-13.** Supersedes the draft `2026-07-13-settings-page-ux-draft.md`.

## Problem

The v2 `/settings` page became a dumping ground:

1. The three manual sync buttons are unexplained — what they do, how they relate to
   the daily cron, when to press them.
2. Four unrelated sections (tracked countries, sync buttons, census runs, sync log)
   sit on one page without clear separation.
3. The census section text is stale — it still says runs start locally with
   `npm run census`, outdated since Phase 4.5 (runs start from `/census` via the
   Hetzner worker).
4. The census runs table duplicates the better one on `/census` (which has live
   polling, the queue form, and the `requested` status).

Goal: the page must be **self-documenting** — readable months later with no memory
of how the sync system works.

## Design

### Page structure

`/settings` becomes three cards, each with a title and a 1–2 sentence plain-language
description. Card styling: `rounded-lg border border-neutral-800 bg-neutral-900/40 p-4`
(adjust to match existing app conventions if they differ).

1. **Tracked countries** — existing `CountryPicker` + `TrackedCountryList`, unchanged
   behavior. Description: *"Players aged 18–21 from these countries are synced weekly
   alongside Slovenia. Star countries you face this season."*
2. **Data sync** — replaces the bare "Manual sync" button row (see below).
3. **Sync log** — existing 20-row table, carded, with the line: *"Every sync run,
   newest first — cron and manual."*

The **census runs table is removed from settings**. Its only unique feature — the
newest-run per-item status breakdown — moves to the `/census` page's table (same
Result-cell rendering, applied to the newest run's row).

### Data sync card

Intro line: *"All jobs run automatically — the Hetzner box triggers the daily cron at
06:00 UTC. Buttons run the same job immediately."*

One row per job — name, schedule chip, description, live "last run" line, action on
the right:

| Job | Chip | Description | Action |
|---|---|---|---|
| Seasons | `cron: daily` | Refreshes the BB season list; the current season number drives age math. Rarely needed manually — press if a new season just started and ages look off. | **Sync now** |
| Players | `cron: Mondays` | Refreshes every 18–21-year-old for Slovenia + tracked countries from the BB Players API; stores one snapshot per player per day. Press for a mid-week refresh or after adding a country. | **Sync now** |
| Market | `cron: daily` | Scrapes the transfer list (ages 18–21, potential ≥6, all countries) for full skills and auction info. Press to catch fresh listings before bidding. | **Sync now** |
| Census | `manual` | Deep-scouts Slovenian prospects by cycling them through the U-21 roster via the Hetzner worker. | **Open /census →** (link) |

**Last run line** per row:

- Sync jobs: newest `sync_log` row for that `job_type`, fetched with a per-job
  `where(eq(jobType)) … orderBy(desc(startedAt)) … limit(1)` query (three cheap
  queries in the page's existing `Promise.all` — not sliced from the 20-row log,
  so a busy log can't hide a job). Format:
  `Last run: Jul 11, 06:02 · cron · ok · 5 countries · 1,340 players`
  (reuses `formatStartedAt` + `formatSyncResult`).
- Census: newest `census_runs` row:
  `Last run: Jul 11, 14:30 · finished · 17 ✓ / 1 ✗`.
- No runs yet → `Last run: never`.

### Component changes

- `src/components/settings/SyncButtons.tsx` is replaced by a **Data sync card**:
  the server component (`page.tsx`) fetches last-run data and renders descriptions;
  a client component owns the three "Sync now" buttons with one shared
  `useTransition`, so all buttons disable while any job runs (same as today).
- Button feedback becomes human-readable: reuse `formatSyncResult` instead of
  `JSON.stringify(r.counts)`. After completion, `revalidatePath('/settings')`
  refreshes the last-run lines (already happens).
- Sync formatters (`formatStartedAt`, `formatDuration`, `formatSyncResult`) move
  from `settings/page.tsx` to a shared module `src/lib/format-sync.tsx` (JSX in
  `formatSyncResult` → `.tsx`), imported by the settings page (sync log table),
  the data sync card, and the client button component.
- Census formatters (`formatCensusFilters`, `formatCensusResult`) — currently
  duplicated between `settings/page.tsx` and `census/page.tsx` — collapse into
  `src/lib/format-census.ts`, imported by `/census` and by the settings census
  row's last-run line.
- `/census/page.tsx` gains the per-item status breakdown on the newest run
  (straight port of the logic removed from settings: fetch `census_items` statuses
  for the newest run, render `(captured: 17, failed: 1)` in the Result cell).
- `settings/actions.ts` unchanged. No schema changes, no new routes.

### Error handling

Unchanged semantics — `syncNow` returns `ok`/`error`; the log records failures.
A failed run shows red in the button feedback and in the last-run line (via
`formatSyncResult`'s existing error rendering).

## Testing

Presentational change: `npm test` (existing vitest) + `npm run build` +
manual dev-server pass over `/settings` and `/census` (run each sync job once,
confirm last-run lines and log update).
