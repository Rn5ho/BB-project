'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { BoardRow } from '@/lib/training/board';
import { getPotentialColor } from '@/lib/constants';

type SortKey = 'name' | 'age' | 'potential' | 'tspNow' | 'benchmarkDelta' | 'tsp21Current' | 'tsp21Optimal' | 'gap' | 'capUsedPct' | 'avgMinutes';

const CONF_COLOR: Record<string, string> = { high: 'text-green-400', medium: 'text-amber-400', low: 'text-neutral-500' };

function fmt(v: number | null, digits = 0): string {
  if (v == null) return '–';
  return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function signed(v: number | null): { text: string; cls: string } {
  if (v == null) return { text: '–', cls: 'text-neutral-500' };
  const r = Math.sign(v) * Math.round(Math.abs(v));
  if (r > 0) return { text: `+${r}`, cls: 'text-green-400' };
  if (r < 0) return { text: `${r}`, cls: 'text-red-400' };
  return { text: '0', cls: 'text-neutral-400' };
}

export default function PlannerTable({ rows, currentSeasonWeek }: { rows: BoardRow[]; currentSeasonWeek: number }) {
  const [sortKey, setSortKey] = useState<SortKey>('gap');
  const [sortAsc, setSortAsc] = useState(false);
  const [ages, setAges] = useState<Set<number>>(new Set([18, 19, 20, 21]));
  const [minPot, setMinPot] = useState(0);
  const [inferredOnly, setInferredOnly] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      ages.has(r.age) &&
      r.potential >= minPot &&
      (!inferredOnly || r.inferredTrainingId != null) &&
      (q === '' || r.name.toLowerCase().includes(q) || (r.ownerTeamName ?? '').toLowerCase().includes(q)),
    );
  }, [rows, ages, minPot, inferredOnly, search]);

  const sorted = useMemo(() => {
    const dir = sortAsc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return dir * a.name.localeCompare(b.name);
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls last regardless of direction
      if (bv == null) return -1;
      return dir * (av - bv);
    });
  }, [filtered, sortKey, sortAsc]);

  const header = (key: SortKey, label: string, title?: string) => (
    <th
      className="pr-3 cursor-pointer select-none whitespace-nowrap hover:text-white"
      title={title}
      onClick={() => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(key === 'name'); }
      }}
    >
      {label}{sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''}
    </th>
  );

  const toggleAge = (a: number) => {
    const next = new Set(ages);
    if (next.has(a)) next.delete(a); else next.add(a);
    setAges(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Player or club…"
          className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 w-48"
        />
        {[18, 19, 20, 21].map((a) => (
          <label key={a} className="flex items-center gap-1 text-neutral-400">
            <input type="checkbox" checked={ages.has(a)} onChange={() => toggleAge(a)} />{a}
          </label>
        ))}
        <label className="flex items-center gap-1 text-neutral-400">
          Pot ≥
          <input
            type="number" min={0} max={11} value={minPot}
            onChange={(e) => setMinPot(Number(e.target.value) || 0)}
            className="w-14 rounded border border-neutral-800 bg-neutral-900 px-1 py-0.5"
          />
        </label>
        <label className="flex items-center gap-1 text-neutral-400">
          <input type="checkbox" checked={inferredOnly} onChange={(e) => setInferredOnly(e.target.checked)} />
          inferred training only
        </label>
        <span className="ml-auto text-neutral-500">{sorted.length} players · week {currentSeasonWeek}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b border-neutral-800">
            <tr>
              {header('name', 'Player')}
              {header('age', 'Age')}
              {header('potential', 'Pot')}
              <th className="pr-3">Club</th>
              <th className="pr-3">Club training</th>
              {header('avgMinutes', 'Min/wk', 'Avg weekly minutes at the inferred training’s positions (last 4 observed weeks); – = no boxscore data (projection assumes full minutes)')}
              {header('tspNow', 'TSP')}
              {header('benchmarkDelta', 'vs BM', 'TSP vs the NT-track benchmark for this age + season week')}
              {header('tsp21Current', 'TSP@21 now', 'Projected TSP at end of age 21 if the club keeps its inferred training + current minutes')}
              {header('tsp21Optimal', 'TSP@21 opt', 'Projected TSP at end of age 21 under the best archetype template at full minutes')}
              {header('gap', 'Gap', 'Optimal − current: how much development is being left on the table')}
              {header('capUsedPct', 'Cap', 'Potential-cap usage (weighted-sum score / soft cap)')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const bm = signed(r.benchmarkDelta);
              const gap = signed(r.gap);
              return (
                <tr key={r.bbPlayerId} className="border-b border-neutral-900">
                  <td className="py-1 pr-3 whitespace-nowrap">
                    <Link href={`/players/${r.bbPlayerId}`} className="hover:text-amber-400">{r.name}</Link>
                  </td>
                  <td className="pr-3">{r.age}</td>
                  <td className="pr-3" style={{ color: getPotentialColor(r.potential) }}>{r.potential}</td>
                  <td className="pr-3 whitespace-nowrap max-w-40 truncate">
                    {r.ownerTeamId != null ? (
                      <a href={`https://buzzerbeater.com/team/${r.ownerTeamId}/overview.aspx`} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-amber-400">
                        {r.ownerTeamName ?? r.ownerTeamId}
                      </a>
                    ) : <span className="text-neutral-600">–</span>}
                  </td>
                  <td className="pr-3 whitespace-nowrap">
                    {r.inferredLabel != null ? (
                      <span title={r.inferredAsOfIso ? `observation window ended ${r.inferredAsOfIso.slice(0, 10)}` : undefined}>
                        {r.inferredLabel}{' '}
                        <span className={`text-xs ${CONF_COLOR[r.inferredConfidence ?? 'low']}`}>({r.inferredConfidence})</span>
                      </span>
                    ) : <span className="text-neutral-600">unknown</span>}
                  </td>
                  <td className="pr-3">{fmt(r.avgMinutes)}</td>
                  <td className="pr-3">{fmt(r.tspNow)}</td>
                  <td className={`pr-3 ${bm.cls}`}>{bm.text}</td>
                  <td className="pr-3">{fmt(r.tsp21Current)}</td>
                  <td className="pr-3">{fmt(r.tsp21Optimal)}</td>
                  <td className={`pr-3 font-medium ${gap.cls}`}>{gap.text}</td>
                  <td className="pr-3">{r.capUsedPct}%</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={12} className="py-3 text-neutral-500">No players match the filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
