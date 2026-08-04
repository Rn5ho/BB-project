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

export function silhouette(vectors: number[][], labels: number[]): number {
  const k = new Set(labels).size;
  if (k < 2) return -1;
  const n = vectors.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const byCluster = new Map<number, number[]>();
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const arr = byCluster.get(labels[j]) ?? [];
      arr.push(euclid(vectors[i], vectors[j]));
      byCluster.set(labels[j], arr);
    }
    const own = byCluster.get(labels[i]);
    if (!own || own.length === 0) continue; // singleton contributes 0
    const a = own.reduce((x, y) => x + y, 0) / own.length;
    let b = Infinity;
    for (const [lab, ds] of byCluster) {
      if (lab === labels[i]) continue;
      b = Math.min(b, ds.reduce((x, y) => x + y, 0) / ds.length);
    }
    total += (b - a) / Math.max(a, b);
  }
  return total / n;
}

export function chooseK(vectors: number[][], kMin: number, kMax: number)
  : { k: number; scores: Record<number, number> } {
  const scores: Record<number, number> = {};
  let bestK = kMin, best = -Infinity;
  for (let k = kMin; k <= Math.min(kMax, vectors.length - 1); k++) {
    const s = silhouette(vectors, wardCluster(vectors, k));
    scores[k] = s;
    if (s > best) { best = s; bestK = k; }
  }
  return { k: bestK, scores };
}

export function kmeans(vectors: number[][], k: number, seed: number, restarts = 50)
  : { labels: number[]; inertia: number } {
  const n = vectors.length;
  let bestLabels: number[] = [], bestInertia = Infinity;
  const rng = mulberry32(seed);
  for (let r = 0; r < restarts; r++) {
    // k-means++ init
    const centers: number[][] = [vectors[Math.floor(rng() * n)]];
    while (centers.length < k) {
      const d2 = vectors.map((v) => Math.min(...centers.map((c) => euclid(v, c) ** 2)));
      const sum = d2.reduce((a, b) => a + b, 0);
      let pick = rng() * sum, idx = 0;
      while (pick > d2[idx]) { pick -= d2[idx]; idx++; }
      centers.push(vectors[idx]);
    }
    let labels = new Array<number>(n).fill(0);
    for (let iter = 0; iter < 100; iter++) {
      const next = vectors.map((v) => {
        let bi = 0, bd = Infinity;
        centers.forEach((c, ci) => { const d = euclid(v, c); if (d < bd) { bd = d; bi = ci; } });
        return bi;
      });
      if (next.every((l, i) => l === labels[i]) && iter > 0) break;
      labels = next;
      for (let ci = 0; ci < k; ci++) {
        const members = vectors.filter((_, i) => labels[i] === ci);
        if (members.length === 0) continue;
        centers[ci] = members[0].map((_, d) => mean(members.map((m) => m[d])));
      }
    }
    const inertia = vectors.reduce((a, v, i) => a + euclid(v, centers[labels[i]]) ** 2, 0);
    if (inertia < bestInertia) { bestInertia = inertia; bestLabels = labels; }
  }
  return { labels: bestLabels, inertia: bestInertia };
  function mean(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / xs.length; }
}

/** Pairwise-agreement between two labelings: share of point-pairs classified consistently. */
export function agreement(a: number[], b: number[]): number {
  let same = 0, total = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) {
      total++;
      if ((a[i] === a[j]) === (b[i] === b[j])) same++;
    }
  return total === 0 ? 1 : same / total;
}

export function bootstrapJaccard(vectors: number[][], k: number, rounds: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const base = wardCluster(vectors, k);
  const baseSets = Array.from({ length: k }, (_, c) =>
    new Set(base.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0)));
  const sums = new Array<number>(k).fill(0);
  for (let r = 0; r < rounds; r++) {
    const idx = Array.from({ length: vectors.length }, () => Math.floor(rng() * vectors.length));
    const sampled = new Set(idx);
    const lab = wardCluster(idx.map((i) => vectors[i]), k);
    const bootSets = Array.from({ length: k }, (_, c) => new Set(idx.filter((_, p) => lab[p] === c)));
    baseSets.forEach((bs, c) => {
      // Hennig-style: judge stability on the points the resample actually contains
      const restricted = new Set([...bs].filter((i) => sampled.has(i)));
      let best = 0;
      for (const os of bootSets) {
        const inter = [...restricted].filter((i) => os.has(i)).length;
        const uni = new Set([...restricted, ...os]).size;
        if (uni > 0) best = Math.max(best, inter / uni);
      }
      sums[c] += best;
    });
  }
  return sums.map((s) => s / rounds);
}
