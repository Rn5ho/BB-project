// Horizon targets: project a player "up to the moment they enter season-week
// `week` of their age-`age` season" — train every week from now up to but NOT
// including the target week. The current season week counts as UPCOMING (not yet
// trained): seasonWeekOf buckets by 7-day windows and BB's training update lands
// at the end of the bucket. Consistent with project()'s startWeekOfSeason
// semantics (first plan week trains AT the current week).
export const WEEKS_PER_SEASON = 14;

export interface SeasonPoint {
  age: number;
  week: number; // 1..14
}

export interface PlanBlock {
  trainingId: number;
  weeks: number;
}

/** Absolute week index on the age/season-week grid. */
export function absWeek(p: SeasonPoint): number {
  return p.age * WEEKS_PER_SEASON + (p.week - 1);
}

export function fromAbsWeek(a: number): SeasonPoint {
  return { age: Math.floor(a / WEEKS_PER_SEASON), week: (a % WEEKS_PER_SEASON) + 1 };
}

/** Training weeks from `now` up to (excluding) `target`, clamped ≥ 0. */
export function horizonWeeks(now: SeasonPoint, target: SeasonPoint): number {
  return Math.max(0, absWeek(target) - absWeek(now));
}

export interface HorizonPreset {
  key: string;
  name: string;
  target: SeasonPoint;
}

/** Horizon targets are bounded at entering age 22 (savePlan validates the same range). */
export const MAX_HORIZON_AGE = 22;

/** Quick presets for the picker. A preset may lie in the past for an old player —
 *  horizonWeeks clamps to 0 and the UI explains. Presets whose target would exceed
 *  MAX_HORIZON_AGE (e.g. "end of this season" for a 22-year-old) are omitted so the
 *  picker never offers a value the save validation rejects. */
export function horizonPresets(currentAge: number): HorizonPreset[] {
  return [
    { key: 'start-21', name: 'Start of age-21 season', target: { age: 21, week: 1 } },
    { key: 'end-21', name: 'End of U-21 (age-21 complete)', target: { age: 22, week: 1 } },
    { key: 'end-season', name: 'End of this season', target: { age: currentAge + 1, week: 1 } },
  ].filter((p) => p.target.age <= MAX_HORIZON_AGE);
}

/** Replace the LAST block's weeks with whatever remains of the horizon.
 *  overflowWeeks > 0 = the earlier blocks alone overshoot the target. */
export function fitBlocksToHorizon(
  blocks: PlanBlock[],
  horizon: number,
): { blocks: PlanBlock[]; overflowWeeks: number } {
  if (blocks.length === 0) return { blocks: [], overflowWeeks: 0 };
  const earlier = blocks.slice(0, -1).reduce((a, b) => a + b.weeks, 0);
  const last = blocks[blocks.length - 1];
  return {
    blocks: [...blocks.slice(0, -1).map((b) => ({ ...b })), { ...last, weeks: Math.max(0, horizon - earlier) }],
    overflowWeeks: Math.max(0, earlier - horizon),
  };
}

/** Per-block (age, week) positions walked from `now`. `end` is the point ENTERED
 *  after the block's last week (exclusive end = start of whatever follows). */
export function blockBoundaries(
  blocks: PlanBlock[],
  now: SeasonPoint,
): Array<{ start: SeasonPoint; end: SeasonPoint }> {
  const out: Array<{ start: SeasonPoint; end: SeasonPoint }> = [];
  let cursor = absWeek(now);
  for (const b of blocks) {
    const start = fromAbsWeek(cursor);
    cursor += b.weeks;
    out.push({ start, end: fromAbsWeek(cursor) });
  }
  return out;
}

/** Materialize the horizon-derived last block into the plan's blocks. Identity
 *  when there is no horizon/now/blocks (safe to call unconditionally). */
export function normalizePlan<T extends { blocks: PlanBlock[]; horizon: SeasonPoint | null }>(
  plan: T,
  now: SeasonPoint | null,
): T {
  if (!plan.horizon || !now || plan.blocks.length === 0) return plan;
  return { ...plan, blocks: fitBlocksToHorizon(plan.blocks, horizonWeeks(now, plan.horizon)).blocks };
}
