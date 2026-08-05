'use client';

import { useState, useTransition } from 'react';
import type { EffectiveArchetype } from '@/lib/archetypes/types';
import ArchetypeEditor from './ArchetypeEditor';
import { resetDefault, hideDefault, deleteCustom } from '@/app/archetypes/actions';

export default function ArchetypeList({ archetypes, readOnly = false }: { archetypes: EffectiveArchetype[]; readOnly?: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const newDraft: EffectiveArchetype = { id: 'new', key: null, dbId: null, name: 'New archetype', source: 'custom', rules: { conditions: [] } };

  return (
    <div className="space-y-3">
      {!readOnly && <button onClick={() => setEditing('new')} className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium">+ New archetype</button>}
      {!readOnly && editing === 'new' && <ArchetypeEditor archetype={newDraft} onDone={() => setEditing(null)} />}
      {archetypes.map((a) => (
        <div key={a.id}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{a.name}</span>
            <span className="text-xs text-neutral-500">{a.source === 'custom' ? 'custom' : a.source === 'default-modified' ? 'modified default' : 'default'}</span>
            <span className="text-xs text-neutral-500">· {a.rules.conditions.length} conditions</span>
            {!readOnly && <div className="ml-auto flex gap-2 text-xs">
              <button onClick={() => setEditing(editing === a.id ? null : a.id)} className="text-neutral-400 hover:text-amber-500">edit</button>
              {a.source === 'default-modified' && <button disabled={pending} onClick={() => start(() => resetDefault(a.key!))} className="text-neutral-400 hover:text-amber-500">reset</button>}
              {a.key && <button disabled={pending} onClick={() => start(() => hideDefault(a.key!, a.name))} className="text-neutral-400 hover:text-red-400">hide</button>}
              {a.source === 'custom' && <button disabled={pending} onClick={() => start(() => deleteCustom(a.dbId!))} className="text-neutral-400 hover:text-red-400">delete</button>}
            </div>}
          </div>
          {!readOnly && editing === a.id && <div className="mt-2"><ArchetypeEditor archetype={a} onDone={() => setEditing(null)} /></div>}
        </div>
      ))}
    </div>
  );
}
