---
name: verify
description: Build/launch/drive recipe for verifying BB Scout v2 changes end-to-end
---

# Verifying BB Scout v2

## Launch

```powershell
cd D:\ClaudeProjects\BB-project\v2
npm run dev   # ready in ~2s on http://localhost:3000
```

`npm test` is already `vitest run` — do NOT append `run` (it becomes a filename filter).

## Login

All pages are behind the auth proxy. Navigate anywhere → redirected to `/login`.
Type the password from `APP_PASSWORD` in `v2/.env.local` into the single password
field and press Enter. JWT cookie persists for the browser session.

### Logging in as a GUEST (to exercise guest-only behavior)

The guest password lives in the **database** (`app_config` key `guest_password`, managed on
`/settings`), NOT in `.env.local`. `GUEST_PASSWORD` there is only a fallback for local setups
and as of 2026-08-06 it is STALE and does not match. Read the real one from the DB, or from
the Guest access card on `/settings` while logged in as owner.

Guests are redirected off `/settings`, `/census` and `/scorecard`. Guest page views are
logged to `guest_events` — if you drive a guest session while verifying, you are writing
rows into the production table, so **delete them afterward** (they are identifiable by their
`session_id`, one per login) or the owner's Guest activity card shows traffic that never
happened.

## Driving

Playwright MCP works well. Gotchas:

- `/slovenia` and `/world` render ~800–1700 player rows — a full `browser_snapshot`
  blows the token limit. Use `filename:` to save the snapshot to disk, then grep it;
  or snapshot a `target:` element.
- Skill-min inputs in the FilterBar are addressable as `label[title="<Skill Name>"] input`
  (e.g. `label[title="Outside Def."] input`).
- Filter state persists in localStorage per page (`bbscout:table:slovenia` / `:world`).
- "Sync now" for **seasons** is the cheap safe job to exercise the sync-button flow
  (~1s, idempotent). Players/market take 30s–2min and hit BB for real.

## Known pre-existing noise

- Hydration mismatch error on player tables: `toLocaleString()` renders `24,147` on
  the server but `24.147` on a Slovenian-locale client (DMI/salary cells in
  PlayerTable). Present since before 2026-07-13; not caused by whatever you're
  verifying.
