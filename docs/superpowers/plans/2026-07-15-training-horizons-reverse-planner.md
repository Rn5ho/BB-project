# Training Horizons + Reverse Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (A) Horizon targets — plans aim at an `(age, season-week)` target with auto-derived
last block and self-updating persistence; (B) reverse planner — beam search over the real
training simulator that turns a target build into the best training plan.

**Architecture:** Pure-TS helpers in `v2/src/lib/training/` (`horizon.ts`, `optimize.ts`) with
vitest coverage; UI changes concentrated in `PlanEditor`/`ProjectionPanel` (shared by the
player page and the training lab); two nullable int columns on `training_plans`.

**Tech Stack:** Next.js 16 App Router, React client components, Drizzle ORM + Neon Postgres,
vitest.

**Spec:** `docs/superpowers/specs/2026-07-15-training-horizons-reverse-planner-design.md`

## Global Constraints

- All paths below are relative to `v2/` unless prefixed `docs/` (repo root). Run all commands from `v2/`.
- `npm test` is already `vitest run` — do NOT append `run` (it becomes a filename filter).
- Client components need `'use client'`; use `toLocaleString('en-US')` in client code (hydration).
- This is Next.js 16 — conventions may differ from training data; read `node_modules/next/dist/docs/` if unsure.
- Seasons are 14 weeks; players age +1 at the season boundary. **Convention: the current
  season week counts as UPCOMING (not yet trained)** — consistent with
  `project(startWeekOfSeason = w)` whose first plan week trains AT week `w`.
- Engine skills are internal decimal sublevels; displayed value = `ceil`, clamped 1–20.
  Bridge convention: displayed `d` → sublevel `d − 0.5`.
- Windows: `cd /d` doesn't work in the Bash tool; use `pushd "D:\ClaudeProjects\BB-project\v2"` or run via PowerShell tool.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: `horizon.ts` pure module (Wave A)

**Files:**
- Create: `src/lib/training/horizon.ts`
- Test: `src/lib/training/horizon.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module — deliberately imports nothing so UI and engine code can both use it).
- Produces (used by Tasks 3, 4, 6):
  - `WEEKS_PER_SEASON = 14`
  - `interface SeasonPoint { age: number; week: number }` (week 1–14)
  - `absWeek(p: SeasonPoint): number`
  - `fromAbsWeek(a: number): SeasonPoint`
  - `horizonWeeks(now: SeasonPoint, target: SeasonPoint): number` — clamped ≥ 0
  - `horizonPresets(currentAge: number): Array<{ key: string; name: string; target: SeasonPoint }>`
  - `interface PlanBlock { trainingId: number; weeks: number }`
  - `fitBlocksToHorizon(blocks: PlanBlock[], horizon: number): { blocks: PlanBlock[]; overflowWeeks: number }`
  - `blockBoundaries(blocks: PlanBlock[], now: SeasonPoint): Array<{ start: SeasonPoint; end: SeasonPoint }>`
  - `normalizePlan<T extends { blocks: PlanBlock[]; horizon: SeasonPoint | null }>(plan: T, now: SeasonPoint | null): T`

- [ ] **Step 1: Write the failing test**

Create `src/lib/training/horizon.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  absWeek, blockBoundaries, fitBlocksToHorizon, fromAbsWeek, horizonPresets, horizonWeeks,
  normalizePlan,
} from './horizon';

describe('horizonWeeks', () => {
  it('spec worked example: age 20 wk 6 → start of age-21 season = 9', () => {
    expect(horizonWeeks({ age: 20, week: 6 }, { age: 21, week: 1 })).toBe(9);
  });
  it('age 20 wk 6 → end of U-21 (22,1) = 23', () => {
    expect(horizonWeeks({ age: 20, week: 6 }, { age: 22, week: 1 })).toBe(23);
  });
  it('current week counts as upcoming: (20,14) → (21,1) = 1', () => {
    expect(horizonWeeks({ age: 20, week: 14 }, { age: 21, week: 1 })).toBe(1);
  });
  it('same point = 0', () => {
    expect(horizonWeeks({ age: 21, week: 1 }, { age: 21, week: 1 })).toBe(0);
  });
  it('past target clamps to 0', () => {
    expect(horizonWeeks({ age: 21, week: 3 }, { age: 21, week: 1 })).toBe(0);
    expect(horizonWeeks({ age: 22, week: 1 }, { age: 21, week: 14 })).toBe(0);
  });
  it('mid-season target: (20,6) → (21,8) = 16', () => {
    expect(horizonWeeks({ age: 20, week: 6 }, { age: 21, week: 8 })).toBe(16);
  });
});

describe('absWeek/fromAbsWeek', () => {
  it('roundtrips', () => {
    for (const p of [{ age: 18, week: 1 }, { age: 20, week: 14 }, { age: 21, week: 7 }]) {
      expect(fromAbsWeek(absWeek(p))).toEqual(p);
    }
  });
});

describe('horizonPresets', () => {
  it('includes start-21, end-21, end-season with correct targets', () => {
    const ps = horizonPresets(19);
    expect(ps.find((p) => p.key === 'start-21')?.target).toEqual({ age: 21, week: 1 });
    expect(ps.find((p) => p.key === 'end-21')?.target).toEqual({ age: 22, week: 1 });
    expect(ps.find((p) => p.key === 'end-season')?.target).toEqual({ age: 20, week: 1 });
  });
});

describe('fitBlocksToHorizon', () => {
  const blocks = [
    { trainingId: 15, weeks: 21 }, { trainingId: 9, weeks: 10 }, { trainingId: 1, weeks: 8 },
  ];
  it('last block absorbs the remainder', () => {
    const { blocks: fitted, overflowWeeks } = fitBlocksToHorizon(blocks, 40);
    expect(fitted.map((b) => b.weeks)).toEqual([21, 10, 9]);
    expect(overflowWeeks).toBe(0);
  });
  it('earlier blocks overshoot → last 0, overflow reported', () => {
    const { blocks: fitted, overflowWeeks } = fitBlocksToHorizon(blocks, 25);
    expect(fitted.map((b) => b.weeks)).toEqual([21, 10, 0]);
    expect(overflowWeeks).toBe(6);
  });
  it('exact fill → last 0, no overflow', () => {
    const { blocks: fitted, overflowWeeks } = fitBlocksToHorizon(blocks, 31);
    expect(fitted.map((b) => b.weeks)).toEqual([21, 10, 0]);
    expect(overflowWeeks).toBe(0);
  });
  it('single block absorbs the whole horizon', () => {
    expect(fitBlocksToHorizon([{ trainingId: 21, weeks: 3 }], 12).blocks).toEqual([
      { trainingId: 21, weeks: 12 },
    ]);
  });
  it('empty blocks → empty, no overflow', () => {
    expect(fitBlocksToHorizon([], 10)).toEqual({ blocks: [], overflowWeeks: 0 });
  });
  it('does not mutate its input', () => {
    const input = [{ trainingId: 1, weeks: 5 }];
    fitBlocksToHorizon(input, 9);
    expect(input[0].weeks).toBe(5);
  });
});

describe('blockBoundaries', () => {
  it('walks (age, week) across season boundaries', () => {
    const bs = blockBoundaries(
      [{ trainingId: 15, weeks: 9 }, { trainingId: 9, weeks: 5 }],
      { age: 20, week: 6 },
    );
    expect(bs).toEqual([
      { start: { age: 20, week: 6 }, end: { age: 21, week: 1 } },
      { start: { age: 21, week: 1 }, end: { age: 21, week: 6 } },
    ]);
  });
  it('multi-season block', () => {
    const bs = blockBoundaries([{ trainingId: 15, weeks: 30 }], { age: 18, week: 1 });
    expect(bs).toEqual([{ start: { age: 18, week: 1 }, end: { age: 20, week: 3 } }]);
  });
});

describe('normalizePlan', () => {
  const now = { age: 20, week: 6 };
  it('derives the last block from the horizon', () => {
    const plan = {
      blocks: [{ trainingId: 15, weeks: 4 }, { trainingId: 9, weeks: 99 }],
      horizon: { age: 21, week: 1 },
    };
    expect(normalizePlan(plan, now).blocks.map((b) => b.weeks)).toEqual([4, 5]);
  });
  it('no horizon / no now / no blocks → unchanged', () => {
    const plan = { blocks: [{ trainingId: 15, weeks: 4 }], horizon: null };
    expect(normalizePlan(plan, now)).toBe(plan);
    const plan2 = { blocks: [{ trainingId: 15, weeks: 4 }], horizon: { age: 21, week: 1 } };
    expect(normalizePlan(plan2, null)).toBe(plan2);
    const plan3 = { blocks: [], horizon: { age: 21, week: 1 } };
    expect(normalizePlan(plan3, now)).toBe(plan3);
  });
  it('preserves extra fields (generic passthrough)', () => {
    const plan = {
      blocks: [{ trainingId: 15, weeks: 4 }], horizon: { age: 21, week: 1 }, coachLevel: 6,
    };
    expect(normalizePlan(plan, now).coachLevel).toBe(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- horizon`
Expected: FAIL — `Cannot find module './horizon'` (or equivalent resolve error).

- [ ] **Step 3: Write the implementation**

Create `src/lib/training/horizon.ts`:

```ts
// Horizon targets: project a player "up to the moment they enter season-week
// `week` of their age-`age` season" — train every week from now up to but NOT
// including the target week. The current season week counts as UPCOMING (not yet
// trained): seasonWeekOf buckets by 7-day windows and BB's training update lands
// at the end of the bucket. Consistent with project()'s startWeekOfSeason
// semantics (first plan week trains AT the current week).
export const WEEKS_PER_SEASON = 14;

export interface SeasonPoint {
  age: number;
  week: number; // 1..14
}

export interface PlanBlock {
  trainingId: number;
  weeks: number;
}

/** Absolute week index on the age/season-week grid. */
export function absWeek(p: SeasonPoint): number {
  return p.age * WEEKS_PER_SEASON + (p.week - 1);
}

export function fromAbsWeek(a: number): SeasonPoint {
  return { age: Math.floor(a / WEEKS_PER_SEASON), week: (a % WEEKS_PER_SEASON) + 1 };
}

/** Training weeks from `now` up to (excluding) `target`, clamped ≥ 0. */
export function horizonWeeks(now: SeasonPoint, target: SeasonPoint): number {
  return Math.max(0, absWeek(target) - absWeek(now));
}

export interface HorizonPreset {
  key: string;
  name: string;
  target: SeasonPoint;
}

/** Quick presets for the picker. A preset may lie in the past for an old player —
 *  horizonWeeks clamps to 0 and the UI explains. */
export function horizonPresets(currentAge: number): HorizonPreset[] {
  return [
    { key: 'start-21', name: 'Start of age-21 season', target: { age: 21, week: 1 } },
    { key: 'end-21', name: 'End of U-21 (age-21 complete)', target: { age: 22, week: 1 } },
    { key: 'end-season', name: 'End of this season', target: { age: currentAge + 1, week: 1 } },
  ];
}

/** Replace the LAST block's weeks with whatever remains of the horizon.
 *  overflowWeeks > 0 = the earlier blocks alone overshoot the target. */
export function fitBlocksToHorizon(
  blocks: PlanBlock[],
  horizon: number,
): { blocks: PlanBlock[]; overflowWeeks: number } {
  if (blocks.length === 0) return { blocks: [], overflowWeeks: 0 };
  const earlier = blocks.slice(0, -1).reduce((a, b) => a + b.weeks, 0);
  const last = blocks[blocks.length - 1];
  return {
    blocks: [...blocks.slice(0, -1).map((b) => ({ ...b })), { ...last, weeks: Math.max(0, horizon - earlier) }],
    overflowWeeks: Math.max(0, earlier - horizon),
  };
}

/** Per-block (age, week) positions walked from `now`. `end` is the point ENTERED
 *  after the block's last week (exclusive end = start of whatever follows). */
export function blockBoundaries(
  blocks: PlanBlock[],
  now: SeasonPoint,
): Array<{ start: SeasonPoint; end: SeasonPoint }> {
  const out: Array<{ start: SeasonPoint; end: SeasonPoint }> = [];
  let cursor = absWeek(now);
  for (const b of blocks) {
    const start = fromAbsWeek(cursor);
    cursor += b.weeks;
    out.push({ start, end: fromAbsWeek(cursor) });
  }
  return out;
}

/** Materialize the horizon-derived last block into the plan's blocks. Identity
 *  when there is no horizon/now/blocks (safe to call unconditionally). */
export function normalizePlan<T extends { blocks: PlanBlock[]; horizon: SeasonPoint | null }>(
  plan: T,
  now: SeasonPoint | null,
): T {
  if (!plan.horizon || !now || plan.blocks.length === 0) return plan;
  return { ...plan, blocks: fitBlocksToHorizon(plan.blocks, horizonWeeks(now, plan.horizon)).blocks };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- horizon`
Expected: PASS (all tests).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS (no regressions).

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/horizon.ts src/lib/training/horizon.test.ts
git commit -m "feat(v2): horizon target math — (age, season-week) grid, fit-to-horizon, block boundaries

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Persistence — schema columns, migration, savePlan, getActivePlan (Wave A)

**Files:**
- Modify: `src/db/schema.ts` (trainingPlans table, ~line 193)
- Create: `drizzle/0009_plan_horizon.sql` (via drizzle-kit generate)
- Modify: `src/app/players/[id]/actions.ts` (savePlan, lines 28–81)
- Modify: `src/queries/minutes.ts` (PlanRow + getActivePlan, lines 41–65)

**Interfaces:**
- Consumes: nothing from other tasks (independent of Task 1).
- Produces:
  - `trainingPlans.horizonAge` / `trainingPlans.horizonWeek` nullable int columns
  - `savePlan(playerId, data)` accepts optional `horizon?: { age: number; week: number } | null`;
    per-block `weeks` validation relaxed to `>= 0`
  - `PlanRow` gains `horizon: { age: number; week: number } | null`

- [ ] **Step 1: Add columns to the schema**

In `src/db/schema.ts`, inside the `trainingPlans` table definition, after
`trainingCourtLevel`:

```ts
  // Horizon target: plan runs until the player ENTERS this (age, season-week).
  // Both null = custom plan (raw week counts, pre-horizon behavior).
  horizonAge: integer('horizon_age'),
  horizonWeek: integer('horizon_week'),
```

- [ ] **Step 2: Generate + apply the migration**

Run: `npx drizzle-kit generate --name plan_horizon`
Expected: creates `drizzle/0009_plan_horizon.sql` containing exactly:

```sql
ALTER TABLE "training_plans" ADD COLUMN "horizon_age" integer;--> statement-breakpoint
ALTER TABLE "training_plans" ADD COLUMN "horizon_week" integer;
```

Run: `npx drizzle-kit migrate`
Expected: exit 0, migration applied to Neon. If this errors, STOP and report — do not
improvise against the production DB.

- [ ] **Step 3: Update savePlan**

In `src/app/players/[id]/actions.ts`, replace the whole `savePlan` function with:

```ts
export async function savePlan(
  playerId: number,
  data: {
    name?: string;
    blocks: Array<{ trainingId: number; weeks: number }>;
    coachLevel: number;
    youthTrainerLevel: number;
    gymLevel?: number;
    trainingCourtLevel?: number;
    /** Horizon target: plan runs until the player enters this (age, week). null = custom. */
    horizon?: { age: number; week: number } | null;
  },
) {
  const { blocks, coachLevel, youthTrainerLevel } = data;
  const gymLevel = data.gymLevel ?? 0;
  const trainingCourtLevel = data.trainingCourtLevel ?? 0;
  const horizon = data.horizon ?? null;
  if (!Number.isInteger(gymLevel) || gymLevel < 0 || gymLevel > 3) {
    throw new Error(`invalid gymLevel: ${gymLevel}`);
  }
  if (!Number.isInteger(trainingCourtLevel) || trainingCourtLevel < 0 || trainingCourtLevel > 3) {
    throw new Error(`invalid trainingCourtLevel: ${trainingCourtLevel}`);
  }
  if (!Number.isInteger(blocks.length) || blocks.length < 1 || blocks.length > 40) {
    throw new Error('plan must have 1-40 blocks');
  }
  let totalWeeks = 0;
  for (const b of blocks) {
    if (!Number.isInteger(b.trainingId) || b.trainingId < 1 || b.trainingId > 33) {
      throw new Error(`invalid trainingId: ${b.trainingId}`);
    }
    // weeks 0 is legal: a horizon-derived last block can be exactly filled by earlier blocks.
    if (!Number.isInteger(b.weeks) || b.weeks < 0 || b.weeks > 140) {
      throw new Error(`invalid weeks: ${b.weeks}`);
    }
    totalWeeks += b.weeks;
  }
  if (totalWeeks > 140) throw new Error('total plan weeks must be <= 140');
  if (!Number.isInteger(coachLevel) || coachLevel < 1 || coachLevel > 7) {
    throw new Error(`invalid coachLevel: ${coachLevel}`);
  }
  if (!Number.isInteger(youthTrainerLevel) || youthTrainerLevel < 0 || youthTrainerLevel > 7) {
    throw new Error(`invalid youthTrainerLevel: ${youthTrainerLevel}`);
  }
  if (horizon != null) {
    if (!Number.isInteger(horizon.age) || horizon.age < 19 || horizon.age > 22) {
      throw new Error(`invalid horizon age: ${horizon.age}`);
    }
    if (!Number.isInteger(horizon.week) || horizon.week < 1 || horizon.week > 14) {
      throw new Error(`invalid horizon week: ${horizon.week}`);
    }
  }

  await db.update(trainingPlans).set({ isActive: false }).where(eq(trainingPlans.playerId, playerId));
  await db.insert(trainingPlans).values({
    playerId,
    name: data.name?.trim() || 'Plan',
    blocks,
    coachLevel,
    youthTrainerLevel,
    gymLevel,
    trainingCourtLevel,
    horizonAge: horizon?.age ?? null,
    horizonWeek: horizon?.week ?? null,
    isActive: true,
  });
  revalidatePath(`/players/${playerId}`);
}
```

- [ ] **Step 4: Update PlanRow + getActivePlan**

In `src/queries/minutes.ts`, add to the `PlanRow` interface (after `gymLevel: number; trainingCourtLevel: number;`):

```ts
  horizon: { age: number; week: number } | null;
```

In `getActivePlan`'s returned object, add (after `trainingCourtLevel: row.trainingCourtLevel,` —
check the exact existing field list and keep it intact):

```ts
    horizon: row.horizonAge != null && row.horizonWeek != null
      ? { age: row.horizonAge, week: row.horizonWeek }
      : null,
```

- [ ] **Step 5: Verify compile + tests**

Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: compiles. (Callers of savePlan don't pass `horizon` yet — it's optional. The
`PlanRow.horizon` addition may surface type errors in components that construct PlanRow
literals — there are none today, but if the build says otherwise, fix by adding `horizon: null`.)

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/ src/app/players/[id]/actions.ts src/queries/minutes.ts
git commit -m "feat(v2): persist plan horizon target (nullable columns, savePlan validation, PlanRow)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: HorizonPicker + PlanEditor rework (Wave A)

**Files:**
- Create: `src/components/training/HorizonPicker.tsx`
- Modify: `src/components/player/PlanEditor.tsx` (full rewrite below)

**Interfaces:**
- Consumes: Task 1's `horizon.ts` exports; existing `BoundedNumberInput`, `TRAINING_CATALOG`, `PlanTemplate`.
- Produces:
  - `PlanValue` gains `horizon: SeasonPoint | null` (Tasks 4 and 6 rely on this).
  - `PlanEditor` gains optional prop `currentSeasonWeek?: number | null`.
  - `HorizonPicker` component: `{ value: SeasonPoint | null; onChange: (t: SeasonPoint | null) => void; currentAge: number; required?: boolean }`.

- [ ] **Step 1: Create HorizonPicker**

Create `src/components/training/HorizonPicker.tsx`:

```tsx
'use client';

import BoundedNumberInput from '@/components/training/BoundedNumberInput';
import { horizonPresets, type SeasonPoint } from '@/lib/training/horizon';

/** (age, season-week) horizon target picker: preset dropdown + editable pair.
 *  `required` hides the "Custom (no target)" option (reverse planner always needs one). */
export default function HorizonPicker({
  value, onChange, currentAge, required,
}: {
  value: SeasonPoint | null;
  onChange: (t: SeasonPoint | null) => void;
  currentAge: number;
  required?: boolean;
}) {
  const presets = horizonPresets(currentAge);
  const selectValue = value == null
    ? 'custom'
    : presets.find((p) => p.target.age === value.age && p.target.week === value.week)?.key ?? 'specific';

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'custom') onChange(null);
          else if (v === 'specific') onChange(value ?? { age: 21, week: 1 });
          else {
            const p = presets.find((pp) => pp.key === v);
            if (p) onChange({ ...p.target });
          }
        }}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
      >
        {!required && <option value="custom">Custom (no target)</option>}
        {presets.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
        <option value="specific">Specific week…</option>
      </select>
      {value != null && (
        <span className="inline-flex items-center gap-1 text-sm text-neutral-400">
          age
          <BoundedNumberInput
            value={value.age} min={19} max={22}
            onCommit={(n) => onChange({ ...value, age: n })}
            className="w-14 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
          />
          wk
          <BoundedNumberInput
            value={value.week} min={1} max={14}
            onCommit={(n) => onChange({ ...value, week: n })}
            className="w-14 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
          />
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Rewrite PlanEditor**

Replace the full contents of `src/components/player/PlanEditor.tsx` with:

```tsx
'use client';

import BoundedNumberInput from '@/components/training/BoundedNumberInput';
import HorizonPicker from '@/components/training/HorizonPicker';
import { TRAINING_CATALOG } from '@/lib/training/catalog';
import {
  WEEKS_PER_SEASON, blockBoundaries, fitBlocksToHorizon, horizonWeeks, normalizePlan,
  type SeasonPoint,
} from '@/lib/training/horizon';
import type { PlanTemplate } from '@/lib/training/templates';

export interface PlanValue {
  blocks: Array<{ trainingId: number; weeks: number }>;
  coachLevel: number;
  youthTrainerLevel: number;
  gymLevel: number;
  trainingCourtLevel: number;
  /** Horizon target: plan runs until the player enters this (age, week). null = custom. */
  horizon: SeasonPoint | null;
}

export default function PlanEditor({
  value, onChange, onSave, saving, templates, startAge, endAge: endAgeExact, hideSave,
  currentSeasonWeek,
}: {
  value: PlanValue;
  onChange: (next: PlanValue) => void;
  onSave: () => void;
  saving: boolean;
  templates: PlanTemplate[];
  /** Player's current age — fallback for the rough end-age preview text. */
  startAge?: number | null;
  /** Season-aware final age from the projection — preferred over the rough estimate. */
  endAge?: number | null;
  /** Hides the Save button (e.g. for hypothetical players with nothing to persist). */
  hideSave?: boolean;
  /** Current season week (1–14). Together with startAge enables horizon targets. */
  currentSeasonWeek?: number | null;
}) {
  const now: SeasonPoint | null =
    startAge != null && currentSeasonWeek != null
      ? { age: Math.floor(startAge), week: currentSeasonWeek }
      : null;
  const hWeeks = now && value.horizon ? horizonWeeks(now, value.horizon) : null;
  const overflowWeeks =
    hWeeks != null ? fitBlocksToHorizon(value.blocks, hWeeks).overflowWeeks : 0;
  const boundaries = now ? blockBoundaries(value.blocks, now) : null;

  const totalWeeks = value.blocks.reduce((a, b) => a + b.weeks, 0);
  const seasons = totalWeeks / WEEKS_PER_SEASON;
  const endAge = endAgeExact ?? (startAge != null ? Math.floor(startAge + seasons) : null);

  /** All edits flow through here so a horizon-derived last block stays materialized. */
  function emit(next: PlanValue) {
    onChange(normalizePlan(next, now));
  }
  function updateBlock(i: number, patch: Partial<{ trainingId: number; weeks: number }>) {
    emit({ ...value, blocks: value.blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });
  }
  function removeBlock(i: number) {
    emit({ ...value, blocks: value.blocks.filter((_, idx) => idx !== i) });
  }
  function addBlock() {
    emit({ ...value, blocks: [...value.blocks, { trainingId: 1, weeks: 8 }] });
  }
  function applyTemplate(key: string) {
    const tpl = templates.find((t) => t.key === key);
    if (!tpl) return;
    emit({ ...value, blocks: tpl.blocks.map((b) => ({ ...b })) });
  }

  return (
    <div className="space-y-3">
      {now && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-400">Plan until</span>
            <HorizonPicker
              value={value.horizon}
              onChange={(h) => emit({ ...value, horizon: h })}
              currentAge={now.age}
            />
          </div>
          <p className="text-xs text-neutral-500">
            Now: age {now.age} · wk {now.week}
            {now.age <= 20 && <> · {horizonWeeks(now, { age: 21, week: 1 })} wks to age-21 season</>}
            {now.age <= 21 && <> · {horizonWeeks(now, { age: 22, week: 1 })} wks to end of U-21</>}
          </p>
          {hWeeks === 0 && (
            <p className="text-xs text-amber-500">
              Target is in the past for this player — pick a later target or Custom.
            </p>
          )}
          {overflowWeeks > 0 && (
            <p className="text-xs text-red-400">
              Earlier blocks overshoot the target by {overflowWeeks} wk{overflowWeeks === 1 ? '' : 's'} —
              the projection stops at the target.
            </p>
          )}
        </div>
      )}

      <select
        defaultValue=""
        onChange={(e) => { if (e.target.value) applyTemplate(e.target.value); e.target.value = ''; }}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
      >
        <option value="">Start from template…</option>
        {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
      </select>

      <div className="space-y-1.5">
        {value.blocks.map((b, i) => {
          const isDerivedLast = value.horizon != null && now != null && i === value.blocks.length - 1;
          const bd = boundaries?.[i];
          return (
            <div key={i} className="flex items-center gap-2">
              <select
                value={b.trainingId}
                onChange={(e) => updateBlock(i, { trainingId: Number(e.target.value) })}
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
              >
                {TRAINING_CATALOG.map((tt) => <option key={tt.id} value={tt.id}>{tt.label}</option>)}
              </select>
              {isDerivedLast ? (
                <span
                  className="w-16 rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-center text-sm text-neutral-400"
                  title="Derived from the horizon target — switch to Custom to edit by hand"
                >
                  {b.weeks}
                </span>
              ) : (
                <BoundedNumberInput
                  value={b.weeks} min={1} max={140}
                  onCommit={(n) => updateBlock(i, { weeks: n })}
                  className="w-16 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
                />
              )}
              <span className="text-xs text-neutral-500">wks{isDerivedLast ? ' · auto' : ''}</span>
              {bd && (
                <span className="whitespace-nowrap text-[10px] text-neutral-600">
                  {bd.start.age}·w{bd.start.week} → {bd.end.age}·w{bd.end.week}
                </span>
              )}
              <button onClick={() => removeBlock(i)} className="text-neutral-600 hover:text-red-400 px-1" aria-label="Remove block">×</button>
            </div>
          );
        })}
        {value.blocks.length === 0 && <p className="text-sm text-neutral-500">No blocks yet — add one or start from a template.</p>}
      </div>
      <button onClick={addBlock} className="text-sm text-amber-500 hover:text-amber-400">+ add block</button>

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-800">
        <label className="flex items-center gap-1.5 text-sm">
          Coach
          <select
            value={value.coachLevel}
            onChange={(e) => emit({ ...value, coachLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          Youth trainer
          <select
            value={value.youthTrainerLevel}
            onChange={(e) => emit({ ...value, youthTrainerLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm" title="Extra cross-training slots — random skill gains each week">
          Gym
          <select
            value={value.gymLevel}
            onChange={(e) => emit({ ...value, gymLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm" title="Passive free-throw training every week, no training slot needed">
          Training court
          <select
            value={value.trainingCourtLevel}
            onChange={(e) => emit({ ...value, trainingCourtLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <p className="text-xs text-neutral-500">
        Total: {totalWeeks} week{totalWeeks === 1 ? '' : 's'} (~{seasons.toFixed(1)} seasons)
        {endAge != null && ` · ends at age ${endAge}`}
        {value.horizon != null && ` · target: age ${value.horizon.age} wk ${value.horizon.week}`}
      </p>

      {!hideSave && (
        <button
          onClick={onSave}
          disabled={saving || value.blocks.length === 0}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save plan'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify compile fails ONLY where expected**

Run: `npm run build`
Expected: FAILS in `ProjectionPanel.tsx` (its `useState<PlanValue>` initializers don't set
`horizon`). That's Task 4's job. If it fails anywhere else, fix here first.

- [ ] **Step 4: Commit**

```bash
git add src/components/training/HorizonPicker.tsx src/components/player/PlanEditor.tsx
git commit -m "feat(v2): PlanEditor horizon targets — picker, derived last block, status line, block annotations

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(Committing a red build is acceptable here ONLY because Task 4 lands in the same PR-sized
unit and immediately follows; if executing with review gates, fold Tasks 3+4 into one review.)

---

### Task 4: ProjectionPanel + BandChart markers + plumbing (Wave A)

**Files:**
- Modify: `src/components/charts/BandChart.tsx`
- Modify: `src/components/training/ProjectionPanel.tsx`
- Modify: `src/components/player/DevelopmentSection.tsx` (handleSave)
- Modify: `src/components/training/TrainingLab.tsx` (SelectedPlayer type, save, manual week)
- Modify: `src/app/training/page.tsx` (initialPlan mapping, line ~62)

**Interfaces:**
- Consumes: Task 1 helpers, Task 3's `PlanValue.horizon` + `currentSeasonWeek` prop, Task 2's `PlanRow.horizon` and `savePlan` horizon param.
- Produces: `BandChart` optional prop `markers?: Array<{ x: number; label: string }>`;
  ProjectionPanel `initialPlan` type gains `horizon?: { age: number; week: number } | null`.

- [ ] **Step 1: BandChart markers**

In `src/components/charts/BandChart.tsx`:

Add to props (after `xLabel`):

```tsx
  markers,
```

and to the type:

```tsx
  /** Vertical dashed reference lines (e.g. season boundaries), positioned on the x scale. */
  markers?: Array<{ x: number; label: string }>;
```

Then add the rendering inside the SVG, immediately AFTER the existing
`<g transform={...}>` block that draws the area + central line:

```tsx
      {markers?.map((m, i) => {
        const x = sx(m.x);
        if (!Number.isFinite(x) || x < 0 || x > innerW) return null;
        return (
          <g key={i} transform={`translate(${pad},${pad / 2})`}>
            <line x1={x} x2={x} y1={0} y2={innerH} stroke="#525252" strokeDasharray="3,3" />
            <text x={x + 3} y={9} fontSize="9" fill="#a3a3a3">{m.label}</text>
          </g>
        );
      })}
```

- [ ] **Step 2: ProjectionPanel — horizon state, truncation, markers, TargetBuildPanel slot**

In `src/components/training/ProjectionPanel.tsx`:

Add imports:

```tsx
import { horizonWeeks, normalizePlan, type SeasonPoint } from '@/lib/training/horizon';
```

Extend the `initialPlan` prop type (add the horizon field):

```tsx
  initialPlan?: { blocks: Array<{ trainingId: number; weeks: number }>; coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number; horizon?: { age: number; week: number } | null } | null;
```

Replace the `useState<PlanValue>` initializer with (note `now` must be computed above it):

```tsx
  const now: SeasonPoint | null = age != null ? { age: Math.floor(age), week: startWeekOfSeason } : null;
  const [plan, setPlan] = useState<PlanValue>(() => {
    if (initialPlan) {
      return normalizePlan({
        blocks: initialPlan.blocks.map((b) => ({ ...b })), coachLevel: initialPlan.coachLevel,
        youthTrainerLevel: initialPlan.youthTrainerLevel,
        gymLevel: initialPlan.gymLevel ?? 0, trainingCourtLevel: initialPlan.trainingCourtLevel ?? 0,
        horizon: initialPlan.horizon ?? null,
      }, now);
    }
    const first = templates[0];
    return { blocks: first ? first.blocks.map((b) => ({ ...b })) : [], coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0, horizon: null };
  });
```

Replace the `weekConfigs` memo with (truncate at the horizon so overshooting earlier
blocks can't project past the target):

```tsx
  const horizonLen = plan.horizon && now ? horizonWeeks(now, plan.horizon) : null;
  const weekConfigs = useMemo(() => {
    const all = planToWeeks(plan.blocks, plan.coachLevel, plan.youthTrainerLevel,
      { gymLevel: plan.gymLevel, trainingCourtLevel: plan.trainingCourtLevel });
    return horizonLen != null ? all.slice(0, horizonLen) : all;
  }, [plan, horizonLen]);
```

Add a markers memo after the `points` memo (season boundaries = the projected player ages up):

```tsx
  const markers = useMemo(() => {
    if (!result) return [];
    const ms: Array<{ x: number; label: string }> = [];
    for (let i = 0; i < result.central.weeks.length; i++) {
      const w = result.central.weeks[i];
      if (w.seasonWeek === 14) ms.push({ x: i + 1, label: `age ${w.age + 1}` });
    }
    return ms;
  }, [result]);
```

Pass them to the chart: `<BandChart points={points} xLabel={(x) => `wk ${x}`} markers={markers} />`

Pass the season week to the editor — in the `<PlanEditor …>` JSX add:

```tsx
          currentSeasonWeek={startWeekOfSeason}
```

- [ ] **Step 3: DevelopmentSection passes horizon on save**

In `src/components/player/DevelopmentSection.tsx`, in `handleSave`, add to the `savePlan` payload:

```ts
      horizon: value.horizon,
```

- [ ] **Step 4: TrainingLab — type, save, manual-mode week**

In `src/components/training/TrainingLab.tsx`:

Change the `SelectedPlayer.initialPlan` field to:

```ts
  initialPlan: { blocks: Array<{ trainingId: number; weeks: number }>; coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number; horizon?: { age: number; week: number } | null } | null;
```

Replace `handleSaveSelected` with (import `type { PlanValue } from '@/components/player/PlanEditor'`):

```ts
  async function handleSaveSelected(value: PlanValue) {
    if (!selected) return;
    await savePlan(selected.bbPlayerId, {
      blocks: value.blocks,
      coachLevel: value.coachLevel,
      youthTrainerLevel: value.youthTrainerLevel,
      gymLevel: value.gymLevel,
      trainingCourtLevel: value.trainingCourtLevel,
      horizon: value.horizon,
    });
  }
```

In the **manual mode** `<ProjectionPanel …>`, change `startWeekOfSeason={1}` to
`startWeekOfSeason={startWeekOfSeason}` (horizon targets need the real current week).

- [ ] **Step 5: training/page.tsx initialPlan mapping**

In `src/app/training/page.tsx` (~line 62), replace the `initialPlan:` mapping with:

```ts
          initialPlan: activePlan
            ? {
                blocks: activePlan.blocks, coachLevel: activePlan.coachLevel,
                youthTrainerLevel: activePlan.youthTrainerLevel,
                gymLevel: activePlan.gymLevel, trainingCourtLevel: activePlan.trainingCourtLevel,
                horizon: activePlan.horizon,
              }
            : null,
```

(This also fixes a pre-existing gap: the lab dropped the saved gym/TC levels.)

- [ ] **Step 6: Verify**

Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/charts/BandChart.tsx src/components/training/ProjectionPanel.tsx src/components/player/DevelopmentSection.tsx src/components/training/TrainingLab.tsx src/app/training/page.tsx
git commit -m "feat(v2): horizon wiring — projection truncation, age markers on band chart, save/load plumbing

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `optimize.ts` beam-search reverse planner (Wave B)

**Files:**
- Create: `src/lib/training/optimize.ts`
- Test: `src/lib/training/optimize.test.ts`

**Interfaces:**
- Consumes: `weekStep`, `displayed`, `PlayerState`, `WeekConfig` from `./engine`; `BBSCOUT` from `./models/bbscout`; `TRAINING_CATALOG` from `./catalog`; `SKILL_KEYS`, `SkillKey`, `Skills` from `./types`.
- Produces (Task 6 relies on these exact names):
  - `type TargetPriority = 'high' | 'normal' | 'low'`; `PRIORITY_WEIGHT`
  - `interface SkillTarget { skill: SkillKey; displayed: number; priority: TargetPriority }`
  - `interface OptimizeOptions { horizonWeeks; startWeekOfSeason; coachLevel; youthTrainerLevel; gymLevel?; trainingCourtLevel?; beamWidth? }` (all numbers)
  - `interface PlanCandidate { weekly: number[]; blocks: PlanBlock-shaped[]; finalSkills: Skills; hitWeek: Partial<Record<SkillKey, number | null>>; shortfall: Partial<Record<SkillKey, number>>; totalShortfall: number; earliness: number; tsp: number; switches: number; reachable: boolean }`
  - `interface OptimizeResult { best: PlanCandidate | null; alternatives: PlanCandidate[] }`
  - `optimizePlan(start: PlayerState, targets: SkillTarget[], opts: OptimizeOptions): OptimizeResult`
  - `evaluatePlan(start: PlayerState, weekly: number[], targets: SkillTarget[], opts: Omit<OptimizeOptions, 'horizonWeeks' | 'beamWidth'>): PlanCandidate`
  - `collapseWeekly(weekly: number[]): Array<{ trainingId: number; weeks: number }>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/training/optimize.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { project, type PlayerState, type WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { collapseWeekly, evaluatePlan, optimizePlan, type SkillTarget } from './optimize';
import { SKILL_KEYS, type Skills } from './types';

const uniform = (v: number): Skills =>
  Object.fromEntries(SKILL_KEYS.map((k) => [k, v])) as Skills;

function player(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    skills: uniform(4.5), age: 18, heightCm: 203, potential: 9,
    ftSkill: 4.5, staminaSkill: 4.5, ...overrides,
  };
}

// beamWidth 64 keeps the suite fast; determinism doesn't depend on width.
const OPTS = {
  horizonWeeks: 20, startWeekOfSeason: 1, coachLevel: 5, youthTrainerLevel: 0,
  gymLevel: 0, trainingCourtLevel: 0, beamWidth: 64,
};
const EVAL_OPTS = {
  startWeekOfSeason: 1, coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0,
};

describe('collapseWeekly', () => {
  it('merges runs into blocks', () => {
    expect(collapseWeekly([1, 1, 9, 9, 9, 1])).toEqual([
      { trainingId: 1, weeks: 2 }, { trainingId: 9, weeks: 3 }, { trainingId: 1, weeks: 1 },
    ]);
  });
  it('empty → empty', () => {
    expect(collapseWeekly([])).toEqual([]);
  });
});

describe('optimizePlan', () => {
  it('single target: reaches it, IS trainings dominate pre-hit, finals match project()', () => {
    const targets: SkillTarget[] = [{ skill: 'is', displayed: 8, priority: 'normal' }];
    const res = optimizePlan(player(), targets, OPTS);
    expect(res.best).not.toBeNull();
    const best = res.best!;
    expect(best.reachable).toBe(true);
    expect(best.hitWeek.is).not.toBeNull();
    expect(best.weekly).toHaveLength(OPTS.horizonWeeks);

    // Pre-hit weeks are dominated by IS-primary trainings (ids 21, 22, 23).
    const upTo = best.weekly.slice(0, best.hitWeek.is!);
    const isShare = upTo.filter((id) => [21, 22, 23].includes(id)).length / upTo.length;
    expect(isShare).toBeGreaterThan(0.5);

    // Drift guard: the optimizer's stepping must equal the real engine's project().
    const cfgs: WeekConfig[] = best.weekly.map((id) => ({
      trainingId: id, coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0,
    }));
    const proj = project(player(), cfgs, BBSCOUT, { startWeekOfSeason: 1 });
    for (const k of SKILL_KEYS) {
      expect(proj.finalSkills[k]).toBeCloseTo(best.finalSkills[k], 9);
    }
  });

  it('is at least as good as either ordering of a two-skill hand plan', () => {
    const p = player({ heightCm: 190 });
    const targets: SkillTarget[] = [
      { skill: 'ha', displayed: 10, priority: 'normal' },
      { skill: 'od', displayed: 8, priority: 'normal' },
    ];
    const opts = { ...OPTS, horizonWeeks: 24 };
    const res = optimizePlan(p, targets, opts);
    // HA for 1 (id 12) ×12 then OD for 1 (id 9) ×12, and the reverse.
    const haFirst = [...Array(12).fill(12), ...Array(12).fill(9)] as number[];
    const odFirst = [...Array(12).fill(9), ...Array(12).fill(12)] as number[];
    const a = evaluatePlan(p, haFirst, targets, EVAL_OPTS);
    const b = evaluatePlan(p, odFirst, targets, EVAL_OPTS);
    expect(res.best!.totalShortfall).toBeLessThanOrEqual(
      Math.min(a.totalShortfall, b.totalShortfall) + 1e-9,
    );
  });

  it('unreachable target: best-effort plan, positive shortfall, full length', () => {
    const targets: SkillTarget[] = [{ skill: 'sb', displayed: 20, priority: 'high' }];
    const res = optimizePlan(player(), targets, { ...OPTS, horizonWeeks: 4 });
    const best = res.best!;
    expect(best.reachable).toBe(false);
    expect(best.totalShortfall).toBeGreaterThan(0);
    expect(best.weekly).toHaveLength(4);
    expect(best.hitWeek.sb).toBeNull();
  });

  it('switch penalty keeps plans blocky', () => {
    const res = optimizePlan(
      player(), [{ skill: 'rb', displayed: 9, priority: 'normal' }], OPTS,
    );
    expect(res.best!.blocks.length).toBeLessThanOrEqual(5);
  });

  it('high priority protects a skill better than low priority', () => {
    const mk = (isPrio: 'high' | 'low', odPrio: 'high' | 'low'): SkillTarget[] => [
      { skill: 'is', displayed: 9, priority: isPrio },
      { skill: 'od', displayed: 9, priority: odPrio },
    ];
    const opts = { ...OPTS, horizonWeeks: 10 };
    const r1 = optimizePlan(player(), mk('high', 'low'), opts);
    const r2 = optimizePlan(player(), mk('low', 'high'), opts);
    expect(r1.best!.shortfall.is ?? 0).toBeLessThanOrEqual((r2.best!.shortfall.is ?? 0) + 1e-9);
  });

  it('returns null best for zero horizon or already-met targets', () => {
    const t: SkillTarget[] = [{ skill: 'is', displayed: 8, priority: 'normal' }];
    expect(optimizePlan(player(), t, { ...OPTS, horizonWeeks: 0 }).best).toBeNull();
    // current sublevel 4.5 already displays 5 ≥ target 4 → filtered out
    expect(optimizePlan(player(), [{ skill: 'is', displayed: 4, priority: 'normal' }], OPTS).best).toBeNull();
  });

  it('alternatives have different block signatures than best', () => {
    const res = optimizePlan(
      player(), [{ skill: 'is', displayed: 8, priority: 'normal' }], OPTS,
    );
    const sig = (c: { blocks: Array<{ trainingId: number }> }) =>
      c.blocks.map((b) => b.trainingId).join('-');
    for (const alt of res.alternatives) {
      expect(sig(alt)).not.toBe(sig(res.best!));
    }
  });
});

describe('evaluatePlan', () => {
  it('season wrap: ages the player at week 14 like project()', () => {
    const p = player({ age: 20 });
    const weekly = Array(6).fill(21) as number[]; // 6 weeks from season week 10 → crosses boundary
    const targets: SkillTarget[] = [{ skill: 'is', displayed: 9, priority: 'normal' }];
    const cand = evaluatePlan(p, weekly, targets, { ...EVAL_OPTS, startWeekOfSeason: 10 });
    const cfgs: WeekConfig[] = weekly.map((id) => ({
      trainingId: id, coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0,
    }));
    const proj = project(p, cfgs, BBSCOUT, { startWeekOfSeason: 10 });
    for (const k of SKILL_KEYS) {
      expect(proj.finalSkills[k]).toBeCloseTo(cand.finalSkills[k], 9);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- optimize`
Expected: FAIL — cannot resolve `./optimize`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/training/optimize.ts`:

```ts
// Reverse planner: beam search over weekly training choices, stepped with the REAL
// engine (weekStep + BBSCOUT), so week-by-week elastic evolution, cap slowdowns and
// cross-training are discovered by search rather than approximated. Full minutes
// assumed. Objective (lexicographic):
//   1. weighted shortfall at the deadline   (priority weights 3 / 1 / 0.4)
//   2. weighted earliness of target hits    (high-priority skills finish first)
//   3. total TSP (desc)                     (leftover weeks help wherever they can)
//   4. fewer switches
// A small per-switch penalty in the PRUNING score biases survivors toward blocky,
// club-communicable plans without distorting real trade-offs. Note: tier 3 is weak
// under pruning (post-hit, low-switch entries outrank TSP chasers in the beam);
// documented, acceptable for v1.
import { TRAINING_CATALOG } from './catalog';
import { weekStep, type PlayerState, type WeekConfig } from './engine';
import { BBSCOUT } from './models/bbscout';
import { SKILL_KEYS, type SkillKey, type Skills } from './types';

export type TargetPriority = 'high' | 'normal' | 'low';
export const PRIORITY_WEIGHT: Record<TargetPriority, number> = { high: 3, normal: 1, low: 0.4 };

export interface SkillTarget {
  skill: SkillKey;
  displayed: number; // 1..20 target displayed level
  priority: TargetPriority;
}

export interface OptimizeOptions {
  horizonWeeks: number;
  startWeekOfSeason: number; // 1..14
  coachLevel: number;
  youthTrainerLevel: number;
  gymLevel?: number;
  trainingCourtLevel?: number;
  beamWidth?: number; // default 128
}

export interface PlanCandidate {
  weekly: number[]; // trainingId per week
  blocks: Array<{ trainingId: number; weeks: number }>;
  finalSkills: Skills;
  /** 1-based week the target displayed level was first reached; null = not reached. */
  hitWeek: Partial<Record<SkillKey, number | null>>;
  /** Remaining internal sublevels to the target threshold (0 = reached). */
  shortfall: Partial<Record<SkillKey, number>>;
  totalShortfall: number; // tier 1 (weighted)
  earliness: number; // tier 2 (weighted hit weeks; misses count horizon+1)
  tsp: number; // tier 3
  switches: number; // tier 4
  reachable: boolean;
}

export interface OptimizeResult {
  best: PlanCandidate | null;
  alternatives: PlanCandidate[];
}

const SWITCH_PENALTY = 0.02;
const EPS = 1e-6;
/** Minimum internal sublevel whose ceil-display equals `d`. */
const tau = (d: number) => d - 1 + EPS;

const tspOf = (s: Skills) => SKILL_KEYS.reduce((a, k) => a + s[k], 0);

interface BeamEntry {
  state: PlayerState;
  last: number; // last trainingId; 0 = none yet
  weekly: number[];
  switches: number;
  hit: Array<number | null>; // parallel to targets
  shortfall: number; // weighted tier-1 measure of state
  tsp: number;
}

function measure(skills: Skills, targets: SkillTarget[], weights: number[]): number {
  let s = 0;
  for (let i = 0; i < targets.length; i++) {
    s += weights[i] * Math.max(0, tau(targets[i].displayed) - skills[targets[i].skill]);
  }
  return s;
}

/** Pruning order: shortfall + switch penalty, then TSP desc. Stable-sort safe. */
function pruneCompare(a: BeamEntry, b: BeamEntry): number {
  const pa = a.shortfall + a.switches * SWITCH_PENALTY;
  const pb = b.shortfall + b.switches * SWITCH_PENALTY;
  if (Math.abs(pa - pb) > EPS) return pa - pb;
  return b.tsp - a.tsp;
}

export function collapseWeekly(weekly: number[]): Array<{ trainingId: number; weeks: number }> {
  const blocks: Array<{ trainingId: number; weeks: number }> = [];
  for (const id of weekly) {
    const last = blocks[blocks.length - 1];
    if (last && last.trainingId === id) last.weeks++;
    else blocks.push({ trainingId: id, weeks: 1 });
  }
  return blocks;
}

function stepEntry(
  e: BeamEntry,
  trainingId: number,
  cfgBase: Omit<WeekConfig, 'trainingId'>,
  targets: SkillTarget[],
  weights: number[],
  weekNo: number,
  ageUp: boolean,
): BeamEntry {
  const r = weekStep(e.state, { ...cfgBase, trainingId }, BBSCOUT);
  const state: PlayerState = {
    ...e.state,
    skills: r.skillsAfter,
    ftSkill: r.ftAfter,
    staminaSkill: r.staminaAfter,
    age: ageUp ? e.state.age + 1 : e.state.age,
  };
  const hit = e.hit.slice();
  for (let i = 0; i < targets.length; i++) {
    if (hit[i] == null && r.skillsAfter[targets[i].skill] >= tau(targets[i].displayed)) {
      hit[i] = weekNo;
    }
  }
  return {
    state,
    last: trainingId,
    weekly: [...e.weekly, trainingId],
    switches: e.switches + (e.last !== 0 && e.last !== trainingId ? 1 : 0),
    hit,
    shortfall: measure(state.skills, targets, weights),
    tsp: tspOf(state.skills),
  };
}

function toCandidate(
  e: BeamEntry, targets: SkillTarget[], weights: number[], horizon: number,
): PlanCandidate {
  const shortfall: Partial<Record<SkillKey, number>> = {};
  const hitWeek: Partial<Record<SkillKey, number | null>> = {};
  let total = 0;
  let earliness = 0;
  let reachable = true;
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const sf = Math.max(0, tau(t.displayed) - e.state.skills[t.skill]);
    shortfall[t.skill] = sf;
    hitWeek[t.skill] = e.hit[i];
    total += weights[i] * sf;
    earliness += weights[i] * (e.hit[i] ?? horizon + 1);
    if (e.hit[i] == null) reachable = false;
  }
  return {
    weekly: e.weekly,
    blocks: collapseWeekly(e.weekly),
    finalSkills: e.state.skills,
    hitWeek,
    shortfall,
    totalShortfall: total,
    earliness,
    tsp: e.tsp,
    switches: e.switches,
    reachable,
  };
}

function finalCompare(a: PlanCandidate, b: PlanCandidate): number {
  if (Math.abs(a.totalShortfall - b.totalShortfall) > EPS) return a.totalShortfall - b.totalShortfall;
  if (Math.abs(a.earliness - b.earliness) > EPS) return a.earliness - b.earliness;
  if (Math.abs(a.tsp - b.tsp) > EPS) return b.tsp - a.tsp;
  return a.switches - b.switches;
}

/** Sequence of distinct trainings after collapsing runs — the plan's "structure". */
function signature(c: PlanCandidate): string {
  return c.blocks.map((b) => b.trainingId).join('-');
}

export function optimizePlan(
  start: PlayerState,
  targets: SkillTarget[],
  opts: OptimizeOptions,
): OptimizeResult {
  const H = Math.floor(opts.horizonWeeks);
  // Only targets strictly above the current internal level are active.
  const active = targets.filter((t) => start.skills[t.skill] < tau(t.displayed));
  if (H <= 0 || active.length === 0) return { best: null, alternatives: [] };
  const weights = active.map((t) => PRIORITY_WEIGHT[t.priority]);
  const width = opts.beamWidth ?? 128;
  const actions = TRAINING_CATALOG.filter((t) => t.kind === 'skill').map((t) => t.id);
  const cfgBase: Omit<WeekConfig, 'trainingId'> = {
    coachLevel: opts.coachLevel,
    youthTrainerLevel: opts.youthTrainerLevel,
    gymLevel: opts.gymLevel,
    trainingCourtLevel: opts.trainingCourtLevel,
    minutes: undefined, // full minutes assumed
  };

  let beam: BeamEntry[] = [{
    state: { ...start, skills: { ...start.skills } },
    last: 0,
    weekly: [],
    switches: 0,
    hit: active.map(() => null),
    shortfall: measure(start.skills, active, weights),
    tsp: tspOf(start.skills),
  }];
  let seasonWeek = opts.startWeekOfSeason;

  for (let w = 1; w <= H; w++) {
    // Same season-wrap semantics as project(): the training in week `w` uses the
    // pre-increment age; the age bump applies from the NEXT week on.
    const ageUp = seasonWeek >= 14;
    const next: BeamEntry[] = [];
    for (const e of beam) {
      for (const id of actions) next.push(stepEntry(e, id, cfgBase, active, weights, w, ageUp));
    }
    seasonWeek = seasonWeek >= 14 ? 1 : seasonWeek + 1;

    // Dedup near-identical states that arrived by different paths, keep the better.
    const seen = new Map<string, BeamEntry>();
    for (const e of next) {
      const key = e.last + '|' + SKILL_KEYS.map((k) => e.state.skills[k].toFixed(2)).join(',');
      const prev = seen.get(key);
      if (!prev || pruneCompare(e, prev) < 0) seen.set(key, e);
    }
    beam = [...seen.values()].sort(pruneCompare).slice(0, width);
  }

  const cands = beam.map((e) => toCandidate(e, active, weights, H)).sort(finalCompare);
  const best = cands[0] ?? null;
  const alternatives: PlanCandidate[] = [];
  if (best) {
    const sigs = new Set([signature(best)]);
    for (const c of cands.slice(1)) {
      const s = signature(c);
      if (sigs.has(s)) continue;
      sigs.add(s);
      alternatives.push(c);
      if (alternatives.length === 2) break;
    }
  }
  return { best, alternatives };
}

/** Score an explicit weekly plan with the exact same stepping as the search
 *  (drift guard + hand-plan comparison). */
export function evaluatePlan(
  start: PlayerState,
  weekly: number[],
  targets: SkillTarget[],
  opts: Omit<OptimizeOptions, 'horizonWeeks' | 'beamWidth'>,
): PlanCandidate {
  const weights = targets.map((t) => PRIORITY_WEIGHT[t.priority]);
  const cfgBase: Omit<WeekConfig, 'trainingId'> = {
    coachLevel: opts.coachLevel,
    youthTrainerLevel: opts.youthTrainerLevel,
    gymLevel: opts.gymLevel,
    trainingCourtLevel: opts.trainingCourtLevel,
    minutes: undefined,
  };
  let e: BeamEntry = {
    state: { ...start, skills: { ...start.skills } },
    last: 0,
    weekly: [],
    switches: 0,
    hit: targets.map(() => null),
    shortfall: measure(start.skills, targets, weights),
    tsp: tspOf(start.skills),
  };
  let seasonWeek = opts.startWeekOfSeason;
  for (let w = 1; w <= weekly.length; w++) {
    const ageUp = seasonWeek >= 14;
    e = stepEntry(e, weekly[w - 1], cfgBase, targets, weights, w, ageUp);
    seasonWeek = seasonWeek >= 14 ? 1 : seasonWeek + 1;
  }
  return toCandidate(e, targets, weights, weekly.length);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- optimize`
Expected: PASS. If the "blocky" or "dominance" assertions fail marginally, the model data
changed — investigate rather than loosening thresholds blindly (the search itself may have
a bug, e.g. season-wrap timing or dedup dropping the best entry).

- [ ] **Step 5: Full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/optimize.ts src/lib/training/optimize.test.ts
git commit -m "feat(v2): reverse planner — beam search over the real training engine, 3-tier objective

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: TargetBuildPanel + ProjectionPanel integration (Wave B)

**Files:**
- Create: `src/components/training/TargetBuildPanel.tsx`
- Modify: `src/components/training/ProjectionPanel.tsx`

**Interfaces:**
- Consumes: Task 5's `optimizePlan`/`PlanCandidate`/`SkillTarget`/`TargetPriority`; Task 1's
  `horizonWeeks`/`absWeek`/`fromAbsWeek`/`SeasonPoint`; Task 3's `HorizonPicker` and
  `PlanValue.horizon`; `displayed` from engine; `getTrainingType` from catalog; `SKILLS` from
  `@/lib/constants`; `SKILL_DB_NAMES`, `SKILL_KEYS` from training types.
- Produces: `TargetBuildPanel` component (used only by ProjectionPanel).

- [ ] **Step 1: Create TargetBuildPanel**

Create `src/components/training/TargetBuildPanel.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import BoundedNumberInput from '@/components/training/BoundedNumberInput';
import HorizonPicker from '@/components/training/HorizonPicker';
import { SKILLS } from '@/lib/constants';
import { getTrainingType } from '@/lib/training/catalog';
import { displayed, type PlayerState } from '@/lib/training/engine';
import { absWeek, fromAbsWeek, horizonWeeks, type SeasonPoint } from '@/lib/training/horizon';
import {
  optimizePlan, type OptimizeResult, type PlanCandidate, type SkillTarget, type TargetPriority,
} from '@/lib/training/optimize';
import { SKILL_DB_NAMES, SKILL_KEYS, type SkillKey } from '@/lib/training/types';

const SKILL_NAME: Record<string, string> = Object.fromEntries(SKILLS.map((s) => [s.dbKey, s.name]));
const PRIORITIES: Array<{ value: TargetPriority; label: string }> = [
  { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'low', label: 'Low' },
];

function blocksSummary(c: PlanCandidate): string {
  return c.blocks.map((b) => `${getTrainingType(b.trainingId).label} ×${b.weeks}`).join(' → ');
}

export default function TargetBuildPanel({
  playerState, skillsDb, currentAge, startWeekOfSeason, defaultHorizon, staff, onUsePlan,
}: {
  playerState: PlayerState;
  skillsDb: Record<string, number | null>;
  currentAge: number;
  startWeekOfSeason: number;
  defaultHorizon: SeasonPoint | null;
  staff: { coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number };
  onUsePlan: (blocks: Array<{ trainingId: number; weeks: number }>, horizon: SeasonPoint) => void;
}) {
  const current = useMemo(
    () => Object.fromEntries(
      SKILL_KEYS.map((k) => [k, skillsDb[SKILL_DB_NAMES[k]] ?? 1]),
    ) as Record<SkillKey, number>,
    [skillsDb],
  );
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<Record<SkillKey, number>>(() => ({ ...current }));
  const [priority, setPriority] = useState<Record<SkillKey, TargetPriority>>(
    () => Object.fromEntries(SKILL_KEYS.map((k) => [k, 'normal'])) as Record<SkillKey, TargetPriority>,
  );
  const [horizon, setHorizon] = useState<SeasonPoint>(defaultHorizon ?? { age: 22, week: 1 });
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [busy, setBusy] = useState(false);

  const now: SeasonPoint = { age: currentAge, week: startWeekOfSeason };
  const H = horizonWeeks(now, horizon);
  const targeted = SKILL_KEYS.filter((k) => targets[k] > current[k]);

  function runOptimize() {
    setBusy(true);
    setResult(null);
    // setTimeout lets the busy state paint before the synchronous search runs.
    setTimeout(() => {
      const specs: SkillTarget[] = targeted.map((k) => ({
        skill: k, displayed: targets[k], priority: priority[k],
      }));
      setResult(optimizePlan(playerState, specs, {
        horizonWeeks: H,
        startWeekOfSeason,
        coachLevel: staff.coachLevel,
        youthTrainerLevel: staff.youthTrainerLevel,
        gymLevel: staff.gymLevel,
        trainingCourtLevel: staff.trainingCourtLevel,
      }));
      setBusy(false);
    }, 20);
  }

  function verdict(c: PlanCandidate): string {
    if (c.reachable) {
      const weeks = targeted.map((k) => c.hitWeek[k]).filter((w): w is number => w != null);
      const at = fromAbsWeek(absWeek(now) + Math.max(...weeks));
      return `Build reachable by age ${at.age} wk ${at.week}`;
    }
    const misses = targeted
      .filter((k) => (c.shortfall[k] ?? 0) > 0)
      .map((k) => `${SKILL_NAME[SKILL_DB_NAMES[k]] ?? k} −${(c.shortfall[k] ?? 0).toFixed(1)}`);
    return `Not fully reachable — best effort leaves ${misses.join(', ')} (≈ levels short)`;
  }

  const candidates: PlanCandidate[] = result?.best ? [result.best, ...result.alternatives] : [];

  return (
    <div className="rounded border border-neutral-800 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-medium text-neutral-300"
      >
        <span>Target build (reverse planner)</span>
        <span className="text-neutral-500">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          <p className="text-xs text-neutral-500">
            Raise the skills you care about; untouched skills are ignored. The search assumes
            full minutes and your current staff/facility settings.
          </p>

          <div className="grid gap-1.5 sm:grid-cols-2">
            {SKILL_KEYS.map((k) => {
              const isTargeted = targets[k] > current[k];
              return (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 text-neutral-400">{SKILL_NAME[SKILL_DB_NAMES[k]] ?? k}</span>
                  <span className="w-6 text-right text-neutral-500">{current[k]}</span>
                  <span className="text-neutral-600">→</span>
                  <BoundedNumberInput
                    value={targets[k]} min={1} max={20}
                    onCommit={(n) => { setTargets((t) => ({ ...t, [k]: n })); setResult(null); }}
                    className={`w-14 rounded border px-2 py-1 text-sm ${isTargeted ? 'border-amber-700 bg-neutral-900' : 'border-neutral-700 bg-neutral-900'}`}
                  />
                  {isTargeted && (
                    <select
                      value={priority[k]}
                      onChange={(e) => { setPriority((p) => ({ ...p, [k]: e.target.value as TargetPriority })); setResult(null); }}
                      className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-xs"
                    >
                      {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-neutral-400">Deadline</span>
            <HorizonPicker
              value={horizon}
              onChange={(h) => { if (h) { setHorizon(h); setResult(null); } }}
              currentAge={currentAge}
              required
            />
            <span className="text-xs text-neutral-500">{H} wk{H === 1 ? '' : 's'}</span>
            <button
              onClick={runOptimize}
              disabled={busy || targeted.length === 0 || H === 0}
              className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'Optimizing…' : 'Optimize'}
            </button>
            {targeted.length === 0 && <span className="text-xs text-neutral-500">set at least one target above its current level</span>}
            {H === 0 && <span className="text-xs text-amber-500">deadline is in the past</span>}
          </div>

          {result && !result.best && (
            <p className="text-sm text-neutral-500">Nothing to optimize — every target is already reached.</p>
          )}

          {result?.best && (
            <div className="space-y-3">
              <p className={`text-sm font-medium ${result.best.reachable ? 'text-green-500' : 'text-amber-500'}`}>
                {verdict(result.best)}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-800 text-left text-neutral-400">
                    <tr>
                      <th className="py-1.5 pr-3">Skill</th>
                      <th className="pr-3 text-right">Now</th>
                      <th className="pr-3 text-right">Target</th>
                      <th className="pr-3">Priority</th>
                      <th className="pr-3 text-right">Projected</th>
                      <th className="pr-3">Hit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targeted.map((k) => {
                      const best = result.best!;
                      const hit = best.hitWeek[k];
                      const at = hit != null ? fromAbsWeek(absWeek(now) + hit) : null;
                      return (
                        <tr key={k} className="border-b border-neutral-900">
                          <td className="py-1 pr-3">{SKILL_NAME[SKILL_DB_NAMES[k]] ?? k}</td>
                          <td className="pr-3 text-right">{current[k]}</td>
                          <td className="pr-3 text-right">{targets[k]}</td>
                          <td className="pr-3 text-xs text-neutral-400">{priority[k]}</td>
                          <td className="pr-3 text-right">{displayed(best.finalSkills[k])}</td>
                          <td className="pr-3">
                            {at
                              ? <span className="text-green-500">✓ age {at.age} wk {at.week}</span>
                              : <span className="text-red-400">−{(best.shortfall[k] ?? 0).toFixed(1)}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                {candidates.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded border border-neutral-800 p-2 text-xs">
                    <span className="font-medium text-neutral-300">{i === 0 ? 'Best' : `Alt ${i}`}</span>
                    <span className="flex-1 text-neutral-400">{blocksSummary(c)}</span>
                    {!c.reachable && <span className="text-amber-500">short {c.totalShortfall.toFixed(1)}</span>}
                    <button
                      onClick={() => onUsePlan(c.blocks.map((b) => ({ ...b })), horizon)}
                      className="rounded border border-amber-700 px-2 py-1 text-amber-500 hover:bg-amber-950"
                    >
                      Use this plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Integrate into ProjectionPanel**

In `src/components/training/ProjectionPanel.tsx`:

Add import:

```tsx
import TargetBuildPanel from '@/components/training/TargetBuildPanel';
```

Add the panel to the JSX between the CapBar grid `</div>` and the `Training plan` section
`<div>` (only when the player's age is known — the reverse planner needs the time grid):

```tsx
      {now && (
        <TargetBuildPanel
          playerState={playerState}
          skillsDb={skillsDb}
          currentAge={now.age}
          startWeekOfSeason={startWeekOfSeason}
          defaultHorizon={plan.horizon}
          staff={{
            coachLevel: plan.coachLevel, youthTrainerLevel: plan.youthTrainerLevel,
            gymLevel: plan.gymLevel, trainingCourtLevel: plan.trainingCourtLevel,
          }}
          onUsePlan={(blocks, horizon) =>
            handleChange(normalizePlan({ ...plan, blocks, horizon }, now))}
        />
      )}
```

(`now` and `normalizePlan` exist from Task 4's changes.)

- [ ] **Step 3: Verify**

Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/training/TargetBuildPanel.tsx src/components/training/ProjectionPanel.tsx
git commit -m "feat(v2): target-build panel — reverse planner UI with verdict, hit weeks, plan handoff

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: End-to-end verification + docs

**Files:**
- Modify: `CLAUDE.md` (repo root — add shipped blurb near the training phases)

- [ ] **Step 1: Full verification**

Run: `npm test` → all pass.
Run: `npm run build` → clean.
Launch dev server, open `/training`, verify: horizon picker appears, presets fill the pair,
last block shows "auto", status line correct, Optimize returns a plan and "Use this plan"
loads it into the editor. Open a player page `/players/<id>` with a saved plan and verify
the saved horizon re-derives.

- [ ] **Step 2: Docs**

Add to repo-root `CLAUDE.md` after the Phase C blurb:

```markdown
**Training horizons + reverse planner shipped 2026-07-15** — (A) Plans can target an
(age, season-week) horizon: `src/lib/training/horizon.ts` (absWeek grid; current week
counts as UPCOMING — first plan week trains at the current week, matching
project(startWeekOfSeason)); PlanEditor picker + auto-derived last block
(`fitBlocksToHorizon`/`normalizePlan` keep it materialized); `training_plans.horizon_age/
horizon_week` (migration 0009) make saved plans self-updating (re-derived from today's
week on load); band chart shows age-up markers. (B) Reverse planner
`src/lib/training/optimize.ts`: beam search (width 128, switch penalty 0.02) over weekly
skill-training choices stepped with the real weekStep/BBSCOUT; lexicographic objective =
weighted shortfall (priorities 3/1/0.4) → weighted hit-earliness → TSP → fewer switches;
τ(d) = d−1+1e-6. TargetBuildPanel (in ProjectionPanel, both surfaces): target grid,
deadline picker, verdict + per-skill hit week, best + 2 structurally-distinct alternates,
"Use this plan" loads blocks into the editor. Known: board.ts weeksToEndOfAge21 still uses
the old one-week convention (align in a follow-up); optimizer TSP tier is weak under beam
pruning (documented in optimize.ts).
```

- [ ] **Step 3: Commit**

```bash
git add ../CLAUDE.md
git commit -m "docs: training horizons + reverse planner shipped record

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Feature A semantics/presets → Task 1; derived last block/editor → Task 3;
  persistence/self-updating → Tasks 2+4; ambient context → Task 3; chart markers → Task 4;
  manual-mode week fix → Task 4. Feature B objective/search → Task 5; UI/verdict/hit-week/
  use-plan → Task 6; both surfaces via ProjectionPanel → Task 6. Out-of-scope list respected.
- **Type consistency:** `SeasonPoint` defined once in horizon.ts; `PlanValue.horizon` (T3)
  consumed by T4/T6; `PlanRow.horizon` (T2) consumed by T4; `PlanCandidate` (T5) consumed by
  T6; `savePlan` horizon param (T2) consumed by T4's DevelopmentSection/TrainingLab edits.
- **Deliberate judgment calls:** last block min 0 only via derivation (manual inputs stay
  min 1); optimizer excludes stamina/FT actions; TSP tier weak under pruning (documented);
  TargetBuildPanel keys its state off first render (same pre-existing behavior as
  ProjectionPanel's plan state — no new regression).
