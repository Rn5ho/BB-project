'use client';

import { useState, useEffect } from 'react';
import { PlayerListRow } from '@/queries/players';
import { SKILLS, getPotentialColor, POTENTIAL_LEVELS } from '@/lib/constants';
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  sortRows,
  filterRows,
  nextSortState,
  type FilterState,
  type SortState,
  type SortKey,
  type Variant,
} from '@/lib/table';
import SkillCell from './SkillCell';
import FilterBar from './FilterBar';

const STORAGE_KEY: Record<Variant, string> = {
  slovenia: 'bbscout:table:slovenia',
  world: 'bbscout:table:world',
};

interface StoredState {
  filter?: Partial<FilterState>;
  sort?: Partial<SortState>;
}

export default function PlayerTable({
  rows,
  showCountry,
  showSkills,
  variant,
}: {
  rows: PlayerListRow[];
  showCountry?: boolean;
  showSkills?: boolean;
  variant: Variant;
}) {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT[variant]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount (hydration-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY[variant]);
      if (raw) {
        const parsed: StoredState = JSON.parse(raw);
        if (parsed.filter) setFilter({ ...DEFAULT_FILTER, ...parsed.filter });
        if (parsed.sort) setSort({ ...DEFAULT_SORT[variant], ...parsed.sort });
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [variant]);

  // Persist to localStorage on change (only after hydration to avoid overwriting with defaults)
  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: StoredState = { filter, sort };
      localStorage.setItem(STORAGE_KEY[variant], JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [filter, sort, hydrated, variant]);

  function handleReset() {
    setFilter(DEFAULT_FILTER);
    setSort(DEFAULT_SORT[variant]);
    try {
      localStorage.removeItem(STORAGE_KEY[variant]);
    } catch {
      // ignore
    }
  }

  function handleSortClick(key: SortKey) {
    setSort((prev) => nextSortState(prev, key));
  }

  const filtered = filterRows(rows, filter);
  const sorted = sortRows(filtered, sort);

  return (
    <div>
      <FilterBar
        filter={filter}
        onChange={setFilter}
        onReset={handleReset}
        shown={filtered.length}
        total={rows.length}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-400 border-b border-neutral-800">
            <tr>
              <SortTh label="Player" sortKey="name" sort={sort} onClick={handleSortClick} className="py-2 pr-3" />
              {showCountry && <SortTh label="Country" sortKey="nationality" sort={sort} onClick={handleSortClick} className="pr-3" />}
              <SortTh label="Age" sortKey="ageNow" sort={sort} onClick={handleSortClick} className="pr-3" />
              <SortTh label="Pos" sortKey="bestPosition" sort={sort} onClick={handleSortClick} className="pr-3" />
              <SortTh label="Ht" sortKey="heightCm" sort={sort} onClick={handleSortClick} className="pr-3" title="Height (cm)" />
              <SortTh label="Pot" sortKey="potential" sort={sort} onClick={handleSortClick} className="pr-3" />
              <SortTh label="Salary" sortKey="salary" sort={sort} onClick={handleSortClick} className="pr-3 text-right" />
              <SortTh label="DMI" sortKey="dmi" sort={sort} onClick={handleSortClick} className="pr-3 text-right" />
              <SortTh label="GS" sortKey="gameShape" sort={sort} onClick={handleSortClick} className="pr-3" />
              <SortTh label="TSP" sortKey="tsp" sort={sort} onClick={handleSortClick} className="pr-3 text-right" />
              {showSkills && SKILLS.map((s) => (
                <SortTh
                  key={s.dbKey}
                  label={s.name.split(' ').map((w) => w[0]).join('')}
                  sortKey={s.dbKey as SortKey}
                  sort={sort}
                  onClick={handleSortClick}
                  className="pr-2"
                  title={s.name}
                />
              ))}
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.bbPlayerId} className="border-b border-neutral-900 hover:bg-neutral-900/50">
                <td className="py-1.5 pr-3">
                  <a
                    href={`https://buzzerbeater.com/player/${p.bbPlayerId}/overview.aspx`}
                    target="_blank"
                    className="hover:text-amber-500"
                  >
                    {p.name}
                  </a>
                </td>
                {showCountry && <td className="pr-3 text-neutral-400">{p.nationality ?? '–'}</td>}
                <td className="pr-3">{p.ageNow ?? '–'}</td>
                <td className="pr-3">{p.bestPosition ?? '–'}</td>
                <td className="pr-3">{p.heightCm ?? '–'}</td>
                <td className="pr-3">
                  {p.potential != null ? (
                    <span style={{ color: getPotentialColor(p.potential) }} title={POTENTIAL_LEVELS[p.potential]}>
                      {p.potential}
                    </span>
                  ) : (
                    '–'
                  )}
                </td>
                <td className="pr-3 text-right">{p.salary?.toLocaleString() ?? '–'}</td>
                <td className="pr-3 text-right">{p.dmi?.toLocaleString() ?? '–'}</td>
                <td className="pr-3">{p.gameShape ?? '–'}</td>
                <td className="pr-3 text-right font-medium">{p.tsp ?? '–'}</td>
                {showSkills &&
                  SKILLS.map((s) => (
                    <td key={s.dbKey} className="pr-2">
                      <SkillCell value={p.skills?.[s.dbKey] ?? null} />
                    </td>
                  ))}
                <td>
                  {p.hasFullSkills ? (
                    <span className="text-xs rounded bg-green-900/40 text-green-400 px-1.5 py-0.5">skills</span>
                  ) : (
                    <span className="text-xs rounded bg-blue-900/40 text-blue-400 px-1.5 py-0.5">DMI only</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={10 + (showCountry ? 1 : 0) + (showSkills ? SKILLS.length : 0) + 1}
                  className="py-8 text-center text-neutral-500"
                >
                  No players match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SortTh ──────────────────────────────────────────────────────────────────

function SortTh({
  label,
  sortKey,
  sort,
  onClick,
  className = '',
  title,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onClick: (key: SortKey) => void;
  className?: string;
  title?: string;
}) {
  const isActive = sort.key === sortKey;
  const indicator = isActive ? (sort.direction === 'desc' ? ' ▼' : ' ▲') : '';

  return (
    <th
      className={`${className} cursor-pointer select-none hover:text-white whitespace-nowrap ${isActive ? 'text-amber-400' : ''}`}
      onClick={() => onClick(sortKey)}
      title={title}
    >
      {label}
      {indicator && <span className="text-amber-400 text-xs">{indicator}</span>}
    </th>
  );
}
