'use server';

import { revalidatePath } from 'next/cache';
import { db, selfTrainerConfig } from '@/db';
import { runSelfTrainer } from '@/server/sync/self-trainer';
import { requireOwner } from '@/lib/session';

export interface SelfTrainerConfigInput {
  teamId: number;
  switchTeam: boolean;
  coachLevel: number;
  youthTrainerLevel: number;
  gymLevel: number;
  trainingCourtLevel: number;
}

export async function saveSelfTrainerConfig(input: SelfTrainerConfigInput) {
  await requireOwner();
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));
  const values = {
    teamId: Math.round(input.teamId),
    switchTeam: input.switchTeam,
    coachLevel: clamp(input.coachLevel, 1, 7),
    youthTrainerLevel: clamp(input.youthTrainerLevel, 0, 7),
    gymLevel: clamp(input.gymLevel, 0, 3),
    trainingCourtLevel: clamp(input.trainingCourtLevel, 0, 3),
    updatedAt: new Date(),
  };
  if (!Number.isFinite(values.teamId) || values.teamId <= 0) {
    return { ok: false as const, error: 'team id must be a positive number' };
  }
  const [existing] = await db.select({ id: selfTrainerConfig.id }).from(selfTrainerConfig).limit(1);
  if (existing) await db.update(selfTrainerConfig).set(values);
  else await db.insert(selfTrainerConfig).values(values);
  revalidatePath('/scorecard');
  return { ok: true as const };
}

export async function runSelfTrainerNow() {
  await requireOwner();
  try {
    const counts = await runSelfTrainer('manual');
    revalidatePath('/scorecard');
    return { ok: true as const, counts };
  } catch (e) {
    revalidatePath('/scorecard');
    return { ok: false as const, error: String(e) };
  }
}
