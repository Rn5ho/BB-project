"use client";

import { SKILL_LEVELS } from "@/lib/constants";

interface SkillDeltaProps {
  oldValue: number | null;
  newValue: number | null;
}

export default function SkillDelta({ oldValue, newValue }: SkillDeltaProps) {
  if (oldValue === null || newValue === null) return null;

  const diff = newValue - oldValue;
  if (diff === 0) return <span className="text-gray-500 text-xs">-</span>;

  const oldText = SKILL_LEVELS[oldValue] || `${oldValue}`;
  const newText = SKILL_LEVELS[newValue] || `${newValue}`;

  if (diff > 0) {
    return (
      <span className="text-emerald-400 text-xs">
        {oldText} &rarr; {newText}{" "}
        <span className="font-bold">+{diff}</span>
      </span>
    );
  }

  return (
    <span className="text-red-400 text-xs">
      {oldText} &rarr; {newText}{" "}
      <span className="font-bold">{diff}</span>
    </span>
  );
}
