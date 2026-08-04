export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) throw new Error('quantile of empty array');
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export function mean(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / xs.length; }
export function median(xs: number[]): number { return quantile(xs, 0.5); }
export function histogram(xs: number[]): Record<number, number> {
  const h: Record<number, number> = {};
  for (const x of xs) h[x] = (h[x] ?? 0) + 1;
  return h;
}
