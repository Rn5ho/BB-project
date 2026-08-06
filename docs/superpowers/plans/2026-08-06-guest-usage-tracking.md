# Guest Usage Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner see, from `/settings`, whether and how much anonymous guests use the dashboard — with distinct sessions per day as the headline number, so a leaked guest password shows up as a visible jump.

**Architecture:** Each guest login mints a random `jti` into its JWT, which serves as an anonymous session id. `src/proxy.ts` — which every guest page request already passes through, and which in Next 16 runs on the Node.js runtime — writes one `guest_events` row per real page navigation via `event.waitUntil()`, keeping the write off the response path. The read side splits into a thin SQL fetch plus a pure `summarizeGuestEvents()` so every number on the settings card is unit-testable without a database.

**Tech Stack:** Next.js 16 (App Router, proxy convention), Drizzle ORM + Neon Postgres (`@neondatabase/serverless` neon-http), `jose` for JWTs, vitest.

**Spec:** `docs/superpowers/specs/2026-08-06-guest-usage-tracking-design.md`

## Global Constraints

- **Read this first:** `v2/AGENTS.md` — this is Next.js **16**, whose APIs differ from training data. Consult `v2/node_modules/next/dist/docs/` before writing Next-specific code. The proxy convention (`src/proxy.ts`, formerly middleware) is documented at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- All commands run from `D:\ClaudeProjects\BB-project\v2` (the v2 app root), not the repo root.
- `npm test` is **already** `vitest run` — never append `run` (it becomes a filename filter).
- **No new dependencies.** Everything needed is already installed.
- **No identity data may be stored** — no IP addresses, no user-agent strings, no fingerprinting. Only the anonymous `jti`, a timestamp, an event kind, and a pathname.
- **Query strings are dropped.** Store `req.nextUrl.pathname` only, never `search`.
- **Do not modify the `GuestAccessCard` blurb.** The owner explicitly declined adding a guest-facing tracking notice.
- Guest tracking must never break guest browsing or login: every DB write in this feature is best-effort and swallows its own errors.
- Dates bucket by **UTC**, consistent with the rest of the project.
- Avoid `toLocaleString()` in anything that renders on both server and client — the repo has a known hydration mismatch from it (server `en-US` vs client `sl-SI`). Use the UTC-explicit helpers in `src/lib/format-sync.tsx`.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/auth.ts` (modify) | Mint a `jti` on guest tokens; expose `verifySession()` returning role + session id. |
| `src/lib/auth.test.ts` (modify) | Cover the new `jti` behavior; existing assertions must keep passing. |
| `src/lib/guest-tracking.ts` (create) | `isTrackableNavigation()` — the pure "is this a real page view?" predicate. |
| `src/lib/guest-tracking.test.ts` (create) | Tests for that predicate. |
| `src/lib/guest-activity.ts` (create) | `summarizeGuestEvents()` — pure aggregation into the numbers the card shows. |
| `src/lib/guest-activity.test.ts` (create) | Tests for the aggregation. |
| `src/db/schema.ts` (modify) | `guestEvents` table definition. |
| `drizzle/0012_guest_events.sql` (generated) | Migration. |
| `src/queries/guest-events.ts` (create) | Thin DB access: `recordGuestEvent()` (write) and `fetchGuestEvents()` (read). |
| `src/proxy.ts` (modify) | Capture page views for guest sessions. |
| `src/app/login/actions.ts` (modify) | Capture the login event. |
| `src/components/settings/GuestActivityCard.tsx` (create) | Presentational server component for the activity card. |
| `src/app/settings/page.tsx` (modify) | Fetch the data and render the card below Guest access. |

**Naming note:** the spec called the query file `src/queries/guest-activity.ts`. This plan uses `src/queries/guest-events.ts` (named for the table, holding both the write and the read that touch it) and reserves `src/lib/guest-activity.ts` for the pure summary. Two files, two clearly different jobs, no name collision.

---

### Task 1: Anonymous session id in guest tokens

**Files:**
- Modify: `src/lib/auth.ts`
- Test: `src/lib/auth.test.ts` (existing file — add to it)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `type Session = { role: Role; sessionId: string | null }`
  - `verifySession(token: string): Promise<Session | null>`
  - `verifySessionToken(token: string): Promise<Role | null>` — unchanged signature and behavior, now a wrapper. Tasks 5 and 6 use `verifySession`.

- [ ] **Step 1: Write the failing tests**

Add this block to `src/lib/auth.test.ts`, immediately after the existing `describe('session tokens', ...)` block. Note it imports `verifySession`, which does not exist yet — update the import line at the top of the file to:

```ts
import { createSessionToken, verifySession, verifySessionToken, resolvePassword } from './auth';
```

Then append:

```ts
describe('anonymous guest session ids', () => {
  it('gives each guest token a session id', async () => {
    const token = await createSessionToken('guest');
    const session = await verifySession(token);
    expect(session?.role).toBe('guest');
    expect(typeof session?.sessionId).toBe('string');
    expect(session?.sessionId?.length).toBeGreaterThan(0);
  });

  it('gives two guest logins different session ids', async () => {
    const a = await verifySession(await createSessionToken('guest'));
    const b = await verifySession(await createSessionToken('guest'));
    expect(a?.sessionId).not.toBe(b?.sessionId);
  });

  it('does not tag owner tokens with a session id', async () => {
    const session = await verifySession(await createSessionToken('owner'));
    expect(session).toEqual({ role: 'owner', sessionId: null });
  });

  it('accepts guest tokens issued before session ids existed', async () => {
    const legacy = await new SignJWT({ sub: 'owner', role: 'guest' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.APP_SESSION_SECRET));
    expect(await verifySession(legacy)).toEqual({ role: 'guest', sessionId: null });
  });

  it('returns null for a token that does not verify', async () => {
    expect(await verifySession('not-a-jwt')).toBe(null);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/auth.test.ts`
Expected: FAIL — `verifySession` is not exported (import error / "is not a function").

- [ ] **Step 3: Implement**

In `src/lib/auth.ts`, add the `Session` type below the existing `Role` type:

```ts
export type Session = { role: Role; sessionId: string | null };
```

Replace `createSessionToken` with:

```ts
export async function createSessionToken(role: Role = 'owner'): Promise<string> {
  const jwt = new SignJWT({ sub: 'owner', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY[role]);
  // Guest tokens carry a random id so anonymous usage can be counted per login without
  // identifying anyone. Owner tokens don't — owner traffic is deliberately not tracked.
  if (role === 'guest') jwt.setJti(crypto.randomUUID());
  return jwt.sign(secret());
}
```

Replace `verifySessionToken` with the pair below, keeping the existing doc comment above `verifySession`:

```ts
/** Returns the session role + anonymous id, or null if the token is invalid/expired.
 *  Back-compat: owner tokens issued before roles existed carry sub:'owner' and no
 *  role claim — they verify as 'owner'. Tokens issued before session ids existed
 *  simply have no jti, and report sessionId: null. */
export async function verifySession(token: string): Promise<Session | null> {
  const key = secret(); // throws loudly on misconfiguration
  try {
    const { payload } = await jwtVerify(token, key);
    const sessionId = typeof payload.jti === 'string' ? payload.jti : null;
    const role = payload.role;
    if (role === 'owner' || role === 'guest') return { role, sessionId };
    return payload.sub === 'owner' ? { role: 'owner', sessionId } : null;
  } catch {
    return null;
  }
}

/** Role-only view of verifySession, for the many call sites that don't care about the id. */
export async function verifySessionToken(token: string): Promise<Role | null> {
  return (await verifySession(token))?.role ?? null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/auth.test.ts`
Expected: PASS — all new tests plus every pre-existing test in the file, including `verifySessionToken throws loudly when secret missing` (the wrapper propagates the throw from `secret()`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat(auth): anonymous session id on guest tokens

Guest tokens get a random jti so guest dashboard usage can be counted per
login without identifying anyone. verifySession exposes it; verifySessionToken
keeps its old role-only signature for existing callers."
```

---

### Task 2: The trackable-navigation predicate

**Files:**
- Create: `src/lib/guest-tracking.ts`
- Test: `src/lib/guest-tracking.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `isTrackableNavigation(req: TrackableRequest): boolean`, where `TrackableRequest` is the structural type `{ method: string; headers: { get(name: string): string | null }; nextUrl: { pathname: string } }`. A `NextRequest` satisfies it, and Task 5 passes one directly.

**Why this exists:** App Router client-side navigations reach the proxy as RSC requests, so in-app link clicks are captured — but the router also *prefetches* routes the user never opens. Counting those would inflate every number on the card.

- [ ] **Step 1: Write the failing test**

Create `src/lib/guest-tracking.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isTrackableNavigation } from './guest-tracking';

/** Minimal stand-in for the NextRequest fields the predicate reads. */
function req(opts: { method?: string; pathname?: string; headers?: Record<string, string> } = {}) {
  const headers = new Headers(opts.headers ?? {});
  return {
    method: opts.method ?? 'GET',
    headers,
    nextUrl: { pathname: opts.pathname ?? '/slovenia' },
  };
}

describe('isTrackableNavigation', () => {
  it('tracks a plain page request', () => {
    expect(isTrackableNavigation(req())).toBe(true);
  });

  it('tracks an in-app RSC navigation', () => {
    expect(isTrackableNavigation(req({ headers: { RSC: '1' } }))).toBe(true);
  });

  it('ignores router prefetches', () => {
    expect(isTrackableNavigation(req({ headers: { 'next-router-prefetch': '1' } }))).toBe(false);
    expect(isTrackableNavigation(req({ headers: { purpose: 'prefetch' } }))).toBe(false);
    expect(isTrackableNavigation(req({ headers: { 'x-purpose': 'prefetch' } }))).toBe(false);
    expect(isTrackableNavigation(req({ headers: { Purpose: 'Prefetch' } }))).toBe(false);
  });

  it('ignores non-GET requests', () => {
    expect(isTrackableNavigation(req({ method: 'POST' }))).toBe(false);
    expect(isTrackableNavigation(req({ method: 'HEAD' }))).toBe(false);
  });

  it('ignores api routes', () => {
    expect(isTrackableNavigation(req({ pathname: '/api/cron/daily' }))).toBe(false);
  });

  it('ignores asset requests', () => {
    expect(isTrackableNavigation(req({ pathname: '/favicon.ico' }))).toBe(false);
    expect(isTrackableNavigation(req({ pathname: '/icon.png' }))).toBe(false);
  });

  it('tracks real routes, including nested and root', () => {
    expect(isTrackableNavigation(req({ pathname: '/' }))).toBe(true);
    expect(isTrackableNavigation(req({ pathname: '/players/12345' }))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/guest-tracking.test.ts`
Expected: FAIL — cannot resolve `./guest-tracking`.

- [ ] **Step 3: Implement**

Create `src/lib/guest-tracking.ts`:

```ts
/** The NextRequest fields the predicate needs. Structural so tests need no server. */
export type TrackableRequest = {
  method: string;
  headers: { get(name: string): string | null };
  nextUrl: { pathname: string };
};

/** Is this request a real guest page view worth logging?
 *
 *  App Router client navigations arrive here as RSC GETs, so in-app link clicks count.
 *  But the router also PREFETCHES routes the user may never open — counting those would
 *  inflate every number on the activity card, so they are dropped. */
export function isTrackableNavigation(req: TrackableRequest): boolean {
  if (req.method !== 'GET') return false;

  if (req.headers.get('next-router-prefetch')) return false;
  const purpose = req.headers.get('purpose') ?? req.headers.get('x-purpose');
  if (purpose?.toLowerCase() === 'prefetch') return false;

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/')) return false;
  // /favicon.ico, /icon.png, … — assets, not pages. App routes never end in an extension.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;

  return true;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/guest-tracking.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/guest-tracking.ts src/lib/guest-tracking.test.ts
git commit -m "feat(guest): predicate for trackable guest navigations

Separates real page views from router prefetches, api calls and asset
requests, so guest view counts reflect pages a human actually opened."
```

---

### Task 3: `guest_events` table and migration

**Files:**
- Modify: `src/db/schema.ts`
- Create (generated): `drizzle/0012_guest_events.sql` + journal entry

**Interfaces:**
- Consumes: nothing.
- Produces: `guestEvents` table export, re-exported from `@/db` (`src/db/index.ts` already does `export * from './schema'`). Columns: `id`, `occurredAt: Date`, `sessionId: string`, `event: string`, `path: string | null`.

- [ ] **Step 1: Add the table to the schema**

Append to the end of `src/db/schema.ts`:

```ts
// One row per guest page view (plus one per guest login). Anonymous by design: session_id
// is the guest token's random jti, so the owner can see HOW MANY distinct sessions use the
// shared password — a jump means it spread further than it was handed out — with no way to
// tell who anyone is. No IP, no user-agent, no query strings.
export const guestEvents = pgTable('guest_events', {
  id: serial('id').primaryKey(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  sessionId: text('session_id').notNull(), // jti, or 'unknown' for pre-jti guest tokens
  event: text('event').notNull(),          // 'login' | 'pageview'
  path: text('path'),                      // pathname only; null for 'login'
}, (t) => [
  index('idx_guest_events_occurred').on(t.occurredAt.desc()),
]);
```

No new imports are needed — `pgTable`, `serial`, `text`, `timestamp`, and `index` are all already imported at the top of the file.

- [ ] **Step 2: Generate the migration**

Run: `npx drizzle-kit generate --name guest_events`
Expected: creates `drizzle/0012_guest_events.sql` containing `CREATE TABLE "guest_events"` and `CREATE INDEX "idx_guest_events_occurred"`, and appends an entry to `drizzle/meta/_journal.json`.

- [ ] **Step 3: Inspect the generated SQL**

Read `drizzle/0012_guest_events.sql`. Confirm it only CREATEs the new table and index — if it contains any `DROP` or `ALTER` against an existing table, **stop and report**: that means the schema file has drifted from the deployed database, and applying it would be destructive.

- [ ] **Step 4: Apply the migration**

Run: `npx drizzle-kit migrate`
Expected: applies `0012_guest_events` against the Neon database in `.env.local`. Verify with:

```bash
node -e "const {neon}=require('@neondatabase/serverless');require('dotenv').config({path:'.env.local'});neon(process.env.DATABASE_URL)('select count(*) from guest_events').then(r=>console.log('guest_events ok',r))"
```
Expected: `guest_events ok [ { count: '0' } ]`.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(db): guest_events table

Anonymous guest page-view log: random per-login session id, event kind, path.
No IP, user-agent or query strings by design."
```

---

### Task 4: DB access for guest events

**Files:**
- Create: `src/queries/guest-events.ts`

**Interfaces:**
- Consumes: `guestEvents` from Task 3.
- Produces:
  - `type GuestEventInput = { sessionId: string; event: 'login' | 'pageview'; path: string | null }`
  - `recordGuestEvent(input: GuestEventInput): Promise<void>` — used by Tasks 5 and 6.
  - `type GuestEventRow = { occurredAt: Date; sessionId: string; event: string; path: string | null }`
  - `fetchGuestEvents(since: Date): Promise<GuestEventRow[]>` — used by Task 8.

There is no test for this task: the repo has no DB test harness (`vitest.config.ts` points `DATABASE_URL` at a stub and no test imports `@/db`), and this file deliberately contains no logic to test. All logic lives in Task 7's pure function.

- [ ] **Step 1: Implement**

Create `src/queries/guest-events.ts`:

```ts
import { db, guestEvents } from '@/db';
import { gte, desc } from 'drizzle-orm';

export type GuestEventInput = {
  sessionId: string;
  event: 'login' | 'pageview';
  path: string | null;
};

export type GuestEventRow = {
  occurredAt: Date;
  sessionId: string;
  event: string;
  path: string | null;
};

/** Append one anonymous guest event. Callers treat this as best-effort — see the
 *  proxy and login action, which never let a logging failure affect the user. */
export async function recordGuestEvent(input: GuestEventInput): Promise<void> {
  await db.insert(guestEvents).values({
    sessionId: input.sessionId,
    event: input.event,
    path: input.path,
  });
}

/** Raw events since `since`, newest first. Aggregation lives in
 *  src/lib/guest-activity.ts so it can be unit-tested without a database. */
export async function fetchGuestEvents(since: Date): Promise<GuestEventRow[]> {
  return db
    .select({
      occurredAt: guestEvents.occurredAt,
      sessionId: guestEvents.sessionId,
      event: guestEvents.event,
      path: guestEvents.path,
    })
    .from(guestEvents)
    .where(gte(guestEvents.occurredAt, since))
    .orderBy(desc(guestEvents.occurredAt));
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (This is the whole check for this task — the file has no behavior of its own.)

- [ ] **Step 3: Commit**

```bash
git add src/queries/guest-events.ts
git commit -m "feat(guest): read/write access for guest_events

Thin SQL only — aggregation is kept out so it can be unit-tested."
```

---

### Task 5: Capture page views in the proxy

**Files:**
- Modify: `src/proxy.ts`

**Interfaces:**
- Consumes: `verifySession` (Task 1), `isTrackableNavigation` (Task 2), `recordGuestEvent` (Task 4).
- Produces: no new exports.

**Next 16 specifics — verified against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`:**
- The proxy **defaults to the Node.js runtime**, and setting the `runtime` config option there throws. So importing `@/db` here is fine.
- That same doc warns the proxy "is not intended for slow data fetching" and documents `event.waitUntil()` for background work, showing an analytics beacon as the example. Use `waitUntil` — do **not** await the insert inline.
- The proxy function receives `(req: NextRequest, event: NextFetchEvent)`.

- [ ] **Step 1: Implement**

Replace the entire contents of `src/proxy.ts` with:

```ts
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';
import { isTrackableNavigation } from '@/lib/guest-tracking';
import { recordGuestEvent } from '@/queries/guest-events';

// Guests are redirected off these page trees (UX layer only — the server actions
// behind them are independently guarded by requireOwner()).
const OWNER_PATHS = ['/settings', '/census', '/scorecard'];

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (session?.role === 'owner') return NextResponse.next();
  if (session?.role === 'guest') {
    const { pathname } = req.nextUrl;
    if (OWNER_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (isTrackableNavigation(req)) {
      // Fire-and-forget. waitUntil keeps the write off the response path (the Next 16
      // proxy docs sanction exactly this beacon pattern), and the swallowed rejection
      // means a DB hiccup can never break a guest's browsing.
      event.waitUntil(
        recordGuestEvent({
          sessionId: session.sessionId ?? 'unknown',
          event: 'pageview',
          path: pathname, // pathname only — query strings are deliberately not stored
        }).catch(() => {}),
      );
    }
    return NextResponse.next();
  }
  const login = new URL('/login', req.url);
  return NextResponse.redirect(login);
}

export const config = {
  // everything except /login, Next internals, and static assets
  matcher: ['/((?!login(?:/|$)|api/cron(?:/|$)|_next/static|_next/image|favicon.ico).*)'],
};
```

Note the owner path stays a single early `return` — owner requests do no extra work at all.

- [ ] **Step 2: Verify it compiles and the suite still passes**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all tests pass.

- [ ] **Step 3: Verify the build accepts the proxy**

Run: `npm run build`
Expected: build succeeds. This is the real check that `@/db` is importable from the proxy on this Next version — if the build complains about the proxy's runtime or an unsupported import, **stop and report** rather than working around it.

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts
git commit -m "feat(guest): log guest page views from the proxy

Writes one guest_events row per real navigation via event.waitUntil, so the
insert never sits on the response path and never breaks browsing on failure."
```

---

### Task 6: Capture the login event

**Files:**
- Modify: `src/app/login/actions.ts`

**Interfaces:**
- Consumes: `verifySession` (Task 1), `recordGuestEvent` (Task 4).
- Produces: no new exports.

- [ ] **Step 1: Implement**

In `src/app/login/actions.ts`, extend the import from `@/lib/auth` to include `verifySession`:

```ts
import { resolvePassword, createSessionToken, verifySession, SESSION_COOKIE } from '@/lib/auth';
import { recordGuestEvent } from '@/queries/guest-events';
```

Then insert this block immediately after the `try { token = await createSessionToken(role); } catch { ... }` block and **before** the `cookies().set(...)` call:

```ts
  if (role === 'guest') {
    // Read the id back off the freshly minted token so the login row shares the session
    // id its page views will carry. Best-effort: never block a login on logging.
    try {
      const session = await verifySession(token);
      await recordGuestEvent({ sessionId: session?.sessionId ?? 'unknown', event: 'login', path: null });
    } catch {
      // ignored on purpose
    }
  }
```

This must sit before the trailing `redirect('/slovenia')`, which throws by design in Next's App Router and would skip anything after it.

- [ ] **Step 2: Verify it compiles and the suite still passes**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/login/actions.ts
git commit -m "feat(guest): record a login event per guest sign-in

Shares the token's session id so logins and page views line up."
```

---

### Task 7: Summarize events into the card's numbers

**Files:**
- Create: `src/lib/guest-activity.ts`
- Test: `src/lib/guest-activity.test.ts`

**Interfaces:**
- Consumes: `GuestEventRow` (Task 4) — re-declared structurally here so this pure module never imports the DB layer.
- Produces:
  - `type GuestActivity = { totalViews: number; distinctSessions: number; logins: number; lastSeenAt: Date | null; perDay: { day: string; views: number; sessions: number }[]; topPaths: { path: string; views: number }[] }`
  - `summarizeGuestEvents(rows: SummarizableEvent[], opts: { days: number; now: Date }): GuestActivity` — used by Task 8.

- [ ] **Step 1: Write the failing test**

Create `src/lib/guest-activity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { summarizeGuestEvents } from './guest-activity';

const NOW = new Date('2026-08-06T12:00:00Z');

function view(day: string, sessionId: string, path = '/slovenia', time = '09:00:00') {
  return { occurredAt: new Date(`${day}T${time}Z`), sessionId, event: 'pageview', path };
}

describe('summarizeGuestEvents', () => {
  it('returns an empty summary with a zero-filled window for no rows', () => {
    const s = summarizeGuestEvents([], { days: 30, now: NOW });
    expect(s.totalViews).toBe(0);
    expect(s.distinctSessions).toBe(0);
    expect(s.logins).toBe(0);
    expect(s.lastSeenAt).toBe(null);
    expect(s.topPaths).toEqual([]);
    expect(s.perDay).toHaveLength(30);
    expect(s.perDay.every((d) => d.views === 0 && d.sessions === 0)).toBe(true);
  });

  it('counts views and distinct sessions', () => {
    const s = summarizeGuestEvents(
      [
        view('2026-08-06', 'a'),
        view('2026-08-06', 'a', '/world'),
        view('2026-08-05', 'b'),
      ],
      { days: 30, now: NOW },
    );
    expect(s.totalViews).toBe(3);
    expect(s.distinctSessions).toBe(2);
  });

  it('excludes login rows from the view count but counts them separately', () => {
    const s = summarizeGuestEvents(
      [
        { occurredAt: new Date('2026-08-06T08:00:00Z'), sessionId: 'a', event: 'login', path: null },
        view('2026-08-06', 'a'),
      ],
      { days: 30, now: NOW },
    );
    expect(s.totalViews).toBe(1);
    expect(s.logins).toBe(1);
    expect(s.distinctSessions).toBe(1);
  });

  it('buckets per day in UTC, oldest first, with zero days kept', () => {
    const s = summarizeGuestEvents(
      [view('2026-08-06', 'a'), view('2026-08-06', 'b'), view('2026-08-04', 'c')],
      { days: 3, now: NOW },
    );
    expect(s.perDay).toEqual([
      { day: '2026-08-04', views: 1, sessions: 1 },
      { day: '2026-08-05', views: 0, sessions: 0 },
      { day: '2026-08-06', views: 2, sessions: 2 },
    ]);
  });

  it('ranks top paths by views', () => {
    const s = summarizeGuestEvents(
      [
        view('2026-08-06', 'a', '/world'),
        view('2026-08-06', 'b', '/world'),
        view('2026-08-06', 'c', '/slovenia'),
      ],
      { days: 30, now: NOW },
    );
    expect(s.topPaths).toEqual([
      { path: '/world', views: 2 },
      { path: '/slovenia', views: 1 },
    ]);
  });

  it('caps top paths at ten', () => {
    const rows = Array.from({ length: 15 }, (_, i) => view('2026-08-06', 's', `/p${i}`));
    expect(summarizeGuestEvents(rows, { days: 30, now: NOW }).topPaths).toHaveLength(10);
  });

  it('reports the most recent activity, including a login', () => {
    const s = summarizeGuestEvents(
      [
        view('2026-08-05', 'a'),
        { occurredAt: new Date('2026-08-06T11:00:00Z'), sessionId: 'a', event: 'login', path: null },
      ],
      { days: 30, now: NOW },
    );
    expect(s.lastSeenAt?.toISOString()).toBe('2026-08-06T11:00:00.000Z');
  });

  it('ignores rows older than the window when bucketing', () => {
    const s = summarizeGuestEvents(
      [view('2026-08-06', 'a'), view('2026-01-01', 'old')],
      { days: 3, now: NOW },
    );
    expect(s.perDay).toHaveLength(3);
    expect(s.perDay.reduce((n, d) => n + d.views, 0)).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/guest-activity.test.ts`
Expected: FAIL — cannot resolve `./guest-activity`.

- [ ] **Step 3: Implement**

Create `src/lib/guest-activity.ts`:

```ts
/** The event shape this module needs. Declared structurally so the pure summary never
 *  imports the DB layer — that is what keeps it testable without a database. */
export type SummarizableEvent = {
  occurredAt: Date;
  sessionId: string;
  event: string;
  path: string | null;
};

export type GuestActivity = {
  totalViews: number;
  /** Headline number: distinct anonymous sessions. A jump past the handful of people the
   *  password was handed to is the signal that it has spread — rotate it on /settings. */
  distinctSessions: number;
  logins: number;
  lastSeenAt: Date | null;
  perDay: { day: string; views: number; sessions: number }[];
  topPaths: { path: string; views: number }[];
};

const DAY_MS = 86_400_000;
const TOP_PATHS = 10;

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Aggregate raw guest events into everything the settings card displays.
 *  Days bucket by UTC, matching the rest of the project. */
export function summarizeGuestEvents(
  rows: SummarizableEvent[],
  opts: { days: number; now: Date },
): GuestActivity {
  // Seed every day in the window so the bar strip has no gaps, oldest first.
  const perDay = new Map<string, { views: number; sessions: Set<string> }>();
  for (let i = opts.days - 1; i >= 0; i--) {
    perDay.set(utcDay(new Date(opts.now.getTime() - i * DAY_MS)), { views: 0, sessions: new Set() });
  }

  const sessions = new Set<string>();
  const pathViews = new Map<string, number>();
  let totalViews = 0;
  let logins = 0;
  let lastSeenAt: Date | null = null;

  for (const row of rows) {
    if (!lastSeenAt || row.occurredAt > lastSeenAt) lastSeenAt = row.occurredAt;
    if (row.event === 'login') {
      logins++;
      continue;
    }
    if (row.event !== 'pageview') continue;

    totalViews++;
    sessions.add(row.sessionId);
    if (row.path) pathViews.set(row.path, (pathViews.get(row.path) ?? 0) + 1);

    const bucket = perDay.get(utcDay(row.occurredAt));
    if (bucket) {
      bucket.views++;
      bucket.sessions.add(row.sessionId);
    }
  }

  return {
    totalViews,
    distinctSessions: sessions.size,
    logins,
    lastSeenAt,
    perDay: [...perDay].map(([day, v]) => ({ day, views: v.views, sessions: v.sessions.size })),
    topPaths: [...pathViews]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_PATHS)
      .map(([path, views]) => ({ path, views })),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/guest-activity.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/guest-activity.ts src/lib/guest-activity.test.ts
git commit -m "feat(guest): pure summary of guest events

Every number on the activity card is computed here, so all of it is unit
tested without needing a database."
```

---

### Task 8: Guest activity card on /settings

**Files:**
- Create: `src/components/settings/GuestActivityCard.tsx`
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `GuestActivity` + `summarizeGuestEvents` (Task 7), `fetchGuestEvents` (Task 4), `getGuestPassword` (existing, `@/queries/app-config`).
- Produces: `GuestActivityCard` default export taking `{ activity: GuestActivity; days: number }`.

This is a server component — no `'use client'`, no interactivity. Dates are formatted with `formatStartedAt` from `@/lib/format-sync`, which is UTC-explicit and therefore immune to the repo's known locale hydration mismatch. Do **not** use `toLocaleString()` here.

- [ ] **Step 1: Create the card component**

Create `src/components/settings/GuestActivityCard.tsx`:

```tsx
import type { GuestActivity } from '@/lib/guest-activity';
import { formatStartedAt } from '@/lib/format-sync';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
      {hint && <div className="text-xs text-neutral-600">{hint}</div>}
    </div>
  );
}

export default function GuestActivityCard({ activity, days }: { activity: GuestActivity; days: number }) {
  const { totalViews, distinctSessions, logins, lastSeenAt, perDay, topPaths } = activity;
  const peak = Math.max(1, ...perDay.map((d) => d.views));

  if (totalViews === 0 && logins === 0) {
    return <p className="text-sm text-neutral-500">No guest activity yet.</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-8">
        <Stat label={`distinct sessions (${days}d)`} value={String(distinctSessions)} hint="one per guest login" />
        <Stat label={`page views (${days}d)`} value={String(totalViews)} />
        <Stat label={`logins (${days}d)`} value={String(logins)} />
        <Stat label="last seen" value={lastSeenAt ? formatStartedAt(lastSeenAt) : '–'} hint={lastSeenAt ? 'UTC' : undefined} />
      </div>

      <div>
        <div className="text-xs text-neutral-400 mb-1">Views per day</div>
        <div className="flex items-end gap-[2px] h-16">
          {perDay.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.views} views, ${d.sessions} sessions`}
              className="flex-1 min-w-[3px] bg-amber-600/70 rounded-sm"
              style={{ height: `${Math.max(2, Math.round((d.views / peak) * 100))}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-neutral-600 mt-1">
          <span>{perDay[0]?.day}</span>
          <span>{perDay[perDay.length - 1]?.day}</span>
        </div>
      </div>

      {topPaths.length > 0 && (
        <div>
          <div className="text-xs text-neutral-400 mb-1">Most visited pages</div>
          <table className="w-full max-w-md">
            <tbody>
              {topPaths.map((p) => (
                <tr key={p.path} className="border-b border-neutral-900">
                  <td className="py-1 text-neutral-300">{p.path}</td>
                  <td className="py-1 text-right text-neutral-400 tabular-nums">{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the settings page**

In `src/app/settings/page.tsx`, add these imports below the existing `getGuestPassword` import:

```ts
import GuestActivityCard from '@/components/settings/GuestActivityCard';
import { fetchGuestEvents } from '@/queries/guest-events';
import { summarizeGuestEvents } from '@/lib/guest-activity';
```

Add this constant just below `export const maxDuration = 60;`:

```ts
const GUEST_ACTIVITY_DAYS = 30;
```

Inside `SettingsPage`, add **one** new entry to the existing `Promise.all`. The `getGuestPassword()` line already exists — do not duplicate it; it is shown here only to mark the insertion point. Add `guestEventRows` as the last destructured name and the `fetchGuestEvents(...)` call as the last array element, so names and calls stay aligned:

```ts
  const [tracked, log, catalog, lastSeasons, lastPlayers, lastMarket, lastMinutes, lastInference, lastCensusRows, guestPassword, guestEventRows] = await Promise.all([
    // …every existing entry unchanged, through:
    getGuestPassword().catch(() => null),
    // …and one new entry appended:
    fetchGuestEvents(new Date(Date.now() - GUEST_ACTIVITY_DAYS * 86_400_000)).catch(() => []),
  ]);
```

Then compute the summary just below the `censusLastRun` block:

```ts
  const guestActivity = summarizeGuestEvents(guestEventRows, {
    days: GUEST_ACTIVITY_DAYS,
    now: new Date(),
  });
  const showGuestActivity = guestPassword !== null || guestActivity.totalViews > 0 || guestActivity.logins > 0;
```

Finally, add the new card immediately after the existing "Guest access" `<Card>` and before the "Data sync" card:

```tsx
      {showGuestActivity && (
        <Card
          title="Guest activity"
          blurb="Anonymous usage of the shared guest login, last 30 days. Distinct sessions is the one to watch — more than you shared the password with means it has spread; rotate it above."
        >
          <GuestActivityCard activity={guestActivity} days={GUEST_ACTIVITY_DAYS} />
        </Card>
      )}
```

- [ ] **Step 3: Verify types and build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: no type errors, all tests pass, build succeeds.

- [ ] **Step 4: Verify in the running app**

Use the project's `verify` skill (`.claude/skills/verify`) to launch the app, then:
1. Log in as **owner** and open `/settings` — the "Guest activity" card renders (empty state is fine at this point).
2. In a **separate private/incognito window**, log in with the guest password and visit `/slovenia`, `/world`, and one player page.
3. Reload `/settings` as owner — distinct sessions ≥ 1, page views ≥ 3, and the visited paths appear under "Most visited pages".
4. Confirm owner browsing does **not** add rows: note the view count, click around a few owner pages, reload `/settings`, confirm the count is unchanged.

If step 3 shows zero after guest browsing, the likely cause is the proxy insert failing silently — check the dev server console and query the table directly before changing any code.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/GuestActivityCard.tsx src/app/settings/page.tsx
git commit -m "feat(settings): guest activity card

Distinct sessions, page views, logins, a 30-day per-day strip and top pages.
Leads with distinct sessions — the number that reveals a shared-on password."
```

---

### Task 9: Document the feature

**Files:**
- Modify: `CLAUDE.md` (repo root)

- [ ] **Step 1: Add a CLAUDE.md entry**

Insert a new paragraph immediately after the guest-access material in the v2 rework section (keep the file's existing bolded-heading style):

```markdown
**Guest usage tracking shipped 2026-08-06** — anonymous view counting for the shared guest
login. Each guest login mints a random `jti` into its JWT (`verifySession` in `src/lib/auth.ts`
exposes it) which acts as an anonymous session id; `src/proxy.ts` writes one `guest_events` row
per real navigation via `event.waitUntil()` (Next 16 proxy runs on the Node.js runtime and
sanctions this beacon pattern — the write never sits on the response path, and failures are
swallowed so logging can never break browsing). Prefetches, `/api/*` and asset requests are
filtered out by `isTrackableNavigation` (`src/lib/guest-tracking.ts`) — without it, router
prefetches would inflate every count. Read side splits deliberately: `fetchGuestEvents`
(`src/queries/guest-events.ts`) is thin SQL, all aggregation lives in the pure
`summarizeGuestEvents` (`src/lib/guest-activity.ts`) so it is unit-tested without a DB — the
repo has no DB test harness. `/settings` shows a "Guest activity" card leading with **distinct
sessions**, the number that reveals a password shared further than intended (fix: rotate it on
the Guest access card). NO identity data is stored — no IP, no user-agent, no query strings —
and by owner's decision there is no guest-facing notice. Owner traffic is not tracked.
Spec: `docs/superpowers/specs/2026-08-06-guest-usage-tracking-design.md`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: guest usage tracking in CLAUDE.md"
```

---

## Verification Checklist

Run from `v2/` after all tasks:

- [ ] `npm test` — full suite passes
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run build` — production build succeeds (proves the proxy's DB import is valid)
- [ ] `npm run lint` — clean
- [ ] Manual check from Task 8 Step 4 completed: guest browsing produces rows, owner browsing does not
