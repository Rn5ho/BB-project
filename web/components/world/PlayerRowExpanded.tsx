"use client";

import type { SkillSnapshot } from "@/lib/types";
import { SKILL_LEVELS, getSkillColor } from "@/lib/constants";

interface Props {
  snapshot: SkillSnapshot;
}

const SKILLS: { key: keyof SkillSnapshot; label: string }[] = [
  { key: "jump_shot", label: "JS" },
  { key: "jump_range", label: "JR" },
  { key: "outside_def", label: "OD" },
  { key: "handling", label: "HA" },
  { key: "driving", label: "DR" },
  { key: "passing", label: "PA" },
  { key: "inside_shot", label: "IS" },
  { key: "inside_def", label: "ID" },
  { key: "rebounding", label: "RB" },
  { key: "shot_blocking", label: "SB" },
  { key: "stamina", label: "ST" },
  { key: "free_throw", label: "FT" },
];

export function PlayerRowExpanded({ snapshot }: Props) {
  return (
    <div
      className="px-4 py-3 grid grid-cols-4 gap-x-6 gap-y-1 text-sm"
      style={{ background: "var(--background)" }}
    >
      {SKILLS.map(({ key, label }) => {
        const value = snapshot[key] as number | null;
        if (value == null) {
          return (
            <div key={String(key)} className="flex justify-between text-gray-500">
              <span>{label}</span>
              <span>-</span>
            </div>
          );
        }
        return (
          <div key={String(key)} className="flex justify-between">
            <span className="text-gray-400">{label}</span>
            <span style={{ color: getSkillColor(value) }}>
              {value} <span className="text-gray-500 text-xs">({SKILL_LEVELS[value] || "?"})</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
