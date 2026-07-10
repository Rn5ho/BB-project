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
