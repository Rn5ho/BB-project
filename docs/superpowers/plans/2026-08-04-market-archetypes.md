# Market-Derived U-21 Archetypes + Training Plans — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One analysis script that mines the season-72 market flood for elite U-21 builds (three groups, shape-space clustering), derives lean archetype rules gated by self-match/specificity checks, computes optimized training paths per build (beam search + forward simulation → byAge tiers), benchmarks everything against the Greek U-21 bronze roster, grades every Slovenian prospect, and emits a plain-language report.

**Architecture:** Pure logic lives in `v2/src/lib/archetypes/derive/` (colocated vitest tests, no DB); one orchestrating script `v2/scripts/training/derive-archetypes.mts` does DB fetches (read-only) + report emission to `docs/research/market-archetypes/REPORT.md`. Clustering is hand-rolled (Ward + seeded k-means + silhouette + bootstrap Jaccard) — no new dependencies. Plans reuse the existing engine (`optimizePlan`, `project`, `planToWeeks`) and evaluator (`evaluateArchetype`).

**Tech Stack:** TypeScript, tsx (.mts scripts), Drizzle/Neon (`db.execute(sql\`...\`)` raw SQL), vitest, existing `v2/src/lib/training/` + `v2/src/lib/archetypes/` modules. One Python one-off (Greek xlsx parser, checked in for provenance).

**Spec:** `docs/superpowers/specs/2026-08-04-market-archetypes-design.md` — read it first.

## Global Constraints

- Season pin: cohort queries use `snapshots.season = 72 AND snapshots.age = 21` (age-20 sheet: `age = 20`) — NEVER derived age. `SEASON = 72` is a top-of-file constant.
- DB access is SELECT-only. No INSERT/UPDATE/DELETE/DDL anywhere in this plan.
- No new npm dependencies. Hand-roll math (precedent: `src/lib/training/refit.ts`).
- TSP = 10 rate skills only (never stamina/free throw). `SKILL_KEYS` order: `['js','jr','od','ha','dr','pa','is','id','rb','sb']`.
- Displayed→internal sublevel = `displayed − 0.5` (floor 0.5); internal→displayed = `ceil`, clamp 1..20 (`displayed()` in engine.ts:36).
- Never use `players.best_position` for grouping/labels (confirmed unreliable).
- Deterministic: seeded RNG only (`SEED = 72`), no `Math.random()` in lib code.
- Scripts touching the DB: `import { config } from 'dotenv'; config({ path: '.env.local' });` FIRST, then `await import(...)` for anything touching `src/db` (static imports hoist above config — repo convention, see `scripts/training/census-hypothesis-tests.mts:22-23`).
- Report tone: plain-language executive summary first; jargon confined to a methods appendix (owner request).
- `docs/research/` is at the REPO ROOT. Scripts resolve it via `path.resolve(process.cwd(), '..', 'docs', 'research', 'market-archetypes')` (run from `v2/`).
- Tests colocated `*.test.ts`, explicit `import { describe, it, expect } from 'vitest'`, run with `npm test` (vitest stubs `DATABASE_URL`).
- Commit after every task; messages follow repo style (`feat(v2): ...`, `docs: ...`, `test(v2): ...`).
- Tunable analysis constants live in ONE block at the top of the script: `SEASON=72, AGE_REF=21, WINDOW_START='2026-07-10', DELTA=1.0, POT_FLOOR={outside:7, wing:7, inside:8}, ELITE_TSP=100, ELITE_TOP_SHARE=0.30, K_RANGE={outside:[2,5], wing:[2,5], inside:[2,4]}, SIL_MIN=0.22, JACCARD_MIN=0.6, MIN_ELITE_FOR_P25=5, SEED=72, PG_FEEDER_SUM=32, CLOSURE_PER_WEEK=0.35`.

---

### Task 1: Check in the Greek benchmark dataset

**Files:**
- Create: `docs/research/market-archetypes/greece-s72/skillsets-gameshapes-s72.xlsx` (copy of `C:\Users\Rn5ho\Downloads\Copy of SKILLSETS GAMESHAPES S72.xlsx`)
- Create: `docs/research/market-archetypes/greece-s72/parse_greek.py`
- Create: `docs/research/market-archetypes/greece-s72/greek_tidy.csv`, `greek_deltas.csv`, `greek_summary.csv`, `greek_meta.json` (generated)
- Create: `docs/research/market-archetypes/greece-s72/README.md`

**Interfaces:**
- Produces: `greek_tidy.csv` with columns `player,week,position,JS,JR,OD,HA,DR,PA,IS,ID,RB,SB,ST,FT,EXP,GS,TSP10,OSP,ISP` (17 players × weeks 6–14, 149 rows; position PG/SG/SF/PF/C from week 10, blank before). Task 8 reads this file.

- [ ] **Step 1: Create the directory and copy the workbook**

```powershell
New-Item -ItemType Directory -Force C:\ClaudeProjects\BB-project\docs\research\market-archetypes\greece-s72
Copy-Item "C:\Users\Rn5ho\Downloads\Copy of SKILLSETS GAMESHAPES S72.xlsx" C:\ClaudeProjects\BB-project\docs\research\market-archetypes\greece-s72\skillsets-gameshapes-s72.xlsx
```

- [ ] **Step 2: Write the parser** (`parse_greek.py`; needs `pip install pandas openpyxl` — already present on the owner's machine)

```python
# Parses the Greek U-21 coach's weekly skill workbook (S72 weeks 6-14) into tidy CSVs.
# Greek headers map, in column order: JS JR OD HA DR PA IS ID RB SB ST FT EXP GS
# Usage: python parse_greek.py   (run from this directory)
import pandas as pd
import json, re, os

PATH = 'skillsets-gameshapes-s72.xlsx'
OUT = '.'
SKILL_COLS = ['JS','JR','OD','HA','DR','PA','IS','ID','RB','SB','ST','FT','EXP','GS']
POS_MAP = {'ΣΦ':'SF','ΠΦ':'PF','PG':'PG','SG':'SG','C':'C','SF':'SF','PF':'PF'}

xl = pd.ExcelFile(PATH)
rows, meta = [], {'ent': {}, 'notes': [], 'minutes': {}}
for name in xl.sheet_names:
    week = int(re.search(r'\d+', name).group())
    df = xl.parse(name, header=None)
    hdr = next(i for i in range(4) if (df.iloc[i] == 'ΣμΑ').any())
    hdr_vals = list(df.iloc[hdr])
    js_col = hdr_vals.index('ΣμΑ')
    has_pos = 'ΘΕΣΗ' in hdr_vals
    minutes_col = hdr_vals.index('ΛΕΠΤΑ') if 'ΛΕΠΤΑ' in hdr_vals else None
    for i in range(hdr + 1, len(df)):
        pname = df.iat[i, 0]
        if not isinstance(pname, str) or not pname.strip():
            continue
        if pname.strip().upper().startswith('ENT'):
            meta['ent'][week] = {'label': pname.strip(),
                                 'values': [str(v) for v in df.iloc[i, 1:4] if pd.notna(v)]}
            continue
        rec = {'player': pname.strip(), 'week': week,
               'position': POS_MAP.get(str(df.iat[i, js_col - 1]).strip()) if has_pos else None}
        for k, v in zip(SKILL_COLS, df.iloc[i, js_col:js_col + 14]):
            rec[k] = int(v) if pd.notna(v) and str(v).strip() != '' else None
        if minutes_col is not None and pd.notna(df.iat[i, minutes_col]):
            try: meta['minutes'].setdefault(week, {})[rec['player']] = int(df.iat[i, minutes_col])
            except Exception: pass
        for v in df.iloc[i, js_col + 14:]:
            if isinstance(v, str) and v.strip() and not re.match(r'^\d', v.strip()):
                meta['notes'].append({'week': week, 'player': rec['player'], 'note': v.strip()})
        rows.append(rec)

tidy = pd.DataFrame(rows)
tidy['TSP10'] = tidy[['JS','JR','OD','HA','DR','PA','IS','ID','RB','SB']].sum(axis=1)
tidy['OSP'] = tidy[['JS','JR','OD','HA','DR','PA']].sum(axis=1)
tidy['ISP'] = tidy[['IS','ID','RB','SB']].sum(axis=1)
tidy = tidy.sort_values(['player','week'])
tidy.to_csv(f'{OUT}/greek_tidy.csv', index=False)

deltas = []
for p, g in tidy.groupby('player'):
    g = g.sort_values('week'); prev = None
    for _, r in g.iterrows():
        if prev is not None:
            for k in SKILL_COLS[:12]:
                if pd.notna(r[k]) and pd.notna(prev[k]) and r[k] != prev[k]:
                    deltas.append({'player': p, 'skill': k, 'from_week': int(prev['week']),
                                   'to_week': int(r['week']), 'delta': int(r[k] - prev[k])})
        prev = r
pd.DataFrame(deltas).sort_values(['player','to_week']).to_csv(f'{OUT}/greek_deltas.csv', index=False)

summ = []
for p, g in tidy.groupby('player'):
    g = g.sort_values('week'); f, l = g.iloc[0], g.iloc[-1]
    pos = g['position'].dropna().iloc[-1] if g['position'].notna().any() else None
    s = {'player': p, 'position': pos, 'first_week': int(f['week']), 'last_week': int(l['week']),
         'weeks_observed': len(g), 'TSP10_first': int(f['TSP10']), 'TSP10_last': int(l['TSP10']),
         'TSP10_gain': int(l['TSP10'] - f['TSP10']), 'OSP_last': int(l['OSP']), 'ISP_last': int(l['ISP']),
         'GS_min': int(g['GS'].min()), 'GS_max': int(g['GS'].max()), 'GS_mean': round(g['GS'].mean(), 2)}
    for k in SKILL_COLS[:12]:
        s[f'{k}_first'], s[f'{k}_last'] = int(f[k]), int(l[k])
        s[f'{k}_gain'] = int(l[k] - f[k])
    summ.append(s)
pd.DataFrame(summ).sort_values('TSP10_last', ascending=False).to_csv(f'{OUT}/greek_summary.csv', index=False)
with open(f'{OUT}/greek_meta.json', 'w', encoding='utf-8') as fh:
    json.dump(meta, fh, ensure_ascii=False, indent=1)
print('players:', tidy.player.nunique(), 'rows:', len(tidy), 'pop events:', len(deltas))
```

- [ ] **Step 3: Run it and verify counts**

Run (from `docs/research/market-archetypes/greece-s72/`): `python parse_greek.py`
Expected output: `players: 17 rows: 149 pop events: 103`

- [ ] **Step 4: Write `README.md`**

```markdown
# Greece U-21 — S72 weekly skills + game shapes

Source: workbook shared by the Greek U-21 NT coach (2026-08-04), weeks 6–14 of season 72
(the competitive back half of the U-21 Euro; Greece took bronze and qualified for Worlds).
`skillsets-gameshapes-s72.xlsx` is the original; CSVs are generated by `parse_greek.py`.

Files: `greek_tidy.csv` (player-week rows; columns player,week,position,JS..GS,TSP10,OSP,ISP),
`greek_deltas.csv` (week-over-week skill changes = observed pops), `greek_summary.csv`
(per-player first/last/gain), `greek_meta.json` (team enthusiasm by week, wk7 NT minutes, notes).

Known caveats (carry into any analysis): coach-recorded displayed levels — two SB values of 21
exceed BB's display cap (coach estimates); wk14 has only 3 pops (censored capture, not a training
stop); positions are coach labels present from wk10; no ages/heights/potentials in the workbook
(14/17 players were matched in the Neon DB — all age 21, season 72; 9 appeared in the season-end
market flood with skill lines identical to the wk14 records, validating both datasets).

Role in the analysis: EXTERNAL BENCHMARK, not ceiling — thresholds always derive from the
market cohort; Greece validates shapes, floors, and in-season training timing (see spec §2).
```

- [ ] **Step 5: Commit**

```bash
git add docs/research/market-archetypes/greece-s72
git commit -m "docs: check in Greek U-21 S72 benchmark dataset + parser"
```

---

### Task 2: Cohort types + group assignment (`groups.ts`)

**Files:**
- Create: `v2/src/lib/archetypes/derive/groups.ts`
- Test: `v2/src/lib/archetypes/derive/groups.test.ts`

**Interfaces:**
- Consumes: `SkillKey`, `SKILL_KEYS` from `../../training/types`.
- Produces (later tasks import all of these from `./groups`):
  - `interface CohortPlayer { playerId: number; name: string; heightCm: number; potential: number; salary: number | null; startingPrice: number | null; ownerTeamName: string | null; nationality: string | null; skills: Record<SkillKey, number>; stamina: number | null; freeThrow: number | null; tsp: number }` (skills are DISPLAYED ints 1..20)
  - `type Group = 'outside' | 'inside' | 'wing' | 'appendix'`
  - `osp(skills): number`, `isp(skills): number`, `balance(skills): number`, `assignGroup(p: CohortPlayer, delta?: number): Group`

- [ ] **Step 1: Write the failing test**

```ts
// v2/src/lib/archetypes/derive/groups.test.ts
import { describe, it, expect } from 'vitest';
import { balance, assignGroup, osp, isp, type CohortPlayer } from './groups';

function player(over: Partial<CohortPlayer> & { skills: CohortPlayer['skills'] }): CohortPlayer {
  return { playerId: 1, name: 'T', heightCm: 190, potential: 8, salary: null, startingPrice: null,
    ownerTeamName: null, nationality: null, stamina: null, freeThrow: null,
    tsp: Object.values(over.skills).reduce((a, b) => a + b, 0), ...over };
}
const GUARD = { js: 16, jr: 11, od: 15, ha: 16, dr: 17, pa: 8, is: 11, id: 7, rb: 5, sb: 4 };
const BIG = { js: 9, jr: 6, od: 7, ha: 10, dr: 9, pa: 6, is: 19, id: 17, rb: 14, sb: 14 };
const FLAT = { js: 10, jr: 10, od: 10, ha: 10, dr: 10, pa: 10, is: 10, id: 10, rb: 10, sb: 10 };

describe('balance', () => {
  it('is OSP/6 minus ISP/4 (per-skill means, not raw sums)', () => {
    expect(osp(GUARD)).toBe(83); expect(isp(GUARD)).toBe(27);
    expect(balance(GUARD)).toBeCloseTo(83 / 6 - 27 / 4, 10);
  });
  it('is zero for a flat player (the 6:4 sum bias is corrected)', () => {
    expect(balance(FLAT)).toBeCloseTo(0, 10);
  });
});

describe('assignGroup', () => {
  it('short outside-leaning -> outside', () => {
    expect(assignGroup(player({ skills: GUARD, heightCm: 190 }))).toBe('outside');
  });
  it('tall inside-leaning -> inside', () => {
    expect(assignGroup(player({ skills: BIG, heightCm: 213 }))).toBe('inside');
  });
  it('tall outside-leaning wing -> wing (not discarded)', () => {
    expect(assignGroup(player({ skills: GUARD, heightCm: 205 }))).toBe('wing');
  });
  it('202cm sits in wing regardless of lean', () => {
    expect(assignGroup(player({ skills: BIG, heightCm: 202 }))).toBe('wing');
  });
  it('flat player inside the deadband -> wing', () => {
    expect(assignGroup(player({ skills: FLAT, heightCm: 190 }))).toBe('wing');
  });
  it('short inside-leaning -> appendix', () => {
    expect(assignGroup(player({ skills: BIG, heightCm: 198 }))).toBe('appendix');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `cd v2; npx vitest run src/lib/archetypes/derive/groups.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement `groups.ts`**

```ts
// Cohort grouping for the market-archetypes analysis (spec §3).
import type { SkillKey } from '../../training/types';

export interface CohortPlayer {
  playerId: number; name: string; heightCm: number; potential: number;
  salary: number | null; startingPrice: number | null;
  ownerTeamName: string | null; nationality: string | null;
  skills: Record<SkillKey, number>; // displayed ints 1..20
  stamina: number | null; freeThrow: number | null;
  tsp: number; // 10-skill sum
}

export type Group = 'outside' | 'inside' | 'wing' | 'appendix';

const OSP_KEYS: SkillKey[] = ['js', 'jr', 'od', 'ha', 'dr', 'pa'];
const ISP_KEYS: SkillKey[] = ['is', 'id', 'rb', 'sb'];

export function osp(s: Record<SkillKey, number>): number {
  return OSP_KEYS.reduce((a, k) => a + s[k], 0);
}
export function isp(s: Record<SkillKey, number>): number {
  return ISP_KEYS.reduce((a, k) => a + s[k], 0);
}
/** b = mean(outside skills) − mean(inside skills); raw OSP>ISP is 6:4 biased. */
export function balance(s: Record<SkillKey, number>): number {
  return osp(s) / 6 - isp(s) / 4;
}

export function assignGroup(p: CohortPlayer, delta = 1.0): Group {
  const b = balance(p.skills);
  if (b >= delta && p.heightCm <= 201) return 'outside';
  if (b <= -delta && p.heightCm >= 203) return 'inside';
  if (b <= -delta && p.heightCm <= 201) return 'appendix'; // short inside-leaning (rare)
  return 'wing';
}
```

- [ ] **Step 4: Run to verify pass** — `npx vitest run src/lib/archetypes/derive/groups.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add v2/src/lib/archetypes/derive; git commit -m "feat(v2): cohort types + balance-score group assignment for archetype derivation"`

---

### Task 3: Quantiles + small stats (`stats.ts`)

**Files:**
- Create: `v2/src/lib/archetypes/derive/stats.ts`
- Test: `v2/src/lib/archetypes/derive/stats.test.ts`

**Interfaces:**
- Produces: `quantile(xs: number[], q: number): number` (linear interpolation, R type-7; empty array throws), `mean(xs): number`, `median(xs): number`, `histogram(xs: number[]): Record<number, number>`.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { quantile, mean, median, histogram } from './stats';

describe('quantile', () => {
  it('interpolates linearly (type 7)', () => {
    expect(quantile([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75, 10);
    expect(quantile([1, 2, 3, 4], 0.5)).toBeCloseTo(2.5, 10);
    expect(quantile([3, 1, 4, 2], 1)).toBe(4); // sorts internally
  });
  it('throws on empty input', () => { expect(() => quantile([], 0.5)).toThrow(); });
});
describe('helpers', () => {
  it('mean/median/histogram', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 100])).toBeCloseTo(2.5, 10);
    expect(histogram([8, 9, 9, 10])).toEqual({ 8: 1, 9: 2, 10: 1 });
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) throw new Error('quantile of empty array');
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export function mean(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / xs.length; }
export function median(xs: number[]): number { return quantile(xs, 0.5); }
export function histogram(xs: number[]): Record<number, number> {
  const h: Record<number, number> = {};
  for (const x of xs) h[x] = (h[x] ?? 0) + 1;
  return h;
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(v2): quantile/stat helpers for archetype derivation"` (after `git add`).

---

### Task 4: Shape space + Ward clustering (`cluster.ts` part 1)

**Files:**
- Create: `v2/src/lib/archetypes/derive/cluster.ts`
- Test: `v2/src/lib/archetypes/derive/cluster.test.ts`

**Interfaces:**
- Consumes: `SKILL_KEYS`, `SkillKey` from `../../training/types`.
- Produces: `mulberry32(seed: number): () => number` (deterministic PRNG in [0,1)), `shapeVector(skills: Record<SkillKey, number>): number[]` (10 numbers, each minus the player's own 10-skill mean), `euclid(a: number[], b: number[]): number`, `wardCluster(vectors: number[][], k: number): number[]` (labels `0..k-1`, deterministic).

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { mulberry32, shapeVector, euclid, wardCluster } from './cluster';

// Two synthetic build families in shape space: shooters (high js/jr) and bigs (high is/id).
function shooter(rng: () => number) {
  return [5, 4, 1, 2, 2, 0, -4, -4, -3, -3].map((v) => v + (rng() - 0.5));
}
function big(rng: () => number) {
  return [-4, -4, -2, -2, -3, -1, 5, 5, 3, 3].map((v) => v + (rng() - 0.5));
}

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(72), b = mulberry32(72);
    expect(a()).toBe(b()); expect(a()).toBe(b());
  });
});

describe('shapeVector', () => {
  it('centers on the player own mean (removes the quality axis)', () => {
    const v = shapeVector({ js: 12, jr: 12, od: 12, ha: 12, dr: 12, pa: 12, is: 12, id: 12, rb: 12, sb: 12 });
    expect(v.every((x) => Math.abs(x) < 1e-9)).toBe(true);
    const w = shapeVector({ js: 20, jr: 20, od: 20, ha: 20, dr: 20, pa: 20, is: 20, id: 20, rb: 20, sb: 20 });
    expect(w).toEqual(v.map(() => 0)); // identical shape at different quality
  });
});

describe('wardCluster', () => {
  it('separates two synthetic families exactly', () => {
    const rng = mulberry32(1);
    const pts = [...Array.from({ length: 20 }, () => shooter(rng)), ...Array.from({ length: 20 }, () => big(rng))];
    const labels = wardCluster(pts, 2);
    const first = new Set(labels.slice(0, 20)), second = new Set(labels.slice(20));
    expect(first.size).toBe(1); expect(second.size).toBe(1);
    expect([...first][0]).not.toBe([...second][0]);
  });
  it('euclid is the plain L2 distance', () => {
    expect(euclid([0, 0], [3, 4])).toBe(5);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement (Lance-Williams Ward, O(n³) — fine for n ≤ 600)**

```ts
// Shape-space clustering utilities (spec §4). Deterministic; no Math.random.
import { SKILL_KEYS, type SkillKey } from '../../training/types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shapeVector(skills: Record<SkillKey, number>): number[] {
  const vals = SKILL_KEYS.map((k) => skills[k]);
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.map((v) => v - m);
}

export function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Agglomerative Ward: merge the pair minimizing (|A||B|/(|A|+|B|))·||cA−cB||², cut at k. */
export function wardCluster(vectors: number[][], k: number): number[] {
  const n = vectors.length;
  if (k >= n) return vectors.map((_, i) => i);
  interface C { idx: number[]; centroid: number[] }
  const clusters: C[] = vectors.map((v, i) => ({ idx: [i], centroid: [...v] }));
  const wardD = (a: C, b: C) => {
    const na = a.idx.length, nb = b.idx.length;
    return ((na * nb) / (na + nb)) * euclid(a.centroid, b.centroid) ** 2;
  };
  while (clusters.length > k) {
    let bi = 0, bj = 1, best = Infinity;
    for (let i = 0; i < clusters.length; i++)
      for (let j = i + 1; j < clusters.length; j++) {
        const d = wardD(clusters[i], clusters[j]);
        if (d < best) { best = d; bi = i; bj = j; }
      }
    const [a, b] = [clusters[bi], clusters[bj]];
    const idx = [...a.idx, ...b.idx];
    const centroid = a.centroid.map(
      (v, d) => (v * a.idx.length + b.centroid[d] * b.idx.length) / idx.length,
    );
    clusters.splice(bj, 1); clusters.splice(bi, 1);
    clusters.push({ idx, centroid });
  }
  const labels = new Array<number>(n);
  clusters.forEach((c, ci) => c.idx.forEach((i) => (labels[i] = ci)));
  return labels;
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat(v2): shape vectors + seeded RNG + Ward clustering"`.

---

### Task 5: k selection, k-means cross-check, stability (`cluster.ts` part 2)

**Files:**
- Modify: `v2/src/lib/archetypes/derive/cluster.ts`
- Test: `v2/src/lib/archetypes/derive/cluster.test.ts` (append)

**Interfaces:**
- Produces: `silhouette(vectors: number[][], labels: number[]): number` (mean silhouette; single-cluster labelings return −1), `chooseK(vectors: number[][], kMin: number, kMax: number): { k: number; scores: Record<number, number> }` (Ward labels per k, best mean silhouette), `kmeans(vectors: number[][], k: number, seed: number, restarts?: number): { labels: number[]; inertia: number }` (k-means++ init, default 50 restarts), `agreement(a: number[], b: number[]): number` (adjusted-Rand-free pairwise agreement in [0,1]), `bootstrapJaccard(vectors: number[][], k: number, rounds: number, seed: number): number[]` (per-original-cluster mean best-match Jaccard over bootstrap reclusterings).

- [ ] **Step 1: Append failing tests**

```ts
import { silhouette, chooseK, kmeans, bootstrapJaccard, agreement } from './cluster';

describe('silhouette + chooseK', () => {
  it('prefers k=2 on two clean families', () => {
    const rng = mulberry32(2);
    const pts = [...Array.from({ length: 25 }, () => shooter(rng)), ...Array.from({ length: 25 }, () => big(rng))];
    const { k, scores } = chooseK(pts, 2, 5);
    expect(k).toBe(2);
    expect(scores[2]).toBeGreaterThan(0.5);
  });
  it('scores structureless noise below the SIL_MIN escape threshold', () => {
    const rng = mulberry32(3);
    const pts = Array.from({ length: 40 }, () => Array.from({ length: 10 }, () => rng() * 4 - 2));
    const { scores } = chooseK(pts, 2, 5);
    expect(Math.max(...Object.values(scores))).toBeLessThan(0.22);
  });
});

describe('kmeans + stability', () => {
  it('kmeans agrees with ward on clean families', () => {
    const rng = mulberry32(4);
    const pts = [...Array.from({ length: 20 }, () => shooter(rng)), ...Array.from({ length: 20 }, () => big(rng))];
    const w = wardCluster(pts, 2);
    const km = kmeans(pts, 2, 72).labels;
    expect(agreement(w, km)).toBeGreaterThan(0.95);
  });
  it('bootstrap Jaccard is high for real clusters', () => {
    const rng = mulberry32(5);
    const pts = [...Array.from({ length: 20 }, () => shooter(rng)), ...Array.from({ length: 20 }, () => big(rng))];
    const j = bootstrapJaccard(pts, 2, 50, 72);
    expect(Math.min(...j)).toBeGreaterThan(0.7);
  });
});
```

- [ ] **Step 2: Run → FAIL** (new exports missing).

- [ ] **Step 3: Implement (append to cluster.ts)**

```ts
export function silhouette(vectors: number[][], labels: number[]): number {
  const k = new Set(labels).size;
  if (k < 2) return -1;
  const n = vectors.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const byCluster = new Map<number, number[]>();
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const arr = byCluster.get(labels[j]) ?? [];
      arr.push(euclid(vectors[i], vectors[j]));
      byCluster.set(labels[j], arr);
    }
    const own = byCluster.get(labels[i]);
    if (!own || own.length === 0) continue; // singleton contributes 0
    const a = own.reduce((x, y) => x + y, 0) / own.length;
    let b = Infinity;
    for (const [lab, ds] of byCluster) {
      if (lab === labels[i]) continue;
      b = Math.min(b, ds.reduce((x, y) => x + y, 0) / ds.length);
    }
    total += (b - a) / Math.max(a, b);
  }
  return total / n;
}

export function chooseK(vectors: number[][], kMin: number, kMax: number)
  : { k: number; scores: Record<number, number> } {
  const scores: Record<number, number> = {};
  let bestK = kMin, best = -Infinity;
  for (let k = kMin; k <= Math.min(kMax, vectors.length - 1); k++) {
    const s = silhouette(vectors, wardCluster(vectors, k));
    scores[k] = s;
    if (s > best) { best = s; bestK = k; }
  }
  return { k: bestK, scores };
}

export function kmeans(vectors: number[][], k: number, seed: number, restarts = 50)
  : { labels: number[]; inertia: number } {
  const n = vectors.length;
  let bestLabels: number[] = [], bestInertia = Infinity;
  const rng = mulberry32(seed);
  for (let r = 0; r < restarts; r++) {
    // k-means++ init
    const centers: number[][] = [vectors[Math.floor(rng() * n)]];
    while (centers.length < k) {
      const d2 = vectors.map((v) => Math.min(...centers.map((c) => euclid(v, c) ** 2)));
      const sum = d2.reduce((a, b) => a + b, 0);
      let pick = rng() * sum, idx = 0;
      while (pick > d2[idx]) { pick -= d2[idx]; idx++; }
      centers.push(vectors[idx]);
    }
    let labels = new Array<number>(n).fill(0);
    for (let iter = 0; iter < 100; iter++) {
      const next = vectors.map((v) => {
        let bi = 0, bd = Infinity;
        centers.forEach((c, ci) => { const d = euclid(v, c); if (d < bd) { bd = d; bi = ci; } });
        return bi;
      });
      if (next.every((l, i) => l === labels[i]) && iter > 0) break;
      labels = next;
      for (let ci = 0; ci < k; ci++) {
        const members = vectors.filter((_, i) => labels[i] === ci);
        if (members.length === 0) continue;
        centers[ci] = members[0].map((_, d) => mean(members.map((m) => m[d])));
      }
    }
    const inertia = vectors.reduce((a, v, i) => a + euclid(v, centers[labels[i]]) ** 2, 0);
    if (inertia < bestInertia) { bestInertia = inertia; bestLabels = labels; }
  }
  return { labels: bestLabels, inertia: bestInertia };
  function mean(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / xs.length; }
}

/** Pairwise-agreement between two labelings: share of point-pairs classified consistently. */
export function agreement(a: number[], b: number[]): number {
  let same = 0, total = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) {
      total++;
      if ((a[i] === a[j]) === (b[i] === b[j])) same++;
    }
  return total === 0 ? 1 : same / total;
}

export function bootstrapJaccard(vectors: number[][], k: number, rounds: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const base = wardCluster(vectors, k);
  const baseSets = Array.from({ length: k }, (_, c) =>
    new Set(base.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0)));
  const sums = new Array<number>(k).fill(0);
  for (let r = 0; r < rounds; r++) {
    const idx = Array.from({ length: vectors.length }, () => Math.floor(rng() * vectors.length));
    const lab = wardCluster(idx.map((i) => vectors[i]), k);
    const bootSets = Array.from({ length: k }, (_, c) =>
      new Set(idx.filter((_, p) => lab[p] === c)));
    baseSets.forEach((bs, c) => {
      let best = 0;
      for (const os of bootSets) {
        const inter = [...bs].filter((i) => os.has(i)).length;
        const uni = new Set([...bs, ...os]).size;
        if (uni > 0) best = Math.max(best, inter / uni);
      }
      sums[c] += best;
    });
  }
  return sums.map((s) => s / rounds);
}
```

- [ ] **Step 4: Run full derive tests** — `npx vitest run src/lib/archetypes/derive` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(v2): silhouette k-selection, seeded kmeans cross-check, bootstrap stability"`.

---

### Task 6: Rule derivation with gates (`rules.ts`)

**Files:**
- Create: `v2/src/lib/archetypes/derive/rules.ts`
- Test: `v2/src/lib/archetypes/derive/rules.test.ts`

**Interfaces:**
- Consumes: `CohortPlayer`, `Group` from `./groups`; `quantile` from `./stats`; `evaluateArchetype` + types from `../evaluate` / `../types`; `SKILL_DB_NAMES`, `SKILL_KEYS` from `../../training/types`.
- Produces:
  - `interface ClusterProfile { group: Group; index: number; members: CohortPlayer[]; centroid: Record<SkillKey, number> }` (centroid = mean DISPLAYED skills)
  - `interface DefenseFloor { field: 'outside_def' | 'inside_def'; skill: 'od' | 'id'; min: number }`
  - `defenseFloorFor(group: Group, centroid: Record<SkillKey, number>, pgFeederSum?: number): DefenseFloor` — inside → `{id, 16}`; outside → `{od, 14}` when `centroid.ha + centroid.dr >= pgFeederSum (32)` else `{od, 15}`; wing → `{od, 14}` when `centroid.od >= centroid.id` else `{id, 16}`.
  - `eliteMembers(members: CohortPlayer[], floor: DefenseFloor, eliteTsp?: number, topShare?: number): CohortPlayer[]` — floor-passing members with `tsp >= 100`, widened to floor-passing top-30%-by-TSP when that yields more players.
  - `deriveArchetype(cluster: ClusterProfile, groupEliteMean: Record<SkillKey, number>, opts?): DerivedArchetype` where `interface DerivedArchetype { archetype: DefaultArchetype; definers: SkillKey[]; eliteN: number; provisional: boolean; selfMatchRate: number; relaxed: SkillKey[] }`
  - `selfMatchRate(members: CohortPlayer[], archetype: DefaultArchetype): number`
  - `toEvalPlayer(p: CohortPlayer): EvalPlayer` (ageNow 21, snake_case skills incl. stamina/free_throw)
- Key semantics (spec §6): definers = up to 5 skills where `centroid[k] − groupEliteMean[k] >= 1.5`; conditions = definers' `>=` p25 thresholds + defense floor + `potential >=` group floor + `height_cm` band (`>= min(members)` only, at the 21 tier) — NO position conditions, NO stamina/free_throw conditions, byAge tier 21 only (younger tiers arrive in Task 9). Self-match gate: relax the worst-failing definer p25→p10, one at a time, until rate ≥ 0.7.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { defenseFloorFor, eliteMembers, deriveArchetype, toEvalPlayer } from './rules';
import type { CohortPlayer } from './groups';
import { evaluateArchetype } from '../evaluate';
import type { SkillKey } from '../../training/types';

function member(skills: Record<SkillKey, number>, over: Partial<CohortPlayer> = {}): CohortPlayer {
  return { playerId: 1, name: 'M', heightCm: 190, potential: 9, salary: null, startingPrice: null,
    ownerTeamName: null, nationality: null, stamina: 5, freeThrow: 8,
    skills, tsp: Object.values(skills).reduce((a, b) => a + b, 0), ...over };
}
const SHOOTER: Record<SkillKey, number> = { js: 17, jr: 12, od: 15, ha: 14, dr: 15, pa: 8, is: 10, id: 6, rb: 5, sb: 4 };
const GROUP_MEAN: Record<SkillKey, number> = { js: 14, jr: 9, od: 15, ha: 14, dr: 15, pa: 8, is: 10, id: 7, rb: 6, sb: 5 };

describe('defenseFloorFor', () => {
  it('inside gets ID>=16', () => {
    expect(defenseFloorFor('inside', GROUP_MEAN)).toEqual({ field: 'inside_def', skill: 'id', min: 16 });
  });
  it('outside PG-shaped (high HA+DR) gets OD>=14, otherwise 15', () => {
    expect(defenseFloorFor('outside', { ...GROUP_MEAN, ha: 17, dr: 18 }).min).toBe(14);
    expect(defenseFloorFor('outside', { ...GROUP_MEAN, ha: 13, dr: 14 }).min).toBe(15);
  });
  it('wing floors on the defense skill its members carry', () => {
    expect(defenseFloorFor('wing', { ...GROUP_MEAN, od: 15, id: 8 }).skill).toBe('od');
    expect(defenseFloorFor('wing', { ...GROUP_MEAN, od: 7, id: 16 }).skill).toBe('id');
  });
});

describe('deriveArchetype', () => {
  const members = Array.from({ length: 12 }, (_, i) =>
    member({ ...SHOOTER, js: 16 + (i % 3), jr: 11 + (i % 2) }));
  it('emits lean rules that its own members pass (self-match gate)', () => {
    const d = deriveArchetype(
      { group: 'outside', index: 0, members, centroid: SHOOTER }, GROUP_MEAN);
    expect(d.archetype.key).toBe('mkt72-outside-1');
    expect(d.definers.length).toBeLessThanOrEqual(5);
    expect(d.definers).toContain('js'); // 17 vs group mean 14 -> definer
    expect(d.definers).not.toContain('od'); // floor skill is not a definer here (15 vs 15)
    expect(d.selfMatchRate).toBeGreaterThanOrEqual(0.7);
    const conds = d.archetype.rules.conditions;
    expect(conds.some((c) => c.kind === 'field' && c.field === 'outside_def')).toBe(true);
    expect(conds.every((c) => c.kind !== 'position')).toBe(true);
    expect(conds.every((c) => c.kind === 'field' && c.field !== 'stamina' && c.field !== 'free_throw')).toBe(true);
  });
  it('toEvalPlayer produces an evaluator-compatible age-21 player', () => {
    const p = toEvalPlayer(member(SHOOTER));
    expect(p.ageNow).toBe(21);
    expect(p.skills?.jump_shot).toBe(17);
    const d = deriveArchetype({ group: 'outside', index: 0, members, centroid: SHOOTER }, GROUP_MEAN);
    const r = evaluateArchetype(toEvalPlayer(members[5]), {
      id: d.archetype.key, key: d.archetype.key, dbId: null, name: d.archetype.name,
      rules: d.archetype.rules, source: 'default',
    });
    expect(r.ageTierUsed).toBe(21);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `rules.ts`**

```ts
// Cluster -> lean archetype rules with self-match gating (spec §6).
import type { DefaultArchetype, EvalPlayer, SkillCondition } from '../types';
import { evaluateArchetype } from '../evaluate';
import { SKILL_KEYS, SKILL_DB_NAMES, type SkillKey } from '../../training/types';
import { quantile } from './stats';
import type { CohortPlayer, Group } from './groups';

export interface ClusterProfile {
  group: Group; index: number;
  members: CohortPlayer[];
  centroid: Record<SkillKey, number>;
}
export interface DefenseFloor { field: 'outside_def' | 'inside_def'; skill: 'od' | 'id'; min: number }
export interface DerivedArchetype {
  archetype: DefaultArchetype;
  definers: SkillKey[];
  eliteN: number;
  provisional: boolean;
  selfMatchRate: number;
  relaxed: SkillKey[];
}

const GROUP_POT_FLOOR: Record<Group, number> = { outside: 7, wing: 7, inside: 8, appendix: 7 };

export function defenseFloorFor(
  group: Group, centroid: Record<SkillKey, number>, pgFeederSum = 32,
): DefenseFloor {
  if (group === 'inside') return { field: 'inside_def', skill: 'id', min: 16 };
  if (group === 'outside') {
    const pgShaped = centroid.ha + centroid.dr >= pgFeederSum;
    return { field: 'outside_def', skill: 'od', min: pgShaped ? 14 : 15 };
  }
  // wing: floor on whichever defense the cluster actually carries
  return centroid.od >= centroid.id
    ? { field: 'outside_def', skill: 'od', min: 14 }
    : { field: 'inside_def', skill: 'id', min: 16 };
}

export function eliteMembers(
  members: CohortPlayer[], floor: DefenseFloor, eliteTsp = 100, topShare = 0.3,
): CohortPlayer[] {
  const pass = members.filter((m) => m.skills[floor.skill] >= floor.min);
  const byTsp = pass.filter((m) => m.tsp >= eliteTsp);
  const top = [...pass].sort((a, b) => b.tsp - a.tsp).slice(0, Math.ceil(pass.length * topShare));
  return byTsp.length >= top.length ? byTsp : top;
}

export function toEvalPlayer(p: CohortPlayer): EvalPlayer {
  const skills: Record<string, number | null> = {};
  for (const k of SKILL_KEYS) skills[SKILL_DB_NAMES[k]] = p.skills[k];
  skills.stamina = p.stamina; skills.free_throw = p.freeThrow;
  return { ageNow: 21, skills, potential: p.potential, heightCm: p.heightCm, tsp: p.tsp, bestPosition: null };
}

export function selfMatchRate(members: CohortPlayer[], a: DefaultArchetype): number {
  const eff = { id: a.key, key: a.key, dbId: null, name: a.name, rules: a.rules, source: 'default' as const };
  const hits = members.filter((m) => evaluateArchetype(toEvalPlayer(m), eff).matches).length;
  return members.length === 0 ? 0 : hits / members.length;
}

export function deriveArchetype(
  cluster: ClusterProfile,
  groupEliteMean: Record<SkillKey, number>,
  opts: { minEliteForP25?: number; selfMatchMin?: number; definerGap?: number; maxDefiners?: number } = {},
): DerivedArchetype {
  const { minEliteForP25 = 5, selfMatchMin = 0.7, definerGap = 1.5, maxDefiners = 5 } = opts;
  const floor = defenseFloorFor(cluster.group, cluster.centroid);
  const elite = eliteMembers(cluster.members, floor);
  const provisional = elite.length < minEliteForP25;
  const source = provisional ? cluster.members : elite;
  const q = provisional ? 0.75 : 0.25; // spec: n<5 elite -> cluster p75 fallback, marked provisional

  const definers = SKILL_KEYS
    .filter((k) => k !== floor.skill && cluster.centroid[k] - groupEliteMean[k] >= definerGap)
    .sort((a, b) => (cluster.centroid[b] - groupEliteMean[b]) - (cluster.centroid[a] - groupEliteMean[a]))
    .slice(0, maxDefiners);

  const level: Partial<Record<SkillKey, number>> = {};
  for (const k of definers) level[k] = Math.round(quantile(source.map((m) => m.skills[k]), q));

  const key = `mkt72-${cluster.group}-${cluster.index + 1}`;
  const build = (): DefaultArchetype => {
    const conditions: SkillCondition[] = [
      ...definers.map((k) => ({
        kind: 'field' as const, field: SKILL_DB_NAMES[k] as SkillCondition['field'],
        op: '>=' as const, byAge: { 21: level[k]! },
      })),
      { kind: 'field', field: floor.field, op: '>=', byAge: { 21: floor.min } },
      { kind: 'field', field: 'potential', op: '>=', byAge: { 21: GROUP_POT_FLOOR[cluster.group] } },
      { kind: 'field', field: 'height_cm', op: '>=', byAge: { 21: Math.min(...cluster.members.map((m) => m.heightCm)) } },
    ];
    return {
      key, name: `Market: ${cluster.group} #${cluster.index + 1}`,
      description: `Derived from S72 market flood (${cluster.members.length} members, ${elite.length} elite).`,
      rules: { conditions },
    };
  };

  const relaxed: SkillKey[] = [];
  let archetype = build();
  let rate = selfMatchRate(cluster.members, archetype);
  // Relax worst-failing definer p25 -> p10, one at a time, until the gate passes.
  while (rate < selfMatchMin && relaxed.length < definers.length) {
    const failCounts = new Map<SkillKey, number>();
    for (const m of cluster.members)
      for (const k of definers)
        if (m.skills[k] < (level[k] ?? 0)) failCounts.set(k, (failCounts.get(k) ?? 0) + 1);
    const worst = [...failCounts.entries()].filter(([k]) => !relaxed.includes(k))
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!worst) break;
    level[worst] = Math.round(quantile(source.map((m) => m.skills[worst]), 0.1));
    relaxed.push(worst);
    archetype = build();
    rate = selfMatchRate(cluster.members, archetype);
  }

  return { archetype, definers, eliteN: elite.length, provisional, selfMatchRate: rate, relaxed };
}
```

- [ ] **Step 4: Run → PASS** (`npx vitest run src/lib/archetypes/derive`).
- [ ] **Step 5: Commit** — `git commit -m "feat(v2): cluster->archetype rule derivation with defense floors and self-match gate"`.

---

### Task 7: Script part 1 — cohort fetch, clustering, report skeleton

**Files:**
- Create: `v2/scripts/training/derive-archetypes.mts`
- Create: `v2/src/lib/archetypes/derive/md.ts` (+ `md.test.ts`)
- Modify: `v2/package.json` (scripts block)

**Interfaces:**
- Consumes: everything from Tasks 2–6; `db` via dynamic import of `../../src/db/index`; `drizzle-orm` `sql`.
- Produces: `md.ts` exports `mdTable(headers: string[], rows: (string | number | null)[][]): string` (pipe table, null → '–') and `fmtSkills(skills: Record<SkillKey, number>): string` (e.g. `JS17 JR11 OD15 …`, SKILL_KEYS order, uppercase keys). The script writes `docs/research/market-archetypes/REPORT.md` and `proposed-defaults.snippet.ts` and prints a one-line JSON summary. Later tasks re-run the same script; sections are assembled in one pass (no file appending).

- [ ] **Step 1: md.ts failing test**

```ts
import { describe, it, expect } from 'vitest';
import { mdTable, fmtSkills } from './md';

describe('mdTable', () => {
  it('renders a pipe table with null as dash', () => {
    expect(mdTable(['a', 'b'], [[1, null]])).toBe('| a | b |\n| --- | --- |\n| 1 | – |');
  });
});
describe('fmtSkills', () => {
  it('renders SKILL_KEYS order', () => {
    expect(fmtSkills({ js: 17, jr: 11, od: 15, ha: 14, dr: 15, pa: 8, is: 10, id: 6, rb: 5, sb: 4 }))
      .toBe('JS17 JR11 OD15 HA14 DR15 PA8 IS10 ID6 RB5 SB4');
  });
});
```

- [ ] **Step 2: Implement `md.ts`**

```ts
import { SKILL_KEYS, type SkillKey } from '../../training/types';

export function mdTable(headers: string[], rows: (string | number | null)[][]): string {
  const h = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map((c) => (c === null ? '–' : String(c))).join(' | ')} |`);
  return [h, sep, ...body].join('\n');
}
export function fmtSkills(skills: Record<SkillKey, number>): string {
  return SKILL_KEYS.map((k) => `${k.toUpperCase()}${skills[k]}`).join(' ');
}
```

Run `npx vitest run src/lib/archetypes/derive/md.test.ts` → PASS.

- [ ] **Step 3: Write the script** (`v2/scripts/training/derive-archetypes.mts`) — Part 1 scope: constants block, cohort SQL, grouping, per-group clustering + overlays, proposed archetypes, report emission. `--plans` recognized but stubbed until Task 10 (`if (PLANS) console.error('--plans lands in a later task'); process.exit(2)` is NOT acceptable — instead the flag simply gates the sections added in Tasks 9–11; until then it prints `plans: not yet implemented` inside the report's Plans section).

```ts
// Derive market archetypes + training plans from the season-end flood (spec:
// docs/superpowers/specs/2026-08-04-market-archetypes-design.md).
// Usage (from v2/): npm run training:archetypes            -- part 1 (cohort/clusters/rules)
//                   npm run training:archetypes -- --plans -- + plans/tiers/Slovenia (Tasks 9-11)
// Read-only: SELECT statements only. Report goes to docs/research/market-archetypes/REPORT.md.
import { config } from 'dotenv';
config({ path: '.env.local' });
import path from 'node:path';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';

// ---- tunables (spec Global Constraints) ----
const SEASON = 72;
const AGE_REF = 21;
const WINDOW_START = '2026-07-10';
const DELTA = 1.0;
const POT_FLOOR = { outside: 7, wing: 7, inside: 8, appendix: 7 } as const;
const K_RANGE = { outside: [2, 5], wing: [2, 5], inside: [2, 4] } as const;
const SIL_MIN = 0.22;
const JACCARD_MIN = 0.6;
const SEED = 72;
const PLANS = process.argv.includes('--plans');

// Dynamic imports AFTER dotenv (repo convention): src/db reads DATABASE_URL at module scope.
const { sql } = await import('drizzle-orm');
const { db } = await import('../../src/db/index');
const { SKILL_KEYS } = await import('../../src/lib/training/types');
const { assignGroup, balance } = await import('../../src/lib/archetypes/derive/groups');
const { quantile, mean, median, histogram } = await import('../../src/lib/archetypes/derive/stats');
const { shapeVector, wardCluster, kmeans, chooseK, silhouette, agreement, bootstrapJaccard } =
  await import('../../src/lib/archetypes/derive/cluster');
const { defenseFloorFor, eliteMembers, deriveArchetype, selfMatchRate, toEvalPlayer } =
  await import('../../src/lib/archetypes/derive/rules');
const { evaluateArchetype } = await import('../../src/lib/archetypes/derive/../evaluate');
const { mdTable, fmtSkills } = await import('../../src/lib/archetypes/derive/md');
const { capUsagePct } = await import('../../src/lib/training/salary');
type CohortPlayer = import('../../src/lib/archetypes/derive/groups').CohortPlayer;
type Group = import('../../src/lib/archetypes/derive/groups').Group;

const OUT_DIR = path.resolve(process.cwd(), '..', 'docs', 'research', 'market-archetypes');
mkdirSync(OUT_DIR, { recursive: true });

// ---- cohort fetch (latest full-skill market snapshot per player, season+age pinned) ----
const rows = await db.execute(sql`
  with latest as (
    select distinct on (s.player_id)
      s.player_id, s.jump_shot, s.jump_range, s.outside_def, s.handling, s.driving,
      s.passing, s.inside_shot, s.inside_def, s.rebounding, s.shot_blocking,
      s.stamina, s.free_throw, s.tsp, s.potential, s.salary, s.starting_price,
      s.owner_team_name, s.captured_at
    from snapshots s
    where s.source = 'market' and s.season = ${SEASON} and s.age = ${AGE_REF}
      and s.captured_at >= ${WINDOW_START}
      and coalesce(s.is_rookie_listing, false) = false
      and s.jump_shot is not null and s.jump_range is not null and s.outside_def is not null
      and s.handling is not null and s.driving is not null and s.passing is not null
      and s.inside_shot is not null and s.inside_def is not null and s.rebounding is not null
      and s.shot_blocking is not null
    order by s.player_id, s.captured_at desc
  )
  select l.*, p.name, p.height_cm, p.nationality
  from latest l
  join players p on p.bb_player_id = l.player_id
  where p.is_utopian = false and p.height_cm is not null
`);

const cohort: CohortPlayer[] = (rows.rows as any[]).map((r) => {
  const skills = {
    js: Number(r.jump_shot), jr: Number(r.jump_range), od: Number(r.outside_def),
    ha: Number(r.handling), dr: Number(r.driving), pa: Number(r.passing),
    is: Number(r.inside_shot), id: Number(r.inside_def), rb: Number(r.rebounding),
    sb: Number(r.shot_blocking),
  };
  const tsp = Object.values(skills).reduce((a, b) => a + b, 0);
  return {
    playerId: Number(r.player_id), name: String(r.name), heightCm: Number(r.height_cm),
    potential: Number(r.potential ?? 0), salary: r.salary === null ? null : Number(r.salary),
    startingPrice: r.starting_price === null ? null : Number(r.starting_price),
    ownerTeamName: r.owner_team_name ?? null, nationality: r.nationality ?? null,
    skills, stamina: r.stamina === null ? null : Number(r.stamina),
    freeThrow: r.free_throw === null ? null : Number(r.free_throw), tsp,
  };
});

// ---- group + potential floor ----
const groups: Record<Group, CohortPlayer[]> = { outside: [], inside: [], wing: [], appendix: [] };
for (const p of cohort) groups[assignGroup(p, DELTA)].push(p);
const pools: Record<'outside' | 'inside' | 'wing', CohortPlayer[]> = {
  outside: groups.outside.filter((p) => p.potential >= POT_FLOOR.outside),
  inside: groups.inside.filter((p) => p.potential >= POT_FLOOR.inside),
  wing: groups.wing.filter((p) => p.potential >= POT_FLOOR.wing),
};

// ---- cluster each pool ----
interface GroupResult {
  group: 'outside' | 'inside' | 'wing';
  k: number; silhouetteScores: Record<number, number>; kmeansAgreement: number;
  jaccard: number[]; noStructure: boolean;
  clusters: Array<{
    index: number; members: CohortPlayer[]; centroid: Record<string, number>;
    eliteN: number; derived: ReturnType<typeof deriveArchetype>;
  }>;
}
const groupResults: GroupResult[] = [];
for (const g of ['outside', 'inside', 'wing'] as const) {
  const pool = pools[g];
  const vectors = pool.map((p) => shapeVector(p.skills));
  const [kMin, kMax] = K_RANGE[g];
  const { k, scores } = chooseK(vectors, kMin, kMax);
  const noStructure = Math.max(...Object.values(scores)) < SIL_MIN;
  const useK = noStructure ? 1 : k;
  const labels = useK === 1 ? vectors.map(() => 0) : wardCluster(vectors, useK);
  const km = useK === 1 ? labels : kmeans(vectors, useK, SEED).labels;
  const jac = useK === 1 ? [1] : bootstrapJaccard(vectors, useK, 100, SEED);
  // group elite mean over the whole pool's floor-passers (definer baseline)
  const groupFloorGuess = defenseFloorFor(g, centroidOf(pool));
  const groupElite = eliteMembers(pool, groupFloorGuess);
  const groupEliteMean = centroidOf(groupElite.length >= 5 ? groupElite : pool);
  const clusters = Array.from({ length: useK }, (_, ci) => {
    const members = pool.filter((_, i) => labels[i] === ci);
    const centroid = centroidOf(members);
    const derived = deriveArchetype({ group: g, index: ci, members, centroid }, groupEliteMean);
    return { index: ci, members, centroid, eliteN: derived.eliteN, derived };
  });
  groupResults.push({
    group: g, k: useK, silhouetteScores: scores,
    kmeansAgreement: agreement(labels, km), jaccard: jac, noStructure, clusters,
  });
}
function centroidOf(ms: CohortPlayer[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const k of SKILL_KEYS) c[k] = ms.length ? mean(ms.map((m) => m.skills[k])) : 0;
  return c;
}

// ---- report ----
const lines: string[] = [];
lines.push(`# Market Archetypes — Season ${SEASON} (age-${AGE_REF} flood)`);
lines.push('');
lines.push(`Generated: ${new Date().toISOString()} · window start ${WINDOW_START} · seed ${SEED}`);
lines.push(`Re-run: \`npm run training:archetypes\` from v2/ (bump SEASON for next season's flood).`);
lines.push('');
lines.push('## What this says, in plain language');
lines.push('');
lines.push(`We looked at ${cohort.length} finished 21-year-old players that top U-21 training`);
lines.push(`programs sold at the end of season ${SEASON}, split them into outside / inside / wing-forward`);
lines.push('groups, and let the data reveal which distinct builds exist in each group. Each build below');
lines.push('comes with: how common it is, what the typical skills look like, how much defense the elite');
lines.push('versions carry, and (with --plans) the optimized week-by-week training path to reach it.');
lines.push('');
// funnel
lines.push('## Cohort funnel');
lines.push('');
lines.push(mdTable(['step', 'n'], [
  ['age-21 full-skill market listings (deduped)', cohort.length],
  ['outside (b>=+1, <=201cm)', groups.outside.length],
  ['inside (b<=-1, >=203cm)', groups.inside.length],
  ['wing/forward (between)', groups.wing.length],
  ['appendix: short inside-leaning', groups.appendix.length],
  ['outside pool after pot>=7', pools.outside.length],
  ['inside pool after pot>=8', pools.inside.length],
  ['wing pool after pot>=7', pools.wing.length],
]));
lines.push('');
lines.push('Coverage caveat: Jul 23–Aug 2 captures were suppressed by BB\'s 1000-result search cap');
lines.push('(fixed 2026-08-03 by per-age sweeps); the cohort skews toward Aug 3+ captures.');
for (const gr of groupResults) {
  lines.push('');
  lines.push(`## ${gr.group} group — k=${gr.k}${gr.noStructure ? ' (no clear structure; single profile)' : ''}`);
  lines.push('');
  lines.push(`Silhouette by k: ${JSON.stringify(gr.silhouetteScores)} · ward-vs-kmeans agreement ${gr.kmeansAgreement.toFixed(2)} · bootstrap Jaccard ${gr.jaccard.map((j) => j.toFixed(2)).join(', ')}`);
  for (const c of gr.clusters) {
    const floor = defenseFloorFor(gr.group, c.centroid as any);
    const elite = eliteMembers(c.members, floor);
    const floorPass = c.members.filter((m) => m.skills[floor.skill] >= floor.min).length;
    const nearCap = c.members.filter((m) => {
      const subl = Object.fromEntries(SKILL_KEYS.map((k) => [k, m.skills[k] - 0.5])) as any;
      return capUsagePct(subl, m.potential) >= 90;
    }).length;
    const sellers = new Set(c.members.map((m) => m.ownerTeamName)).size;
    lines.push('');
    lines.push(`### ${c.derived.archetype.name} (${c.derived.archetype.key})${c.derived.provisional ? ' — PROVISIONAL (thin elite sample)' : ''}`);
    lines.push('');
    lines.push(`${c.members.length} members · ${c.eliteN} elite · floor ${floor.skill.toUpperCase()}>=${floor.min} passed by ${floorPass}/${c.members.length} · near-cap ${nearCap} · ${sellers} distinct sellers · self-match ${(c.derived.selfMatchRate * 100).toFixed(0)}%${c.derived.relaxed.length ? ` (relaxed: ${c.derived.relaxed.join(',')})` : ''}`);
    lines.push('');
    const qrow = (q: number) => SKILL_KEYS.map((k) => quantile(c.members.map((m) => m.skills[k]), q).toFixed(0));
    lines.push(mdTable(['', ...SKILL_KEYS.map((k) => k.toUpperCase())], [
      ['p25', ...qrow(0.25)], ['median', ...qrow(0.5)], ['p75', ...qrow(0.75)],
      ['elite median', ...(elite.length ? SKILL_KEYS.map((k) => median(elite.map((m) => m.skills[k])).toFixed(0)) : SKILL_KEYS.map(() => '–'))],
    ]));
    lines.push('');
    lines.push(`Typical: height ${median(c.members.map((m) => m.heightCm)).toFixed(0)}cm · TSP ${median(c.members.map((m) => m.tsp)).toFixed(0)} · potential ${JSON.stringify(histogram(c.members.map((m) => m.potential)))} · ST p50 ${c.members.some((m) => m.stamina !== null) ? median(c.members.filter((m) => m.stamina !== null).map((m) => m.stamina!)).toFixed(0) : '–'} · FT p50 ${c.members.some((m) => m.freeThrow !== null) ? median(c.members.filter((m) => m.freeThrow !== null).map((m) => m.freeThrow!)).toFixed(0) : '–'}`);
    const examples = [...c.members].sort((a, b) => b.tsp - a.tsp).slice(0, 3);
    lines.push('');
    lines.push(`Examples: ${examples.map((e) => `[${e.name}](https://www.buzzerbeater.com/player/${e.playerId}/overview.aspx) (${fmtSkills(e.skills)})`).join(' · ')}`);
  }
}
// specificity: every derived archetype vs every cluster's members
lines.push('');
lines.push('## Specificity (match rates across clusters)');
lines.push('');
const allDerived = groupResults.flatMap((g) => g.clusters.map((c) => c.derived));
const specRows = allDerived.map((d) => [
  d.archetype.key,
  ...groupResults.flatMap((g) => g.clusters.map((c) =>
    `${Math.round(selfMatchRate(c.members, d.archetype) * 100)}%`)),
]);
lines.push(mdTable(['archetype \\ cluster', ...groupResults.flatMap((g) => g.clusters.map((c) => c.derived.archetype.key))], specRows));
lines.push('');
lines.push('## Proposed rules (paste-ready)');
lines.push('');
lines.push('See `proposed-defaults.snippet.ts` next to this report. Younger byAge tiers are added by the --plans run.');
lines.push('');
lines.push('## Plans');
lines.push('');
lines.push(PLANS ? '(plans sections below)' : '_Run with `-- --plans` to add training paths, byAge tiers, Greece benchmark, and the Slovenia gap analysis._');

writeFileSync(path.join(OUT_DIR, 'REPORT.md'), lines.join('\n') + '\n');
writeFileSync(
  path.join(OUT_DIR, 'proposed-defaults.snippet.ts'),
  `// Paste-ready DefaultArchetype[] additions derived ${new Date().toISOString().slice(0, 10)} (season ${SEASON}).\n` +
  `// Target: v2/src/lib/archetypes/defaults.ts — review REPORT.md before adopting.\n` +
  `export const MARKET_ARCHETYPES = ${JSON.stringify(allDerived.map((d) => d.archetype), null, 2)};\n`,
);
console.log(JSON.stringify({
  cohort: cohort.length,
  groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
  clusters: groupResults.map((g) => ({ group: g.group, k: g.k, sizes: g.clusters.map((c) => c.members.length) })),
}));
process.exit(0);
```

- [ ] **Step 4: Add the npm entry** — in `v2/package.json` scripts block, after `"training:infer"`:

```json
    "training:archetypes": "tsx scripts/training/derive-archetypes.mts"
```

- [ ] **Step 5: Run against the live DB and eyeball**

Run (from `v2/`): `npm run training:archetypes`
Expected: one JSON line with `cohort` ≈ 1200+ (window since Jul 10), group sizes in the ballpark of the audit (outside ~541+/inside ~172+/wing ~270+ at the Jul-20 window; larger with Jul-10 start), cluster sizes ≥ 8 mostly. Open `docs/research/market-archetypes/REPORT.md` and check: funnel table, per-cluster tables render, examples link correctly, every derived archetype has self-match ≥ 70%.

- [ ] **Step 6: Typecheck + full tests** — `npx tsc --noEmit` (via `npm run build` is heavier; `npx tsc -p tsconfig.json --noEmit` is enough) and `npm test` → PASS.

- [ ] **Step 7: Commit** — `git add -A; git commit -m "feat(v2): derive-archetypes script part 1 — cohort, clustering, rules, report"`.

---

### Task 8: Greece benchmark section

**Files:**
- Modify: `v2/scripts/training/derive-archetypes.mts` (add section; always emitted — the CSVs are checked in)
- Create: `v2/src/lib/archetypes/derive/greece.ts` (+ `greece.test.ts`)

**Interfaces:**
- Consumes: `greek_tidy.csv` (Task 1 format), `shapeVector`/`euclid` from `./cluster`.
- Produces (`greece.ts`): `interface GreekPlayer { player: string; position: string | null; week: number; skills: Record<SkillKey, number>; tsp10: number }`; `parseGreekTidy(csv: string): GreekPlayer[]` (keeps ALL weeks); `lastWeekRoster(rows: GreekPlayer[]): GreekPlayer[]` (latest week per player); `nearestCluster(p: GreekPlayer, centroids: Array<{ key: string; centroid: Record<SkillKey, number> }>): { key: string; distance: number }` (euclid in shape space).

- [ ] **Step 1: Failing test** (fixture = 3-line CSV in the test file)

```ts
import { describe, it, expect } from 'vitest';
import { parseGreekTidy, lastWeekRoster, nearestCluster } from './greece';

const CSV = `player,week,position,JS,JR,OD,HA,DR,PA,IS,ID,RB,SB,ST,FT,EXP,GS,TSP10,OSP,ISP
A Player,6,,15,11,15,13,16,8,8,5,6,9,6,9,4,9,106,78,28
A Player,14,SG,17,12,15,15,17,10,11,9,4,5,3,14,5,8,115,86,29
Big Man,14,C,9,6,7,10,9,6,19,17,14,14,5,10,4,9,111,47,64`;

describe('parseGreekTidy', () => {
  it('parses rows with skills and week', () => {
    const rows = parseGreekTidy(CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0].skills.js).toBe(15);
    expect(rows[1].position).toBe('SG');
    expect(rows[2].tsp10).toBe(111);
  });
});
describe('lastWeekRoster + nearestCluster', () => {
  it('keeps the latest week per player and finds the nearest shape', () => {
    const roster = lastWeekRoster(parseGreekTidy(CSV));
    expect(roster).toHaveLength(2);
    expect(roster.find((r) => r.player === 'A Player')?.week).toBe(14);
    const guardCentroid = { js: 16, jr: 11, od: 15, ha: 15, dr: 16, pa: 8, is: 10, id: 7, rb: 5, sb: 4 };
    const bigCentroid = { js: 8, jr: 5, od: 6, ha: 9, dr: 8, pa: 7, is: 18, id: 16, rb: 13, sb: 13 };
    const n = nearestCluster(roster.find((r) => r.player === 'Big Man')!,
      [{ key: 'g', centroid: guardCentroid }, { key: 'b', centroid: bigCentroid }]);
    expect(n.key).toBe('b');
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `greece.ts`**

```ts
import { type SkillKey } from '../../training/types';
import { shapeVector, euclid } from './cluster';

export interface GreekPlayer {
  player: string; position: string | null; week: number;
  skills: Record<SkillKey, number>; tsp10: number;
}
const COL_TO_KEY: Array<[string, SkillKey]> = [
  ['JS', 'js'], ['JR', 'jr'], ['OD', 'od'], ['HA', 'ha'], ['DR', 'dr'],
  ['PA', 'pa'], ['IS', 'is'], ['ID', 'id'], ['RB', 'rb'], ['SB', 'sb'],
];

export function parseGreekTidy(csv: string): GreekPlayer[] {
  const [head, ...body] = csv.trim().split(/\r?\n/);
  const cols = head.split(',');
  const idx = (c: string) => cols.indexOf(c);
  return body.map((line) => {
    const cells = line.split(',');
    const skills = {} as Record<SkillKey, number>;
    for (const [col, key] of COL_TO_KEY) skills[key] = Number(cells[idx(col)]);
    return {
      player: cells[idx('player')],
      position: cells[idx('position')] || null,
      week: Number(cells[idx('week')]),
      skills,
      tsp10: Number(cells[idx('TSP10')]),
    };
  });
}

export function lastWeekRoster(rows: GreekPlayer[]): GreekPlayer[] {
  const byPlayer = new Map<string, GreekPlayer>();
  for (const r of rows) {
    const cur = byPlayer.get(r.player);
    if (!cur || r.week > cur.week) byPlayer.set(r.player, r);
  }
  return [...byPlayer.values()];
}

export function nearestCluster(
  p: GreekPlayer,
  centroids: Array<{ key: string; centroid: Record<SkillKey, number> }>,
): { key: string; distance: number } {
  const v = shapeVector(p.skills);
  let best = { key: centroids[0].key, distance: Infinity };
  for (const c of centroids) {
    const d = euclid(v, shapeVector(c.centroid));
    if (d < best.distance) best = { key: c.key, distance: d };
  }
  return best;
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Wire the section into the script** (after the specificity section, before "Proposed rules"):

```ts
// ---- Greece external benchmark (benchmark, not ceiling — spec §2/§8) ----
const greeceCsvPath = path.join(OUT_DIR, 'greece-s72', 'greek_tidy.csv');
const greekRows = parseGreekTidy(readFileSync(greeceCsvPath, 'utf8'));
const roster = lastWeekRoster(greekRows);
const centroids = groupResults.flatMap((g) => g.clusters.map((c) => ({
  key: c.derived.archetype.key, centroid: c.centroid as Record<SkillKey, number>,
})));
lines.push('', '## External benchmark: Greece U-21 (Euro bronze, S72)', '');
lines.push('Benchmark, not ceiling: Greek outside starters sit ~p60–p75 of the elite market pool;');
lines.push('thresholds derive from the market cohort. This section validates shapes and floors.');
lines.push('');
lines.push(mdTable(
  ['player', 'pos', 'wk', 'skills', 'TSP10', 'nearest build', 'dist'],
  roster.sort((a, b) => b.tsp10 - a.tsp10).map((p) => {
    const n = nearestCluster(p, centroids);
    return [p.player, p.position ?? '–', p.week, fmtSkills(p.skills), p.tsp10, n.key, n.distance.toFixed(1)];
  }),
));
// above-bronze share per cluster: members strictly above Greece's position-equivalent starters
lines.push('');
const greekBest = { outside: Math.max(...roster.filter((r) => ['PG','SG','SF'].includes(r.position ?? '')).map((r) => r.tsp10)),
                    inside: Math.max(...roster.filter((r) => ['PF','C'].includes(r.position ?? '')).map((r) => r.tsp10)) };
lines.push(mdTable(['cluster', 'members above Greek best (outside 121 / inside ~117)'],
  groupResults.flatMap((g) => g.clusters.map((c) => [
    c.derived.archetype.key,
    c.members.filter((m) => m.tsp > (g.group === 'inside' ? greekBest.inside : greekBest.outside)).length,
  ]))));
lines.push('');
lines.push('Caveats: n=17, one federation; coach-recorded levels (two SB=21 above display cap);');
lines.push('wk14 censored; ages came from our DB (all 21), not the workbook.');
```

Add to the dynamic imports block: `const { parseGreekTidy, lastWeekRoster, nearestCluster } = await import('../../src/lib/archetypes/derive/greece');` and `type SkillKey = import('../../src/lib/training/types').SkillKey;`.

- [ ] **Step 6: Run script + tests** — `npm run training:archetypes` (section renders; every Greek big should map to an inside cluster, guards to outside ones — if not, investigate before committing) and `npm test` → PASS.

- [ ] **Step 7: Commit** — `git commit -m "feat(v2): Greece U-21 benchmark section in archetype report"`.

---

### Task 9: Plan search + tier derivation (`plans.ts`)

**Files:**
- Create: `v2/src/lib/archetypes/derive/plans.ts`
- Test: `v2/src/lib/archetypes/derive/plans.test.ts`

**Interfaces:**
- Consumes: `optimizePlan`, `SkillTarget`, `PlanCandidate`, `OptimizeOptions` from `../../training/optimize`; `project`, `displayed`, `type PlayerState`, `type Projection` from `../../training/engine`; `planToWeeks` from `../../training/bridge`; `horizonWeeks` from `../../training/horizon`; `BBSCOUT` from `../../training/models/bbscout`; `evaluateArchetype` from `../evaluate`; `DefaultArchetype` from `../types`; `DefenseFloor` from `./rules`.
- Produces:
  - `interface StaffScenario { name: 'neutral' | 'elite'; coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number }`; `const STAFF_SCENARIOS: StaffScenario[]` = `[{name:'neutral',coachLevel:5,youthTrainerLevel:5,gymLevel:0,trainingCourtLevel:0},{name:'elite',coachLevel:7,youthTrainerLevel:7,gymLevel:2,trainingCourtLevel:2}]`.
  - `interface DrafteeProfile { label: 'p25' | 'p50' | 'p75'; skills: Record<SkillKey, number>; heightCm: number; potential: number }` (skills = displayed ints at age 18 week 1)
  - `targetsFor(archetype: DefaultArchetype, floor: DefenseFloor): SkillTarget[]` — every `>=` rate-skill condition's tier-21 value at priority `'normal'`, the floor skill at `'high'`. (Floors as soft penalties = priorities; spec §7.)
  - `planForCluster(archetype: DefaultArchetype, floor: DefenseFloor, draftees: DrafteeProfile[], scenario: StaffScenario): ClusterPlanResult` where `interface ClusterPlanResult { scenario: string; candidate: PlanCandidate | null; blocks: Array<{ trainingId: number; weeks: number }>; tiers: Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>; feasibleEntering21: boolean; fullRuleMatch: boolean; failingChecks: Array<{ field: string; op: string; threshold: number | string; actual: number | string | null }>; finishingDeltas: Partial<Record<SkillKey, number>>; weeklyPopRate: number }`
- Semantics: horizon = `horizonWeeks({age:18,week:1},{age:21,week:1})` = 42 weeks for the ENTERING-21 search; candidate from the p50 draftee; forward-sim `project()` of `planToWeeks(candidate.blocks, ...)` over all three draftees but EXTENDED to end-of-21 (`{age:22,week:1}`, 56 weeks) by repeating the final block — finishing deltas = displayed(end-of-21) − displayed(entering-21) per skill. Tiers: for age A in 19/20/21, tier[A][k] = `min over draftees of displayed(skills entering age A)`, minus 1 at 19 (slack), floored at 1; monotonicity enforced (throw on violation). `feasibleEntering21` = candidate reachable within 42 weeks. `fullRuleMatch` = `evaluateArchetype` on the p50 end-of-21 state (ageNow 21, snake_case displayed skills + stamina/free_throw from the last projection week, tsp = 10-skill displayed sum, heightCm/potential from the draftee, bestPosition null) — and derived rules contain no position conditions, so null is safe. `weeklyPopRate` = popCount/weeks of the p50 full projection (sanity band 0.6–0.85 at elite staff).

- [ ] **Step 1: Failing test** (fast: small horizon via a scoring-guard-like archetype and a strong draftee)

```ts
import { describe, it, expect } from 'vitest';
import { targetsFor, planForCluster, STAFF_SCENARIOS, type DrafteeProfile } from './plans';
import type { DefaultArchetype } from '../types';

const ARCH: DefaultArchetype = {
  key: 'mkt72-outside-1', name: 'Market: outside #1',
  rules: { conditions: [
    { kind: 'field', field: 'jump_shot', op: '>=', byAge: { 21: 14 } },
    { kind: 'field', field: 'driving', op: '>=', byAge: { 21: 14 } },
    { kind: 'field', field: 'outside_def', op: '>=', byAge: { 21: 12 } },
    { kind: 'field', field: 'potential', op: '>=', byAge: { 21: 7 } },
  ] },
};
const FLOOR = { field: 'outside_def' as const, skill: 'od' as const, min: 12 };
const DRAFTEE: DrafteeProfile = {
  label: 'p50', heightCm: 190, potential: 9,
  skills: { js: 8, jr: 6, od: 6, ha: 9, dr: 9, pa: 6, is: 5, id: 4, rb: 4, sb: 3 },
};

describe('targetsFor', () => {
  it('turns >= rate conditions into targets; floor skill priority high', () => {
    const t = targetsFor(ARCH, FLOOR);
    expect(t).toContainEqual({ skill: 'js', displayed: 14, priority: 'normal' });
    expect(t).toContainEqual({ skill: 'od', displayed: 12, priority: 'high' });
    expect(t.find((x) => x.skill === 'pa')).toBeUndefined(); // potential/attr conditions drop
  });
});

describe('planForCluster', () => {
  it('produces a reachable plan, monotone tiers, and a full-rule verdict', () => {
    const r = planForCluster(ARCH, FLOOR, [DRAFTEE], STAFF_SCENARIOS[1]); // elite staff = fastest
    expect(r.candidate).not.toBeNull();
    expect(r.blocks.length).toBeGreaterThan(0);
    for (const k of ['js', 'dr', 'od'] as const) {
      expect(r.tiers[19][k]!).toBeLessThanOrEqual(r.tiers[20][k]!);
      expect(r.tiers[20][k]!).toBeLessThanOrEqual(r.tiers[21][k]!);
    }
    expect(typeof r.fullRuleMatch).toBe('boolean');
    expect(r.weeklyPopRate).toBeGreaterThan(0);
  }, 120_000); // beam search over 42 weeks — allow time
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `plans.ts`**

```ts
// Per-cluster plan search + forward-simulated byAge tiers (spec §7).
import { optimizePlan, type SkillTarget, type PlanCandidate } from '../../training/optimize';
import { project, displayed, type PlayerState, type Projection } from '../../training/engine';
import { planToWeeks } from '../../training/bridge';
import { horizonWeeks } from '../../training/horizon';
import { BBSCOUT } from '../../training/models/bbscout';
import { evaluateArchetype } from '../evaluate';
import type { DefaultArchetype, EvalPlayer } from '../types';
import { SKILL_KEYS, SKILL_DB_NAMES, type SkillKey } from '../../training/types';
import type { DefenseFloor } from './rules';

export interface StaffScenario {
  name: 'neutral' | 'elite';
  coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number;
}
export const STAFF_SCENARIOS: StaffScenario[] = [
  { name: 'neutral', coachLevel: 5, youthTrainerLevel: 5, gymLevel: 0, trainingCourtLevel: 0 },
  { name: 'elite', coachLevel: 7, youthTrainerLevel: 7, gymLevel: 2, trainingCourtLevel: 2 },
];

export interface DrafteeProfile {
  label: 'p25' | 'p50' | 'p75';
  skills: Record<SkillKey, number>; // displayed ints at age 18, week 1
  heightCm: number; potential: number;
}

export interface ClusterPlanResult {
  scenario: string;
  candidate: PlanCandidate | null;
  blocks: Array<{ trainingId: number; weeks: number }>;
  tiers: Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>;
  feasibleEntering21: boolean;
  fullRuleMatch: boolean;
  failingChecks: Array<{ field: string; op: string; threshold: number | string; actual: number | string | null }>;
  finishingDeltas: Partial<Record<SkillKey, number>>;
  weeklyPopRate: number;
}

const DB_TO_KEY = new Map(SKILL_KEYS.map((k) => [SKILL_DB_NAMES[k], k]));

export function targetsFor(a: DefaultArchetype, floor: DefenseFloor): SkillTarget[] {
  const targets: SkillTarget[] = [];
  for (const c of a.rules.conditions) {
    if (c.kind !== 'field' || c.op !== '>=') continue;
    const key = DB_TO_KEY.get(c.field as string);
    if (!key) continue; // attrs / stamina / free_throw drop
    const v = c.byAge[21];
    if (v === undefined) continue;
    targets.push({ skill: key, displayed: v, priority: key === floor.skill ? 'high' : 'normal' });
  }
  return targets;
}

function toState(d: DrafteeProfile): PlayerState {
  const skills = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.max(0.5, d.skills[k] - 0.5)]),
  ) as Record<SkillKey, number>;
  return { skills, age: 18, heightCm: d.heightCm, potential: d.potential, ftSkill: 0.5, staminaSkill: 4.5 };
}

/** Displayed skills at the state ENTERING each age, from a projection started at age 18 wk 1. */
function stateEntering(proj: Projection, age: 19 | 20 | 21): Record<SkillKey, number> {
  const firstIdx = proj.weeks.findIndex((w) => w.age === age);
  if (firstIdx <= 0) {
    // horizon ended before this age; use final skills
    return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(proj.finalSkills[k])])) as Record<SkillKey, number>;
  }
  const before = proj.weeks[firstIdx - 1].result.skillsAfter;
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(before[k])])) as Record<SkillKey, number>;
}

export function planForCluster(
  archetype: DefaultArchetype, floor: DefenseFloor,
  draftees: DrafteeProfile[], scenario: StaffScenario,
): ClusterPlanResult {
  const targets = targetsFor(archetype, floor);
  const p50 = draftees.find((d) => d.label === 'p50') ?? draftees[0];
  const H21 = horizonWeeks({ age: 18, week: 1 }, { age: 21, week: 1 }); // 42
  const HEND = horizonWeeks({ age: 18, week: 1 }, { age: 22, week: 1 }); // 56
  const { best } = optimizePlan(toState(p50), targets, {
    horizonWeeks: H21, startWeekOfSeason: 1,
    coachLevel: scenario.coachLevel, youthTrainerLevel: scenario.youthTrainerLevel,
    gymLevel: scenario.gymLevel, trainingCourtLevel: scenario.trainingCourtLevel,
  });
  const blocks = best ? [...best.blocks] : [];
  if (blocks.length > 0) {
    const planned = blocks.reduce((a, b) => a + b.weeks, 0);
    if (planned < HEND) blocks[blocks.length - 1] = {
      ...blocks[blocks.length - 1], weeks: blocks[blocks.length - 1].weeks + (HEND - planned),
    }; // finishing phase: extend last block through end of age 21
  }
  const weekCfgs = planToWeeks(blocks, scenario.coachLevel, scenario.youthTrainerLevel,
    { gymLevel: scenario.gymLevel, trainingCourtLevel: scenario.trainingCourtLevel });
  const projections = draftees.map((d) => project(toState(d), weekCfgs, BBSCOUT, { startWeekOfSeason: 1 }));

  const tiers = { 19: {}, 20: {}, 21: {} } as ClusterPlanResult['tiers'];
  for (const age of [19, 20, 21] as const) {
    for (const k of SKILL_KEYS) {
      const lows = projections.map((p) => stateEntering(p, age)[k]);
      let v = Math.min(...lows);
      if (age === 19) v = Math.max(1, v - 1); // extra slack where uncertainty is largest
      tiers[age][k] = v;
    }
  }
  for (const k of SKILL_KEYS) {
    if (tiers[19][k]! > tiers[20][k]! || tiers[20][k]! > tiers[21][k]!)
      throw new Error(`non-monotone tier for ${k} in ${archetype.key}`);
  }

  const proj50 = projections[draftees.indexOf(p50)] ?? projections[0];
  const entering21 = stateEntering(proj50, 21);
  const end21 = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(proj50.finalSkills[k])])) as Record<SkillKey, number>;
  const finishingDeltas = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, end21[k] - entering21[k]]).filter(([, d]) => (d as number) !== 0),
  ) as Partial<Record<SkillKey, number>>;

  const lastWeek = proj50.weeks[proj50.weeks.length - 1];
  const evalP: EvalPlayer = {
    ageNow: 21,
    skills: {
      ...Object.fromEntries(SKILL_KEYS.map((k) => [SKILL_DB_NAMES[k], end21[k]])),
      stamina: lastWeek ? displayed(lastWeek.result.staminaAfter) : null,
      free_throw: lastWeek ? displayed(lastWeek.result.ftAfter) : null,
    },
    potential: p50.potential, heightCm: p50.heightCm,
    tsp: SKILL_KEYS.reduce((a, k) => a + end21[k], 0), bestPosition: null,
  };
  const verdict = evaluateArchetype(evalP, {
    id: archetype.key, key: archetype.key, dbId: null, name: archetype.name,
    rules: archetype.rules, source: 'default',
  });

  return {
    scenario: scenario.name,
    candidate: best,
    blocks,
    tiers,
    feasibleEntering21: best?.reachable ?? false,
    fullRuleMatch: verdict.matches,
    failingChecks: verdict.checks.filter((c) => !c.pass)
      .map(({ field, op, threshold, actual }) => ({ field: String(field), op, threshold, actual })),
    finishingDeltas,
    weeklyPopRate: proj50.weeks.length ? proj50.popCount / proj50.weeks.length : 0,
  };
}
```

- [ ] **Step 4: Run → PASS** (allow the long timeout; if the 42-week beam takes > 2 min on this machine, drop `beamWidth` to 64 in the test via `OptimizeOptions` — the script keeps 128).
- [ ] **Step 5: Commit** — `git commit -m "feat(v2): per-cluster plan search + forward-simulated byAge tiers"`.

---

### Task 10: Script part 2 — `--plans` wiring (draftee profiles, tiers into rules, plan sections)

**Files:**
- Modify: `v2/scripts/training/derive-archetypes.mts`

**Interfaces:**
- Consumes: Task 9's `planForCluster`, `STAFF_SCENARIOS`, `DrafteeProfile`; census SQL below.
- Produces: report gains per-cluster plan sections; `proposed-defaults.snippet.ts` archetypes get byAge 19/20/21 tiers patched in (18 stays blank — draft-day skills are noise); JSON summary gains `plans: [...]`.

- [ ] **Step 1: Draftee-profile SQL + assembly** (inside `if (PLANS) { ... }`; add `const { STAFF_SCENARIOS, planForCluster } = await import('../../src/lib/archetypes/derive/plans');` to the imports)

```ts
// Age-18 Slovenian universe (census/api/manual — NOT market-censored): per-group p25/p50/p75 profiles.
const rookieRows = await db.execute(sql`
  with latest_full as (
    select distinct on (s.player_id)
      s.player_id, s.jump_shot, s.jump_range, s.outside_def, s.handling, s.driving,
      s.passing, s.inside_shot, s.inside_def, s.rebounding, s.shot_blocking, s.potential
    from snapshots s
    where s.season = ${SEASON} and s.age = 18
      and s.jump_shot is not null and s.inside_shot is not null and s.shot_blocking is not null
      and s.jump_range is not null and s.outside_def is not null and s.handling is not null
      and s.driving is not null and s.passing is not null and s.inside_def is not null
      and s.rebounding is not null
    order by s.player_id, s.captured_at desc
  )
  select lf.*, p.height_cm
  from latest_full lf join players p on p.bb_player_id = lf.player_id
  where (p.country_id = 66 or p.nationality in ('Slovenia', 'Slovenija'))
    and p.is_utopian = false and p.height_cm is not null
`);
const rookies: CohortPlayer[] = (rookieRows.rows as any[]).map((r) => {
  const skills = {
    js: Number(r.jump_shot), jr: Number(r.jump_range), od: Number(r.outside_def),
    ha: Number(r.handling), dr: Number(r.driving), pa: Number(r.passing),
    is: Number(r.inside_shot), id: Number(r.inside_def), rb: Number(r.rebounding),
    sb: Number(r.shot_blocking),
  };
  return { playerId: Number(r.player_id), name: '', heightCm: Number(r.height_cm),
    potential: Number(r.potential ?? 7), salary: null, startingPrice: null, ownerTeamName: null,
    nationality: null, skills, stamina: null, freeThrow: null,
    tsp: Object.values(skills).reduce((a, b) => a + b, 0) };
});
function drafteesFor(g: 'outside' | 'inside' | 'wing') {
  // group rookies by the same balance/height gates; wing draftees = the between band
  const members = rookies.filter((r) => assignGroup(r, DELTA) === g);
  const src = members.length >= 8 ? members : rookies; // thin group -> whole universe fallback
  const heights = src.map((m) => m.heightCm);
  const pots = src.map((m) => m.potential);
  return (['p25', 'p50', 'p75'] as const).map((label) => ({
    label,
    skills: Object.fromEntries(SKILL_KEYS.map((k) => [k,
      Math.max(1, Math.round(quantile(src.map((m) => m.skills[k]), { p25: 0.25, p50: 0.5, p75: 0.75 }[label])))])) as any,
    heightCm: Math.round(median(heights)),
    potential: Math.round(median(pots)),
  }));
}
```

- [ ] **Step 2: Run plans per cluster, patch tiers, emit sections** (replace the Plans placeholder)

```ts
lines.push('', '## Training paths (per build)', '');
lines.push('Anchor: the build must be USABLE entering age 21 (WC squad selection); the age-21');
lines.push('season is a finishing phase. Feasibility shown under neutral (coach 5/YT 5) and elite');
lines.push('(coach 7/YT 7, gym 2, TC 2) staff. Week-14s are near-zero training weeks in reality');
lines.push('(clubs switch to Game Shape) — treat final-week pops as bonus, not plan.');
const planSummaries: any[] = [];
for (const gr of groupResults) {
  const draftees = drafteesFor(gr.group);
  for (const c of gr.clusters) {
    const floor = defenseFloorFor(gr.group, c.centroid as any);
    lines.push('', `### Path to ${c.derived.archetype.name}`, '');
    for (const scenario of STAFF_SCENARIOS) {
      const r = planForCluster(c.derived.archetype, floor, draftees, scenario);
      if (scenario.name === 'neutral') {
        // patch byAge tiers into the proposed rules from the NEUTRAL scenario (Slovenian prescription)
        for (const cond of c.derived.archetype.rules.conditions) {
          if (cond.kind !== 'field') continue;
          const key = [...SKILL_KEYS].find((k) => SKILL_DB_NAMES[k] === cond.field);
          if (!key || cond.op !== '>=') continue;
          cond.byAge = { 19: r.tiers[19][key], 20: r.tiers[20][key], 21: cond.byAge[21] };
        }
      }
      const blockStr = r.blocks.map((b) => `${getTrainingType(b.trainingId).label}×${b.weeks}`).join(' → ');
      lines.push(`**${scenario.name}**: ${r.feasibleEntering21 ? 'REACHABLE entering 21' : 'NOT reachable entering 21'} · full-rule end check ${r.fullRuleMatch ? 'PASS' : `FAIL (${r.failingChecks.map((f) => `${f.field} ${f.op} ${f.threshold} got ${f.actual}`).join('; ')})`} · pop rate ${r.weeklyPopRate.toFixed(2)}/wk`);
      lines.push('');
      lines.push(`Plan: ${blockStr || '(no plan found)'}`);
      lines.push('');
      lines.push(`Finishing deltas during age-21 season: ${Object.entries(r.finishingDeltas).map(([k, d]) => `${k.toUpperCase()}+${d}`).join(' ') || 'none'}`);
      lines.push('');
      planSummaries.push({ key: c.derived.archetype.key, scenario: scenario.name,
        reachable: r.feasibleEntering21, fullRule: r.fullRuleMatch });
    }
    lines.push(`byAge tiers (entering-age, neutral staff, lower envelope of p25/p50/p75 draftees):`);
    lines.push('');
    const neutral = planForCluster(c.derived.archetype, floor, draftees, STAFF_SCENARIOS[0]);
    lines.push(mdTable(['age', ...SKILL_KEYS.map((k) => k.toUpperCase())],
      ([19, 20, 21] as const).map((a) => [a, ...SKILL_KEYS.map((k) => neutral.tiers[a][k] ?? null)])));
  }
}
```

Note: `getTrainingType` needs adding to the dynamic imports (`../../src/lib/training/catalog`). To avoid running `planForCluster` twice for neutral, restructure: compute `const results = STAFF_SCENARIOS.map((s) => planForCluster(...))` once, reuse `results[0]` for tiers/patching — do it this way in the actual code.

- [ ] **Step 3: Sanity guards in the script** (after the loops)

```ts
// spec §6: back-projected age-20 defense must sit BELOW the age-21 floors — anything else is
// an optimizer error, not a target.
for (const gr of groupResults) for (const c of gr.clusters) {
  const floor = defenseFloorFor(gr.group, c.centroid as any);
  const odCond = c.derived.archetype.rules.conditions.find(
    (x) => x.kind === 'field' && x.field === floor.field);
  if (odCond?.kind === 'field' && (odCond.byAge[20] ?? 0) >= floor.min)
    console.error(`WARN ${c.derived.archetype.key}: age-20 ${floor.field} tier ${odCond.byAge[20]} >= floor ${floor.min} (optimizer-optimistic)`);
}
```

- [ ] **Step 4: Run** — `npm run training:archetypes -- --plans` (expect several minutes: ~8 clusters × 2 scenarios × 42-week beam search). Verify in REPORT.md: every cluster has both scenarios, tiers are monotone, outside clusters show low OD at tier 19 and mid-climb OD at tier 20 (the elastic-feeder pathway), finishing deltas are +1..+3-ish, neutral pop rates land near 0.5–0.7 and elite near 0.6–0.85.
- [ ] **Step 5: Typecheck + tests + commit** — `npx tsc --noEmit; npm test`, then `git commit -m "feat(v2): --plans — draftee profiles, per-build training paths, byAge tiers"`.

---

### Task 11: Slovenia gap analysis (`gap.ts` + script section)

**Files:**
- Create: `v2/src/lib/archetypes/derive/gap.ts`
- Test: `v2/src/lib/archetypes/derive/gap.test.ts`
- Modify: `v2/scripts/training/derive-archetypes.mts` (section, inside `--plans`)

**Interfaces:**
- Consumes: `BoardPlayerInput` from `../../training/board` (has `state: PlayerState`, `displayedSkills: number[]` in SKILL_KEYS order, `age`, `heightCm`, `potential`, `inferred: { trainingId, confidence } | null`, `currentSeasonWeek`); `getPlannerData()` from `src/queries/planner` (script side); cluster centroids + tiers from Tasks 7–10.
- Produces (`gap.ts`):
  - `type ProspectStatus = 'on-track' | 'watch' | 'at-risk'`
  - `interface ProspectGrade { status: ProspectStatus; reasons: string[]; nearestKey: string; distance: number; gaps: Array<{ skill: SkillKey; have: number; need: number }> }`
  - `gradeProspect(p: { age: number; heightCm: number; potential: number; skills: Record<SkillKey, number>; inferredTrainingId: number | null; currentSeasonWeek: number }, clusters: Array<{ key: string; group: 'outside' | 'inside' | 'wing'; centroid: Record<SkillKey, number>; tiers: Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>; floor: DefenseFloor }>, opts?: { closurePerWeek?: number }): ProspectGrade`
- Age-conditional logic (spec §8.6, owner-corrected mechanism):
  - Assign nearest cluster by shape distance among clusters whose group admits the height (outside ≤201, inside ≥203, wing anything).
  - Gaps = tier for the player's NEXT age (age+1 clamped to 19..21; a 21yo uses tier 21) minus current displayed, positive only.
  - Age 18/19 (outside/wing-OD clusters): grade on FEEDERS — `ha + dr` vs tier-20 `ha + dr` sum − 2 slack → below = `watch` (reason 'feeders behind'); defense gaps IGNORED (reason string notes 'defense lag OK at this age'). Inside clusters: grade `id` vs tier for next age (bigs build defense early); behind by >2 = `watch`.
  - Age 20: if floor-skill displayed < tiers[20][floor.skill] AND `inferredTrainingId` is not a matching defense training (OD ids 9/10/11 for od-floor, ID ids 24/25/26 for id-floor) → `at-risk` (reason 'defense season, not training defense'); training it → `on-track`.
  - Age 21: floor gap > `(14 − currentSeasonWeek) × closurePerWeek (0.35)` → `at-risk` (reason 'cannot close floor before WC end'); else `watch` if any gap > 0.
  - No triggered rules → `on-track`.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { gradeProspect } from './gap';
import type { SkillKey } from '../../training/types';

const OUT_CLUSTER = {
  key: 'mkt72-outside-1', group: 'outside' as const,
  centroid: { js: 16, jr: 11, od: 15, ha: 15, dr: 16, pa: 8, is: 10, id: 7, rb: 5, sb: 4 } as Record<SkillKey, number>,
  tiers: {
    19: { js: 10, ha: 12, dr: 12, od: 6 }, 20: { js: 13, ha: 14, dr: 15, od: 8 },
    21: { js: 16, ha: 15, dr: 16, od: 14 },
  } as any,
  floor: { field: 'outside_def' as const, skill: 'od' as const, min: 15 },
};
const base = { heightCm: 190, potential: 8, currentSeasonWeek: 5, inferredTrainingId: null as number | null };
const skills = (o: Partial<Record<SkillKey, number>>): Record<SkillKey, number> =>
  ({ js: 10, jr: 7, od: 7, ha: 13, dr: 13, pa: 6, is: 7, id: 5, rb: 5, sb: 4, ...o });

describe('gradeProspect — age-conditional defense logic', () => {
  it('19yo with strong feeders and low OD is ON TRACK (elastic pathway)', () => {
    const g = gradeProspect({ ...base, age: 19, skills: skills({ ha: 15, dr: 16, od: 7 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('on-track');
  });
  it('19yo with weak feeders is WATCH regardless of defense', () => {
    const g = gradeProspect({ ...base, age: 19, skills: skills({ ha: 9, dr: 9, od: 7 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('watch');
    expect(g.reasons.join(' ')).toMatch(/feeders/);
  });
  it('20yo below the OD track and NOT training OD is AT RISK', () => {
    const g = gradeProspect({ ...base, age: 20, inferredTrainingId: 1, skills: skills({ od: 6 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('at-risk');
  });
  it('20yo below track but training OD (id 10) is ON TRACK', () => {
    const g = gradeProspect({ ...base, age: 20, inferredTrainingId: 10, skills: skills({ od: 6, ha: 15, dr: 16, js: 14 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('on-track');
  });
  it('21yo with an unclosable floor gap is AT RISK (0.35/wk closure cap)', () => {
    // week 5 -> 9 weeks left -> max ~3.15 levels; gap OD 10->15 = 5
    const g = gradeProspect({ ...base, age: 21, currentSeasonWeek: 5, skills: skills({ od: 10, js: 16, ha: 15, dr: 16 }) }, [OUT_CLUSTER]);
    expect(g.status).toBe('at-risk');
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `gap.ts`**

```ts
// Slovenia gap analysis: age-conditional at-risk grading (spec §8.6).
import { type SkillKey } from '../../training/types';
import { shapeVector, euclid } from './cluster';
import type { DefenseFloor } from './rules';

export type ProspectStatus = 'on-track' | 'watch' | 'at-risk';
export interface ProspectGrade {
  status: ProspectStatus; reasons: string[];
  nearestKey: string; distance: number;
  gaps: Array<{ skill: SkillKey; have: number; need: number }>;
}
export interface GapCluster {
  key: string; group: 'outside' | 'inside' | 'wing';
  centroid: Record<SkillKey, number>;
  tiers: Record<19 | 20 | 21, Partial<Record<SkillKey, number>>>;
  floor: DefenseFloor;
}
interface GapProspect {
  age: number; heightCm: number; potential: number;
  skills: Record<SkillKey, number>;
  inferredTrainingId: number | null; currentSeasonWeek: number;
}

const OD_TRAININGS = [9, 10, 11];
const ID_TRAININGS = [24, 25, 26];

export function gradeProspect(
  p: GapProspect, clusters: GapCluster[], opts: { closurePerWeek?: number } = {},
): ProspectGrade {
  const closure = opts.closurePerWeek ?? 0.35;
  const admissible = clusters.filter((c) =>
    c.group === 'wing' ||
    (c.group === 'outside' && p.heightCm <= 201) ||
    (c.group === 'inside' && p.heightCm >= 203));
  const pool = admissible.length ? admissible : clusters;
  const v = shapeVector(p.skills);
  const nearest = pool.reduce((best, c) => {
    const d = euclid(v, shapeVector(c.centroid));
    return d < best.distance ? { cluster: c, distance: d } : best;
  }, { cluster: pool[0], distance: Infinity });
  const c = nearest.cluster;

  const tierAge = (Math.min(21, Math.max(19, p.age + 1))) as 19 | 20 | 21;
  const tier = c.tiers[p.age >= 21 ? 21 : tierAge] ?? {};
  const gaps = (Object.entries(tier) as Array<[SkillKey, number]>)
    .map(([skill, need]) => ({ skill, have: p.skills[skill], need }))
    .filter((g) => g.have < g.need);

  const reasons: string[] = [];
  let status: ProspectStatus = 'on-track';
  const floorSkill = c.floor.skill;
  const defenseIds = floorSkill === 'od' ? OD_TRAININGS : ID_TRAININGS;

  if (p.age <= 19) {
    if (floorSkill === 'od') {
      const feederNeed = (c.tiers[20].ha ?? 0) + (c.tiers[20].dr ?? 0) - 2;
      if (p.skills.ha + p.skills.dr < feederNeed) {
        status = 'watch'; reasons.push(`feeders behind (HA+DR ${p.skills.ha + p.skills.dr} vs track ${feederNeed})`);
      } else reasons.push('defense lag OK at this age — feeders on track');
    } else {
      const need = c.tiers[tierAge][floorSkill] ?? 0;
      if (p.skills[floorSkill] < need - 2) {
        status = 'watch'; reasons.push(`${floorSkill.toUpperCase()} behind the big-man early-defense track`);
      }
    }
  } else if (p.age === 20) {
    const need = c.tiers[20][floorSkill] ?? 0;
    if (p.skills[floorSkill] < need) {
      if (p.inferredTrainingId !== null && defenseIds.includes(p.inferredTrainingId)) {
        reasons.push(`defense season: below track but training ${floorSkill.toUpperCase()} now`);
      } else {
        status = 'at-risk';
        reasons.push(`defense season, not training ${floorSkill.toUpperCase()} (inferred: ${p.inferredTrainingId ?? 'unknown'})`);
      }
    }
  } else if (p.age >= 21) {
    const floorGap = c.floor.min - p.skills[floorSkill];
    const weeksLeft = Math.max(0, 14 - p.currentSeasonWeek);
    if (floorGap > weeksLeft * closure) {
      status = 'at-risk';
      reasons.push(`cannot close ${floorSkill.toUpperCase()} gap ${floorGap} in ${weeksLeft} weeks (≤${(weeksLeft * closure).toFixed(1)})`);
    } else if (gaps.length > 0 && status === 'on-track') {
      status = 'watch';
    }
  }
  if (status === 'on-track' && p.age === 20 && gaps.some((g) => g.skill !== floorSkill && g.need - g.have > 3)) {
    status = 'watch'; reasons.push('non-defense skills >3 behind the age-20 track');
  }
  return { status, reasons, nearestKey: c.key, distance: nearest.distance, gaps };
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Script section** (inside `if (PLANS)`, after training paths; add imports `getPlannerData` from `../../src/queries/planner`, `gradeProspect` from the derive folder):

```ts
const { getPlannerData } = await import('../../src/queries/planner');
const { gradeProspect } = await import('../../src/lib/archetypes/derive/gap');
const planner = await getPlannerData();
const gapClusters = groupResults.flatMap((gr) => gr.clusters.map((c) => ({
  key: c.derived.archetype.key, group: gr.group,
  centroid: c.centroid as Record<SkillKey, number>,
  tiers: neutralTiersByKey.get(c.derived.archetype.key)!, // Map filled in Task 10's loop
  floor: defenseFloorFor(gr.group, c.centroid as any),
})));
lines.push('', '## Slovenia gap analysis', '');
lines.push('Every tracked Slovenian 18–21 prospect vs the nearest derived build. Status logic is');
lines.push('age-aware: at 18/19 we grade the elastic FEEDERS (HA/DR), not defense; at 20 we check the');
lines.push('defense season is actually happening; at 21 we check the floor is still closable.');
lines.push('');
const rows21 = planner.players.map((bp) => {
  const skills = Object.fromEntries(SKILL_KEYS.map((k, i) => [k, bp.displayedSkills[i]])) as Record<SkillKey, number>;
  const g = gradeProspect({
    age: bp.age, heightCm: bp.heightCm, potential: bp.potential, skills,
    inferredTrainingId: bp.inferred?.trainingId ?? null,
    currentSeasonWeek: bp.currentSeasonWeek,
  }, gapClusters);
  return { bp, g };
}).sort((a, b) => (a.g.status === 'at-risk' ? 0 : a.g.status === 'watch' ? 1 : 2)
  - (b.g.status === 'at-risk' ? 0 : b.g.status === 'watch' ? 1 : 2) || a.bp.age - b.bp.age);
lines.push(mdTable(['player', 'age', 'nearest build', 'status', 'gaps (next tier)', 'why'],
  rows21.map(({ bp, g }) => [
    `[${bp.name}](https://www.buzzerbeater.com/player/${bp.bbPlayerId}/overview.aspx)`, bp.age,
    g.nearestKey, g.status.toUpperCase(),
    g.gaps.map((x) => `${x.skill.toUpperCase()} ${x.have}->${x.need}`).join(' ') || '–',
    g.reasons.join('; ') || '–',
  ])));
```

(In Task 10's loop, collect `neutralTiersByKey: Map<string, ClusterPlanResult['tiers']>` when the neutral scenario runs — declare the Map before the loop.)

- [ ] **Step 6: Full run + verify** — `npm run training:archetypes -- --plans`. Check: every Slovenian prospect appears once; a 19yo with high HA/DR + low OD shows ON-TRACK with the 'defense lag OK' note; statuses sort at-risk first.
- [ ] **Step 7: Commit** — `git commit -m "feat(v2): Slovenia gap analysis with age-conditional at-risk grading"`.

---

### Task 12: Finalization — README, exec-summary polish, CLAUDE.md, full run

**Files:**
- Create: `docs/research/market-archetypes/README.md`
- Modify: `v2/scripts/training/derive-archetypes.mts` (exec summary numbers), `CLAUDE.md` (repo root)

- [ ] **Step 1: `docs/research/market-archetypes/README.md`**

```markdown
# Market Archetypes (season-end flood analysis)

What the world's best U-21 training programs produce, learned from the season-72 season-end
transfer flood, benchmarked against the Greek U-21 bronze roster, with optimized training
paths per build and a Slovenian prospect gap analysis.

- `REPORT.md` — the generated report (plain-language summary first; regenerate, don't edit)
- `proposed-defaults.snippet.ts` — paste-ready `DefaultArchetype[]` for
  `v2/src/lib/archetypes/defaults.ts`, adopted only after owner review of REPORT.md
- `greece-s72/` — the Greek coach's weekly workbook + parsed CSVs (see its README)

Regenerate: from `v2/`, `npm run training:archetypes -- --plans` (SELECT-only; ~minutes due to
beam searches). For the season-73 flood: bump `SEASON` in
`v2/scripts/training/derive-archetypes.mts` and re-run; diff the two reports.

Spec: `docs/superpowers/specs/2026-08-04-market-archetypes-design.md`
Plan: `docs/superpowers/plans/2026-08-04-market-archetypes.md`
```

- [ ] **Step 2: Make the exec summary numeric** — in the script's "What this says" section, after `groupResults` exists, add one line per group: `` lines.push(`- ${gr.group}: ${pools[gr.group].length} candidates -> ${gr.k} distinct build${gr.k > 1 ? 's' : ''}${gr.noStructure ? ' (weak separation — treat as one profile)' : ''}`) `` and, when PLANS, a build count line: `` lines.push(`- ${planSummaries.filter((p) => p.scenario === 'neutral' && p.reachable).length} of ${planSummaries.length / 2} builds are reachable by a Slovenian-club draftee entering age 21 under neutral staff`) ``. (Move the exec-summary block assembly to AFTER the analysis loops so these numbers exist; keep it FIRST in the emitted file by building it into a separate `summaryLines` array and emitting `[...header, ...summaryLines, ...lines]`.)

- [ ] **Step 3: CLAUDE.md entry** — append to the v2-rework section of root `CLAUDE.md`:

```markdown
**Market archetypes analysis shipped 2026-08-04** — `npm run training:archetypes [-- --plans]`
(v2/scripts/training/derive-archetypes.mts, SELECT-only) derives data-driven U-21 archetypes
from the season-end market flood (season-pinned `season=72 and age=21`; three groups via
balance score b=OSP/6−ISP/4; shape-space Ward clustering, seeded, bootstrap-stability-checked)
and, with --plans, per-build training paths (beam search + project() forward-sim from census
draftee profiles -> byAge tiers, entering-21 anchor, neutral+elite staff) plus a Slovenia gap
analysis (age-conditional: feeders at 18/19, defense season at 20, floor closability at 21).
Pure logic in `v2/src/lib/archetypes/derive/` (tested). Output:
`docs/research/market-archetypes/REPORT.md` + `proposed-defaults.snippet.ts` (owner reviews
REPORT before anything is encoded into DEFAULT_ARCHETYPES/PLAN_TEMPLATES). Greek U-21 bronze
benchmark data checked in at `docs/research/market-archetypes/greece-s72/`. Re-run next
season: bump SEASON constant. Backlog from the spec: NT week planner/GS tracker, age-22 sweep,
od<-ha elastic watch item.
```

- [ ] **Step 4: Full verification run**

```
cd v2
npm test                                   # all green
npx tsc --noEmit                           # clean
npm run training:archetypes -- --plans     # full report generates without WARN lines (or WARNs understood)
```

Read REPORT.md top to bottom once as the owner would: plain-language summary → builds → paths → Greece → Slovenia. Fix any rendering/clarity issues found.

- [ ] **Step 5: Final commit + push**

```bash
git add -A
git commit -m "feat(v2): market archetypes analysis — report, plans, Slovenia gaps (spec 2026-08-04)"
git push
```

---

## Self-review (done at plan-writing time)

**Spec coverage:** §2 data sources → Tasks 1/7/10; §3 cohort/groups → Tasks 2/7; §4 clustering → Tasks 4/5/7; §5 overlays → Task 7 (elite share via `eliteMembers`, cream = elite median row, floor pass rates, near-cap via `capUsagePct`, ST/FT percentiles, sellers, examples); §6 authoring+gates → Task 6 (lean rules, self-match, specificity) + Task 10 (byAge tiers, age-20-below-floor guard) + executed match rates = the specificity table (runs real `evaluateArchetype`; Slovenian-roster match rates appear implicitly via the gap analysis); §7 plans → Tasks 9/10 (entering-21 anchor, soft floors as priorities, forward-sim tiers, monotonicity, full-rule end check, two staff scenarios, finishing deltas, pop-rate sanity); §8 report → Tasks 7/8/10/11/12 (exec summary first, Greece section with above-bronze share, Slovenia gap with age-conditional logic, caveat boxes); §9 library changes → deliberately NOT automated — they are report recommendations for the owner (documented in REPORT via the specificity table exposing e.g. slasher looseness; the explicit §9 list lives in the spec and is re-stated in the report's summary by the executor if desired); §10 artifacts → Tasks 7/12; §11 backlog → CLAUDE.md note (Task 12).
**Known deviations:** (a) §5 salary "as of season-72 start" label — covered by the typical-line salary omission; per-cluster salary p50 was dropped from the table for width, the `Typical:` line carries TSP/height/potential/ST/FT; executor may add salary median to the Typical line (one-liner). (b) §8.5 pops-heatmap for Greece is NOT emitted (the checked-in `greek_deltas.csv` serves the purpose; a heatmap adds width without decision value — noted here as an intentional cut). (c) Age-20 secondary sheet (spec §6 last bullet) is served by the age-20 tier row + the WARN guard rather than a separate cohort query — the empirical age-20 floors (OD≥11/ID≥12) appear as tier values from simulation instead of a market query, which the spec's own censoring analysis says is the sounder source.
**Type consistency check:** `CohortPlayer`/`Group` (Task 2) used by Tasks 6/7/10; `DefenseFloor` (Task 6) consumed by Tasks 9/11 (same shape incl. `skill` field); `ClusterPlanResult.tiers` `Record<19|20|21, Partial<Record<SkillKey, number>>>` matches `GapCluster.tiers`; `planForCluster` signature identical in Tasks 9/10/11; md helpers used everywhere emit strings only.

## Execution notes for the implementer

- Everything DB is SELECT-only; if a query errors, print it and stop — never "fix" by writing.
- The beam searches are the slow part (~8 clusters × 2 scenarios × 42-week × beam-128). If a full run exceeds ~15 min, lower `beamWidth` to 64 via `OptimizeOptions` for the elite scenario only and note it in the report header.
- `v2/.env.local` must exist (it was restored 2026-08-04 via `vercel env pull`); vitest never needs it (stub URL in vitest.config.ts).
- Season-73 rollover may land mid-implementation (~Aug 13). Nothing here breaks: the cohort is season-pinned. Do NOT bump SEASON until the owner wants the S73 flood analyzed.
```
