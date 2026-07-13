'use server';

import { revalidatePath } from 'next/cache';
import { db, reviewMarks } from '@/db';

export async function markReviewed() {
  await db
    .insert(reviewMarks)
    .values({ scope: 'slovenia', markedAt: new Date() })
    .onConflictDoUpdate({ target: reviewMarks.scope, set: { markedAt: new Date() } });
  revalidatePath('/slovenia');
}
