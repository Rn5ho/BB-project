"use client";

interface Props {
  hasFullSkills: boolean;
  seasonDelta: number | null;
}

export function FullSkillsBadge({ hasFullSkills, seasonDelta }: Props) {
  if (!hasFullSkills) {
    return <span className="text-blue-400">DMI only</span>;
  }
  if (seasonDelta == null || seasonDelta === 0) {
    return <span className="text-emerald-400">Full skills</span>;
  }
  if (seasonDelta === 1) {
    return <span className="text-amber-400">Full skills · 1s ago</span>;
  }
  return <span className="text-red-400">Full skills · {seasonDelta}s ago</span>;
}
