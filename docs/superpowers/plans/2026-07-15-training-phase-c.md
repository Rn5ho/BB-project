# Training Planner Phase C — Inference Flywheel + Cohort Board

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Infer what training each tracked club is actually running (from position minutes + observed skill pops), anchor skill sublevels to observed pop dates, and ship a `/planner` cohort board ranking all Slovenian 18–21 prospects by development gap (optimal vs. actual training) with NT-track TSP benchmarks.

**Architecture:** Pure-TS libs in `v2/src/lib/training/` (pop detection, inference scoring, sublevel bounds, benchmarks, board computation — all vitest-covered), one new DB-only sync job `runTrainingInference` (no BB calls; rebuilds `skill_pops` + `training_observations` from snapshots + minutes), and a server-rendered `/planner` page with a client sort/filter table. Key insight: BB clubs pick ONE training type per week, so evidence pools across all tracked players of a club. Key constraint: weekly `api` snapshots are light (no skills) — pops are only observable between full-skill snapshots (census/market/manual), so inference works on multi-week windows, not per-week.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Neon Postgres, vitest, existing training engine (`weekStep`/`project`, bbscout model).

## Global Constraints

- Work from `v2/` (all commands below run there). Repo root is one level up.
- This is Next.js 16 with breaking changes — read `node_modules/next/dist/docs/` guides before writing app-router code you're unsure about. Server→client component props must be JSON-serializable (no functions, no Date objects — pass ISO strings).
- In client components use `toLocaleString('en-US')` (server/client locale hydration mismatch otherwise).
- `npm test` is already `vitest run` — do NOT append `run` (it becomes a filename filter). Run a single file with `npm test -- src/lib/training/pops.test.ts`.
- `db.execute(sql...)` (raw SQL) returns timestamptz columns as STRINGS — wrap in `new Date(...)`. `db.select()` returns real Dates.
- Migrations: edit `src/db/schema.ts`, then `npx drizzle-kit generate --name <name>`, inspect the SQL in `drizzle/`, then `npx drizzle-kit migrate`. Migration 0007 is the latest applied.
- Engine skill values are decimal sublevels; displayed value = `ceil` clamped 1–20. Bridge convention: displayed N ↔ sublevel N−0.5 (midpoint); "display-equivalent" = sublevel+0.5.
- Skill keys: `SKILL_KEYS = ['js','jr','od','ha','dr','pa','is','id','rb','sb']` (10 rate skills); stamina/free-throw are separate (`st`/`ft` where 12-skill sets are needed). Snapshot columns are snake_case via `SKILL_DB_NAMES`.
- Commit prefix: `feat(v2):` / `fix(v2):` / `docs:`. Commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Dark theme, Tailwind utility classes matching existing components (`border-neutral-800`, `bg-neutral-900/40`, amber accents).

---

### Task 1: Schema + migration — `skill_pops` and `training_observations`

**Files:**
- Modify: `src/db/schema.ts` (append at end)
- Generated: `drizzle/0008_*.sql`

**Interfaces:**
- Produces: Drizzle tables `skillPops`, `trainingObservations` (exported via existing `export * from './schema'` in `src/db/index.ts` — no index change needed).
- `skill_pops.skill` holds `'js'…'sb'` plus `'st'`/`'ft'`. `source='snapshots'` rows are wiped+rebuilt by the inference job; `source='own-scrape'` rows persist (written by the training-history scraper, exact dates: windowStart == windowEnd).

- [ ] **Step 1: Append tables to `src/db/schema.ts`**

```ts
export const skillPops = pgTable('skill_pops', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  skill: text('skill').notNull(), // 'js'|'jr'|'od'|'ha'|'dr'|'pa'|'is'|'id'|'rb'|'sb'|'st'|'ft'
  toDisplayed: integer('to_displayed').notNull(),
  delta: integer('delta').notNull(), // displayed change over the window; negative = drop
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  windowWeeks: integer('window_weeks').notNull(),
  source: text('source', { enum: ['snapshots', 'own-scrape'] }).notNull().default('snapshots'),
}, (t) => [
  index('idx_skill_pops_player').on(t.playerId),
  uniqueIndex('uq_skill_pops').on(t.playerId, t.skill, t.windowEnd, t.source),
]);

export const trainingObservations = pgTable('training_observations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  inferredTrainingId: integer('inferred_training_id'), // null = no usable signal
  confidence: text('confidence', { enum: ['high', 'medium', 'low'] }).notNull(),
  evidence: jsonb('evidence').notNull(), // { popCount, playerCount, explainedFrac, scores, playerIds }
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_training_obs_team').on(t.teamId, t.windowEnd.desc()),
  uniqueIndex('uq_training_obs').on(t.teamId, t.windowStart, t.windowEnd),
]);
```

- [ ] **Step 2: Generate + inspect + apply migration**

Run: `npx drizzle-kit generate --name phase_c_inference`
Expected: new `drizzle/0008_phase_c_inference.sql` containing exactly the two CREATE TABLE statements + 3 indexes + FK. Inspect it.
Run: `npx drizzle-kit migrate`
Expected: exit 0, tables created in Neon.

- [ ] **Step 3: Verify tables exist**

Run: `node -e "const {neon}=require('@neondatabase/serverless');require('dotenv').config({path:'.env.local'});neon(process.env.DATABASE_URL)\`select count(*) from skill_pops union all select count(*) from training_observations\`.then(console.log)"`
Expected: two rows of `{ count: '0' }`.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(v2): skill_pops + training_observations tables (migration 0008)"
```

---

### Task 2: Pop detection lib (`src/lib/training/pops.ts`)

**Files:**
- Create: `src/lib/training/pops.ts`
- Test: `src/lib/training/pops.test.ts`

**Interfaces:**
- Consumes: `SKILL_KEYS`, `SkillKey` from `./types`.
- Produces: `PopSkill = SkillKey | 'st' | 'ft'`; `FullSnap { capturedAt: Date; skills: Partial<Record<PopSkill, number | null>> }`; `PopEvent { skill: PopSkill; toDisplayed: number; delta: number; windowStart: Date; windowEnd: Date; windowWeeks: number }`; `detectPops(snaps: FullSnap[]): PopEvent[]`. Task 5 calls `detectPops` per snapshot pair; Task 4 consumes `PopEvent`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/training/pops.test.ts
import { describe, expect, it } from 'vitest';
import { detectPops, type FullSnap } from './pops';

const d = (s: string) => new Date(s);
const snap = (iso: string, skills: FullSnap['skills']): FullSnap => ({ capturedAt: d(iso), skills });

describe('detectPops', () => {
  it('emits a pop between consecutive snapshots with window metadata', () => {
    const events = detectPops([
      snap('2026-06-01T00:00:00Z', { js: 7, dr: 10 }),
      snap('2026-06-15T00:00:00Z', { js: 8, dr: 10 }),
    ]);
    expect(events).toEqual([{
      skill: 'js', toDisplayed: 8, delta: 1,
      windowStart: d('2026-06-01T00:00:00Z'), windowEnd: d('2026-06-15T00:00:00Z'), windowWeeks: 2,
    }]);
  });

  it('emits drops with negative delta and multi-level deltas', () => {
    const events = detectPops([
      snap('2026-06-01T00:00:00Z', { st: 6, is: 5 }),
      snap('2026-06-29T00:00:00Z', { st: 5, is: 7 }),
    ]);
    expect(events).toContainEqual(expect.objectContaining({ skill: 'st', delta: -1, toDisplayed: 5 }));
    expect(events).toContainEqual(expect.objectContaining({ skill: 'is', delta: 2, toDisplayed: 7, windowWeeks: 4 }));
  });

  it('skips null skills, same values, and same-day pairs; sorts unsorted input', () => {
    const events = detectPops([
      snap('2026-06-10T08:00:00Z', { js: 8 }),          // out of order on purpose
      snap('2026-06-01T00:00:00Z', { js: 7, od: null }),
      snap('2026-06-10T09:00:00Z', { js: 9 }),           // 1h later — same-day, no window
    ]);
    expect(events).toEqual([expect.objectContaining({ skill: 'js', toDisplayed: 8, delta: 1, windowWeeks: 1 })]);
  });

  it('short window still counts as 1 week', () => {
    const events = detectPops([
      snap('2026-06-01T00:00:00Z', { rb: 4 }),
      snap('2026-06-03T00:00:00Z', { rb: 5 }),
    ]);
    expect(events[0].windowWeeks).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/training/pops.test.ts`
Expected: FAIL — cannot resolve `./pops`.

- [ ] **Step 3: Implement `src/lib/training/pops.ts`**

```ts
import { SKILL_KEYS, type SkillKey } from './types';

export type PopSkill = SkillKey | 'st' | 'ft';
export const POP_SKILLS: PopSkill[] = [...SKILL_KEYS, 'st', 'ft'];

export interface FullSnap {
  capturedAt: Date;
  skills: Partial<Record<PopSkill, number | null>>; // displayed ints
}

export interface PopEvent {
  skill: PopSkill;
  toDisplayed: number; // displayed value at windowEnd
  delta: number;       // signed displayed change over the window (never 0)
  windowStart: Date;
  windowEnd: Date;
  windowWeeks: number; // max(1, round(days / 7))
}

/** Displayed-level changes between consecutive full snapshots. Same-day pairs
 *  (< 12h apart) carry no training window and are skipped. */
export function detectPops(snaps: FullSnap[]): PopEvent[] {
  const sorted = [...snaps].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const events: PopEvent[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const days = (cur.capturedAt.getTime() - prev.capturedAt.getTime()) / 86_400_000;
    if (days < 0.5) continue;
    const windowWeeks = Math.max(1, Math.round(days / 7));
    for (const k of POP_SKILLS) {
      const a = prev.skills[k];
      const b = cur.skills[k];
      if (a == null || b == null || a === b) continue;
      events.push({
        skill: k, toDisplayed: b, delta: b - a,
        windowStart: prev.capturedAt, windowEnd: cur.capturedAt, windowWeeks,
      });
    }
  }
  return events;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/training/pops.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/pops.ts src/lib/training/pops.test.ts
git commit -m "feat(v2): pop detection from consecutive full snapshots"
```

---

### Task 3: TSP benchmarks lib (`src/lib/training/benchmarks.ts`)

**Files:**
- Create: `src/lib/training/benchmarks.ts`
- Test: `src/lib/training/benchmarks.test.ts`

**Interfaces:**
- Consumes: `Param<T>` from `./types`.
- Produces: `TSP_BENCHMARKS: Param<Record<number, number>>`, `benchmarkTsp(age: number, seasonWeek: number): number | null`, `benchmarkDelta(tsp: number, age: number, seasonWeek: number): number | null`. Task 9 consumes `benchmarkDelta`. Benchmark TSP is the 12-skill TSP (matches the `snapshots.tsp` column).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/training/benchmarks.test.ts
import { describe, expect, it } from 'vitest';
import { benchmarkDelta, benchmarkTsp } from './benchmarks';

describe('benchmarkTsp', () => {
  it('returns season-start values at week 1', () => {
    expect(benchmarkTsp(18, 1)).toBe(55);
    expect(benchmarkTsp(21, 1)).toBe(100);
  });
  it('lerps toward the next age within the season', () => {
    // age 18 midway (week 8): 55 + (70-55) * 7/14 = 62.5
    expect(benchmarkTsp(18, 8)).toBeCloseTo(62.5, 5);
  });
  it('returns null off-table', () => {
    expect(benchmarkTsp(17, 1)).toBeNull();
    expect(benchmarkTsp(25, 1)).toBeNull();
  });
});

describe('benchmarkDelta', () => {
  it('positive = ahead of NT track', () => {
    expect(benchmarkDelta(60, 18, 1)).toBe(5);
    expect(benchmarkDelta(90, 21, 1)).toBe(-10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/training/benchmarks.test.ts`
Expected: FAIL — cannot resolve `./benchmarks`.

- [ ] **Step 3: Implement `src/lib/training/benchmarks.ts`**

```ts
import type { Param } from './types';

/** NT-track season-START 12-skill TSP by age, thread 323477 (2024).
 *  Ages 18–21 measured (21 = midpoint of the stated 95–105 range);
 *  22 is a slope extrapolation used only to interpolate inside age-21 seasons. */
export const TSP_BENCHMARKS: Param<Record<number, number>> = {
  value: { 18: 55, 19: 70, 20: 83, 21: 100, 22: 112 },
  source: 'docs/research/training/forum-research/gated/FINDINGS.md item 6 (thread 323477)',
  confidence: 'measured',
};

/** Benchmark TSP at a given age + season week (linear within the 14-week season).
 *  Null when the age is off-table (only 18–21 are NT-track ages; 22 is interpolation-only). */
export function benchmarkTsp(age: number, seasonWeek: number): number | null {
  if (age < 18 || age > 21) return null;
  const table = TSP_BENCHMARKS.value;
  const start = table[age];
  const next = table[age + 1];
  if (start === undefined) return null;
  if (next === undefined) return start;
  const frac = Math.min(1, Math.max(0, (seasonWeek - 1) / 14));
  return start + (next - start) * frac;
}

/** Player TSP minus the NT-track benchmark (positive = ahead). */
export function benchmarkDelta(tsp: number, age: number, seasonWeek: number): number | null {
  const b = benchmarkTsp(age, seasonWeek);
  return b == null ? null : tsp - b;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/training/benchmarks.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/benchmarks.ts src/lib/training/benchmarks.test.ts
git commit -m "feat(v2): NT-track TSP benchmarks (thread 323477)"
```

---

### Task 4: Club training inference scoring (`src/lib/training/infer.ts`)

**Files:**
- Create: `src/lib/training/infer.ts`
- Test: `src/lib/training/infer.test.ts`

**Interfaces:**
- Consumes: `weekStep`, `PlayerState` from `./engine`; `minutesAtPositions` from `./bridge`; `TRAINING_CATALOG`, `getTrainingType` from `./catalog`; `BBSCOUT` from `./models/bbscout`; `PopEvent` from `./pops`; `WeekMinutes` type from `@/queries/minutes`.
- Produces: `PlayerWindowEvidence`, `InferenceResult`, `inferClubTraining(evidence: PlayerWindowEvidence[]): InferenceResult`. Task 5 calls this per club-window group.

Scoring model (spec §4: "simple scoring first — which eligible training best explains the pops under bbscout rates"): for each skill-kind training type, predict per-skill gains = sum of `weekStep` gains over the window's minutes-weeks (coach level 5 assumed — ×1.00 neutral), scaled to full window length when minutes coverage is partial. A training "explains" the window when it predicts the pops that happened AND does not predict pops that didn't: `score = explained − 0.5·contradiction`, where `explained = Σ_popped min(predicted, observed delta)` and `contradiction = Σ_non-popped max(0, predicted − 1.0)` (a non-popped displayed integer can hide up to ~1 level of sublevel gain — predictions beyond that contradict the observation; dropped skills are excluded from both sums). Without the contradiction term, one pop saturates `min(pred, delta)` for every training whose secondary rate reaches the delta and ties get broken by catalog order. ST/FT pops are excluded (gym scatter + training court pop them independently of the weekly slot). Confidence needs a margin over the best training with a *different primary skill* (same-primary position variants trivially near-tie). Per-skill deltas are summed per skill across a player's pop events before scoring.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/training/infer.test.ts
import { describe, expect, it } from 'vitest';
import { inferClubTraining, type PlayerWindowEvidence } from './infer';
import { getTrainingType } from './catalog';
import { skillsFromArray } from './types';
import type { WeekMinutes } from '@/queries/minutes';

const week = (over: Partial<WeekMinutes>): WeekMinutes => ({
  season: 72, seasonWeek: 5, minPg: 0, minSg: 0, minSf: 0, minPf: 0, minC: 0, games: 1, ...over,
});

const guardState = {
  skills: skillsFromArray([7.5, 5.5, 6.5, 8.5, 9.5, 6.5, 3.5, 3.5, 3.5, 2.5]),
  age: 18, heightCm: 190, potential: 8,
};
const bigState = {
  skills: skillsFromArray([4.5, 2.5, 3.5, 4.5, 4.5, 3.5, 8.5, 6.5, 7.5, 5.5]),
  age: 18, heightCm: 210, potential: 9,
};

describe('inferClubTraining', () => {
  it('returns null inference when there are no rate-skill pops', () => {
    const r = inferClubTraining([{
      playerId: 1, state: guardState, windowWeeks: 4,
      pops: [{ skill: 'ft', toDisplayed: 6, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [week({ minPg: 40 })],
    }]);
    expect(r.inferredTrainingId).toBeNull();
    expect(r.confidence).toBe('low');
  });

  it('attributes a DR pop on a PG-minutes guard to a One-on-One variant', () => {
    const r = inferClubTraining([{
      playerId: 1, state: guardState, windowWeeks: 4,
      pops: [{ skill: 'dr', toDisplayed: 11, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [week({ minPg: 48 }), week({ seasonWeek: 6, minPg: 48 }), week({ seasonWeek: 7, minPg: 44 }), week({ seasonWeek: 8, minPg: 48 })],
    }]);
    expect(r.inferredTrainingId).not.toBeNull();
    expect(getTrainingType(r.inferredTrainingId!).primary).toBe('dr');
  });

  it('pooling two players raises confidence over one', () => {
    const one: PlayerWindowEvidence = {
      playerId: 1, state: bigState, windowWeeks: 4,
      pops: [{ skill: 'is', toDisplayed: 10, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [week({ minPf: 48 }), week({ seasonWeek: 6, minPf: 48 }), week({ seasonWeek: 7, minPf: 48 }), week({ seasonWeek: 8, minPf: 48 })],
    };
    const two: PlayerWindowEvidence = {
      ...one, playerId: 2,
      pops: [
        { skill: 'is', toDisplayed: 9, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 },
        { skill: 'is', toDisplayed: 10, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 },
      ],
      weeks: one.weeks.map((w) => ({ ...w, minPf: 0, minC: 48 })),
    };
    const solo = inferClubTraining([one]);
    const pooled = inferClubTraining([one, two]);
    expect(getTrainingType(pooled.inferredTrainingId!).primary).toBe('is');
    const rank = { low: 0, medium: 1, high: 2 } as const;
    expect(rank[pooled.confidence]).toBeGreaterThanOrEqual(rank[solo.confidence]);
    expect(pooled.popCount).toBe(3);
  });

  it('handles players with no minutes rows (falls back to assumed-full minutes)', () => {
    const r = inferClubTraining([{
      playerId: 1, state: bigState, windowWeeks: 4,
      pops: [{ skill: 'rb', toDisplayed: 9, delta: 1, windowStart: new Date(0), windowEnd: new Date(0), windowWeeks: 4 }],
      weeks: [],
    }]);
    expect(r.inferredTrainingId).not.toBeNull();
    expect(getTrainingType(r.inferredTrainingId!).primary).toBe('rb');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/training/infer.test.ts`
Expected: FAIL — cannot resolve `./infer`.

- [ ] **Step 3: Implement `src/lib/training/infer.ts`**

```ts
import { minutesAtPositions } from './bridge';
import { getTrainingType, TRAINING_CATALOG } from './catalog';
import { weekStep, type PlayerState } from './engine';
import { BBSCOUT } from './models/bbscout';
import { SKILL_KEYS, type SkillKey, type Skills } from './types';
import type { PopEvent } from './pops';
import type { WeekMinutes } from '@/queries/minutes';

export interface PlayerWindowEvidence {
  playerId: number;
  state: PlayerState;   // at windowStart (earlier snapshot, midpoint sublevels)
  pops: PopEvent[];     // this player's displayed changes over the window
  weeks: WeekMinutes[]; // season-weeks overlapping the window (may be empty)
  windowWeeks: number;
}

export interface InferenceResult {
  inferredTrainingId: number | null;
  confidence: 'high' | 'medium' | 'low';
  scores: Array<{ trainingId: number; score: number }>; // top 5, desc
  popCount: number;     // positive rate-skill displayed levels across players
  playerCount: number;
  explainedFrac: number | null; // top score / popCount
}

/** 'superior' = ×1.00 — neutral assumption for clubs whose staff we can't see. */
const ASSUMED_COACH_LEVEL = 5;

/** A non-popped displayed integer can hide up to ~1 level of sublevel gain; predicted
 *  gains beyond that on a skill that did NOT pop contradict the observation. */
const CONTRADICTION_TOLERANCE = 1.0;
const CONTRADICTION_WEIGHT = 0.5;

const isRateSkill = (s: string): s is SkillKey => (SKILL_KEYS as readonly string[]).includes(s);

/** Predicted per-skill gains if the club ran training `tid` for the whole window. */
function predictedGains(ev: PlayerWindowEvidence, tid: number): Skills {
  const total = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Skills;
  if (ev.weeks.length === 0) {
    // No minutes data: rate signal only, assume full minutes.
    const r = weekStep(ev.state, { trainingId: tid, coachLevel: ASSUMED_COACH_LEVEL }, BBSCOUT);
    for (const k of SKILL_KEYS) total[k] = r.gains[k] * ev.windowWeeks;
    return total;
  }
  for (const w of ev.weeks) {
    const minutes = minutesAtPositions(w, tid);
    const r = weekStep(ev.state, { trainingId: tid, coachLevel: ASSUMED_COACH_LEVEL, minutes }, BBSCOUT);
    for (const k of SKILL_KEYS) total[k] += r.gains[k];
  }
  // Weeks without boxscore coverage: extrapolate from the observed weeks' average.
  const scale = ev.windowWeeks / ev.weeks.length;
  for (const k of SKILL_KEYS) total[k] *= scale;
  return total;
}

/** Which single weekly training best explains a club-window's pooled pops.
 *  A training must both predict the pops that happened (explained, capped at the
 *  observed delta) and NOT predict pops that didn't happen (contradiction penalty) —
 *  without the penalty, one pop saturates min(pred, delta) for every training whose
 *  secondary rates reach the delta and ties fall to catalog order.
 *  ST/FT pops are excluded (training court + gym scatter pop them regardless of the slot),
 *  which also means Team Stamina / Team Free Throws weeks are not inferable — by design. */
export function inferClubTraining(evidence: PlayerWindowEvidence[]): InferenceResult {
  const rated = evidence.map((ev) => {
    const popped = new Map<SkillKey, number>();
    const dropped = new Set<SkillKey>();
    for (const p of ev.pops) {
      if (!isRateSkill(p.skill)) continue;
      if (p.delta > 0) popped.set(p.skill, (popped.get(p.skill) ?? 0) + p.delta);
      else dropped.add(p.skill);
    }
    return { ev, popped, dropped };
  });
  const popCount = rated.reduce((a, r) => a + [...r.popped.values()].reduce((b, d) => b + d, 0), 0);
  const playerCount = evidence.length;
  if (popCount === 0) {
    return { inferredTrainingId: null, confidence: 'low', scores: [], popCount, playerCount, explainedFrac: null };
  }

  const full: Array<{ trainingId: number; score: number; explained: number }> = [];
  for (const tt of TRAINING_CATALOG) {
    if (tt.kind !== 'skill') continue;
    let explained = 0;
    let contradiction = 0;
    for (const { ev, popped, dropped } of rated) {
      const gains = predictedGains(ev, tt.id);
      for (const k of SKILL_KEYS) {
        const delta = popped.get(k);
        if (delta !== undefined) explained += Math.min(gains[k], delta);
        else if (!dropped.has(k)) contradiction += Math.max(0, gains[k] - CONTRADICTION_TOLERANCE);
      }
    }
    full.push({ trainingId: tt.id, score: explained - CONTRADICTION_WEIGHT * contradiction, explained });
  }
  full.sort((a, b) => b.score - a.score);
  const scores = full.slice(0, 5).map(({ trainingId, score }) => ({ trainingId, score }));

  const top = full[0];
  if (!top || top.score <= 0) {
    return { inferredTrainingId: null, confidence: 'low', scores, popCount, playerCount, explainedFrac: 0 };
  }
  // Margin vs the best training with a DIFFERENT primary skill; same-primary
  // position variants score near-identically and shouldn't dilute confidence.
  const topPrimary = getTrainingType(top.trainingId).primary;
  const rival = full.find((s) => getTrainingType(s.trainingId).primary !== topPrimary);
  const margin = rival && rival.score > 0 ? top.score / rival.score : Infinity;
  const explainedFrac = top.explained / popCount;

  // Tunable thresholds (engineering judgment; revisit against own-team ground truth).
  const confidence: InferenceResult['confidence'] =
    popCount >= 3 && explainedFrac >= 0.5 && margin >= 1.5 ? 'high'
    : popCount >= 2 && margin >= 1.2 ? 'medium'
    : 'low';

  return { inferredTrainingId: top.trainingId, confidence, scores, popCount, playerCount, explainedFrac };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/training/infer.test.ts`
Expected: PASS (4 tests). If the DR test picks a non-`dr`-primary type, print `r.scores` and check rate rows — do NOT loosen the assertion to make it pass; the scoring or test fixture has a real problem (see superpowers:systematic-debugging).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all green (existing engine/calibration suites unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/infer.ts src/lib/training/infer.test.ts
git commit -m "feat(v2): club-week training inference scoring (pooled pops + minutes vs bbscout rates)"
```

---

### Task 5: Inference sync job + cron/settings wiring

**Files:**
- Create: `src/server/sync/inference.ts`
- Create: `scripts/training/run-inference.mts`
- Modify: `src/app/api/cron/daily/route.ts`
- Modify: `src/app/settings/actions.ts`
- Modify: `src/components/settings/SyncJobsCard.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/lib/format-sync.tsx`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: Task 1 tables, Task 2 `detectPops`, Task 4 `inferClubTraining`; `playerStateFromSnapshot` from `@/lib/training/bridge`.
- Produces: `runTrainingInference(trigger: string): Promise<InferenceSyncResult>` with `InferenceSyncResult { playersScanned, popsDetected, observationWindows, inferredHigh, inferredMedium, inferredLow }`. `sync_log.job_type = 'inference'`. Task 10 reads `training_observations`; Task 7 reads `skill_pops`.

The job is DB-only (no BB calls, cheap) and a **full rebuild** each run: wipes `skill_pops where source='snapshots'` and all of `training_observations`, then recomputes from snapshots + minutes. Idempotent by construction.

- [ ] **Step 1: Implement `src/server/sync/inference.ts`**

```ts
import { asc, isNotNull, sql } from 'drizzle-orm';
import { db, players, seasons, skillPops, snapshots, syncLog, trainingObservations } from '@/db';
import { playerStateFromSnapshot } from '@/lib/training/bridge';
import { inferClubTraining, type PlayerWindowEvidence } from '@/lib/training/infer';
import { detectPops, type FullSnap, type PopEvent } from '@/lib/training/pops';
import type { WeekMinutes } from '@/queries/minutes';

export interface InferenceSyncResult {
  playersScanned: number;
  popsDetected: number;
  observationWindows: number;
  inferredHigh: number;
  inferredMedium: number;
  inferredLow: number;
}

type SnapRow = typeof snapshots.$inferSelect;

const WEEK_MS = 7 * 86_400_000;

function toFullSnap(s: SnapRow): FullSnap {
  return {
    capturedAt: s.capturedAt,
    skills: {
      js: s.jumpShot, jr: s.jumpRange, od: s.outsideDef, ha: s.handling, dr: s.driving,
      pa: s.passing, is: s.insideShot, id: s.insideDef, rb: s.rebounding, sb: s.shotBlocking,
      st: s.stamina, ft: s.freeThrow,
    },
  };
}

function stateFromSnapRow(s: SnapRow, heightCm: number, potential: number) {
  return playerStateFromSnapshot({
    skills: {
      jump_shot: s.jumpShot, jump_range: s.jumpRange, outside_def: s.outsideDef,
      handling: s.handling, driving: s.driving, passing: s.passing,
      inside_shot: s.insideShot, inside_def: s.insideDef, rebounding: s.rebounding,
      shot_blocking: s.shotBlocking,
    },
    age: s.age ?? 18, heightCm, potential,
    stamina: s.stamina, freeThrow: s.freeThrow,
  });
}

/** [start, end) date range of a 1-indexed season week. */
function weekRange(seasonStart: Date, week: number): [Date, Date] {
  const start = new Date(seasonStart.getTime() + (week - 1) * WEEK_MS);
  return [start, new Date(start.getTime() + WEEK_MS)];
}

const chunks = <T>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export async function runTrainingInference(trigger: string): Promise<InferenceSyncResult> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'inference', trigger }).returning({ id: syncLog.id });
  try {
    // 1. Load inputs: full snapshots (asc), player identity, seasons, all weekly minutes.
    const [fullSnaps, playerRows, seasonRows, minutesRows] = await Promise.all([
      db.select().from(snapshots).where(isNotNull(snapshots.jumpShot))
        .orderBy(asc(snapshots.playerId), asc(snapshots.capturedAt)),
      db.select({
        id: players.bbPlayerId, heightCm: players.heightCm, ownerTeamId: players.ownerTeamId,
      }).from(players),
      db.select().from(seasons),
      db.execute(sql`
        select pmm.player_id, m.season, m.season_week,
          sum(pmm.min_pg)::int as min_pg, sum(pmm.min_sg)::int as min_sg, sum(pmm.min_sf)::int as min_sf,
          sum(pmm.min_pf)::int as min_pf, sum(pmm.min_c)::int as min_c, count(*)::int as games
        from player_match_minutes pmm
        join matches m using (match_id)
        where m.season_week is not null
        group by 1, 2, 3
      `),
    ]);

    const playerById = new Map(playerRows.map((p) => [p.id, p]));
    const seasonById = new Map(seasonRows.map((s) => [s.id, s]));
    const minutesByPlayer = new Map<number, Array<WeekMinutes & { range: [Date, Date] }>>();
    for (const r of minutesRows.rows as Record<string, unknown>[]) {
      const playerId = Number(r.player_id);
      const season = Number(r.season);
      const seasonRow = seasonById.get(season);
      if (!seasonRow) continue;
      const wk: WeekMinutes = {
        season, seasonWeek: Number(r.season_week),
        minPg: Number(r.min_pg), minSg: Number(r.min_sg), minSf: Number(r.min_sf),
        minPf: Number(r.min_pf), minC: Number(r.min_c), games: Number(r.games),
      };
      const list = minutesByPlayer.get(playerId) ?? [];
      list.push({ ...wk, range: weekRange(seasonRow.start, wk.seasonWeek) });
      minutesByPlayer.set(playerId, list);
    }

    // 2. Per player: detect pops per consecutive pair, build club-window evidence.
    const snapsByPlayer = new Map<number, SnapRow[]>();
    for (const s of fullSnaps) {
      const list = snapsByPlayer.get(s.playerId) ?? [];
      list.push(s);
      snapsByPlayer.set(s.playerId, list);
    }

    const popRows: (typeof skillPops.$inferInsert)[] = [];
    // groupKey = teamId|startDate|endDate (date-only: census captures spread over ~an hour)
    const groups = new Map<string, { teamId: number; evidence: PlayerWindowEvidence[]; starts: Date[]; ends: Date[] }>();

    for (const [playerId, snaps] of snapsByPlayer) {
      const player = playerById.get(playerId);
      for (let i = 1; i < snaps.length; i++) {
        const prev = snaps[i - 1];
        const cur = snaps[i];
        const events: PopEvent[] = detectPops([toFullSnap(prev), toFullSnap(cur)]);
        for (const e of events) {
          popRows.push({
            playerId, skill: e.skill, toDisplayed: e.toDisplayed, delta: e.delta,
            windowStart: e.windowStart, windowEnd: e.windowEnd, windowWeeks: e.windowWeeks,
            source: 'snapshots',
          });
        }
        // Club evidence: needs a stable owner across the window + known height.
        const teamId = cur.ownerTeamId ?? player?.ownerTeamId ?? null;
        if (teamId == null || player?.heightCm == null) continue;
        if (prev.ownerTeamId != null && prev.ownerTeamId !== teamId) continue;
        const days = (cur.capturedAt.getTime() - prev.capturedAt.getTime()) / 86_400_000;
        if (days < 0.5) continue;
        const windowWeeks = Math.max(1, Math.round(days / 7));
        const weeks = (minutesByPlayer.get(playerId) ?? [])
          .filter((w) => w.range[0] < cur.capturedAt && w.range[1] > prev.capturedAt)
          .map(({ range: _range, ...wk }) => wk);
        const key = `${teamId}|${prev.capturedAt.toISOString().slice(0, 10)}|${cur.capturedAt.toISOString().slice(0, 10)}`;
        const group = groups.get(key) ?? { teamId, evidence: [], starts: [], ends: [] };
        group.evidence.push({
          playerId,
          state: stateFromSnapRow(prev, player.heightCm, cur.potential ?? prev.potential ?? 0),
          pops: events, weeks, windowWeeks,
        });
        group.starts.push(prev.capturedAt);
        group.ends.push(cur.capturedAt);
        groups.set(key, group);
      }
    }

    // 3. Rebuild skill_pops (snapshots source only — own-scrape rows persist).
    await db.execute(sql`delete from skill_pops where source = 'snapshots'`);
    for (const chunk of chunks(popRows, 500)) await db.insert(skillPops).values(chunk);

    // 4. Infer per club-window group and rebuild training_observations.
    const counts: InferenceSyncResult = {
      playersScanned: snapsByPlayer.size, popsDetected: popRows.length,
      observationWindows: 0, inferredHigh: 0, inferredMedium: 0, inferredLow: 0,
    };
    const obsRows: (typeof trainingObservations.$inferInsert)[] = [];
    for (const group of groups.values()) {
      const r = inferClubTraining(group.evidence);
      if (r.popCount === 0) continue; // nothing observed — don't store noise
      obsRows.push({
        teamId: group.teamId,
        windowStart: new Date(Math.min(...group.starts.map((d) => d.getTime()))),
        windowEnd: new Date(Math.max(...group.ends.map((d) => d.getTime()))),
        inferredTrainingId: r.inferredTrainingId,
        confidence: r.confidence,
        evidence: {
          popCount: r.popCount, playerCount: r.playerCount, explainedFrac: r.explainedFrac,
          scores: r.scores, playerIds: group.evidence.map((e) => e.playerId),
        },
      });
      counts.observationWindows++;
      if (r.inferredTrainingId != null) {
        if (r.confidence === 'high') counts.inferredHigh++;
        else if (r.confidence === 'medium') counts.inferredMedium++;
        else counts.inferredLow++;
      }
    }
    await db.execute(sql`delete from training_observations`);
    for (const chunk of chunks(obsRows, 200)) await db.insert(trainingObservations).values(chunk);

    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(sql`id = ${logRow.id}`);
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(sql`id = ${logRow.id}`);
    throw e;
  }
}
```

- [ ] **Step 2: CLI runner `scripts/training/run-inference.mts`**

```ts
// Run the training-inference job locally: npm run training:infer
import { config } from 'dotenv';
config({ path: '.env.local' });

const { runTrainingInference } = await import('../../src/server/sync/inference');
const result = await runTrainingInference('manual');
console.log(result);
```

Add to `package.json` scripts (after `"training:replay"`):

```json
"training:infer": "tsx scripts/training/run-inference.mts"
```

- [ ] **Step 3: Wire into the daily cron**

In `src/app/api/cron/daily/route.ts`, add the import:

```ts
import { runTrainingInference } from '@/server/sync/inference';
```

and after the `results.minutes` try/catch block, add:

```ts
  try {
    results.inference = await runTrainingInference('cron');
  } catch (err) {
    console.error('training inference failed (non-fatal):', err);
    results.inference = { error: String(err) };
  }
```

Also extend the route's doc comment: `inference every run (DB-only, rebuilds pops + club-training observations from snapshots + minutes)`.

- [ ] **Step 4: Settings action**

In `src/app/settings/actions.ts`: add `import { runTrainingInference } from '@/server/sync/inference';` and extend `syncNow`:

```ts
export async function syncNow(job: 'players' | 'seasons' | 'market' | 'minutes' | 'inference') {
  try {
    const counts =
      job === 'players' ? await runPlayersSync()
      : job === 'market' ? await runMarketSweep()
      : job === 'minutes' ? await runMinutesSync({}, 'manual')
      : job === 'inference' ? await runTrainingInference('manual')
      : await runSeasonsSync();
```

(rest unchanged).

- [ ] **Step 5: Settings UI row + last-run line**

`src/components/settings/SyncJobsCard.tsx`: change the type union and add a JOBS entry after `minutes`:

```ts
type SyncJob = 'seasons' | 'players' | 'market' | 'minutes' | 'inference';
```

```ts
  {
    job: 'inference',
    title: 'Training inference',
    chip: 'cron: daily',
    description:
      'Rebuilds observed skill pops and per-club inferred training from snapshots + match minutes. DB-only — no BB calls; feeds the Planner board.',
  },
```

`src/app/settings/page.tsx`: add `lastRunOf('inference')` to the `Promise.all` (name it `lastInference`) and `inference: toJobLastRun(lastInference)` to the `lastRuns` object passed to `SyncJobsCard`.

- [ ] **Step 6: format-sync case**

In `src/lib/format-sync.tsx`, before the unknown-job fallback add:

```tsx
  if (jobType === 'inference') {
    const pops = n('popsDetected');
    const windows = n('observationWindows');
    const high = n('inferredHigh');
    const medium = n('inferredMedium');
    const parts: string[] = [];
    parts.push(`${pops} pop${pops !== 1 ? 's' : ''}`);
    parts.push(`${windows} club window${windows !== 1 ? 's' : ''}`);
    if (high + medium > 0) parts.push(`${high} high · ${medium} medium`);
    return <span>{parts.join(' · ')}</span>;
  }
```

- [ ] **Step 7: Verify — typecheck, build, live run**

Run: `npm test` — expected: all green.
Run: `npm run build` — expected: compiles clean.
Run: `npm run training:infer`
Expected: prints an `InferenceSyncResult` with `playersScanned` ≈ 1000+, `popsDetected` > 0, `observationWindows` > 0 (there are ~1,059 players with ≥2 full snapshots in Neon). Then spot-check:
`node -e "const {neon}=require('@neondatabase/serverless');require('dotenv').config({path:'.env.local'});neon(process.env.DATABASE_URL)\`select confidence, count(*) from training_observations group by 1\`.then(console.log)"`
Expected: rows for at least 'low', likely 'medium'/'high' too.

- [ ] **Step 8: Commit**

```bash
git add src/server/sync/inference.ts scripts/training/run-inference.mts package.json src/app/api/cron/daily/route.ts src/app/settings/actions.ts src/components/settings/SyncJobsCard.tsx src/app/settings/page.tsx src/lib/format-sync.tsx
git commit -m "feat(v2): training-inference sync job (skill_pops + club training_observations) + cron/settings wiring"
```

---

### Task 6: Pop-anchored sublevel bounds (`src/lib/training/sublevels.ts` + ensemble/bridge extension)

**Files:**
- Create: `src/lib/training/sublevels.ts`
- Test: `src/lib/training/sublevels.test.ts`
- Modify: `src/lib/training/ensemble.ts`
- Modify: `src/lib/training/bridge.ts`
- Test (extend): `src/lib/training/bridge.test.ts`

**Interfaces:**
- Produces:
  - `sublevels.ts`: `PopAnchor { skill: SkillKey; toDisplayed: number; windowStart: Date; windowEnd: Date }`, `SublevelBound { low: number; high: number }`, `MAX_WEEKLY_GAIN = 0.30`, `sublevelBound(displayedNow: number, anchor: PopAnchor | null, asOf: Date): SublevelBound`.
  - `ensemble.ts`: `SublevelBounds = Partial<Record<SkillKey, SublevelBound>>`; `ensembleProject(player, plan, opts?: ProjectOptions & { sublevelBounds?: SublevelBounds })` — the two `sublevel-low/high` runs use per-skill bounds where provided, else the existing ±0.49 shift.
  - `bridge.ts`: `boundsFromAnchors(skillsDb, anchors: PopAnchor[], asOf: Date): SublevelBounds` (only returns entries that actually tighten), `applyAnchors(state: PlayerState, bounds: SublevelBounds): PlayerState` (skill = bound midpoint).
- Consumed by: Task 7 (player page / lab wiring), Task 9/10 (board state).

Semantics: a displayed `d` means true value ∈ (d−1, d]. Baseline band on engine scale (midpoint d−0.5): `[d−0.99, d−0.01]`. If the most recent observed pop for that skill reached exactly `d`, the value crossed d−1 somewhere in `[windowStart, windowEnd]`, so by `asOf` it can be at most `d−1 + 0.01 + weeksSince(windowStart)·MAX_WEEKLY_GAIN` — a real tightening only for narrow/recent windows (own-scrape exact dates shine here; month-long census windows naturally stay loose).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/training/sublevels.test.ts
import { describe, expect, it } from 'vitest';
import { sublevelBound, MAX_WEEKLY_GAIN, type PopAnchor } from './sublevels';

const d = (s: string) => new Date(s);
const anchor = (over: Partial<PopAnchor>): PopAnchor => ({
  skill: 'js', toDisplayed: 8, windowStart: d('2026-07-01T00:00:00Z'), windowEnd: d('2026-07-01T00:00:00Z'), ...over,
});

describe('sublevelBound', () => {
  it('no anchor: full displayed band', () => {
    expect(sublevelBound(8, null, d('2026-07-15T00:00:00Z'))).toEqual({ low: 7.01, high: 7.99 });
  });
  it('fresh exact-date pop: tight band just above the crossing', () => {
    const b = sublevelBound(8, anchor({}), d('2026-07-01T00:00:00Z'));
    expect(b.low).toBeCloseTo(7.01, 5);
    expect(b.high).toBeCloseTo(7.01, 5);
  });
  it('pop two weeks ago: band grows by MAX_WEEKLY_GAIN per week', () => {
    const b = sublevelBound(8, anchor({}), d('2026-07-15T00:00:00Z'));
    expect(b.high).toBeCloseTo(7.01 + 2 * MAX_WEEKLY_GAIN, 5);
  });
  it('stale pop: falls back to the full band', () => {
    const b = sublevelBound(8, anchor({ windowStart: d('2026-01-01T00:00:00Z') }), d('2026-07-15T00:00:00Z'));
    expect(b).toEqual({ low: 7.01, high: 7.99 });
  });
  it('anchor for a different displayed level is ignored', () => {
    const b = sublevelBound(9, anchor({ toDisplayed: 8 }), d('2026-07-02T00:00:00Z'));
    expect(b).toEqual({ low: 8.01, high: 8.99 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/training/sublevels.test.ts`
Expected: FAIL — cannot resolve `./sublevels`.

- [ ] **Step 3: Implement `src/lib/training/sublevels.ts`**

```ts
import type { SkillKey } from './types';

export interface PopAnchor {
  skill: SkillKey;
  toDisplayed: number;
  windowStart: Date; // earliest possible pop moment
  windowEnd: Date;   // snapshot that first showed the new value
}

export interface SublevelBound { low: number; high: number } // engine scale, within (d−1, d)

/** Max plausible single-skill accumulation, levels/week (BBSCOUT_HIGH primary-rate ballpark). */
export const MAX_WEEKLY_GAIN = 0.30;

const WEEK_MS = 7 * 86_400_000;

/** Bounds for a displayed integer given its most recent observed pop (if any).
 *  Baseline band is [d−0.99, d−0.01] (matches the ensemble's ±0.49 around the d−0.5 midpoint).
 *  A pop that reached exactly `displayedNow` pins the value near d−1 at pop time; the upper
 *  bound then grows by MAX_WEEKLY_GAIN per week since the earliest possible pop moment. */
export function sublevelBound(displayedNow: number, anchor: PopAnchor | null, asOf: Date): SublevelBound {
  const base = { low: displayedNow - 0.99, high: displayedNow - 0.01 };
  if (!anchor || anchor.toDisplayed !== displayedNow) return base;
  const weeksSince = Math.max(0, (asOf.getTime() - anchor.windowStart.getTime()) / WEEK_MS);
  const high = Math.min(base.high, displayedNow - 1 + 0.01 + weeksSince * MAX_WEEKLY_GAIN);
  return { low: base.low, high: Math.max(base.low, high) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/training/sublevels.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Extend `ensemble.ts` with per-skill bounds**

Replace the `sublevel-low`/`sublevel-high` lines inside `ensembleProject` and widen the signature. Full updated function (only `ensembleProject` and the new type change; `ENSEMBLE_MODELS`, `EnsembleResult`, `tsp`, `shiftSkills` stay):

```ts
import type { SublevelBound } from './sublevels';

export type SublevelBounds = Partial<Record<SkillKey, SublevelBound>>;

export function ensembleProject(
  player: PlayerState,
  plan: WeekConfig[],
  opts?: ProjectOptions & { sublevelBounds?: SublevelBounds },
): EnsembleResult {
  const byModel: Record<string, Projection> = {};
  for (const m of ENSEMBLE_MODELS) byModel[m.id] = project(player, plan, m, opts);
  // Displayed integers hide sublevels: a shown "7" is really 6.01–7.00. The engine
  // assumes the midpoint; these two runs bound the projection by the unknowable
  // starting sublevels. Observed pops (sublevelBounds) tighten individual skills.
  const boundState = (pick: 'low' | 'high', fallback: number): PlayerState => {
    const skills = { ...player.skills };
    for (const k of SKILL_KEYS) {
      const b = opts?.sublevelBounds?.[k];
      skills[k] = b ? b[pick] : Math.max(0.01, skills[k] + fallback);
    }
    return { ...player, skills };
  };
  byModel['sublevel-low'] = project(boundState('low', -0.49), plan, BBSCOUT, opts);
  byModel['sublevel-high'] = project(boundState('high', +0.49), plan, BBSCOUT, opts);
  const central = byModel['bbscout'];
  // ... rest of the function unchanged (finals/low/high/band computation)
}
```

Note: `shiftSkills` becomes unused — delete it.

- [ ] **Step 6: Add bridge helpers**

Append to `src/lib/training/bridge.ts` (add `import { sublevelBound, type PopAnchor } from './sublevels';` and `import type { SublevelBounds } from './ensemble';` — both type-safe, no IO):

```ts
/** Per-skill sublevel bounds from observed pop anchors. Only entries that actually
 *  tighten the default band are returned, keyed by engine skill key. */
export function boundsFromAnchors(
  skillsDb: Partial<Record<string, number | null>>,
  anchors: PopAnchor[],
  asOf: Date,
): SublevelBounds {
  const bySkill = new Map(anchors.map((a) => [a.skill, a]));
  const bounds: SublevelBounds = {};
  for (const k of SKILL_KEYS) {
    const displayedVal = skillsDb[SKILL_DB_NAMES[k]];
    if (displayedVal == null) continue;
    const b = sublevelBound(displayedVal, bySkill.get(k) ?? null, asOf);
    if (b.high < displayedVal - 0.011) bounds[k] = b; // informative only
  }
  return bounds;
}

/** Center a player state on the anchored bounds (midpoint per bounded skill). */
export function applyAnchors(state: PlayerState, bounds: SublevelBounds): PlayerState {
  const skills = { ...state.skills };
  for (const k of SKILL_KEYS) {
    const b = bounds[k];
    if (b) skills[k] = (b.low + b.high) / 2;
  }
  return { ...state, skills };
}
```

- [ ] **Step 7: Extend `bridge.test.ts`**

Append:

```ts
import { applyAnchors, boundsFromAnchors } from './bridge';

describe('boundsFromAnchors / applyAnchors', () => {
  const asOf = new Date('2026-07-15T00:00:00Z');
  it('returns only informative bounds and centers the state on them', () => {
    const anchors = [
      { skill: 'js' as const, toDisplayed: 8, windowStart: new Date('2026-07-14T00:00:00Z'), windowEnd: new Date('2026-07-14T00:00:00Z') },
    ];
    const bounds = boundsFromAnchors({ jump_shot: 8, driving: 10 }, anchors, asOf);
    expect(bounds.js).toBeDefined();
    expect(bounds.dr).toBeUndefined();
    const state = playerStateFromSnapshot({ skills: { jump_shot: 8, driving: 10 }, age: 18, heightCm: 190, potential: 8 });
    const anchored = applyAnchors(state, bounds);
    expect(anchored.skills.js).toBeLessThan(state.skills.js); // pulled toward the fresh crossing
    expect(anchored.skills.dr).toBe(state.skills.dr);
  });
});
```

(Match the existing test file's import style — it already imports `playerStateFromSnapshot` and `describe/expect/it`.)

- [ ] **Step 8: Run full suite**

Run: `npm test`
Expected: all green (ensemble/projection tests must still pass — the no-bounds path is behavior-identical).

- [ ] **Step 9: Commit**

```bash
git add src/lib/training/sublevels.ts src/lib/training/sublevels.test.ts src/lib/training/ensemble.ts src/lib/training/bridge.ts src/lib/training/bridge.test.ts
git commit -m "feat(v2): pop-anchored sublevel bounds tighten the ensemble band"
```

---

### Task 7: Anchor wiring — query + player page + training lab

**Files:**
- Modify: `src/queries/training.ts` (add `getPopAnchors`)
- Modify: `src/components/training/ProjectionPanel.tsx` (new optional prop)
- Modify: `src/components/player/DevelopmentSection.tsx` (thread prop)
- Modify: `src/app/players/[id]/page.tsx`
- Modify: `src/app/training/page.tsx`

**Interfaces:**
- Consumes: Task 1 `skill_pops`, Task 6 `boundsFromAnchors`/`applyAnchors`/`SublevelBounds`.
- Produces: `getPopAnchors(playerId: number): Promise<PopAnchorRow[]>` where `PopAnchorRow { skill: string; toDisplayed: number; windowStart: Date; windowEnd: Date }`. `ProjectionPanel` gains `sublevelBounds?: SublevelBounds` (serializable — numbers only), threaded from server pages which also apply `applyAnchors` to the `playerState` they pass.

- [ ] **Step 1: Add `getPopAnchors` to `src/queries/training.ts`**

```ts
export interface PopAnchorRow {
  skill: string;
  toDisplayed: number;
  windowStart: Date;
  windowEnd: Date;
}

/** Most recent positive pop per skill, preferring narrower windows on ties
 *  (own-scrape exact dates beat wide census windows ending the same day). */
export async function getPopAnchors(playerId: number): Promise<PopAnchorRow[]> {
  const result = await db.execute(sql`
    select distinct on (skill) skill, to_displayed, window_start, window_end
    from skill_pops
    where player_id = ${playerId} and delta > 0
    order by skill, window_end desc, (window_end - window_start) asc
  `);
  return (result.rows as Record<string, unknown>[]).map((r) => ({
    skill: String(r.skill),
    toDisplayed: Number(r.to_displayed),
    windowStart: new Date(r.window_start as string),
    windowEnd: new Date(r.window_end as string),
  }));
}
```

- [ ] **Step 2: `ProjectionPanel` accepts bounds**

In `src/components/training/ProjectionPanel.tsx`:
- add to imports: `import type { SublevelBounds } from '@/lib/training/ensemble';`
- add prop `sublevelBounds` (optional) to the signature and destructuring:

```ts
  sublevelBounds?: SublevelBounds;
```

- pass it through in the `useMemo`:

```ts
  const result = useMemo(() => {
    if (weekConfigs.length === 0) return null;
    return ensembleProject(playerState, weekConfigs, { startWeekOfSeason, sublevelBounds });
  }, [playerState, weekConfigs, startWeekOfSeason, sublevelBounds]);
```

Note: `SublevelBounds` values are plain `{ low, high }` numbers — serializable across the server→client boundary. `PopAnchor` Dates must NOT cross it; bounds are computed server-side.

- [ ] **Step 3: `DevelopmentSection` threads the prop**

Add `sublevelBounds?: SublevelBounds` to its props (import the type from `@/lib/training/ensemble`, type-only) and pass `sublevelBounds={sublevelBounds}` to `<ProjectionPanel …>`.

- [ ] **Step 4: Player page computes anchored state + bounds**

In `src/app/players/[id]/page.tsx`:
- extend imports:

```ts
import { applyAnchors, boundsFromAnchors, playerStateFromSnapshot } from '@/lib/training/bridge';
import { getPopAnchors, type PopAnchorRow } from '@/queries/training';
import type { PopAnchor } from '@/lib/training/sublevels';
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
```

- add `getPopAnchors(player.bbPlayerId)` to the existing `Promise.all` (destructure as `popAnchors`).
- after the `playerState` computation, replace the plain state with the anchored one:

```ts
  const asOf = new Date();
  const anchors: PopAnchor[] = popAnchors
    .filter((a): a is PopAnchorRow & { skill: SkillKey } => (SKILL_KEYS as readonly string[]).includes(a.skill))
    .map((a) => ({ skill: a.skill, toDisplayed: a.toDisplayed, windowStart: a.windowStart, windowEnd: a.windowEnd }));
  const sublevelBounds = playerState && profile.skills ? boundsFromAnchors(profile.skills, anchors, asOf) : {};
  const anchoredState = playerState ? applyAnchors(playerState, sublevelBounds) : null;
```

- render `DevelopmentSection` with `playerState={anchoredState}` (same null guard as before) and `sublevelBounds={sublevelBounds}`.

- [ ] **Step 5: Training lab page — same for the selected DB player**

In `src/app/training/page.tsx`, inside the `if (fullSkills && …)` block, after building `playerState`:

```ts
        const popAnchors = await getPopAnchors(playerId);
        const anchors = popAnchors
          .filter((a): a is typeof a & { skill: SkillKey } => (SKILL_KEYS as readonly string[]).includes(a.skill))
          .map((a) => ({ skill: a.skill as SkillKey, toDisplayed: a.toDisplayed, windowStart: a.windowStart, windowEnd: a.windowEnd }));
        const sublevelBounds = boundsFromAnchors(profile.skills, anchors, new Date());
        const anchoredState = applyAnchors(playerState, sublevelBounds);
```

with imports `applyAnchors, boundsFromAnchors` from `@/lib/training/bridge`, `getPopAnchors` from `@/queries/training`, `SKILL_KEYS, type SkillKey` from `@/lib/training/types`. Set `playerState: anchoredState` and add `sublevelBounds` to the `selected` object; extend `SelectedPlayer` in `src/components/training/TrainingLab.tsx` with `sublevelBounds?: SublevelBounds` and have `TrainingLab` pass it to its `<ProjectionPanel …>` for the DB-player branch (manual builds pass nothing).

- [ ] **Step 6: Ensemble-bounds integration test**

Append to `src/lib/training/ensemble.test.ts` (match its existing import style — it already imports `ensembleProject` and a player fixture; reuse them):

```ts
it('sublevelBounds narrow the band vs the default ±0.49 runs', () => {
  const plan = Array.from({ length: 4 }, () => ({ trainingId: 15, coachLevel: 5 }));
  const loose = ensembleProject(player, plan);
  const tight = ensembleProject(player, plan, {
    sublevelBounds: Object.fromEntries(SKILL_KEYS.map((k) => [k, {
      low: player.skills[k] - 0.1, high: player.skills[k] + 0.1,
    }])),
  });
  expect(tight.band.tspHigh - tight.band.tspLow).toBeLessThan(loose.band.tspHigh - loose.band.tspLow);
});
```

(`player` = the file's existing PlayerState fixture; add `SKILL_KEYS` to the imports from `./types` if missing.)

- [ ] **Step 7: Verify**

Run: `npm test` — all green.
Run: `npm run build` — compiles clean.
Optionally run the `verify` skill's launch recipe and eyeball a player page with a recent census pop: the band chart's early weeks should be visibly narrower than before for popped skills.

- [ ] **Step 8: Commit**

```bash
git add src/queries/training.ts src/components/training/ProjectionPanel.tsx src/components/training/TrainingLab.tsx src/components/player/DevelopmentSection.tsx src/app/players/[id]/page.tsx src/app/training/page.tsx src/lib/training/ensemble.test.ts
git commit -m "feat(v2): pop anchors tighten projection bands on player page + training lab"
```

---

### Task 8: Own-team scraper writes exact-date pops to `skill_pops`

**Files:**
- Modify: `scripts/training/scrape-training-history.mts`

**Interfaces:**
- Consumes: Task 1 `skill_pops` (via raw neon SQL — the script already imports `neon`).
- Produces: `source='own-scrape'` rows with `windowStart == windowEnd` (the exact training-update date) and `windowWeeks = 1` — maximally tight anchors for Task 6/7. Upsert on `(player_id, skill, window_end, source)`.

The script already builds, per player, `rawWeeks: [{ date: '1/2/2026', trainingId, minutes, pops: [{ skill, key, from, to }] }]` and writes case JSONs. Read the script first; reuse its existing date parsing (it parses `w.date` US-format M/D/YYYY somewhere for ordering — if it keeps dates as strings, add a `parseUsDate` helper) and its existing neon client instance.

- [ ] **Step 1: Add the upsert helper + call**

Add near the other helpers (adapt `sqlClient` to the script's actual neon variable name):

```ts
function parseUsDate(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Persist exact-date pops (and drops) as maximally tight anchors. */
async function upsertScrapedPops(playerId: number, rawWeeks: Array<{ date: string; pops: Array<{ key: string; from: number; to: number }> }>) {
  let n = 0;
  for (const w of rawWeeks) {
    for (const p of w.pops) {
      const at = parseUsDate(w.date).toISOString();
      await sqlClient`
        insert into skill_pops (player_id, skill, to_displayed, delta, window_start, window_end, window_weeks, source)
        values (${playerId}, ${p.key}, ${p.to}, ${p.to - p.from}, ${at}, ${at}, 1, 'own-scrape')
        on conflict (player_id, skill, window_end, source)
        do update set to_displayed = excluded.to_displayed, delta = excluded.delta
      `;
      n++;
    }
  }
  return n;
}
```

Call it right after the case-JSON `writeFileSync` for each player, unless a new `--no-db` CLI flag is set (add the flag next to the script's existing flag parsing); log `  ↳ N pops upserted to skill_pops`. Note: the pop `key` may include `st`/`ft` if the scraper maps Stamina/Free Throw pops — those store fine (the `skill` column accepts them; anchors only ever read the 10 rate keys).

- [ ] **Step 2: Verify against the real team**

Run: `npm run training:scrape-history -- --team 114360 --coach 5 --yt 6 --gym 3 --tc 2`
Expected: per-player `↳ N pops upserted` lines; then
`node -e "const {neon}=require('@neondatabase/serverless');require('dotenv').config({path:'.env.local'});neon(process.env.DATABASE_URL)\`select count(*) from skill_pops where source='own-scrape'\`.then(console.log)"`
Expected: ~90+ rows (7 trainees, 98 known pops from the calibration work).

- [ ] **Step 3: Commit**

```bash
git add scripts/training/scrape-training-history.mts
git commit -m "feat(v2): scrape-history upserts exact-date pops as own-scrape anchors"
```

---

### Task 9: Cohort board computation (`src/lib/training/board.ts`)

**Files:**
- Create: `src/lib/training/board.ts`
- Test: `src/lib/training/board.test.ts`

**Interfaces:**
- Consumes: `project`, `PlayerState`, `WeekConfig` from `./engine`; `minutesAtPositions` from `./bridge`; `BBSCOUT` from `./models/bbscout`; `PLAN_TEMPLATES` from `./templates`; `benchmarkDelta` from `./benchmarks`; `potentialScore`, `capThreshold` from `./salary`; `getTrainingType` from `./catalog`; `WeekMinutes` from `@/queries/minutes`.
- Produces (Task 10 builds inputs, Task 11 renders rows — everything JSON-serializable):

```ts
export interface BoardPlayerInput {
  bbPlayerId: number; name: string;
  age: number; heightCm: number; potential: number;
  state: PlayerState;            // anchored midpoint sublevels
  displayedSkills: number[];     // 10 rate skills in SKILL_KEYS order (for cap score)
  tspNow: number | null;         // stored 12-skill displayed TSP
  ownerTeamId: number | null; ownerTeamName: string | null;
  inferred: { trainingId: number | null; confidence: 'high' | 'medium' | 'low'; windowEndIso: string } | null;
  recentWeeks: WeekMinutes[];    // last ≤4 observed season-weeks
  currentSeasonWeek: number;     // 1..14
}

export interface BoardRow {
  bbPlayerId: number; name: string; age: number; potential: number; heightCm: number;
  ownerTeamId: number | null; ownerTeamName: string | null;
  inferredTrainingId: number | null;
  inferredLabel: string | null;          // in-game label of the inferred training
  inferredConfidence: 'high' | 'medium' | 'low' | null;
  inferredAsOfIso: string | null;
  avgMinutes: number | null;             // avg weekly minutes at the inferred training's positions
  tspNow: number | null;
  benchmarkDelta: number | null;         // vs NT track at current age/week
  tsp21Current: number | null;           // 12-skill display-equivalent at end of age-21 season
  tsp21Optimal: number;
  optimalTemplateKey: string;
  gap: number | null;                    // tsp21Optimal − tsp21Current
  capUsedPct: number;                    // weighted-sum score / soft-cap threshold × 100
}
```

Both projection paths use coach 5 / youth-trainer 5 / no facilities so the gap isolates *training choice + minutes*, not staff quality. Current path uses the club's inferred training at the player's average recent minutes; optimal path evaluates every `PLAN_TEMPLATES` entry at full minutes and keeps the best. "TSP@21" = 12-skill display-equivalent (Σ(skill+0.5) over 10 rate skills + ft + st) at the end of the age-21 season.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/training/board.test.ts
import { describe, expect, it } from 'vitest';
import { computeBoardRow, weeksToEndOfAge21, type BoardPlayerInput } from './board';
import { skillsFromArray } from './types';

const base: BoardPlayerInput = {
  bbPlayerId: 1, name: 'Test Guard', age: 19, heightCm: 190, potential: 8,
  state: { skills: skillsFromArray([7.5, 5.5, 6.5, 8.5, 9.5, 6.5, 3.5, 3.5, 3.5, 2.5]), age: 19, heightCm: 190, potential: 8, ftSkill: 5.5, staminaSkill: 5.5 },
  displayedSkills: [8, 6, 7, 9, 10, 7, 4, 4, 4, 3],
  tspNow: 73, ownerTeamId: 100, ownerTeamName: 'KK Test',
  inferred: { trainingId: 15, confidence: 'high', windowEndIso: '2026-07-10T00:00:00.000Z' },
  recentWeeks: [
    { season: 72, seasonWeek: 4, minPg: 30, minSg: 18, minSf: 0, minPf: 0, minC: 0, games: 2 },
    { season: 72, seasonWeek: 5, minPg: 40, minSg: 8, minSf: 0, minPf: 0, minC: 0, games: 2 },
  ],
  currentSeasonWeek: 6,
};

describe('weeksToEndOfAge21', () => {
  it('counts remaining weeks through the age-21 season', () => {
    expect(weeksToEndOfAge21(21, 14)).toBe(0);
    expect(weeksToEndOfAge21(21, 1)).toBe(13);
    expect(weeksToEndOfAge21(18, 1)).toBe(13 + 3 * 14);
  });
});

describe('computeBoardRow', () => {
  it('produces both projections and a positive optimal for a young player', () => {
    const row = computeBoardRow(base);
    expect(row.inferredLabel).toBe('One on One (PG/SG)');
    expect(row.avgMinutes).toBe(48); // (30+18+40+8)/2
    expect(row.tsp21Current).not.toBeNull();
    expect(row.tsp21Optimal).toBeGreaterThan(row.tspNow!);
    expect(row.gap).toBeCloseTo(row.tsp21Optimal - row.tsp21Current!, 5);
    expect(row.optimalTemplateKey).toBeTruthy();
    expect(row.capUsedPct).toBeGreaterThan(0);
    expect(row.benchmarkDelta).not.toBeNull();
  });

  it('null inference -> null current path and gap', () => {
    const row = computeBoardRow({ ...base, inferred: null });
    expect(row.tsp21Current).toBeNull();
    expect(row.gap).toBeNull();
    expect(row.tsp21Optimal).toBeGreaterThan(0);
  });

  it('age 21 at week 14 -> zero horizon, projections equal current state TSP', () => {
    const row = computeBoardRow({ ...base, age: 21, currentSeasonWeek: 14, state: { ...base.state, age: 21 } });
    expect(row.tsp21Optimal).toBeCloseTo(row.tsp21Current!, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/training/board.test.ts`
Expected: FAIL — cannot resolve `./board`.

- [ ] **Step 3: Implement `src/lib/training/board.ts`**

```ts
import { minutesAtPositions } from './bridge';
import { getTrainingType } from './catalog';
import { project, type PlayerState, type Projection, type WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { benchmarkDelta } from './benchmarks';
import { capThreshold, potentialScore } from './salary';
import { PLAN_TEMPLATES } from './templates';
import { SKILL_KEYS, skillsFromArray } from './types';
import type { WeekMinutes } from '@/queries/minutes';

// Both paths assume the same neutral staff so the gap isolates training choice + minutes.
export const BOARD_COACH_LEVEL = 5;
export const BOARD_YOUTH_TRAINER = 5;

export interface BoardPlayerInput { /* exactly as in the Interfaces block above */ }
export interface BoardRow { /* exactly as in the Interfaces block above */ }

/** Training weeks remaining through the end of the age-21 season (14-week seasons). */
export function weeksToEndOfAge21(age: number, currentSeasonWeek: number): number {
  return Math.max(0, (14 - currentSeasonWeek) + (21 - age) * 14);
}

/** 12-skill display-equivalent TSP after a projection (or of the start state at zero horizon). */
function tsp12(state: PlayerState, proj: Projection | null): number {
  if (proj === null || proj.weeks.length === 0) {
    const rate = SKILL_KEYS.reduce((a, k) => a + state.skills[k] + 0.5, 0);
    return rate + (state.ftSkill ?? 1) + 0.5 + (state.staminaSkill ?? 1) + 0.5;
  }
  const last = proj.weeks[proj.weeks.length - 1].result;
  const rate = SKILL_KEYS.reduce((a, k) => a + proj.finalSkills[k] + 0.5, 0);
  return rate + last.ftAfter + 0.5 + last.staminaAfter + 0.5;
}

/** Expand template blocks to exactly `horizon` weeks, repeating the last block's training. */
function templateWeeks(blocks: Array<{ trainingId: number; weeks: number }>, horizon: number): number[] {
  const ids: number[] = [];
  for (const b of blocks) for (let i = 0; i < b.weeks && ids.length < horizon; i++) ids.push(b.trainingId);
  const lastId = blocks.length > 0 ? blocks[blocks.length - 1].trainingId : 15;
  while (ids.length < horizon) ids.push(lastId);
  return ids;
}

export function computeBoardRow(input: BoardPlayerInput): BoardRow {
  const horizon = weeksToEndOfAge21(input.age, input.currentSeasonWeek);
  const projOpts = { startWeekOfSeason: input.currentSeasonWeek };

  // Current path: the club's inferred training at the player's actual recent minutes.
  const tid = input.inferred?.trainingId ?? null;
  let tsp21Current: number | null = null;
  let avgMinutes: number | null = null;
  if (tid != null) {
    const mins = input.recentWeeks.map((w) => minutesAtPositions(w, tid));
    avgMinutes = mins.length > 0 ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : 0;
    const plan: WeekConfig[] = Array.from({ length: horizon }, () => ({
      trainingId: tid, coachLevel: BOARD_COACH_LEVEL, youthTrainerLevel: BOARD_YOUTH_TRAINER, minutes: avgMinutes ?? 0,
    }));
    tsp21Current = tsp12(input.state, horizon > 0 ? project(input.state, plan, BBSCOUT, projOpts) : null);
  }

  // Optimal path: best archetype template at full minutes.
  let best = { tsp: -Infinity, key: '' };
  for (const t of PLAN_TEMPLATES) {
    const plan: WeekConfig[] = templateWeeks(t.blocks, horizon).map((id) => ({
      trainingId: id, coachLevel: BOARD_COACH_LEVEL, youthTrainerLevel: BOARD_YOUTH_TRAINER,
    }));
    const v = tsp12(input.state, horizon > 0 ? project(input.state, plan, BBSCOUT, projOpts) : null);
    if (v > best.tsp) best = { tsp: v, key: t.key };
  }

  const { score } = potentialScore(skillsFromArray(input.displayedSkills));
  const capUsedPct = Math.round((score / capThreshold(input.potential)) * 100);

  return {
    bbPlayerId: input.bbPlayerId, name: input.name, age: input.age,
    potential: input.potential, heightCm: input.heightCm,
    ownerTeamId: input.ownerTeamId, ownerTeamName: input.ownerTeamName,
    inferredTrainingId: tid,
    inferredLabel: tid != null ? getTrainingType(tid).label : null,
    inferredConfidence: input.inferred?.confidence ?? null,
    inferredAsOfIso: input.inferred?.windowEndIso ?? null,
    avgMinutes,
    tspNow: input.tspNow,
    benchmarkDelta: input.tspNow != null ? benchmarkDelta(input.tspNow, input.age, input.currentSeasonWeek) : null,
    tsp21Current,
    tsp21Optimal: best.tsp,
    optimalTemplateKey: best.key,
    gap: tsp21Current != null ? best.tsp - tsp21Current : null,
    capUsedPct,
  };
}
```

(Fill the two `/* exactly as in the Interfaces block above */` interfaces with the literal definitions from this task's Interfaces section — they're normative.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/training/board.test.ts`
Expected: PASS (4 tests). If `avgMinutes` disagrees, recheck: training 15 (`DR for 12`) qualifies PG+SG, so week minutes are 30+18=48 and 40+8=48 → avg 48.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/board.ts src/lib/training/board.test.ts
git commit -m "feat(v2): cohort-board row computation (current vs optimal age-21 projection, gap, cap, benchmark)"
```

---

### Task 10: Planner data query (`src/queries/planner.ts`)

**Files:**
- Create: `src/queries/planner.ts`

**Interfaces:**
- Consumes: Task 9 `BoardPlayerInput`; Task 6 bridge helpers; `currentAge` from `@/lib/domain`; `getCurrentSeasonId` from `@/queries/players`; `seasonWeekOf` from `@/server/sync/minutes`.
- Produces: `getPlannerData(): Promise<{ players: BoardPlayerInput[]; currentSeasonWeek: number }>` — Slovenian prospects aged 18–21 with full skills and known height, states anchored via pop anchors, each with their club's latest training observation and their last ≤4 observed minutes-weeks.

- [ ] **Step 1: Implement `src/queries/planner.ts`**

```ts
import { eq, sql } from 'drizzle-orm';
import { db, seasons } from '@/db';
import { currentAge } from '@/lib/domain';
import { applyAnchors, boundsFromAnchors, playerStateFromSnapshot } from '@/lib/training/bridge';
import type { BoardPlayerInput } from '@/lib/training/board';
import type { PopAnchor } from '@/lib/training/sublevels';
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import { getCurrentSeasonId } from '@/queries/players';
import type { WeekMinutes } from '@/queries/minutes';
import { seasonWeekOf } from '@/server/sync/minutes';

const SKILL_COLS = [
  'jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing',
  'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw',
] as const;

export interface PlannerData {
  players: BoardPlayerInput[];
  currentSeasonWeek: number;
}

export async function getPlannerData(): Promise<PlannerData> {
  const season = await getCurrentSeasonId();
  const [seasonRow] = await db.select().from(seasons).where(eq(seasons.id, season));
  const currentSeasonWeek = seasonRow ? Math.min(14, Math.max(1, seasonWeekOf(new Date(), seasonRow.start))) : 1;

  const [playersRes, obsRes, minutesRes, anchorsRes] = await Promise.all([
    db.execute(sql`
      with latest_full as (
        select distinct on (player_id) *
        from snapshots where jump_shot is not null
        order by player_id, captured_at desc
      )
      select p.bb_player_id, p.name, p.height_cm, p.owner_team_id, p.owner_team_name,
        f.age as snap_age, f.season as snap_season, f.potential, f.tsp,
        f.jump_shot, f.jump_range, f.outside_def, f.handling, f.driving, f.passing,
        f.inside_shot, f.inside_def, f.rebounding, f.shot_blocking, f.stamina, f.free_throw
      from players p
      join latest_full f on f.player_id = p.bb_player_id
      where (p.country_id = 66 or p.nationality in ('Slovenia', 'Slovenija'))
        and p.archived = false and p.height_cm is not null
    `),
    db.execute(sql`
      select distinct on (team_id) team_id, window_end, inferred_training_id, confidence
      from training_observations
      order by team_id, window_end desc
    `),
    db.execute(sql`
      select pmm.player_id, m.season, m.season_week,
        sum(pmm.min_pg)::int as min_pg, sum(pmm.min_sg)::int as min_sg, sum(pmm.min_sf)::int as min_sf,
        sum(pmm.min_pf)::int as min_pf, sum(pmm.min_c)::int as min_c, count(*)::int as games
      from player_match_minutes pmm
      join matches m using (match_id)
      where m.season = ${season} and m.season_week is not null and m.season_week >= ${currentSeasonWeek - 4}
      group by 1, 2, 3
    `),
    db.execute(sql`
      select distinct on (player_id, skill) player_id, skill, to_displayed, window_start, window_end
      from skill_pops
      where delta > 0
      order by player_id, skill, window_end desc, (window_end - window_start) asc
    `),
  ]);

  const obsByTeam = new Map<number, { trainingId: number | null; confidence: 'high' | 'medium' | 'low'; windowEndIso: string }>();
  for (const r of obsRes.rows as Record<string, unknown>[]) {
    obsByTeam.set(Number(r.team_id), {
      trainingId: r.inferred_training_id == null ? null : Number(r.inferred_training_id),
      confidence: r.confidence as 'high' | 'medium' | 'low',
      windowEndIso: new Date(r.window_end as string).toISOString(),
    });
  }

  const minutesByPlayer = new Map<number, WeekMinutes[]>();
  for (const r of minutesRes.rows as Record<string, unknown>[]) {
    const pid = Number(r.player_id);
    const list = minutesByPlayer.get(pid) ?? [];
    list.push({
      season: Number(r.season), seasonWeek: Number(r.season_week),
      minPg: Number(r.min_pg), minSg: Number(r.min_sg), minSf: Number(r.min_sf),
      minPf: Number(r.min_pf), minC: Number(r.min_c), games: Number(r.games),
    });
    minutesByPlayer.set(pid, list);
  }

  const anchorsByPlayer = new Map<number, PopAnchor[]>();
  for (const r of anchorsRes.rows as Record<string, unknown>[]) {
    const skill = String(r.skill);
    if (!(SKILL_KEYS as readonly string[]).includes(skill)) continue;
    const pid = Number(r.player_id);
    const list = anchorsByPlayer.get(pid) ?? [];
    list.push({
      skill: skill as SkillKey, toDisplayed: Number(r.to_displayed),
      windowStart: new Date(r.window_start as string), windowEnd: new Date(r.window_end as string),
    });
    anchorsByPlayer.set(pid, list);
  }

  const now = new Date();
  const players: BoardPlayerInput[] = [];
  for (const r of playersRes.rows as Record<string, unknown>[]) {
    const age = currentAge(r.snap_age as number | null, r.snap_season as number | null, season);
    if (age == null || age < 18 || age > 21) continue;
    if (SKILL_COLS.some((c) => r[c] == null)) continue;
    const pid = Number(r.bb_player_id);
    const skillsDb = Object.fromEntries(SKILL_COLS.map((c) => [c, Number(r[c])]));
    const potential = r.potential == null ? 0 : Number(r.potential);
    const state = playerStateFromSnapshot({
      skills: skillsDb, age, heightCm: Number(r.height_cm), potential,
      stamina: skillsDb.stamina, freeThrow: skillsDb.free_throw,
    });
    const bounds = boundsFromAnchors(skillsDb, anchorsByPlayer.get(pid) ?? [], now);
    const ownerTeamId = r.owner_team_id == null ? null : Number(r.owner_team_id);
    players.push({
      bbPlayerId: pid, name: String(r.name), age, heightCm: Number(r.height_cm), potential,
      state: applyAnchors(state, bounds),
      displayedSkills: SKILL_KEYS.map((k) => Number(r[{
        js: 'jump_shot', jr: 'jump_range', od: 'outside_def', ha: 'handling', dr: 'driving',
        pa: 'passing', is: 'inside_shot', id: 'inside_def', rb: 'rebounding', sb: 'shot_blocking',
      }[k] as string])),
      tspNow: r.tsp == null ? null : Number(r.tsp),
      ownerTeamId, ownerTeamName: r.owner_team_name == null ? null : String(r.owner_team_name),
      inferred: ownerTeamId != null ? obsByTeam.get(ownerTeamId) ?? null : null,
      recentWeeks: minutesByPlayer.get(pid) ?? [],
      currentSeasonWeek,
    });
  }

  return { players, currentSeasonWeek };
}
```

(Use `SKILL_DB_NAMES` from `@/lib/training/types` instead of the inline skill-key→column map if that reads cleaner — it is exactly that mapping.)

- [ ] **Step 2: Smoke-check via a one-off node run**

Run: `npx tsx -e "import('dotenv').then(d=>{d.config({path:'.env.local'});return import('./src/queries/planner')}).then(m=>m.getPlannerData()).then(d=>console.log(d.players.length, 'players; week', d.currentSeasonWeek, JSON.stringify(d.players[0], null, 1).slice(0, 600)))"`
Expected: several hundred players, a sane week number, first player has skills/state/inferred populated (inferred may be null if his club has no observation — fine).

- [ ] **Step 3: Commit**

```bash
git add src/queries/planner.ts
git commit -m "feat(v2): planner cohort data query (anchored states + club observations + recent minutes)"
```

---

### Task 11: `/planner` page + PlannerTable + nav

**Files:**
- Create: `src/app/planner/page.tsx`
- Create: `src/components/planner/PlannerTable.tsx`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: Task 9 `computeBoardRow`/`BoardRow`, Task 10 `getPlannerData`.
- Produces: `/planner` route (server component) rendering `<PlannerTable rows={BoardRow[]} currentSeasonWeek={number} />` (all serializable).

- [ ] **Step 1: Nav link**

In `src/components/Navbar.tsx` `LINKS`, insert after Training:

```ts
  { href: '/planner', label: 'Planner' },
```

- [ ] **Step 2: `src/app/planner/page.tsx`**

```tsx
import { computeBoardRow } from '@/lib/training/board';
import { getPlannerData } from '@/queries/planner';
import PlannerTable from '@/components/planner/PlannerTable';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function PlannerPage() {
  const data = await getPlannerData();
  const rows = data.players.map(computeBoardRow);
  return (
    <main className="p-6 max-w-7xl">
      <h1 className="text-xl font-semibold mb-1">U-21 planner</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Every Slovenian 18–21 prospect with full skills: what their club trains (inferred from
        minutes + observed pops), projected TSP at the end of age 21 under that vs. an optimal
        plan, and the gap — sorted so the biggest outreach wins come first. Benchmark = NT-track
        season TSP (forum thread 323477). Projections use the bbscout model, neutral staff.
      </p>
      <PlannerTable rows={rows} currentSeasonWeek={data.currentSeasonWeek} />
    </main>
  );
}
```

- [ ] **Step 3: `src/components/planner/PlannerTable.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { BoardRow } from '@/lib/training/board';
import { getPotentialColor } from '@/lib/constants';

type SortKey = 'name' | 'age' | 'potential' | 'tspNow' | 'benchmarkDelta' | 'tsp21Current' | 'tsp21Optimal' | 'gap' | 'capUsedPct' | 'avgMinutes';

const CONF_COLOR: Record<string, string> = { high: 'text-green-400', medium: 'text-amber-400', low: 'text-neutral-500' };

function fmt(v: number | null, digits = 0): string {
  if (v == null) return '–';
  return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function signed(v: number | null): { text: string; cls: string } {
  if (v == null) return { text: '–', cls: 'text-neutral-500' };
  const r = Math.round(v);
  if (r > 0) return { text: `+${r}`, cls: 'text-green-400' };
  if (r < 0) return { text: `${r}`, cls: 'text-red-400' };
  return { text: '0', cls: 'text-neutral-400' };
}

export default function PlannerTable({ rows, currentSeasonWeek }: { rows: BoardRow[]; currentSeasonWeek: number }) {
  const [sortKey, setSortKey] = useState<SortKey>('gap');
  const [sortAsc, setSortAsc] = useState(false);
  const [ages, setAges] = useState<Set<number>>(new Set([18, 19, 20, 21]));
  const [minPot, setMinPot] = useState(0);
  const [inferredOnly, setInferredOnly] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      ages.has(r.age) &&
      r.potential >= minPot &&
      (!inferredOnly || r.inferredTrainingId != null) &&
      (q === '' || r.name.toLowerCase().includes(q) || (r.ownerTeamName ?? '').toLowerCase().includes(q)),
    );
  }, [rows, ages, minPot, inferredOnly, search]);

  const sorted = useMemo(() => {
    const dir = sortAsc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return dir * a.name.localeCompare(b.name);
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls last regardless of direction
      if (bv == null) return -1;
      return dir * (av - bv);
    });
  }, [filtered, sortKey, sortAsc]);

  const header = (key: SortKey, label: string, title?: string) => (
    <th
      className="pr-3 cursor-pointer select-none whitespace-nowrap hover:text-white"
      title={title}
      onClick={() => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(key === 'name'); }
      }}
    >
      {label}{sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''}
    </th>
  );

  const toggleAge = (a: number) => {
    const next = new Set(ages);
    if (next.has(a)) next.delete(a); else next.add(a);
    setAges(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Player or club…"
          className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 w-48"
        />
        {[18, 19, 20, 21].map((a) => (
          <label key={a} className="flex items-center gap-1 text-neutral-400">
            <input type="checkbox" checked={ages.has(a)} onChange={() => toggleAge(a)} />{a}
          </label>
        ))}
        <label className="flex items-center gap-1 text-neutral-400">
          Pot ≥
          <input
            type="number" min={0} max={11} value={minPot}
            onChange={(e) => setMinPot(Number(e.target.value) || 0)}
            className="w-14 rounded border border-neutral-800 bg-neutral-900 px-1 py-0.5"
          />
        </label>
        <label className="flex items-center gap-1 text-neutral-400">
          <input type="checkbox" checked={inferredOnly} onChange={(e) => setInferredOnly(e.target.checked)} />
          inferred training only
        </label>
        <span className="ml-auto text-neutral-500">{sorted.length} players · week {currentSeasonWeek}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b border-neutral-800">
            <tr>
              {header('name', 'Player')}
              {header('age', 'Age')}
              {header('potential', 'Pot')}
              <th className="pr-3">Club</th>
              <th className="pr-3">Club training</th>
              {header('avgMinutes', 'Min/wk', 'Avg weekly minutes at the inferred training’s positions (last 4 observed weeks)')}
              {header('tspNow', 'TSP')}
              {header('benchmarkDelta', 'vs BM', 'TSP vs the NT-track benchmark for this age + season week')}
              {header('tsp21Current', 'TSP@21 now', 'Projected 12-skill TSP at end of age 21 if the club keeps its inferred training + current minutes')}
              {header('tsp21Optimal', 'TSP@21 opt', 'Projected TSP at end of age 21 under the best archetype template at full minutes')}
              {header('gap', 'Gap', 'Optimal − current: how much development is being left on the table')}
              {header('capUsedPct', 'Cap', 'Potential-cap usage (weighted-sum score / soft cap)')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const bm = signed(r.benchmarkDelta);
              const gap = signed(r.gap);
              return (
                <tr key={r.bbPlayerId} className="border-b border-neutral-900">
                  <td className="py-1 pr-3 whitespace-nowrap">
                    <Link href={`/players/${r.bbPlayerId}`} className="hover:text-amber-400">{r.name}</Link>
                  </td>
                  <td className="pr-3">{r.age}</td>
                  <td className="pr-3" style={{ color: getPotentialColor(r.potential) }}>{r.potential}</td>
                  <td className="pr-3 whitespace-nowrap max-w-40 truncate">
                    {r.ownerTeamId != null ? (
                      <a href={`https://buzzerbeater.com/team/${r.ownerTeamId}/overview.aspx`} target="_blank" className="text-neutral-400 hover:text-amber-400">
                        {r.ownerTeamName ?? r.ownerTeamId}
                      </a>
                    ) : <span className="text-neutral-600">–</span>}
                  </td>
                  <td className="pr-3 whitespace-nowrap">
                    {r.inferredLabel != null ? (
                      <span>
                        {r.inferredLabel}{' '}
                        <span className={`text-xs ${CONF_COLOR[r.inferredConfidence ?? 'low']}`}>({r.inferredConfidence})</span>
                      </span>
                    ) : <span className="text-neutral-600">unknown</span>}
                  </td>
                  <td className="pr-3">{fmt(r.avgMinutes)}</td>
                  <td className="pr-3">{fmt(r.tspNow)}</td>
                  <td className={`pr-3 ${bm.cls}`}>{bm.text}</td>
                  <td className="pr-3">{fmt(r.tsp21Current)}</td>
                  <td className="pr-3">{fmt(r.tsp21Optimal)}</td>
                  <td className={`pr-3 font-medium ${gap.cls}`}>{gap.text}</td>
                  <td className="pr-3">{r.capUsedPct}%</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={12} className="py-3 text-neutral-500">No players match the filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm test` — all green.
Run: `npm run build` — compiles clean, `/planner` in the route list.
Use the `verify` skill's recipe to launch the app and open `/planner`: expect several hundred rows, gap sorting by default (players with inferred training + poor minutes at top), filters working, name/club links working.

- [ ] **Step 5: Commit**

```bash
git add src/app/planner/page.tsx src/components/planner/PlannerTable.tsx src/components/Navbar.tsx
git commit -m "feat(v2): /planner U-21 cohort board (inferred training, age-21 projections, gap, benchmarks)"
```

---

### Task 12: Docs, cleanup, recalibration loop

**Files:**
- Delete: `v2/th-sample.html` (leftover raw scrape of Lenart Kos's traininghistory page — already captured as `calibration-cases/auto/th-55135481.json`)
- Modify: `../CLAUDE.md` (repo-root, v2 section)
- Modify: `../docs/research/training/README.md`
- Modify: `../docs/superpowers/specs/2026-07-14-training-planner-v2-design.md` (status addendum)

- [ ] **Step 1: Delete the leftover file**

```bash
rm th-sample.html
```

- [ ] **Step 2: CLAUDE.md addendum**

Add to the v2 section of the repo-root `CLAUDE.md`, after the "Training lab tab" paragraph:

```markdown
**Training Phase C shipped 2026-07-15** — Inference flywheel + `/planner` cohort board.
Tables: `skill_pops` (displayed-level changes between consecutive full snapshots; source
'snapshots' rebuilt each run, 'own-scrape' exact-date rows persist — written by
training:scrape-history) and `training_observations` (per club-window inferred training +
confidence; full rebuild each run). Job: `runTrainingInference` in
`src/server/sync/inference.ts` — DB-only (no BB calls), daily in `/api/cron/daily`, manual
row on /settings, local run `npm run training:infer`. Key design: BB clubs pick ONE
training/week, so pops pool across a club's tracked players; weekly api snapshots are
LIGHT (no skills), so pops come from census/market/manual windows (multi-week). Scoring:
`inferClubTraining` (`src/lib/training/infer.ts`) — Σ min(predicted bbscout gain over the
window's minutes, observed delta) per candidate type; confidence from pop count + margin
vs best different-primary rival; ST/FT pops excluded (gym/TC pop them independently).
Pop-anchored sublevels: `sublevels.ts` + `boundsFromAnchors`/`applyAnchors` in bridge —
a pop observed at a known date pins that skill near x.0, tightening the ensemble band
(`ensembleProject` accepts per-skill `sublevelBounds`); wired into player page + training
lab. `/planner` (nav: Planner): all Slovene 18–21 full-skill prospects — inferred club
training, avg minutes, TSP vs NT-track benchmark (`benchmarks.ts`, thread 323477:
18:55/19:70/20:83/21:100), projected TSP@end-of-21 under current vs best archetype
template (neutral staff coach 5/YT 5), gap-sorted for outreach. Board math in
`src/lib/training/board.ts` (pure), data in `src/queries/planner.ts`.
```

Also update the "All v2 phases complete" line to mention training Phase C.

- [ ] **Step 3: Research README — recalibration loop**

Append to `docs/research/training/README.md`:

```markdown
## Recalibration loop (Phase C, 2026-07-15)

Ground truth accumulates in two places:
1. `skill_pops` source='own-scrape' — exact-date pops from `npm run training:scrape-history`
   (own clubs only; re-run periodically before BB's training history rolls off).
2. `training_observations` — per-club inferred training from pooled snapshot-window pops +
   minutes. CAUTION: inferred WITH bbscout rates — do not feed observations back into rate
   fitting blindly (circularity). Safe calibration subset: windows where the eligible set
   is unambiguous (confidence 'high' with a dominant margin) — the *identity* of the
   training is then minutes-constrained, and the observed pop count vs predicted pop count
   on that training is a fair error signal.

Loop: scrape-history → `npm run training:replay` scores models on exact-date cases →
adjust bbscout params → `npm run training:infer` rebuilds observations → /planner
confidence mix shifts. Weekly DMI-based pop timing (invertible DMI formula, gated
FINDINGS.md) remains the Phase C+ upgrade for non-owned prospects.
```

- [ ] **Step 4: Spec status addendum**

In the spec's status-update blockquote, append one sentence:

```markdown
> **Phase C shipped 2026-07-15:** inference flywheel (`skill_pops` + per-club
> `training_observations`, daily DB-only job), pop-anchored sublevel bounds in the
> ensemble, NT-track TSP benchmarks, and the `/planner` cohort board (product 2).
> Remaining: coach handoff (3), reverse planner (4), ceiling evaluator (5) — Phase D.
```

- [ ] **Step 5: Final verification + commit**

Run: `npm test` and `npm run build` — both clean.

```bash
git add -A ..
git commit -m "docs: Phase C shipped record + recalibration loop; drop leftover th-sample.html"
```

---

## Self-Review Notes

- **Spec coverage:** Phase C = "inference flywheel + cohort board (+ observations feeding calibration; recalibration loop documented)". Inference: Tasks 2, 4, 5. Cohort board: Tasks 9–11. Observations→calibration + loop doc: Tasks 8, 12. Memory's Phase C extras: pop-anchored sublevels (Tasks 6–8), TSP benchmarks (Task 3). The spec's `training_observations` was per player-week; reality (light api snapshots) forces per-club-window — documented in Task 5 and CLAUDE.md addendum.
- **Type consistency:** `PopEvent` (T2) consumed by T4/T5; `PlayerWindowEvidence`/`InferenceResult` (T4) by T5; `SublevelBound`/`PopAnchor` (T6) by T7/T10; `BoardPlayerInput`/`BoardRow` (T9) by T10/T11; `WeekMinutes` reused from `@/queries/minutes` everywhere.
- **Known simplifications (documented, deliberate):** inference assumes coach 5 and one training over the whole window (clubs switching mid-window blur into 'low' confidence); `predictedGain` uses window-start state without week-by-week evolution; ST/FT weeks not inferable; board staff assumptions neutralize staff quality out of the gap.

---

## Erratum (2026-07-15, post final review)

Three plan-level bugs were found by the final whole-branch review and fixed after Task 12
(the implementation had transcribed the plan faithfully — these were design errors):
1. Anchor selection ordered by `window_end desc`, which always preferred wide bracketing
   snapshot windows over exact-date own-scrape anchors (tie-break unreachable). Fixed:
   order by `window_start desc` — band tightness depends only on window_start.
2. `MAX_WEEKLY_GAIN = 0.30` was below bbscout's own trained-primary weekly gains (~0.65);
   anchored bands could exclude the true trajectory. Fixed: 0.90 (upper envelope).
3. `computeBoardRow` treated MISSING minutes data as ZERO minutes (opposite of infer.ts's
   assume-full convention), letting data-gap artifacts dominate the /planner gap sort.
   Fixed: empty recentWeeks → null avgMinutes → engine assumes full minutes.
Also hardened: inference job rebuild is now a single atomic db.batch transaction.
Do not reuse the plan's Task 6/7/9/10 code blocks without these corrections.

## Post-review backlog (final-review triage, 2026-07-15 — none block prod)

- **Inference / observations**: guard against v1-migrated owner-less snapshot pairs attributing
  historical windows to a player's CURRENT club (require `cur.ownerTeamId` or a freshness cutoff);
  observation selection takes newest window per club regardless of quality — a fresh 1-pop
  low/null window shadows an older high-confidence one (consider `(inferred_training_id is not
  null) desc` or recency-weighted pick); confidence margin needs an absolute floor (margin=∞ when
  all different-primary rivals score ≤0 can promote a barely-positive top to 'high') — fold into
  the ground-truth threshold recalibration; detectPops skips same-day pairs, permanently dropping
  a pop that lands between two same-day captures (merge same-day pairs into the neighbor window).
- **Sublevels**: MAX_WEEKLY_GAIN=0.90 is a coarse global envelope — per-skill model-derived caps
  (bbscout-high rate × height × staff for THAT skill) are the principled upgrade.
- **Board/planner**: tsp12's +0.5 display-equivalent assumes d−0.5 midpoints, so anchored skills
  (near d−0.99) read up to ~0.5/skill low at short horizons (gap unaffected); weeksToEndOfAge21
  vs project() has a one-week horizon-boundary convention mismatch (~0.3–0.5 TSP over 55 weeks,
  mostly cancels in gap) — decide the convention deliberately; minutes lookback goes empty in
  season weeks 1–2 (benign post full-minutes fallback; real fix = cross-boundary lookback);
  potential=null coerced to 0 renders fake 'Pot 0' + drops player at minPot≥1 — make nullable.
- **UI**: sortable `<th>` keyboard access/aria-sort; club-cell truncate is a no-op on `<td>`
  (needs inline-block wrapper); minPot accepts typed negatives (harmless).
- **Housekeeping**: verify the implementer-reported pre-existing `npx tsc --noEmit` error in
  `src/lib/table.test.ts` (predates Phase C; vitest+next build both green regardless).

## Backlog progress (2026-07-17)

**Inference / observations — all four guards shipped**:
- Owner guard: club evidence now requires `cur.ownerTeamId` recorded on the window-end
  snapshot; no fallback to the player's current club. Owner-less (v1-legacy) windows still
  produce pops, just no club attribution. (census + market snapshots both record owner.)
- Same-day merge: same-day (< 12h) capture runs are collapsed before pairing — last
  timestamp wins, per-skill last non-null — via `collapseSameDaySnaps` in pops.ts (applied
  inside detectPops) and a row-level mirror `collapseSameDayRows` in sync/inference.ts, so
  a pop landing between two same-day captures folds into the surrounding window instead of
  vanishing.
- Margin floor: `RIVAL_SCORE_FLOOR = 0.5` in infer.ts — the margin denominator is floored,
  so all-rivals-≤0 no longer yields ∞, and epsilon-score windows (near-zero minutes) stay
  'low' (regression test: 1 PG minute, probed top 0.014 / rival 0.003, was promoted to
  'medium'). Exact value is engineering judgment — fold into ground-truth recalibration.
- Observation pick: the planner query now takes the newest USABLE observation per club
  (`inferred_training_id` non-null AND confidence high/medium), falling back to low/null
  rows only when nothing usable exists. Recency still decides among usable windows so a
  genuine training switch surfaces once re-inferred at medium+.

**Housekeeping — resolved**: the `tsc --noEmit` error was real (table.test.ts fixture
missing seven newer PlayerListRow fields — scoutedThisSeason through ownerManager); fixed,
`tsc --noEmit` now clean.

Still open: Sublevels per-skill caps; Board/planner (tsp12 midpoint bias, weeksToEndOfAge21
convention, weeks 1–2 minutes lookback, potential=null); UI (th a11y, club-cell truncate,
minPot negatives).
