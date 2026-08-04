// Shape-space clustering utilities (spec §4). Deterministic; no Math.random.
import { SKILL_KEYS, type SkillKey } from '../../training/types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shapeVector(skills: Record<SkillKey, number>): number[] {
  const vals = SKILL_KEYS.map((k) => skills[k]);
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.map((v) => v - m);
}

export function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Agglomerative Ward: merge the pair minimizing (|A||B|/(|A|+|B|))·||cA−cB||², cut at k. */
export function wardCluster(vectors: number[][], k: number): number[] {
  const n = vectors.length;
  if (k >= n) return vectors.map((_, i) => i);
  interface C { idx: number[]; centroid: number[] }
  const clusters: C[] = vectors.map((v, i) => ({ idx: [i], centroid: [...v] }));
  const wardD = (a: C, b: C) => {
    const na = a.idx.length, nb = b.idx.length;
    return ((na * nb) / (na + nb)) * euclid(a.centroid, b.centroid) ** 2;
  };
  while (clusters.length > k) {
    let bi = 0, bj = 1, best = Infinity;
    for (let i = 0; i < clusters.length; i++)
      for (let j = i + 1; j < clusters.length; j++) {
        const d = wardD(clusters[i], clusters[j]);
        if (d < best) { best = d; bi = i; bj = j; }
      }
    const [a, b] = [clusters[bi], clusters[bj]];
    const idx = [...a.idx, ...b.idx];
    const centroid = a.centroid.map(
      (v, d) => (v * a.idx.length + b.centroid[d] * b.idx.length) / idx.length,
    );
    clusters.splice(bj, 1); clusters.splice(bi, 1);
    clusters.push({ idx, centroid });
  }
  const labels = new Array<number>(n);
  clusters.forEach((c, ci) => c.idx.forEach((i) => (labels[i] = ci)));
  return labels;
}
