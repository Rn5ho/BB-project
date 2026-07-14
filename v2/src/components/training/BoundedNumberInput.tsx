'use client';

import { useState } from 'react';

/** Number input that lets the user clear and retype freely: while focused the raw
 *  text is kept as-is (empty allowed), valid in-range values commit live so
 *  previews update as you type, and out-of-range/empty values clamp on blur. */
export default function BoundedNumberInput({
  value, min, max, onCommit, className,
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null); // null = not being edited

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={draft ?? String(value)}
      onFocus={() => setDraft(String(value))}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const n = Number(raw);
        if (raw !== '' && Number.isFinite(n) && n >= min && n <= max) onCommit(Math.round(n));
      }}
      onBlur={() => {
        const n = Number(draft);
        if (draft != null && draft !== '' && Number.isFinite(n)) {
          onCommit(Math.round(Math.max(min, Math.min(max, n))));
        }
        setDraft(null); // fall back to the committed value
      }}
      className={className}
    />
  );
}
