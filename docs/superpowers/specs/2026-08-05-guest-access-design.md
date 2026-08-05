# Guest access for the v2 dashboard — design

**Date:** 2026-08-05 · **Status:** approved in session (owner: "Good initial plan")

## Goal

Share the dashboard with a few community members ("guests") so they can search scouted
players and play with the training planner and give feedback — while everything
owner-only (census, syncs, self-trainer, config, all DB writes) stays locked to the
owner. Feedback arrives outside the app (Discord/BB-mail); no feedback code.

## Non-goals

Per-guest accounts, audit logging, rate limiting, an in-app feedback widget, any new
guest-writable state. Guests produce ZERO database writes and ZERO BB traffic.

## Auth changes (`src/lib/auth.ts`)

- New env var **`GUEST_PASSWORD`** (optional — unset/empty ⇒ guest login disabled).
  Add to `.env.local.example` and Vercel.
- `type Role = 'owner' | 'guest'`.
- `checkPassword(input)` → `resolvePassword(input): Role | null` — constant-time
  compare against `APP_PASSWORD` first (→ `'owner'`), then `GUEST_PASSWORD`
  (→ `'guest'`, only when set). Login UI unchanged (single password field); the error
  message never reveals which tier failed.
- `createSessionToken(role: Role)` — JWT gains a `role` claim; keep `sub: 'owner'`
  as-is for the owner. **Expiry: owner 30d (unchanged), guest 7d.**
- `verifySessionToken(token): Promise<Role | null>` — returns the role or null.
  Back-compat: a valid token without a `role` claim but `sub === 'owner'` (all
  currently-issued owner cookies) verifies as `'owner'`. Truthiness of the return
  value preserves the proxy's existing `if (verify(...))` pattern.

**Revocation semantics (documented, accepted):** rotating `GUEST_PASSWORD` stops new
guest logins; already-issued guest tokens remain valid up to 7 days. Hard revocation =
rotate `APP_SESSION_SECRET` (logs out everyone, including the owner).

## Session helpers (new `src/lib/session.ts`, server-only)

- `getSessionRole(): Promise<Role | null>` — reads the cookie via `await cookies()`,
  verifies, returns role. Used by server components for UI gating.
- `requireOwner(): Promise<void>` — throws `Error('owner only')` unless role is
  `'owner'`. **First line of every protected server action.** This is the security
  boundary; UI hiding is cosmetic.

## Proxy (`src/proxy.ts`)

- Unchanged: no valid token → redirect `/login`; matcher untouched.
- New: `OWNER_PATHS = ['/settings', '/census', '/scorecard']` — a valid **guest**
  token requesting a path starting with any of these → redirect `/`. (UX layer only;
  the actions those pages call are independently guarded.)

## Server-action guard inventory (all get `requireOwner()` first line)

| File | Actions |
|---|---|
| `src/app/census/actions.ts` | `wakeWorkerNow`, `enqueueCensus`, `previewCensus` |
| `src/app/scorecard/actions.ts` | `saveSelfTrainerConfig`, `runSelfTrainerNow` |
| `src/app/settings/actions.ts` | `addTrackedCountry`, `removeTrackedCountry`, `toggleStar`, `syncNow` |
| `src/app/players/[id]/actions.ts` | `addNote`, `deleteNote`, `addTag`, `removeTag`, `savePlan` |
| `src/app/slovenia/actions.ts` | `markReviewed` |
| `src/app/archetypes/actions.ts` | `saveDefaultOverride`, `resetDefault`, `hideDefault`, `saveCustom`, `deleteCustom` |

(`src/app/login/actions.ts login` stays public.) 20 actions total — the count is the
checklist; the implementation plan must tick every row.

## UI gating (server components read `getSessionRole()` and pass `role`/flags down)

- **Navbar**: hide Settings / Census / Scorecard links for guests.
- **Player page** (`/players/[id]`): notes + tags render **read-only** for guests
  (lists visible, add/delete forms hidden); `ProjectionPanel` gets **no `onSave`**
  for guests (existing prop contract already hides Save without it). Everything else
  (charts, history, development tab, TargetBuildPanel reverse planner) works — it is
  client-side compute.
- **Slovenia**: hide `ReviewBar` ("Mark as reviewed") and the ★ star-toggle control
  for guests. Filters/export/Δ-columns stay.
- **Training lab** (`/training`): fully usable incl. manual builds and DB players;
  save path omitted for guests (same `onSave` pattern).
- **Planner** (`/planner`): read-only board — visible unchanged.
- **Archetypes** (`/archetypes`): visible; edit/create/delete controls hidden for guests.
- **World / Compare / home**: visible; hide any owner-only widgets encountered during
  implementation (verify pass must click through as guest).

## Testing

- Unit (vitest): role round-trip (`createSessionToken('guest')` → verify `'guest'`),
  back-compat owner token (no role claim) → `'owner'`, `resolvePassword` mapping incl.
  unset `GUEST_PASSWORD`, `requireOwner` throws for guest/absent sessions.
- End-to-end (verify skill): build, run, log in as guest → confirm nav hides the three
  pages, direct URL to `/settings` redirects, notes form absent, plan Save absent,
  training lab + reverse planner functional; then as owner → everything unchanged.

## Rollout

1. Deploy; set `GUEST_PASSWORD` in Vercel env.
2. Share the production URL + guest password with the chosen community members.
3. Revoke by rotating `GUEST_PASSWORD` (soft, ≤7d tail) or `APP_SESSION_SECRET` (hard).
