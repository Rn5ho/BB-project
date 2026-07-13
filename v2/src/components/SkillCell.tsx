import { getSkillColor } from '@/lib/constants';

export default function SkillCell({ value, delta }: { value: number | null; delta?: number | null }) {
  if (value == null) return <span className="text-neutral-600">–</span>;
  return (
    <span className="whitespace-nowrap">
      <span style={{ color: getSkillColor(value) }} className="font-mono font-semibold">{value}</span>
      {delta != null && delta !== 0 && (
        <sup className={delta > 0 ? 'text-green-400' : 'text-red-400'}>
          {delta > 0 ? `+${delta}` : delta}
        </sup>
      )}
    </span>
  );
}
