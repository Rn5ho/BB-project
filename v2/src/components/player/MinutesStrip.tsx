import { eligibleTrainings, fullTrainingMinutes } from '@/lib/training/bridge';
import { getTrainingType } from '@/lib/training/catalog';
import type { WeekMinutes } from '@/queries/minutes';

type PosField = 'minPg' | 'minSg' | 'minSf' | 'minPf' | 'minC';

const STACK_ORDER: PosField[] = ['minPg', 'minSg', 'minSf', 'minPf', 'minC'];
const POSITION_COLORS: Record<PosField, string> = {
  minPg: '#60a5fa', minSg: '#34d399', minSf: '#a78bfa', minPf: '#f59e0b', minC: '#f87171',
};
const POSITION_LABELS: Record<PosField, string> = {
  minPg: 'PG', minSg: 'SG', minSf: 'SF', minPf: 'PF', minC: 'C',
};

/** Server-renderable — pure props→SVG, no client state. */
export default function MinutesStrip({ weeks, age }: { weeks: WeekMinutes[]; age: number | null }) {
  if (weeks.length === 0) {
    return <p className="text-sm text-neutral-500">No match minutes captured yet — the weekly sync fills this in.</p>;
  }

  const width = 640;
  const height = 180;
  const pad = 32;
  const innerW = width - pad * 2;
  const innerH = height - pad;
  const yTicks = 4;

  const totals = weeks.map((w) => w.minPg + w.minSg + w.minSf + w.minPf + w.minC);
  const yMax = Math.max(96, ...totals);
  const scaleY = (v: number) => pad / 2 + innerH - (innerH * v) / yMax;
  const threshold = age != null ? fullTrainingMinutes(age) : null;

  const slot = innerW / weeks.length;
  const barWidth = Math.min(24, slot * 0.6);

  const latest = weeks[weeks.length - 1];
  const chipIds = age != null
    ? eligibleTrainings(latest, age).filter((id) => getTrainingType(id).kind === 'skill')
    : [];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = (yMax * i) / yTicks;
          const y = scaleY(v);
          return (
            <g key={i}>
              <line x1={pad} x2={width - pad} y1={y} y2={y} stroke="#262626" />
              <text x={4} y={y + 3} fontSize="9" fill="#737373">{Math.round(v)}</text>
            </g>
          );
        })}
        {threshold != null && (
          <line
            x1={pad} x2={width - pad} y1={scaleY(threshold)} y2={scaleY(threshold)}
            stroke="#737373" strokeWidth="1" strokeDasharray="4 3"
          />
        )}
        {weeks.map((w, i) => {
          const x = pad + slot * i + (slot - barWidth) / 2;
          let cum = 0;
          return (
            <g key={i}>
              {STACK_ORDER.map((k) => {
                const v = w[k];
                if (v <= 0) return null;
                const y0 = scaleY(cum);
                cum += v;
                const y1 = scaleY(cum);
                return <rect key={k} x={x} y={y1} width={barWidth} height={y0 - y1} fill={POSITION_COLORS[k]} />;
              })}
              {i % 2 === 0 && (
                <text x={x + barWidth / 2} y={height - 6} fontSize="9" fill="#737373" textAnchor="middle">
                  {`S${w.season}W${w.seasonWeek}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-3 mt-1 text-xs text-neutral-400">
        {STACK_ORDER.map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: POSITION_COLORS[k] }} />
            {POSITION_LABELS[k]}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {chipIds.length > 0 ? (
          chipIds.map((id) => (
            <span key={id} className="text-xs rounded px-2 py-0.5 bg-amber-900/30 text-amber-300">
              {getTrainingType(id).name}
            </span>
          ))
        ) : (
          <span className="text-xs text-neutral-500">No full-training slot last week</span>
        )}
      </div>
    </div>
  );
}
