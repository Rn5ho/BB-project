export type CensusFilters = {
  all?: boolean;
  max?: number;
  minAge?: number;
  maxAge?: number;
  minPotential?: number;
  maxPotential?: number;
  minSalary?: number;
  maxSalary?: number;
  minHeight?: number;
  maxHeight?: number;
};

export type CensusTotals = {
  captured?: number;
  failed?: number;
  filters?: CensusFilters;
  opts?: CensusFilters & { confirmed?: boolean; clearRoster?: boolean };
  candidateCount?: number;
  originalRoster?: unknown;
} | null;

function getFilters(totals: CensusTotals): CensusFilters | null {
  if (!totals) return null;
  // Run-time totals use `filters`; enqueued opts use `opts`
  return totals.filters ?? totals.opts ?? null;
}

export function formatCensusFilters(totals: CensusTotals): string {
  const f = getFilters(totals);
  if (!f) return '—';

  const parts: string[] = [];

  if (f.all) parts.push('all (re-scout)');

  if (f.minPotential != null && f.maxPotential != null) {
    parts.push(`pot ${f.minPotential}-${f.maxPotential}`);
  } else if (f.minPotential != null) {
    parts.push(`pot≥${f.minPotential}`);
  } else if (f.maxPotential != null) {
    parts.push(`pot≤${f.maxPotential}`);
  }

  if (f.minAge != null && f.maxAge != null) {
    parts.push(`age ${f.minAge}-${f.maxAge}`);
  } else if (f.minAge != null) {
    parts.push(`age ≥${f.minAge}`);
  } else if (f.maxAge != null) {
    parts.push(`age ≤${f.maxAge}`);
  }

  if (f.minSalary != null && f.maxSalary != null) {
    parts.push(`salary ${f.minSalary}-${f.maxSalary}`);
  } else if (f.minSalary != null) {
    parts.push(`salary ≥${f.minSalary}`);
  } else if (f.maxSalary != null) {
    parts.push(`salary ≤${f.maxSalary}`);
  }

  if (f.minHeight != null && f.maxHeight != null) {
    parts.push(`ht ${f.minHeight}-${f.maxHeight} cm`);
  } else if (f.minHeight != null) {
    parts.push(`ht ≥${f.minHeight} cm`);
  } else if (f.maxHeight != null) {
    parts.push(`ht ≤${f.maxHeight} cm`);
  }

  if (totals?.candidateCount != null) {
    parts.push(`${totals.candidateCount} cands`);
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function formatCensusResult(totals: CensusTotals): string {
  if (!totals) return '—';
  if (totals.captured == null && totals.failed == null) return '—';
  const captured = totals.captured ?? 0;
  const failed = totals.failed ?? 0;
  return `${captured} ✓ / ${failed} ✗`;
}
