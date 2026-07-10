export interface CandidateRow {
  bbPlayerId: number;
  ageNow: number | null;
  hasFreshFullThisSeason: boolean;
  oldestCapture: Date | null; // oldest snapshot date (stalest first); null = never fully captured
  potential: number | null;
  salary: number | null;
  heightCm: number | null;
}

export interface SelectOpts {
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
}

const MAX_ROSTER = 18;

export function freeSlots(protectedCount: number): number {
  return Math.max(0, Math.min(MAX_ROSTER, MAX_ROSTER - protectedCount));
}

export function selectCandidates(rows: CandidateRow[], opts: SelectOpts): CandidateRow[] {
  const minAge = opts.minAge ?? 18;
  const maxAge = opts.maxAge ?? 21;

  let out = rows.filter((r) => r.ageNow != null && r.ageNow >= minAge && r.ageNow <= maxAge);
  if (!opts.all) out = out.filter((r) => !r.hasFreshFullThisSeason);

  // Potential filters: null FAILS when filter is set
  if (opts.minPotential != null) out = out.filter((r) => r.potential != null && r.potential >= opts.minPotential!);
  if (opts.maxPotential != null) out = out.filter((r) => r.potential != null && r.potential <= opts.maxPotential!);

  // Salary filters: null FAILS when filter is set
  if (opts.minSalary != null) out = out.filter((r) => r.salary != null && r.salary >= opts.minSalary!);
  if (opts.maxSalary != null) out = out.filter((r) => r.salary != null && r.salary <= opts.maxSalary!);

  // Height filters: null FAILS when filter is set
  if (opts.minHeight != null) out = out.filter((r) => r.heightCm != null && r.heightCm >= opts.minHeight!);
  if (opts.maxHeight != null) out = out.filter((r) => r.heightCm != null && r.heightCm <= opts.maxHeight!);

  // stalest first: never-captured (null) before oldest date
  out.sort((a, b) => {
    if (a.oldestCapture === null && b.oldestCapture === null) return a.bbPlayerId - b.bbPlayerId;
    if (a.oldestCapture === null) return -1;
    if (b.oldestCapture === null) return 1;
    return a.oldestCapture.getTime() - b.oldestCapture.getTime();
  });
  if (opts.max != null) out = out.slice(0, opts.max);
  return out;
}
