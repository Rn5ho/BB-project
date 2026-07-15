'use client';

import BoundedNumberInput from '@/components/training/BoundedNumberInput';
import { horizonPresets, type SeasonPoint } from '@/lib/training/horizon';

/** (age, season-week) horizon target picker: preset dropdown + editable pair.
 *  `required` hides the "Custom (no target)" option (reverse planner always needs one). */
export default function HorizonPicker({
  value, onChange, currentAge, required,
}: {
  value: SeasonPoint | null;
  onChange: (t: SeasonPoint | null) => void;
  currentAge: number;
  required?: boolean;
}) {
  const presets = horizonPresets(currentAge);
  const selectValue = value == null
    ? 'custom'
    : presets.find((p) => p.target.age === value.age && p.target.week === value.week)?.key ?? 'specific';

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'custom') onChange(null);
          else if (v === 'specific') onChange(value ?? { age: 21, week: 1 });
          else {
            const p = presets.find((pp) => pp.key === v);
            if (p) onChange({ ...p.target });
          }
        }}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
      >
        {!required && <option value="custom">Custom (no target)</option>}
        {presets.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
        <option value="specific">Specific week…</option>
      </select>
      {value != null && (
        <span className="inline-flex items-center gap-1 text-sm text-neutral-400">
          age
          <BoundedNumberInput
            value={value.age} min={19} max={22}
            onCommit={(n) => onChange({ ...value, age: n })}
            className="w-14 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
          />
          wk
          <BoundedNumberInput
            value={value.week} min={1} max={14}
            onCommit={(n) => onChange({ ...value, week: n })}
            className="w-14 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
          />
        </span>
      )}
    </span>
  );
}
