# Progress Since Last Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BB-style `+N` skill pops and a sortable Δ(TSP) column on the Slovenia page, measured against a global "Mark as reviewed" timestamp.

**Architecture:** New single-row-per-scope `review_marks` table; `listPlayers` gains a `baseline_full` CTE (latest full snapshot at-or-before the mark) and computes per-skill deltas in JS via a pure `computeSkillDeltas` helper; `PlayerTable`/`SkillCell` render pops and the Δ column for the `slovenia` variant; a `ReviewBar` client component calls a `markReviewed()` server action.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + drizzle-kit migrations, Neon Postgres, vitest. Commands run from `v2/`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-13-review-progress-design.md`.
- No mark row → all deltas null (feature dormant). No pre-mark full snapshot → null deltas.
- Negative deltas are kept and rendered red.
- World variant renders no new UI; its rows carry null deltas.

---

### Task 1: `review_marks` table + `computeSkillDeltas` helper (TDD)

**Files:**
- Modify: `v2/src/db/schema.ts` (append table)
- Modify: `v2/src/lib/domain.ts`
- Test: `v2/src/lib/domain.test.ts` (append)
- Generated: `v2/drizzle/0004_*.sql` via drizzle-kit

**Interfaces:**
- Produces: `reviewMarks` pgTable export (`id` serial pk, `scope` text unique not null, `markedAt` timestamptz not null); `export function computeSkillDeltas(latest: Partial<Record<SkillDbKey, number | null>> | null, baseline: Partial<Record<SkillDbKey, number | null>> | null): Record<string, number> | null` — returns only non-zero deltas, `null` if either side is null or no skill is comparable; `{}` never returned (empty → null).

- [ ] **Step 1: Failing tests** — append to `v2/src/lib/domain.test.ts`:

```ts
describe('computeSkillDeltas', () => {
  it('returns non-zero deltas only', () => {
    expect(
      computeSkillDeltas(
        { jump_shot: 13, passing: 8, handling: 10 },
        { jump_shot: 11, passing: 8, handling: 12 },
      ),
    ).toEqual({ jump_shot: 2, handling: -2 });
  });

  it('returns null when baseline or latest is null', () => {
    expect(computeSkillDeltas(null, { jump_shot: 10 })).toBeNull();
    expect(computeSkillDeltas({ jump_shot: 10 }, null)).toBeNull();
  });

  it('skips skills missing on either side', () => {
    expect(computeSkillDeltas({ jump_shot: 12, passing: null }, { jump_shot: 10 })).toEqual({ jump_shot: 2 });
  });

  it('returns null when nothing changed', () => {
    expect(computeSkillDeltas({ jump_shot: 10 }, { jump_shot: 10 })).toBeNull();
  });
});
```

Add `computeSkillDeltas` to the existing import from `./domain`.

- [ ] **Step 2: Run** `npm test -- src/lib/domain.test.ts` → FAIL (not exported).

- [ ] **Step 3: Implement** — append to `v2/src/lib/domain.ts` (file already imports `SKILLS`/`SkillDbKey` types; extend imports if needed):

```ts
export function computeSkillDeltas(
  latest: Partial<Record<SkillDbKey, number | null>> | null,
  baseline: Partial<Record<SkillDbKey, number | null>> | null,
): Record<string, number> | null {
  if (!latest || !baseline) return null;
  const out: Record<string, number> = {};
  for (const s of SKILLS) {
    const a = latest[s.dbKey];
    const b = baseline[s.dbKey];
    if (a == null || b == null) continue;
    if (a !== b) out[s.dbKey] = a - b;
  }
  return Object.keys(out).length > 0 ? out : null;
}
```

Append to `v2/src/db/schema.ts`:

```ts
export const reviewMarks = pgTable('review_marks', {
  id: serial('id').primaryKey(),
  scope: text('scope').notNull(),
  markedAt: timestamp('marked_at', { withTimezone: true }).notNull(),
}, (t) => [
  uniqueIndex('uq_review_marks_scope').on(t.scope),
]);
```

- [ ] **Step 4: Run** `npm test -- src/lib/domain.test.ts` → PASS. Then generate + apply migration:

Run: `npx drizzle-kit generate` → creates `drizzle/0004_*.sql` with `CREATE TABLE review_marks`.
Run: `npx drizzle-kit migrate` → applies to Neon.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/lib/domain.ts src/lib/domain.test.ts drizzle
git commit -m "feat(v2): review_marks table + computeSkillDeltas helper"
```

---

### Task 2: baseline CTE + delta fields on `PlayerListRow` + `tspDelta` sort key

**Files:**
- Modify: `v2/src/queries/players.ts`
- Modify: `v2/src/lib/table.ts` (SortKey + getValue)
- Test: `v2/src/lib/table.test.ts` (makePlayer helper + sort test)

**Interfaces:**
- Consumes: `computeSkillDeltas` (Task 1), `reviewMarks` schema export.
- Produces: `PlayerListRow.skillDeltas: Record<string, number> | null` and `PlayerListRow.tspDelta: number | null`; `SortKey` union gains `'tspDelta'`.

- [ ] **Step 1: Failing test** — in `v2/src/lib/table.test.ts`, add to `makePlayer` defaults `skillDeltas: null, tspDelta: null,` and append:

```ts
describe('tspDelta sort', () => {
  it('sorts by tspDelta desc with nulls at bottom', () => {
    const rows = [
      makePlayer({ bbPlayerId: 1, tspDelta: 2 }),
      makePlayer({ bbPlayerId: 2, tspDelta: null }),
      makePlayer({ bbPlayerId: 3, tspDelta: 7 }),
    ];
    const sorted = sortRows(rows, { key: 'tspDelta', direction: 'desc' });
    expect(sorted.map((r) => r.bbPlayerId)).toEqual([3, 1, 2]);
  });
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/table.test.ts` → FAIL (type error / unknown key).

- [ ] **Step 3: Implement**

`v2/src/lib/table.ts`: add `| 'tspDelta'` to `SortKey`; in `getValue` add `case 'tspDelta': return p.tspDelta;`.

`v2/src/queries/players.ts`:

Add imports: `import { reviewMarks } from '@/db';` (extend existing `@/db` import), `import { eq } from 'drizzle-orm';`, and `computeSkillDeltas` from `@/lib/domain`.

Add to `PlayerListRow` interface:

```ts
  // progress since last review (slovenia scope; null when no mark/baseline)
  skillDeltas: Record<string, number> | null;
  tspDelta: number | null;
```

In `listPlayers`, before the main query fetch the mark (epoch default keeps a single SQL shape; epoch matches no snapshots → null baselines):

```ts
  const mark = scope === 'slovenia'
    ? (await db.select().from(reviewMarks).where(eq(reviewMarks.scope, 'slovenia')).limit(1))[0] ?? null
    : null;
  const markedAt = mark?.markedAt ?? new Date(0);
```

Add CTE after `fresh` (inside the same `with`):

```sql
    baseline_full as (
      select distinct on (player_id) *
      from snapshots where jump_shot is not null and captured_at <= ${markedAt}
      order by player_id, captured_at desc
    )
```

Add to the select list:

```sql
      b.tsp as baseline_tsp,
      b.jump_shot as b_jump_shot, b.jump_range as b_jump_range, b.outside_def as b_outside_def,
      b.handling as b_handling, b.driving as b_driving, b.passing as b_passing,
      b.inside_shot as b_inside_shot, b.inside_def as b_inside_def, b.rebounding as b_rebounding,
      b.shot_blocking as b_shot_blocking, b.stamina as b_stamina, b.free_throw as b_free_throw,
```

and the join: `left join baseline_full b on b.player_id = p.bb_player_id`.

In the row mapper, build the baseline record and deltas:

```ts
    const baselineSkills = r.b_jump_shot == null ? null : {
      jump_shot: r.b_jump_shot as number | null, jump_range: r.b_jump_range as number | null,
      outside_def: r.b_outside_def as number | null, handling: r.b_handling as number | null,
      driving: r.b_driving as number | null, passing: r.b_passing as number | null,
      inside_shot: r.b_inside_shot as number | null, inside_def: r.b_inside_def as number | null,
      rebounding: r.b_rebounding as number | null, shot_blocking: r.b_shot_blocking as number | null,
      stamina: r.b_stamina as number | null, free_throw: r.b_free_throw as number | null,
    };
```

and in the returned object (where `skills` is the latest-full record already built):

```ts
      skillDeltas: computeSkillDeltas(skills, baselineSkills),
      tspDelta: r.tsp != null && r.baseline_tsp != null ? (r.tsp as number) - (r.baseline_tsp as number) : null,
```

(Refactor note: the mapper currently builds `skills` inline in the object literal — lift it to a `const skills = ...` before the `return` so it can be reused.)

- [ ] **Step 4: Run** `npm test` → all pass. `npm run build` → compiles.

- [ ] **Step 5: Commit**

```bash
git add src/queries/players.ts src/lib/table.ts src/lib/table.test.ts
git commit -m "feat(v2): baseline snapshot deltas on player list rows"
```

---

### Task 3: UI — skill pops, Δ column, ReviewBar + server action

**Files:**
- Modify: `v2/src/components/SkillCell.tsx`
- Modify: `v2/src/components/PlayerTable.tsx`
- Create: `v2/src/app/slovenia/actions.ts`
- Create: `v2/src/components/ReviewBar.tsx`
- Modify: `v2/src/app/slovenia/page.tsx`

**Interfaces:**
- Consumes: `PlayerListRow.skillDeltas` / `.tspDelta` (Task 2), `reviewMarks` schema.
- Produces: `markReviewed(): Promise<void>` server action; `ReviewBar({ markedAtIso }: { markedAtIso: string | null })`.

- [ ] **Step 1: SkillCell delta superscript** — replace `v2/src/components/SkillCell.tsx` content:

```tsx
import { getSkillColor } from '@/lib/constants';

export default function SkillCell({ value, delta }: { value: number | null; delta?: number | null }) {
  if (value == null) return <span className="text-neutral-600">–</span>;
  return (
    <span className="whitespace-nowrap">
      <span style={{ color: getSkillColor(value) }} className="font-mono font-semibold">{value}</span>
      {delta != null && delta !== 0 && (
        <sup className={delta > 0 ? 'text-green-400' : 'text-red-400'}>
          {delta > 0 ? `+${delta}` : delta}
        </sup>
      )}
    </span>
  );
}
```

- [ ] **Step 2: PlayerTable — pass deltas + Δ column (slovenia only)**

In the skill-cell render, pass the delta:

```tsx
                {showSkills &&
                  SKILLS.map((s) => (
                    <td key={s.dbKey} className="pr-2">
                      <SkillCell value={p.skills?.[s.dbKey] ?? null} delta={p.skillDeltas?.[s.dbKey] ?? null} />
                    </td>
                  ))}
```

Add a Δ header right after the TSP `SortTh` (only for slovenia):

```tsx
              {variant === 'slovenia' && (
                <SortTh label="Δ" sortKey="tspDelta" sort={sort} onClick={handleSortClick} className="pr-3 text-right" title="TSP change since last review" />
              )}
```

and the matching cell after the TSP cell:

```tsx
                {variant === 'slovenia' && (
                  <td className="pr-3 text-right">
                    {p.tspDelta == null ? <span className="text-neutral-600">–</span>
                      : p.tspDelta > 0 ? <span className="text-green-400">+{p.tspDelta}</span>
                      : p.tspDelta < 0 ? <span className="text-red-400">{p.tspDelta}</span>
                      : <span className="text-neutral-500">0</span>}
                  </td>
                )}
```

Update the empty-state `colSpan` expression: `11 + (showCountry ? 2 : 0) + (variant === 'slovenia' ? 1 : 0) + (showSkills ? SKILLS.length : 0) + (archetypeMatches ? 1 : 0)`.

- [ ] **Step 3: Server action** — create `v2/src/app/slovenia/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db, reviewMarks } from '@/db';

export async function markReviewed() {
  await db
    .insert(reviewMarks)
    .values({ scope: 'slovenia', markedAt: new Date() })
    .onConflictDoUpdate({ target: reviewMarks.scope, set: { markedAt: new Date() } });
  revalidatePath('/slovenia');
}
```

(Check `v2/src/db/index.ts` re-exports schema tables; `reviewMarks` should come through like `censusRuns` does.)

- [ ] **Step 4: ReviewBar** — create `v2/src/components/ReviewBar.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { markReviewed } from '@/app/slovenia/actions';
import { formatStartedAt } from '@/lib/format-sync';

export default function ReviewBar({ markedAtIso }: { markedAtIso: string | null }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3 mb-3 text-sm">
      <span className="text-neutral-500">
        {markedAtIso
          ? <>Last reviewed: {formatStartedAt(new Date(markedAtIso))} UTC · skill pops accumulate since then</>
          : 'Never reviewed — press to start tracking skill pops'}
      </span>
      <button
        onClick={() => start(() => markReviewed())}
        disabled={pending}
        className="rounded border border-neutral-700 px-2.5 py-1 text-sm text-neutral-300 hover:text-amber-400 disabled:opacity-50"
      >
        Mark as reviewed
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Slovenia page** — in `v2/src/app/slovenia/page.tsx` fetch the mark and render the bar above `PlayerTable`:

```ts
import { db, reviewMarks } from '@/db';
import { eq } from 'drizzle-orm';
import ReviewBar from '@/components/ReviewBar';
```

```ts
  const [rows, archetypes, markRows] = await Promise.all([
    listPlayers('slovenia'),
    getEffectiveArchetypes(),
    db.select().from(reviewMarks).where(eq(reviewMarks.scope, 'slovenia')).limit(1),
  ]);
  const markedAtIso = markRows[0]?.markedAt.toISOString() ?? null;
```

```tsx
      <ReviewBar markedAtIso={markedAtIso} />
      <PlayerTable rows={rows} variant="slovenia" defaultShowSkills archetypeMatches={archetypeMatches} archetypeNames={archetypeNames} />
```

- [ ] **Step 6: Verify + commit**

Run: `npm test` and `npm run build` → pass. Runtime (verify skill): `/slovenia` shows ReviewBar; press Mark as reviewed → "Last reviewed" appears and all pops are zero (baseline = latest); Δ column sortable; `/world` unchanged.

```bash
git add src/components/SkillCell.tsx src/components/PlayerTable.tsx src/components/ReviewBar.tsx src/app/slovenia
git commit -m "feat(v2): skill pops + delta column + mark-as-reviewed bar"
```
