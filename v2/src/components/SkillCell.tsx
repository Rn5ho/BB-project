import { getSkillColor } from '@/lib/constants';

export default function SkillCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-neutral-600">–</span>;
  return <span style={{ color: getSkillColor(value) }} className="font-mono font-semibold">{value}</span>;
}
