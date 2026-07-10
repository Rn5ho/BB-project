# BB Scout v2 — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the v2 app (Next.js + Neon + Drizzle + single-user auth), migrate all Supabase data, and ship read-only Slovenia/World tables over the migrated data on a second Vercel project.

**Architecture:** New `v2/` Next.js App Router app beside the existing `web/` (v1 stays live). Neon Postgres accessed only server-side through Drizzle; one `players` table keyed by BB player id, one unified `snapshots` table (light = no skills, full = 12 skills). Auth is a password → signed JWT cookie → middleware. A one-off script migrates Supabase data via its REST API and seeds `seasons` from the BB XML API.

**Tech Stack:** Next.js 16 (App Router, TS), Tailwind 4, Neon serverless Postgres, drizzle-orm + drizzle-kit, jose (session JWT), Vitest, tsx (script runner).

**Spec:** `docs/superpowers/specs/2026-07-10-bb-scout-v2-design.md` (§2, §5, §9 phase 1)

---

## Prerequisites (user does these once, before Task 3)

1. Create a free Neon project at https://console.neon.tech → copy the **pooled connection string** (`postgresql://...-pooler...neon.tech/neondb?sslmode=require`).
2. Have on hand from `web/.env.local` (already exists): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BB_API_USERNAME`, `BB_API_SECURITY_CODE`.
3. Choose an app login password and generate a session secret (`node -e "console.log(crypto.randomBytes(32).toString('hex'))"`).
4. If the Supabase project is paused (likely), restore it from the Supabase dashboard so the migration script can read it.

`v2/.env.local` will hold:

```
DATABASE_URL=postgresql://...neon...
APP_PASSWORD=<chosen password>
APP_SESSION_SECRET=<64 hex chars>
# migration-script only:
SUPABASE_URL=https://zhywajswbpdmhpeqyczc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from web/.env.local>
BB_API_USERNAME=<from web/.env.local>
BB_API_SECURITY_CODE=<from web/.env.local>
```

---

## File Structure

```
v2/
├── package.json / tsconfig.json / next.config.ts / postcss.config.mjs
├── drizzle.config.ts               # drizzle-kit config (reads .env.local)
├── vitest.config.ts
├── .env.local.example
├── drizzle/                        # generated SQL migrations (committed)
├── middleware.ts                   # auth guard
├── scripts/
│   └── migrate/
│       ├── transform.ts            # PURE transforms v1 row → v2 row (unit-tested)
│       ├── supabase.ts             # paginated REST reader
│       ├── seasons.ts              # BB XML API seasons fetch/parse
│       └── index.ts                # orchestrator (tsx scripts/migrate/index.ts)
└── src/
    ├── db/
    │   ├── schema.ts               # all Drizzle tables (spec §5)
    │   └── index.ts                # neon-http client
    ├── lib/
    │   ├── constants.ts            # skill/potential names + BB colors (ported from v1)
    │   ├── domain.ts               # tsp(), skillCapForAge(), currentAge(), season pick
    │   └── auth.ts                 # password check + JWT session sign/verify
    ├── queries/
    │   └── players.ts              # playersWithLatestSnapshot()
    ├── components/
    │   ├── Navbar.tsx
    │   ├── SkillCell.tsx           # colored skill number
    │   └── PlayerTable.tsx         # shared read-only table (Slovenia + World)
    └── app/
        ├── layout.tsx / globals.css
        ├── page.tsx                # redirects to /slovenia
        ├── login/page.tsx + login/actions.ts
        ├── slovenia/page.tsx
        └── world/page.tsx
```

All commands below run from `D:\ClaudeProjects\BB-project\v2` unless noted. Commit after every task; **push after every commit** (Vercel deploys from main; user tests live).

---

### Task 1: Scaffold the v2 app

**Files:** Create `v2/` via create-next-app; add dev tooling.

- [ ] **Step 1: Scaffold** (run from repo root `D:\ClaudeProjects\BB-project`)

```bash
npx create-next-app@latest v2 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

- [ ] **Step 2: Install dependencies**

```bash
cd v2
npm i drizzle-orm @neondatabase/serverless jose
npm i -D drizzle-kit vitest tsx dotenv
```

- [ ] **Step 3: Add vitest config**

Create `v2/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

Add to `v2/package.json` scripts: `"test": "vitest run"`, `"migrate:data": "tsx scripts/migrate/index.ts"`.

- [ ] **Step 4: Create `.env.local.example`** with the exact keys from Prerequisites (values blanked), and create your real `v2/.env.local` (never committed — verify `.gitignore` covers `.env*`).

- [ ] **Step 5: Verify it runs**

Run: `npm run dev` → open http://localhost:3000 → default Next page renders. Run `npm test` → "no test files found" exit 0 (or trivially passes).

- [ ] **Step 6: Commit + push**

```bash
git add v2
git commit -m "feat(v2): scaffold Next.js app with vitest + drizzle deps"
git push
```

---

### Task 2: Domain constants and helpers (TDD)

**Files:**
- Create: `v2/src/lib/constants.ts`, `v2/src/lib/domain.ts`
- Test: `v2/src/lib/domain.test.ts`

- [ ] **Step 1: Port constants.** Copy `web/lib/constants.ts` (v1) verbatim into `v2/src/lib/constants.ts` — it contains `SKILL_LEVELS` (1–20 names), `POTENTIAL_LEVELS` (0–11), `SKILLS` (12 skills with `dbKey`s: jump_shot, jump_range, outside_def, handling, driving, passing, inside_shot, inside_def, rebounding, shot_blocking, stamina, free_throw), `POSITIONS`, `getSkillColor`, `getPotentialColor`, `getSkillBgColor`. No changes needed.

- [ ] **Step 2: Write failing tests** — `v2/src/lib/domain.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { tsp, skillCapForAge, currentAge, pickCurrentSeason } from './domain';

describe('tsp', () => {
  it('sums all 12 skills', () => {
    expect(tsp({ jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8, inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3 })).toBe(98);
  });
  it('returns null when any skill is missing (light snapshot)', () => {
    expect(tsp({ jump_shot: 11 })).toBeNull();
  });
});

describe('skillCapForAge', () => {
  // Domain rules (spec §6): 18yo skills are 1–7, 19yo are 1–10, 20+ uncapped (20 max scale)
  it('caps 18yo at 7', () => expect(skillCapForAge(18)).toBe(7));
  it('caps 19yo at 10', () => expect(skillCapForAge(19)).toBe(10));
  it('caps 20yo and up at 20', () => {
    expect(skillCapForAge(20)).toBe(20);
    expect(skillCapForAge(35)).toBe(20);
  });
});

describe('currentAge', () => {
  // age at capture + seasons elapsed since capture
  it('ages a player by elapsed seasons', () => expect(currentAge(19, 68, 70)).toBe(21));
  it('same season → same age', () => expect(currentAge(20, 70, 70)).toBe(20));
  it('returns null without snapshot season', () => expect(currentAge(20, null, 70)).toBeNull());
});

describe('pickCurrentSeason', () => {
  const seasons = [
    { id: 69, start: new Date('2026-01-10'), finish: new Date('2026-04-10') },
    { id: 70, start: new Date('2026-04-11'), finish: new Date('2026-07-30') },
  ];
  it('picks the season containing now', () => {
    expect(pickCurrentSeason(seasons, new Date('2026-07-10'))).toBe(70);
  });
  it('falls back to highest id when between seasons', () => {
    expect(pickCurrentSeason(seasons, new Date('2026-08-15'))).toBe(70);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test` → FAIL: `./domain` not found.

- [ ] **Step 4: Implement** — `v2/src/lib/domain.ts`:

```ts
import { SKILLS } from './constants';

/** Sum of all 12 skills; null if any is missing (light snapshot). */
export function tsp(skills: Partial<Record<(typeof SKILLS)[number]['dbKey'], number | null>>): number | null {
  let sum = 0;
  for (const { dbKey } of SKILLS) {
    const v = skills[dbKey];
    if (v == null) return null;
    sum += v;
  }
  return sum;
}

/** BB rule: 18yo skills are 1–7, 19yo 1–10, everyone else up to the 20-point scale max. */
export function skillCapForAge(age: number): number {
  if (age <= 18) return 7;
  if (age === 19) return 10;
  return 20;
}

/** Players age +1 per season rollover: age at capture + seasons elapsed. */
export function currentAge(snapshotAge: number | null, snapshotSeason: number | null, currentSeason: number): number | null {
  if (snapshotAge == null || snapshotSeason == null) return null;
  return snapshotAge + (currentSeason - snapshotSeason);
}

export interface SeasonRow { id: number; start: Date; finish: Date }

/** Season containing `now`, else the highest-id season (between-season gap). */
export function pickCurrentSeason(seasons: SeasonRow[], now: Date): number {
  const active = seasons.find((s) => now >= s.start && now <= s.finish);
  if (active) return active.id;
  return Math.max(...seasons.map((s) => s.id));
}
```

- [ ] **Step 5: Run tests** → all PASS.

- [ ] **Step 6: Commit + push**

```bash
git add src/lib
git commit -m "feat(v2): domain constants and helpers (tsp, age caps, season aging)"
git push
```

---

### Task 3: Drizzle schema + initial migration to Neon

**Files:**
- Create: `v2/src/db/schema.ts`, `v2/src/db/index.ts`, `v2/drizzle.config.ts`
- Generated: `v2/drizzle/0000_*.sql` (committed)

- [ ] **Step 1: Write the schema** — `v2/src/db/schema.ts` (implements spec §5 exactly):

```ts
import {
  pgTable, serial, integer, bigint, text, boolean, timestamp, jsonb,
  index, uniqueIndex, primaryKey,
} from 'drizzle-orm/pg-core';

export const SNAPSHOT_SOURCES = ['api', 'market', 'census', 'manual', 'extension'] as const;

export const players = pgTable('players', {
  bbPlayerId: integer('bb_player_id').primaryKey(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  countryId: integer('country_id'),
  nationality: text('nationality'),
  heightCm: integer('height_cm'),
  bestPosition: text('best_position'),
  isUtopian: boolean('is_utopian').notNull().default(false),
  seasonDrafted: integer('season_drafted'),
  draftPick: integer('draft_pick'),
  ownerTeamId: integer('owner_team_id'),
  ownerTeamName: text('owner_team_name'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  archived: boolean('archived').notNull().default(false),
}, (t) => [
  index('idx_players_country').on(t.countryId),
  index('idx_players_nationality').on(t.nationality),
]);

export const snapshots = pgTable('snapshots', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  source: text('source', { enum: SNAPSHOT_SOURCES }).notNull(),
  season: integer('season'),
  age: integer('age'),
  dmi: bigint('dmi', { mode: 'number' }),
  gameShape: integer('game_shape'),
  salary: integer('salary'),
  potential: integer('potential'),
  experience: integer('experience'),
  // 12 skills — null on light snapshots
  jumpShot: integer('jump_shot'),
  jumpRange: integer('jump_range'),
  outsideDef: integer('outside_def'),
  handling: integer('handling'),
  driving: integer('driving'),
  passing: integer('passing'),
  insideShot: integer('inside_shot'),
  insideDef: integer('inside_def'),
  rebounding: integer('rebounding'),
  shotBlocking: integer('shot_blocking'),
  stamina: integer('stamina'),
  freeThrow: integer('free_throw'),
  tsp: integer('tsp'),
  ownerTeamId: integer('owner_team_id'),
  ownerTeamName: text('owner_team_name'),
  // market-sweep fields
  startingPrice: bigint('starting_price', { mode: 'number' }),
  auctionEndsAt: timestamp('auction_ends_at', { withTimezone: true }),
  isRookieListing: boolean('is_rookie_listing'),
}, (t) => [
  index('idx_snapshots_player_date').on(t.playerId, t.capturedAt.desc()),
  index('idx_snapshots_captured_at').on(t.capturedAt.desc()),
]);

export const ntSquad = pgTable('nt_squad', {
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  season: integer('season').notNull(),
  role: text('role'),
  note: text('note'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.playerId, t.season] })]);

export const trackedCountries = pgTable('tracked_countries', {
  id: serial('id').primaryKey(),
  countryId: integer('country_id'),
  name: text('name').notNull(),
  starred: boolean('starred').notNull().default(false),
  purpose: text('purpose'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uq_tracked_countries_name').on(t.name)]);

export const seasons = pgTable('seasons', {
  id: integer('id').primaryKey(),
  start: timestamp('start', { withTimezone: true }).notNull(),
  finish: timestamp('finish', { withTimezone: true }).notNull(),
});

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_notes_player').on(t.playerId)]);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uq_tags_player_tag').on(t.playerId, t.tag)]);

export const censusRuns = pgTable('census_runs', {
  id: serial('id').primaryKey(),
  status: text('status', { enum: ['running', 'finished', 'aborted', 'failed'] }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  totals: jsonb('totals'),
});

export const censusItems = pgTable('census_items', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').notNull().references(() => censusRuns.id, { onDelete: 'cascade' }),
  playerId: integer('player_id').notNull(),
  status: text('status', { enum: ['pending', 'captured', 'failed', 'skipped'] }).notNull(),
  error: text('error'),
}, (t) => [index('idx_census_items_run').on(t.runId)]);

export const syncLog = pgTable('sync_log', {
  id: serial('id').primaryKey(),
  jobType: text('job_type').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  ok: boolean('ok'),
  counts: jsonb('counts'),
  error: text('error'),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 2: Drizzle config** — `v2/drizzle.config.ts`:

```ts
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 3: DB client** — `v2/src/db/index.ts`:

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
export * from './schema';
```

- [ ] **Step 4: Generate + apply migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: `drizzle/0000_*.sql` created; migrate reports success against Neon.

- [ ] **Step 5: Verify tables exist**

```bash
npx tsx -e "import {neon} from '@neondatabase/serverless'; import {config} from 'dotenv'; config({path:'.env.local'}); neon(process.env.DATABASE_URL!)\`select table_name from information_schema.tables where table_schema='public' order by 1\`.then(r => console.log(r.map(x => x.table_name).join(', ')))"
```

Expected: `census_items, census_runs, notes, nt_squad, players, seasons, settings, snapshots, sync_log, tags, tracked_countries` (plus drizzle's migrations table).

- [ ] **Step 6: Commit + push**

```bash
git add src/db drizzle.config.ts drizzle
git commit -m "feat(v2): Neon schema via Drizzle with initial migration"
git push
```

---

### Task 4: Auth (TDD)

**Files:**
- Create: `v2/src/lib/auth.ts`, `v2/middleware.ts`, `v2/src/app/login/page.tsx`, `v2/src/app/login/actions.ts`
- Test: `v2/src/lib/auth.test.ts`

- [ ] **Step 1: Failing tests** — `v2/src/lib/auth.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createSessionToken, verifySessionToken, checkPassword } from './auth';

beforeAll(() => {
  process.env.APP_SESSION_SECRET = 'a'.repeat(64);
  process.env.APP_PASSWORD = 'correct-horse';
});

describe('session tokens', () => {
  it('round-trips a signed token', async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });
  it('rejects a tampered token', async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token.slice(0, -2) + 'xx')).toBe(false);
  });
  it('rejects garbage', async () => {
    expect(await verifySessionToken('not-a-jwt')).toBe(false);
  });
});

describe('checkPassword', () => {
  it('accepts the correct password', () => expect(checkPassword('correct-horse')).toBe(true));
  it('rejects a wrong password', () => expect(checkPassword('wrong')).toBe(false));
  it('rejects empty input', () => expect(checkPassword('')).toBe(false));
});
```

- [ ] **Step 2: Run** `npm test` → FAIL (`./auth` not found).

- [ ] **Step 3: Implement** — `v2/src/lib/auth.ts` (edge-safe: jose + Web Crypto only, no node:crypto — middleware runs on the edge runtime):

```ts
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'bbscout_session';

function secret(): Uint8Array {
  const s = process.env.APP_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('APP_SESSION_SECRET missing or too short');
  return new TextEncoder().encode(s);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

/** Constant-time-ish compare without node:crypto (single-user hobby app). */
export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? '';
  if (!expected || input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
```

- [ ] **Step 4: Run** `npm test` → PASS.

- [ ] **Step 5: Middleware** — `v2/middleware.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token))) return NextResponse.next();
  const login = new URL('/login', req.url);
  return NextResponse.redirect(login);
}

export const config = {
  // everything except /login, Next internals, and static assets
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 6: Login action** — `v2/src/app/login/actions.ts`:

```ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) return { error: 'Wrong password' };
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  redirect('/slovenia');
}
```

- [ ] **Step 7: Login page** — `v2/src/app/login/page.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <form action={formAction} className="flex flex-col gap-3 w-64">
        <h1 className="text-xl font-semibold text-center">BB Scout</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
        <button disabled={pending} className="rounded bg-amber-600 py-2 font-medium disabled:opacity-50">
          {pending ? '…' : 'Enter'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 8: Manual verify**

Run: `npm run dev` → visiting `/` redirects to `/login`; wrong password shows error; correct password redirects to `/slovenia` (404 for now — fine, page comes in Task 8).

- [ ] **Step 9: Commit + push**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts middleware.ts src/app/login
git commit -m "feat(v2): single-user password auth with JWT session cookie"
git push
```

---

### Task 5: Migration transforms (TDD, pure functions)

**Files:**
- Create: `v2/scripts/migrate/transform.ts`
- Test: `v2/scripts/migrate/transform.test.ts`

v1 source shapes (from `supabase/schema.sql` + `web/lib/types.ts`): `players` = `{ id, bb_player_id, name, nationality, height (TEXT like "196 cm" or "6'5\" / 196 cm"), position, is_nt_player, created_at }`; `skill_snapshots` = `{ id, player_id (FK → v1 players.id!), captured_at, source ('extension'|'manual'|'api'), bb_season, age, salary, experience, skill_points, game_shape, potential, dmi, 12 skill cols, owner_team_name, owner_team_id }`.

**Key mapping decisions:**
- v2 `players.bb_player_id` is the PK; v1 snapshots reference the v1 serial `players.id`, so the script builds a `v1Id → bb_player_id` map first.
- `height` text → `height_cm` int (parse the number before "cm").
- `country_id` = 66 when nationality is `Slovenia`, else null (Phase 2 API sync backfills the rest).
- `tsp` = v1 `skill_points` if set, else computed via `tsp()` when all 12 skills present, else null.
- v1 `is_nt_player=true` + nationality `Slovenia` → one `nt_squad` row for the current season.
- v1 `is_nt_player=true` + other nationality (v1's auto-flagged opponent NT players — known-unreliable) → a `tags` row `legacy-opp-nt` instead of squad membership.

- [ ] **Step 1: Failing tests** — `v2/scripts/migrate/transform.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { heightToCm, transformPlayer, transformSnapshot } from './transform';

describe('heightToCm', () => {
  it('parses "196 cm"', () => expect(heightToCm('196 cm')).toBe(196));
  it('parses combined form 6\'5" / 196 cm', () => expect(heightToCm(`6'5" / 196 cm`)).toBe(196));
  it('null-safe', () => expect(heightToCm(null)).toBeNull());
  it('garbage → null', () => expect(heightToCm('tall')).toBeNull());
});

const v1Player = {
  id: 42, bb_player_id: 55158715, name: 'Milan Peterec', nationality: 'Slovenia',
  height: '196 cm', position: 'PG', is_nt_player: true, created_at: '2026-02-01T00:00:00Z',
};

describe('transformPlayer', () => {
  const out = transformPlayer(v1Player);
  it('keys by bb_player_id', () => expect(out.bbPlayerId).toBe(55158715));
  it('maps Slovenia → countryId 66', () => expect(out.countryId).toBe(66));
  it('parses height', () => expect(out.heightCm).toBe(196));
  it('non-Slovenia has null countryId', () =>
    expect(transformPlayer({ ...v1Player, nationality: 'Ukraine' }).countryId).toBeNull());
  it('preserves first_seen from created_at', () =>
    expect(out.firstSeenAt.toISOString()).toBe('2026-02-01T00:00:00.000Z'));
});

const fullSkills = {
  jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8,
  inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3,
};

describe('transformSnapshot', () => {
  const idMap = new Map([[42, 55158715]]);
  const base = {
    id: 1, player_id: 42, captured_by: null, captured_at: '2026-04-01T10:00:00Z',
    source: 'extension' as const, bb_season: 69, age: 20, salary: 12346, experience: 3,
    skill_points: null, game_shape: 8, potential: 8, dmi: 157700,
    owner_team_name: 'Team X', owner_team_id: 999, ...fullSkills,
  };
  it('resolves the FK via the id map', () => expect(transformSnapshot(base, idMap)!.playerId).toBe(55158715));
  it('computes tsp when skill_points is null but skills are full', () =>
    expect(transformSnapshot(base, idMap)!.tsp).toBe(98));
  it('prefers stored skill_points', () =>
    expect(transformSnapshot({ ...base, skill_points: 97 }, idMap)!.tsp).toBe(97));
  it('light snapshot (no skills) → null tsp, null skills kept', () => {
    const light = transformSnapshot({ ...base, ...Object.fromEntries(Object.keys(fullSkills).map(k => [k, null])) }, idMap)!;
    expect(light.tsp).toBeNull();
    expect(light.jumpShot).toBeNull();
  });
  it('drops snapshots whose player is unknown', () =>
    expect(transformSnapshot({ ...base, player_id: 777 }, idMap)).toBeNull());
});
```

- [ ] **Step 2: Run** `npm test` → FAIL (`./transform` not found).

- [ ] **Step 3: Implement** — `v2/scripts/migrate/transform.ts`:

```ts
import { tsp } from '../../src/lib/domain';

export interface V1Player {
  id: number; bb_player_id: number; name: string; nationality: string | null;
  height: string | null; position: string | null; is_nt_player: boolean; created_at: string;
}

export interface V1Snapshot {
  id: number; player_id: number; captured_by: string | null; captured_at: string;
  source: 'extension' | 'manual' | 'api'; bb_season: number | null;
  age: number | null; salary: number | null; experience: number | null;
  skill_points: number | null; game_shape: number | null; potential: number | null; dmi: number | null;
  jump_shot: number | null; jump_range: number | null; outside_def: number | null;
  handling: number | null; driving: number | null; passing: number | null;
  inside_shot: number | null; inside_def: number | null; rebounding: number | null;
  shot_blocking: number | null; stamina: number | null; free_throw: number | null;
  owner_team_name: string | null; owner_team_id: number | null;
}

export function heightToCm(height: string | null): number | null {
  if (!height) return null;
  const m = height.match(/(\d{2,3})\s*cm/);
  return m ? Number(m[1]) : null;
}

export function transformPlayer(p: V1Player) {
  return {
    bbPlayerId: p.bb_player_id,
    name: p.name,
    countryId: p.nationality === 'Slovenia' ? 66 : null,
    nationality: p.nationality,
    heightCm: heightToCm(p.height),
    bestPosition: p.position,
    firstSeenAt: new Date(p.created_at),
  };
}

export function transformSnapshot(s: V1Snapshot, v1IdToBbId: Map<number, number>) {
  const bbId = v1IdToBbId.get(s.player_id);
  if (!bbId) return null;
  const skills = {
    jump_shot: s.jump_shot, jump_range: s.jump_range, outside_def: s.outside_def,
    handling: s.handling, driving: s.driving, passing: s.passing,
    inside_shot: s.inside_shot, inside_def: s.inside_def, rebounding: s.rebounding,
    shot_blocking: s.shot_blocking, stamina: s.stamina, free_throw: s.free_throw,
  };
  return {
    playerId: bbId,
    capturedAt: new Date(s.captured_at),
    source: s.source,
    season: s.bb_season,
    age: s.age,
    dmi: s.dmi,
    gameShape: s.game_shape,
    salary: s.salary,
    potential: s.potential,
    experience: s.experience,
    jumpShot: s.jump_shot, jumpRange: s.jump_range, outsideDef: s.outside_def,
    handling: s.handling, driving: s.driving, passing: s.passing,
    insideShot: s.inside_shot, insideDef: s.inside_def, rebounding: s.rebounding,
    shotBlocking: s.shot_blocking, stamina: s.stamina, freeThrow: s.free_throw,
    tsp: s.skill_points ?? tsp(skills),
    ownerTeamId: s.owner_team_id,
    ownerTeamName: s.owner_team_name,
  };
}
```

- [ ] **Step 4: Run** `npm test` → PASS.

- [ ] **Step 5: Commit + push**

```bash
git add scripts/migrate
git commit -m "feat(v2): pure v1→v2 migration transforms with tests"
git push
```

---

### Task 6: Migration script — readers and orchestrator

**Files:**
- Create: `v2/scripts/migrate/supabase.ts`, `v2/scripts/migrate/seasons.ts`, `v2/scripts/migrate/index.ts`

- [ ] **Step 1: Supabase REST reader** — `v2/scripts/migrate/supabase.ts`:

```ts
const PAGE = 1000;

/** Read an entire Supabase table via PostgREST, 1000 rows/page. */
export async function readTable<T>(table: string): Promise<T[]> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=*&order=id.asc&limit=${PAGE}&offset=${offset}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`Supabase read ${table} failed: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as T[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}
```

(Note: `settings` has no `id` column — the orchestrator reads it with `order=key.asc` via the `orderBy` param below; add the param: `readTable<T>(table, orderBy = 'id')` and use `order=${orderBy}.asc`.)

- [ ] **Step 2: Seasons fetch** — `v2/scripts/migrate/seasons.ts` (BB XML API, same auth pattern as v1 `web/lib/bbapi.ts`):

```ts
const BASE = 'https://bbapi.buzzerbeater.com';

export async function fetchSeasons(): Promise<{ id: number; start: Date; finish: Date }[]> {
  const login = await fetch(
    `${BASE}/login.aspx?login=${encodeURIComponent(process.env.BB_API_USERNAME!)}&code=${encodeURIComponent(process.env.BB_API_SECURITY_CODE!)}`,
    { redirect: 'manual' },
  );
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('BB API login failed (no cookie)');
  const xml = await (await fetch(`${BASE}/seasons.aspx`, { headers: { Cookie: cookie } })).text();
  await fetch(`${BASE}/logout.aspx`, { headers: { Cookie: cookie } });

  const seasons = [...xml.matchAll(
    /<season id='(\d+)'>\s*<start>([^<]+)<\/start>\s*<finish>([^<]+)<\/finish>/g,
  )].map((m) => ({ id: Number(m[1]), start: new Date(m[2]), finish: new Date(m[3]) }));
  if (seasons.length === 0) throw new Error(`No seasons parsed. XML head: ${xml.slice(0, 300)}`);
  return seasons;
}
```

- [ ] **Step 3: Orchestrator** — `v2/scripts/migrate/index.ts`:

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/db/schema';
import { pickCurrentSeason } from '../../src/lib/domain';
import { readTable } from './supabase';
import { fetchSeasons } from './seasons';
import { transformPlayer, transformSnapshot, V1Player, V1Snapshot } from './transform';

interface V1Note { id: number; player_id: number; content: string; created_at: string }
interface V1Tag { id: number; player_id: number; tag: string }
interface V1Setting { key: string; value: unknown }

async function main() {
  if (!process.argv.includes('--yes')) {
    console.log('DRY RUN (no writes). Re-run with --yes to write. This WIPES v2 data tables first.');
  }
  const write = process.argv.includes('--yes');
  const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

  // 1. Read everything from v1
  const [v1Players, v1Snapshots, v1Notes, v1Tags, v1Settings, bbSeasons] = await Promise.all([
    readTable<V1Player>('players'),
    readTable<V1Snapshot>('skill_snapshots'),
    readTable<V1Note>('player_notes'),
    readTable<V1Tag>('player_tags'),
    readTable<V1Setting>('settings', 'key'),
    fetchSeasons(),
  ]);
  const currentSeason = pickCurrentSeason(bbSeasons, new Date());
  console.log(`v1: ${v1Players.length} players, ${v1Snapshots.length} snapshots, ${v1Notes.length} notes, ${v1Tags.length} tags, ${v1Settings.length} settings. Current BB season: ${currentSeason}`);

  // 2. Transform
  const idMap = new Map(v1Players.map((p) => [p.id, p.bb_player_id]));
  const players = v1Players.map(transformPlayer);
  const snapshots = v1Snapshots.map((s) => transformSnapshot(s, idMap)).filter((s) => s !== null);
  const dropped = v1Snapshots.length - snapshots.length;
  if (dropped > 0) console.warn(`WARNING: dropped ${dropped} snapshots with unknown player FK`);

  const slovenes = new Set(v1Players.filter((p) => p.nationality === 'Slovenia').map((p) => p.bb_player_id));
  const ntFlagged = v1Players.filter((p) => p.is_nt_player);
  const squadRows = ntFlagged.filter((p) => slovenes.has(p.bb_player_id))
    .map((p) => ({ playerId: p.bb_player_id, season: currentSeason, note: 'migrated from v1 is_nt_player' }));
  const legacyOppTags = ntFlagged.filter((p) => !slovenes.has(p.bb_player_id))
    .map((p) => ({ playerId: p.bb_player_id, tag: 'legacy-opp-nt' }));

  const noteRows = v1Notes
    .filter((n) => idMap.has(n.player_id))
    .map((n) => ({ playerId: idMap.get(n.player_id)!, body: n.content, createdAt: new Date(n.created_at) }));
  const tagRows = v1Tags
    .filter((t) => idMap.has(t.player_id))
    .map((t) => ({ playerId: idMap.get(t.player_id)!, tag: t.tag }));

  // Starred countries (v1 Season Opponents preset) → tracked_countries
  const starred = v1Settings.find((s) => /starred/i.test(s.key));
  const starredNames: string[] = Array.isArray(starred?.value) ? (starred!.value as string[]) : [];
  const trackedRows = starredNames.map((name) => ({ name, starred: true, purpose: 'season-opponent (migrated)' }));
  const unknownSettings = v1Settings.filter((s) => s !== starred).map((s) => s.key);
  if (unknownSettings.length) console.log(`Settings keys not migrated (review manually): ${unknownSettings.join(', ')}`);

  console.log(`v2: ${players.length} players, ${snapshots.length} snapshots, ${squadRows.length} nt_squad, ${legacyOppTags.length + tagRows.length} tags, ${noteRows.length} notes, ${bbSeasons.length} seasons, ${trackedRows.length} tracked countries`);
  if (!write) return;

  // 3. Wipe + write (order matters for FKs)
  await db.delete(schema.censusItems); await db.delete(schema.censusRuns);
  await db.delete(schema.ntSquad); await db.delete(schema.notes); await db.delete(schema.tags);
  await db.delete(schema.snapshots); await db.delete(schema.players);
  await db.delete(schema.seasons); await db.delete(schema.trackedCountries);

  const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
  await db.insert(schema.seasons).values(bbSeasons);
  for (const c of chunk(players, 500)) await db.insert(schema.players).values(c);
  for (const c of chunk(snapshots, 500)) await db.insert(schema.snapshots).values(c);
  if (squadRows.length) await db.insert(schema.ntSquad).values(squadRows);
  for (const c of chunk([...tagRows, ...legacyOppTags], 500)) await db.insert(schema.tags).values(c).onConflictDoNothing();
  for (const c of chunk(noteRows, 500)) await db.insert(schema.notes).values(c);
  if (trackedRows.length) await db.insert(schema.trackedCountries).values(trackedRows).onConflictDoNothing();

  // 4. Verify
  const count = async (t: string) => Number((await db.execute(`select count(*) c from ${t}`)).rows[0].c);
  console.log('Neon counts:', {
    players: await count('players'), snapshots: await count('snapshots'),
    nt_squad: await count('nt_squad'), notes: await count('notes'), tags: await count('tags'),
    seasons: await count('seasons'),
  });
  console.log(`Expect players=${players.length}, snapshots=${snapshots.length}. Mismatch = investigate before proceeding.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Dry run**

Run: `npm run migrate:data`
Expected: v1 counts + v2 planned counts printed, no writes. **Requires the user to have restored the Supabase project if paused.**

- [ ] **Step 5: Real run + verify**

Run: `npm run migrate:data -- --yes`
Expected: Neon counts match planned counts; warnings (dropped snapshots, unmigrated settings keys) reviewed with the user before continuing.

- [ ] **Step 6: Commit + push**

```bash
git add scripts/migrate package.json
git commit -m "feat(v2): Supabase→Neon data migration script (idempotent, verified counts)"
git push
```

---

### Task 7: Player queries

**Files:**
- Create: `v2/src/queries/players.ts`

- [ ] **Step 1: Implement** — `v2/src/queries/players.ts` (DISTINCT ON gets each player's latest snapshot; age filtering happens after season-aging in JS — the dataset is ~1–2k rows, trivial):

```ts
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { currentAge, pickCurrentSeason } from '@/lib/domain';

export interface PlayerListRow {
  bbPlayerId: number;
  name: string;
  nationality: string | null;
  heightCm: number | null;
  bestPosition: string | null;
  // from latest snapshot (any source)
  ageNow: number | null;
  dmi: number | null;
  gameShape: number | null;
  salary: number | null;
  potential: number | null;
  capturedAt: Date | null;
  snapshotSeason: number | null;
  // from latest FULL snapshot (skills present)
  tsp: number | null;
  skills: Record<string, number> | null;
  skillsCapturedAt: Date | null;
  hasFullSkills: boolean;
}

export async function getCurrentSeasonId(): Promise<number> {
  const rows = await db.query.seasons.findMany();
  return pickCurrentSeason(rows, new Date());
}

export async function listPlayers(opts: { nationality?: string; excludeNationality?: string }): Promise<PlayerListRow[]> {
  const where = opts.nationality
    ? sql`where p.nationality = ${opts.nationality}`
    : opts.excludeNationality
      ? sql`where p.nationality is distinct from ${opts.excludeNationality}`
      : sql``;

  const result = await db.execute(sql`
    with latest as (
      select distinct on (player_id) *
      from snapshots order by player_id, captured_at desc
    ),
    latest_full as (
      select distinct on (player_id) *
      from snapshots where jump_shot is not null
      order by player_id, captured_at desc
    )
    select
      p.bb_player_id, p.name, p.nationality, p.height_cm, p.best_position,
      l.age as snap_age, l.season as snap_season, l.dmi, l.game_shape, l.salary, l.potential, l.captured_at,
      f.tsp, f.captured_at as skills_captured_at,
      f.jump_shot, f.jump_range, f.outside_def, f.handling, f.driving, f.passing,
      f.inside_shot, f.inside_def, f.rebounding, f.shot_blocking, f.stamina, f.free_throw
    from players p
    left join latest l on l.player_id = p.bb_player_id
    left join latest_full f on f.player_id = p.bb_player_id
    ${where}
  `);

  const season = await getCurrentSeasonId();
  return (result.rows as Record<string, unknown>[]).map((r) => ({
    bbPlayerId: r.bb_player_id as number,
    name: r.name as string,
    nationality: r.nationality as string | null,
    heightCm: r.height_cm as number | null,
    bestPosition: r.best_position as string | null,
    ageNow: currentAge(r.snap_age as number | null, r.snap_season as number | null, season),
    dmi: r.dmi as number | null,
    gameShape: r.game_shape as number | null,
    salary: r.salary as number | null,
    potential: r.potential as number | null,
    capturedAt: r.captured_at ? new Date(r.captured_at as string) : null,
    snapshotSeason: r.snap_season as number | null,
    tsp: r.tsp as number | null,
    skills: r.jump_shot == null ? null : {
      jump_shot: r.jump_shot as number, jump_range: r.jump_range as number,
      outside_def: r.outside_def as number, handling: r.handling as number,
      driving: r.driving as number, passing: r.passing as number,
      inside_shot: r.inside_shot as number, inside_def: r.inside_def as number,
      rebounding: r.rebounding as number, shot_blocking: r.shot_blocking as number,
      stamina: r.stamina as number, free_throw: r.free_throw as number,
    },
    skillsCapturedAt: r.skills_captured_at ? new Date(r.skills_captured_at as string) : null,
    hasFullSkills: r.jump_shot != null,
  }));
}
```

- [ ] **Step 2: Verify against migrated data**

```bash
npx tsx -e "import {config} from 'dotenv'; config({path:'.env.local'}); import('./src/queries/players').then(async m => { const rows = await m.listPlayers({nationality:'Slovenia'}); console.log(rows.length, 'Slovenian players; first:', rows[0]?.name, rows[0]?.ageNow, rows[0]?.tsp); })"
```

Expected: a plausible count (v1 had ~100+ Slovenian players) with sane age/TSP values.

- [ ] **Step 3: Commit + push**

```bash
git add src/queries
git commit -m "feat(v2): player list query with latest/latest-full snapshot join and season aging"
git push
```

---

### Task 8: App shell + Slovenia + World pages (read-only)

**Files:**
- Create: `v2/src/components/Navbar.tsx`, `v2/src/components/SkillCell.tsx`, `v2/src/components/PlayerTable.tsx`, `v2/src/app/slovenia/page.tsx`, `v2/src/app/world/page.tsx`
- Modify: `v2/src/app/layout.tsx`, `v2/src/app/globals.css`, `v2/src/app/page.tsx`

- [ ] **Step 1: Dark theme.** In `v2/src/app/globals.css`, replace the scaffold body with v1's variables — copy the `:root`/theme block from `web/app/globals.css` (v1) so v2 matches the existing look. Minimum required variables (fallback values if v1 file differs):

```css
@import "tailwindcss";

:root {
  --background: #0a0a0a;
  --card-bg: #171717;
  --accent: #d97706;
  --foreground: #ededed;
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 2: Layout + redirect.** `v2/src/app/layout.tsx`: set metadata title "BB Scout", render `<Navbar />` above `{children}` (skip Navbar on /login — Navbar renders nothing when pathname is /login). `v2/src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
export default function Home() { redirect('/slovenia'); }
```

- [ ] **Step 3: Navbar** — `v2/src/components/Navbar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/slovenia', label: 'Slovenia' },
  { href: '/world', label: 'World' },
];

export default function Navbar() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return (
    <nav className="flex items-center gap-4 px-6 py-3 border-b border-neutral-800">
      <span className="font-bold text-amber-500">BB Scout</span>
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href}
          className={pathname.startsWith(href) ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'}>
          {label}
        </Link>
      ))}
      <span className="ml-auto text-xs text-neutral-600">v2</span>
    </nav>
  );
}
```

- [ ] **Step 4: SkillCell** — `v2/src/components/SkillCell.tsx`:

```tsx
import { getSkillColor } from '@/lib/constants';

export default function SkillCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-neutral-600">–</span>;
  return <span style={{ color: getSkillColor(value) }} className="font-mono font-semibold">{value}</span>;
}
```

- [ ] **Step 5: PlayerTable** — `v2/src/components/PlayerTable.tsx` (server component; shared by both pages):

```tsx
import { PlayerListRow } from '@/queries/players';
import { SKILLS, getPotentialColor, POTENTIAL_LEVELS } from '@/lib/constants';
import SkillCell from './SkillCell';

export default function PlayerTable({ rows, showCountry, showSkills }: {
  rows: PlayerListRow[]; showCountry?: boolean; showSkills?: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-neutral-400 border-b border-neutral-800">
        <tr>
          <th className="py-2 pr-3">Player</th>
          {showCountry && <th className="pr-3">Country</th>}
          <th className="pr-3">Age</th>
          <th className="pr-3">Pos</th>
          <th className="pr-3">Pot</th>
          <th className="pr-3 text-right">Salary</th>
          <th className="pr-3 text-right">DMI</th>
          <th className="pr-3">GS</th>
          <th className="pr-3 text-right">TSP</th>
          {showSkills && SKILLS.map((s) => <th key={s.dbKey} className="pr-2">{s.name.split(' ').map(w => w[0]).join('')}</th>)}
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.bbPlayerId} className="border-b border-neutral-900 hover:bg-neutral-900/50">
            <td className="py-1.5 pr-3">
              <a href={`https://buzzerbeater.com/player/${p.bbPlayerId}/overview.aspx`} target="_blank"
                 className="hover:text-amber-500">{p.name}</a>
            </td>
            {showCountry && <td className="pr-3 text-neutral-400">{p.nationality ?? '–'}</td>}
            <td className="pr-3">{p.ageNow ?? '–'}</td>
            <td className="pr-3">{p.bestPosition ?? '–'}</td>
            <td className="pr-3">
              {p.potential != null
                ? <span style={{ color: getPotentialColor(p.potential) }} title={POTENTIAL_LEVELS[p.potential]}>{p.potential}</span>
                : '–'}
            </td>
            <td className="pr-3 text-right">{p.salary?.toLocaleString() ?? '–'}</td>
            <td className="pr-3 text-right">{p.dmi?.toLocaleString() ?? '–'}</td>
            <td className="pr-3">{p.gameShape ?? '–'}</td>
            <td className="pr-3 text-right font-medium">{p.tsp ?? '–'}</td>
            {showSkills && SKILLS.map((s) => (
              <td key={s.dbKey} className="pr-2"><SkillCell value={p.skills?.[s.dbKey] ?? null} /></td>
            ))}
            <td>
              {p.hasFullSkills
                ? <span className="text-xs rounded bg-green-900/40 text-green-400 px-1.5 py-0.5">skills</span>
                : <span className="text-xs rounded bg-blue-900/40 text-blue-400 px-1.5 py-0.5">DMI only</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 6: Slovenia page** — `v2/src/app/slovenia/page.tsx` (server component, ages 18–21 default, skills visible, sorted TSP desc):

```tsx
import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';

export const dynamic = 'force-dynamic';

export default async function SloveniaPage() {
  const all = await listPlayers({ nationality: 'Slovenia' });
  const rows = all
    .filter((p) => p.ageNow != null && p.ageNow >= 18 && p.ageNow <= 21)
    .sort((a, b) => (b.tsp ?? -1) - (a.tsp ?? -1));
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">Slovenia — U21 candidates</h1>
      <p className="text-sm text-neutral-500 mb-4">{rows.length} players aged 18–21 (of {all.length} tracked) · read-only Phase 1 view</p>
      <PlayerTable rows={rows} showSkills />
    </main>
  );
}
```

- [ ] **Step 7: World page** — `v2/src/app/world/page.tsx` (country filter via `?country=` searchParam, ages 18–21, DMI desc):

```tsx
import { listPlayers } from '@/queries/players';
import PlayerTable from '@/components/PlayerTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WorldPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  const all = await listPlayers({ excludeNationality: 'Slovenia' });
  const countries = [...new Set(all.map((p) => p.nationality).filter((n): n is string => !!n))].sort();
  const rows = all
    .filter((p) => !country || p.nationality === country)
    .filter((p) => p.ageNow == null || (p.ageNow >= 18 && p.ageNow <= 21))
    .sort((a, b) => (b.dmi ?? -1) - (a.dmi ?? -1));
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">World — tracked players</h1>
      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <Link href="/world" className={!country ? 'text-amber-500' : 'text-neutral-400'}>All</Link>
        {countries.map((c) => (
          <Link key={c} href={`/world?country=${encodeURIComponent(c)}`}
            className={country === c ? 'text-amber-500' : 'text-neutral-400 hover:text-white'}>{c}</Link>
        ))}
      </div>
      <PlayerTable rows={rows} showCountry />
    </main>
  );
}
```

- [ ] **Step 8: Manual verify**

Run: `npm run dev` → log in → `/slovenia` shows the migrated Slovenian 18–21yo with colored skills sorted by TSP; `/world` shows foreign players, country links filter, DMI sorted; player names open BB pages.

- [ ] **Step 9: Commit + push**

```bash
git add src/app src/components
git commit -m "feat(v2): app shell + read-only Slovenia and World tables over migrated data"
git push
```

---

### Task 9: Deploy to a second Vercel project

**Files:** none (Vercel dashboard + smoke test)

- [ ] **Step 1 (user, dashboard):** Vercel → Add New Project → import the same GitHub repo (`Rn5ho/BB-project`) → name `bb-scout-v2` → **Root Directory: `v2`** → Framework: Next.js (auto).

- [ ] **Step 2 (user, dashboard):** Set env vars on the new project: `DATABASE_URL`, `APP_PASSWORD`, `APP_SESSION_SECRET` (the Supabase/BB keys are NOT needed on Vercel — they're migration-script-only).

- [ ] **Step 3: Deploy** — trigger deploy (or push any commit).

- [ ] **Step 4: Smoke test** on the deployed URL: `/` → redirected to `/login`; wrong password rejected; correct password → `/slovenia` renders migrated data; `/world` country filter works; a player link opens BuzzerBeater.

- [ ] **Step 5:** Update `CLAUDE.md` — add a short "v2 (in progress)" section: location `v2/`, deployed URL, phase status, pointer to the spec + this plan. Commit + push.

```bash
git add CLAUDE.md
git commit -m "docs: note v2 foundation deployment in CLAUDE.md"
git push
```

---

## Self-Review (done at write time)

- **Spec coverage (phase 1 scope):** scaffold ✅ (T1), Neon schema + migrations ✅ (T3 — all §5 tables incl. phase-2+ tables so later phases only add code, not schema churn), auth ✅ (T4), migration script ✅ (T5–6, incl. seasons seed, nt_squad conversion, settings→tracked_countries), read-only Slovenia/World ✅ (T7–8), second Vercel project ✅ (T9).
- **Deliberate deferrals (later phases):** country_id backfill for non-Slovenians (Phase 2 sync), player detail page, filters beyond age/country, notes/tags UI, compare (all Phase 5); logout button (trivial, can ride along any later task).
- **Type consistency:** `tsp()` takes v1-style snake_case dbKeys (matches `SKILLS` and `PlayerListRow.skills`); transforms output camelCase Drizzle columns; `pickCurrentSeason` signature matches both domain tests and the migration orchestrator.
- **Placeholder scan:** no TBDs; every code step has complete code; commands include expected outputs.
