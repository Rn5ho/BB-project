'use server';

import { revalidatePath } from 'next/cache';
import { db, notes, tags } from '@/db';
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
