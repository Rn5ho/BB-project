'use client';

import { POTENTIAL_LEVELS, SKILLS } from '@/lib/constants';

export interface ManualPlayer {
  age: number;
  heightCm: number;
  potential: number;
  skills: Record<string, number>;
}

export const DEFAULT_MANUAL_PLAYER: ManualPlayer = {
  age: 18,
  heightCm: 196,
  potential: 8,
  skills: Object.fromEntries(SKILLS.map((s) => [s.dbKey, 7])) as Record<string, number>,
};

/** Age/height/potential + a 12-skill grid for building a hypothetical player from scratch. */
export default function ManualPlayerForm({
  value, onChange,
}: {
  value: ManualPlayer;
  onChange: (next: ManualPlayer) => void;
}) {
  function setSkill(dbKey: string, n: number) {
    onChange({ ...value, skills: { ...value.skills, [dbKey]: Math.max(1, Math.min(20, n)) } });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-0.5 text-xs text-neutral-400">
          Age
          <input
            type="number" min={18} max={35} value={value.age}
            onChange={(e) => onChange({ ...value, age: Math.max(18, Math.min(35, Number(e.target.value) || 18)) })}
            className="w-20 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs text-neutral-400">
          Height (cm)
          <input
            type="number" min={175} max={229} value={value.heightCm}
            onChange={(e) => onChange({ ...value, heightCm: Math.max(175, Math.min(229, Number(e.target.value) || 175)) })}
            className="w-24 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs text-neutral-400">
          Potential
          <select
            value={value.potential}
            onChange={(e) => onChange({ ...value, potential: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
          >
            {Object.entries(POTENTIAL_LEVELS).map(([n, label]) => (
              <option key={n} value={n}>{n} – {label}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="text-xs text-neutral-500 mb-1.5">Skills</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
          {SKILLS.map((s) => (
            <label key={s.dbKey} className="flex items-center justify-between gap-2 text-xs text-neutral-400">
              {s.name}
              <input
                type="number" min={1} max={20} value={value.skills[s.dbKey] ?? 7}
                onChange={(e) => setSkill(s.dbKey, Number(e.target.value) || 1)}
                className="w-14 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm text-white"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
