# Training Planner v2 — Phase B Implementation Plan (minutes pipeline + Development tab)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution strategy:** implementers on Sonnet (Haiku for pure transcription); orchestrator
> (Fable) reviews every diff. Deployment (Task 12) is orchestrator-only — never a subagent.

**Goal:** Weekly per-position minutes for every tracked Slovenian prospect (BBAPI schedule+boxscore pipeline with season backfill) and a Development section on `/players/[id]`: minutes strip, cap ladder bar, ensemble projection chart with bands, and a persistent training-plan editor.

**Architecture:** Three new tables (`matches`, `player_match_minutes`, `training_plans`). Sync follows the existing `withSession` XML-API + `runXxxSync(opts, trigger)` + `sync_log` pattern, is incremental and resumable (work state lives in the rows: `teams.schedule_synced_at`, `matches.boxscore_fetched_at`), and is batch-limited to fit Vercel's 300s. UI follows the existing server-component + small client-component + server-action pattern; charts are hand-rolled SVG like `TimeSeriesChart`. The projection runs the pure `ensembleProject` engine client-side.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Neon, vitest 4, hand-rolled SVG, existing `v2/src/lib/training/` engine (Phase A).

## Global Constraints

- All code in `v2/`. Tests from `v2/`: `npm test -- <substring>` (NEVER `npm test run`).
- Import alias `@/` = `v2/src/`.
- BBAPI request pacing 150 ms inside one `withSession` (matches `fetchTeamInfo`).
- Countable match types (training minutes): `league.*`, `cup`, `friendly`, `pl.*`. NOT countable: `bbm*`, `nt.*`, `b3*`, `unknown` (All-Star). Manual-sourced; keep in ONE helper `isCountableType`.
- Season weeks: `seasonWeekOf(date, seasonStart) = floor((date − seasonStart)/7 days) + 1` (1-based).
- Tracked prospects = `players` with `country_id = 66`, `archived = false`, `owner_team_id is not null`.
- Skill/position colors and dark-theme styling follow existing components (`var(--card-bg)` etc. not required — v2 uses Tailwind neutral palette; match `players/[id]/page.tsx` idiom).
- UI copy: plain English, no jargon codes (write "Minutes at PG", not "min_pg").
- Commit after every task (`feat(v2): …`).
- Schema changes: edit `src/db/schema.ts`, then `npx drizzle-kit generate --name <slug>`; do NOT run `drizzle-kit migrate` in tasks — applying to Neon happens in Task 12 (deployment).

## File Structure

```
v2/src/db/schema.ts                      # +matches, +playerMatchMinutes, +trainingPlans, +teams.scheduleSyncedAt/Season (T1)
v2/src/server/bb/xml-api.ts              # +parseScheduleXml/+parseBoxscoreXml/+fetchSchedule/+fetchBoxscores (T2)
v2/src/server/bb/__fixtures__/boxscore.xml, schedule.xml (T2)
v2/src/server/sync/minutes.ts (+ .test.ts)  # runMinutesSync + isCountableType + seasonWeekOf (T3)
v2/src/app/api/cron/daily/route.ts       # +minutes job (T4)
v2/src/app/api/sync/minutes/route.ts     # manual "Sync now" endpoint (T4)
v2/scripts/backfill-minutes.mts          # season backfill loop (T5)
v2/src/queries/minutes.ts                # weekly aggregates + plan fetch (T6)
v2/src/lib/training/bridge.ts (+ .test.ts) # snapshot->PlayerState, eligibleTrainings (T7)
v2/src/lib/training/templates.ts         # archetype plan templates (T7)
v2/src/components/player/MinutesStrip.tsx (T8)
v2/src/components/charts/BandChart.tsx (T9)
v2/src/components/player/CapBar.tsx (T9)
v2/src/components/player/PlanEditor.tsx + DevelopmentSection.tsx (T9)
v2/src/app/players/[id]/actions.ts       # +savePlan action (T9)
v2/src/app/players/[id]/page.tsx         # wire Development section (T10)
v2/src/app/settings/… + src/lib/format-sync.tsx  # minutes job row (T11)
```

---

### Task 1: Schema — matches, player_match_minutes, training_plans

**Files:**
- Modify: `v2/src/db/schema.ts` (append; also add 2 columns to `teams`)
- Modify: `v2/src/db/index.ts` (export new tables — check the existing export list and extend it the same way)
- Test: none (schema is exercised by T3/T6 tests); generate migration.

**Interfaces:**
- Consumes: existing `players`, `teams` tables.
- Produces: `matches`, `playerMatchMinutes`, `trainingPlans` Drizzle tables; `teams.scheduleSyncedAt`, `teams.scheduleSyncedSeason` columns. `trainingPlans.blocks` is `jsonb` of `PlanBlock[] = Array<{ trainingId: number; weeks: number }>`.

- [ ] **Step 1: Append to schema.ts**

```ts
// append to v2/src/db/schema.ts
export const matches = pgTable('matches', {
  matchId: integer('match_id').primaryKey(),
  homeTeamId: integer('home_team_id'),
  awayTeamId: integer('away_team_id'),
  matchType: text('match_type').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  season: integer('season'),
  seasonWeek: integer('season_week'),
  boxscoreFetchedAt: timestamp('boxscore_fetched_at', { withTimezone: true }),
  boxscoreError: text('boxscore_error'),
}, (t) => [
  index('idx_matches_pending').on(t.boxscoreFetchedAt),
  index('idx_matches_start').on(t.startTime.desc()),
  index('idx_matches_teams').on(t.homeTeamId, t.awayTeamId),
]);

export const playerMatchMinutes = pgTable('player_match_minutes', {
  matchId: integer('match_id').notNull().references(() => matches.matchId, { onDelete: 'cascade' }),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  minPg: integer('min_pg').notNull().default(0),
  minSg: integer('min_sg').notNull().default(0),
  minSf: integer('min_sf').notNull().default(0),
  minPf: integer('min_pf').notNull().default(0),
  minC: integer('min_c').notNull().default(0),
  isStarter: boolean('is_starter'),
}, (t) => [
  primaryKey({ columns: [t.matchId, t.playerId] }),
  index('idx_pmm_player').on(t.playerId),
]);

export const trainingPlans = pgTable('training_plans', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  blocks: jsonb('blocks').notNull(), // PlanBlock[]: { trainingId: 1-33, weeks: >=1 }[]
  coachLevel: integer('coach_level').notNull().default(5),
  youthTrainerLevel: integer('youth_trainer_level').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  planNotes: text('plan_notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_training_plans_player').on(t.playerId)]);
```

And add to the `teams` table definition (two new columns after `updatedAt`):

```ts
  scheduleSyncedAt: timestamp('schedule_synced_at', { withTimezone: true }),
  scheduleSyncedSeason: integer('schedule_synced_season'),
```

- [ ] **Step 2: Generate the migration (do NOT apply)**

Run (from `v2/`): `npx drizzle-kit generate --name minutes_pipeline`
Expected: a new `drizzle/000X_minutes_pipeline.sql` containing CREATE TABLE for the three
tables + ALTER TABLE teams. Read the generated SQL and sanity-check it.

- [ ] **Step 3: Verify project still typechecks and tests pass**

Run: `npx tsc --noEmit` (known pre-existing error in `src/lib/table.test.ts` only) and `npm test`.
Expected: no new errors; suite passes.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/db/index.ts drizzle/
git commit -m "feat(v2): matches, player_match_minutes, training_plans tables"
```

---

### Task 2: BBAPI schedule + boxscore parsers and fetchers

**Files:**
- Modify: `v2/src/server/bb/xml-api.ts` (append)
- Create: `v2/src/server/bb/__fixtures__/boxscore.xml` (copy VERBATIM from `D:\ClaudeProjects\BB-project\docs\research\training\bbapi\boxscore_example.xml`)
- Create: `v2/src/server/bb/__fixtures__/schedule.xml` (hand-built per documented shape, below)
- Test: `v2/src/server/bb/xml-api.test.ts` (append describe blocks)

**Interfaces:**
- Consumes: existing `withSession` (module-private — new fetchers live in the same file).
- Produces:
  - `interface BbScheduleMatch { matchId: number; homeTeamId: number | null; awayTeamId: number | null; type: string; startTime: Date }`
  - `parseScheduleXml(xml: string): BbScheduleMatch[]`
  - `fetchSchedule(teamId: number, season?: number): Promise<BbScheduleMatch[]>`
  - `interface BbBoxscorePlayerMinutes { playerId: number; teamId: number; minPg: number; minSg: number; minSf: number; minPf: number; minC: number; isStarter: boolean | null }`
  - `interface BbBoxscore { matchId: number; type: string; startTime: Date | null; homeTeamId: number | null; awayTeamId: number | null; players: BbBoxscorePlayerMinutes[] }`
  - `parseBoxscoreXml(xml: string): BbBoxscore` — throws `BoxscoreNotAvailableError` when the XML contains `<error`… `BoxscoreNotAvailable`/`UnknownMatchID`.
  - `class BoxscoreNotAvailableError extends Error`
  - `fetchBoxscores(matchIds: number[], onEach?: (b: BbBoxscore | null, id: number) => void): Promise<Array<BbBoxscore | null>>` — one session, 150 ms pacing, null for failed/unavailable ids (after calling onEach).

`schedule.xml` fixture content (documented shape — `<match>` children of `<schedule>`, team
ids as attributes; keep at least these cases: finished league match, cup, friendly, bbm
(non-countable), future match):

```xml
<?xml version='1.0' encoding='utf-8'?>
<bbapi version='1'>
  <schedule teamid='222222' season='40'>
    <match id='111111001' type='league.rs' start='2026-06-20T18:00:00Z'>
      <homeTeam id='222222'><teamName>Testers</teamName></homeTeam>
      <awayTeam id='333333'><teamName>Rivals</teamName></awayTeam>
    </match>
    <match id='111111002' type='cup' start='2026-06-23T18:00:00Z'>
      <homeTeam id='444444'><teamName>Cuppers</teamName></homeTeam>
      <awayTeam id='222222'><teamName>Testers</teamName></awayTeam>
    </match>
    <match id='111111003' type='friendly' start='2026-06-26T18:00:00Z'>
      <homeTeam id='222222'><teamName>Testers</teamName></homeTeam>
      <awayTeam id='555555'><teamName>Sparring</teamName></awayTeam>
    </match>
    <match id='111111004' type='bbm' start='2026-06-27T18:00:00Z'>
      <homeTeam id='222222'><teamName>Testers</teamName></homeTeam>
      <awayTeam id='666666'><teamName>BBM Foes</teamName></awayTeam>
    </match>
    <match id='111111005' type='league.rs' start='2099-01-01T18:00:00Z'>
      <homeTeam id='333333'><teamName>Rivals</teamName></homeTeam>
      <awayTeam id='222222'><teamName>Testers</teamName></awayTeam>
    </match>
  </schedule>
</bbapi>
```

IMPORTANT parser note: the REAL BB schedule XML may differ in attribute casing/nesting
(`start` vs `<startTime>` child). Write `parseScheduleXml` tolerantly: accept `start='…'`
attribute OR nested `<startTime>` element; accept `type` attribute. If zero matches parse,
throw with the XML head in the message (same convention as `parseSeasonsXml`). Task 12
validates against the live API and adjusts the fixture to the real shape if needed.

- [ ] **Step 1: Copy the boxscore fixture, write failing tests**

```ts
// append to v2/src/server/bb/xml-api.test.ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  parseScheduleXml, parseBoxscoreXml, BoxscoreNotAvailableError,
} from './xml-api';

const fx = (name: string) =>
  readFileSync(path.join(__dirname, '__fixtures__', name), 'utf8');

describe('parseScheduleXml', () => {
  it('parses matches with id, type, teams, start time', () => {
    const ms = parseScheduleXml(fx('schedule.xml'));
    expect(ms).toHaveLength(5);
    expect(ms[0]).toMatchObject({ matchId: 111111001, type: 'league.rs', homeTeamId: 222222, awayTeamId: 333333 });
    expect(ms[0].startTime.toISOString()).toBe('2026-06-20T18:00:00.000Z');
  });
  it('throws with XML head when nothing parses', () => {
    expect(() => parseScheduleXml('<bbapi><error message="NotAuthorized"/></bbapi>')).toThrow(/No matches parsed|NotAuthorized/);
  });
});

describe('parseBoxscoreXml', () => {
  it('extracts per-player position minutes from both teams (real 2010 capture)', () => {
    const b = parseBoxscoreXml(fx('boxscore.xml'));
    expect(b.matchId).toBe(10000);
    expect(b.type).toBe('nt.roundrobin');
    const p = b.players.find((x) => x.playerId === 9671213);
    expect(p).toMatchObject({ minPg: 0, minSg: 39, minSf: 0, minPf: 0, minC: 0 });
    expect(p!.teamId).toBe(1059);
    expect(b.players.length).toBeGreaterThan(10); // both rosters present
  });
  it('throws BoxscoreNotAvailableError on error XML', () => {
    expect(() => parseBoxscoreXml("<bbapi version='1'><error message='BoxscoreNotAvailable'/></bbapi>"))
      .toThrow(BoxscoreNotAvailableError);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- xml-api` → FAIL (exports missing).

- [ ] **Step 3: Implement parsers + fetchers (append to xml-api.ts)**

```ts
// append to v2/src/server/bb/xml-api.ts

export interface BbScheduleMatch {
  matchId: number; homeTeamId: number | null; awayTeamId: number | null;
  type: string; startTime: Date;
}

export function parseScheduleXml(xml: string): BbScheduleMatch[] {
  const err = xml.match(/<error[^>]*message='([^']+)'/) ?? xml.match(/<error[^>]*message="([^"]+)"/);
  if (err) throw new Error(`schedule.aspx error: ${err[1]}`);
  const blocks = [...xml.matchAll(/<match\s([^>]*)>([\s\S]*?)<\/match>/g)];
  const out: BbScheduleMatch[] = [];
  for (const b of blocks) {
    const attrs = b[1]; const body = b[2];
    const id = attrs.match(/id='(\d+)'/)?.[1];
    const type = attrs.match(/type='([^']+)'/)?.[1] ?? 'unknown';
    const start = attrs.match(/start='([^']+)'/)?.[1]
      ?? body.match(/<startTime>([^<]+)<\/startTime>/)?.[1];
    if (!id || !start) continue;
    const home = body.match(/<homeTeam id='(\d+)'/)?.[1];
    const away = body.match(/<awayTeam id='(\d+)'/)?.[1];
    out.push({
      matchId: Number(id), type,
      homeTeamId: home ? Number(home) : null,
      awayTeamId: away ? Number(away) : null,
      startTime: new Date(start),
    });
  }
  if (out.length === 0) throw new Error(`No matches parsed. XML head: ${xml.slice(0, 300)}`);
  return out;
}

export class BoxscoreNotAvailableError extends Error {}

export interface BbBoxscorePlayerMinutes {
  playerId: number; teamId: number;
  minPg: number; minSg: number; minSf: number; minPf: number; minC: number;
  isStarter: boolean | null;
}

export interface BbBoxscore {
  matchId: number; type: string; startTime: Date | null;
  homeTeamId: number | null; awayTeamId: number | null;
  players: BbBoxscorePlayerMinutes[];
}

export function parseBoxscoreXml(xml: string): BbBoxscore {
  const err = xml.match(/<error[^>]*message='([^']+)'/) ?? xml.match(/<error[^>]*message="([^"]+)"/);
  if (err) {
    if (/BoxscoreNotAvailable|UnknownMatchID/i.test(err[1])) throw new BoxscoreNotAvailableError(err[1]);
    throw new Error(`boxscore.aspx error: ${err[1]}`);
  }
  const matchAttr = xml.match(/<match id='(\d+)'[^>]*type='([^']+)'/);
  if (!matchAttr) throw new Error(`No match element. XML head: ${xml.slice(0, 300)}`);
  const startTime = xml.match(/<startTime>([^<]+)<\/startTime>/)?.[1] ?? null;

  const players: BbBoxscorePlayerMinutes[] = [];
  let homeTeamId: number | null = null;
  let awayTeamId: number | null = null;
  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const block = xml.match(new RegExp(`<${side} id='(\\d+)'>([\\s\\S]*?)</${side}>`));
    if (!block) continue;
    const teamId = Number(block[1]);
    if (side === 'homeTeam') homeTeamId = teamId; else awayTeamId = teamId;
    for (const pm of block[2].matchAll(/<player id='(\d+)'>([\s\S]*?)<\/player>/g)) {
      const body = pm[2];
      const min = (pos: string) => Number(body.match(new RegExp(`<${pos}>(\\d+)</${pos}>`))?.[1] ?? 0);
      const starter = body.match(/<isStarter>([^<]+)<\/isStarter>/)?.[1];
      players.push({
        playerId: Number(pm[1]), teamId,
        minPg: min('PG'), minSg: min('SG'), minSf: min('SF'), minPf: min('PF'), minC: min('C'),
        isStarter: starter == null ? null : /true/i.test(starter),
      });
    }
  }
  return {
    matchId: Number(matchAttr[1]), type: matchAttr[2],
    startTime: startTime ? new Date(startTime) : null,
    homeTeamId, awayTeamId, players,
  };
}

export async function fetchSchedule(teamId: number, season?: number): Promise<BbScheduleMatch[]> {
  return withSession(async (cookie) => {
    const url = `${BASE}/schedule.aspx?teamid=${teamId}${season ? `&season=${season}` : ''}`;
    const xml = await (await fetch(url, { headers: { Cookie: cookie } })).text();
    return parseScheduleXml(xml);
  });
}

/** Fetch many boxscores in ONE session, 150 ms pacing. null for unavailable/failed ids. */
export async function fetchBoxscores(
  matchIds: number[],
  onEach?: (b: BbBoxscore | null, id: number) => void,
): Promise<Array<BbBoxscore | null>> {
  if (matchIds.length === 0) return [];
  return withSession(async (cookie) => {
    const results: Array<BbBoxscore | null> = [];
    for (let i = 0; i < matchIds.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 150));
      const id = matchIds[i];
      try {
        const xml = await (
          await fetch(`${BASE}/boxscore.aspx?matchid=${id}`, { headers: { Cookie: cookie } })
        ).text();
        const b = parseBoxscoreXml(xml);
        results.push(b); onEach?.(b, id);
      } catch (err) {
        if (!(err instanceof BoxscoreNotAvailableError)) console.warn(`boxscore ${id} failed:`, err);
        results.push(null); onEach?.(null, id);
      }
    }
    return results;
  });
}
```

Note: `fetchSchedule` calls `withSession` per club — but `runMinutesSync` (T3) syncs many
clubs. Add one more export so schedules also batch in one session:

```ts
export async function fetchSchedules(
  teamIds: number[], season?: number,
): Promise<Array<{ teamId: number; matches: BbScheduleMatch[] | null }>> {
  if (teamIds.length === 0) return [];
  return withSession(async (cookie) => {
    const out: Array<{ teamId: number; matches: BbScheduleMatch[] | null }> = [];
    for (let i = 0; i < teamIds.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 150));
      const tid = teamIds[i];
      try {
        const url = `${BASE}/schedule.aspx?teamid=${tid}${season ? `&season=${season}` : ''}`;
        const xml = await (await fetch(url, { headers: { Cookie: cookie } })).text();
        out.push({ teamId: tid, matches: parseScheduleXml(xml) });
      } catch (err) {
        console.warn(`schedule ${tid} failed:`, err);
        out.push({ teamId: tid, matches: null });
      }
    }
    return out;
  });
}
```

- [ ] **Step 4: Run tests** — `npm test -- xml-api` → PASS; full `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/bb/xml-api.ts src/server/bb/xml-api.test.ts src/server/bb/__fixtures__/
git commit -m "feat(v2): BBAPI schedule + boxscore parsers and batched fetchers"
```

---

### Task 3: runMinutesSync

**Files:**
- Create: `v2/src/server/sync/minutes.ts`
- Test: `v2/src/server/sync/minutes.test.ts` (pure helpers only — no DB mocking)

**Interfaces:**
- Consumes: T1 tables, T2 fetchers, `db` from `@/db`, `syncLog` pattern from `src/server/sync/players.ts` (READ that file first and copy its sync_log bookkeeping style).
- Produces:
  - `isCountableType(type: string): boolean`
  - `seasonWeekOf(date: Date, seasonStart: Date): number`
  - `interface MinutesSyncResult { clubsSynced: number; clubsRemaining: number; matchesDiscovered: number; boxscoresFetched: number; boxscoresUnavailable: number; minutesRows: number; matchesRemaining: number }`
  - `runMinutesSync(opts: { clubBatch?: number; matchBatch?: number; season?: number; scheduleStaleDays?: number }, trigger: string): Promise<MinutesSyncResult>`

Algorithm (write exactly this; every step idempotent):
1. Resolve `season` (opts.season ?? current = max id in `seasons` with null finish or max start ≤ now) and its `start` date.
2. Tracked club ids: `select distinct owner_team_id from players where country_id = 66 and archived = false and owner_team_id is not null`.
3. Stale clubs = those whose `teams.schedule_synced_at` is null, older than `scheduleStaleDays` (default 3), or `schedule_synced_season != season`. Take first `clubBatch` (default 100), fetch via `fetchSchedules(batch, season)`. For each club (skip null results): upsert FINISHED (`startTime < now − 3h`) countable matches into `matches` (on conflict do nothing), with `season` and `seasonWeek = seasonWeekOf(startTime, seasonStart)`; update `teams.schedule_synced_at = now, schedule_synced_season = season` (insert team row if missing — reuse the upsert idiom from `refreshTeams`).
4. Pending matches: `select match_id from matches where boxscore_fetched_at is null and start_time < now() - interval '3 hours' order by start_time limit matchBatch` (default 400).
5. `fetchBoxscores(pendingIds)`; for each result: if null → `update matches set boxscore_fetched_at = now(), boxscore_error = 'unavailable'`; else → insert `player_match_minutes` rows for players whose id is in the tracked-players set (one `select bb_player_id from players where country_id = 66 and archived = false` loaded up front into a Set), `on conflict do nothing`, then `update matches set boxscore_fetched_at = now(), boxscore_error = null`.
6. Write a `sync_log` row (`job_type: 'minutes'`) with the counts jsonb; wrap the whole body in try/catch like `runPlayersSync` does (log `ok: false` + error, rethrow? — match the existing convention exactly).
7. Return counts, with `clubsRemaining` and `matchesRemaining` computed by count queries at the end.

- [ ] **Step 1: Failing tests for the pure helpers**

```ts
// v2/src/server/sync/minutes.test.ts
import { describe, expect, it } from 'vitest';
import { isCountableType, seasonWeekOf } from './minutes';

describe('isCountableType', () => {
  it.each([
    ['league.rs', true], ['league.rs.tv', true], ['league.quarterfinal', true],
    ['cup', true], ['friendly', true], ['pl.rs', true],
    ['bbm', false], ['bbm.playoff', false], ['nt.roundrobin', false],
    ['unknown', false], ['b3.final', false],
  ])('%s -> %s', (t, want) => expect(isCountableType(t)).toBe(want));
});

describe('seasonWeekOf', () => {
  const start = new Date('2026-06-05T00:00:00Z');
  it('day 0 is week 1', () => expect(seasonWeekOf(new Date('2026-06-05T12:00:00Z'), start)).toBe(1));
  it('day 6 is week 1', () => expect(seasonWeekOf(new Date('2026-06-11T23:00:00Z'), start)).toBe(1));
  it('day 7 is week 2', () => expect(seasonWeekOf(new Date('2026-06-12T01:00:00Z'), start)).toBe(2));
  it('day 70 is week 11', () => expect(seasonWeekOf(new Date('2026-08-14T12:00:00Z'), start)).toBe(11));
});
```

- [ ] **Step 2: Run to verify failure**, **Step 3: implement `minutes.ts`** (helpers +
`runMinutesSync` per the algorithm; read `src/server/sync/players.ts` and `market.ts`
first and mirror their sync_log/error conventions), **Step 4: run** `npm test -- minutes`
then full suite → PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat(v2): minutes sync job (schedules + boxscores, incremental)"`

---

### Task 4: Cron + manual sync endpoints

**Files:**
- Modify: `v2/src/app/api/cron/daily/route.ts`
- Create: `v2/src/app/api/sync/minutes/route.ts` (look at how the existing manual "Sync market now" endpoint is implemented — find it with grep `runMarketSweep` under `src/app/api/` — and mirror it exactly, including auth)

**Interfaces:** Consumes `runMinutesSync`. Produces: cron runs minutes daily after market with `{ clubBatch: 100, matchBatch: 400 }`; `?force=minutes` uses `{ clubBatch: 200, matchBatch: 800 }`. Manual endpoint POSTs with default batches, trigger `'manual'`.

- [ ] **Step 1:** Add to the cron route after the market line:

```ts
  const minutesOpts = force === 'minutes'
    ? { clubBatch: 200, matchBatch: 800 }
    : { clubBatch: 100, matchBatch: 400 };
  try {
    results.minutes = await runMinutesSync(minutesOpts, 'cron');
  } catch (err) {
    console.error('minutes sync failed (non-fatal):', err);
    results.minutes = { error: String(err) };
  }
```

(and update the route's doc comment to mention `?force=minutes`).

- [ ] **Step 2:** Create the manual endpoint mirroring the market one. **Step 3:** `npm test` + `npx tsc --noEmit` clean. **Step 4: Commit** — `feat(v2): minutes job in daily cron + manual sync endpoint`.

---

### Task 5: Season backfill script

**Files:**
- Create: `v2/scripts/backfill-minutes.mts`
- Modify: `v2/package.json` (script `"backfill:minutes": "tsx scripts/backfill-minutes.mts"`)

Loop `runMinutesSync({ clubBatch: 150, matchBatch: 500, season, scheduleStaleDays: 99999 → use a `forceSchedules?: boolean` opt instead — add it to runMinutesSync: when true, treat clubs as stale if `schedule_synced_season != season` only }, 'backfill')` until `clubsRemaining === 0 && matchesRemaining === 0`, printing counts each round, max 50 rounds. `--season N` arg (default: current). Env loading like `scripts/census.mts`. NOTE: check T3's implementation — if `scheduleStaleDays` opt already covers the force case (stale when season differs), no new opt is needed; prefer that.

- [ ] Implement, smoke-run with `--help`-style no-op if DATABASE_URL missing, `npm test` clean, commit — `feat(v2): minutes season backfill script`.

---

### Task 6: Minutes + plan queries

**Files:**
- Create: `v2/src/queries/minutes.ts`
- Test: none (thin SQL; exercised in UI + by deployment verification)

**Interfaces (produces):**

```ts
export interface WeekMinutes {
  season: number; seasonWeek: number;
  minPg: number; minSg: number; minSf: number; minPf: number; minC: number;
  games: number;
}
/** Last `weeks` season-weeks of per-position minutes, oldest→newest. */
export async function getPlayerWeeklyMinutes(playerId: number, weeks?: number): Promise<WeekMinutes[]>;

export interface PlanRow {
  id: number; playerId: number; name: string;
  blocks: Array<{ trainingId: number; weeks: number }>;
  coachLevel: number; youthTrainerLevel: number; planNotes: string | null; updatedAt: Date;
}
export async function getActivePlan(playerId: number): Promise<PlanRow | null>;
```

`getPlayerWeeklyMinutes`: `select m.season, m.season_week, sum(pmm.min_pg)…, count(*) as games from player_match_minutes pmm join matches m using (match_id) where pmm.player_id = $1 and m.season_week is not null group by 1,2 order by 1,2` (Drizzle `sql` template like `src/queries/players.ts` does), limited to the last `weeks ?? 20` rows.

- [ ] Implement, `npx tsc --noEmit` clean, commit — `feat(v2): weekly minutes + training plan queries`.

---

### Task 7: Training bridge (snapshot→engine) + plan templates

**Files:**
- Create: `v2/src/lib/training/bridge.ts`, `v2/src/lib/training/templates.ts`
- Test: `v2/src/lib/training/bridge.test.ts`

**Interfaces (produces):**

```ts
// bridge.ts
import type { PlayerState, WeekConfig } from './engine';
import type { WeekMinutes } from '@/queries/minutes'; // type-only import is fine (no IO)

/** displayed integer skills -> engine sublevel state (displayed − 0.5, min 0.5). */
export function playerStateFromSnapshot(input: {
  skills: Partial<Record<string, number | null>>; // v2 snake_case keys (jump_shot, …)
  age: number; heightCm: number; potential: number;
  stamina?: number | null; freeThrow?: number | null;
}): PlayerState;

/** Sum a week's minutes over a training type's qualifying positions. */
export function minutesAtPositions(week: WeekMinutes, trainingId: number): number;

/** Training-type ids trainable at FULL rate given a week's minutes and the player's age. */
export function eligibleTrainings(week: WeekMinutes, age: number): number[];

/** Expand PlanBlock[] into the engine's WeekConfig[]. */
export function planToWeeks(
  blocks: Array<{ trainingId: number; weeks: number }>,
  coachLevel: number, youthTrainerLevel: number,
): WeekConfig[];
```

Thresholds by age reuse `BBSCOUT.minutes.value` bands (import `BBSCOUT`). `eligibleTrainings`
returns ids 1–31 whose positions' summed minutes ≥ band threshold (ST/FT 32/33 always
eligible — whole-roster trainings).

```ts
// templates.ts — U-21 archetype plan templates (user conventions) + senior references
// (docs/research/training/user-notes/in-depth-guide-extraction.md). Data only.
export interface PlanTemplate {
  key: string; name: string; forType: 'outside' | 'big' | 'any';
  blocks: Array<{ trainingId: number; weeks: number }>;
  description: string;
}
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    key: 'u21-outside-draftee', name: 'U-21 outside draftee', forType: 'outside',
    description: '1on1 guards ~1.5 seasons, then OD / JS / JR / PA',
    blocks: [
      { trainingId: 15, weeks: 21 }, // 1on1 guards (DR for 12)
      { trainingId: 9, weeks: 10 },  // OD for 1
      { trainingId: 1, weeks: 8 },   // JS for 12
      { trainingId: 6, weeks: 6 },   // JR for 12
      { trainingId: 18, weeks: 6 },  // PA for 1
    ],
  },
  {
    key: 'u21-big-is', name: 'U-21 big: IS → ID → RB', forType: 'big',
    description: 'Inside scoring first, then interior defense and boards',
    blocks: [
      { trainingId: 21, weeks: 14 }, { trainingId: 24, weeks: 14 }, { trainingId: 27, weeks: 12 },
    ],
  },
  {
    key: 'u21-big-sb', name: 'U-21 big: SB → ID → RB', forType: 'big',
    description: 'Shot blocking first variant',
    blocks: [
      { trainingId: 29, weeks: 14 }, { trainingId: 24, weeks: 14 }, { trainingId: 27, weeks: 12 },
    ],
  },
  {
    key: 'guard-1v1F-jsf', name: 'Senior guard opening (guide)', forType: 'outside',
    description: '1v1 forwards for HA/DR+JS elastic, then JS forwards (In-Depth guide)',
    blocks: [
      { trainingId: 16, weeks: 18 }, // 1on1 forwards (DR for 34)
      { trainingId: 2, weeks: 10 },  // JS for 34
      { trainingId: 21, weeks: 8 },  // IS for 5
      { trainingId: 9, weeks: 10 },  // OD for 1
      { trainingId: 18, weeks: 6 },  // PA for 1
    ],
  },
];
```

- [ ] **Step 1: failing tests**

```ts
// v2/src/lib/training/bridge.test.ts
import { describe, expect, it } from 'vitest';
import { eligibleTrainings, minutesAtPositions, planToWeeks, playerStateFromSnapshot } from './bridge';

const wk = (m: Partial<Record<'minPg'|'minSg'|'minSf'|'minPf'|'minC', number>>) => ({
  season: 40, seasonWeek: 5, games: 2,
  minPg: 0, minSg: 0, minSf: 0, minPf: 0, minC: 0, ...m,
});

describe('bridge', () => {
  it('converts displayed skills to sublevel midpoints', () => {
    const p = playerStateFromSnapshot({
      skills: { jump_shot: 8, jump_range: 6, outside_def: 7, handling: 9, driving: 7, passing: 10,
                inside_shot: 4, inside_def: 3, rebounding: 5, shot_blocking: 2 },
      age: 19, heightCm: 190, potential: 8, stamina: 6, freeThrow: 5,
    });
    expect(p.skills.js).toBe(7.5);
    expect(p.skills.sb).toBe(1.5);
    expect(p.ftSkill).toBe(4.5);
    expect(p.age).toBe(19);
  });

  it('sums minutes over a training type qualifying positions', () => {
    const w = wk({ minPg: 20, minSg: 28 });
    expect(minutesAtPositions(w, 15)).toBe(48); // DR for 12 = PG+SG
    expect(minutesAtPositions(w, 21)).toBe(0);  // IS for 5 = C
  });

  it('eligible trainings respect the age threshold (18yo needs 44)', () => {
    const w = wk({ minPg: 24, minSg: 20 }); // 44 at guard slots
    const ids = eligibleTrainings(w, 18);
    expect(ids).toContain(15); // guards training reachable
    expect(ids).not.toContain(21); // no C minutes
    expect(ids).toContain(32); // stamina always
  });

  it('expands plan blocks to week configs', () => {
    const weeks = planToWeeks([{ trainingId: 15, weeks: 2 }, { trainingId: 9, weeks: 1 }], 6, 4);
    expect(weeks).toHaveLength(3);
    expect(weeks[0]).toEqual({ trainingId: 15, coachLevel: 6, youthTrainerLevel: 4 });
    expect(weeks[2].trainingId).toBe(9);
  });
});
```

- [ ] **Steps 2-4:** verify fail → implement → `npm test -- bridge` PASS + full suite.
- [ ] **Step 5: Commit** — `feat(v2): training bridge (snapshots→engine, eligibility) + plan templates`

---

### Task 8: MinutesStrip component

**Files:**
- Create: `v2/src/components/player/MinutesStrip.tsx`

Server-renderable presentational component (no 'use client' needed — pure props→SVG):
props `{ weeks: WeekMinutes[]; age: number | null }`. Render:
- One stacked bar per season-week (x label `S{season}W{week}`, every other label to avoid crowding), segments bottom-up PG/SG/SF/PF/C with colors PG `#60a5fa`, SG `#34d399`, SF `#a78bfa`, PF `#f59e0b`, C `#f87171`; bar height ∝ total minutes, y-axis 0–96+.
- A dashed horizontal threshold line at the age's full-training minutes (from `BBSCOUT.minutes.value` bands via a small exported helper in bridge.ts — add `fullTrainingMinutes(age: number): number` there in this task, with a one-line test appended to bridge.test.ts).
- Legend row + empty state (`No match minutes captured yet — the weekly sync fills this in.`).
- Below the chart: for the LATEST week, a line of chips naming eligible trainings (`eligibleTrainings` → `getTrainingType(id).name`, skill trainings only), or "No full-training slot last week".

SVG idiom: follow `TimeSeriesChart.tsx` (viewBox 640×180, pad 32, neutral grid `#262626`, labels `#737373`, fontSize 9).

- [ ] Implement; add `fullTrainingMinutes` + test; `npm test` PASS; commit — `feat(v2): weekly position-minutes strip component`.

---

### Task 9: Development section — cap bar, projection band chart, plan editor

**Files:**
- Create: `v2/src/components/charts/BandChart.tsx`
- Create: `v2/src/components/player/CapBar.tsx`
- Create: `v2/src/components/player/PlanEditor.tsx` (client)
- Create: `v2/src/components/player/DevelopmentSection.tsx` (client wrapper that owns plan state and recomputes the projection)
- Modify: `v2/src/app/players/[id]/actions.ts` (add `savePlan` server action — read the file first and mirror the existing action conventions incl. revalidatePath)

**Interfaces:**
- `BandChart`: props `{ points: Array<{ x: number; central: number; low: number; high: number }>; height?: number; formatY?: (v: number) => string; xLabel?: (x: number) => string }`. SVG: shaded band (path area low→high, `fill="#f59e0b22"`), central line `#f59e0b`, grid like TimeSeriesChart.
- `CapBar`: props `{ skills: Record<string, number | null>; potential: number | null }`. Uses `potentialScore`, `capThreshold` from `@/lib/training/salary` (convert snake_case→`skillsFromArray` order via `SKILL_DB_NAMES`; skip if any of the 10 skills null → render dash state). Renders a horizontal bar: fill = score / (10+2·potential) (the deepest stage), with tick marks at the three stage thresholds (8/9/10 + 2p) labeled "soft cap" / "" / "hard cap", the current score, and the cap position (e.g. "capping via SF"). Colors: below stage 1 `#34d399`, stages 1→3 `#f59e0b`→`#f87171`.
- `PlanEditor` (client): props `{ value: { blocks; coachLevel; youthTrainerLevel }; onChange(next): void; onSave(): void; saving: boolean; templates: PlanTemplate[] }`. UI: template `<select>` ("Start from template…") that replaces blocks; block rows [training select (TRAINING_CATALOG names, ids 1–33) | weeks number input | ✕]; "+ add block"; coach level select 1–7; youth trainer select 0–7; total weeks + end-age preview text; Save button. No form library — `useState` per the codebase convention.
- `DevelopmentSection` (client): props `{ playerId; playerState: PlayerState | null; startWeekOfSeason: number; weeks: WeekMinutes[]; age: number | null; initialPlan: PlanRow | null; templates: PlanTemplate[]; skillsDb: Record<string, number | null>; potential: number | null }`. Owns plan state (from initialPlan or a default: first template + coach 5 + yt 0, not yet saved). Computes on every plan change (useMemo): `ensembleProject(playerState, planToWeeks(blocks, coach, yt), { startWeekOfSeason })` → BandChart points = per-week TSP (x = week index, central = bbscout cumulative TSP, low/high across models — compute from `byModel` week results: for each model accumulate skills per week and take TSP min/max; implement a small helper `bandSeries(result: EnsembleResult): Array<{x, central, low, high}>` in `src/lib/training/bridge.ts` — NOTE: `EnsembleResult.byModel[*].weeks[i].result.skillsAfter` already holds per-week skills). Below the chart: final-skills table (10 rows: skill, now (displayed), projected central (1 decimal), [low..high], + pop count), salary now→projected via `estimateSalary`, final age. Renders `CapBar` with CURRENT skills and with PROJECTED central skills side by side (labels "now" / "end of plan"). Save calls the `savePlan` server action with the current value, `useTransition` for pending state.
- `savePlan(playerId, data: { name; blocks; coachLevel; youthTrainerLevel })`: upsert — deactivate other plans for the player (`update training_plans set is_active=false where player_id=$1`), insert new active row (name default "Plan"), `revalidatePath('/players/[id]')` per existing convention.

Sanity constraints to enforce in `savePlan` (server-side): blocks length 1–40, each `trainingId` 1–33 integer, `weeks` 1–140 integer, total weeks ≤ 140, coach 1–7, yt 0–7. Throw on violation.

- [ ] Implement all five files + action. Type-check may need the `PlanRow`/`WeekMinutes` types imported type-only into client components — that's fine.
- [ ] `npm test` + `npx tsc --noEmit` clean (pre-existing table.test.ts error excepted).
- [ ] Commit — `feat(v2): Development section — cap bar, projection bands, plan editor`.

---

### Task 10: Wire Development section into the player page

**Files:**
- Modify: `v2/src/app/players/[id]/page.tsx`
- Modify: `v2/src/queries/player-detail.ts` (nothing to add if T6 queries are called from the page — call them from the page, keep player-detail untouched)

In the page component, after loading `detail`:

```ts
import { getActivePlan, getPlayerWeeklyMinutes } from '@/queries/minutes';
import { playerStateFromSnapshot } from '@/lib/training/bridge';
import { PLAN_TEMPLATES } from '@/lib/training/templates';
import DevelopmentSection from '@/components/player/DevelopmentSection';
import MinutesStrip from '@/components/player/MinutesStrip';
```

```ts
  const [weeklyMinutes, activePlan] = await Promise.all([
    getPlayerWeeklyMinutes(player.bbPlayerId),
    getActivePlan(player.bbPlayerId),
  ]);
  const fullSkills = profile.skills && Object.values(profile.skills).filter((v) => v != null).length >= 10;
  const playerState = fullSkills && player.ageNow != null && player.heightCm != null
    ? playerStateFromSnapshot({
        skills: profile.skills, age: player.ageNow, heightCm: player.heightCm,
        potential: profile.potential ?? player.potential ?? 0,
        stamina: profile.skills.stamina, freeThrow: profile.skills.free_throw,
      })
    : null;
```

Insert two sections between ProfileCard and Archetypes:

```tsx
      <section className="mt-6">
        <h2 className="font-medium mb-2">Weekly minutes by position</h2>
        <MinutesStrip weeks={weeklyMinutes} age={player.ageNow} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Development</h2>
        {playerState ? (
          <DevelopmentSection
            playerId={player.bbPlayerId}
            playerState={playerState}
            startWeekOfSeason={1}
            weeks={weeklyMinutes}
            age={player.ageNow}
            initialPlan={activePlan}
            templates={PLAN_TEMPLATES}
            skillsDb={profile.skills}
            potential={profile.potential ?? player.potential}
          />
        ) : (
          <p className="text-sm text-neutral-500">Needs a full-skill snapshot (census or API) to project development.</p>
        )}
      </section>
```

`startWeekOfSeason`: compute from `seasonNow`'s start via `seasonWeekOf` — add the season
start to the page's data (`getCurrentSeasonId` exists; add `getCurrentSeasonStart()` to
`src/queries/players.ts` if not present — check first) and clamp to 1..14.

- [ ] Wire, run `npm run build` (must compile — this is the first page-level integration), `npm test`, commit — `feat(v2): Development + minutes sections on player page`.

---

### Task 11: Settings sync row for minutes

**Files:**
- Modify: settings page data-sync card + `v2/src/lib/format-sync.tsx` — READ `src/app/settings/` and `format-sync.tsx` first; add a "Match minutes" row following the existing per-job row pattern exactly: schedule chip "daily", description "Pulls each tracked club's finished matches and per-position minutes from BB boxscores.", last-run line from `sync_log` where `job_type='minutes'`, "Sync now" button hitting `/api/sync/minutes`.

- [ ] Implement, `npm run build` + `npm test` pass, commit — `feat(v2): minutes job row on settings page`.

---

### Task 12: Deployment + live validation (ORCHESTRATOR ONLY — not a subagent)

- [ ] `npx drizzle-kit migrate` against Neon (DATABASE_URL from `.env.local`).
- [ ] Validate live schedule XML shape: run a one-off probe of `schedule.aspx` for one
  known club id via a tiny tsx script using `fetchSchedule`; if the real shape differs
  from the fixture, fix `parseScheduleXml` + fixture and re-run T2 tests.
- [ ] Run `npm run backfill:minutes` for the current season (long; run in background, watch counts converge).
- [ ] Spot-check data: a known U-21 prospect has plausible weekly minutes rows.
- [ ] Use the `verify` skill: build, launch, drive to a player page; confirm minutes strip +
  Development section render; screenshot.
- [ ] Update Hetzner cron doc note in CLAUDE.md (no Hetzner change needed — same daily
  endpoint now also syncs minutes) + record Phase B in CLAUDE.md v2 section.
- [ ] Push main; confirm Vercel deploy.

## Self-Review

- Spec §4 (tables, weekly job, backfill, week bucketing) → T1, T3, T5; bucketing = deterministic 7-day season weeks (spec's "resolve training-update timing empirically" is consciously simplified for v1 of the pipeline — matches are bucketed by calendar season-week; refine when inference lands in Phase C).
- Spec §5 product 1 (Development tab: minutes strip, inferred club training, cap bar, projection with bands, plan editor) → T8/T9/T10; "inferred club training" is Phase C — the strip shows *eligible* trainings instead (explicitly in-scope subset).
- Type consistency: `WeekMinutes` produced in T6, consumed T7/T8/T9/T10; `PlanRow` T6→T9/T10; `PlanTemplate` T7→T9/T10; `bandSeries` helper lives in bridge.ts (T9 adds it — noted in T9 body); `fullTrainingMinutes` added to bridge in T8 (noted).
- Placeholders: schedule-XML shape is flagged as fixture-vs-live risk with an explicit live validation step (T12) — a known unknown, not a placeholder.
