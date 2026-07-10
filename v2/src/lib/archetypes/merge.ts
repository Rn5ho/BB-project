import type { DefaultArchetype, EffectiveArchetype, ArchetypeRules } from './types';

export interface ArchetypeRow {
  id: number;
  key: string | null;
  name: string;
  description: string | null;
  rules: ArchetypeRules;
  hidden: boolean;
}

export function mergeArchetypes(defaults: DefaultArchetype[], rows: ArchetypeRow[]): EffectiveArchetype[] {
  const overrideByKey = new Map<string, ArchetypeRow>();
  const customs: ArchetypeRow[] = [];
  for (const r of rows) {
    if (r.key) overrideByKey.set(r.key, r);
    else customs.push(r);
  }

  const out: EffectiveArchetype[] = [];
  for (const d of defaults) {
    const ov = overrideByKey.get(d.key);
    if (ov?.hidden) continue; // hidden default
    if (ov) {
      out.push({ id: d.key, key: d.key, dbId: ov.id, name: ov.name, description: ov.description ?? undefined, rules: ov.rules, source: 'default-modified' });
    } else {
      out.push({ id: d.key, key: d.key, dbId: null, name: d.name, description: d.description, rules: d.rules, source: 'default' });
    }
  }
  for (const c of customs) {
    out.push({ id: `custom-${c.id}`, key: null, dbId: c.id, name: c.name, description: c.description ?? undefined, rules: c.rules, source: 'custom' });
  }
  return out;
}
