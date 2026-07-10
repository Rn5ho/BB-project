export interface CandidateRow {
  bbPlayerId: number;
  ageNow: number | null;
  hasFreshFullThisSeason: boolean;
  oldestCapture: Date | null; // oldest snapshot date (stalest first); null = never fully captured
}

export interface SelectOpts { all?: boolean; max?: number }

const MAX_ROSTER = 18;

export function freeSlots(protectedCount: number): number {
  return Math.max(0, Math.min(MAX_ROSTER, MAX_ROSTER - protectedCount));
}

export function selectCandidates(rows: CandidateRow[], opts: SelectOpts): CandidateRow[] {
  let out = rows.filter((r) => r.ageNow != null && r.ageNow >= 18 && r.ageNow <= 21);
  if (!opts.all) out = out.filter((r) => !r.hasFreshFullThisSeason);
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
