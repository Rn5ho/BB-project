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

const SAME_DAY_DAYS = 0.5;

/** Collapse runs of captures < 12h apart into one snapshot: the run's last timestamp,
 *  per-skill last non-null value. Same-day pairs carry no training window of their own,
 *  but skipping them outright permanently dropped any pop that landed BETWEEN two
 *  same-day captures — merging folds that change into the surrounding windows instead. */
export function collapseSameDaySnaps(snaps: FullSnap[]): FullSnap[] {
  const sorted = [...snaps].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const out: FullSnap[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && (s.capturedAt.getTime() - last.capturedAt.getTime()) / 86_400_000 < SAME_DAY_DAYS) {
      const skills = { ...last.skills };
      for (const k of POP_SKILLS) if (s.skills[k] != null) skills[k] = s.skills[k];
      out[out.length - 1] = { capturedAt: s.capturedAt, skills };
    } else {
      out.push({ capturedAt: s.capturedAt, skills: { ...s.skills } });
    }
  }
  return out;
}

/** Displayed-level changes between consecutive full snapshots. Same-day runs are
 *  merged first (see collapseSameDaySnaps), so windows always span ≥ 12h. */
export function detectPops(snaps: FullSnap[]): PopEvent[] {
  const sorted = collapseSameDaySnaps(snaps);
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
