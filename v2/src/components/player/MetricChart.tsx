'use client';

import TimeSeriesChart from '@/components/charts/TimeSeriesChart';

export default function MetricChart({
  points, color, unit,
}: {
  points: { x: number; y: number }[];
  color: string;
  unit: 'k' | '';
}) {
  const yMax = Math.max(1, ...points.map((p) => p.y));
  const formatY = unit === 'k' ? (v: number) => `${Math.round(v / 1000)}k` : undefined;
  return (
    <TimeSeriesChart
      series={[{ key: 'metric', color, points }]}
      yMin={0}
      yMax={yMax}
      formatY={formatY}
    />
  );
}
