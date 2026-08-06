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
- Insert one `pageview` row, **best-effort**: wrapped in `try/catch`, awaited but never allowed to
  fail the request. A DB hiccup must never break a guest's browsing.

Note: this runs in the Next proxy. The existing Neon/Drizzle client (`@/db`) must be importable
there; if the proxy is edge-constrained in this Next version, the insert moves behind a tiny
internal server call rather than changing the design. Implementation verifies this early — it is
the one real unknown in this spec.

### 3. `src/app/login/actions.ts` — login event

On a successful `guest` login, insert one `login` row with the same `session_id` as the freshly
minted token. Best-effort, same try/catch treatment.

### 4. `src/queries/guest-activity.ts` — read side

`getGuestActivity(days = 30)` returns, in one place, everything the card renders:

- `totalViews`, `distinctSessions`, `lastSeenAt`, `logins`
- `perDay`: `{ day, views, sessions }[]` for the window (for a sparkline/bar strip)
- `topPaths`: `{ path, views }[]`, top 10

### 5. `/settings` — display

A new `Card` titled **"Guest activity"**, placed directly below the existing "Guest access" card
(same subject, natural reading order). Server-rendered — no client interactivity needed.

Content: headline numbers (views / distinct sessions / last seen), a compact per-day bar strip for
the last 30 days, and the top-paths list. Empty state: *"No guest activity yet."* When guest access
is disabled and there is no history, the card is hidden entirely.

## Testing

- `src/lib/auth.test.ts`: guest tokens carry a `jti` and it round-trips through `verifySession`;
  two logins produce different ids; owner tokens are unaffected; legacy tokens without `jti`
  verify with `sessionId: null`.
- New test for `isTrackableNavigation`: plain GET tracked; prefetch headers, non-GET, `/api/*`
  and extension paths rejected.
- `getGuestActivity` shape test against the existing vitest DB setup.

## No guest-facing notice

Decided against (owner, 2026-08-06): the GuestAccessCard blurb is **not** changed. Nothing personal
is recorded — there is no identity, device or location data to disclose, only anonymous hit counts
on a private dashboard the owner runs for themselves.

## Cost

One INSERT per guest page view against a Neon compute that is already awake serving that same
request's queries. No polling, no background jobs, no measurable CU impact.
