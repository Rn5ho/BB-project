"use client";

import { SKILL_LEVELS, getSkillColor } from "@/lib/constants";

interface SkillBadgeProps {
  value: number | null;
  showNumber?: boolean;
  size?: "sm" | "md";
}

export default function SkillBadge({
  value,
  showNumber = true,
  size = "md",
}: SkillBadgeProps) {
  if (value === null) {
    return (
      <span className="text-gray-500 italic" style={{ fontSize: size === "sm" ? 11 : 13 }}>
        N/A
      </span>
    );
  }

  const color = getSkillColor(value);
  const text = SKILL_LEVELS[value] || `Level ${value}`;

  return (
    <span
      className="font-medium"
      style={{ color, fontSize: size === "sm" ? 11 : 13 }}
    >
      {text}
      {showNumber && (
        <span className="ml-1 opacity-60">({value})</span>
      )}
    </span>
  );
}
