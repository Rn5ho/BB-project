import { describe, expect, it } from 'vitest';
import { collapseSameDaySnaps, detectPops, type FullSnap } from './pops';

const d = (s: string) => new Date(s);
const snap = (iso: string, skills: FullSnap['skills']): FullSnap => ({ capturedAt: d(iso), skills });

describe('detectPops', () => {
  it('emits a pop between consecutive snapshots with window metadata', () => {
    const events = detectPops([
      snap('2026-06-01T00:00:00Z', { js: 7, dr: 10 }),
      snap('2026-06-15T00:00:00Z', { js: 8, dr: 10 }),
    ]);
    expect(events).toEqual([{
      skill: 'js', toDisplayed: 8, delta: 1,
      windowStart: d('2026-06-01T00:00:00Z'), windowEnd: d('2026-06-15T00:00:00Z'), windowWeeks: 2,
    }]);
  });

  it('emits drops with negative delta and multi-level deltas', () => {
    const events = detectPops([
      snap('2026-06-01T00:00:00Z', { st: 6, is: 5 }),
      snap('2026-06-29T00:00:00Z', { st: 5, is: 7 }),
    ]);
    expect(events).toContainEqual(expect.objectContaining({ skill: 'st', delta: -1, toDisplayed: 5 }));
    expect(events).toContainEqual(expect.objectContaining({ skill: 'is', delta: 2, toDisplayed: 7, windowWeeks: 4 }));
  });

  it('skips null skills and same values; sorts unsorted input', () => {
    const events = detectPops([
      snap('2026-06-10T08:00:00Z', { js: 8, od: 5 }),   // out of order on purpose
      snap('2026-06-01T00:00:00Z', { js: 7, od: null }),
    ]);
    expect(events).toEqual([expect.objectContaining({ skill: 'js', toDisplayed: 8, delta: 1, windowWeeks: 1 })]);
  });

  it('folds a pop between two same-day captures into the surrounding window', () => {
    const events = detectPops([
      snap('2026-06-01T00:00:00Z', { js: 7 }),
      snap('2026-06-10T08:00:00Z', { js: 8 }),
      snap('2026-06-10T09:00:00Z', { js: 9 }),  // popped between the same-day pair — previously dropped forever
    ]);
    expect(events).toEqual([expect.objectContaining({
      skill: 'js', toDisplayed: 9, delta: 2, windowEnd: d('2026-06-10T09:00:00Z'), windowWeeks: 1,
    })]);
  });

  it('short window still counts as 1 week', () => {
    const events = detectPops([
      snap('2026-06-01T00:00:00Z', { rb: 4 }),
      snap('2026-06-03T00:00:00Z', { rb: 5 }),
    ]);
    expect(events[0].windowWeeks).toBe(1);
  });
});

describe('collapseSameDaySnaps', () => {
  it('merges runs < 12h apart: last timestamp wins, per-skill last non-null', () => {
    const out = collapseSameDaySnaps([
      snap('2026-06-10T08:00:00Z', { js: 8, od: 5 }),
      snap('2026-06-10T09:00:00Z', { js: 9, od: null }),
    ]);
    expect(out).toEqual([{ capturedAt: d('2026-06-10T09:00:00Z'), skills: { js: 9, od: 5 } }]);
  });

  it('leaves gaps of 12h or more alone', () => {
    const out = collapseSameDaySnaps([
      snap('2026-06-01T00:00:00Z', { js: 7 }),
      snap('2026-06-02T00:00:00Z', { js: 8 }),
    ]);
    expect(out).toHaveLength(2);
  });
});
