import type { PosSegment } from '@/lib/series';

export default function PositionTimeline({ segments }: { segments: PosSegment[] }) {
  if (segments.length === 0) return <p className="text-sm text-neutral-500">No position history yet.</p>;
  return (
    <div className="flex items-stretch gap-1">
      {segments.map((s, i) => (
        <div key={i} className="flex-1 rounded bg-neutral-900 border border-neutral-800 px-2 py-1 text-center">
          <div className="font-medium">{s.position}</div>
          <div className="text-xs text-neutral-500">{s.from.toISOString().slice(0, 10)}</div>
        </div>
      ))}
    </div>
  );
}
