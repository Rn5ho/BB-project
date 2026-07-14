'use client';

import { POTENTIAL_LEVELS, SKILLS } from '@/lib/constants';
import { CP_HEIGHT_STEPS } from '@/lib/training/models/coach-parrot';
import BoundedNumberInput from './BoundedNumberInput';

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

/** "196 cm · 6'5\"" — BB heights map 1:1 onto inches 69..90. */
function heightLabel(cm: number): string {
  const inches = Math.round(cm / 2.54);
  return `${cm} cm · ${Math.floor(inches / 12)}'${inches % 12}"`;
}

/** Age/height/potential + a 12-skill grid for building a hypothetical player from scratch. */
export default function ManualPlayerForm({
  value, onChange,
}: {
  value: ManualPlayer;
  onChange: (next: ManualPlayer) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-0.5 text-xs text-neutral-400">
          Age
          <BoundedNumberInput
            value={value.age} min={18} max={35}
            onCommit={(n) => onChange({ ...value, age: n })}
            className="w-20 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs text-neutral-400">
          Height
          <select
            value={value.heightCm}
            onChange={(e) => onChange({ ...value, heightCm: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white"
          >
            {CP_HEIGHT_STEPS.map((cm) => (
              <option key={cm} value={cm}>{heightLabel(cm)}</option>
            ))}
          </select>
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
              <BoundedNumberInput
                value={value.skills[s.dbKey] ?? 7} min={1} max={20}
                onCommit={(n) => onChange({ ...value, skills: { ...value.skills, [s.dbKey]: n } })}
                className="w-14 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm text-white"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
