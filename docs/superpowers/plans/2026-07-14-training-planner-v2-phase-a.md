# Training Planner v2 — Phase A Implementation Plan (model layer + engine + calibration)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution strategy (user-mandated, token economy):** implementation subagents run on
> **Sonnet** (default) or **Haiku** (pure data-transcription tasks: 2, 5 data half, 8 constants);
> the orchestrating session (Fable) reviews every task's diff before moving on.

**Goal:** A pure-TypeScript BuzzerBeater training engine in `v2/` with three provenance-tagged parameter sets (coach-parrot / open-source-live / bbscout), multi-season projection with ensemble uncertainty bands, salary + potential-cap sub-models, and a calibration harness that replays recorded oracle fixtures and forum observations.

**Architecture:** Data-only model files (every parameter family carries `{value, source, confidence}`) are interpreted by one engine (`weekStep`/`project`). Model-specific mechanics (elastic form, cap form, minutes factor) are tagged unions in the parameter shape, not code branches per model. Calibration lives in vitest tests reading fixtures from `docs/research/training/` plus a console report script.

**Tech Stack:** TypeScript 5 (strict), vitest 4 (`npm test` = `vitest run`, from `v2/`), tsx for scripts. Zero React/IO in `src/lib/training/`.

## Global Constraints

- All code in `v2/` (repo `D:\ClaudeProjects\BB-project`, worktree per using-git-worktrees at execution time). v1 (`web/`) untouched.
- Run tests from `v2/`: `npm test -- <file-substring>` (NEVER `npm test run` — v2 memory gotcha).
- Import alias `@/` = `v2/src/` (configured in vitest.config.ts + tsconfig).
- Research citations: every `Param.source` is a repo-relative path into `docs/research/training/` (+ optional anchor note). No bare "forum" strings.
- Skill order everywhere: `[js, jr, od, ha, dr, pa, is, id, rb, sb]` (BuzzerIQ/CP order; maps to db names jump_shot, jump_range, outside_def, handling, driving, passing, inside_shot, inside_def, rebounding, shot_blocking).
- Skills are decimal sublevels; displayed value = `ceil`, clamped 1..20. Stamina/FT held separately from the 10 trainable skills.
- 14-week seasons. Age increments at season boundary.
- Commit after every task (conventional commits, `feat(v2):`/`test(v2):` style used in this repo).

## File Structure (Phase A complete)

```
v2/src/lib/training/
  types.ts                     # SkillKey, Skills, Param, ModelParams, specs (Task 1)
  catalog.ts                   # 33 training types (Task 1)
  models/coach-parrot.ts       # extracted CP 2.1 (Task 2)
  models/open-source-live.ts   # sergiu tables + live-API corrections (Task 5)
  models/bbscout.ts            # default synthesis + low/high variants (Task 6)
  engine.ts                    # weekStep + project (Tasks 3, 4)
  ensemble.ts                  # bands across models (Task 7)
  salary.ts                    # Josef Ka salary + potential cap (Task 8)
  calibration/fixtures.ts      # buzzeriq probe loader (Task 9)
  calibration/*.test.ts        # worked example, oracle replay, forum sanity (Tasks 3, 9)
v2/scripts/training/
  simulate.mts                 # dev CLI (Task 10)
  report.mts                   # per-model oracle diff report (Task 9)
  refit-salary.mts             # deflation-scale refit vs Neon (Task 10)
```

---

### Task 1: Types + training catalog

**Files:**
- Create: `v2/src/lib/training/types.ts`
- Create: `v2/src/lib/training/catalog.ts`
- Test: `v2/src/lib/training/catalog.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by every later task): `SKILL_KEYS`, `SkillKey`, `Skills`, `skillsFromArray(ns: number[]): Skills`, `skillsToArray(s: Skills): number[]`, `Position`, `Confidence`, `Param<T>`, `RateRow`, `ElasticSpec`, `CapSpec`, `MinutesSpec`, `XtrainSpec`, `HeightTable`, `ModelParams`, `TRAINING_CATALOG: TrainingType[]`, `getTrainingType(id: number): TrainingType`.

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/training/catalog.test.ts
import { describe, expect, it } from 'vitest';
import { TRAINING_CATALOG, getTrainingType } from './catalog';
import { SKILL_KEYS, skillsFromArray, skillsToArray } from './types';

describe('training catalog', () => {
  it('has exactly 33 types with ids 1..33', () => {
    expect(TRAINING_CATALOG).toHaveLength(33);
    expect(TRAINING_CATALOG.map((t) => t.id)).toEqual(
      Array.from({ length: 33 }, (_, i) => i + 1),
    );
  });

  it('matches the BuzzerIQ id table on spot checks (docs/research/training/buzzeriq/API-MAP.md)', () => {
    expect(getTrainingType(1)).toMatchObject({ name: 'JS for 12', primary: 'js', positions: ['PG', 'SG'], kind: 'skill' });
    expect(getTrainingType(12)).toMatchObject({ name: 'HA for 1', primary: 'ha', positions: ['PG'] });
    expect(getTrainingType(28)).toMatchObject({ name: 'RB for team', positions: ['PG', 'SG', 'SF', 'PF', 'C'] });
    expect(getTrainingType(32)).toMatchObject({ name: 'Stamina', kind: 'stamina', primary: null });
    expect(getTrainingType(33)).toMatchObject({ name: 'Free Throw', kind: 'freethrow', primary: null });
  });

  it('round-trips skills arrays in canonical order', () => {
    const s = skillsFromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(s.js).toBe(1);
    expect(s.sb).toBe(10);
    expect(skillsToArray(s)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(SKILL_KEYS).toHaveLength(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `v2/`): `npm test -- catalog`
Expected: FAIL — cannot resolve `./catalog` / `./types`.

- [ ] **Step 3: Write types.ts**

```ts
// v2/src/lib/training/types.ts
export const SKILL_KEYS = ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is', 'id', 'rb', 'sb'] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];
/** Decimal sublevel values (displayed value = ceil, 1..20). */
export type Skills = Record<SkillKey, number>;
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export const ALL_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export function skillsFromArray(ns: number[]): Skills {
  if (ns.length !== 10) throw new Error(`expected 10 skills, got ${ns.length}`);
  return Object.fromEntries(SKILL_KEYS.map((k, i) => [k, ns[i]])) as Skills;
}
export function skillsToArray(s: Skills): number[] {
  return SKILL_KEYS.map((k) => s[k]);
}

/** Map to the snake_case skill columns used by v2 snapshots. */
export const SKILL_DB_NAMES: Record<SkillKey, string> = {
  js: 'jump_shot', jr: 'jump_range', od: 'outside_def', ha: 'handling', dr: 'driving',
  pa: 'passing', is: 'inside_shot', id: 'inside_def', rb: 'rebounding', sb: 'shot_blocking',
};

export type Confidence = 'official' | 'measured' | 'fitted' | 'estimate';
/** A parameter family with provenance. `source` is a repo-relative path into docs/research/training/. */
export interface Param<T> {
  value: T;
  source: string;
  confidence: Confidence;
}

/** Levels/week contributed to each skill by one training type (missing key = 0). */
export type RateRow = Partial<Record<SkillKey, number>>;

export type ElasticSpec =
  | { kind: 'none' }
  /** CoachParrot: multiplier coeff^(trained − avg(links[trained])) on the trained skill.
   *  boostOnly clamps the multiplier at ≥ 1 (only helps lagging skills). */
  | { kind: 'exp-linked'; coeff: number; boostOnly: boolean; links: Partial<Record<SkillKey, SkillKey[]>> }
  /** Sergiu: gain *= 1 + Σ coeff·(other − trained) over pairs where other > trained. */
  | { kind: 'pair-linear'; pairs: Array<{ trained: SkillKey; other: SkillKey; coeff: number }> };

export type CapSpec =
  | { kind: 'none' }
  /** Josef Ka / CP: capped when max over positions of Σ(weights·skills) ≥ 8 + 2·potential.
   *  weights arrays follow SKILL_KEYS order. All gains ×slowdown when capped. */
  | { kind: 'weighted-sum'; weights: Record<Position, number[]>; slowdown: number }
  /** Deployed open_source: per-skill ×slowdown once that skill ≥ threshold (potential ignored). */
  | { kind: 'high-skill'; threshold: number; slowdown: number };

export type MinutesSpec =
  | { kind: 'none' }
  /** Full rate at/above the age-band threshold, linear below. */
  | { kind: 'threshold-linear'; bands: Array<{ maxAge: number; minutes: number }> };

export type XtrainSpec =
  | { kind: 'none' }
  /** CP: the player's highest skill trains ×coeff^(maxSkill − avg(all 10)). */
  | { kind: 'top-skill-malus'; coeff: number };

/** Height multipliers at the 22 BB height steps, per skill. */
export interface HeightTable {
  stepsCm: number[];
  bySkill: Record<SkillKey, number[]>;
}

export interface TrainingType {
  id: number; // 1..33, BuzzerIQ/BB dropdown order
  name: string;
  primary: SkillKey | null; // null for stamina/FT
  positions: Position[]; // qualifying positions for the minutes requirement
  kind: 'skill' | 'stamina' | 'freethrow';
}

export interface ModelParams {
  id: 'coach-parrot' | 'open-source-live' | 'bbscout' | 'bbscout-low' | 'bbscout-high';
  /** RateRow per skill-training id (1..31). Stamina/FT use stRate/ftRate. */
  rates: Param<Record<number, RateRow>>;
  stRate: Param<number>; // stamina levels/week, no multipliers
  ftRate: Param<number>; // free-throw levels/week, no multipliers
  age: Param<Record<number, number>>; // 18..36
  height: Param<HeightTable>;
  coach: Param<Record<number, number>>; // trainer level 1..7
  /** Multiplicative bonus per youth-trainer level, ages 18-19 only: mult = 1 + perLevel·level. */
  youthTrainer: Param<{ perLevel: number }>;
  elastic: Param<ElasticSpec>;
  xtrain: Param<XtrainSpec>;
  cap: Param<CapSpec>;
  minutes: Param<MinutesSpec>;
  weeksPerSeason: Param<number>;
}
```

- [ ] **Step 4: Write catalog.ts**

```ts
// v2/src/lib/training/catalog.ts
// Source: docs/research/training/buzzeriq/API-MAP.md (ID table, verified vs the real
// BB dropdown) + docs/research/training/coachparrot/training_rate_matrix.csv (names).
import { ALL_POSITIONS, type Position, type SkillKey, type TrainingType } from './types';

const P = (digits: string): Position[] =>
  digits === 'team' ? [...ALL_POSITIONS] : [...digits].map((d) => ALL_POSITIONS[Number(d) - 1]);

function t(id: number, name: string, primary: SkillKey, digits: string): TrainingType {
  return { id, name, primary, positions: P(digits), kind: 'skill' };
}

export const TRAINING_CATALOG: TrainingType[] = [
  t(1, 'JS for 12', 'js', '12'),
  t(2, 'JS for 34', 'js', '34'),
  t(3, 'JS for 23', 'js', '23'),
  t(4, 'JS for team', 'js', 'team'),
  t(5, 'JR for 2', 'jr', '2'),
  t(6, 'JR for 12', 'jr', '12'),
  t(7, 'JR for 23', 'jr', '23'),
  t(8, 'JR for team', 'jr', 'team'),
  t(9, 'OD for 1', 'od', '1'),
  t(10, 'OD for 12', 'od', '12'),
  t(11, 'OD for 123', 'od', '123'),
  t(12, 'HA for 1', 'ha', '1'),
  t(13, 'HA for 12', 'ha', '12'),
  t(14, 'HA for 123', 'ha', '123'),
  t(15, 'DR for 12', 'dr', '12'),
  t(16, 'DR for 34', 'dr', '34'),
  t(17, 'DR for team', 'dr', 'team'),
  t(18, 'PA for 1', 'pa', '1'),
  t(19, 'PA for 12', 'pa', '12'),
  t(20, 'PA for team', 'pa', 'team'),
  t(21, 'IS for 5', 'is', '5'),
  t(22, 'IS for 45', 'is', '45'),
  t(23, 'IS for 345', 'is', '345'),
  t(24, 'ID for 5', 'id', '5'),
  t(25, 'ID for 45', 'id', '45'),
  t(26, 'ID for 345', 'id', '345'),
  t(27, 'RB for 45', 'rb', '45'),
  t(28, 'RB for team', 'rb', 'team'),
  t(29, 'SB for 5', 'sb', '5'),
  t(30, 'SB for 45', 'sb', '45'),
  t(31, 'SB for 345', 'sb', '345'),
  { id: 32, name: 'Stamina', primary: null, positions: [...ALL_POSITIONS], kind: 'stamina' },
  { id: 33, name: 'Free Throw', primary: null, positions: [...ALL_POSITIONS], kind: 'freethrow' },
];

export function getTrainingType(id: number): TrainingType {
  const tt = TRAINING_CATALOG[id - 1];
  if (!tt || tt.id !== id) throw new Error(`unknown training type id ${id}`);
  return tt;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- catalog`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/types.ts src/lib/training/catalog.ts src/lib/training/catalog.test.ts
git commit -m "feat(v2): training types + 33-type catalog for training planner"
```

---

### Task 2: coach-parrot parameter set

**Files:**
- Create: `v2/src/lib/training/models/coach-parrot.ts`
- Test: `v2/src/lib/training/models/coach-parrot.test.ts`

**Interfaces:**
- Consumes: all types from Task 1.
- Produces: `COACH_PARROT: ModelParams`, plus exported helpers reused by other models: `CP_AGE: Record<number, number>`, `CP_COACH: Record<number, number>`, `CP_HEIGHT_STEPS: number[]`, `buildHeightTable(js: number[] | number, jrOdHa: 'declining', ...)` — see code (exports `CP_RATES`, `CP_ELASTIC_LINKS`, `CP_POTENTIAL_WEIGHTS`, `cpHeightTable()`).

Data source files (exact values, transcribe from these — do NOT invent):
- `docs/research/training/coachparrot/training_rate_matrix.csv` (use clean fractions: 0.0375 not 0.037500000000000006)
- `docs/research/training/coachparrot/model_formula.md` (formula semantics + scalars)
- `docs/research/training/coachparrot/potential_weights.csv`

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/training/models/coach-parrot.test.ts
import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from './coach-parrot';
import { SKILL_KEYS } from '../types';

describe('coach-parrot parameters', () => {
  it('rate matrix spot checks vs training_rate_matrix.csv', () => {
    expect(COACH_PARROT.rates.value[12]).toEqual({ od: 0.1, ha: 0.5, dr: 0.4 }); // HA for 1
    expect(COACH_PARROT.rates.value[29]).toEqual({ id: 0.2, rb: 0.1, sb: 0.5 }); // SB for 5
    expect(COACH_PARROT.rates.value[18]).toEqual({ ha: 0.16, dr: 0.16, pa: 0.6 }); // PA for 1
    expect(COACH_PARROT.rates.value[4]).toEqual({ js: 0.22, jr: 0.044, ha: 0.022, dr: 0.022 }); // JS team
    expect(Object.keys(COACH_PARROT.rates.value)).toHaveLength(31);
  });

  it('age/coach tables match the community tables', () => {
    expect(COACH_PARROT.age.value[18]).toBe(1.0);
    expect(COACH_PARROT.age.value[21]).toBe(0.78);
    expect(COACH_PARROT.age.value[36]).toBe(0);
    expect(COACH_PARROT.coach.value[5]).toBe(1.0);
    expect(COACH_PARROT.coach.value[1]).toBe(0.88);
    expect(COACH_PARROT.coach.value[7]).toBe(1.06);
  });

  it('height table: 22 steps, anchored at 201cm, JR declines / IS rises 0.05 per step', () => {
    const h = COACH_PARROT.height.value;
    expect(h.stepsCm).toHaveLength(22);
    const i201 = h.stepsCm.indexOf(201);
    expect(h.bySkill.jr[i201]).toBeCloseTo(1.0, 10);
    expect(h.bySkill.is[i201]).toBeCloseTo(1.0, 10);
    expect(h.bySkill.jr[0]).toBeCloseTo(1.5, 10); // 175cm
    expect(h.bySkill.is[0]).toBeCloseTo(0.5, 10);
    expect(h.bySkill.ha[h.stepsCm.length - 1]).toBeCloseTo(0.45, 10); // 229cm
    expect(h.bySkill.js[i201]).toBeCloseTo(0.9975273768433653, 12); // fitted constant
    for (const k of SKILL_KEYS) expect(h.bySkill[k]).toHaveLength(22);
  });

  it('mechanics specs', () => {
    expect(COACH_PARROT.elastic.value).toMatchObject({ kind: 'exp-linked', coeff: 0.91, boostOnly: false });
    expect(COACH_PARROT.xtrain.value).toEqual({ kind: 'top-skill-malus', coeff: 0.925 });
    expect(COACH_PARROT.cap.value).toMatchObject({ kind: 'weighted-sum', slowdown: 1 / 3 });
    expect(COACH_PARROT.minutes.value).toEqual({ kind: 'none' });
    expect(COACH_PARROT.stRate.value).toBeCloseTo(2 / 3, 10);
    expect(COACH_PARROT.ftRate.value).toBe(0.5);
    expect(COACH_PARROT.weeksPerSeason.value).toBe(14);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- coach-parrot`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement coach-parrot.ts**

Full file. Rate rows come from `training_rate_matrix.csv` rows 1–31 (transcribe every
row; the four shown in the test are the spot-checked ones). Height table generated
from the documented slope rule (identical to the CSV).

```ts
// v2/src/lib/training/models/coach-parrot.ts
// CoachParrot 2.1 training model, extracted 2026-07-14 from cp_2_1_excel.xls.
// Provenance + formula semantics: docs/research/training/coachparrot/model_formula.md
import {
  SKILL_KEYS,
  type HeightTable,
  type ModelParams,
  type Position,
  type RateRow,
  type SkillKey,
} from '../types';

const SRC = 'docs/research/training/coachparrot';

// training_rate_matrix.csv, ids 1..31 (levels/week; position dilution baked in).
export const CP_RATES: Record<number, RateRow> = {
  1: { js: 0.5, jr: 0.1, ha: 0.05, dr: 0.05 },
  2: { js: 0.4, jr: 0.05, is: 0.2 },
  3: { js: 0.5, jr: 0.1, ha: 0.05, dr: 0.05 },
  4: { js: 0.22, jr: 0.044, ha: 0.022, dr: 0.022 },
  5: { js: 0.2, jr: 0.4, ha: 0.05, dr: 0.05 },
  6: { js: 0.15, jr: 0.3, ha: 0.0375, dr: 0.0375 },
  7: { js: 0.15, jr: 0.3, ha: 0.0375, dr: 0.0375 },
  8: { js: 0.05, jr: 0.1, ha: 0.0125, dr: 0.0125 },
  9: { od: 0.5, ha: 0.05, dr: 0.05, id: 0.1 },
  10: { od: 0.375, ha: 0.0375, dr: 0.0375, id: 0.075 },
  11: { od: 0.2, ha: 0.02, dr: 0.02, id: 0.04 },
  12: { od: 0.1, ha: 0.5, dr: 0.4 },
  13: { od: 0.075, ha: 0.375, dr: 0.3 },
  14: { od: 0.04, ha: 0.2, dr: 0.16 },
  15: { js: 0.4, ha: 0.4, dr: 0.5 },
  16: { js: 0.2, ha: 0.4, dr: 0.5, is: 0.2 },
  17: { js: 0.088, ha: 0.176, dr: 0.22, is: 0.088 },
  18: { ha: 0.16, dr: 0.16, pa: 0.6 },
  19: { ha: 0.12, dr: 0.12, pa: 0.45 },
  20: { ha: 0.04, dr: 0.04, pa: 0.15 },
  21: { js: 0.1, is: 0.5, id: 0.05 },
  22: { js: 0.075, is: 0.375, id: 0.0375 },
  23: { js: 0.04, is: 0.2, id: 0.02 },
  24: { is: 0.05, id: 0.5, sb: 0.1 },
  25: { is: 0.0375, id: 0.375, sb: 0.075 },
  26: { is: 0.02, id: 0.2, sb: 0.04 },
  27: { is: 0.05, id: 0.05, rb: 0.5 },
  28: { is: 0.022, id: 0.022, rb: 0.22 },
  29: { id: 0.2, rb: 0.1, sb: 0.5 },
  30: { id: 0.15, rb: 0.075, sb: 0.375 },
  31: { id: 0.08, rb: 0.04, sb: 0.2 },
};

export const CP_AGE: Record<number, number> = {
  18: 1.0, 19: 0.95, 20: 0.88, 21: 0.78, 22: 0.7, 23: 0.6, 24: 0.51, 25: 0.42,
  26: 0.35, 27: 0.27, 28: 0.21, 29: 0.16, 30: 0.11, 31: 0.07, 32: 0.05, 33: 0.03,
  34: 0.02, 35: 0.01, 36: 0,
};

export const CP_COACH: Record<number, number> = {
  1: 0.88, 2: 0.91, 3: 0.94, 4: 0.97, 5: 1.0, 6: 1.03, 7: 1.06,
};

export const CP_HEIGHT_STEPS = [
  175, 178, 180, 183, 185, 188, 190, 193, 196, 198, 201, 203, 206, 208, 211, 213,
  216, 218, 221, 224, 226, 229,
];

const CP_FLAT = 0.9975273768433653; // fitted JS/DR/PA constant (height_coefficients.csv)

/** JR/OD/HA: 1.50 at 175 declining 0.05/step; IS/ID/RB/SB: 0.50 rising 0.05/step; JS/DR/PA flat. */
export function cpHeightTable(flatValue: number = CP_FLAT): HeightTable {
  const n = CP_HEIGHT_STEPS.length;
  const declining = Array.from({ length: n }, (_, i) => 1.5 - 0.05 * i);
  const rising = Array.from({ length: n }, (_, i) => 0.5 + 0.05 * i);
  const flat = Array.from({ length: n }, () => flatValue);
  const bySkill = {} as Record<SkillKey, number[]>;
  for (const k of SKILL_KEYS) {
    bySkill[k] =
      k === 'jr' || k === 'od' || k === 'ha' ? [...declining]
      : k === 'is' || k === 'id' || k === 'rb' || k === 'sb' ? [...rising]
      : [...flat];
  }
  return { stepsCm: [...CP_HEIGHT_STEPS], bySkill };
}

// Elastic linked sets (model_formula.md): trained skill <- averaged-against set.
export const CP_ELASTIC_LINKS: Partial<Record<SkillKey, SkillKey[]>> = {
  js: ['jr', 'ha', 'dr'],
  jr: ['js', 'ha', 'dr'],
  od: ['ha', 'dr', 'id'],
  ha: ['od', 'dr'],
  dr: ['js', 'ha'],
  pa: ['ha', 'dr'],
  is: ['js', 'id'],
  id: ['is', 'sb'],
  rb: ['is', 'id'],
  sb: ['id', 'rb'],
};

// potential_weights.csv (SKILL_KEYS order). Capped when max_pos Σ(w·skill) >= 8 + 2·potential.
export const CP_POTENTIAL_WEIGHTS: Record<Position, number[]> = {
  PG: [0.18, 0.28, 0.3, 0.23, 0.11, 0.5, 0.05, 0.05, 0.2, 0.03],
  SG: [0.45, 0.41, 0.4, 0.06, 0.06, 0.07, 0.06, 0.1, 0.25, 0.03],
  SF: [0.6, 0.23, 0.3, 0.05, 0.05, 0.03, 0.1, 0.2, 0.35, 0.03],
  PF: [0.34, 0.06, 0.05, 0.05, 0.05, 0.03, 0.4, 0.4, 0.4, 0.16],
  C: [0.08, 0.15, 0, 0.03, 0.03, 0.03, 0.46, 0.42, 0.45, 0.23],
};

export const COACH_PARROT: ModelParams = {
  id: 'coach-parrot',
  rates: { value: CP_RATES, source: `${SRC}/training_rate_matrix.csv`, confidence: 'fitted' },
  stRate: { value: 2 / 3, source: `${SRC}/training_scalars.txt`, confidence: 'fitted' },
  ftRate: { value: 0.5, source: `${SRC}/training_scalars.txt`, confidence: 'fitted' },
  age: { value: CP_AGE, source: `${SRC}/age_coefficients.csv`, confidence: 'fitted' },
  height: { value: cpHeightTable(), source: `${SRC}/height_coefficients.csv`, confidence: 'fitted' },
  coach: { value: CP_COACH, source: `${SRC}/coach_coefficients.csv`, confidence: 'fitted' },
  youthTrainer: { value: { perLevel: 0 }, source: `${SRC}/model_formula.md (not modeled by CP)`, confidence: 'fitted' },
  elastic: {
    value: { kind: 'exp-linked', coeff: 0.91, boostOnly: false, links: CP_ELASTIC_LINKS },
    source: `${SRC}/model_formula.md`,
    confidence: 'fitted',
  },
  xtrain: { value: { kind: 'top-skill-malus', coeff: 0.925 }, source: `${SRC}/training_scalars.txt`, confidence: 'fitted' },
  cap: {
    value: { kind: 'weighted-sum', weights: CP_POTENTIAL_WEIGHTS, slowdown: 1 / 3 },
    source: `${SRC}/potential_weights.csv`,
    confidence: 'fitted',
  },
  minutes: { value: { kind: 'none' }, source: `${SRC}/model_formula.md (CP assumes full minutes)`, confidence: 'fitted' },
  weeksPerSeason: { value: 14, source: 'docs/research/training/model-comparison.md (weeks/season)', confidence: 'measured' },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- coach-parrot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/models/coach-parrot.ts src/lib/training/models/coach-parrot.test.ts
git commit -m "feat(v2): coach-parrot training parameter set (cp_2_1 extraction)"
```

---

### Task 3: Engine weekStep + CoachParrot worked-example calibration test

**Files:**
- Create: `v2/src/lib/training/engine.ts`
- Test: `v2/src/lib/training/engine.test.ts`
- Test: `v2/src/lib/training/calibration/cp-worked-example.test.ts`

**Interfaces:**
- Consumes: Task 1 types, Task 2 `COACH_PARROT`.
- Produces:
  - `interface PlayerState { skills: Skills; age: number; heightCm: number; potential: number; ftSkill?: number; staminaSkill?: number }`
  - `interface WeekConfig { trainingId: number; coachLevel: number; youthTrainerLevel?: number; minutes?: number }` (`minutes` = weekly minutes at the training's qualifying positions; `undefined` = assume full)
  - `interface WeekResult { gains: Skills; skillsAfter: Skills; pops: Partial<Record<SkillKey, boolean>>; capped: boolean; ftAfter: number; staminaAfter: number; multipliers: { age: number; coach: number; youth: number; minutes: number } }`
  - `weekStep(player: PlayerState, config: WeekConfig, model: ModelParams): WeekResult`
  - `displayed(v: number): number` (ceil clamped 1..20)
  - `heightMultiplier(model: ModelParams, heightCm: number, skill: SkillKey): number` (closest step)
  - `isCapped(model: ModelParams, player: PlayerState): boolean` (weighted-sum kinds; `high-skill` returns false — it is per-skill, handled inside weekStep)

- [ ] **Step 1: Write the failing engine unit tests**

```ts
// v2/src/lib/training/engine.test.ts
import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from './models/coach-parrot';
import { displayed, heightMultiplier, weekStep, type PlayerState } from './engine';
import { skillsFromArray } from './types';

const flat7 = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9, ftSkill: 5, staminaSkill: 5,
});

describe('weekStep (coach-parrot semantics)', () => {
  it('flat skills, age 18, coach 5, 201cm: HA-for-1 gains ≈ base rates (elastic=1 on flat)', () => {
    // xtrain hits the max skill; with all skills equal, every skill ties for max — CP's
    // rule (skill == max) applies the malus, but delta = 0 so 0.925^0 = 1. No effect.
    const r = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    expect(r.gains.ha).toBeCloseTo(0.5, 10);
    expect(r.gains.dr).toBeCloseTo(0.4, 10);
    expect(r.gains.od).toBeCloseTo(0.1, 10);
    expect(r.gains.js).toBe(0);
    expect(r.capped).toBe(false);
  });

  it('applies age and coach multipliers', () => {
    const p = { ...flat7(), age: 21 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 7 }, COACH_PARROT);
    expect(r.gains.ha).toBeCloseTo(0.5 * 0.78 * 1.06, 10);
  });

  it('elastic: trained skill above its linked average trains slower (CP symmetric)', () => {
    const p = flat7();
    p.skills.ha = 10; // ha linked to avg(od,dr)=7 → delta 3 → 0.91^3
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    // ha is also the unique max skill → xtrain: 0.925^(10 - avg(all))
    const avgAll = (7 * 9 + 10) / 10;
    expect(r.gains.ha).toBeCloseTo(0.5 * Math.pow(0.91, 3) * Math.pow(0.925, 10 - avgAll), 10);
  });

  it('potential cap: capped player trains at 1/3', () => {
    const p = { ...flat7(), skills: skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]), potential: 5 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    expect(r.capped).toBe(true);
    expect(r.gains.ha).toBeCloseTo((0.5 / 3) * Math.pow(0.925, 0), 5);
  });

  it('stamina/FT: flat rates, no multipliers, skills untouched', () => {
    const p = { ...flat7(), age: 30 };
    const st = weekStep(p, { trainingId: 32, coachLevel: 1 }, COACH_PARROT);
    expect(st.staminaAfter).toBeCloseTo(5 + 2 / 3, 10);
    expect(st.gains.ha).toBe(0);
    const ft = weekStep(p, { trainingId: 33, coachLevel: 1 }, COACH_PARROT);
    expect(ft.ftAfter).toBeCloseTo(5.5, 10);
  });

  it('pops: integer boundary crossings, displayed = ceil clamped 1..20', () => {
    const p = flat7();
    p.skills.ha = 7.9;
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, COACH_PARROT);
    expect(r.pops.ha).toBe(true); // 7.9 -> 8.4 crosses 8
    expect(r.pops.dr).toBe(false); // 7.0 -> 7.4 does not cross 8 (7.0 displays as 7)
    expect(displayed(7.9)).toBe(8);
    expect(displayed(0.2)).toBe(1);
    expect(displayed(20.4)).toBe(20);
  });

  it('height: closest step lookup', () => {
    expect(heightMultiplier(COACH_PARROT, 200, 'is')).toBeCloseTo(1.0, 10); // closest = 201
    expect(heightMultiplier(COACH_PARROT, 176, 'jr')).toBeCloseTo(1.5, 10); // closest = 175
  });
});
```

- [ ] **Step 2: Write the failing CP worked-example calibration test**

```ts
// v2/src/lib/training/calibration/cp-worked-example.test.ts
import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from '../models/coach-parrot';
import { weekStep } from '../engine';
import { skillsFromArray } from '../types';

describe('CoachParrot built-in worked example (model_formula.md, verified vs the sheet)', () => {
  it('OD for 1, age 27, 201cm, coach L4, JS5 JR5 OD4 HA3 DR2 PA5 IS3 ID2 RB3 SB1 -> OD +0.11190', () => {
    const player = {
      skills: skillsFromArray([5, 5, 4, 3, 2, 5, 3, 2, 3, 1]),
      age: 27, heightCm: 201, potential: 11,
    };
    const r = weekStep(player, { trainingId: 9, coachLevel: 4 }, COACH_PARROT);
    // 0.5 (rate) x 0.27 (age27) x ~1.0 (height OD@201) x 0.91^(4 - (3+2+2)/3) (elastic)
    //   x 1 (not max skill) x 1 (not capped) x 0.97 (coach L4) = 0.11190
    expect(r.gains.od).toBeCloseTo(0.1119, 4);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- engine && npm test -- cp-worked-example`
Expected: FAIL — `./engine` not found.

- [ ] **Step 4: Implement engine.ts**

```ts
// v2/src/lib/training/engine.ts
import { getTrainingType } from './catalog';
import {
  ALL_POSITIONS, SKILL_KEYS,
  type ModelParams, type SkillKey, type Skills,
} from './types';

export interface PlayerState {
  skills: Skills;
  age: number;
  heightCm: number;
  potential: number; // 0..11
  ftSkill?: number;
  staminaSkill?: number;
}

export interface WeekConfig {
  trainingId: number;
  coachLevel: number; // 1..7
  youthTrainerLevel?: number; // 0..7
  /** Weekly minutes at the training's qualifying positions. undefined = assume full. */
  minutes?: number;
}

export interface WeekResult {
  gains: Skills;
  skillsAfter: Skills;
  pops: Partial<Record<SkillKey, boolean>>;
  capped: boolean;
  ftAfter: number;
  staminaAfter: number;
  multipliers: { age: number; coach: number; youth: number; minutes: number };
}

export function displayed(v: number): number {
  return Math.min(20, Math.max(1, Math.ceil(v)));
}

export function heightMultiplier(model: ModelParams, heightCm: number, skill: SkillKey): number {
  const { stepsCm, bySkill } = model.height.value;
  let best = 0;
  for (let i = 1; i < stepsCm.length; i++) {
    if (Math.abs(stepsCm[i] - heightCm) < Math.abs(stepsCm[best] - heightCm)) best = i;
  }
  return bySkill[skill][best];
}

export function isCapped(model: ModelParams, player: PlayerState): boolean {
  const cap = model.cap.value;
  if (cap.kind !== 'weighted-sum') return false;
  const arr = SKILL_KEYS.map((k) => player.skills[k]);
  const score = Math.max(
    ...ALL_POSITIONS.map((pos) =>
      cap.weights[pos].reduce((acc, w, i) => acc + w * arr[i], 0),
    ),
  );
  return score >= 8 + 2 * player.potential;
}

function elasticMultiplier(model: ModelParams, skills: Skills, trained: SkillKey): number {
  const spec = model.elastic.value;
  if (spec.kind === 'none') return 1;
  if (spec.kind === 'exp-linked') {
    const links = spec.links[trained];
    if (!links || links.length === 0) return 1;
    const avg = links.reduce((a, k) => a + skills[k], 0) / links.length;
    const mult = Math.pow(spec.coeff, skills[trained] - avg);
    return spec.boostOnly ? Math.max(1, mult) : mult;
  }
  // pair-linear (sergiu): boost trained skill by coeff·(other − trained) for each higher other
  let factor = 1;
  for (const p of spec.pairs) {
    if (p.trained !== trained) continue;
    const diff = skills[p.other] - skills[trained];
    if (diff > 0) factor += p.coeff * diff;
  }
  return factor;
}

function minutesFactor(model: ModelParams, age: number, minutes: number | undefined): number {
  const spec = model.minutes.value;
  if (spec.kind === 'none' || minutes === undefined) return 1;
  const band = spec.bands.find((b) => age <= b.maxAge) ?? spec.bands[spec.bands.length - 1];
  if (minutes >= band.minutes) return 1;
  return Math.max(0, minutes / band.minutes);
}

export function weekStep(player: PlayerState, config: WeekConfig, model: ModelParams): WeekResult {
  const tt = getTrainingType(config.trainingId);
  const ageMult = model.age.value[player.age] ?? 0;
  const coachMult = model.coach.value[config.coachLevel] ?? 1;
  const youthMult =
    player.age <= 19 ? 1 + model.youthTrainer.value.perLevel * (config.youthTrainerLevel ?? 0) : 1;
  const minMult = minutesFactor(model, player.age, config.minutes);

  const gains = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Skills;
  let ftAfter = player.ftSkill ?? 1;
  let staminaAfter = player.staminaSkill ?? 1;
  const capped = isCapped(model, player);

  if (tt.kind === 'stamina') {
    staminaAfter += model.stRate.value; // flat, no multipliers (CP semantics)
  } else if (tt.kind === 'freethrow') {
    ftAfter += model.ftRate.value;
  } else {
    const row = model.rates.value[tt.id] ?? {};
    const maxSkill = Math.max(...SKILL_KEYS.map((k) => player.skills[k]));
    const avgAll = SKILL_KEYS.reduce((a, k) => a + player.skills[k], 0) / SKILL_KEYS.length;
    const capSpec = model.cap.value;
    for (const k of SKILL_KEYS) {
      const rate = row[k];
      if (!rate) continue;
      let g = rate * ageMult * coachMult * youthMult * minMult;
      g *= heightMultiplier(model, player.heightCm, k);
      g *= elasticMultiplier(model, player.skills, k);
      const xt = model.xtrain.value;
      if (xt.kind === 'top-skill-malus' && player.skills[k] === maxSkill) {
        g *= Math.pow(xt.coeff, player.skills[k] - avgAll);
      }
      if (capSpec.kind === 'weighted-sum' && capped) g *= capSpec.slowdown;
      if (capSpec.kind === 'high-skill' && player.skills[k] >= capSpec.threshold) g *= capSpec.slowdown;
      gains[k] = g;
    }
  }

  const skillsAfter = { ...player.skills };
  const pops: Partial<Record<SkillKey, boolean>> = {};
  for (const k of SKILL_KEYS) {
    if (!gains[k]) { pops[k] = false; continue; }
    const before = skillsAfter[k];
    skillsAfter[k] = Math.min(20, before + gains[k]);
    pops[k] = displayed(skillsAfter[k]) > displayed(before);
  }

  return {
    gains, skillsAfter, pops, capped, ftAfter, staminaAfter,
    multipliers: { age: ageMult, coach: coachMult, youth: youthMult, minutes: minMult },
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- engine && npm test -- cp-worked-example`
Expected: PASS (7 + 1 tests). The worked example is the extraction-fidelity gate — if it
fails by more than 1e-4, the implementation deviates from the spreadsheet; fix the
engine, do not loosen the tolerance.

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/engine.ts src/lib/training/engine.test.ts src/lib/training/calibration/cp-worked-example.test.ts
git commit -m "feat(v2): training engine weekStep with CP worked-example calibration gate"
```

---

### Task 4: Multi-season projection

**Files:**
- Modify: `v2/src/lib/training/engine.ts` (append)
- Test: `v2/src/lib/training/projection.test.ts`

**Interfaces:**
- Consumes: `weekStep`, `PlayerState`, `WeekConfig`, `ModelParams`.
- Produces:
  - `interface ProjectOptions { startWeekOfSeason?: number /* 1..14, default 1 */ }`
  - `interface ProjectionWeek { weekNumber: number; age: number; seasonWeek: number; config: WeekConfig; result: WeekResult }`
  - `interface Projection { weeks: ProjectionWeek[]; finalSkills: Skills; totalGains: Skills; displayedGains: Partial<Record<SkillKey, number>>; finalAge: number; popCount: number }`
  - `project(player: PlayerState, plan: WeekConfig[], model: ModelParams, opts?: ProjectOptions): Projection`

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/training/projection.test.ts
import { describe, expect, it } from 'vitest';
import { COACH_PARROT } from './models/coach-parrot';
import { project, type PlayerState } from './engine';
import { skillsFromArray } from './types';

const p = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9,
});

describe('project', () => {
  it('ages the player at 14-week season boundaries (startWeekOfSeason honored)', () => {
    const plan = Array.from({ length: 20 }, () => ({ trainingId: 12, coachLevel: 5 }));
    // starting at season week 10 -> 5 weeks left in season (10..14), age pops before week 6
    const proj = project(p(), plan, COACH_PARROT, { startWeekOfSeason: 10 });
    expect(proj.weeks[4].age).toBe(18); // season week 14
    expect(proj.weeks[5].age).toBe(19); // new season
    expect(proj.finalAge).toBe(19);
    expect(proj.weeks[5].seasonWeek).toBe(1);
  });

  it('accumulates gains week over week and counts pops', () => {
    const plan = Array.from({ length: 4 }, () => ({ trainingId: 12, coachLevel: 5 }));
    const proj = project(p(), plan, COACH_PARROT);
    expect(proj.finalSkills.ha).toBeGreaterThan(8.8); // ~4x0.5 minus elastic drag as ha rises
    expect(proj.totalGains.ha).toBeCloseTo(proj.finalSkills.ha - 7, 10);
    expect(proj.displayedGains.ha).toBeGreaterThanOrEqual(1);
    expect(proj.popCount).toBeGreaterThanOrEqual(1);
  });

  it('later weeks train slower as the player ages', () => {
    const plan = Array.from({ length: 28 }, () => ({ trainingId: 12, coachLevel: 5 }));
    const proj = project(p(), plan, COACH_PARROT);
    const w1 = proj.weeks[0].result.gains.dr;
    const w28 = proj.weeks[27].result.gains.dr; // age 19 (or 20 depending on start), slower
    expect(w28).toBeLessThan(w1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- projection`
Expected: FAIL — `project` is not exported.

- [ ] **Step 3: Append project() to engine.ts**

```ts
// append to v2/src/lib/training/engine.ts
export interface ProjectOptions {
  startWeekOfSeason?: number; // 1..14, default 1
}

export interface ProjectionWeek {
  weekNumber: number; // 1-based across the whole plan
  age: number;
  seasonWeek: number; // 1..weeksPerSeason
  config: WeekConfig;
  result: WeekResult;
}

export interface Projection {
  weeks: ProjectionWeek[];
  finalSkills: Skills;
  totalGains: Skills;
  displayedGains: Partial<Record<SkillKey, number>>;
  finalAge: number;
  popCount: number;
}

export function project(
  player: PlayerState,
  plan: WeekConfig[],
  model: ModelParams,
  opts: ProjectOptions = {},
): Projection {
  const wps = model.weeksPerSeason.value;
  let seasonWeek = opts.startWeekOfSeason ?? 1;
  let state: PlayerState = { ...player, skills: { ...player.skills } };
  const weeks: ProjectionWeek[] = [];
  let popCount = 0;

  for (let i = 0; i < plan.length; i++) {
    const result = weekStep(state, plan[i], model);
    weeks.push({ weekNumber: i + 1, age: state.age, seasonWeek, config: plan[i], result });
    popCount += SKILL_KEYS.filter((k) => result.pops[k]).length;
    state = {
      ...state,
      skills: result.skillsAfter,
      ftSkill: result.ftAfter,
      staminaSkill: result.staminaAfter,
    };
    seasonWeek++;
    if (seasonWeek > wps) {
      seasonWeek = 1;
      state.age++;
    }
  }

  const totalGains = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, state.skills[k] - player.skills[k]]),
  ) as Skills;
  const displayedGains = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, displayed(state.skills[k]) - displayed(player.skills[k])]),
  ) as Partial<Record<SkillKey, number>>;

  return { weeks, finalSkills: state.skills, totalGains, displayedGains, finalAge: state.age, popCount };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- projection`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/engine.ts src/lib/training/projection.test.ts
git commit -m "feat(v2): multi-season training projection with 14-week age boundaries"
```

---

### Task 5: open-source-live parameter set

**Files:**
- Create: `v2/src/lib/training/models/open-source-live.ts`
- Test: `v2/src/lib/training/models/open-source-live.test.ts`

**Interfaces:**
- Consumes: Task 1 types, Task 2 `CP_HEIGHT_STEPS`, Task 3 `weekStep`.
- Produces: `OPEN_SOURCE_LIVE: ModelParams`.

Data sources — read both before transcribing:
- `docs/research/training/buzzeriq/sergiu-logic.js` (base tables: trainingEffects, elasticEffects, heightMultipliers, age table)
- `docs/research/training/buzzeriq/API-MAP.md` §"open_source deployed ≠ sergiu-logic.js" + `probes/` (live corrections — these WIN where they conflict with the file)

Live corrections to encode (from API-MAP.md):
1. Age 21 multiplier is **0.80** (file/community say 0.78) — probe `23-age21`.
2. Cap behavior: per-skill ×0.8 once skill ≥ 16, potential ignored — probe `19-cap-open`.
3. Rate rows: use sergiu file's `trainingEffects` mapped onto our catalog ids, EXCEPT the
   probe-contradicted rows below. Sergiu's file has no exact per-id list — map by name:
   "JS (PG/SG)"→1, "JS (SF/PF)"→2, "JS (SG/SF)"→3, "JS (team)"→4, "JR (SG)"→5, "JR (PG)"→6
   (file's "JR (PG)" values match probe for id 6), "JR (SG/SF)"→7, "JR (team)"→8,
   "OD (PG)"→9, "OD (PG/SG)"→10, "OD(PG/SG/SF)"→11, "HA (PG)"→12, "HA (PG/SG)"→13,
   "HA (PG/SG/SF)"→14, "1v1 (PG/SG)"→15, "1v1 (SF/PF)"→16, "1v1 (team)"→17, "PA (PG)"→18,
   "PA (PG/SG)"→19, "PA (team)"→20, "IS (C)"→21, "IS (PF/C)"→22, "IS (SF/PF/C)"→23,
   "ID (C)"→24, "ID (PF/C)"→25, "ID (SF/PF/C)"→26, "RB (PF/C)"→27, "RB (team)"→28,
   "SB (C)"→29, "SB (PF/C)"→30, "SB (team)"→31.
   Probe-corrected rows (observed at h=200/201 after backing out the live height mults
   DR×0.95, IS×1.05, JS×1.04 — document this in a comment; confidence 'measured'):
   - id 12 `HA for 1`: `{ od: 0.1, ha: 0.5, dr: 0.4 }` (file had ha/dr primary swapped)
   - id 1 `JS for 12`: `{ js: 0.5, jr: 0.2, dr: 0.05, ha: 0.05 }` (probe JS 0.52 = 0.5×1.04)
   - id 21 `IS for 5`: `{ js: 0.125, is: 0.5, id: 0.1 }` (probe 0.13/0.525/0.10)
   - id 24 `ID for 5`: `{ is: 0.1, id: 0.5, sb: 0.1 }` (probe IS 0.105 = 0.1×1.05)
4. Height table: sergiu file table verbatim (HA flat 1.0, PA RISING with height,
   including PA's irregular steps) EXCEPT probe-observed cell corrections, which are
   required for the Task 9 definitional replay to pass at 0.02 tolerance:
   - at 201cm: JS → 1.04, DR → 0.95, IS → 1.05, PA → 1.0 (probes 01/04/05/06: JS-for-12
     gave JS 0.52 = 0.5×1.04; HA-for-1 gave DR 0.38 = 0.4×0.95; IS-for-5 gave IS 0.525 =
     0.5×1.05; PA-for-1 gave PA 0.60 = 0.6×1.0 vs the file's ~1.2)
   - at 175cm: IS → 0.65, ID → 0.5 (probe 24-h175-IS5)
   Comment each corrected cell with its probe name. Unprobed cells keep file values;
   overall confidence 'estimate' with the probed cells noted as 'measured' in a comment.
   The Task 9 report quantifies residual drift — do not guess unprobed cells.
5. Youth trainer: no effect (`perLevel: 0`, 'measured'); minutes: none; xtrain: none;
   weeksPerSeason 14; ST/FT rates 0 (live API no-ops; 'measured') — the bbscout model
   is the one that simulates ST/FT.

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/training/models/open-source-live.test.ts
import { describe, expect, it } from 'vitest';
import { OPEN_SOURCE_LIVE } from './open-source-live';
import { weekStep, type PlayerState } from '../engine';
import { skillsFromArray } from '../types';

const flat7At201 = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9,
});

describe('open-source-live parameters (live buzzeriq behavior)', () => {
  it('age 21 multiplier is the live 0.80, not the community 0.78', () => {
    expect(OPEN_SOURCE_LIVE.age.value[21]).toBe(0.8);
  });

  it('HA for 1 matches probe 01 primary split (ha 0.5 primary, dr secondary)', () => {
    const rates = OPEN_SOURCE_LIVE.rates.value[12];
    expect(rates.ha).toBeCloseTo(0.5, 10);
    expect(rates.dr).toBeCloseTo(0.4, 10);
    expect(rates.od).toBeCloseTo(0.1, 10);
  });

  it('high-skill slowdown: skill >= 16 trains at x0.8 regardless of potential', () => {
    const p = { ...flat7At201(), skills: skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]), potential: 5 };
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, OPEN_SOURCE_LIVE);
    // probe 19-cap-open: HA gain 0.40 = 0.5 x 0.8 (equal skills -> no elastic)
    expect(r.gains.ha).toBeCloseTo(0.4, 2);
    expect(r.capped).toBe(false); // weighted-sum cap not used by this model
  });

  it('pair-linear elastic boosts a lagging trained skill', () => {
    const p = flat7At201();
    p.skills.ha = 3; // OD->HA pair etc. — trained ha lags others
    const r = weekStep(p, { trainingId: 12, coachLevel: 5 }, OPEN_SOURCE_LIVE);
    expect(r.gains.ha).toBeGreaterThan(0.5); // boosted above base
  });

  it('ST/FT are no-ops in this model (live API behavior)', () => {
    const r = weekStep({ ...flat7At201(), ftSkill: 5 }, { trainingId: 33, coachLevel: 5 }, OPEN_SOURCE_LIVE);
    expect(r.ftAfter).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- open-source-live`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement open-source-live.ts**

Transcribe `trainingEffects` (31 named rows), `elasticEffects` (15 pairs: JS->DR 0.0211,
JR->OD 0.0371, OD->HA 0.0332, PA->HA 0.04, DR->JS 0.0296, DR->PA 0.0129, HA->OD 0.0116,
HA->PA 0.0103, IS->JS 0.0125, IS->ID 0.0289, IS->RB 0.0257, ID->IS 0.0153, RB->ID 0.0371,
SB->ID 0.0197, OD->ID 0.0455 — note in sergiu's code `'A->B'` means: when training A,
if skill B > skill A then A's gain is boosted by coeff×(B−A); encode as
`{ trained: 'js', other: 'dr', coeff: 0.0211 }` etc.), the height table (verbatim file
values, 22 steps — HA/JS/DR flat 1.0 except file quirks, PA rising: 1.0 through 196cm,
1.05@198, 1.0@201 per file line 58-59 quirk — TRANSCRIBE EXACTLY from
`docs/research/training/buzzeriq/sergiu-logic.js` lines 48-70), and the age table
(file lines 74-78) with the 21→0.80 live override. Apply the four probe-corrected rate
rows from the task preamble. Structure mirrors `coach-parrot.ts`:

```ts
// v2/src/lib/training/models/open-source-live.ts
// The buzzeriq.com "open_source" model AS DEPLOYED (probes win over the GitHub file).
// Base tables: docs/research/training/buzzeriq/sergiu-logic.js (MIT)
// Live corrections: docs/research/training/buzzeriq/API-MAP.md + probes/
import type { ModelParams, RateRow } from '../types';
import { CP_HEIGHT_STEPS } from './coach-parrot';

const SRC = 'docs/research/training/buzzeriq';

const RATES: Record<number, RateRow> = {
  // probe-corrected rows (confidence: measured):
  1: { js: 0.5, jr: 0.2, dr: 0.05, ha: 0.05 },
  12: { od: 0.1, ha: 0.5, dr: 0.4 },
  21: { js: 0.125, is: 0.5, id: 0.1 },
  24: { is: 0.1, id: 0.5, sb: 0.1 },
  // remaining rows verbatim from sergiu-logic.js trainingEffects (name→id map in plan):
  2: { js: 0.4, jr: 0.15, is: 0.25 },
  3: { js: 0.5, jr: 0.1, dr: 0.05, ha: 0.05 },
  4: { js: 0.22, jr: 0.04, dr: 0.02, ha: 0.02 },
  5: { js: 0.2, jr: 0.4, dr: 0.05, ha: 0.05 },
  6: { js: 0.15, jr: 0.3, dr: 0.0375, ha: 0.0375 },
  7: { js: 0.15, jr: 0.3, dr: 0.0375, ha: 0.0375 },
  8: { js: 0.05, jr: 0.1, dr: 0.0125, ha: 0.0125 },
  9: { od: 0.5, dr: 0.05, ha: 0.05, id: 0.1 },
  10: { od: 0.375, dr: 0.0375, ha: 0.0375, id: 0.075 },
  11: { od: 0.2, dr: 0.02, ha: 0.02, id: 0.04 },
  13: { od: 0.075, dr: 0.375, ha: 0.03 },
  14: { od: 0.04, dr: 0.2, ha: 0.16 },
  15: { js: 0.4, dr: 0.5, ha: 0.4 },
  16: { js: 0.2, dr: 0.5, ha: 0.4, is: 0.2 },
  17: { js: 0.088, dr: 0.176, ha: 0.22, is: 0.088 },
  18: { dr: 0.16, ha: 0.16, pa: 0.6 },
  19: { dr: 0.12, ha: 0.12, pa: 0.45 },
  20: { dr: 0.04, ha: 0.04, pa: 0.15 },
  22: { js: 0.075, is: 0.375, id: 0.0375 },
  23: { js: 0.04, is: 0.2, id: 0.02 },
  25: { is: 0.0375, id: 0.375, sb: 0.075 },
  26: { is: 0.02, id: 0.2, sb: 0.04 },
  27: { is: 0.05, id: 0.05, rb: 0.5 },
  28: { is: 0.022, id: 0.022, rb: 0.22 },
  29: { id: 0.2, rb: 0.1, sb: 0.5 },
  30: { id: 0.15, rb: 0.075, sb: 0.375 },
  31: { id: 0.08, rb: 0.04, sb: 0.2 },
};
// ... (height table transcribed verbatim from sergiu-logic.js — see implementation note;
//      age table with 21→0.80 override; elastic pairs list; ModelParams assembly like
//      coach-parrot.ts with minutes none, xtrain none, youthTrainer perLevel 0,
//      cap { kind: 'high-skill', threshold: 16, slowdown: 0.8 }, stRate/ftRate 0,
//      weeksPerSeason 14.)
```

(The implementer transcribes the height table rows exactly from
`docs/research/training/buzzeriq/sergiu-logic.js` lines 48–70; every other value in this
file is fully specified above or in the preamble.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- open-source-live`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/models/open-source-live.ts src/lib/training/models/open-source-live.test.ts
git commit -m "feat(v2): open-source-live parameter set (deployed buzzeriq behavior)"
```

---

### Task 6: bbscout parameter set (default synthesis)

**Files:**
- Create: `v2/src/lib/training/models/bbscout.ts`
- Test: `v2/src/lib/training/models/bbscout.test.ts`

**Interfaces:**
- Consumes: Task 2 exports (`CP_RATES`, `CP_AGE`, `CP_COACH`, `CP_ELASTIC_LINKS`, `cpHeightTable`), Task 1 types, Task 3 `weekStep`.
- Produces: `BBSCOUT: ModelParams`, `BBSCOUT_LOW: ModelParams`, `BBSCOUT_HIGH: ModelParams`, `JK_POTENTIAL_WEIGHTS: Record<Position, number[]>`.

Design decisions (from the spec — encode exactly):
- rates/age/coach: CP tables (best available fit).
- height: `cpHeightTable(1.0)` — JS/DR/PA exactly 1.0 (CP's 0.99753 treated as fit artifact).
- elastic: `exp-linked`, coeff 0.91, **boostOnly: true** (forum-consensus direction), CP links.
- xtrain: CP top-skill malus 0.925.
- cap: weighted-sum with **Josef Ka 2011 weights** (`docs/research/training/forum-research/EXTRACTED-DATA.md` §1 — PG .18/.26/.30/.24/.12/.52/.03/.04/.20/.03, SG .45/.50/.42/.05/.04/.08/.03/.05/.25/.03, SF .58/.34/.26/.05/.03/.03/.05/.25/.33/.03, PF .32/.06/.07/.05/.03/.02/.40/.40/.40/.20, C .06/.08/.01/.04/.03/.01/.46/.46/.46/.25), slowdown **0.15** (at-cap pop every ~6–7 weeks, thread 98371).
- minutes: threshold-linear, bands `[{maxAge: 19, minutes: 44}, {maxAge: 26, minutes: 47}, {maxAge: 99, minutes: 39}]` (manual thresholds 45/48/40 minus the official 1-minute buffer; source `docs/research/training/model-comparison.md` manual lines 690-698), confidence 'official' for thresholds (the linear sub-threshold shape is 'estimate' — note in comment).
- youthTrainer: `perLevel: 0.025` ('estimate', v1 heuristic).
- stRate 2/3, ftRate 0.5 (CP, 'fitted'); weeksPerSeason 14.
- `BBSCOUT_LOW` / `BBSCOUT_HIGH`: structuredClone of BBSCOUT with id changed and ONLY the
  'estimate'-confidence knobs pushed: LOW = cap slowdown 0.10, youthTrainer 0, elastic
  boostOnly true with coeff 0.91 (unchanged), all rates ×0.85; HIGH = cap slowdown 1/3,
  youthTrainer 0.05, rates ×1.15. (±15% rate scale = the median cross-source cell
  disagreement from model-comparison.md.)

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/training/models/bbscout.test.ts
import { describe, expect, it } from 'vitest';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from './bbscout';
import { weekStep, type PlayerState } from '../engine';
import { skillsFromArray } from '../types';

const flat7 = (): PlayerState => ({
  skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
  age: 18, heightCm: 201, potential: 9,
});

describe('bbscout parameters', () => {
  it('elastic is boost-only: a LEADING trained skill is not penalized', () => {
    const p = flat7();
    p.skills.pa = 12; // pa linked to avg(ha,dr)=7, leads by 5
    const r = weekStep(p, { trainingId: 18, coachLevel: 5 }, BBSCOUT);
    // no penalty (boostOnly) and pa is max skill -> only the xtrain malus applies
    const avgAll = (7 * 9 + 12) / 10;
    expect(r.gains.pa).toBeCloseTo(0.6 * Math.pow(0.925, 12 - avgAll), 10);
  });

  it('minutes factor: full at 44+ for age 18, linear below', () => {
    const full = weekStep(flat7(), { trainingId: 12, coachLevel: 5, minutes: 44 }, BBSCOUT);
    const half = weekStep(flat7(), { trainingId: 12, coachLevel: 5, minutes: 22 }, BBSCOUT);
    expect(full.multipliers.minutes).toBe(1);
    expect(half.multipliers.minutes).toBeCloseTo(0.5, 10);
    expect(half.gains.ha).toBeCloseTo(full.gains.ha * 0.5, 10);
  });

  it('cap slows training to x0.15 using Josef Ka weights', () => {
    const capped = { ...flat7(), skills: skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]), potential: 5 };
    const r = weekStep(capped, { trainingId: 12, coachLevel: 5 }, BBSCOUT);
    expect(r.capped).toBe(true);
    expect(r.gains.ha).toBeCloseTo(0.5 * 0.15, 5);
  });

  it('youth trainer boosts 18-19 year olds only', () => {
    const y = weekStep(flat7(), { trainingId: 12, coachLevel: 5, youthTrainerLevel: 4 }, BBSCOUT);
    expect(y.multipliers.youth).toBeCloseTo(1.1, 10);
    const old = weekStep({ ...flat7(), age: 21 }, { trainingId: 12, coachLevel: 5, youthTrainerLevel: 4 }, BBSCOUT);
    expect(old.multipliers.youth).toBe(1);
  });

  it('low/high variants bracket the central model', () => {
    const c = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, BBSCOUT).gains.ha;
    const lo = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, BBSCOUT_LOW).gains.ha;
    const hi = weekStep(flat7(), { trainingId: 12, coachLevel: 5 }, BBSCOUT_HIGH).gains.ha;
    expect(lo).toBeLessThan(c);
    expect(hi).toBeGreaterThan(c);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- bbscout`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement bbscout.ts**

```ts
// v2/src/lib/training/models/bbscout.ts
// BB Scout's default synthesis: CoachParrot structure + evidence-driven corrections.
// Rationale per parameter: docs/superpowers/specs/2026-07-14-training-planner-v2-design.md §1.
import type { ModelParams, Position, RateRow } from '../types';
import { CP_AGE, CP_COACH, CP_ELASTIC_LINKS, CP_RATES, cpHeightTable } from './coach-parrot';

const RESEARCH = 'docs/research/training';

// Josef Ka 2011 potential weights (2,276 samples) — forum-research/EXTRACTED-DATA.md §1
export const JK_POTENTIAL_WEIGHTS: Record<Position, number[]> = {
  PG: [0.18, 0.26, 0.3, 0.24, 0.12, 0.52, 0.03, 0.04, 0.2, 0.03],
  SG: [0.45, 0.5, 0.42, 0.05, 0.04, 0.08, 0.03, 0.05, 0.25, 0.03],
  SF: [0.58, 0.34, 0.26, 0.05, 0.03, 0.03, 0.05, 0.25, 0.33, 0.03],
  PF: [0.32, 0.06, 0.07, 0.05, 0.03, 0.02, 0.4, 0.4, 0.4, 0.2],
  C: [0.06, 0.08, 0.01, 0.04, 0.03, 0.01, 0.46, 0.46, 0.46, 0.25],
};

function scaleRates(rates: Record<number, RateRow>, f: number): Record<number, RateRow> {
  return Object.fromEntries(
    Object.entries(rates).map(([id, row]) => [
      id,
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k, (v as number) * f])),
    ]),
  ) as Record<number, RateRow>;
}

export const BBSCOUT: ModelParams = {
  id: 'bbscout',
  rates: { value: CP_RATES, source: `${RESEARCH}/coachparrot/training_rate_matrix.csv`, confidence: 'fitted' },
  stRate: { value: 2 / 3, source: `${RESEARCH}/coachparrot/training_scalars.txt`, confidence: 'fitted' },
  ftRate: { value: 0.5, source: `${RESEARCH}/coachparrot/training_scalars.txt`, confidence: 'fitted' },
  age: { value: CP_AGE, source: `${RESEARCH}/coachparrot/age_coefficients.csv`, confidence: 'fitted' },
  // JS/DR/PA exactly 1.0 (CP's 0.99753 = fit artifact; model-comparison.md)
  height: { value: cpHeightTable(1.0), source: `${RESEARCH}/coachparrot/height_coefficients.csv`, confidence: 'fitted' },
  coach: { value: CP_COACH, source: `${RESEARCH}/coachparrot/coach_coefficients.csv`, confidence: 'fitted' },
  youthTrainer: { value: { perLevel: 0.025 }, source: `${RESEARCH}/model-comparison.md (youth trainer: estimate)`, confidence: 'estimate' },
  elastic: {
    // boost-only: manual line 709 + thread 291954 msg 13/21 lean this way
    value: { kind: 'exp-linked', coeff: 0.91, boostOnly: true, links: CP_ELASTIC_LINKS },
    source: `${RESEARCH}/coachparrot/model_formula.md + forum-research/EXTRACTED-DATA.md §6`,
    confidence: 'fitted',
  },
  xtrain: { value: { kind: 'top-skill-malus', coeff: 0.925 }, source: `${RESEARCH}/coachparrot/training_scalars.txt`, confidence: 'fitted' },
  cap: {
    // slowdown 0.15: at-cap pop every ~6-7 weeks (thread 98371) vs ~weekly uncapped
    value: { kind: 'weighted-sum', weights: JK_POTENTIAL_WEIGHTS, slowdown: 0.15 },
    source: `${RESEARCH}/forum-research/EXTRACTED-DATA.md §1 + salary-potential/t98371-m35.txt`,
    confidence: 'estimate',
  },
  minutes: {
    // manual: 45/48/40 with an official 1-minute buffer => effective 44/47/39.
    // Linear sub-threshold shape is an estimate (nobody has measured the curve).
    value: { kind: 'threshold-linear', bands: [{ maxAge: 19, minutes: 44 }, { maxAge: 26, minutes: 47 }, { maxAge: 99, minutes: 39 }] },
    source: `${RESEARCH}/model-comparison.md (BBmanual lines 690-698)`,
    confidence: 'official',
  },
  weeksPerSeason: { value: 14, source: `${RESEARCH}/model-comparison.md (weeks/season)`, confidence: 'measured' },
};

function variant(id: ModelParams['id'], f: number, capSlowdown: number, ytPerLevel: number): ModelParams {
  const v = structuredClone(BBSCOUT);
  v.id = id;
  v.rates = { ...v.rates, value: scaleRates(BBSCOUT.rates.value, f) };
  if (v.cap.value.kind === 'weighted-sum') v.cap.value.slowdown = capSlowdown;
  v.youthTrainer = { ...v.youthTrainer, value: { perLevel: ytPerLevel } };
  return v;
}

// ±15% rate scale = median cross-source cell disagreement (model-comparison.md).
export const BBSCOUT_LOW: ModelParams = variant('bbscout-low', 0.85, 0.1, 0);
export const BBSCOUT_HIGH: ModelParams = variant('bbscout-high', 1.15, 1 / 3, 0.05);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- bbscout`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/models/bbscout.ts src/lib/training/models/bbscout.test.ts
git commit -m "feat(v2): bbscout default training model with low/high variants"
```

---

### Task 7: Ensemble bands

**Files:**
- Create: `v2/src/lib/training/ensemble.ts`
- Test: `v2/src/lib/training/ensemble.test.ts`

**Interfaces:**
- Consumes: `project`, `Projection`, all five models.
- Produces:
  - `ENSEMBLE_MODELS: ModelParams[]` (bbscout, coach-parrot, open-source-live, bbscout-low, bbscout-high)
  - `interface EnsembleResult { central: Projection; byModel: Record<string, Projection>; band: { low: Skills; high: Skills; tspLow: number; tspHigh: number; tspCentral: number } }`
  - `ensembleProject(player: PlayerState, plan: WeekConfig[], opts?: ProjectOptions): EnsembleResult`

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/training/ensemble.test.ts
import { describe, expect, it } from 'vitest';
import { ensembleProject } from './ensemble';
import { skillsFromArray, SKILL_KEYS } from './types';

describe('ensembleProject', () => {
  it('returns bbscout as central and a band that contains it', () => {
    const player = {
      skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
      age: 18, heightCm: 196, potential: 8,
    };
    const plan = Array.from({ length: 28 }, () => ({ trainingId: 15, coachLevel: 5 }));
    const r = ensembleProject(player, plan);
    expect(Object.keys(r.byModel)).toHaveLength(5);
    expect(r.band.tspLow).toBeLessThanOrEqual(r.band.tspCentral);
    expect(r.band.tspHigh).toBeGreaterThanOrEqual(r.band.tspCentral);
    for (const k of SKILL_KEYS) {
      expect(r.band.low[k]).toBeLessThanOrEqual(r.central.finalSkills[k] + 1e-9);
      expect(r.band.high[k]).toBeGreaterThanOrEqual(r.central.finalSkills[k] - 1e-9);
    }
    // a 28-week DR-heavy plan must show real spread between models
    expect(r.band.tspHigh - r.band.tspLow).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ensemble`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ensemble.ts**

```ts
// v2/src/lib/training/ensemble.ts
import { project, type PlayerState, type Projection, type ProjectOptions, type WeekConfig } from './engine';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from './models/bbscout';
import { COACH_PARROT } from './models/coach-parrot';
import { OPEN_SOURCE_LIVE } from './models/open-source-live';
import { SKILL_KEYS, type ModelParams, type Skills } from './types';

export const ENSEMBLE_MODELS: ModelParams[] = [
  BBSCOUT, COACH_PARROT, OPEN_SOURCE_LIVE, BBSCOUT_LOW, BBSCOUT_HIGH,
];

export interface EnsembleResult {
  central: Projection;
  byModel: Record<string, Projection>;
  band: { low: Skills; high: Skills; tspLow: number; tspHigh: number; tspCentral: number };
}

const tsp = (s: Skills) => SKILL_KEYS.reduce((a, k) => a + s[k], 0);

export function ensembleProject(
  player: PlayerState,
  plan: WeekConfig[],
  opts?: ProjectOptions,
): EnsembleResult {
  const byModel: Record<string, Projection> = {};
  for (const m of ENSEMBLE_MODELS) byModel[m.id] = project(player, plan, m, opts);
  const central = byModel['bbscout'];
  const finals = Object.values(byModel).map((p) => p.finalSkills);
  const low = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.min(...finals.map((f) => f[k]))]),
  ) as Skills;
  const high = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.max(...finals.map((f) => f[k]))]),
  ) as Skills;
  return {
    central, byModel,
    band: {
      low, high,
      tspLow: Math.min(...finals.map(tsp)),
      tspHigh: Math.max(...finals.map(tsp)),
      tspCentral: tsp(central.finalSkills),
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ensemble`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/ensemble.ts src/lib/training/ensemble.test.ts
git commit -m "feat(v2): ensemble projection with min-max uncertainty bands"
```

---

### Task 8: Salary + potential-cap sub-models

**Files:**
- Create: `v2/src/lib/training/salary.ts`
- Test: `v2/src/lib/training/salary.test.ts`

**Interfaces:**
- Consumes: Task 1 types, Task 6 `JK_POTENTIAL_WEIGHTS`.
- Produces:
  - `estimateSalary(skills: Skills, opts?: { deflationScale?: number }): { salary: number; best: Position; byPosition: Record<Position, number> }`
  - `potentialScore(skills: Skills): { score: number; byPosition: Record<Position, number>; capPosition: Position }`
  - `capThreshold(potential: number): number` (= 8 + 2·potential)
  - `capUsagePct(skills: Skills, potential: number): number`

Constants (transcribe exactly):
- Position multipliers + base 300: `docs/research/training/salary-potential/chromebb-salarycalc.js` lines 8–14 (order [js..sb] matches ours).
- Deflation: the NEWER bb-salary-calc 1.0.6 pair (no 0.86 factor):
  `min(0.9894173 − 0.021658378·ln s, 2.276085 − 0.1225621·ln s) · s`
  (source: `docs/research/training/salary-potential/EXTRACTS.md`). `deflationScale`
  (default 1.0) multiplies the deflated result — the refit script (Task 10) estimates it.

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/training/salary.test.ts
import { describe, expect, it } from 'vitest';
import { capThreshold, capUsagePct, estimateSalary, potentialScore } from './salary';
import { skillsFromArray } from './types';

describe('salary + potential cap', () => {
  it('all-7s: PG-ish salary profile, monotonic in skills', () => {
    const flat = estimateSalary(skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]));
    expect(flat.salary).toBeGreaterThan(1000);
    const better = estimateSalary(skillsFromArray([8, 8, 8, 8, 8, 8, 8, 8, 8, 8]));
    expect(better.salary).toBeGreaterThan(flat.salary);
  });

  it('an inside build is worth most at C, an outside build at a guard slot', () => {
    const big = estimateSalary(skillsFromArray([5, 3, 3, 3, 3, 3, 14, 13, 13, 10]));
    expect(['PF', 'C']).toContain(big.best);
    const guard = estimateSalary(skillsFromArray([13, 12, 12, 11, 10, 13, 3, 3, 4, 2]));
    expect(['PG', 'SG', 'SF']).toContain(guard.best);
  });

  it('potential score: all-7s scores ~13.5 at PG weights and is uncapped for potential 6+', () => {
    const flat = skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]);
    const ps = potentialScore(flat);
    expect(ps.score).toBeGreaterThan(12);
    expect(ps.score).toBeLessThan(15);
    expect(capThreshold(6)).toBe(20);
    expect(capUsagePct(flat, 6)).toBeCloseTo((ps.score / 20) * 100, 5);
  });

  it('capped detection matches the engine convention (score >= 8 + 2·potential)', () => {
    const nineteen = skillsFromArray([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]);
    expect(potentialScore(nineteen).score).toBeGreaterThan(capThreshold(5));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- salary`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement salary.ts**

```ts
// v2/src/lib/training/salary.ts
// Josef Ka salary formula — docs/research/training/salary-potential/chromebb-salarycalc.js
// Deflation: bb-salary-calc 1.0.6 (newer, no 0.86 factor) — salary-potential/EXTRACTS.md
// WARNING: BB announced a salary rework Jun 2024 (t324393); deflationScale is refit
// against our own Neon data by scripts/training/refit-salary.mts.
import { ALL_POSITIONS, SKILL_KEYS, type Position, type Skills } from './types';
import { JK_POTENTIAL_WEIGHTS } from './models/bbscout';

const SALARY_MULTIPLIERS: Record<Position, number[]> = {
  PG: [1.025, 1.045, 1.08, 1.08, 1.04, 1.155, 1.0, 1.0, 1.035, 1.0],
  SG: [1.125, 1.15, 1.13, 1.0, 1.0, 1.0, 1.0, 1.0, 1.065, 1.0],
  SF: [1.18, 1.085, 1.065, 1.0, 1.0, 1.0, 1.0, 1.06, 1.09, 1.005],
  PF: [1.08, 1.0, 1.0, 1.0, 1.0, 1.0, 1.115, 1.115, 1.115, 1.06],
  C: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.138, 1.135, 1.13, 1.065],
};
const SALARY_BASE = 300;
const DEFLATION = [
  { k: 0.9894173, d: 0.021658378 },
  { k: 2.276085, d: 0.1225621 },
];

function deflate(raw: number): number {
  return raw * Math.min(...DEFLATION.map(({ k, d }) => k - d * Math.log(raw)));
}

export function estimateSalary(
  skills: Skills,
  opts: { deflationScale?: number } = {},
): { salary: number; best: Position; byPosition: Record<Position, number> } {
  const scale = opts.deflationScale ?? 1;
  const arr = SKILL_KEYS.map((k) => Math.min(20, Math.max(1, Math.ceil(skills[k]))));
  const byPosition = {} as Record<Position, number>;
  let best: Position = 'PG';
  for (const pos of ALL_POSITIONS) {
    const raw =
      SALARY_BASE *
      Math.exp(SALARY_MULTIPLIERS[pos].reduce((a, m, i) => a + Math.log(m) * arr[i], 0));
    byPosition[pos] = Math.round(deflate(raw) * scale);
    if (byPosition[pos] > byPosition[best]) best = pos;
  }
  return { salary: byPosition[best], best, byPosition };
}

export function potentialScore(skills: Skills): {
  score: number;
  byPosition: Record<Position, number>;
  capPosition: Position;
} {
  const arr = SKILL_KEYS.map((k) => skills[k]);
  const byPosition = {} as Record<Position, number>;
  let capPosition: Position = 'PG';
  for (const pos of ALL_POSITIONS) {
    byPosition[pos] = JK_POTENTIAL_WEIGHTS[pos].reduce((a, w, i) => a + w * arr[i], 0);
    if (byPosition[pos] > byPosition[capPosition]) capPosition = pos;
  }
  return { score: byPosition[capPosition], byPosition, capPosition };
}

export function capThreshold(potential: number): number {
  return 8 + 2 * potential;
}

export function capUsagePct(skills: Skills, potential: number): number {
  return (potentialScore(skills).score / capThreshold(potential)) * 100;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- salary`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/salary.ts src/lib/training/salary.test.ts
git commit -m "feat(v2): Josef Ka salary + potential-cap sub-models"
```

---

### Task 9: Oracle fixture replay + forum sanity tests + diff report

**Files:**
- Create: `v2/src/lib/training/calibration/fixtures.ts`
- Test: `v2/src/lib/training/calibration/oracle-replay.test.ts`
- Test: `v2/src/lib/training/calibration/forum-sanity.test.ts`
- Create: `v2/scripts/training/report.mts`
- Modify: `v2/package.json` (add script `"training:report": "tsx scripts/training/report.mts"`)

**Interfaces:**
- Consumes: engine, all models.
- Produces:
  - `interface Probe { name: string; request: { player: { skills: number[]; age: number; height: number; potential: number; coach_level: number; youth_trainer_level: number; training_court_level: number; ft_skill: number; training_model: string }; training_schedule: number[]; start_season: number; start_week: number }; response: { weeks: Array<{ gains: number[] }>; final_skills: number[] } }`
  - `loadProbes(): Probe[]` — reads `docs/research/training/buzzeriq/probes/*.req.json` + `.res.json` pairs from the repo root (`path.resolve(process.cwd(), '..', 'docs', 'research', 'training', 'buzzeriq', 'probes')`; vitest cwd is `v2/`). Skips `11-id34-invalid` and `25-solve` (no `weeks` array).
  - `replayProbe(probe: Probe, model: ModelParams): { predicted: number[]; actual: number[]; maxAbsErr: number }` — simulates week 1 with our engine (`minutes` undefined, coach/youth from request) and compares `gains`.

- [ ] **Step 1: Write fixtures.ts**

```ts
// v2/src/lib/training/calibration/fixtures.ts
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, type PlayerState } from '../engine';
import { skillsFromArray, skillsToArray, type ModelParams } from '../types';

export interface Probe {
  name: string;
  request: {
    player: {
      skills: number[]; age: number; height: number; potential: number;
      coach_level: number; youth_trainer_level: number; training_court_level: number;
      ft_skill: number; training_model: string;
    };
    training_schedule: number[];
    start_season: number;
    start_week: number;
  };
  response: { weeks: Array<{ gains: number[] }>; final_skills: number[] };
}

export function probesDir(): string {
  return path.resolve(process.cwd(), '..', 'docs', 'research', 'training', 'buzzeriq', 'probes');
}

export function loadProbes(): Probe[] {
  const dir = probesDir();
  const reqs = readdirSync(dir).filter((f) => f.endsWith('.req.json'));
  const probes: Probe[] = [];
  for (const req of reqs) {
    const name = req.replace('.req.json', '');
    const request = JSON.parse(readFileSync(path.join(dir, req), 'utf8'));
    const response = JSON.parse(readFileSync(path.join(dir, `${name}.res.json`), 'utf8'));
    if (!response.weeks || !request.player) continue; // solve / invalid probes
    probes.push({ name, request, response });
  }
  return probes;
}

export function replayProbe(
  probe: Probe,
  model: ModelParams,
): { predicted: number[]; actual: number[]; maxAbsErr: number } {
  const p: PlayerState = {
    skills: skillsFromArray(probe.request.player.skills),
    age: probe.request.player.age,
    heightCm: probe.request.player.height,
    potential: probe.request.player.potential,
    ftSkill: probe.request.player.ft_skill,
  };
  const r = weekStep(p, {
    trainingId: probe.request.training_schedule[0],
    coachLevel: probe.request.player.coach_level,
    youthTrainerLevel: probe.request.player.youth_trainer_level,
  }, model);
  const predicted = skillsToArray(r.gains);
  const actual = probe.response.weeks[0].gains;
  const maxAbsErr = Math.max(...predicted.map((v, i) => Math.abs(v - actual[i])));
  return { predicted, actual, maxAbsErr };
}
```

- [ ] **Step 2: Write the failing oracle-replay test**

```ts
// v2/src/lib/training/calibration/oracle-replay.test.ts
import { describe, expect, it } from 'vitest';
import { loadProbes, replayProbe } from './fixtures';
import { COACH_PARROT } from '../models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../models/open-source-live';

describe('oracle fixture replay (buzzeriq recordings)', () => {
  const probes = loadProbes();

  it('loads the recorded probe pairs', () => {
    expect(probes.length).toBeGreaterThanOrEqual(25);
  });

  it('open-source-live reproduces probed open_source cells within 0.02', () => {
    // Cells we corrected FROM these probes must round-trip: the definitional set.
    const definitional = ['01-order-HA1', '03-order-SB5', '04-order-PA1', '23-age21', '31-open-age19', '32-open-age20'];
    for (const name of definitional) {
      const probe = probes.find((p) => p.name === name);
      expect(probe, name).toBeDefined();
      const { maxAbsErr } = replayProbe(probe!, OPEN_SOURCE_LIVE);
      expect(maxAbsErr, `${name} maxAbsErr`).toBeLessThan(0.02);
    }
  });

  it('coach-parrot matches buzzeriq coach_parrot on primary-skill cells within 0.02', () => {
    // buzzeriq's parrot deviates from cp_2_1 on some secondaries (e.g. SB-for-5 drops the
    // ID secondary) — assert primaries only; full diffs go to the report script.
    const cases = [
      { name: '21-parrot-HA1', skillIdx: 3 }, // HA
      { name: '22-parrot-SB5', skillIdx: 9 }, // SB
      { name: '30-parrot-age21', skillIdx: 3 },
    ];
    for (const c of cases) {
      const probe = probes.find((p) => p.name === c.name);
      expect(probe, c.name).toBeDefined();
      const { predicted, actual } = replayProbe(probe!, COACH_PARROT);
      expect(Math.abs(predicted[c.skillIdx] - actual[c.skillIdx]), c.name).toBeLessThan(0.02);
    }
  });
});
```

- [ ] **Step 3: Write the failing forum-sanity test**

```ts
// v2/src/lib/training/calibration/forum-sanity.test.ts
// Weeks-per-pop magnitudes from the community table (forum-research/EXTRACTED-DATA.md §2):
// wide tolerances on purpose — these guard against order-of-magnitude regressions.
import { describe, expect, it } from 'vitest';
import { BBSCOUT } from '../models/bbscout';
import { weekStep } from '../engine';
import { skillsFromArray } from '../types';

function weeksPerPop(gain: number): number {
  return 1 / gain;
}

describe('forum weeks-per-pop sanity (18yo, level-5 trainer)', () => {
  it('single-position OD training pops OD roughly every 2 weeks for a 190cm guard', () => {
    const p = { skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]), age: 18, heightCm: 190, potential: 9 };
    const r = weekStep(p, { trainingId: 9, coachLevel: 5 }, BBSCOUT);
    expect(weeksPerPop(r.gains.od)).toBeGreaterThan(1);
    expect(weeksPerPop(r.gains.od)).toBeLessThan(3.5); // table: OD@2 (Pressure PG)
  });

  it('RB for 45 pops RB roughly every 1.75-2.5 weeks for a 206cm big', () => {
    const p = { skills: skillsFromArray([5, 4, 4, 4, 4, 4, 9, 9, 8, 7]), age: 18, heightCm: 206, potential: 9 };
    const r = weekStep(p, { trainingId: 27, coachLevel: 5 }, BBSCOUT);
    expect(weeksPerPop(r.gains.rb)).toBeGreaterThan(1);
    expect(weeksPerPop(r.gains.rb)).toBeLessThan(3.5); // table: RB@1.75
  });

  it('free throws pop about every 2 weeks regardless of trainer', () => {
    const p = { skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]), age: 18, heightCm: 196, potential: 9, ftSkill: 5 };
    const r = weekStep(p, { trainingId: 33, coachLevel: 1 }, BBSCOUT);
    expect(r.ftAfter - 5).toBeCloseTo(0.5, 10); // table: FT@2wks -> 0.5/week
  });
});
```

- [ ] **Step 4: Run tests to verify they fail, then verify they pass**

Run: `npm test -- calibration`
Expected first: FAIL (fixtures module missing). After Steps 1–3 files exist: PASS.
If `oracle-replay` fails on a definitional cell, the open-source-live tables were
transcribed wrong — fix the model file (Task 5), never the tolerance.

- [ ] **Step 5: Write report.mts + package.json script**

```ts
// v2/scripts/training/report.mts
// Prints a per-model, per-probe diff table vs the recorded buzzeriq fixtures.
import { loadProbes, replayProbe } from '../../src/lib/training/calibration/fixtures';
import { COACH_PARROT } from '../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../src/lib/training/models/open-source-live';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';

const models = [OPEN_SOURCE_LIVE, COACH_PARROT, BBSCOUT];
const probes = loadProbes();

for (const model of models) {
  console.log(`\n=== ${model.id} vs recorded fixtures ===`);
  const rows = probes
    .filter((p) =>
      model.id === 'coach-parrot' || model.id === 'bbscout'
        ? p.request.player.training_model === 'coach_parrot'
        : p.request.player.training_model === 'open_source',
    )
    .map((p) => {
      const { maxAbsErr } = replayProbe(p, model);
      return { probe: p.name, maxAbsErr: Number(maxAbsErr.toFixed(4)) };
    })
    .sort((a, b) => b.maxAbsErr - a.maxAbsErr);
  console.table(rows);
  const worst = rows[0];
  console.log(`worst: ${worst?.probe} (${worst?.maxAbsErr})`);
}
```

Add to `v2/package.json` scripts: `"training:report": "tsx scripts/training/report.mts"`.

Run: `npm run training:report`
Expected: three tables print; open-source-live worst maxAbsErr < 0.1; coach-parrot shows
its known secondary-cell deviations (do not "fix" those — they document where buzzeriq's
parrot differs from cp_2_1).

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/calibration/ scripts/training/report.mts package.json
git commit -m "test(v2): oracle fixture replay + forum sanity calibration harness"
```

---

### Task 10: Dev CLI + salary deflation refit script

**Files:**
- Create: `v2/scripts/training/simulate.mts`
- Create: `v2/scripts/training/refit-salary.mts`
- Test: `v2/src/lib/training/refit.test.ts`
- Create: `v2/src/lib/training/refit.ts`
- Modify: `v2/package.json` (scripts: `"training:simulate": "tsx scripts/training/simulate.mts"`, `"training:refit-salary": "tsx scripts/training/refit-salary.mts"`)

**Interfaces:**
- Consumes: `ensembleProject`, `estimateSalary`, `Skills`.
- Produces: `fitDeflationScale(rows: Array<{ skills: Skills; actualSalary: number }>): { scale: number; medianAbsPctErr: number }` in `refit.ts`.

- [ ] **Step 1: Write the failing refit test**

```ts
// v2/src/lib/training/refit.test.ts
import { describe, expect, it } from 'vitest';
import { fitDeflationScale } from './refit';
import { estimateSalary } from './salary';
import { skillsFromArray } from './types';

describe('fitDeflationScale', () => {
  it('recovers a known synthetic scale', () => {
    const TRUE_SCALE = 0.9;
    const rows = [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [12, 11, 10, 9, 8, 12, 3, 3, 4, 2],
      [5, 3, 3, 3, 3, 3, 14, 13, 13, 10],
      [9, 9, 9, 8, 8, 9, 8, 8, 8, 7],
      [15, 14, 13, 12, 11, 15, 5, 5, 6, 3],
    ].map((arr) => {
      const skills = skillsFromArray(arr);
      return { skills, actualSalary: estimateSalary(skills).salary * TRUE_SCALE };
    });
    const { scale, medianAbsPctErr } = fitDeflationScale(rows);
    expect(scale).toBeCloseTo(TRUE_SCALE, 2);
    expect(medianAbsPctErr).toBeLessThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- refit`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement refit.ts**

```ts
// v2/src/lib/training/refit.ts
import { estimateSalary } from './salary';
import type { Skills } from './types';

/** Median ratio of actual/predicted salary = a robust global deflation-scale estimate.
 *  Phase A refits scale only; per-multiplier refit waits for more data (spec §1). */
export function fitDeflationScale(
  rows: Array<{ skills: Skills; actualSalary: number }>,
): { scale: number; medianAbsPctErr: number } {
  if (rows.length === 0) throw new Error('no rows to fit');
  const ratios = rows
    .map((r) => r.actualSalary / estimateSalary(r.skills).salary)
    .sort((a, b) => a - b);
  const scale = ratios[Math.floor(ratios.length / 2)];
  const errs = rows
    .map((r) => {
      const pred = estimateSalary(r.skills, { deflationScale: scale }).salary;
      return Math.abs(pred - r.actualSalary) / r.actualSalary * 100;
    })
    .sort((a, b) => a - b);
  return { scale, medianAbsPctErr: errs[Math.floor(errs.length / 2)] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- refit`
Expected: PASS.

- [ ] **Step 5: Write the two scripts**

```ts
// v2/scripts/training/simulate.mts
// Dev CLI: npm run training:simulate -- --age 18 --height 196 --potential 8 \
//   --skills 7,6,6,7,5,7,4,4,5,3 --plan 15x21,9x21 --coach 5
// --plan: comma-separated <trainingId>x<weeks> blocks.
import { ensembleProject } from '../../src/lib/training/ensemble';
import { estimateSalary, capUsagePct } from '../../src/lib/training/salary';
import { displayed } from '../../src/lib/training/engine';
import { skillsFromArray, SKILL_KEYS } from '../../src/lib/training/types';

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${name}`);
  }
  return process.argv[i + 1];
}

const player = {
  skills: skillsFromArray(arg('skills').split(',').map(Number)),
  age: Number(arg('age')),
  heightCm: Number(arg('height')),
  potential: Number(arg('potential')),
};
const coachLevel = Number(arg('coach', '5'));
const plan = arg('plan')
  .split(',')
  .flatMap((block) => {
    const [id, weeks] = block.split('x').map(Number);
    return Array.from({ length: weeks }, () => ({ trainingId: id, coachLevel }));
  });

const r = ensembleProject(player, plan);
console.log(`Plan: ${plan.length} weeks | final age ${r.central.finalAge}`);
console.log('skill  start  ->  central [low..high]');
for (const k of SKILL_KEYS) {
  const s = player.skills[k];
  console.log(
    `${k.padEnd(5)} ${String(displayed(s)).padStart(5)}  ->  ${r.central.finalSkills[k].toFixed(1).padStart(7)} [${r.band.low[k].toFixed(1)}..${r.band.high[k].toFixed(1)}]`,
  );
}
console.log(`TSP: ${r.band.tspCentral.toFixed(1)} [${r.band.tspLow.toFixed(1)}..${r.band.tspHigh.toFixed(1)}]`);
console.log(`Salary now: ${estimateSalary(player.skills).salary} | projected: ${estimateSalary(r.central.finalSkills).salary}`);
console.log(`Cap usage: ${capUsagePct(r.central.finalSkills, player.potential).toFixed(0)}%`);
```

```ts
// v2/scripts/training/refit-salary.mts
// Fits the global salary deflation scale against current Neon data and prints it.
// Requires DATABASE_URL (reads .env.local like other v2 scripts).
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { fitDeflationScale } from '../../src/lib/training/refit';
import { skillsFromArray } from '../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);
// latest api snapshot per player with a salary and full skills
const rows = await sql`
  select distinct on (s.player_id)
    s.jump_shot, s.jump_range, s.outside_def, s.handling, s.driving, s.passing,
    s.inside_shot, s.inside_def, s.rebounding, s.shot_blocking, s.salary
  from snapshots s
  where s.source = 'api' and s.salary is not null and s.jump_shot is not null
  order by s.player_id, s.captured_at desc
`;
const data = rows.map((r) => ({
  skills: skillsFromArray([
    r.jump_shot, r.jump_range, r.outside_def, r.handling, r.driving, r.passing,
    r.inside_shot, r.inside_def, r.rebounding, r.shot_blocking,
  ].map(Number)),
  actualSalary: Number(r.salary),
}));
console.log(`fitting on ${data.length} players...`);
const { scale, medianAbsPctErr } = fitDeflationScale(data);
console.log(`deflationScale = ${scale.toFixed(4)} (median |err| ${medianAbsPctErr.toFixed(1)}%)`);
console.log('Pass this via estimateSalary(skills, { deflationScale }) — persisting the');
console.log('fitted value into a settings row is a Phase B task.');
```

NOTE for implementer: check the actual v2 snapshot table/column names in
`v2/src/db/schema.ts` before finalizing the SQL (the table may be `snapshots` with
`captured_at`, or differ — match the schema, keep the distinct-on-latest-per-player shape).

- [ ] **Step 6: Smoke-run the CLI, then commit**

Run: `npm run training:simulate -- --age 18 --height 196 --potential 8 --skills 7,6,6,7,5,7,4,4,5,3 --plan 15x21,9x21`
Expected: a table of 10 skills with central + [low..high] band, TSP line, salary lines.

Run: `npm run training:refit-salary` (only if `.env.local` has DATABASE_URL; otherwise skip and note in the task report).
Expected: prints a scale around 0.5–1.5 and a median error.

```bash
git add scripts/training/ src/lib/training/refit.ts src/lib/training/refit.test.ts package.json
git commit -m "feat(v2): training simulate CLI + salary deflation refit"
```

---

### Task 11: Full-suite verification + docs

**Files:**
- Modify: `D:\ClaudeProjects\BB-project\CLAUDE.md` (v2 Rework section — add a Phase 6 entry)

- [ ] **Step 1: Run the entire v2 suite**

Run (from `v2/`): `npm test`
Expected: all suites pass, including the 10+ new training test files and all
pre-existing tests (no regressions).

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 2: Add CLAUDE.md entry**

Append to the v2 Rework section of `D:\ClaudeProjects\BB-project\CLAUDE.md` (after the 2026-07-13 UX batch paragraph):

```markdown
**Training engine Phase A shipped (date)** — Pure-TS training model layer in
`v2/src/lib/training/`: three provenance-tagged parameter sets (`coach-parrot` extracted
from cp_2_1, `open-source-live` from recorded buzzeriq probes, `bbscout` synthesis =
default), `weekStep`/`project` engine (14-week seasons, decimal sublevels, ceil display),
ensemble min-max bands (`ensembleProject`), Josef Ka salary + potential-cap sub-models
(`salary.ts`; cap = Σ(pos-weights·skills) ≥ 8+2·potential, slowdown ×0.15). Calibration:
CP worked-example gate (±1e-4), buzzeriq fixture replay (`docs/research/training/buzzeriq/
probes/`), forum weeks-per-pop sanity. Scripts: `npm run training:simulate`,
`training:report`, `training:refit-salary`. Research archive + provenance chain:
`docs/research/training/README.md`. Design: `docs/superpowers/specs/
2026-07-14-training-planner-v2-design.md` (Phases B-D: minutes pipeline, inference
flywheel, planner UI).
```

- [ ] **Step 3: Commit**

```bash
git add ../CLAUDE.md
git commit -m "docs: record training engine Phase A in CLAUDE.md"
```

---

## Self-Review (done at authoring time)

- **Spec coverage (Phase A):** model layer §1 → Tasks 2/5/6; engine §2 → Tasks 3/4; ensemble §2 → Task 7; calibration §3 fixtures 1-4 → Tasks 3 (worked example), 9 (oracle + forum), 10 (salary refit); salary/cap sub-models → Task 8; sublevel init default (displayed − 0.5) is trivial and deferred to the first UI consumer in Phase B (documented here so it isn't lost). Calibration fixture class 5 (own observations) is Phase C by design.
- **Type consistency:** `ModelParams`/`Skills`/`WeekConfig`/`PlayerState` names checked across all tasks; `JK_POTENTIAL_WEIGHTS` defined in Task 6, consumed in Task 8; `CP_*` exports defined in Task 2, consumed in Tasks 5/6; `loadProbes`/`replayProbe` defined in Task 9 Step 1, consumed in Task 9 tests + report.
- **Known intentional looseness:** Task 5's height table transcription cites exact file lines instead of duplicating 22 rows of the sergiu table (the file is checked into the repo at a stable path — this is a data-copy instruction, not a design placeholder); Task 10's SQL carries an explicit schema-check note.
