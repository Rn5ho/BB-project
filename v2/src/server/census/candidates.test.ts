import { describe, it, expect } from 'vitest';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';

const rows: CandidateRow[] = [
  { bbPlayerId: 1, ageNow: 20, hasFreshFullThisSeason: false, oldestCapture: new Date('2026-01-01') },
  { bbPlayerId: 2, ageNow: 22, hasFreshFullThisSeason: false, oldestCapture: null },        // too old
  { bbPlayerId: 3, ageNow: 18, hasFreshFullThisSeason: true, oldestCapture: new Date('2026-07-01') }, // already fresh
  { bbPlayerId: 4, ageNow: 21, hasFreshFullThisSeason: false, oldestCapture: new Date('2025-01-01') },
  { bbPlayerId: 5, ageNow: null, hasFreshFullThisSeason: false, oldestCapture: null },       // unknown age excluded
];

describe('selectCandidates (default)', () => {
  const out = selectCandidates(rows, {});
  it('keeps 18-21 without a fresh full snapshot', () => expect(out.map((r) => r.bbPlayerId)).toEqual([4, 1]));
  it('orders stalest-first (oldest capture, nulls first)', () => expect(out[0].bbPlayerId).toBe(4));
});

describe('selectCandidates options', () => {
  it('--all includes already-fresh players (still age-gated)', () =>
    expect(selectCandidates(rows, { all: true }).map((r) => r.bbPlayerId).sort()).toEqual([1, 3, 4]));
  it('--max caps the list', () => expect(selectCandidates(rows, { max: 1 }).length).toBe(1));
});

describe('freeSlots', () => {
  it('18 minus protected', () => expect(freeSlots(4)).toBe(14));
  it('never negative', () => expect(freeSlots(20)).toBe(0));
  it('caps at 18', () => expect(freeSlots(0)).toBe(18));
});
