'use server';

import { revalidatePath } from 'next/cache';
import { db, notes, tags, trainingPlans } from '@/db';
import { and, eq } from 'drizzle-orm';

export async function addNote(playerId: number, body: string) {
  const text = body.trim();
  if (!text) return;
  await db.insert(notes).values({ playerId, body: text });
  revalidatePath(`/players/${playerId}`);
}
export async function deleteNote(playerId: number, id: number) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath(`/players/${playerId}`);
}
export async function addTag(playerId: number, tag: string) {
  const t = tag.trim();
  if (!t) return;
  await db.insert(tags).values({ playerId, tag: t }).onConflictDoNothing();
  revalidatePath(`/players/${playerId}`);
}
export async function removeTag(playerId: number, tag: string) {
  await db.delete(tags).where(and(eq(tags.playerId, playerId), eq(tags.tag, tag)));
  revalidatePath(`/players/${playerId}`);
}

export async function savePlan(
  playerId: number,
  data: {
    name?: string;
    blocks: Array<{ trainingId: number; weeks: number }>;
    coachLevel: number;
    youthTrainerLevel: number;
  },
) {
  const { blocks, coachLevel, youthTrainerLevel } = data;
  if (!Number.isInteger(blocks.length) || blocks.length < 1 || blocks.length > 40) {
    throw new Error('plan must have 1-40 blocks');
  }
  let totalWeeks = 0;
  for (const b of blocks) {
    if (!Number.isInteger(b.trainingId) || b.trainingId < 1 || b.trainingId > 33) {
      throw new Error(`invalid trainingId: ${b.trainingId}`);
    }
    if (!Number.isInteger(b.weeks) || b.weeks < 1 || b.weeks > 140) {
      throw new Error(`invalid weeks: ${b.weeks}`);
    }
    totalWeeks += b.weeks;
  }
  if (totalWeeks > 140) throw new Error('total plan weeks must be <= 140');
  if (!Number.isInteger(coachLevel) || coachLevel < 1 || coachLevel > 7) {
    throw new Error(`invalid coachLevel: ${coachLevel}`);
  }
  if (!Number.isInteger(youthTrainerLevel) || youthTrainerLevel < 0 || youthTrainerLevel > 7) {
    throw new Error(`invalid youthTrainerLevel: ${youthTrainerLevel}`);
  }

  await db.update(trainingPlans).set({ isActive: false }).where(eq(trainingPlans.playerId, playerId));
  await db.insert(trainingPlans).values({
    playerId,
    name: data.name?.trim() || 'Plan',
    blocks,
    coachLevel,
    youthTrainerLevel,
    isActive: true,
  });
  revalidatePath(`/players/${playerId}`);
}
