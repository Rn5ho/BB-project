# BB Scout v2 — Phase 4 (Census) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command (`npm run census`) cycles every Slovenian 18–21 candidate through the U-21 NT roster in batches of 18 — call up, scrape full skills, dismiss — turning the user's multi-hour offseason grind into a single supervised run that fills the database with fresh full-skill snapshots.

**Architecture:** A local CLI (NOT Vercel — it performs write actions on the user's NT account and runs for many minutes) that reuses the Phase-3 `BbWebSession` (login + ASP.NET postbacks) and a generalized `card-parser` (the roster page uses the same skill markup). New `nt-roster.ts` wraps recruit/dismiss/fetch-roster; `census.ts` orchestrates batches with DB-backed resume (`census_runs`/`census_items`) and hard safety rails (never dismiss a player it didn't recruit).

**Tech Stack:** Existing v2 stack. CLI via `tsx` (already a dev dep). No Vercel cron, no new deps.

**Spec:** `docs/superpowers/specs/2026-07-10-bb-scout-v2-design.md` §4 Layer 2 (the census), §9 phase 4.

---

## Research facts (verified live 2026-07-10 — READ-ONLY probing; no roster actions were performed)

- **Recruit control** (on a NON-rostered Slovenian player's `/player/<id>/overview.aspx`): submit input `ctl00$cphContent$btnNTRecruit2` (value "Recruit", `onclick=showRecruitPopup2()` — client-side popup) and a confirm submit `ctl00$cphContent$btnRecruitYes2` (value "Yes", real `__doPostBack`). The confirm button is the actual server action.
- **Dismiss control** (on a ROSTERED player's page): submit `ctl00$cphContent$btnNTDismiss2` ("Dismiss", client popup) + confirm `ctl00$cphContent$btnDismissYes2` ("Yes", real postback).
- **UNKNOWN until the supervised live test (Task 4):** whether posting the confirm button (`btnRecruitYes2` / `btnDismissYes2`) directly with the page's hidden fields is sufficient, or whether the popup step must be POSTed first. Task 4 Step A resolves this with ONE player under user supervision before any batch runs.
- **A player's own page carries the NT control**, so recruit/dismiss = GET player page → collect hidden fields → POST the confirm postback target. After the action, re-GET confirms state (rostered player page shows Dismiss; non-rostered shows Recruit).
- **NT roster page** `/country/66/jnt/players.aspx` (logged in): 14 players currently, EACH with full skills. Player blocks use repeater anchor `<a id="cphContent_Repeater1_HyperLink1_N" href="../../../player/<id>/overview.aspx">First&nbsp;Last</a>&nbsp;(<id>)` — DIFFERENT id prefix from the transfer list (`rptListedPlayers_hlPlayerDetails_N`), but the skill/meta markup is IDENTICAL (`Jump Shot: <a title="11">prolific (11)</a>`, `TSP: <b>91</b>`, Age/Height/Potential/Game Shape as on market cards). No `Auction ends`/`Current Bid`/flag on roster cards (owner shown differently or absent). Fixture saved: `v2/src/server/bb/__fixtures__/jnt-roster.html`.
- **Max 18 players** may be on the NT roster at once (game rule). Skills are visible ONLY while called up.

## Decisions locked

- **CLI, local, supervised.** `npm run census` reads `.env.local`, runs against production Neon + the real BB account. Not a Vercel job (write actions + duration + user-in-the-loop).
- **Candidate set:** Slovenian players (country_id 66) aged 18–21 (via the same season-aware age as the app), EXCLUDING any with a `census` or `market` full-skill snapshot captured this season already (configurable `--all` to force everyone, `--max N` to cap). Ordered oldest-capture-first so stalest data refreshes first.
- **Protected roster:** at start, fetch the current NT roster and record those player ids as PROTECTED. The census NEVER dismisses a protected player. It only dismisses players present in its own `census_items` with status `recruited`. Free slots per batch = 18 − (protected count).
- **Batch flow** (batch size = free slots, ≤18): recruit each candidate (record `recruited` immediately, before scraping — so a crash still lets us dismiss it); fetch roster; parse; upsert `census` snapshots; dismiss each player this run recruited; mark `captured`. Per-player try/catch: a failure marks that item `failed` with the error and continues.
- **Resume:** `census_runs` row per run (`status running|finished|aborted|failed`, `totals` jsonb); `census_items` per candidate (`pending|recruited|captured|failed|skipped`). On start with `--resume <runId>`, first DISMISS any lingering `recruited` items (crash cleanup), then continue `pending`. Always print the runId prominently so the user can resume/clean up.
- **Safety valves:** `--dry-run` (default OFF for census since it must act, but a dry run lists the candidate plan and the protected set and exits without acting); polite pacing (1–2s between actions); abort on 3 consecutive recruit failures (likely session death or rule change) leaving a clean roster; a final "roster returned to N protected players" assertion that errors loudly if the census leaves extra players on the roster.
- **Snapshots:** source `census`, full skills, season = current; dedup one census snapshot per player per UTC day (delete+reinsert same-day, mirroring market/players).

## File Structure

```
v2/src/server/bb/
├── card-parser.ts            # MODIFY: generalize the player anchor regex to match roster + transfer markup
├── card-parser.test.ts       # MODIFY: add roster-fixture cases
├── nt-roster.ts              # NEW: fetchNtRoster(session), recruitPlayer(session,id), dismissPlayer(session,id)
└── __fixtures__/jnt-roster.html   # (already saved)
v2/src/server/census/
├── candidates.ts             # NEW: pure — selectCandidates(dbRows, season, opts) + freeSlots()
├── candidates.test.ts        # NEW
└── run.ts                    # NEW: runCensus(opts) — orchestration, resume, safety rails
v2/scripts/census.mts         # NEW: CLI entry (arg parsing → runCensus)
v2/package.json               # MODIFY: "census": "tsx scripts/census.mts"
```

All npm commands from `D:\ClaudeProjects\BB-project\v2`; commit + push (repo root) after each task; commit messages end `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Never print `.env.local` values.

---

### Task 1: Generalize the card parser for the roster page (TDD)

**Files:**
- Modify: `v2/src/server/bb/card-parser.ts`, `v2/src/server/bb/card-parser.test.ts`

- [ ] **Step 1: Add failing roster tests** to `card-parser.test.ts` (read the roster fixture; verify Milan Peterec id 55158715 is card 0):

```ts
const roster = readFileSync(new URL('./__fixtures__/jnt-roster.html', import.meta.url), 'utf8');

describe('parsePlayerCards — NT roster page (Repeater1 markup)', () => {
  const cards = parsePlayerCards(roster);
  it('parses all 14 rostered players', () => expect(cards.length).toBe(14));
  it('reads identity from the Repeater1 anchor', () => {
    const c = cards.find((x) => x.bbPlayerId === 55158715)!;
    expect(c).toBeDefined();
    expect(c.name).toBe('Milan Peterec');
  });
  it('reads full skills + tsp on roster cards', () => {
    const c = cards.find((x) => x.bbPlayerId === 55158715)!;
    expect(Object.keys(c.skills).length).toBe(12);
    expect(c.skills.jump_shot).toBe(11); // "prolific (11)"
    expect(c.tsp).toBe(91);
    for (const v of Object.values(c.skills)) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(20); }
  });
  it('roster cards have no auction fields', () => {
    const c = cards.find((x) => x.bbPlayerId === 55158715)!;
    expect(c.auctionEnds).toBeNull();
    expect(c.price).toBeNull();
  });
});
```

(Verify the exact jump_shot/tsp values against the fixture during Step 2 — research saw JS=11 "prolific", TSP=91 for Peterec; if different, use the fixture's truth.)

- [ ] **Step 2:** `npm test` → new roster tests FAIL (anchor regex only matches `hlPlayerDetails`). Confirm the existing transfer-list card tests still PASS (must not regress).

- [ ] **Step 3: Generalize the anchor regex** in `card-parser.ts`. Change the anchors matcher from the `hlPlayerDetails`-specific pattern to one that matches any player-details anchor id under `cphContent_` that links to a player overview:

```ts
  const anchors = [...html.matchAll(/<a id="cphContent_[A-Za-z0-9]+_(?:hlPlayerDetails|HyperLink1)_\d+" href="[^"]*\/player\/(\d+)\/overview\.aspx">([\s\S]*?)<\/a>/g)];
```

The rest of the per-card parsing already reads skills/meta by label + title attr, which is identical on both pages — no other change needed. Market-only fields (`Auction ends`, `Current Bid`, flag) simply won't match on roster cards and stay null, which is correct.

- [ ] **Step 4:** `npm test` → all pass (roster + transfer + prior). `npm run build` clean.

- [ ] **Step 5: Commit + push**

```bash
git add v2/src/server/bb/card-parser.ts v2/src/server/bb/card-parser.test.ts v2/src/server/bb/__fixtures__/jnt-roster.html
git commit -m "feat(v2): generalize card parser to the NT roster page markup"
git push
```

---

### Task 2: NT roster actions module

**Files:**
- Create: `v2/src/server/bb/nt-roster.ts`

(No pure unit tests here — the functions are thin HTTP wrappers verified live in Task 4 under supervision. Keep them minimal and readable.)

- [ ] **Step 1: Implement** — `v2/src/server/bb/nt-roster.ts`:

```ts
// U-21 NT roster actions on buzzerbeater.com. WRITE actions (recruit/dismiss) mutate the
// user's real NT roster — only the census CLI calls these, under supervision.
// Verified controls (2026-07-10): recruit confirm = ctl00$cphContent$btnRecruitYes2,
// dismiss confirm = ctl00$cphContent$btnDismissYes2, both on the player's overview page.

import { BbWebSession, collectHiddenFields } from './web-session';
import { parsePlayerCards, type ParsedCard } from './card-parser';

const SLOVENIA_JNT = '/country/66/jnt/players.aspx';

export async function fetchNtRoster(session: BbWebSession): Promise<ParsedCard[]> {
  const html = await session.get(SLOVENIA_JNT);
  return parsePlayerCards(html);
}

/** POST a confirm postback on the player's overview page. Returns the resulting HTML. */
async function playerPostback(session: BbWebSession, playerId: number, target: string): Promise<string> {
  const path = `/player/${playerId}/overview.aspx`;
  const page = await session.get(path);
  return session.post(path, {
    ...collectHiddenFields(page),
    __EVENTTARGET: target,
    __EVENTARGUMENT: '',
  });
}

/** Call a player up to the U-21 NT roster. Throws if the player is not recruitable. */
export async function recruitPlayer(session: BbWebSession, playerId: number): Promise<void> {
  const result = await playerPostback(session, playerId, 'ctl00$cphContent$btnRecruitYes2');
  // success = the page now shows the Dismiss control for this player
  if (!/btnNTDismiss2|currently on your national team roster/i.test(result)) {
    throw new Error(`recruit ${playerId}: no confirmation of roster membership in response`);
  }
}

/** Dismiss a player from the U-21 NT roster. Throws if not confirmed removed. */
export async function dismissPlayer(session: BbWebSession, playerId: number): Promise<void> {
  const result = await playerPostback(session, playerId, 'ctl00$cphContent$btnDismissYes2');
  if (/btnNTDismiss2|currently on your national team roster/i.test(result)) {
    throw new Error(`dismiss ${playerId}: player still appears rostered after dismiss`);
  }
}
```

NOTE: if Task 4's live probe shows the confirm postback alone is insufficient (needs the popup-trigger POST first), add a preceding `playerPostback(..., 'ctl00$cphContent$btnNTRecruit2')` / `btnNTDismiss2` call inside recruit/dismiss and document it. Do not guess — Task 4 Step A determines this empirically.

- [ ] **Step 2:** `npm run build` clean (module compiles; not yet imported by anything at runtime). `npm test` still green.

- [ ] **Step 3: Commit + push**

```bash
git add v2/src/server/bb/nt-roster.ts
git commit -m "feat(v2): NT roster actions (fetch/recruit/dismiss) via website session"
git push
```

---

### Task 3: Candidate selection (pure, TDD) + census orchestration

**Files:**
- Create: `v2/src/server/census/candidates.ts`, `v2/src/server/census/candidates.test.ts`, `v2/src/server/census/run.ts`

- [ ] **Step 1: Failing tests** — `v2/src/server/census/candidates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';

const rows: CandidateRow[] = [
  { bbPlayerId: 1, ageNow: 20, hasFreshFullThisSeason: false, oldestCapture: new Date('2026-01-01') },
  { bbPlayerId: 2, ageNow: 22, hasFreshFullThisSeason: false, oldestCapture: null },        // too old
  { bbPlayerId: 3, ageNow: 18, hasFreshFullThisSeason: true, oldestCapture: new Date('2026-07-01') }, // already fresh
  { bbPlayerId: 4, ageNow: 21, hasFreshFullThisSeason: false, oldestCapture: new Date('2025-01-01') },
  { bbPlayerId: 5, ageNow: null, hasFreshFullThisSeason: false, oldestCapture: null },       // unknown age excluded
];

describe('selectCandidates (default)', () => {
  const out = selectCandidates(rows, {});
  it('keeps 18-21 without a fresh full snapshot', () => expect(out.map((r) => r.bbPlayerId)).toEqual([4, 1]));
  it('orders stalest-first (oldest capture, nulls first)', () => expect(out[0].bbPlayerId).toBe(4));
});

describe('selectCandidates options', () => {
  it('--all includes already-fresh players (still age-gated)', () =>
    expect(selectCandidates(rows, { all: true }).map((r) => r.bbPlayerId).sort()).toEqual([1, 3, 4]));
  it('--max caps the list', () => expect(selectCandidates(rows, { max: 1 }).length).toBe(1));
});

describe('freeSlots', () => {
  it('18 minus protected', () => expect(freeSlots(4)).toBe(14));
  it('never negative', () => expect(freeSlots(20)).toBe(0));
  it('caps at 18', () => expect(freeSlots(0)).toBe(18));
});
```

- [ ] **Step 2:** FAIL, then implement `v2/src/server/census/candidates.ts`:

```ts
export interface CandidateRow {
  bbPlayerId: number;
  ageNow: number | null;
  hasFreshFullThisSeason: boolean;
  oldestCapture: Date | null; // oldest snapshot date (stalest first); null = never fully captured
}

export interface SelectOpts { all?: boolean; max?: number }

const MAX_ROSTER = 18;

export function freeSlots(protectedCount: number): number {
  return Math.max(0, Math.min(MAX_ROSTER, MAX_ROSTER - protectedCount));
}

export function selectCandidates(rows: CandidateRow[], opts: SelectOpts): CandidateRow[] {
  let out = rows.filter((r) => r.ageNow != null && r.ageNow >= 18 && r.ageNow <= 21);
  if (!opts.all) out = out.filter((r) => !r.hasFreshFullThisSeason);
  // stalest first: never-captured (null) before oldest date
  out.sort((a, b) => {
    if (a.oldestCapture === null && b.oldestCapture === null) return a.bbPlayerId - b.bbPlayerId;
    if (a.oldestCapture === null) return -1;
    if (b.oldestCapture === null) return 1;
    return a.oldestCapture.getTime() - b.oldestCapture.getTime();
  });
  if (opts.max != null) out = out.slice(0, opts.max);
  return out;
}
```

(NOTE the test's expected default order `[4,1]`: both never-fresh, player 4 capture 2025 is older than player 1's 2026 → 4 first. Correct.)

- [ ] **Step 3:** `npm test` pass.

- [ ] **Step 4: Implement orchestration** — `v2/src/server/census/run.ts`. This is the heart; keep it readable and defensive:

```ts
import { db, players, snapshots, censusRuns, censusItems } from '@/db';
import { BbWebSession } from '@/server/bb/web-session';
import { fetchNtRoster, recruitPlayer, dismissPlayer } from '@/server/bb/nt-roster';
import { getCurrentSeasonId, getCurrentSeasonId as _cs } from '@/queries/players';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';
import { utcDayKey } from '@/server/sync/players';
import { sql, and, eq, gte, inArray } from 'drizzle-orm';

export interface CensusOpts { all?: boolean; max?: number; dryRun?: boolean; resumeRunId?: number; pauseMs?: number }
const PAUSE = 1500;

type Log = (msg: string) => void;

export async function runCensus(opts: CensusOpts, log: Log = console.log): Promise<{ runId: number; captured: number; failed: number }> {
  const season = await getCurrentSeasonId();
  const pauseMs = opts.pauseMs ?? PAUSE;
  const sleep = () => new Promise((r) => setTimeout(r, pauseMs));

  // 1. build candidate rows from DB (season-aware age + this-season freshness + stalest date)
  const rows = await loadCandidateRows(season);
  const candidates = selectCandidates(rows, { all: opts.all, max: opts.max });
  log(`Season ${season}: ${candidates.length} candidates selected (of ${rows.length} Slovenian 18-21).`);

  // 2. login + protected roster
  const session = new BbWebSession();
  await session.login();
  const rosterAtStart = await fetchNtRoster(session);
  const protectedIds = new Set(rosterAtStart.map((c) => c.bbPlayerId));
  const slots = freeSlots(protectedIds.size);
  log(`Roster has ${protectedIds.size} protected players; ${slots} free slots per batch.`);
  if (slots === 0) throw new Error('No free roster slots (18 already rostered). Aborting — nothing the census can safely do.');

  if (opts.dryRun) {
    log('DRY RUN — plan only, no roster actions:');
    candidates.forEach((c, i) => log(`  ${i + 1}. player ${c.bbPlayerId} (age ${c.ageNow})`));
    return { runId: -1, captured: 0, failed: 0 };
  }

  // 3. run row (+ resume cleanup)
  let runId = opts.resumeRunId ?? 0;
  if (runId) {
    const lingering = await db.select().from(censusItems).where(and(eq(censusItems.runId, runId), eq(censusItems.status, 'recruited')));
    for (const it of lingering) { await safeDismiss(session, it.playerId, log); await sleep(); }
  } else {
    const [r] = await db.insert(censusRuns).values({ status: 'running' }).returning({ id: censusRuns.id });
    runId = r.id;
    await db.insert(censusItems).values(candidates.map((c) => ({ runId, playerId: c.bbPlayerId, status: 'pending' as const })));
  }
  log(`Census run #${runId} — resume with: npm run census -- --resume ${runId}`);

  // 4. batch loop over PENDING items
  let captured = 0, failed = 0, consecutiveRecruitFails = 0;
  while (true) {
    const pend = await db.select().from(censusItems).where(and(eq(censusItems.runId, runId), eq(censusItems.status, 'pending'))).limit(slots);
    if (pend.length === 0) break;
    const batchIds: number[] = [];

    for (const it of pend) {
      if (protectedIds.has(it.playerId)) { await mark(runId, it.playerId, 'skipped', 'already protected'); continue; }
      try {
        await recruitPlayer(session, it.playerId);
        await mark(runId, it.playerId, 'recruited');
        batchIds.push(it.playerId);
        consecutiveRecruitFails = 0;
      } catch (e) {
        await mark(runId, it.playerId, 'failed', String(e)); failed++;
        if (++consecutiveRecruitFails >= 3) { await abort(session, runId, batchIds, log); throw new Error('3 consecutive recruit failures — aborted with clean roster'); }
      }
      await sleep();
    }

    if (batchIds.length > 0) {
      const roster = await fetchNtRoster(session);
      const capthere = await saveCensusSnapshots(roster.filter((c) => batchIds.includes(c.bbPlayerId)), season);
      captured += capthere;
      log(`Batch captured ${capthere}/${batchIds.length} full-skill snapshots.`);
      for (const id of batchIds) { await safeDismiss(session, id, log); await mark(runId, id, 'captured'); await sleep(); }
    }
  }

  // 5. final safety assertion: roster back to exactly the protected set
  const rosterEnd = await fetchNtRoster(session);
  const extras = rosterEnd.filter((c) => !protectedIds.has(c.bbPlayerId));
  if (extras.length > 0) {
    log(`WARNING: ${extras.length} unexpected players remain on the roster: ${extras.map((e) => e.bbPlayerId).join(', ')} — dismissing.`);
    for (const e of extras) { await safeDismiss(session, e.bbPlayerId, log); await sleep(); }
  }
  await db.update(censusRuns).set({ status: 'finished', finishedAt: new Date(), totals: { captured, failed } }).where(eq(censusRuns.id, runId));
  log(`Census #${runId} finished: ${captured} captured, ${failed} failed. Roster restored to ${protectedIds.size} protected players.`);
  return { runId, captured, failed };
}

async function safeDismiss(session: BbWebSession, playerId: number, log: Log) {
  try { await dismissPlayer(session, playerId); } catch (e) { log(`dismiss ${playerId} failed: ${e}`); }
}
async function abort(session: BbWebSession, runId: number, batchIds: number[], log: Log) {
  for (const id of batchIds) await safeDismiss(session, id, log);
  await db.update(censusRuns).set({ status: 'aborted', finishedAt: new Date() }).where(eq(censusRuns.id, runId));
}
async function mark(runId: number, playerId: number, status: 'recruited' | 'captured' | 'failed' | 'skipped', error?: string) {
  await db.update(censusItems).set({ status, error: error ?? null }).where(and(eq(censusItems.runId, runId), eq(censusItems.playerId, playerId)));
}

async function saveCensusSnapshots(cards: Awaited<ReturnType<typeof fetchNtRoster>>, season: number): Promise<number> {
  if (cards.length === 0) return 0;
  const ids = cards.map((c) => c.bbPlayerId);
  const todayStart = new Date(`${utcDayKey(new Date())}T00:00:00Z`);
  const todays = await db.select({ id: snapshots.id }).from(snapshots)
    .where(and(eq(snapshots.source, 'census'), gte(snapshots.capturedAt, todayStart), inArray(snapshots.playerId, ids)));
  if (todays.length > 0) await db.delete(snapshots).where(inArray(snapshots.id, todays.map((t) => t.id)));
  await db.insert(snapshots).values(cards.map((c) => ({
    playerId: c.bbPlayerId, source: 'census' as const, season,
    age: c.age, gameShape: c.gameShape, salary: c.salary, potential: c.potential, experience: c.experience,
    jumpShot: c.skills.jump_shot ?? null, jumpRange: c.skills.jump_range ?? null, outsideDef: c.skills.outside_def ?? null,
    handling: c.skills.handling ?? null, driving: c.skills.driving ?? null, passing: c.skills.passing ?? null,
    insideShot: c.skills.inside_shot ?? null, insideDef: c.skills.inside_def ?? null, rebounding: c.skills.rebounding ?? null,
    shotBlocking: c.skills.shot_blocking ?? null, stamina: c.skills.stamina ?? null, freeThrow: c.skills.free_throw ?? null,
    tsp: c.tsp, ownerTeamId: c.ownerTeamId, ownerTeamName: c.ownerTeamName,
  })));
  return cards.length;
}

async function loadCandidateRows(season: number): Promise<CandidateRow[]> {
  // Slovenian players + season-aware age from latest snapshot + fresh-full-this-season flag + oldest capture
  const result = await db.execute(sql`
    with latest as (
      select distinct on (player_id) player_id, age, season from snapshots order by player_id, captured_at desc
    ),
    fresh as (
      select distinct player_id from snapshots
      where jump_shot is not null and season = ${season} and source in ('census','market','manual')
    ),
    oldest as (
      select player_id, min(captured_at) as oldest_capture from snapshots where jump_shot is not null group by player_id
    )
    select p.bb_player_id, l.age as snap_age, l.season as snap_season,
           (f.player_id is not null) as fresh_full, o.oldest_capture
    from players p
    left join latest l on l.player_id = p.bb_player_id
    left join fresh f on f.player_id = p.bb_player_id
    left join oldest o on o.player_id = p.bb_player_id
    where p.country_id = 66 or p.nationality = 'Slovenia'
  `);
  return (result.rows as Record<string, unknown>[]).map((r) => {
    const snapAge = r.snap_age as number | null;
    const snapSeason = r.snap_season as number | null;
    const ageNow = snapAge == null || snapSeason == null ? null : snapAge + (season - snapSeason);
    return {
      bbPlayerId: r.bb_player_id as number,
      ageNow,
      hasFreshFullThisSeason: r.fresh_full as boolean,
      oldestCapture: r.oldest_capture ? new Date(r.oldest_capture as string) : null,
    };
  });
}
```

(Remove the unused `_cs` alias; it's shown only to flag that `getCurrentSeasonId` is the season source. Clean it up when implementing.)

- [ ] **Step 5:** `npm test` green; `npm run build` clean.

- [ ] **Step 6: Commit + push**

```bash
git add v2/src/server/census
git commit -m "feat(v2): census candidate selection + orchestration with resume and safety rails"
git push
```

---

### Task 4: CLI + SUPERVISED live run

**Files:**
- Create: `v2/scripts/census.mts`
- Modify: `v2/package.json` (`"census": "tsx scripts/census.mts"`)

- [ ] **Step 1: CLI** — `v2/scripts/census.mts`:

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

const { runCensus } = await import('../src/server/census/run.ts');
const opts = {
  all: has('--all'),
  dryRun: has('--dry-run'),
  max: val('--max') ? Number(val('--max')) : undefined,
  resumeRunId: val('--resume') ? Number(val('--resume')) : undefined,
  pauseMs: val('--pause') ? Number(val('--pause')) : undefined,
};
console.log('census options:', JSON.stringify(opts));
const res = await runCensus(opts);
console.log('RESULT:', JSON.stringify(res));
process.exit(0);
```

Add to `package.json` scripts: `"census": "tsx scripts/census.mts"`.

- [ ] **Step 2: Dry run (safe — no roster actions).** `npm run census -- --dry-run --max 5`. Expect: candidate count, protected-roster count, free slots, and a 5-line plan, then exit. Confirm it logs the protected set and does NOT act. Paste output.

- [ ] **Step 3: STOP — request supervised approval.** Report DONE_WITH_CONCERNS and ask the controller/user to confirm before ANY live recruit/dismiss. This is the first write action against the real NT roster. Do not proceed to Step 4 without explicit go-ahead.

- [ ] **Step 4 (only after approval): single-player live probe.** `npm run census -- --max 1 --pause 2000`. Watch closely: it should recruit ONE player, scrape, save one `census` snapshot, dismiss that player, and end with the roster restored to the protected count. If `recruitPlayer` throws "no confirmation" (the confirm-only postback was insufficient), apply the popup-first fix noted in Task 2, rebuild, retry. Verify in the DB: `select count(*) from snapshots where source='census'` increased by 1; verify on the BB site (or a fresh fetchNtRoster) that the roster is back to the protected set. Paste the run log + the runId.

- [ ] **Step 5: Commit + push** (CLI + any Task-2 fix):

```bash
git add v2/scripts/census.mts v2/package.json v2/src/server/bb/nt-roster.ts
git commit -m "feat(v2): census CLI + verified single-player live round-trip"
git push
```

- [ ] **Step 6: Full census (user-run, optional now).** Document in the report that the user runs `npm run census` (no `--max`) for the real offseason sweep — batches of ~(18−protected), resumable via the printed runId. This is theirs to trigger when they want the full ~150-player pass.

---

### Task 5: Census page + docs

**Files:**
- Modify: `v2/src/app/settings/page.tsx` (or a new `/census` route) — surface `census_runs` history + latest run's per-item outcomes; a short "run `npm run census` locally" instruction (the CLI is not a web action). Read the current settings page first; add a "Census runs" section mirroring the sync-log table (run id, started, status, totals; expandable failed items optional).
- Modify: `CLAUDE.md` + user memory: Phase 4 shipped, census CLI usage, safety model.

- [ ] **Step 1:** Add a "Census runs" section to the Settings page reading `db.select().from(censusRuns).orderBy(desc(startedAt)).limit(10)` and, for the newest, its `census_items` counts by status. No server action needed (read-only; the run happens via CLI).
- [ ] **Step 2:** `npm test` green, `npm run build` clean; curl /settings shows the Census section.
- [ ] **Step 3:** Commit + push; update CLAUDE.md (Phase 4: local census CLI, `npm run census [--all|--max N|--resume ID|--dry-run]`, safety rails: protected roster + only-dismiss-own-recruits + resume + final assertion) and the memory file.

---

## Self-Review (done at write time)

- **Spec coverage:** §4 Layer 2 census (batches of ≤18, recruit→scrape→dismiss, protected pre-existing roster, resumable via census_runs/items, source `census` snapshots, "who popped" is derivable from the season-over-season snapshots — a diff view is deferred to Phase 5 detail pages) → Tasks 2–4; local supervised CLI → Task 4; census surfaced in UI → Task 5.
- **Safety model (the core risk):** write actions isolated to `nt-roster.ts`; the census only dismisses ids it recorded as `recruited`; protected set captured before acting and re-asserted at the end; 3-consecutive-failure abort leaves a clean roster; resume dismisses lingering recruits first; dry-run and single-player probe precede any bulk run; live testing gated on explicit user approval (Task 4 Step 3).
- **Type consistency:** `ParsedCard` reused from card-parser (roster cards populate skills/meta, leave market fields null); `utcDayKey`/`getCurrentSeasonId` reused; `census_runs`/`census_items` status enums match the schema (`running|finished|aborted|failed` and `pending|captured|failed|skipped` — NOTE the schema lacks `recruited`; **Task 3 Step 0**: add `recruited` to the `censusItems.status` enum in `schema.ts` and generate a migration, OR store recruited as `pending` with a separate boolean — chosen: extend the enum. Add this as the first action of Task 3 and regenerate the drizzle migration).
- **Placeholder scan:** all steps carry complete code; the one genuine unknown (confirm-postback sufficiency) is explicitly deferred to a supervised empirical step, not guessed.
- **Deviation flagged:** the census `census_items.status` enum needs `recruited` added (schema currently `pending|captured|failed|skipped`) — folded into Task 3 as its first step with a migration.
```
