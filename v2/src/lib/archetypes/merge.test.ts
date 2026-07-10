import { describe, it, expect } from 'vitest';
import { mergeArchetypes, type ArchetypeRow } from './merge';
import type { DefaultArchetype } from './types';

const defaults: DefaultArchetype[] = [
  { key: 'a', name: 'A', rules: { conditions: [] } },
  { key: 'b', name: 'B', rules: { conditions: [] } },
];

describe('mergeArchetypes', () => {
  it('returns all defaults when no DB rows', () => {
    const eff = mergeArchetypes(defaults, []);
    expect(eff.map((e) => e.id)).toEqual(['a', 'b']);
    expect(eff[0].source).toBe('default');
  });
  it('applies an override to a default (source default-modified)', () => {
    const rows: ArchetypeRow[] = [{ id: 5, key: 'a', name: 'A2', description: null, rules: { conditions: [] }, hidden: false }];
    const eff = mergeArchetypes(defaults, rows);
    const a = eff.find((e) => e.key === 'a')!;
    expect(a.name).toBe('A2');
    expect(a.source).toBe('default-modified');
    expect(a.dbId).toBe(5);
  });
  it('hides a default', () => {
    const rows: ArchetypeRow[] = [{ id: 6, key: 'b', name: 'B', description: null, rules: { conditions: [] }, hidden: true }];
    expect(mergeArchetypes(defaults, rows).map((e) => e.key)).toEqual(['a']);
  });
  it('includes custom rows (key null) after defaults', () => {
    const rows: ArchetypeRow[] = [{ id: 9, key: null, name: 'Custom', description: null, rules: { conditions: [] }, hidden: false }];
    const eff = mergeArchetypes(defaults, rows);
    const c = eff.find((e) => e.source === 'custom')!;
    expect(c.id).toBe('custom-9');
    expect(c.name).toBe('Custom');
  });
  it('a newly shipped default the user never saw just appears', () => {
    const withNew = [...defaults, { key: 'c', name: 'C', rules: { conditions: [] } }];
    expect(mergeArchetypes(withNew, []).map((e) => e.key)).toEqual(['a', 'b', 'c']);
  });
});
