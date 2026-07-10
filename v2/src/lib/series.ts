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
