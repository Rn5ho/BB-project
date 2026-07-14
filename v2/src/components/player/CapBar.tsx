import { capThreshold, potentialScore } from '@/lib/training/salary';
import { SKILL_DB_NAMES, SKILL_KEYS, skillsFromArray } from '@/lib/training/types';

function lerpColor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

export default function CapBar({
  skills, potential,
}: {
  skills: Record<string, number | null>;
  potential: number | null;
}) {
  const values = SKILL_KEYS.map((k) => skills[SKILL_DB_NAMES[k]]);
  if (potential == null || values.some((v) => v == null)) {
    return <p className="text-sm text-neutral-500">– (need full skills + potential)</p>;
  }

  const s = skillsFromArray(values as number[]);
  const { score, capPosition } = potentialScore(s);
  const t1 = capThreshold(potential); // 8 + 2p — soft cap (stage 1)
  const t2 = t1 + 1;                  // 9 + 2p — stage 2
  const t3 = t1 + 2;                  // 10 + 2p — hard cap (deepest stage)

  const pct = (v: number) => Math.max(0, Math.min(100, (v / t3) * 100));
  let color = '#34d399';
  if (score >= t1) {
    const t = Math.max(0, Math.min(1, (score - t1) / (t3 - t1)));
    color = lerpColor('#f59e0b', '#f87171', t);
  }

  return (
    <div>
      <div className="relative h-4 rounded bg-neutral-800 overflow-hidden">
        <div className="h-full" style={{ width: `${pct(score)}%`, background: color }} />
        {[t1, t2, t3].map((v, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-px bg-neutral-950/70" style={{ left: `${pct(v)}%` }} />
        ))}
      </div>
      <div className="relative text-[10px] text-neutral-500 mt-0.5 h-3">
        <span className="absolute" style={{ left: `${pct(t1)}%`, transform: 'translateX(-50%)' }}>soft cap</span>
        <span className="absolute" style={{ left: `${pct(t3)}%`, transform: 'translateX(-100%)' }}>hard cap</span>
      </div>
      <p className="text-xs text-neutral-400 mt-1">
        {score.toFixed(1)} / {t3} — capping via {capPosition}
      </p>
    </div>
  );
}
