'use server';

import { revalidatePath } from 'next/cache';
import { db, censusRuns } from '@/db';

export interface EnqueueOpts {
  minAge?: number;
  maxAge?: number;
  minPotential?: number;
  maxPotential?: number;
  minSalary?: number;
  maxSalary?: number;
  minHeight?: number;
  maxHeight?: number;
  all?: boolean;
  clearRoster?: boolean;
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
    revalidatePath('/census');
    return { ok: true, runId: row.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
