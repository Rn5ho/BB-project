'use client';

import { useState } from 'react';
import { POSITIONS, POTENTIAL_LEVELS } from '@/lib/constants';
import { DEFAULT_FILTER, isFilterDefault, type FilterState } from '@/lib/table';

interface FilterBarProps {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
  shown: number;
  total: number;
  showSkills: boolean;
  onToggleSkills: () => void;
}

export default function FilterBar({ filter, onChange, onReset, shown, total, showSkills, onToggleSkills }: FilterBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  // Local string state for age inputs so clearing doesn't snap to 0
  const [ageMinStr, setAgeMinStr] = useState<string>(String(filter.ageMin));
  const [ageMaxStr, setAgeMaxStr] = useState<string>(String(filter.ageMax));
  const isDirty = !isFilterDefault(filter);

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filter, [key]: value });
  }

  function handleReset() {
    setMoreOpen(false);
    setAgeMinStr(String(DEFAULT_FILTER.ageMin));
    setAgeMaxStr(String(DEFAULT_FILTER.ageMax));
    onReset();
  }

  function commitAge(field: 'ageMin' | 'ageMax', strVal: string) {
    const defaultVal = DEFAULT_FILTER[field];
    const n = strVal.trim() === '' ? defaultVal : Number(strVal);
    const committed = isNaN(n) ? defaultVal : n;
    set(field, committed);
    if (field === 'ageMin') setAgeMinStr(String(committed));
    else setAgeMaxStr(String(committed));
  }

  return (
    <div className="mb-4 space-y-2">
      {/* Primary row */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* Name search */}
        <input
          type="text"
          placeholder="Search player…"
          value={filter.name}
          onChange={(e) => set('name', e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white placeholder-neutral-500 w-40 focus:outline-none focus:border-amber-500"
        />

        {/* Age min / max */}
        <div className="flex items-center gap-1 text-neutral-400">
          <span>Age</span>
          <input
            type="number"
            value={ageMinStr}
            min={0}
            max={99}
            onChange={(e) => {
              setAgeMinStr(e.target.value);
              if (e.target.value.trim() !== '') {
                const n = Number(e.target.value);
                if (!isNaN(n)) set('ageMin', n);
              }
            }}
            onBlur={() => commitAge('ageMin', ageMinStr)}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white w-14 text-right focus:outline-none focus:border-amber-500"
          />
          <span>–</span>
          <input
            type="number"
            value={ageMaxStr}
            min={0}
            max={99}
            onChange={(e) => {
              setAgeMaxStr(e.target.value);
              if (e.target.value.trim() !== '') {
                const n = Number(e.target.value);
                if (!isNaN(n)) set('ageMax', n);
              }
            }}
            onBlur={() => commitAge('ageMax', ageMaxStr)}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white w-14 text-right focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Position */}
        <select
          value={filter.position}
          onChange={(e) => set('position', e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500"
        >
          <option value="">All positions</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>

        {/* Potential min / max */}
        <div className="flex items-center gap-1 text-neutral-400">
          <span>Pot</span>
          <select
            value={filter.potMin}
            onChange={(e) => set('potMin', Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{i} — {POTENTIAL_LEVELS[i]}</option>
            ))}
          </select>
          <span>–</span>
          <select
            value={filter.potMax}
            onChange={(e) => set('potMax', Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{i} — {POTENTIAL_LEVELS[i]}</option>
            ))}
          </select>
        </div>

        {/* Full skills only */}
        <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filter.fullSkillsOnly}
            onChange={(e) => set('fullSkillsOnly', e.target.checked)}
            className="accent-amber-500"
          />
          Full skills only
        </label>

        {/* Skills toggle */}
        <button
          type="button"
          onClick={onToggleSkills}
          className={`ml-1 px-2 py-0.5 rounded border text-sm ${
            showSkills
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-neutral-700 text-neutral-400 hover:text-white'
          }`}
        >
          Skills
        </button>

        {/* More toggle */}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="text-neutral-400 hover:text-white ml-1"
        >
          More {moreOpen ? '▲' : '▾'}
        </button>

        {/* Reset link */}
        {isDirty && (
          <button
            type="button"
            onClick={handleReset}
            className="text-amber-500 hover:text-amber-400 ml-auto"
          >
            Reset
          </button>
        )}
      </div>

      {/* Collapsible More row */}
      {moreOpen && (
        <div className="flex flex-wrap items-center gap-2 text-sm border-t border-neutral-800 pt-2">
          <NumInput label="Min TSP" value={filter.minTsp} onChange={(v) => set('minTsp', v)} />
          <NumInput label="Min DMI" value={filter.minDmi} onChange={(v) => set('minDmi', v)} />
          <NumInput label="Min salary" value={filter.minSalary} onChange={(v) => set('minSalary', v)} />
          <div className="flex items-center gap-1 text-neutral-400">
            <span>Height cm</span>
            <input
              type="number"
              placeholder="min"
              value={filter.heightMin}
              onChange={(e) => set('heightMin', e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white w-16 text-right focus:outline-none focus:border-amber-500"
            />
            <span>–</span>
            <input
              type="number"
              placeholder="max"
              value={filter.heightMax}
              onChange={(e) => set('heightMax', e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white w-16 text-right focus:outline-none focus:border-amber-500"
            />
          </div>
          <NumInput label="Min GS" value={filter.minGameShape} onChange={(v) => set('minGameShape', v)} />
        </div>
      )}

      {/* Live count */}
      <p className="text-sm text-neutral-500">
        {shown === total
          ? <>{total} players</>
          : <><span className="text-neutral-300">{shown}</span> of {total} shown</>
        }
      </p>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-neutral-400">
      <span>{label}</span>
      <input
        type="number"
        placeholder="—"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white w-20 text-right focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}
