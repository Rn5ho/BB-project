'use client';

import { buildLinePath } from '@/lib/chart-scale';

export interface Series { key: string; color: string; points: { x: number; y: number }[]; visible?: boolean }

export default function TimeSeriesChart({
  series, yMin, yMax, height = 180, formatY,
}: { series: Series[]; yMin: number; yMax: number; height?: number; formatY?: (v: number) => string }) {
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) return <p className="text-sm text-neutral-500">No data yet.</p>;
  const xs = all.map((p) => p.x);
  const xDomain: [number, number] = [Math.min(...xs), Math.max(...xs)];
  const width = 640;
  const pad = 32;
  const innerW = width - pad * 2;
  const innerH = height - pad;
  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
      {/* y gridlines + labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = yMin + ((yMax - yMin) * i) / yTicks;
        const y = pad / 2 + innerH - (innerH * i) / yTicks;
        return (
          <g key={i}>
            <line x1={pad} x2={width - pad} y1={y} y2={y} stroke="#262626" />
            <text x={4} y={y + 3} fontSize="9" fill="#737373">{formatY ? formatY(v) : Math.round(v)}</text>
          </g>
        );
      })}
      <g transform={`translate(${pad},${pad / 2})`}>
        {series.filter((s) => s.visible !== false).map((s) => (
          <path key={s.key} d={buildLinePath(s.points, xDomain, [yMin, yMax], innerW, innerH)}
            fill="none" stroke={s.color} strokeWidth="1.5" />
        ))}
        {series.filter((s) => s.visible !== false).flatMap((s) =>
          s.points.map((p, i) => {
            const sx = (innerW * (p.x - xDomain[0])) / Math.max(1, xDomain[1] - xDomain[0]);
            const sy = innerH - (innerH * (p.y - yMin)) / Math.max(1, yMax - yMin);
            return <circle key={`${s.key}-${i}`} cx={sx} cy={sy} r="2" fill={s.color} />;
          }),
        )}
      </g>
    </svg>
  );
}
