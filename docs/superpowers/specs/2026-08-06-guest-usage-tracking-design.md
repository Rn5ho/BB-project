# Guest usage tracking — design

**Date:** 2026-08-06
**Status:** approved (design), pending implementation
**Context:** Guest access shipped 2026-08-05 (`docs/superpowers/specs/2026-08-05-guest-access-design.md`).
Guests log in with one shared password and have no accounts, so the owner currently has no
signal at all about whether the shared dashboard is being used.

## Goal

Answer, from `/settings`: **is anyone actually using the guest dashboard, how much, and which
pages do they use?** Nothing more. Guests stay anonymous by design — the owner explicitly does
not need to know *who* they are, only *whether* and *how much*.

Second motivation (owner, 2026-08-06): the guest password is shared by hand and could be passed
on further than intended. A jump in **distinct sessions per day** beyond the handful of people the
owner actually shared it with is the signal that the password has spread, and the fix is already
one click away — rotate it on the Guest access card. This makes `distinctSessions` the headline
number rather than raw view count, and it is why the per-day series tracks sessions alongside views.

## Non-goals

- No identity: no IP addresses, no user-agent strings, no fingerprinting.
- No owner-activity tracking — owner traffic would swamp the signal and the owner already knows what they do.
- No retention/pruning job. Expected volume is a few hundred rows per month; revisit only if it grows.
- No analytics product (PostHog/Plausible/GA). An external tracker is heavier, blockable, and sends
  a private hobby dashboard's data off-box for a question a single table answers.

## Approach

Log guest page views **server-side from `src/proxy.ts`**, the request path every guest page already
passes through and where the role is already resolved.

Considered and rejected: a client-side beacon component in the root layout POSTing to `/api/track`.
It is more code (client component + API route), duplicates the role logic, and is blockable by
ad-blockers. The proxy approach needs no client code at all and cannot be blocked.

Anonymous session identity comes from a random `jti` claim minted into each **guest** JWT at login.
One login = one id, alive for the token's 7-day life. That yields "N distinct guest sessions this
week" without any personal data. Owner tokens are unchanged.

## Data model

New table `guest_events` (Drizzle migration `0012_guest_events.sql`, table in `src/db/schema.ts`):

| column | type | notes |
|---|---|---|
| `id` | `serial` pk | |
| `occurred_at` | `timestamptz not null default now()` | |
| `session_id` | `text not null` | the guest token's random `jti`. `verifySession` returns `sessionId: null` for guest tokens issued before this change (no `jti` claim); the writer maps that `null` to the literal `'unknown'` so the column stays non-null. Those sessions collapse into one bucket and age out within 7 days. |
| `event` | `text not null` | `'login'` or `'pageview'` |
| `path` | `text` | request pathname; null for `login` events |

Indexes: `idx_guest_events_occurred` on `occurred_at desc` (every read is time-windowed).

Paths are stored raw as pathname only — **query strings are dropped** (`?player=123` etc. adds
nothing to the usage question and lengthens rows).

## Components

### 1. `src/lib/auth.ts` — session id

- `createSessionToken(role)` sets a random `jti` (via `crypto.randomUUID()`) on guest tokens.
- New `verifySession(token): Promise<{ role: Role; sessionId: string | null } | null>`.
  `verifySessionToken` stays as-is (thin wrapper over the new function) so `src/lib/session.ts`
  and its callers need no changes.

### 2. `src/proxy.ts` — capture

In the `role === 'guest'` branch, before returning:

- Skip unless it is a real navigation: `req.method === 'GET'` **and** the request is not a Next
  prefetch (`next-router-prefetch` header present, or `purpose`/`x-purpose` header equal to
  `prefetch`). Predicate extracted as an exported pure function `isTrackableNavigation(req)` so it
  is unit-testable without a running server.
- Skip non-page requests: any pathname containing a file extension (e.g. `/favicon.ico`) or
  starting with `/api/`.
- Insert one `pageview` row via **`event.waitUntil(...)`**, never awaited inline, with the promise's
  rejection swallowed (`.catch(() => {})`). A DB hiccup must never break a guest's browsing, and the
  write must never delay the response.

**Runtime — resolved 2026-08-06 against `node_modules/next/dist/docs`, no longer an open question:**

- Next 16 proxy *defaults to the Node.js runtime* and forbids the `runtime` segment config
  (`03-api-reference/03-file-conventions/proxy.md` §Runtime). The existing `@/db` client
  (`@neondatabase/serverless` over HTTP fetch) therefore imports and runs there unchanged. No
  internal-call workaround is needed.
- The same doc warns *"Proxy is not intended for slow data fetching"*, and its `waitUntil` section
  shows **exactly this analytics-beacon pattern** as the sanctioned way to do background work from
  a proxy. `waitUntil` takes the write off the response path, which is what makes proxy-side
  logging appropriate here rather than merely convenient. The proxy signature becomes
  `proxy(req: NextRequest, event: NextFetchEvent)`.
- App Router client-side navigations reach the proxy as RSC requests, so in-app link clicks are
  captured alongside full page loads — which is precisely why the prefetch filter above is load-bearing.

### 3. `src/app/login/actions.ts` — login event

On a successful `guest` login, insert one `login` row with the same `session_id` as the freshly
minted token. Best-effort (`try/catch`) — a logging failure must never block the login itself.
This is a server action, not the proxy, so the insert is awaited normally.

### 4. Read side — split thin-SQL / pure-aggregation

The repo has **no DB test harness** (`vitest.config.ts` sets a stub `DATABASE_URL`, and no test
imports `@/db`). The established pattern is: queries stay thin and untested, logic lives in
`src/lib/*` and is unit-tested. This split follows it:

- `src/queries/guest-activity.ts` — `fetchGuestEvents(sinceIso)`: one `SELECT` of the raw rows in
  the window, ordered by `occurred_at`. No aggregation, nothing to test.
- `src/lib/guest-activity.ts` — `summarizeGuestEvents(rows, { days, now })`, a **pure function**
  doing all the counting, so every number on the card is unit-testable without a database:
  - `totalViews`, `distinctSessions`, `logins`, `lastSeenAt`
  - `perDay`: `{ day: 'YYYY-MM-DD', views, sessions }[]` — one entry per day in the window,
    including zero-days so the bar strip has no gaps
  - `topPaths`: `{ path, views }[]`, top 10 by views

Days bucket by **UTC** date, matching how every other date in this project is handled.

### 5. `/settings` — display

A new `Card` titled **"Guest activity"**, placed directly below the existing "Guest access" card
(same subject, natural reading order). Server-rendered — no client interactivity needed.

Content, leading with the leak-watch number: **distinct sessions** first, then total views, then
last seen; a compact per-day bar strip over the window; then the top-paths list. Empty state:
*"No guest activity yet."* When guest access is disabled and there is no history at all, the card
is hidden entirely.

## Testing

All tests are pure-function tests — no database required, consistent with the rest of the repo.

- `src/lib/auth.test.ts` (extend): guest tokens carry a `jti` that round-trips through
  `verifySession`; two guest logins produce different ids; owner tokens carry no `jti`; legacy
  guest tokens without `jti` verify with `sessionId: null`; existing `verifySessionToken`
  assertions still pass unchanged.
- `src/lib/guest-tracking.test.ts` (new): `isTrackableNavigation` accepts a plain GET page request
  and rejects prefetches (`next-router-prefetch`, `purpose: prefetch`, `x-purpose: prefetch`),
  non-GET methods, `/api/*` paths, and paths with a file extension.
- `src/lib/guest-activity.test.ts` (new): `summarizeGuestEvents` counts views and distinct
  sessions, emits a zero-filled per-day series in UTC, ranks top paths, ignores `login` rows in
  the view count, and returns a well-formed empty summary for no rows.

## No guest-facing notice

Decided against (owner, 2026-08-06): the GuestAccessCard blurb is **not** changed. Nothing personal
is recorded — there is no identity, device or location data to disclose, only anonymous hit counts
on a private dashboard the owner runs for themselves.

## Cost

One INSERT per guest page view against a Neon compute that is already awake serving that same
request's queries. No polling, no background jobs, no measurable CU impact.
