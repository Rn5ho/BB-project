import { describe, it, expect } from 'vitest';
import { mulberry32, shapeVector, euclid, wardCluster, silhouette, chooseK, kmeans, bootstrapJaccard, agreement } from './cluster';

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
