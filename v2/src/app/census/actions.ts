'use server';

import { revalidatePath } from 'next/cache';
import { db, censusRuns } from '@/db';
import { getCurrentSeasonId } from '@/queries/players';
import { benchmarkTsp } from '@/lib/training/benchmarks';
import { selectCandidates } from '@/server/census/candidates';
import { loadCandidateRows, currentSeasonWeek, lastKnownRoster } from '@/server/census/candidate-rows';

export interface EnqueueOpts {
  minAge?: number;
  maxAge?: number;
  minPotential?: number;
  maxPotential?: number;
  minSalary?: number;
  maxSalary?: number;
  minHeight?: number;
  maxHeight?: number;
  minTsp?: number;
  ntTrackSlack?: number;
  all?: boolean;
  clearRoster?: boolean;
}

/**
 * Nudge the Hetzner worker to claim the row now. Best-effort: if the box is
 * unreachable the worker's safety poll picks the run up on its next pass.
 */
async function wakeWorker(): Promise<void> {
  const url = process.env.CENSUS_WAKE_URL;
  const secret = process.env.CENSUS_WAKE_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.warn('[census] wake failed; safety poll will pick the run up:', e);
  }
}

export async function enqueueCensus(
  opts: EnqueueOpts,
  offseasonConfirm: string,
): Promise<{ ok: true; runId: number } | { ok: false; error: string }> {
  if (offseasonConfirm.trim().toUpperCase() !== 'OFFSEASON') {
    return {
      ok: false,
      error:
        'Type OFFSEASON to confirm — dismissals cost NT enthusiasm; run off-season only.',
    };
  }
  try {
    const [row] = await db
      .insert(censusRuns)
      .values({ status: 'requested', totals: { opts: { ...opts, confirmed: true } } })
      .returning({ id: censusRuns.id });
    await wakeWorker();
    revalidatePath('/census');
    return { ok: true, runId: row.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export interface PreviewCandidate {
  bbPlayerId: number;
  name: string | null;
  ageNow: number | null;
  potential: number | null;
  salary: number | null;
  heightCm: number | null;
  tsp: number | null;
  /** TSP minus the NT-track benchmark for the player's age at the current week (+ = ahead). */
  benchDelta: number | null;
  lastFullCapture: string | null;
  /** On the last known NT roster → protected: skipped by the run unless "Clear roster" is used. */
  rostered: boolean;
}

export interface PreviewResult {
  ok: true;
  season: number;
  seasonWeek: number;
  totalSlovenian: number;
  rosteredCount: number;
  candidates: PreviewCandidate[];
}

/** DB-only preview of which players the given filters would census. No browser, no roster
 *  actions — safe to call freely while tuning filters. */
export async function previewCensus(
  opts: EnqueueOpts,
): Promise<PreviewResult | { ok: false; error: string }> {
  try {
    const season = await getCurrentSeasonId();
    const [rows, seasonWeek, roster] = await Promise.all([
      loadCandidateRows(season),
      currentSeasonWeek(season),
      lastKnownRoster(),
    ]);
    const selected = selectCandidates(rows, { ...opts, seasonWeek });
    const rosterSet = new Set(roster);
    const candidates = selected.map((r) => ({
      bbPlayerId: r.bbPlayerId,
      name: r.name,
      ageNow: r.ageNow,
      potential: r.potential,
      salary: r.salary,
      heightCm: r.heightCm,
      tsp: r.tsp,
      benchDelta:
        r.tsp != null && r.ageNow != null && benchmarkTsp(r.ageNow, seasonWeek) != null
          ? Math.round((r.tsp - benchmarkTsp(r.ageNow, seasonWeek)!) * 10) / 10
          : null,
      lastFullCapture: r.lastFullCapture ? r.lastFullCapture.toISOString() : null,
      rostered: rosterSet.has(r.bbPlayerId),
    }));
    return {
      ok: true,
      season,
      seasonWeek,
      totalSlovenian: rows.length,
      rosteredCount: candidates.filter((c) => c.rostered).length,
      candidates,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
