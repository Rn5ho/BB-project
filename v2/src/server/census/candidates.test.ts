import { describe, it, expect } from 'vitest';
import { selectCandidates, freeSlots, type CandidateRow } from './candidates';

const rows: CandidateRow[] = [
  { bbPlayerId: 1, ageNow: 20, hasFreshFullThisSeason: false, oldestCapture: new Date('2026-01-01'), potential: null, salary: null, heightCm: null, tsp: null },
  { bbPlayerId: 2, ageNow: 22, hasFreshFullThisSeason: false, oldestCapture: null, potential: null, salary: null, heightCm: null, tsp: null },        // too old
  { bbPlayerId: 3, ageNow: 18, hasFreshFullThisSeason: true, oldestCapture: new Date('2026-07-01'), potential: null, salary: null, heightCm: null, tsp: null }, // already fresh
  { bbPlayerId: 4, ageNow: 21, hasFreshFullThisSeason: false, oldestCapture: new Date('2025-01-01'), potential: null, salary: null, heightCm: null, tsp: null },
  { bbPlayerId: 5, ageNow: null, hasFreshFullThisSeason: false, oldestCapture: null, potential: null, salary: null, heightCm: null, tsp: null },       // unknown age excluded
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

// ─── Filter tests ─────────────────────────────────────────────────────────────

const filterRows: CandidateRow[] = [
  { bbPlayerId: 10, ageNow: 19, hasFreshFullThisSeason: false, oldestCapture: null, potential: 9, salary: 20000, heightCm: 195, tsp: null },
  { bbPlayerId: 11, ageNow: 20, hasFreshFullThisSeason: false, oldestCapture: null, potential: 6, salary: 50000, heightCm: 180, tsp: null },
  { bbPlayerId: 12, ageNow: 21, hasFreshFullThisSeason: false, oldestCapture: null, potential: null, salary: 15000, heightCm: 210, tsp: null },
  { bbPlayerId: 13, ageNow: 18, hasFreshFullThisSeason: false, oldestCapture: null, potential: 8, salary: null, heightCm: null, tsp: null },
];

describe('minPotential filter', () => {
  it('excludes rows below threshold', () => {
    const out = selectCandidates(filterRows, { minPotential: 8 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([10, 13]);
  });
  it('null-potential EXCLUDED when minPotential is set', () => {
    const out = selectCandidates(filterRows, { minPotential: 1 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(12);
  });
  it('null-potential INCLUDED when minPotential is unset', () => {
    const out = selectCandidates(filterRows, {});
    expect(out.map((r) => r.bbPlayerId)).toContain(12);
  });
});

describe('maxPotential filter', () => {
  it('excludes rows above threshold', () => {
    const out = selectCandidates(filterRows, { maxPotential: 7 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([11]);
  });
  it('null-potential EXCLUDED when maxPotential is set', () => {
    const out = selectCandidates(filterRows, { maxPotential: 10 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(12);
  });
});

describe('maxSalary filter', () => {
  it('excludes rows above threshold', () => {
    const out = selectCandidates(filterRows, { maxSalary: 19000 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([12]);
  });
  it('null-salary EXCLUDED when maxSalary is set', () => {
    const out = selectCandidates(filterRows, { maxSalary: 99999 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(13);
  });
  it('null-salary INCLUDED when maxSalary is unset', () => {
    const out = selectCandidates(filterRows, {});
    expect(out.map((r) => r.bbPlayerId)).toContain(13);
  });
});

describe('minSalary filter', () => {
  it('excludes rows below threshold', () => {
    const out = selectCandidates(filterRows, { minSalary: 20000 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([10, 11]);
  });
  it('null-salary EXCLUDED when minSalary is set', () => {
    const out = selectCandidates(filterRows, { minSalary: 1 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(13);
  });
});

describe('height filter', () => {
  it('minHeight excludes rows below threshold', () => {
    const out = selectCandidates(filterRows, { minHeight: 200 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([12]);
  });
  it('maxHeight excludes rows above threshold', () => {
    const out = selectCandidates(filterRows, { maxHeight: 185 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([11]);
  });
  it('height range works together', () => {
    const out = selectCandidates(filterRows, { minHeight: 185, maxHeight: 200 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([10]);
  });
  it('null-height EXCLUDED when minHeight is set', () => {
    const out = selectCandidates(filterRows, { minHeight: 1 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(13);
  });
  it('null-height EXCLUDED when maxHeight is set', () => {
    const out = selectCandidates(filterRows, { maxHeight: 999 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(13);
  });
  it('null-height INCLUDED when no height filter', () => {
    const out = selectCandidates(filterRows, {});
    expect(out.map((r) => r.bbPlayerId)).toContain(13);
  });
});

describe('age override', () => {
  it('minAge/maxAge replaces the 18-21 default', () => {
    const out = selectCandidates(filterRows, { minAge: 19, maxAge: 20 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([10, 11]);
  });
  it('minAge only widens lower bound', () => {
    const out = selectCandidates(filterRows, { minAge: 20 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([11, 12]);
  });
});

// benchmarkTsp week 1: 18→55, 19→70, 20→83, 21→100
const tspRows: CandidateRow[] = [
  { bbPlayerId: 20, ageNow: 19, hasFreshFullThisSeason: false, oldestCapture: null, potential: 8, salary: 20000, heightCm: 195, tsp: 72 },
  { bbPlayerId: 21, ageNow: 19, hasFreshFullThisSeason: false, oldestCapture: null, potential: 8, salary: 20000, heightCm: 195, tsp: 60 },
  { bbPlayerId: 22, ageNow: 20, hasFreshFullThisSeason: false, oldestCapture: null, potential: 8, salary: 20000, heightCm: 195, tsp: 83 },
  { bbPlayerId: 23, ageNow: 22, hasFreshFullThisSeason: false, oldestCapture: null, potential: 8, salary: 20000, heightCm: 195, tsp: 120 }, // off NT-track ages
  { bbPlayerId: 24, ageNow: 19, hasFreshFullThisSeason: false, oldestCapture: null, potential: 8, salary: 20000, heightCm: 195, tsp: null }, // never captured
];

describe('minTsp filter', () => {
  it('excludes rows below threshold', () => {
    const out = selectCandidates(tspRows, { minTsp: 70 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([20, 22]);
  });
  it('null-TSP EXCLUDED when minTsp is set', () => {
    const out = selectCandidates(tspRows, { minTsp: 1 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(24);
  });
  it('null-TSP INCLUDED when minTsp is unset', () => {
    const out = selectCandidates(tspRows, {});
    expect(out.map((r) => r.bbPlayerId)).toContain(24);
  });
});

describe('ntTrackSlack filter', () => {
  it('slack 0 keeps only at/above the age benchmark', () => {
    // 19yo bench 70 (week 1): tsp 72 passes, 60 fails; 20yo bench 83: tsp 83 passes
    const out = selectCandidates(tspRows, { ntTrackSlack: 0 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([20, 22]);
  });
  it('slack widens the band below the benchmark', () => {
    const out = selectCandidates(tspRows, { ntTrackSlack: 10 });
    expect(out.map((r) => r.bbPlayerId).sort()).toEqual([20, 21, 22]);
  });
  it('seasonWeek interpolates the benchmark upward within the season', () => {
    // 19yo at week 8: bench = 70 + 13*(7/14) = 76.5 → tsp 72 now fails at slack 0
    const out = selectCandidates(tspRows, { ntTrackSlack: 0, seasonWeek: 8 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(20);
  });
  it('null-TSP fails when the filter is set', () => {
    const out = selectCandidates(tspRows, { ntTrackSlack: 100 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(24);
  });
  it('ages without a benchmark fail when the filter is set', () => {
    const out = selectCandidates(tspRows, { maxAge: 22, ntTrackSlack: 100 });
    expect(out.map((r) => r.bbPlayerId)).not.toContain(23);
  });
});

describe('combined filters', () => {
  it('potential + salary together', () => {
    const out = selectCandidates(filterRows, { minPotential: 8, maxSalary: 25000 });
    // bbPlayerId 10: potential=9 >=8, salary=20000 <=25000 → pass
    // bbPlayerId 13: potential=8 >=8, salary=null → EXCLUDED by maxSalary
    expect(out.map((r) => r.bbPlayerId)).toEqual([10]);
  });
  it('max still caps results AFTER filtering', () => {
    const out = selectCandidates(filterRows, { minPotential: 1, max: 1 });
    expect(out.length).toBe(1);
  });
});
