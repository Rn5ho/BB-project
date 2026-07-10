# BB Scout v2 — Full Rework Design

**Date:** 2026-07-10
**Status:** Approved by user (pending final spec review)
**Scope:** Complete rebuild of BB Scout: new app, new database, automated ingestion pipeline. Existing data is preserved via migration.

---

## 1. Context & Motivation

BB Scout v1 is a Next.js + Supabase dashboard fed primarily by a Chrome extension that scrapes BuzzerBeater pages while the user browses. It works, but:

- **Supabase free tier pauses after ~1 week idle** and requires manual dashboard restore — recurring annoyance.
- **Scouting is still hours of manual work.** Each offseason the user must cycle 100–150 Slovenian 18–21yo candidates through the U-21 NT roster (18 slots) to reveal their skills, capturing them by hand or via Cowork-driven browser automation.
- The v1 codebase was built incrementally by a weaker model: 37KB single-file pages, no tests, extension with hardcoded DB keys.

During design research (2026-07-10) we discovered automation paths that remove almost all manual work — see §4. The rework's center of gravity shifts from "dashboard fed by manual scraping" to **"automated scouting pipeline with a dashboard on top."**

### Core idea (unchanged from v1)

A scouting intelligence tool for the Slovenia U-21 NT manager: every potential candidate aged 18–21 lives in the database with skill/DMI history over time; the tool does the collecting, the user does the judging — roster selection and coordinating training with player owners. Secondary: track other countries' U-21 players (opponents) whose skills are only visible opportunistically.

---

## 2. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rebuild vs refactor | Full rebuild (approach A) | User wants best-possible UX; v1 architecture constrains it |
| Database | **Neon Postgres** (free tier) | Auto-wakes in <1s (no manual restore, unlike Supabase pause); plain Postgres so v1 data migrates with pg_dump |
| ORM / migrations | Drizzle + drizzle-kit | Typed schema in code, versioned migrations (no more manual SQL editor) |
| Auth | Single-user password + session cookie | Sole user; Supabase Auth was overkill; extension no longer needs embedded keys |
| Extension | Retired from core flow | Pipeline replaces it; kept in repo as optional ad-hoc capture tool posting to the new ingest endpoint |
| Scout page (BB API fetch UI) | Dropped | Never used in v1 |
| Training simulator | Not ported in v2 scope | Standalone future project; its collected data/tables stay in v1 git history |
| `is_nt_player` flag | Replaced by season-scoped `nt_squad` | v1 flag was sticky/broken by design |
| Rollout | New app under a second Vercel project until parity, then takes over the main URL | v1 stays usable during the rebuild; user tests v2 live |

---

## 3. Research Findings (verified 2026-07-10, all tested live)

1. **Players JSON API — no auth required.** `GET https://api.buzzerbeater.com/BBAPI/api/Players?countryId=66&minAge=18&maxAge=21` returns all 805 Slovenian 18–21yo: `playerId`, name, `teamId`/`teamName` (owner), `position`, `age`, `potential`, `salary`, `height`, `gs` (game shape), `dmi`, `isForSale`, `isInjured`, `seasonDrafted`, `isUtopian`. ⚠️ `height` is in **INCHES** (both here and in the XML API) — verified live: height 73 = 6'1"/185cm. v1 mislabeled these as cm; every v2 mapper must convert (`cm = round(inches × 2.54)`), and the Supabase migration normalizes legacy values (<100 = inches). Works for any country. Caps at 1000 rows (`isMoreThan1000` flag) — filter params keep results under the cap. This is the same API nt.buzzerbeater.com (community scout site) uses; building on it makes that site redundant for our workflow.
2. **The XML BBAPI (bbapi.buzzerbeater.com) cannot see NT rosters.** `roster.aspx?teamid=1066` (Slovenija U21 = team 1066, confirmed via boxscore) returns `ServerError`; unknown params are silently ignored. Club rosters return full skills only for the user's own club (Savlje BC, 114360). Still useful for: `seasons.aspx` (season tick-over), `boxscore.aspx`, `teaminfo.aspx`.
3. **NT roster page is scrape-gold.** `https://buzzerbeater.com/country/66/jnt/players.aspx` (logged-in) renders each called-up player as a card with all 12 skills as text (`Handling: wondrous (14)`), plus TSP, salary, DMI, age, potential, game shape, experience, player id, owning team. Max 18 players called up at once; skills visible **only while called up**.
4. **Call-up / dismiss are ASP.NET postbacks** on the player's page (logged-in as NT manager). Scriptable via HTTP (fetch page → parse hidden form fields → POST) or Playwright fallback.
5. **Transfer list search results show full skills** for listed players — same card format as the NT roster page, 10 players per page, paginated; additionally shows starting price, auction end time, owner, and the **Rookie** badge (new draftee marker). Minimum listing duration is 72h, so a daily sweep never misses a listing.

---

## 4. Ingestion Pipeline (three layers)

### Layer 1 — Scheduled, no account actions (Vercel cron)

**1a. Players API sync** (weekly + on-demand "Sync now" button):
- Slovenia, ages 18–21 (the full candidate universe) → upsert `players`, insert **light snapshots** (age, DMI, GS, salary, potential, owner team; skills null).
- Each tracked country (user-managed list), ages 18–21 → same.
- Detects: new draftees (`seasonDrafted` = current), ownership changes, DMI/salary trajectory.

**1b. Market sweep** (daily — simpler than the theoretical 70h cadence, same guarantee since listings last ≥72h):
- Log into buzzerbeater.com (website session via HTTP), run transfer list search filtered to ages 18–21, paginate, parse full-skill cards → **market snapshots** (full skills + starting price, auction end, owner, rookie flag).
- Scope: all nationalities in tracked countries + Slovenia. Players API `isForSale` serves as a cross-check, not the primary path.
- This captures foreign talents' **initial skills at draft age** — the baseline for inferring their build later from position history + DMI trajectory.

**1c. Season sync** (daily, cheap): `seasons.aspx` via XML API → `seasons` table → drives age tick-over and "current season" everywhere. No client-side season caching hacks.

### Layer 2 — The census (local CLI, user-initiated)

`npm run census` — replaces the offseason week of manual call-ups:

1. Build candidate list (from DB: Slovenian 18–21yo matching configurable potential/salary floor, minus players with a fresh full snapshot this season).
2. Record players already on the NT roster at start as **protected** — the tool never dismisses anyone it didn't call up.
3. Loop in batches of `18 − protected` free slots: call up batch (postback per player) → fetch roster page → parse all cards → POST to the app's secured ingest endpoint → dismiss the batch → next.
4. Live progress output; polite rate limiting (1–2s between requests); resumable after interruption (census run state in DB).
5. Summary report: new full snapshots, notable deltas ("who popped"), parse failures for manual follow-up.

Runs locally first (safety + observability: the user watches run #1). Can graduate to a scheduled runner later. BB website credentials for the CLI live only in the local `.env`.

### Layer 3 — Manual

- **Manual entry form** stays (coach reports via BB-Mail/Discord); source `manual`.
- **Paste parser** (multi-language BB-Mail text → skills) — future enhancement, as in the v1 vision doc.
- **Extension** — optional; if kept installed, it posts to the ingest endpoint with the same shared secret.

### Ingest endpoint

`POST /api/ingest` — accepts batches of parsed player cards, authenticated by a shared secret header. Single write-path for census CLI, extension, and any future tooling. Performs the same upsert + snapshot-dedup logic as internal sync (one snapshot per player per source per day: update, don't duplicate).

---

## 5. Data Model (Neon, via Drizzle)

- **`players`** — `bb_player_id` (PK), first/last name, `country_id`, nationality, height_cm, best_position, `is_utopian`, `season_drafted`, `draft_pick`, current `owner_team_id`/`owner_team_name`, `first_seen_at`, `archived` flag.
- **`snapshots`** — id, player_id FK, `captured_at`, `source` (`api` | `market` | `census` | `manual` | `extension`), `season`, age, dmi, game_shape, salary, potential, experience, 12 skill columns (nullable — null = light snapshot), `tsp` (stored, computed on write), owner team at capture, market fields (`starting_price`, `auction_ends_at`, `is_rookie_listing`) nullable.
- **`nt_squad`** — (player_id, season, role/note). Season-scoped squad membership curated by the user in the UI. Replaces `is_nt_player`. Historical squads preserved per season.
- **`tracked_countries`** — country_id, name, starred/purpose (e.g. "season opponent"), added_at.
- **`seasons`** — id (BB season number), start, finish; synced from XML API.
- **`notes`** — player_id, body, created_at. **`tags`** — player_id, tag.
- **`census_runs`** / **`census_items`** — run bookkeeping: status, counts, per-player outcome (for resume + reporting).
- **`sync_log`** — one row per automated job run (type, started, finished, counts, errors) → surfaces in Settings so silent cron failures are visible.

Migration from Supabase: one-off script reads v1 tables (players, skill_snapshots, player_notes, player_tags, settings), transforms (e.g. height string → cm int, `is_nt_player` → `nt_squad` rows for the current season only), writes to Neon, verifies row counts. Supabase becomes read-only backup until v2 cutover, then retired.

---

## 6. Domain Constants (drive filters, validation, and UI)

- No players younger than 18 exist. Draft classes are 18 or 19yo.
- Skill caps by age: **18yo → each skill 1–7; 19yo → 1–10.** Parser sanity checks: a value above the cap = parse error, not a prodigy.
- Skill scale 1–20 (`atrocious`…`legendary`), potential 0–11 (0 effectively unused). Existing v1 name→number maps and BB color hexes carry over.
- Potential relevance for U-21: **7–11 relevant; 6 edge-case** (usually can't finish primary skills). Big men (C/PF) effectively need **8+** (ideally 9–10, big-man skills cost more potential); outside players competitive at **7+**.
- These become named filter presets (e.g. "U21-viable", "Big-man viable"), refined with the user later — not hard-coded exclusions.
- DMI is state-dependent: always display Game Shape adjacent to DMI.

---

## 7. Application (pages)

Single-user app, dark theme (carry over v1's BB color coding), small focused components, no 37KB page files.

- **Slovenia** — precision view. Roster/squad management per season (`nt_squad` picker), prospects table with per-skill threshold filters, archetype badges (rule-based, later), TSP-vs-age power curve coloring, data freshness ("scouted this season?"), multi-select → Compare.
- **World** — historical record. Country multi-select + presets (Europe, Season opponents), age/potential/position filters, DMI **with GS adjacent** + DMI sparkline (trajectory from light snapshots), data-completeness badge (full skills / DMI-only + staleness), "new this season" (rookie) flag, "on market now" indicator with auction countdown, multi-select → Compare.
- **Player detail** — skill progression chart across full snapshots; DMI/salary trajectory chart from light snapshots; position-over-time row (feeds the user's build-inference workflow); snapshot table with deltas; notes; owner team link (for reaching out to owners/trainers); market history.
- **Compare** — side-by-side 2–N players, entered via multi-select; selection persists across pages.
- **Census** — start instructions (CLI), run history, live/latest run results, "who popped" diff view vs previous season.
- **Manual entry** — form (paste parser later).
- **Settings** — tracked countries management, sync-now buttons, sync log, season info.

---

## 8. Tech Stack & Conventions

- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel; Vercel Cron for scheduled jobs.
- Neon serverless Postgres + Drizzle ORM; migrations via drizzle-kit, applied in CI/deploy.
- **Shared card parser** module: one parser for NT-roster cards and transfer-list cards (same BB markup), unit-tested against saved HTML fixtures. Parsing failures are loud (sync_log + census report), never silent nulls.
- BB website session module: form login → cookie jar → postback helper (parse ASP.NET hidden fields). Used by market sweep (Vercel) and census CLI (local). Playwright is a fallback, not a dependency of the deployed app.
- Tests: Vitest — card parser, Players API mapper, season/aging logic, snapshot dedup. HTML fixtures checked into the repo.
- Repo layout: `v2/` app alongside existing `web/` + `extension/` until cutover; census CLI lives in `v2/scripts/`.
- Workflow: small incremental commits to main, push after every commit (Vercel auto-deploys), user tests live between changes.

### Credentials

| Secret | Where | Used by |
|---|---|---|
| Neon connection string | Vercel env + local `.env` | app, migrations, census ingest |
| App login password (hash) | Vercel env | dashboard auth |
| Ingest shared secret | Vercel env + local `.env` | census CLI, extension |
| BB website username/password | Vercel env (market sweep) + local `.env` (census) | website session module |
| BB XML API user/security code | Vercel env | seasons/boxscore endpoints |

---

## 9. Rollout Plan (phases, each independently shippable)

1. **Foundation** — v2 app scaffold, Neon schema + migrations, auth, data migration script from Supabase, read-only Slovenia/World tables over migrated data. *(Parity milestone: user can browse existing data in v2.)*
2. **Layer 1 automation** — Players API sync + season sync + Settings/sync log. World view becomes self-updating.
3. **Market sweep** — website session module + card parser + daily cron + market UI touches (on-market indicator, rookie flag).
4. **Census** — CLI + ingest endpoint + Census page. *(The offseason problem is solved here.)*
5. **Dashboard depth** — player detail charts, compare, per-skill filters, archetype presets, squad picker.
6. **Cutover** — v2 takes the main URL; v1 + Supabase retired after a final data re-sync.

Each phase gets its own implementation plan (writing-plans skill) before coding.

---

## 10. Out of Scope (named future work)

- **Position-history mining** from boxscores/teamstats (reconstruct likely training focus per season) — explicitly requested as a future enhancement for build inference.
- Paste parser for coach reports; screenshot OCR.
- Training simulator (standalone project; revisit with calibration data).
- Automation page for scheduled DMI refresh beyond the built-in crons.
- Opponent championship draw prediction.

---

## 11. Risks & Mitigations

- **BB markup changes break parsers** → fixtures + loud failures + parser isolated in one module.
- **Players API is technically undocumented** (though BB-hosted and used by community sites) → sync failures surface in sync_log; XML API + census remain independent capture paths.
- **Account safety (automation acts as the user)** → census touches only players it called up; protected-player list; polite rate limits; user supervises first runs; market sweep is read-only browsing.
- **Vercel function limits** for the market sweep (login + N pages) → sweep is bounded (ages 18–21 listings only); if it ever outgrows limits, move to a GitHub Actions cron hitting the same ingest endpoint.
- **Migration fidelity** → row-count + spot-check verification; Supabase kept as read-only backup until cutover.
