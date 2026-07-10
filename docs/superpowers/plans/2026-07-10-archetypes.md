# Player Archetypes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** User-defined, age-progressive archetypes that automatically badge matching players on the Slovenia table and player profile, with an editor tab and an archetype filter.

**Architecture:** A pure evaluator (`player × archetype × age → match + per-condition checks`) drives everything, unit-tested in isolation. A code default library plus a DB `archetypes` table merge into an "effective" list (user edits/customs/hides win; untouched defaults auto-update). The editor is a grid (condition rows × age columns). Slovenia page computes matches client-side from the effective list passed by the server.

**Tech Stack:** Existing v2 stack (Next.js 16 App Router, Drizzle + Neon, Tailwind 4, Vitest). No new deps.

**Spec:** `docs/superpowers/specs/2026-07-10-archetypes-design.md`

---

## Decisions locked (from spec)

- An archetype = name + condition rows the user chooses; each skill/attr row has a threshold per age (18–21), any cell blank = no requirement; position rows have no age columns.
- Match = for the player's current age, every non-blank cell for that age (plus position rows) passes. Unknown age → no match. No applicable cell at that age → no match.
- Fields: 12 skills + `potential` + `height_cm` + `tsp` (op `>=`/`<=`), plus a `position` row (`is`/`isNot` a set).
- Storage: code defaults (library) + DB `archetypes` table (user deltas). Merge by stable `key`; edits create an override keyed to the default; `reset` deletes it; customs have `key=null`; `hidden` drops a default.
- Scope: Slovenia table + player profile. World is out of scope here.

## File Structure

```
v2/src/lib/archetypes/
├── types.ts            # Archetype, conditions, EffectiveArchetype, field lists
├── evaluate.ts         # pure evaluateArchetype + matchingArchetypes
├── evaluate.test.ts
├── defaults.ts         # code default library (~8 starters)
├── merge.ts            # mergeArchetypes(defaults, dbRows) → EffectiveArchetype[]
└── merge.test.ts
v2/src/db/schema.ts                       # MODIFY: add archetypes table
v2/src/queries/archetypes.ts              # getEffectiveArchetypes() (server: reads DB + defaults)
v2/src/app/archetypes/page.tsx            # editor tab (server shell)
v2/src/app/archetypes/actions.ts          # save/reset/hide/delete server actions
v2/src/components/archetypes/ArchetypeEditor.tsx   # client grid editor
v2/src/components/archetypes/ArchetypeList.tsx     # client list w/ source badges
v2/src/components/ArchetypeBadge.tsx      # chip
v2/src/components/Navbar.tsx              # MODIFY: add Archetypes link
v2/src/lib/table.ts                      # MODIFY: FilterState.archetype + filter predicate
v2/src/components/FilterBar.tsx          # MODIFY: archetype dropdown
v2/src/components/PlayerTable.tsx        # MODIFY: archetype badge column + filter wiring
v2/src/queries/players.ts                # (PlayerListRow already has fields the evaluator needs)
v2/src/app/slovenia/page.tsx             # MODIFY: pass effective archetypes to table
v2/src/app/players/[id]/page.tsx         # MODIFY: Archetypes section
v2/src/components/player/ArchetypeMatches.tsx      # profile section (per-condition pass/fail)
```

All commands from `D:\ClaudeProjects\BB-project\v2`; commit + push (repo root) after each task; messages end `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Never print `.env.local` values.

---

### Task 1: Types + pure evaluator (TDD)

**Files:** Create `v2/src/lib/archetypes/types.ts`, `v2/src/lib/archetypes/evaluate.ts`, `v2/src/lib/archetypes/evaluate.test.ts`

- [ ] **Step 1: Types** — `v2/src/lib/archetypes/types.ts`:

```ts
export const ARCHETYPE_SKILL_FIELDS = [
  'jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing',
  'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw',
] as const;

export const ARCHETYPE_ATTR_FIELDS = ['potential', 'height_cm', 'tsp'] as const;

export type ArchetypeField = (typeof ARCHETYPE_SKILL_FIELDS)[number] | (typeof ARCHETYPE_ATTR_FIELDS)[number];

export const AGE_TIERS = [18, 19, 20, 21] as const;
export type AgeTier = (typeof AGE_TIERS)[number];

export interface SkillCondition {
  kind: 'field';
  field: ArchetypeField;
  op: '>=' | '<=';
  byAge: Partial<Record<AgeTier, number>>; // omitted age = blank (no requirement)
}

export interface PositionCondition {
  kind: 'position';
  op: 'is' | 'isNot';
  positions: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[];
}

export type ArchetypeCondition = SkillCondition | PositionCondition;

export interface ArchetypeRules {
  conditions: ArchetypeCondition[];
}

/** A code default (library entry). */
export interface DefaultArchetype {
  key: string;          // stable id, e.g. 'defensive-center'
  name: string;
  description?: string;
  rules: ArchetypeRules;
}

/** The merged, effective archetype the app evaluates + displays. */
export interface EffectiveArchetype {
  id: string;                         // key (default) or `custom-${dbId}`
  key: string | null;                 // default key, or null for custom
  dbId: number | null;                // DB row id if user has an override/custom, else null
  name: string;
  description?: string;
  rules: ArchetypeRules;
  source: 'default' | 'default-modified' | 'custom';
}

/** Minimal player shape the evaluator needs (PlayerListRow satisfies this). */
export interface EvalPlayer {
  ageNow: number | null;
  skills: Record<string, number | null> | null;
  potential: number | null;
  heightCm: number | null;
  tsp: number | null;
  bestPosition: string | null;
}
```

- [ ] **Step 2: Failing tests** — `v2/src/lib/archetypes/evaluate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluateArchetype, matchingArchetypes } from './evaluate';
import type { EffectiveArchetype, EvalPlayer } from './types';

const defCenter: EffectiveArchetype = {
  id: 'defensive-center', key: 'defensive-center', dbId: null, source: 'default', name: 'Defensive Center',
  rules: { conditions: [
    { kind: 'field', field: 'inside_def', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
    { kind: 'field', field: 'shot_blocking', op: '>=', byAge: { 18: 6, 19: 10, 20: 13, 21: 14 } },
    { kind: 'field', field: 'inside_shot', op: '<=', byAge: { 18: 3, 19: 4, 20: 5, 21: 6 } },
  ] },
};

function player(age: number | null, skills: Partial<Record<string, number>>): EvalPlayer {
  return { ageNow: age, skills: skills as Record<string, number>, potential: 8, heightCm: 210, tsp: 90, bestPosition: 'C' };
}

describe('evaluateArchetype', () => {
  it('matches an 18yo meeting the age-18 tier', () => {
    const r = evaluateArchetype(player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 2 }), defCenter);
    expect(r.matches).toBe(true);
    expect(r.ageTierUsed).toBe(18);
  });
  it('fails when a min condition is below the tier', () => {
    expect(evaluateArchetype(player(18, { inside_def: 5, shot_blocking: 7, inside_shot: 2 }), defCenter).matches).toBe(false);
  });
  it('fails when a max (<=) condition is exceeded', () => {
    expect(evaluateArchetype(player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 4 }), defCenter).matches).toBe(false);
  });
  it('uses the correct age column (21 needs the full line)', () => {
    expect(evaluateArchetype(player(21, { inside_def: 12, shot_blocking: 14, inside_shot: 6 }), defCenter).matches).toBe(false); // ID 12 < 15
    expect(evaluateArchetype(player(21, { inside_def: 15, shot_blocking: 14, inside_shot: 6 }), defCenter).matches).toBe(true);
  });
  it('does not match when age is unknown', () => {
    expect(evaluateArchetype(player(null, { inside_def: 15, shot_blocking: 14, inside_shot: 2 }), defCenter).matches).toBe(false);
  });
  it('null skill fails a min condition', () => {
    expect(evaluateArchetype(player(18, { shot_blocking: 7, inside_shot: 2 }), defCenter).matches).toBe(false); // inside_def missing
  });
  it('returns per-condition checks with actual vs threshold', () => {
    const r = evaluateArchetype(player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 2 }), defCenter);
    expect(r.checks).toHaveLength(3);
    expect(r.checks.find((c) => c.field === 'inside_def')).toMatchObject({ threshold: 6, actual: 6, pass: true });
  });
});

describe('age tier with blank cells', () => {
  const only2021: EffectiveArchetype = {
    id: 'x', key: 'x', dbId: null, source: 'default', name: 'X',
    rules: { conditions: [{ kind: 'field', field: 'rebounding', op: '>=', byAge: { 20: 11, 21: 13 } }] },
  };
  it('no requirement at 18 → no applicable cell → no match', () => {
    expect(evaluateArchetype(player(18, { rebounding: 20 }), only2021).matches).toBe(false);
  });
  it('applies at 20', () => {
    expect(evaluateArchetype(player(20, { rebounding: 11 }), only2021).matches).toBe(true);
  });
});

describe('position condition', () => {
  const guard: EffectiveArchetype = {
    id: 'pm', key: 'pm', dbId: null, source: 'default', name: 'PM',
    rules: { conditions: [
      { kind: 'position', op: 'is', positions: ['PG'] },
      { kind: 'field', field: 'passing', op: '>=', byAge: { 18: 6 } },
    ] },
  };
  it('requires the position and the skill', () => {
    expect(evaluateArchetype({ ageNow: 18, skills: { passing: 8 }, potential: 8, heightCm: 185, tsp: 60, bestPosition: 'PG' }, guard).matches).toBe(true);
    expect(evaluateArchetype({ ageNow: 18, skills: { passing: 8 }, potential: 8, heightCm: 185, tsp: 60, bestPosition: 'SG' }, guard).matches).toBe(false);
  });
});

describe('matchingArchetypes', () => {
  it('returns all archetypes a player matches', () => {
    const p = player(18, { inside_def: 6, shot_blocking: 7, inside_shot: 2 });
    expect(matchingArchetypes(p, [defCenter]).map((a) => a.id)).toEqual(['defensive-center']);
  });
});
```

- [ ] **Step 3:** `npm test` → FAIL (module missing). Implement `v2/src/lib/archetypes/evaluate.ts`:

```ts
import type { EffectiveArchetype, EvalPlayer, ArchetypeField, AgeTier } from './types';

export interface ConditionCheck {
  field: ArchetypeField | 'position';
  op: string;
  threshold: number | string;
  actual: number | string | null;
  pass: boolean;
}

export interface EvalResult {
  matches: boolean;
  checks: ConditionCheck[];
  ageTierUsed: number | null;
}

function fieldValue(p: EvalPlayer, field: ArchetypeField): number | null {
  if (field === 'potential') return p.potential;
  if (field === 'height_cm') return p.heightCm;
  if (field === 'tsp') return p.tsp;
  return p.skills?.[field] ?? null;
}

export function evaluateArchetype(p: EvalPlayer, a: EffectiveArchetype): EvalResult {
  const age = p.ageNow;
  const checks: ConditionCheck[] = [];
  if (age == null) return { matches: false, checks, ageTierUsed: null };

  let anyApplicable = false;
  let allPass = true;

  for (const cond of a.rules.conditions) {
    if (cond.kind === 'position') {
      const actual = p.bestPosition;
      const inSet = actual != null && (cond.positions as string[]).includes(actual);
      const pass = cond.op === 'is' ? inSet : !inSet;
      anyApplicable = true;
      checks.push({ field: 'position', op: cond.op, threshold: cond.positions.join('/'), actual, pass });
      if (!pass) allPass = false;
    } else {
      const threshold = cond.byAge[age as AgeTier];
      if (threshold == null) continue; // blank at this age
      anyApplicable = true;
      const actual = fieldValue(p, cond.field);
      const pass = actual != null && (cond.op === '>=' ? actual >= threshold : actual <= threshold);
      checks.push({ field: cond.field, op: cond.op, threshold, actual, pass });
      if (!pass) allPass = false;
    }
  }

  return { matches: anyApplicable && allPass, checks, ageTierUsed: anyApplicable ? age : null };
}

export function matchingArchetypes(p: EvalPlayer, archetypes: EffectiveArchetype[]): EffectiveArchetype[] {
  return archetypes.filter((a) => evaluateArchetype(p, a).matches);
}
```

Also add `field` to the test's SkillCondition check access — the test reads `c.field`; the ConditionCheck has `field`. Consistent.

- [ ] **Step 4:** `npm test` → all pass.

- [ ] **Step 5: Commit + push**

```bash
git add v2/src/lib/archetypes
git commit -m "feat(v2): archetype types + pure age-progressive evaluator"
git push
```

---

### Task 2: Default library + merge (TDD)

**Files:** Create `v2/src/lib/archetypes/defaults.ts`, `v2/src/lib/archetypes/merge.ts`, `v2/src/lib/archetypes/merge.test.ts`

- [ ] **Step 1: Default library** — `v2/src/lib/archetypes/defaults.ts` (8 starters; thresholds are sane starting points, user-tunable):

```ts
import type { DefaultArchetype } from './types';

export const DEFAULT_ARCHETYPES: DefaultArchetype[] = [
  { key: 'defensive-center', name: 'Defensive Center', description: 'Rim protector: inside D, blocks, boards; low scoring.',
    rules: { conditions: [
      { kind: 'field', field: 'inside_def', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
      { kind: 'field', field: 'shot_blocking', op: '>=', byAge: { 18: 6, 19: 10, 20: 13, 21: 14 } },
      { kind: 'field', field: 'rebounding', op: '>=', byAge: { 18: 6, 19: 8, 20: 11, 21: 13 } },
      { kind: 'field', field: 'inside_shot', op: '<=', byAge: { 18: 4, 19: 5, 20: 6, 21: 7 } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 18: 205, 19: 205, 20: 205, 21: 205 } },
      { kind: 'field', field: 'potential', op: '>=', byAge: { 18: 8, 19: 8, 20: 8, 21: 8 } },
    ] } },
  { key: 'scoring-center', name: 'Scoring Center', description: 'Post scorer: inside shot + boards.',
    rules: { conditions: [
      { kind: 'field', field: 'inside_shot', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
      { kind: 'field', field: 'rebounding', op: '>=', byAge: { 18: 6, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 18: 203, 19: 203, 20: 203, 21: 203 } },
      { kind: 'field', field: 'potential', op: '>=', byAge: { 18: 8, 19: 8, 20: 8, 21: 8 } },
    ] } },
  { key: 'two-way-big', name: 'Two-Way Big', description: 'Balanced big: scores and defends inside.',
    rules: { conditions: [
      { kind: 'field', field: 'inside_shot', op: '>=', byAge: { 18: 5, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'inside_def', op: '>=', byAge: { 18: 5, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'rebounding', op: '>=', byAge: { 18: 6, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 18: 203, 19: 203, 20: 203, 21: 203 } },
    ] } },
  { key: 'playmaker', name: 'Playmaker', description: 'Floor general: passing, handling, driving.',
    rules: { conditions: [
      { kind: 'position', op: 'is', positions: ['PG', 'SG'] },
      { kind: 'field', field: 'passing', op: '>=', byAge: { 18: 5, 19: 8, 20: 11, 21: 13 } },
      { kind: 'field', field: 'handling', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
      { kind: 'field', field: 'driving', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
    ] } },
  { key: 'scoring-guard', name: 'Scoring Guard', description: 'Shot creation: jump shot, range, driving.',
    rules: { conditions: [
      { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
      { kind: 'field', field: 'jump_range', op: '>=', byAge: { 18: 5, 19: 8, 20: 11, 21: 13 } },
      { kind: 'field', field: 'driving', op: '>=', byAge: { 18: 6, 19: 9, 20: 11, 21: 13 } },
    ] } },
  { key: '3-and-d-wing', name: '3&D Wing', description: 'Shoots and defends the perimeter.',
    rules: { conditions: [
      { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 18: 6, 19: 9, 20: 11, 21: 13 } },
      { kind: 'field', field: 'jump_range', op: '>=', byAge: { 18: 5, 19: 8, 20: 10, 21: 12 } },
      { kind: 'field', field: 'outside_def', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 14 } },
    ] } },
  { key: 'slasher', name: 'Slasher', description: 'Attacks the rim: driving + handling.',
    rules: { conditions: [
      { kind: 'field', field: 'driving', op: '>=', byAge: { 18: 7, 19: 10, 20: 13, 21: 15 } },
      { kind: 'field', field: 'handling', op: '>=', byAge: { 18: 6, 19: 9, 20: 11, 21: 13 } },
    ] } },
  { key: 'sharpshooter', name: 'Sharpshooter', description: 'Elite shooter: jump shot + range + FT.',
    rules: { conditions: [
      { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 18: 7, 19: 10, 20: 13, 21: 16 } },
      { kind: 'field', field: 'jump_range', op: '>=', byAge: { 18: 6, 19: 9, 20: 12, 21: 15 } },
      { kind: 'field', field: 'free_throw', op: '>=', byAge: { 18: 5, 19: 7, 20: 9, 21: 11 } },
    ] } },
];
```

- [ ] **Step 2: Failing merge tests** — `v2/src/lib/archetypes/merge.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mergeArchetypes, type ArchetypeRow } from './merge';
import type { DefaultArchetype } from './types';

const defaults: DefaultArchetype[] = [
  { key: 'a', name: 'A', rules: { conditions: [] } },
  { key: 'b', name: 'B', rules: { conditions: [] } },
];

describe('mergeArchetypes', () => {
  it('returns all defaults when no DB rows', () => {
    const eff = mergeArchetypes(defaults, []);
    expect(eff.map((e) => e.id)).toEqual(['a', 'b']);
    expect(eff[0].source).toBe('default');
  });
  it('applies an override to a default (source default-modified)', () => {
    const rows: ArchetypeRow[] = [{ id: 5, key: 'a', name: 'A2', description: null, rules: { conditions: [] }, hidden: false }];
    const eff = mergeArchetypes(defaults, rows);
    const a = eff.find((e) => e.key === 'a')!;
    expect(a.name).toBe('A2');
    expect(a.source).toBe('default-modified');
    expect(a.dbId).toBe(5);
  });
  it('hides a default', () => {
    const rows: ArchetypeRow[] = [{ id: 6, key: 'b', name: 'B', description: null, rules: { conditions: [] }, hidden: true }];
    expect(mergeArchetypes(defaults, rows).map((e) => e.key)).toEqual(['a']);
  });
  it('includes custom rows (key null) after defaults', () => {
    const rows: ArchetypeRow[] = [{ id: 9, key: null, name: 'Custom', description: null, rules: { conditions: [] }, hidden: false }];
    const eff = mergeArchetypes(defaults, rows);
    const c = eff.find((e) => e.source === 'custom')!;
    expect(c.id).toBe('custom-9');
    expect(c.name).toBe('Custom');
  });
  it('a newly shipped default the user never saw just appears', () => {
    const withNew = [...defaults, { key: 'c', name: 'C', rules: { conditions: [] } }];
    expect(mergeArchetypes(withNew, []).map((e) => e.key)).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 3:** FAIL, then implement `v2/src/lib/archetypes/merge.ts`:

```ts
import type { DefaultArchetype, EffectiveArchetype, ArchetypeRules } from './types';

export interface ArchetypeRow {
  id: number;
  key: string | null;
  name: string;
  description: string | null;
  rules: ArchetypeRules;
  hidden: boolean;
}

export function mergeArchetypes(defaults: DefaultArchetype[], rows: ArchetypeRow[]): EffectiveArchetype[] {
  const overrideByKey = new Map<string, ArchetypeRow>();
  const customs: ArchetypeRow[] = [];
  for (const r of rows) {
    if (r.key) overrideByKey.set(r.key, r);
    else customs.push(r);
  }

  const out: EffectiveArchetype[] = [];
  for (const d of defaults) {
    const ov = overrideByKey.get(d.key);
    if (ov?.hidden) continue; // hidden default
    if (ov) {
      out.push({ id: d.key, key: d.key, dbId: ov.id, name: ov.name, description: ov.description ?? undefined, rules: ov.rules, source: 'default-modified' });
    } else {
      out.push({ id: d.key, key: d.key, dbId: null, name: d.name, description: d.description, rules: d.rules, source: 'default' });
    }
  }
  for (const c of customs) {
    out.push({ id: `custom-${c.id}`, key: null, dbId: c.id, name: c.name, description: c.description ?? undefined, rules: c.rules, source: 'custom' });
  }
  return out;
}
```

- [ ] **Step 4:** `npm test` → pass.

- [ ] **Step 5: Commit + push**

```bash
git add v2/src/lib/archetypes/defaults.ts v2/src/lib/archetypes/merge.ts v2/src/lib/archetypes/merge.test.ts
git commit -m "feat(v2): archetype default library + merge/override model"
git push
```

---

### Task 3: DB table + server query

**Files:** Modify `v2/src/db/schema.ts`; create `v2/src/queries/archetypes.ts`

- [ ] **Step 1: Schema** — add to `v2/src/db/schema.ts`:

```ts
export const archetypes = pgTable('archetypes', {
  id: serial('id').primaryKey(),
  key: text('key'),                         // default key this overrides; null = custom
  name: text('name').notNull(),
  description: text('description'),
  rules: jsonb('rules').notNull(),          // ArchetypeRules
  hidden: boolean('hidden').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uq_archetypes_key').on(t.key)]);
```

(Ensure `serial, text, jsonb, boolean, timestamp, uniqueIndex` are already imported in schema.ts — they are, used by other tables. The unique index on nullable `key` allows multiple NULLs in Postgres, so multiple customs are fine.)

- [ ] **Step 2: Migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: a new `drizzle/00NN_*.sql` creating the `archetypes` table; applied to Neon. Commit the generated SQL.

- [ ] **Step 3: Query** — `v2/src/queries/archetypes.ts`:

```ts
import { db, archetypes } from '@/db';
import { DEFAULT_ARCHETYPES } from '@/lib/archetypes/defaults';
import { mergeArchetypes, type ArchetypeRow } from '@/lib/archetypes/merge';
import type { EffectiveArchetype } from '@/lib/archetypes/types';

export async function getEffectiveArchetypes(): Promise<EffectiveArchetype[]> {
  const rows = await db.select().from(archetypes);
  const asRows: ArchetypeRow[] = rows.map((r) => ({
    id: r.id, key: r.key, name: r.name, description: r.description,
    rules: r.rules as ArchetypeRow['rules'], hidden: r.hidden,
  }));
  return mergeArchetypes(DEFAULT_ARCHETYPES, asRows);
}
```

- [ ] **Step 4:** `npm run build` clean; `npm test` green. Verify the table exists (temp tsx one-liner or reuse the check pattern): query `information_schema.tables` for `archetypes`. 

- [ ] **Step 5: Commit + push**

```bash
git add v2/src/db/schema.ts v2/drizzle v2/src/queries/archetypes.ts
git commit -m "feat(v2): archetypes table + effective-archetypes server query"
git push
```

---

### Task 4: Editor tab (page, actions, grid editor, nav)

**Files:** Create `v2/src/app/archetypes/page.tsx`, `v2/src/app/archetypes/actions.ts`, `v2/src/components/archetypes/ArchetypeList.tsx`, `v2/src/components/archetypes/ArchetypeEditor.tsx`; modify `v2/src/components/Navbar.tsx`

- [ ] **Step 1: Server actions** — `v2/src/app/archetypes/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db, archetypes } from '@/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { ArchetypeRules } from '@/lib/archetypes/types';

// Save an override of a DEFAULT (keyed) — upsert by key.
export async function saveDefaultOverride(key: string, name: string, description: string, rules: ArchetypeRules) {
  const existing = await db.select().from(archetypes).where(eq(archetypes.key, key));
  if (existing[0]) {
    await db.update(archetypes).set({ name, description: description || null, rules, hidden: false, updatedAt: new Date() }).where(eq(archetypes.id, existing[0].id));
  } else {
    await db.insert(archetypes).values({ key, name, description: description || null, rules, hidden: false });
  }
  revalidatePath('/archetypes');
}

// Reset a default to code version (delete override).
export async function resetDefault(key: string) {
  await db.delete(archetypes).where(eq(archetypes.key, key));
  revalidatePath('/archetypes');
}

// Hide a default.
export async function hideDefault(key: string, name: string) {
  const existing = await db.select().from(archetypes).where(eq(archetypes.key, key));
  if (existing[0]) await db.update(archetypes).set({ hidden: true }).where(eq(archetypes.id, existing[0].id));
  else await db.insert(archetypes).values({ key, name, rules: { conditions: [] }, hidden: true });
  revalidatePath('/archetypes');
}

// Create or update a CUSTOM archetype (key null). dbId null = create.
export async function saveCustom(dbId: number | null, name: string, description: string, rules: ArchetypeRules) {
  if (dbId) {
    await db.update(archetypes).set({ name, description: description || null, rules, updatedAt: new Date() }).where(and(eq(archetypes.id, dbId), isNull(archetypes.key)));
  } else {
    await db.insert(archetypes).values({ key: null, name, description: description || null, rules });
  }
  revalidatePath('/archetypes');
}

export async function deleteCustom(dbId: number) {
  await db.delete(archetypes).where(and(eq(archetypes.id, dbId), isNull(archetypes.key)));
  revalidatePath('/archetypes');
}
```

- [ ] **Step 2: Grid editor** — `v2/src/components/archetypes/ArchetypeEditor.tsx` (client). It edits one archetype's rows × age grid and calls the right action on save. Full component:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { ARCHETYPE_SKILL_FIELDS, ARCHETYPE_ATTR_FIELDS, AGE_TIERS, type ArchetypeCondition, type EffectiveArchetype } from '@/lib/archetypes/types';
import { saveDefaultOverride, saveCustom } from '@/app/archetypes/actions';

const FIELD_LABELS: Record<string, string> = {
  jump_shot: 'Jump Shot', jump_range: 'Jump Range', outside_def: 'Outside Def', handling: 'Handling',
  driving: 'Driving', passing: 'Passing', inside_shot: 'Inside Shot', inside_def: 'Inside Def',
  rebounding: 'Rebounding', shot_blocking: 'Shot Blocking', stamina: 'Stamina', free_throw: 'Free Throw',
  potential: 'Potential', height_cm: 'Height (cm)', tsp: 'TSP',
};
const ALL_FIELDS = [...ARCHETYPE_SKILL_FIELDS, ...ARCHETYPE_ATTR_FIELDS];

type Row = { kind: 'field'; field: string; op: '>=' | '<='; byAge: Record<number, string> } | { kind: 'position'; op: 'is' | 'isNot'; positions: string[] };

function toRows(a: EffectiveArchetype): Row[] {
  return a.rules.conditions.map((c): Row => c.kind === 'position'
    ? { kind: 'position', op: c.op, positions: c.positions }
    : { kind: 'field', field: c.field, op: c.op, byAge: Object.fromEntries(AGE_TIERS.map((age) => [age, c.byAge[age] != null ? String(c.byAge[age]) : ''])) });
}

function toConditions(rows: Row[]): ArchetypeCondition[] {
  return rows.map((r): ArchetypeCondition => {
    if (r.kind === 'position') return { kind: 'position', op: r.op, positions: r.positions as ('PG'|'SG'|'SF'|'PF'|'C')[] };
    const byAge: Partial<Record<18|19|20|21, number>> = {};
    for (const age of AGE_TIERS) { const v = r.byAge[age]; if (v !== '' && v != null && !isNaN(Number(v))) byAge[age] = Number(v); }
    return { kind: 'field', field: r.field as ArchetypeCondition extends { kind: 'field' } ? never : never extends never ? typeof r.field : never, op: r.op, byAge } as ArchetypeCondition;
  });
}

export default function ArchetypeEditor({ archetype, onDone }: { archetype: EffectiveArchetype; onDone: () => void }) {
  const [name, setName] = useState(archetype.name);
  const [description, setDescription] = useState(archetype.description ?? '');
  const [rows, setRows] = useState<Row[]>(toRows(archetype));
  const [pending, start] = useTransition();

  const setCell = (i: number, age: number, val: string) => setRows((rs) => rs.map((r, j) => j === i && r.kind === 'field' ? { ...r, byAge: { ...r.byAge, [age]: val } } : r));
  const fillAcross = (i: number) => setRows((rs) => rs.map((r, j) => { if (j !== i || r.kind !== 'field') return r; const first = r.byAge[18] || Object.values(r.byAge).find((v) => v !== '') || ''; return { ...r, byAge: Object.fromEntries(AGE_TIERS.map((a) => [a, first])) }; }));
  const addField = () => setRows((rs) => [...rs, { kind: 'field', field: 'inside_def', op: '>=', byAge: Object.fromEntries(AGE_TIERS.map((a) => [a, ''])) }]);
  const addPosition = () => setRows((rs) => [...rs, { kind: 'position', op: 'is', positions: ['C'] }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i));

  const save = () => start(async () => {
    const conditions = toConditions(rows);
    if (archetype.key) await saveDefaultOverride(archetype.key, name, description, { conditions });
    else await saveCustom(archetype.dbId, name, description, { conditions });
    onDone();
  });

  return (
    <div className="border border-neutral-800 rounded p-4 bg-neutral-900/40">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm mb-2 w-64" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm mb-3 w-full" />
      <table className="text-sm mb-3">
        <thead className="text-neutral-400"><tr><th className="text-left pr-2">Field</th><th className="pr-2">Op</th>{AGE_TIERS.map((a) => <th key={a} className="px-1">{a}</th>)}<th></th><th></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.kind === 'field' ? (
                <>
                  <td className="pr-2"><select value={r.field} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'field' ? { ...x, field: e.target.value } : x))} className="bg-neutral-900 border border-neutral-700 rounded px-1">{ALL_FIELDS.map((f) => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}</select></td>
                  <td className="pr-2"><select value={r.op} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'field' ? { ...x, op: e.target.value as '>='|'<=' } : x))} className="bg-neutral-900 border border-neutral-700 rounded px-1"><option value=">=">≥</option><option value="<=">≤</option></select></td>
                  {AGE_TIERS.map((a) => <td key={a} className="px-1"><input value={r.byAge[a]} onChange={(e) => setCell(i, a, e.target.value)} className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1 text-center" /></td>)}
                  <td><button onClick={() => fillAcross(i)} title="fill across ages" className="text-neutral-500 hover:text-amber-500 px-1">→</button></td>
                </>
              ) : (
                <>
                  <td className="pr-2" colSpan={2}>Position</td>
                  <td colSpan={4} className="px-1">
                    <select value={r.op} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'position' ? { ...x, op: e.target.value as 'is'|'isNot' } : x))} className="bg-neutral-900 border border-neutral-700 rounded px-1 mr-2"><option value="is">is</option><option value="isNot">is not</option></select>
                    {(['PG','SG','SF','PF','C'] as const).map((pos) => (
                      <label key={pos} className="mr-1 text-xs"><input type="checkbox" checked={r.positions.includes(pos)} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'position' ? { ...x, positions: e.target.checked ? [...x.positions, pos] : x.positions.filter((p) => p !== pos) } : x))} /> {pos}</label>
                    ))}
                  </td>
                </>
              )}
              <td><button onClick={() => removeRow(i)} className="text-neutral-600 hover:text-red-400 px-1">×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 text-sm">
        <button onClick={addField} className="rounded border border-neutral-700 px-2 py-1">+ skill/attr</button>
        <button onClick={addPosition} className="rounded border border-neutral-700 px-2 py-1">+ position</button>
        <button onClick={save} disabled={pending} className="rounded bg-amber-600 px-3 py-1 font-medium disabled:opacity-50 ml-auto">Save</button>
        <button onClick={onDone} className="rounded border border-neutral-700 px-2 py-1">Cancel</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: List** — `v2/src/components/archetypes/ArchetypeList.tsx` (client; toggles the editor per row, offers reset/hide/delete):

```tsx
'use client';

import { useState, useTransition } from 'react';
import type { EffectiveArchetype } from '@/lib/archetypes/types';
import ArchetypeEditor from './ArchetypeEditor';
import { resetDefault, hideDefault, deleteCustom, saveCustom } from '@/app/archetypes/actions';

export default function ArchetypeList({ archetypes }: { archetypes: EffectiveArchetype[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const newDraft: EffectiveArchetype = { id: 'new', key: null, dbId: null, name: 'New archetype', source: 'custom', rules: { conditions: [] } };

  return (
    <div className="space-y-3">
      <button onClick={() => setEditing('new')} className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium">+ New archetype</button>
      {editing === 'new' && <ArchetypeEditor archetype={newDraft} onDone={() => setEditing(null)} />}
      {archetypes.map((a) => (
        <div key={a.id}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{a.name}</span>
            <span className="text-xs text-neutral-500">{a.source === 'custom' ? 'custom' : a.source === 'default-modified' ? 'modified default' : 'default'}</span>
            <span className="text-xs text-neutral-500">· {a.rules.conditions.length} conditions</span>
            <div className="ml-auto flex gap-2 text-xs">
              <button onClick={() => setEditing(editing === a.id ? null : a.id)} className="text-neutral-400 hover:text-amber-500">edit</button>
              {a.source === 'default-modified' && <button disabled={pending} onClick={() => start(() => resetDefault(a.key!))} className="text-neutral-400 hover:text-amber-500">reset</button>}
              {a.key && <button disabled={pending} onClick={() => start(() => hideDefault(a.key!, a.name))} className="text-neutral-400 hover:text-red-400">hide</button>}
              {a.source === 'custom' && <button disabled={pending} onClick={() => start(() => deleteCustom(a.dbId!))} className="text-neutral-400 hover:text-red-400">delete</button>}
            </div>
          </div>
          {editing === a.id && <div className="mt-2"><ArchetypeEditor archetype={a} onDone={() => setEditing(null)} /></div>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Page** — `v2/src/app/archetypes/page.tsx`:

```tsx
import { getEffectiveArchetypes } from '@/queries/archetypes';
import ArchetypeList from '@/components/archetypes/ArchetypeList';

export const dynamic = 'force-dynamic';

export default async function ArchetypesPage() {
  const archetypes = await getEffectiveArchetypes();
  return (
    <main className="p-6 max-w-4xl">
      <h1 className="text-lg font-semibold mb-1">Archetypes</h1>
      <p className="text-sm text-neutral-500 mb-4">Define named skill profiles by age. Players matching an archetype at their current age get badged on the Slovenia page and their profile. Starter examples are editable — your changes are yours; reset restores the default.</p>
      <ArchetypeList archetypes={archetypes} />
    </main>
  );
}
```

- [ ] **Step 5: Nav** — add `{ href: '/archetypes', label: 'Archetypes' }` to the LINKS array in `v2/src/components/Navbar.tsx`.

- [ ] **Step 6:** `npm test` green; `npm run build` clean. Dev + session cookie (curl.exe): GET `/archetypes` → 200 containing "Defensive Center" and "New archetype". (Interactive save/edit relies on typed server actions + the controller's Playwright pass post-deploy.)

- [ ] **Step 7: Commit + push**

```bash
git add v2/src/app/archetypes v2/src/components/archetypes v2/src/components/Navbar.tsx
git commit -m "feat(v2): archetype editor tab (grid editor, defaults, override/reset/hide)"
git push
```

---

### Task 5: Badges + filter on Slovenia

**Files:** Create `v2/src/components/ArchetypeBadge.tsx`; modify `v2/src/lib/table.ts`, `v2/src/components/FilterBar.tsx`, `v2/src/components/PlayerTable.tsx`, `v2/src/app/slovenia/page.tsx`

- [ ] **Step 1: Badge** — `v2/src/components/ArchetypeBadge.tsx`:

```tsx
export default function ArchetypeBadge({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-neutral-600">–</span>;
  return (
    <span className="text-xs rounded bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5" title={names.join(', ')}>
      {names[0]}{names.length > 1 ? ` +${names.length - 1}` : ''}
    </span>
  );
}
```

- [ ] **Step 2: Filter state** — in `v2/src/lib/table.ts`: add `archetype: string;` to `FilterState` (default `''` in `DEFAULT_FILTER`, and add `f.archetype === DEFAULT_FILTER.archetype` to `isFilterDefault`). The archetype filter is applied in the PAGE (needs match data), not in `filterRows` — leave `filterRows` unchanged. Add a comment noting archetype filtering happens in PlayerTable where match results are available.

- [ ] **Step 3: Compute matches in the Slovenia page + pass to table.** In `v2/src/app/slovenia/page.tsx`: fetch `getEffectiveArchetypes()` alongside players; compute a `Record<bbPlayerId, string[]>` of matched archetype names using `matchingArchetypes(row, archetypes)` (PlayerListRow satisfies EvalPlayer). Pass `archetypeMatches` and the archetype name list to `<PlayerTable>`.

```tsx
import { listPlayers } from '@/queries/players';
import { getEffectiveArchetypes } from '@/queries/archetypes';
import { matchingArchetypes } from '@/lib/archetypes/evaluate';
import PlayerTable from '@/components/PlayerTable';

export const dynamic = 'force-dynamic';

export default async function SloveniaPage() {
  const [rows, archetypes] = await Promise.all([listPlayers('slovenia'), getEffectiveArchetypes()]);
  const archetypeMatches: Record<number, string[]> = {};
  for (const r of rows) archetypeMatches[r.bbPlayerId] = matchingArchetypes(r, archetypes).map((a) => a.name);
  const archetypeNames = archetypes.map((a) => a.name);
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-1">Slovenia — U21 candidates</h1>
      <PlayerTable rows={rows} variant="slovenia" defaultShowSkills archetypeMatches={archetypeMatches} archetypeNames={archetypeNames} />
    </main>
  );
}
```

- [ ] **Step 4: PlayerTable** — accept `archetypeMatches?: Record<number, string[]>` and `archetypeNames?: string[]` props. Add an "Archetype" column (render `<ArchetypeBadge names={archetypeMatches?.[p.bbPlayerId] ?? []} />`) shown when `archetypeMatches` is provided (Slovenia variant). Apply the archetype filter: after `filterRows`, if `filter.archetype` is set, keep only rows whose `archetypeMatches[bbPlayerId]` includes it. Fix the empty-state colSpan to include the new column. Pass `archetypeNames` + current value + onChange down to FilterBar.

- [ ] **Step 5: FilterBar** — add an "Archetype" `<select>` (options: "All archetypes" + `archetypeNames`) bound to `filter.archetype`, in the primary row. Only render it when `archetypeNames?.length`.

- [ ] **Step 6:** `npm test` green; `npm run build` clean. Dev + cookie: GET `/slovenia` → 200; markup contains the "Archetype" column header and at least one badge (with real data, some 21yo should match e.g. a guard/center archetype); the archetype `<select>` is present.

- [ ] **Step 7: Commit + push**

```bash
git add v2/src/components/ArchetypeBadge.tsx v2/src/lib/table.ts v2/src/components/FilterBar.tsx v2/src/components/PlayerTable.tsx v2/src/app/slovenia/page.tsx
git commit -m "feat(v2): archetype badges + filter on the Slovenia table"
git push
```

---

### Task 6: Player profile archetype section + deploy/verify/docs

**Files:** Create `v2/src/components/player/ArchetypeMatches.tsx`; modify `v2/src/app/players/[id]/page.tsx`

- [ ] **Step 1: Section** — `v2/src/components/player/ArchetypeMatches.tsx` (server). Given the player's EvalPlayer fields + effective archetypes, show matched archetypes and, for each archetype (matched or not), the per-condition pass/fail at the player's current age:

```tsx
import { evaluateArchetype } from '@/lib/archetypes/evaluate';
import type { EffectiveArchetype, EvalPlayer } from '@/lib/archetypes/types';

const LABELS: Record<string, string> = {
  jump_shot: 'JS', jump_range: 'JR', outside_def: 'OD', handling: 'HA', driving: 'DR', passing: 'PA',
  inside_shot: 'IS', inside_def: 'ID', rebounding: 'RB', shot_blocking: 'SB', stamina: 'ST', free_throw: 'FT',
  potential: 'Pot', height_cm: 'Ht', tsp: 'TSP', position: 'Pos',
};

export default function ArchetypeMatches({ player, archetypes }: { player: EvalPlayer; archetypes: EffectiveArchetype[] }) {
  const results = archetypes.map((a) => ({ a, r: evaluateArchetype(player, a) }));
  const matched = results.filter((x) => x.r.matches);
  const near = results.filter((x) => !x.r.matches && x.r.checks.length > 0 && x.r.checks.filter((c) => c.pass).length >= x.r.checks.length - 1);

  return (
    <div>
      {matched.length === 0 && near.length === 0 && <p className="text-sm text-neutral-500">No archetype matches at this age.</p>}
      {matched.map(({ a, r }) => (
        <div key={a.id} className="mb-3">
          <span className="text-sm rounded bg-indigo-900/40 text-indigo-300 px-2 py-0.5">{a.name}</span>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {r.checks.map((c, i) => (
              <span key={i} className={c.pass ? 'text-green-400' : 'text-red-400'}>
                {LABELS[c.field] ?? c.field} {c.op} {c.threshold} ({c.actual ?? '–'})
              </span>
            ))}
          </div>
        </div>
      ))}
      {near.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-neutral-500 mb-1">Near misses</div>
          {near.map(({ a, r }) => (
            <div key={a.id} className="mb-1 text-xs">
              <span className="text-neutral-300">{a.name}</span>{' '}
              {r.checks.filter((c) => !c.pass).map((c, i) => (
                <span key={i} className="text-red-400 mr-2">{LABELS[c.field] ?? c.field} {c.op} {c.threshold} ({c.actual ?? '–'})</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into profile** — in `v2/src/app/players/[id]/page.tsx`: fetch `getEffectiveArchetypes()`; build an `EvalPlayer` from the detail's current profile (ageNow from `player.ageNow`, skills from the latest full snapshot / `currentProfile(snaps).skills`, potential/heightCm/tsp/bestPosition from the profile/player). Add a section after the ProfileCard:

```tsx
<section className="mt-6">
  <h2 className="font-medium mb-2">Archetypes</h2>
  <ArchetypeMatches player={evalPlayer} archetypes={archetypes} />
</section>
```

Construct `evalPlayer` from existing data: `{ ageNow: player.ageNow, skills: profile.skills, potential: profile.potential ?? player.potential, heightCm: player.heightCm, tsp: profile.tsp, bestPosition: player.bestPosition }` (use the same `currentProfile(snaps)` the ProfileCard uses; import if not already).

- [ ] **Step 3:** `npm test` green; `npm run build` clean. Dev + cookie: GET a scouted player `/players/54827381` → 200 containing "Archetypes".

- [ ] **Step 4: Commit + push**

```bash
git add v2/src/components/player/ArchetypeMatches.tsx v2/src/app/players/[id]/page.tsx
git commit -m "feat(v2): archetype matches + per-condition breakdown on player profile"
git push
```

- [ ] **Step 5 (controller): deploy + verify.** Confirm deploy READY. `npm run e2e` still passes (add an archetype smoke check if desired). Playwright/curl pass: `/archetypes` lists starters and a new archetype can be created + edited; `/slovenia` shows the Archetype column + filter narrows to matches; a player profile shows the Archetypes section with pass/fail. Update `CLAUDE.md` (Archetypes feature: engine, editor, badges/filter, storage/override model) + user memory. Commit + push.

---

## Self-Review (done at write time)

- **Spec coverage:** age-progressive grid model → Task 1 types + evaluator; unknown-age / blank-cell / ≥≤ / position / multi-match → Task 1 tests; default library → Task 2; merge/override/reset/hide/custom → Task 2 + Task 4 actions; DB table → Task 3; editor tab (grid, per-age, fill-across, add/remove rows) → Task 4; badges + archetype filter on Slovenia → Task 5; profile section with per-condition pass/fail + near-misses → Task 6; "new default just appears" → Task 2 test.
- **Type consistency:** `EffectiveArchetype`/`EvalPlayer`/`ArchetypeRules`/`ArchetypeCondition` defined in Task 1 `types.ts` and reused everywhere; `mergeArchetypes`/`ArchetypeRow` in Task 2 consumed by Task 3 query; evaluator `matchingArchetypes` used by Task 5 page and `evaluateArchetype` by Task 6; PlayerListRow already carries `ageNow, skills, potential, heightCm, tsp, bestPosition` so it satisfies `EvalPlayer` (verified against queries/players.ts).
- **Placeholder scan:** all code steps carry complete code; the ArchetypeEditor's `toConditions` field-cast is intentionally simple (the field select only offers valid ArchetypeField values, so the cast is safe) — if TS complains, cast via `as ArchetypeField`.
- **Deliberate deferrals:** World archetypes, training-path recommendations, OR/nested logic — all out of scope per spec §9.
- **Known simplification:** the ArchetypeEditor `toConditions` uses a loose cast for `field`; during implementation replace the convoluted conditional type with a plain `field: r.field as ArchetypeField`.
```
