import type { SkillKey } from './types';

export interface PopAnchor {
  skill: SkillKey;
  toDisplayed: number;
  windowStart: Date; // earliest possible pop moment
  windowEnd: Date;   // snapshot that first showed the new value
}

export interface SublevelBound { low: number; high: number } // engine scale, within (d−1, d)

/** Upper envelope of one skill's weekly gain: BBSCOUT_HIGH primary rates (0.575–0.69)
 *  with typical height (≤1.3) and staff multipliers. Pathological stacks (175cm + YT7 +
 *  coach 7 + big elastic) can exceed this — per-skill model-derived caps are the
 *  principled upgrade. */
export const MAX_WEEKLY_GAIN = 0.90;

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
