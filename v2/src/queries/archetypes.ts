import { db, archetypes } from '@/db';
import { DEFAULT_ARCHETYPES } from '@/lib/archetypes/defaults';
import { mergeArchetypes, type ArchetypeRow } from '@/lib/archetypes/merge';
import type { EffectiveArchetype } from '@/lib/archetypes/types';

export async function getEffectiveArchetypes(): Promise<EffectiveArchetype[]> {
  const rows = await db.select().from(archetypes);
  const asRows: ArchetypeRow[] = rows.map((r) => ({
    id: r.id, key: r.key, name: r.name, description: r.description,
    rules: r.rules as ArchetypeRow['rules'], hidden: r.hidden,
  }));
  return mergeArchetypes(DEFAULT_ARCHETYPES, asRows);
}
