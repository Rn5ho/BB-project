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
