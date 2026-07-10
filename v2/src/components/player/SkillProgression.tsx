'use client';

import { useState } from 'react';
import { SKILLS } from '@/lib/constants';
import TimeSeriesChart, { type Series } from '@/components/charts/TimeSeriesChart';

// A distinct color per skill line: use a mid-scale BB color offset so lines are distinguishable.
const LINE_COLORS = [ '#e5a64b', '#0eae28', '#b70b5a', '#30139f', '#db6e04', '#0eb366', '#a70b00', '#910b9d', '#8e9800', '#498e00', '#cb3100', '#9c0b32' ];

export default function SkillProgression({ series }: { series: Record<string, { x: number; y: number }[]> }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const chartSeries: Series[] = SKILLS.map((s, i) => ({
    key: s.dbKey, color: LINE_COLORS[i % LINE_COLORS.length], points: series[s.dbKey] ?? [], visible: !hidden.has(s.dbKey),
  }));
  return (
    <div>
      <TimeSeriesChart series={chartSeries} yMin={1} yMax={20} />
      <div className="flex flex-wrap gap-2 mt-2">
        {SKILLS.map((s, i) => (
          <button key={s.dbKey} onClick={() => toggle(s.dbKey)}
            className={`text-xs px-1.5 py-0.5 rounded border ${hidden.has(s.dbKey) ? 'border-neutral-800 text-neutral-600' : 'border-neutral-700'}`}
            style={hidden.has(s.dbKey) ? {} : { color: LINE_COLORS[i % LINE_COLORS.length] }}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
