# Settings Page UX Rework — DRAFT (brainstorm in progress)

**Status: NOT a finished spec.** This is a saved brainstorming session (2026-07-12/13).
Resume point: user was deciding between Options A/B/C below (Claude recommends A).
Next step: pick an option → finish design → write final spec → writing-plans skill.

## Problem statement (user's words)

The v2 `/settings` page "became a bit of a dumping ground":

1. The three manual sync buttons are there but **not explained** — what they do, how
   they relate to the daily cron, when you'd press them.
2. Four unrelated sections (tracked countries, sync buttons, census runs, sync log)
   sit on one page **without clear separation**.
3. Goal: the page must be **self-documenting** — "I may again forget and be guessing
   a few months from now."

## Facts established (verified in code 2026-07-12)

- `src/app/settings/page.tsx` — server component, 4 stacked sections, plain tables.
- `src/app/settings/actions.ts` → `syncNow(job)` calls the same jobs as the daily
  06:00 UTC Hetzner cron:
  - **seasons** (`runSeasonsSync`) — upserts season list from BB XML API; cron: daily.
  - **players** (`runPlayersSync`) — refreshes all 18–21 players for Slovenia +
    tracked countries from BB Players JSON API; one `api` snapshot per player per UTC
    day (delete+reinsert dedup); cron: Mondays only → button = mid-week refresh.
  - **market** (`runMarketSweep`) — HTML-scrapes transfer list (ages 18–21, pot ≥6,
    newest-first, 30h staleness stop, 90-page cap); cron: daily.
- **Stale content bug**: census section still says runs are "started locally with
  `npm run census`" — outdated since Phase 4.5 (runs now start from the `/census`
  page via the Hetzner worker).

## Options proposed

**A — Same page, properly structured (recommended):**
- Each section = visually distinct card (border/background like rest of app) with
  title + 1–2 sentence plain-language description.
- Each sync button gets inline explanation: what it does, cron schedule, when to
  press manually.
- Per-job "last run" line pulled from sync log (e.g. "Last run: Jul 11, 06:02 ·
  cron · ok · 5 countries, 1,340 players").
- Fix stale census text.

**B — Split pages:** `/settings` keeps tracked countries only; new `/sync` (or
`/jobs`) page gets buttons + sync log + census runs. Cleaner conceptually; more nav
+ churn for a single-user tool.

**C — A + status dashboard strip:** everything in A plus a top summary strip with
one chip per job type (seasons/players/market/census): last run time + ok/failed.

Claude's recommendation: **A** (with C's "last run" line already folded in);
B feels like overkill for a one-user app.
