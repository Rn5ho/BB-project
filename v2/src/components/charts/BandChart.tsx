'use client';

import { buildLinePath, scaleLinear } from '@/lib/chart-scale';

export interface BandPoint { x: number; central: number; low: number; high: number }

export default function BandChart({
  points, height = 180, formatY, xLabel,
}: {
  points: BandPoint[];
  height?: number;
  formatY?: (v: number) => string;
  xLabel?: (x: number) => string;
}) {
  if (points.length === 0) return <p className="text-sm text-neutral-500">No projection yet.</p>;

  const width = 640;
  const pad = 32;
  const innerW = width - pad * 2;
  const innerH = height - pad;
  const yTicks = 4;

  const xs = points.map((p) => p.x);
  const xDomain: [number, number] = [Math.min(...xs), Math.max(...xs)];
  const yMin = Math.min(...points.map((p) => p.low));
  const yMax = Math.max(...points.map((p) => p.high));

  const sx = scaleLinear(xDomain, [0, innerW]);
  const sy = scaleLinear([yMin, yMax], [innerH, 0]);

  const areaPath = points.length > 1
    ? [
      ...points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x)},${sy(p.high)}`),
      ...[...points].reverse().map((p) => `L${sx(p.x)},${sy(p.low)}`),
      'Z',
    ].join(' ')
    : '';
  const centralLine = buildLinePath(
    points.map((p) => ({ x: p.x, y: p.central })), xDomain, [yMin, yMax], innerW, innerH,
  );

  const labelEvery = Math.max(1, Math.ceil(points.length / 12));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
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
        {areaPath && <path d={areaPath} fill="#f59e0b22" stroke="none" />}
        <path d={centralLine} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      </g>
      {xLabel && (
        <g>
          {points.map((p, i) => (i % labelEvery === 0 ? (
            <text key={i} x={pad + sx(p.x)} y={height - 6} fontSize="9" fill="#737373" textAnchor="middle">
              {xLabel(p.x)}
            </text>
          ) : null))}
        </g>
      )}
    </svg>
  );
}
