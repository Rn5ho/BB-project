'use server';

import { revalidatePath } from 'next/cache';
import { db, archetypes } from '@/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { ArchetypeRules } from '@/lib/archetypes/types';

// Save an override of a DEFAULT (keyed) — upsert by key.
export async function saveDefaultOverride(key: string, name: string, description: string, rules: ArchetypeRules) {
  const existing = await db.select().from(archetypes).where(eq(archetypes.key, key));
  if (existing[0]) {
    await db.update(archetypes).set({ name, description: description || null, rules, hidden: false, updatedAt: new Date() }).where(eq(archetypes.id, existing[0].id));
  } else {
    await db.insert(archetypes).values({ key, name, description: description || null, rules, hidden: false });
  }
  revalidatePath('/archetypes');
}

// Reset a default to code version (delete override).
export async function resetDefault(key: string) {
  await db.delete(archetypes).where(eq(archetypes.key, key));
  revalidatePath('/archetypes');
}

// Hide a default.
export async function hideDefault(key: string, name: string) {
  const existing = await db.select().from(archetypes).where(eq(archetypes.key, key));
  if (existing[0]) await db.update(archetypes).set({ hidden: true }).where(eq(archetypes.id, existing[0].id));
  else await db.insert(archetypes).values({ key, name, rules: { conditions: [] }, hidden: true });
  revalidatePath('/archetypes');
}

// Create or update a CUSTOM archetype (key null). dbId null = create.
export async function saveCustom(dbId: number | null, name: string, description: string, rules: ArchetypeRules) {
  if (dbId) {
    await db.update(archetypes).set({ name, description: description || null, rules, updatedAt: new Date() }).where(and(eq(archetypes.id, dbId), isNull(archetypes.key)));
  } else {
    await db.insert(archetypes).values({ key: null, name, description: description || null, rules });
  }
  revalidatePath('/archetypes');
}

export async function deleteCustom(dbId: number) {
  await db.delete(archetypes).where(and(eq(archetypes.id, dbId), isNull(archetypes.key)));
  revalidatePath('/archetypes');
}
