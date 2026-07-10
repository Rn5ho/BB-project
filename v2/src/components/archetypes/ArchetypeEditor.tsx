'use client';

import { useState, useTransition } from 'react';
import { ARCHETYPE_SKILL_FIELDS, ARCHETYPE_ATTR_FIELDS, AGE_TIERS, type ArchetypeCondition, type ArchetypeField, type EffectiveArchetype } from '@/lib/archetypes/types';
import { saveDefaultOverride, saveCustom } from '@/app/archetypes/actions';

const FIELD_LABELS: Record<string, string> = {
  jump_shot: 'Jump Shot', jump_range: 'Jump Range', outside_def: 'Outside Def', handling: 'Handling',
  driving: 'Driving', passing: 'Passing', inside_shot: 'Inside Shot', inside_def: 'Inside Def',
  rebounding: 'Rebounding', shot_blocking: 'Shot Blocking', stamina: 'Stamina', free_throw: 'Free Throw',
  potential: 'Potential', height_cm: 'Height (cm)', tsp: 'TSP',
};
const ALL_FIELDS = [...ARCHETYPE_SKILL_FIELDS, ...ARCHETYPE_ATTR_FIELDS];

type Row = { kind: 'field'; field: string; op: '>=' | '<='; byAge: Record<number, string> } | { kind: 'position'; op: 'is' | 'isNot'; positions: string[] };

function toRows(a: EffectiveArchetype): Row[] {
  return a.rules.conditions.map((c): Row => c.kind === 'position'
    ? { kind: 'position', op: c.op, positions: c.positions }
    : { kind: 'field', field: c.field, op: c.op, byAge: Object.fromEntries(AGE_TIERS.map((age) => [age, c.byAge[age] != null ? String(c.byAge[age]) : ''])) });
}

function toConditions(rows: Row[]): ArchetypeCondition[] {
  return rows.map((r): ArchetypeCondition => {
    if (r.kind === 'position') return { kind: 'position', op: r.op, positions: r.positions as ('PG'|'SG'|'SF'|'PF'|'C')[] };
    const byAge: Partial<Record<18|19|20|21, number>> = {};
    for (const age of AGE_TIERS) { const v = r.byAge[age]; if (v !== '' && v != null && !isNaN(Number(v))) byAge[age] = Number(v); }
    return { kind: 'field', field: r.field as ArchetypeField, op: r.op, byAge };
  });
}

export default function ArchetypeEditor({ archetype, onDone }: { archetype: EffectiveArchetype; onDone: () => void }) {
  const [name, setName] = useState(archetype.name);
  const [description, setDescription] = useState(archetype.description ?? '');
  const [rows, setRows] = useState<Row[]>(toRows(archetype));
  const [pending, start] = useTransition();

  const setCell = (i: number, age: number, val: string) => setRows((rs) => rs.map((r, j) => j === i && r.kind === 'field' ? { ...r, byAge: { ...r.byAge, [age]: val } } : r));
  const fillAcross = (i: number) => setRows((rs) => rs.map((r, j) => { if (j !== i || r.kind !== 'field') return r; const first = r.byAge[18] || Object.values(r.byAge).find((v) => v !== '') || ''; return { ...r, byAge: Object.fromEntries(AGE_TIERS.map((a) => [a, first])) }; }));
  const addField = () => setRows((rs) => [...rs, { kind: 'field', field: 'inside_def', op: '>=', byAge: Object.fromEntries(AGE_TIERS.map((a) => [a, ''])) }]);
  const addPosition = () => setRows((rs) => [...rs, { kind: 'position', op: 'is', positions: ['C'] }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i));

  const save = () => start(async () => {
    const conditions = toConditions(rows);
    if (archetype.key) await saveDefaultOverride(archetype.key, name, description, { conditions });
    else await saveCustom(archetype.dbId, name, description, { conditions });
    onDone();
  });

  return (
    <div className="border border-neutral-800 rounded p-4 bg-neutral-900/40">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm mb-2 w-64" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm mb-3 w-full" />
      <table className="text-sm mb-3">
        <thead className="text-neutral-400"><tr><th className="text-left pr-2">Field</th><th className="pr-2">Op</th>{AGE_TIERS.map((a) => <th key={a} className="px-1">{a}</th>)}<th></th><th></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.kind === 'field' ? (
                <>
                  <td className="pr-2"><select value={r.field} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'field' ? { ...x, field: e.target.value } : x))} className="bg-neutral-900 border border-neutral-700 rounded px-1">{ALL_FIELDS.map((f) => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}</select></td>
                  <td className="pr-2"><select value={r.op} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'field' ? { ...x, op: e.target.value as '>='|'<=' } : x))} className="bg-neutral-900 border border-neutral-700 rounded px-1"><option value=">=">≥</option><option value="<=">≤</option></select></td>
                  {AGE_TIERS.map((a) => <td key={a} className="px-1"><input value={r.byAge[a]} onChange={(e) => setCell(i, a, e.target.value)} className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1 text-center" /></td>)}
                  <td><button onClick={() => fillAcross(i)} title="fill across ages" className="text-neutral-500 hover:text-amber-500 px-1">→</button></td>
                </>
              ) : (
                <>
                  <td className="pr-2" colSpan={2}>Position</td>
                  <td colSpan={4} className="px-1">
                    <select value={r.op} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'position' ? { ...x, op: e.target.value as 'is'|'isNot' } : x))} className="bg-neutral-900 border border-neutral-700 rounded px-1 mr-2"><option value="is">is</option><option value="isNot">is not</option></select>
                    {(['PG','SG','SF','PF','C'] as const).map((pos) => (
                      <label key={pos} className="mr-1 text-xs"><input type="checkbox" checked={r.positions.includes(pos)} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i && x.kind === 'position' ? { ...x, positions: e.target.checked ? [...x.positions, pos] : x.positions.filter((p) => p !== pos) } : x))} /> {pos}</label>
                    ))}
                  </td>
                </>
              )}
              <td><button onClick={() => removeRow(i)} className="text-neutral-600 hover:text-red-400 px-1">×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 text-sm">
        <button onClick={addField} className="rounded border border-neutral-700 px-2 py-1">+ skill/attr</button>
        <button onClick={addPosition} className="rounded border border-neutral-700 px-2 py-1">+ position</button>
        <button onClick={save} disabled={pending} className="rounded bg-amber-600 px-3 py-1 font-medium disabled:opacity-50 ml-auto">Save</button>
        <button onClick={onDone} className="rounded border border-neutral-700 px-2 py-1">Cancel</button>
      </div>
    </div>
  );
}
