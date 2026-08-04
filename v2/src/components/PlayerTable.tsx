'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlayerListRow } from '@/queries/players';
import { SKILLS, getPotentialColor, POTENTIAL_LEVELS } from '@/lib/constants';
import { INSIDE_SKILL_KEYS, OUTSIDE_SKILL_KEYS } from '@/lib/domain';
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  sortRows,
  filterRows,
  nextSortState,
  sanitizeShowSkills,
  type FilterState,
  type SortState,
  type SortKey,
  type Variant,
} from '@/lib/table';
import SkillCell from './SkillCell';
import FilterBar from './FilterBar';
import ArchetypeBadge from './ArchetypeBadge';

const STORAGE_KEY: Record<Variant, string> = {
  slovenia: 'bbscout:table:slovenia',
  world: 'bbscout:table:world',
};

const NEW_CHIP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// Rows rendered before the "Show all" escape hatch. The world list is thousands of
// rows (~25 cells each); rendering them all makes initial paint and every
// filter/sort interaction sluggish, while sorting puts the relevant rows on top.
const RENDER_CAP = 300;

const skillName = (k: string) => SKILLS.find((s) => s.dbKey === k)?.name ?? k;
const IN_TSP_TITLE = `Inside TSP: ${INSIDE_SKILL_KEYS.map(skillName).join(' + ')}`;
const OUT_TSP_TITLE = `Outside TSP: ${OUTSIDE_SKILL_KEYS.map(skillName).join(' + ')}`;

// ─── localStorage sanitizers ─────────────────────────────────────────────────

function sanitizeFilter(raw: Partial<FilterState>): Partial<FilterState> {
  const out: Partial<FilterState> = {};
  const def = {} as FilterState; // use DEFAULT_FILTER shape for type reference
  void def;
  for (const _key of Object.keys(raw) as (keyof FilterState)[]) {
    const val = raw[_key];
    if (_key === 'skillMins') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const mins: Record<string, string> = {};
        for (const s of SKILLS) {
          const v = (val as Record<string, unknown>)[s.dbKey];
          if (typeof v === 'string') mins[s.dbKey] = v;
        }
        (out as Record<string, unknown>)[_key] = mins;
      }
      continue;
    }
    const expected = typeof DEFAULT_FILTER[_key];
    if (expected === 'number') {
      if (typeof val === 'number' && isFinite(val)) (out as Record<string, unknown>)[_key] = val;
    } else if (expected === 'boolean') {
      if (typeof val === 'boolean') (out as Record<string, unknown>)[_key] = val;
    } else if (expected === 'string') {
      if (typeof val === 'string') (out as Record<string, unknown>)[_key] = val;
    }
  }
  return out;
}

function sanitizeSort(raw: Partial<SortState>): Partial<SortState> {
  const out: Partial<SortState> = {};
  if (typeof raw.key === 'string') out.key = raw.key as SortState['key'];
  if (raw.direction === 'asc' || raw.direction === 'desc') out.direction = raw.direction;
  return out;
}

interface StoredState {
  filter?: Partial<FilterState>;
  sort?: Partial<SortState>;
  showSkills?: boolean;
}

export default function PlayerTable({
  rows,
  showCountry,
  defaultShowSkills = false,
  variant,
  archetypeMatches,
  archetypeNames,
}: {
  rows: PlayerListRow[];
  showCountry?: boolean;
  defaultShowSkills?: boolean;
  variant: Variant;
  archetypeMatches?: Record<number, string[]>;
  archetypeNames?: string[];
}) {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT[variant]);
  const [showSkills, setShowSkills] = useState<boolean>(defaultShowSkills);
  const [showAll, setShowAll] = useState(false); // per-visit, deliberately not persisted
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount (hydration-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY[variant]);
      if (raw) {
        const parsed: StoredState = JSON.parse(raw);
        if (parsed.filter) setFilter({ ...DEFAULT_FILTER, ...sanitizeFilter(parsed.filter) });
        if (parsed.sort) setSort({ ...DEFAULT_SORT[variant], ...sanitizeSort(parsed.sort) });
        setShowSkills(sanitizeShowSkills(parsed.showSkills, defaultShowSkills));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [variant]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage on change (only after hydration to avoid overwriting with defaults)
  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: StoredState = { filter, sort, showSkills };
      localStorage.setItem(STORAGE_KEY[variant], JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [filter, sort, showSkills, hydrated, variant]);

  function handleReset() {
    setFilter(DEFAULT_FILTER);
    setSort(DEFAULT_SORT[variant]);
    setShowSkills(defaultShowSkills);
    try {
      localStorage.removeItem(STORAGE_KEY[variant]);
    } catch {
      // ignore
    }
  }

  function handleSortClick(key: SortKey) {
    setSort((prev) => nextSortState(prev, key));
  }

  const newChipCutoff = new Date(Date.now() - NEW_CHIP_MS);
  const filtered = filterRows(rows, filter);
  // Archetype filter: applied here because archetypeMatches is only available in this component
  const archetypeFiltered = filter.archetype && archetypeMatches
    ? filtered.filter((p) => (archetypeMatches[p.bbPlayerId] ?? []).includes(filter.archetype))
    : filtered;
  const sorted = sortRows(archetypeFiltered, sort);
  const visible = showAll ? sorted : sorted.slice(0, RENDER_CAP);

  return (
    <div>
      <FilterBar
        filter={filter}
        onChange={setFilter}
        onReset={handleReset}
        shown={archetypeFiltered.length}
        total={rows.length}
        showSkills={showSkills}
        onToggleSkills={() => setShowSkills((v) => !v)}
        archetypeNames={archetypeNames}
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
              <SortTh label="In" sortKey="insideTsp" sort={sort} onClick={handleSortClick} className="pr-3 text-right" title={IN_TSP_TITLE} />
              <SortTh label="Out" sortKey="outsideTsp" sort={sort} onClick={handleSortClick} className="pr-3 text-right" title={OUT_TSP_TITLE} />
              {variant === 'slovenia' && (
                <SortTh label="Δ" sortKey="tspDelta" sort={sort} onClick={handleSortClick} className="pr-3 text-right" title="TSP change since last review" />
              )}
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
              {archetypeMatches && <th className="pr-3 whitespace-nowrap">Archetype</th>}
              {showCountry && <th className="pr-3 whitespace-nowrap">Market</th>}
              <th className="pr-3 whitespace-nowrap">Owner</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.bbPlayerId} className="border-b border-neutral-900 hover:bg-neutral-900/50">
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  <Link
                    href={`/players/${p.bbPlayerId}`}
                    className="hover:text-amber-500"
                  >
                    {p.name}
                  </Link>
                  {' '}
                  <a
                    href={`https://buzzerbeater.com/player/${p.bbPlayerId}/overview.aspx`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-amber-500 text-xs"
                  >
                    ↗
                  </a>
                  {p.firstSeenAt != null && p.firstSeenAt >= newChipCutoff && (
                    <span className="ml-1 text-xs rounded bg-sky-900/40 text-sky-300 px-1">new</span>
                  )}
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
                <td className="pr-3 text-right">{p.insideTsp ?? '–'}</td>
                <td className="pr-3 text-right">{p.outsideTsp ?? '–'}</td>
                {variant === 'slovenia' && (
                  <td className="pr-3 text-right">
                    {p.tspDelta == null ? <span className="text-neutral-600">–</span>
                      : p.tspDelta > 0 ? <span className="text-green-400">+{p.tspDelta}</span>
                      : p.tspDelta < 0 ? <span className="text-red-400">{p.tspDelta}</span>
                      : <span className="text-neutral-500">0</span>}
                  </td>
                )}
                {showSkills &&
                  SKILLS.map((s) => (
                    <td key={s.dbKey} className="pr-2">
                      <SkillCell value={p.skills?.[s.dbKey] ?? null} delta={p.skillDeltas?.[s.dbKey] ?? null} />
                    </td>
                  ))}
                {archetypeMatches && (
                  <td className="pr-3">
                    <ArchetypeBadge names={archetypeMatches[p.bbPlayerId] ?? []} />
                  </td>
                )}
                {showCountry && <td className="pr-3"><MarketChip row={p} /></td>}
                <td className="pr-3">
                  <OwnerCell row={p} />
                </td>
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
                  colSpan={13 + (showCountry ? 2 : 0) + (variant === 'slovenia' ? 1 : 0) + (showSkills ? SKILLS.length : 0) + (archetypeMatches ? 1 : 0)}
                  className="py-8 text-center text-neutral-500"
                >
                  No players match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!showAll && sorted.length > RENDER_CAP && (
          <div className="py-3 text-center text-sm text-neutral-400">
            Showing first {RENDER_CAP} of {sorted.length.toLocaleString()} rows ·{' '}
            <button
              onClick={() => setShowAll(true)}
              className="text-amber-500 hover:underline cursor-pointer"
            >
              Show all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MarketChip ──────────────────────────────────────────────────────────────

function MarketChip({ row }: { row: PlayerListRow }) {
  const now = new Date();
  if (row.onMarketUntil != null && row.onMarketUntil > now) {
    const hoursLeft = Math.max(0, Math.round((row.onMarketUntil.getTime() - now.getTime()) / 3_600_000));
    return (
      <span className="text-xs rounded bg-amber-900/40 text-amber-400 px-1.5 py-0.5 whitespace-nowrap">
        on market · ends ~{hoursLeft}h
      </span>
    );
  }
  if (row.isRookie) {
    return (
      <span className="text-xs rounded bg-neutral-800 text-neutral-400 px-1.5 py-0.5">
        rookie
      </span>
    );
  }
  return <span className="text-neutral-600">–</span>;
}

// ─── OwnerCell ───────────────────────────────────────────────────────────────

function OwnerCell({ row }: { row: PlayerListRow }) {
  if (!row.ownerTeamName && !row.ownerManager) {
    return <span className="text-neutral-600">–</span>;
  }
  return (
    <div className="whitespace-nowrap">
      {row.ownerTeamId ? (
        <a
          href={`https://buzzerbeater.com/team/${row.ownerTeamId}/overview.aspx`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:text-amber-500"
        >
          {row.ownerTeamName ?? String(row.ownerTeamId)}
        </a>
      ) : (
        <span className="text-sm">{row.ownerTeamName ?? '–'}</span>
      )}
      {row.ownerManager && (
        <div className="text-xs text-neutral-500">{row.ownerManager}</div>
      )}
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
