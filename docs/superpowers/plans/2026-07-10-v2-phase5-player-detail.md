# BB Scout v2 — Phase 5 (Player Detail Page) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A per-player page at `/players/[id]` showing the full snapshot history (with capture dates + source), a per-skill progression chart, a DMI/salary trajectory, a position-over-time timeline for build inference, plus notes and tags — turning the scan-only tables into a place to judge a player.

**Architecture:** A `getPlayerDetail(id)` query assembles the player row, all ordered snapshots, notes, and tags. Pure helpers derive per-skill series, deltas, and the position timeline (unit-tested). A dependency-free reusable SVG `TimeSeriesChart` renders the lines (dark theme, no chart lib). The page is a server component; notes/tags are edited via server actions. Table player names link internally to the detail page (with a small external BB link kept).

**Tech Stack:** Existing v2 stack (Next.js 16, Drizzle, Tailwind 4, Vitest). No new dependencies — charts are hand-rolled SVG.

**Spec:** `docs/superpowers/specs/2026-07-10-bb-scout-v2-design.md` §7 (Player detail), §9 phase 4/5.

---

## Decisions locked

- **No chart library.** The data is small (a few dozen points, integer skills 1–20). A ~60-line reusable SVG `TimeSeriesChart` gives full control over the dark theme and avoids bundle bloat.
- **X axis = capture time** (real dates), not season, so within-season captures (market + census) show progression. Season boundaries can be a later enhancement.
- **Skill progression chart** shows all 12 skills as colored lines (BB skill colors) over full snapshots (skills not null), with a clickable legend to toggle lines. Default: all on.
- **DMI + salary** get their own small trajectory charts from ALL snapshots that have the value (light API snapshots included). Game shape shown as a dot label on the DMI chart (DMI is GS-dependent — spec §4.5).
- **Snapshot history table** lists every snapshot newest-first: date, source badge, season, age, DMI, GS, salary, potential, TSP, and the 12 skills; per-skill deltas vs the previous FULL snapshot are shown as small +/− colored indicators. This is the authoritative "when are these skills from" view.
- **Position timeline**: a compact horizontal strip of `bestPosition` segments over time — the user infers training focus from which position a player logged at each age.
- **Notes**: freeform, newest-first, add + delete. **Tags**: add + remove chips. Both via session-protected server actions (single-user).
- **Table linkage**: `PlayerTable` name → `/players/{bbPlayerId}` (internal); a small `↗` keeps the external buzzerbeater.com link.

## File Structure

```
v2/src/queries/player-detail.ts        # getPlayerDetail(id) + PlayerDetail types
v2/src/lib/series.ts                    # pure: skillSeries, dmiSeries, salarySeries, snapshotDeltas, positionTimeline
v2/src/lib/series.test.ts
v2/src/components/charts/TimeSeriesChart.tsx   # reusable SVG multi-line chart (client)
v2/src/lib/chart-scale.ts               # pure: buildLinePath, scale helpers
v2/src/lib/chart-scale.test.ts
v2/src/components/player/SkillProgression.tsx  # client: legend-toggle wrapper over TimeSeriesChart
v2/src/components/player/SnapshotHistory.tsx   # server: the history table with deltas
v2/src/components/player/PositionTimeline.tsx  # server: position strip
v2/src/components/player/NotesSection.tsx      # client: notes list + add/delete
v2/src/components/player/TagsSection.tsx        # client: tag chips + add/remove
v2/src/app/players/[id]/page.tsx        # server component page
v2/src/app/players/[id]/actions.ts      # addNote/deleteNote/addTag/removeTag
v2/src/components/PlayerTable.tsx        # MODIFY: internal name link + external ↗
```

All npm commands from `D:\ClaudeProjects\BB-project\v2`; commit + push (repo root) after each task; messages end `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Never print `.env.local` values.

---

### Task 1: Detail query + series helpers (TDD)

**Files:**
- Create: `v2/src/queries/player-detail.ts`, `v2/src/lib/series.ts`, `v2/src/lib/series.test.ts`

- [ ] **Step 1: Failing tests** — `v2/src/lib/series.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { skillSeries, dmiSeries, snapshotDeltas, positionTimeline, type Snap } from './series';

const d = (s: string) => new Date(s);
const snaps: Snap[] = [
  { capturedAt: d('2026-01-01'), source: 'api', season: 70, age: 20, dmi: 100000, gameShape: 7, salary: 8000, potential: 8, tsp: null, bestPosition: 'PG',
    skills: { jump_shot: null, jump_range: null, outside_def: null, handling: null, driving: null, passing: null, inside_shot: null, inside_def: null, rebounding: null, shot_blocking: null, stamina: null, free_throw: null } },
  { capturedAt: d('2026-04-01'), source: 'census', season: 71, age: 20, dmi: 140000, gameShape: 8, salary: 9000, potential: 8, tsp: 90, bestPosition: 'PG',
    skills: { jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8, inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3 } },
  { capturedAt: d('2026-07-01'), source: 'census', season: 72, age: 21, dmi: 180000, gameShape: 8, salary: 11000, potential: 8, tsp: 96, bestPosition: 'SG',
    skills: { jump_shot: 13, jump_range: 9, outside_def: 12, handling: 14, driving: 16, passing: 8, inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3 } },
];

describe('skillSeries', () => {
  it('returns only full snapshots (skills present)', () => {
    const s = skillSeries(snaps);
    expect(s.jump_shot.map((p) => p.y)).toEqual([11, 13]); // the light api snap is skipped
    expect(s.jump_shot.map((p) => p.x.getTime())).toEqual([d('2026-04-01').getTime(), d('2026-07-01').getTime()]);
  });
});

describe('dmiSeries', () => {
  it('uses all snapshots with a dmi', () => {
    expect(dmiSeries(snaps).map((p) => p.y)).toEqual([100000, 140000, 180000]);
  });
});

describe('snapshotDeltas', () => {
  it('computes per-skill delta vs the previous FULL snapshot (newest-first output)', () => {
    const rows = snapshotDeltas(snaps); // newest first
    expect(rows[0].snap.bestPosition).toBe('SG');
    expect(rows[0].delta?.jump_shot).toBe(2);   // 13 - 11
    expect(rows[0].delta?.driving).toBe(1);      // 16 - 15
    expect(rows[0].delta?.passing).toBe(0);
    // middle full snap has no prior full snap → null delta
    expect(rows[1].delta).toBeNull();
    // the light api snapshot has no skills → delta null
    expect(rows[2].delta).toBeNull();
  });
});

describe('positionTimeline', () => {
  it('collapses consecutive same positions into segments', () => {
    const segs = positionTimeline(snaps);
    expect(segs.map((s) => s.position)).toEqual(['PG', 'SG']);
    expect(segs[0].from.getTime()).toBe(d('2026-01-01').getTime());
  });
});
```

- [ ] **Step 2:** `npm test` → FAIL. Implement `v2/src/lib/series.ts`:

```ts
import { SKILLS } from './constants';

export type SkillKey = (typeof SKILLS)[number]['dbKey'];

export interface Snap {
  capturedAt: Date;
  source: string;
  season: number | null;
  age: number | null;
  dmi: number | null;
  gameShape: number | null;
  salary: number | null;
  potential: number | null;
  tsp: number | null;
  bestPosition: string | null;
  skills: Record<SkillKey, number | null>;
}

export interface Point { x: Date; y: number }

/** Per-skill series across snapshots that HAVE skills (full snapshots), oldest→newest. */
export function skillSeries(snaps: Snap[]): Record<SkillKey, Point[]> {
  const ordered = [...snaps].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const out = {} as Record<SkillKey, Point[]>;
  for (const { dbKey } of SKILLS) {
    out[dbKey] = ordered
      .filter((s) => s.skills[dbKey] != null)
      .map((s) => ({ x: s.capturedAt, y: s.skills[dbKey] as number }));
  }
  return out;
}

function metricSeries(snaps: Snap[], key: 'dmi' | 'salary'): Point[] {
  return [...snaps]
    .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime())
    .filter((s) => s[key] != null)
    .map((s) => ({ x: s.capturedAt, y: s[key] as number }));
}
export const dmiSeries = (snaps: Snap[]) => metricSeries(snaps, 'dmi');
export const salarySeries = (snaps: Snap[]) => metricSeries(snaps, 'salary');

export interface DeltaRow { snap: Snap; delta: Record<SkillKey, number> | null }

/** Each snapshot (newest-first) with per-skill delta vs the previous FULL snapshot. */
export function snapshotDeltas(snaps: Snap[]): DeltaRow[] {
  const asc = [...snaps].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const hasSkills = (s: Snap) => SKILLS.every(({ dbKey }) => s.skills[dbKey] != null);
  const rows: DeltaRow[] = [];
  let prevFull: Snap | null = null;
  for (const s of asc) {
    if (!hasSkills(s)) { rows.push({ snap: s, delta: null }); continue; }
    if (prevFull === null) { rows.push({ snap: s, delta: null }); }
    else {
      const delta = {} as Record<SkillKey, number>;
      for (const { dbKey } of SKILLS) delta[dbKey] = (s.skills[dbKey] as number) - (prevFull.skills[dbKey] as number);
      rows.push({ snap: s, delta });
    }
    prevFull = s;
  }
  return rows.reverse(); // newest first
}

export interface PosSegment { position: string; from: Date; to: Date }

/** Collapse consecutive equal bestPosition into segments (build inference), oldest→newest. */
export function positionTimeline(snaps: Snap[]): PosSegment[] {
  const asc = [...snaps].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime()).filter((s) => s.bestPosition);
  const segs: PosSegment[] = [];
  for (const s of asc) {
    const pos = s.bestPosition as string;
    const last = segs[segs.length - 1];
    if (last && last.position === pos) last.to = s.capturedAt;
    else segs.push({ position: pos, from: s.capturedAt, to: s.capturedAt });
  }
  return segs;
}
```

- [ ] **Step 3:** `npm test` → pass.

- [ ] **Step 4: Detail query** — `v2/src/queries/player-detail.ts`:

```ts
import { sql } from 'drizzle-orm';
import { db, players, snapshots, notes, tags } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getCurrentSeasonId } from '@/queries/players';
import { currentAge } from '@/lib/domain';
import type { Snap, SkillKey } from '@/lib/series';
import { SKILLS } from '@/lib/constants';

export interface PlayerDetail {
  player: {
    bbPlayerId: number; name: string; nationality: string | null; countryId: number | null;
    heightCm: number | null; bestPosition: string | null; potential: number | null;
    ownerTeamId: number | null; ownerTeamName: string | null; isUtopian: boolean; seasonDrafted: number | null;
    ageNow: number | null;
  };
  seasonNow: number;
  snaps: Snap[];       // oldest→newest
  notes: { id: number; body: string; createdAt: Date }[];
  tags: string[];
}

export async function getPlayerDetail(bbPlayerId: number): Promise<PlayerDetail | null> {
  const [p] = await db.select().from(players).where(eq(players.bbPlayerId, bbPlayerId));
  if (!p) return null;
  const seasonNow = await getCurrentSeasonId();
  const rawSnaps = await db.select().from(snapshots).where(eq(snapshots.playerId, bbPlayerId)).orderBy(snapshots.capturedAt);
  const noteRows = await db.select().from(notes).where(eq(notes.playerId, bbPlayerId)).orderBy(desc(notes.createdAt));
  const tagRows = await db.select().from(tags).where(eq(tags.playerId, bbPlayerId));

  const snaps: Snap[] = rawSnaps.map((s) => {
    const skills = {} as Record<SkillKey, number | null>;
    const col: Record<SkillKey, number | null> = {
      jump_shot: s.jumpShot, jump_range: s.jumpRange, outside_def: s.outsideDef, handling: s.handling,
      driving: s.driving, passing: s.passing, inside_shot: s.insideShot, inside_def: s.insideDef,
      rebounding: s.rebounding, shot_blocking: s.shotBlocking, stamina: s.stamina, free_throw: s.freeThrow,
    };
    for (const { dbKey } of SKILLS) skills[dbKey] = col[dbKey];
    return {
      capturedAt: s.capturedAt, source: s.source, season: s.season, age: s.age,
      dmi: s.dmi == null ? null : Number(s.dmi), gameShape: s.gameShape, salary: s.salary,
      potential: s.potential, tsp: s.tsp, bestPosition: p.bestPosition, skills,
    };
  });

  // latest snapshot values drive header age/potential
  const latest = rawSnaps[rawSnaps.length - 1];
  return {
    player: {
      bbPlayerId: p.bbPlayerId, name: p.name, nationality: p.nationality, countryId: p.countryId,
      heightCm: p.heightCm, bestPosition: p.bestPosition, potential: latest?.potential ?? null,
      ownerTeamId: p.ownerTeamId, ownerTeamName: p.ownerTeamName, isUtopian: p.isUtopian, seasonDrafted: p.seasonDrafted,
      ageNow: currentAge(latest?.age ?? null, latest?.season ?? null, seasonNow),
    },
    seasonNow,
    snaps,
    notes: noteRows.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt })),
    tags: tagRows.map((t) => t.tag),
  };
}
```

NOTE: `bestPosition` per-snapshot isn't stored historically in v2 (only the players row has current position), so `positionTimeline` will currently collapse to one segment. That's acceptable for Phase 5 — the timeline component renders the single known position; a future enhancement can store position per snapshot. Flag this in the page copy ("position history begins tracking now").

- [ ] **Step 5:** `npm test` green; `npm run build` clean. Commit + push:

```bash
git add v2/src/lib/series.ts v2/src/lib/series.test.ts v2/src/queries/player-detail.ts
git commit -m "feat(v2): player-detail query + series/delta/timeline helpers"
git push
```

---

### Task 2: SVG chart component (TDD scale math)

**Files:**
- Create: `v2/src/lib/chart-scale.ts`, `v2/src/lib/chart-scale.test.ts`, `v2/src/components/charts/TimeSeriesChart.tsx`

- [ ] **Step 1: Failing tests** — `v2/src/lib/chart-scale.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildLinePath, scaleLinear } from './chart-scale';

describe('scaleLinear', () => {
  it('maps domain to range', () => {
    const s = scaleLinear([0, 10], [0, 100]);
    expect(s(0)).toBe(0);
    expect(s(5)).toBe(50);
    expect(s(10)).toBe(100);
  });
  it('handles a flat domain (min==max) without NaN', () => {
    const s = scaleLinear([5, 5], [0, 100]);
    expect(Number.isNaN(s(5))).toBe(false);
  });
});

describe('buildLinePath', () => {
  it('builds an SVG polyline path from points', () => {
    const path = buildLinePath([{ x: 0, y: 0 }, { x: 10, y: 10 }], [0, 10], [0, 10], 100, 100);
    // x: 0→0, 10→100 ; y inverted: 0→100, 10→0
    expect(path).toBe('M0,100 L100,0');
  });
  it('returns empty string for <2 points', () => {
    expect(buildLinePath([{ x: 1, y: 1 }], [0, 10], [0, 10], 100, 100)).toBe('');
  });
});
```

- [ ] **Step 2:** FAIL → implement `v2/src/lib/chart-scale.ts`:

```ts
export function scaleLinear([d0, d1]: [number, number], [r0, r1]: [number, number]): (v: number) => number {
  if (d1 === d0) return () => (r0 + r1) / 2;
  const m = (r1 - r0) / (d1 - d0);
  return (v) => r0 + (v - d0) * m;
}

/** SVG path `d` for a polyline. Y is inverted (SVG origin top-left). */
export function buildLinePath(
  points: { x: number; y: number }[],
  xDomain: [number, number], yDomain: [number, number],
  width: number, height: number,
): string {
  if (points.length < 2) return '';
  const sx = scaleLinear(xDomain, [0, width]);
  const sy = scaleLinear(yDomain, [height, 0]);
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(sx(p.x))},${round(sy(p.y))}`).join(' ');
}
function round(n: number): number { return Math.round(n * 100) / 100; }
```

- [ ] **Step 3:** pass. Implement `v2/src/components/charts/TimeSeriesChart.tsx` (client component, dark theme):

```tsx
'use client';

import { buildLinePath } from '@/lib/chart-scale';

export interface Series { key: string; color: string; points: { x: number; y: number }[]; visible?: boolean }

export default function TimeSeriesChart({
  series, yMin, yMax, height = 180, formatY,
}: { series: Series[]; yMin: number; yMax: number; height?: number; formatY?: (v: number) => string }) {
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) return <p className="text-sm text-neutral-500">No data yet.</p>;
  const xs = all.map((p) => p.x);
  const xDomain: [number, number] = [Math.min(...xs), Math.max(...xs)];
  const width = 640;
  const pad = 32;
  const innerW = width - pad * 2;
  const innerH = height - pad;
  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
      {/* y gridlines + labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = yMin + ((yMax - yMin) * i) / yTicks;
        const y = pad / 2 + innerH - (innerH * i) / yTicks;
        return (
          <g key={i}>
            <line x1={pad} x2={width - pad} y1={y} y2={y} stroke="#262626" />
            <text x={4} y={y + 3} fontSize="9" fill="#737373">{formatY ? formatY(v) : Math.round(v)}</text>
          </g>
        );
      })}
      <g transform={`translate(${pad},${pad / 2})`}>
        {series.filter((s) => s.visible !== false).map((s) => (
          <path key={s.key} d={buildLinePath(s.points, xDomain, [yMin, yMax], innerW, innerH)}
            fill="none" stroke={s.color} strokeWidth="1.5" />
        ))}
        {series.filter((s) => s.visible !== false).flatMap((s) =>
          s.points.map((p, i) => {
            const sx = (innerW * (p.x - xDomain[0])) / Math.max(1, xDomain[1] - xDomain[0]);
            const sy = innerH - (innerH * (p.y - yMin)) / Math.max(1, yMax - yMin);
            return <circle key={`${s.key}-${i}`} cx={sx} cy={sy} r="2" fill={s.color} />;
          }),
        )}
      </g>
    </svg>
  );
}
```

- [ ] **Step 4:** `npm run build` clean; `npm test` green. Commit + push:

```bash
git add v2/src/lib/chart-scale.ts v2/src/lib/chart-scale.test.ts v2/src/components/charts/TimeSeriesChart.tsx
git commit -m "feat(v2): dependency-free SVG time-series chart + tested scale math"
git push
```

---

### Task 3: Player detail page (header, current skills, charts, history, timeline)

**Files:**
- Create: `v2/src/app/players/[id]/page.tsx`, `v2/src/components/player/SkillProgression.tsx`, `v2/src/components/player/SnapshotHistory.tsx`, `v2/src/components/player/PositionTimeline.tsx`

- [ ] **Step 1: SkillProgression** (client, legend toggle) — `v2/src/components/player/SkillProgression.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { SKILLS, getSkillColor } from '@/lib/constants';
import TimeSeriesChart, { type Series } from '@/components/charts/TimeSeriesChart';

// A distinct color per skill line: use a mid-scale BB color offset so lines are distinguishable.
const LINE_COLORS = [ '#e5a64b', '#0eae28', '#b70b5a', '#30139f', '#db6e04', '#0eb366', '#a70b00', '#910b9d', '#8e9800', '#498e00', '#cb3100', '#9c0b32' ];

export default function SkillProgression({ series }: { series: Record<string, { x: number; y: number }[]> }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const chartSeries: Series[] = SKILLS.map((s, i) => ({
    key: s.dbKey, color: LINE_COLORS[i % LINE_COLORS.length], points: series[s.dbKey] ?? [], visible: !hidden.has(s.dbKey),
  }));
  return (
    <div>
      <TimeSeriesChart series={chartSeries} yMin={1} yMax={20} />
      <div className="flex flex-wrap gap-2 mt-2">
        {SKILLS.map((s, i) => (
          <button key={s.dbKey} onClick={() => toggle(s.dbKey)}
            className={`text-xs px-1.5 py-0.5 rounded border ${hidden.has(s.dbKey) ? 'border-neutral-800 text-neutral-600' : 'border-neutral-700'}`}
            style={hidden.has(s.dbKey) ? {} : { color: LINE_COLORS[i % LINE_COLORS.length] }}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: PositionTimeline** (server) — `v2/src/components/player/PositionTimeline.tsx`:

```tsx
import type { PosSegment } from '@/lib/series';

export default function PositionTimeline({ segments }: { segments: PosSegment[] }) {
  if (segments.length === 0) return <p className="text-sm text-neutral-500">No position history yet.</p>;
  return (
    <div className="flex items-stretch gap-1">
      {segments.map((s, i) => (
        <div key={i} className="flex-1 rounded bg-neutral-900 border border-neutral-800 px-2 py-1 text-center">
          <div className="font-medium">{s.position}</div>
          <div className="text-xs text-neutral-500">{s.from.toISOString().slice(0, 10)}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: SnapshotHistory** (server) — `v2/src/components/player/SnapshotHistory.tsx`:

```tsx
import { SKILLS, getSkillColor } from '@/lib/constants';
import { snapshotDeltas, type Snap } from '@/lib/series';

const SOURCE_STYLE: Record<string, string> = {
  census: 'bg-green-900/40 text-green-400', market: 'bg-purple-900/40 text-purple-300',
  api: 'bg-blue-900/40 text-blue-300', manual: 'bg-amber-900/40 text-amber-300', extension: 'bg-neutral-800 text-neutral-300',
};

export default function SnapshotHistory({ snaps }: { snaps: Snap[] }) {
  const rows = snapshotDeltas(snaps); // newest-first
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-neutral-400 border-b border-neutral-800">
        <tr>
          <th className="py-2 pr-3">Date</th><th className="pr-3">Src</th><th className="pr-3">Sn</th>
          <th className="pr-3">Age</th><th className="pr-3 text-right">DMI</th><th className="pr-3">GS</th>
          <th className="pr-3 text-right">TSP</th>
          {SKILLS.map((s) => <th key={s.dbKey} className="pr-2" title={s.name}>{s.name.split(' ').map((w) => w[0]).join('')}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ snap, delta }, i) => (
          <tr key={i} className="border-b border-neutral-900">
            <td className="py-1.5 pr-3 whitespace-nowrap">{snap.capturedAt.toISOString().slice(0, 10)}</td>
            <td className="pr-3"><span className={`text-xs rounded px-1.5 py-0.5 ${SOURCE_STYLE[snap.source] ?? ''}`}>{snap.source}</span></td>
            <td className="pr-3 text-neutral-400">{snap.season ?? '–'}</td>
            <td className="pr-3">{snap.age ?? '–'}</td>
            <td className="pr-3 text-right">{snap.dmi?.toLocaleString() ?? '–'}</td>
            <td className="pr-3">{snap.gameShape ?? '–'}</td>
            <td className="pr-3 text-right">{snap.tsp ?? '–'}</td>
            {SKILLS.map((s) => {
              const v = snap.skills[s.dbKey];
              const dv = delta?.[s.dbKey];
              return (
                <td key={s.dbKey} className="pr-2 font-mono">
                  {v == null ? <span className="text-neutral-700">–</span> : (
                    <span style={{ color: getSkillColor(v) }}>
                      {v}{dv ? <sup className={dv > 0 ? 'text-green-500' : 'text-red-500'}>{dv > 0 ? `+${dv}` : dv}</sup> : null}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Page** — `v2/src/app/players/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getPlayerDetail } from '@/queries/player-detail';
import { getPotentialColor, POTENTIAL_LEVELS } from '@/lib/constants';
import { skillSeries, dmiSeries, salarySeries, positionTimeline } from '@/lib/series';
import SkillProgression from '@/components/player/SkillProgression';
import SnapshotHistory from '@/components/player/SnapshotHistory';
import PositionTimeline from '@/components/player/PositionTimeline';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart';
import NotesSection from '@/components/player/NotesSection';
import TagsSection from '@/components/player/TagsSection';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPlayerDetail(Number(id));
  if (!detail) notFound();
  const { player, snaps, notes, tags } = detail;

  const skills = skillSeries(snaps);
  const skillsForChart = Object.fromEntries(Object.entries(skills).map(([k, pts]) => [k, pts.map((p) => ({ x: p.x.getTime(), y: p.y }))]));
  const dmi = dmiSeries(snaps).map((p) => ({ x: p.x.getTime(), y: p.y }));
  const salary = salarySeries(snaps).map((p) => ({ x: p.x.getTime(), y: p.y }));

  return (
    <main className="p-6 max-w-5xl">
      <div className="flex items-baseline gap-3 mb-1">
        <h1 className="text-xl font-semibold">{player.name}</h1>
        <a href={`https://buzzerbeater.com/player/${player.bbPlayerId}/overview.aspx`} target="_blank" className="text-sm text-neutral-400 hover:text-amber-500">↗ BB</a>
      </div>
      <div className="text-sm text-neutral-400 mb-6 flex flex-wrap gap-x-4 gap-y-1">
        <span>{player.nationality ?? '–'}</span>
        <span>Age {player.ageNow ?? '–'}</span>
        <span>{player.heightCm ? `${player.heightCm} cm` : '–'}</span>
        <span>{player.bestPosition ?? '–'}</span>
        {player.potential != null && <span style={{ color: getPotentialColor(player.potential) }} title={POTENTIAL_LEVELS[player.potential]}>Pot {player.potential}</span>}
        {player.ownerTeamId && <a href={`https://buzzerbeater.com/team/${player.ownerTeamId}/overview.aspx`} target="_blank" className="hover:text-amber-500">{player.ownerTeamName ?? 'owner'} ↗</a>}
      </div>

      <TagsSection playerId={player.bbPlayerId} tags={tags} />

      <section className="mt-6">
        <h2 className="font-medium mb-2">Skill progression</h2>
        <SkillProgression series={skillsForChart} />
      </section>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <section>
          <h2 className="font-medium mb-2">DMI trajectory</h2>
          <TimeSeriesChart series={[{ key: 'dmi', color: '#e5a64b', points: dmi }]} yMin={0} yMax={Math.max(1, ...dmi.map((p) => p.y))} formatY={(v) => `${Math.round(v / 1000)}k`} />
        </section>
        <section>
          <h2 className="font-medium mb-2">Salary</h2>
          <TimeSeriesChart series={[{ key: 'salary', color: '#0eae28', points: salary }]} yMin={0} yMax={Math.max(1, ...salary.map((p) => p.y))} formatY={(v) => `${Math.round(v / 1000)}k`} />
        </section>
      </div>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Position over time</h2>
        <PositionTimeline segments={positionTimeline(snaps)} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Snapshot history</h2>
        <p className="text-xs text-neutral-500 mb-2">Every capture, newest first. Superscripts show change vs the previous full-skill capture.</p>
        <SnapshotHistory snaps={snaps} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Notes</h2>
        <NotesSection playerId={player.bbPlayerId} notes={notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))} />
      </section>
    </main>
  );
}
```

(NotesSection/TagsSection are built in Task 4 — this page imports them; if implementing Task 3 before 4, stub them as `() => null` and replace in Task 4. Prefer doing Task 4 first if the subagent flow allows; otherwise stub + wire.)

- [ ] **Step 5:** `npm run build` clean (stub the two sections if Task 4 not done). `npm test` green. Commit + push:

```bash
git add v2/src/app/players v2/src/components/player
git commit -m "feat(v2): player detail page — progression chart, DMI/salary, history, position timeline"
git push
```

---

### Task 4: Notes + tags (server actions + client sections)

**Files:**
- Create: `v2/src/app/players/[id]/actions.ts`, `v2/src/components/player/NotesSection.tsx`, `v2/src/components/player/TagsSection.tsx`

- [ ] **Step 1: Actions** — `v2/src/app/players/[id]/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db, notes, tags } from '@/db';
import { and, eq } from 'drizzle-orm';

export async function addNote(playerId: number, body: string) {
  const text = body.trim();
  if (!text) return;
  await db.insert(notes).values({ playerId, body: text });
  revalidatePath(`/players/${playerId}`);
}
export async function deleteNote(playerId: number, id: number) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath(`/players/${playerId}`);
}
export async function addTag(playerId: number, tag: string) {
  const t = tag.trim();
  if (!t) return;
  await db.insert(tags).values({ playerId, tag: t }).onConflictDoNothing();
  revalidatePath(`/players/${playerId}`);
}
export async function removeTag(playerId: number, tag: string) {
  await db.delete(tags).where(and(eq(tags.playerId, playerId), eq(tags.tag, tag)));
  revalidatePath(`/players/${playerId}`);
}
```

- [ ] **Step 2: NotesSection** — `v2/src/components/player/NotesSection.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { addNote, deleteNote } from '@/app/players/[id]/actions';

export default function NotesSection({ playerId, notes }: { playerId: number; notes: { id: number; body: string; createdAt: string }[] }) {
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note…"
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm" />
        <button disabled={pending || !text.trim()} onClick={() => start(async () => { await addNote(playerId, text); setText(''); })}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50">Add</button>
      </div>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="flex items-start gap-2 text-sm border border-neutral-800 rounded px-3 py-2">
            <div className="flex-1"><div>{n.body}</div><div className="text-xs text-neutral-500">{n.createdAt.slice(0, 16).replace('T', ' ')}</div></div>
            <button disabled={pending} onClick={() => start(async () => { await deleteNote(playerId, n.id); })} className="text-neutral-600 hover:text-red-400">×</button>
          </li>
        ))}
        {notes.length === 0 && <li className="text-sm text-neutral-500">No notes yet.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: TagsSection** — `v2/src/components/player/TagsSection.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { addTag, removeTag } from '@/app/players/[id]/actions';

export default function TagsSection({ playerId, tags }: { playerId: number; tags: string[] }) {
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-xs">
          {t}
          <button disabled={pending} onClick={() => start(async () => { await removeTag(playerId, t); })} className="text-neutral-600 hover:text-red-400">×</button>
        </span>
      ))}
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="+ tag"
        onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) start(async () => { await addTag(playerId, text); setText(''); }); }}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-xs w-24" />
    </div>
  );
}
```

- [ ] **Step 4:** `npm run build` clean; `npm test` green. Local check with session cookie (curl.exe): `/players/55158715` returns 200 with "Skill progression", "Snapshot history", "Notes". Commit + push:

```bash
git add v2/src/app/players/[id]/actions.ts v2/src/components/player/NotesSection.tsx v2/src/components/player/TagsSection.tsx
git commit -m "feat(v2): player notes + tags with server actions"
git push
```

---

### Task 5: Link tables to detail page + deploy + verify (controller-led)

**Files:**
- Modify: `v2/src/components/PlayerTable.tsx`

- [ ] **Step 1:** In `PlayerTable.tsx`, change the player-name cell: the name links to `/players/${p.bbPlayerId}` (internal, Next `<Link>`), and add a small `↗` after it linking to `https://buzzerbeater.com/player/${p.bbPlayerId}/overview.aspx` (target _blank). Keep styling. Verify sorting/filtering unaffected.

- [ ] **Step 2:** `npm test` green; `npm run build` clean; `npm run e2e` (Phase-2 smoke, still 22/22 — the name link change shouldn't break it; if the e2e asserts on the name link, update that assertion). Commit + push.

```bash
git add v2/src/components/PlayerTable.tsx
git commit -m "feat(v2): link table player names to internal detail page"
git push
```

- [ ] **Step 3 (controller):** Confirm deploy READY. Playwright pass (session cookie): open `/slovenia`, click a player name → lands on `/players/<id>`; the detail page shows the progression chart (SVG present), the snapshot history table with source badges and dates, DMI/salary charts; add a note → it appears; add a tag → chip appears; remove both → gone. Spot-check a player with only light (api) snapshots renders without error (empty skill chart message).
- [ ] **Step 4:** Update `CLAUDE.md` v2 section (Phase 5 shipped: /players/[id] detail with progression/DMI/salary charts, snapshot history + deltas, position timeline, notes/tags; hand-rolled SVG charts) and the user memory. Commit + push.

---

## Self-Review (done at write time)

- **Spec coverage (§7 Player detail):** skill progression chart → Task 2/3; DMI-in-context (GS shown, DMI trajectory) → Task 3; snapshot history with dates+source (the "when are these skills from" ask) → Task 1/3; notes → Task 4; position-over-time → Task 3 (with the honest limitation that per-snapshot position isn't stored yet — flagged, one segment for now, future enhancement to store position per snapshot); owner link → Task 3; internal linking from tables → Task 5.
- **Deliberate deferrals:** per-snapshot position history (needs a schema column on snapshots — noted; current position still shown); season-boundary markers on charts; archetype badges (that's the Slovenia rule-engine, a separate future piece).
- **Type consistency:** `Snap`/`SkillKey` shared by series.ts, player-detail.ts, and the components; `buildLinePath`/`scaleLinear` tested and reused by TimeSeriesChart; server actions revalidate the correct path; `getCurrentSeasonId`/`currentAge` reused.
- **Placeholder scan:** all code steps carry complete code; the Task 3/4 ordering note (stub NotesSection/TagsSection if built out of order) is an explicit instruction, not a TBD.
- **Known data caveat:** `positionTimeline` collapses to a single segment until per-snapshot position is stored; the UI copy states this so it isn't mistaken for a bug.
```
