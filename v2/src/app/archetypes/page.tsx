import { getEffectiveArchetypes } from '@/queries/archetypes';
import ArchetypeList from '@/components/archetypes/ArchetypeList';
import { getSessionRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function ArchetypesPage() {
  const [archetypes, role] = await Promise.all([getEffectiveArchetypes(), getSessionRole()]);
  return (
    <main className="p-6 max-w-4xl">
      <h1 className="text-lg font-semibold mb-1">Archetypes</h1>
      <p className="text-sm text-neutral-500 mb-4">Define named skill profiles by age. Players matching an archetype at their current age get badged on the Slovenia page and their profile. Starter examples are editable — your changes are yours; reset restores the default.</p>
      <ArchetypeList archetypes={archetypes} readOnly={role !== 'owner'} />
    </main>
  );
}
