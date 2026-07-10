import { evaluateArchetype } from '@/lib/archetypes/evaluate';
import type { EffectiveArchetype, EvalPlayer } from '@/lib/archetypes/types';

const LABELS: Record<string, string> = {
  jump_shot: 'JS', jump_range: 'JR', outside_def: 'OD', handling: 'HA', driving: 'DR', passing: 'PA',
  inside_shot: 'IS', inside_def: 'ID', rebounding: 'RB', shot_blocking: 'SB', stamina: 'ST', free_throw: 'FT',
  potential: 'Pot', height_cm: 'Ht', tsp: 'TSP', position: 'Pos',
};

export default function ArchetypeMatches({ player, archetypes }: { player: EvalPlayer; archetypes: EffectiveArchetype[] }) {
  const results = archetypes.map((a) => ({ a, r: evaluateArchetype(player, a) }));
  const matched = results.filter((x) => x.r.matches);
  const near = results.filter((x) => !x.r.matches && x.r.checks.length > 0 && x.r.checks.filter((c) => c.pass).length >= x.r.checks.length - 1);

  return (
    <div>
      {matched.length === 0 && near.length === 0 && <p className="text-sm text-neutral-500">No archetype matches at this age.</p>}
      {matched.map(({ a, r }) => (
        <div key={a.id} className="mb-3">
          <span className="text-sm rounded bg-indigo-900/40 text-indigo-300 px-2 py-0.5">{a.name}</span>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {r.checks.map((c, i) => (
              <span key={i} className={c.pass ? 'text-green-400' : 'text-red-400'}>
                {LABELS[c.field] ?? c.field} {c.op} {c.threshold} ({c.actual ?? '–'})
              </span>
            ))}
          </div>
        </div>
      ))}
      {near.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-neutral-500 mb-1">Near misses</div>
          {near.map(({ a, r }) => (
            <div key={a.id} className="mb-1 text-xs">
              <span className="text-neutral-300">{a.name}</span>{' '}
              {r.checks.filter((c) => !c.pass).map((c, i) => (
                <span key={i} className="text-red-400 mr-2">{LABELS[c.field] ?? c.field} {c.op} {c.threshold} ({c.actual ?? '–'})</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
