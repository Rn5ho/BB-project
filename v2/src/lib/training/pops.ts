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
