'use client';

import TimeSeriesChart, { type Series } from '@/components/charts/TimeSeriesChart';

/** Client wrapper: Next 16 forbids server→client function props, so the y-axis
 *  formatter is derived here from a plain `unit` string (MetricChart pattern). */
export default function ScorecardTrend({ series, unit, yMax }: {
  series: Series[]; unit: '%' | 'lvl'; yMax: number;
}) {
  return (
    <TimeSeriesChart
      series={series}
      yMin={0}
      yMax={yMax}
      formatY={unit === '%' ? (v: number) => `${Math.round(v)}%` : (v: number) => v.toFixed(1)}
    />
  );
}
