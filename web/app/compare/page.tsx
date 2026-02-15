"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SKILLS, SKILL_LEVELS, getSkillColor } from "@/lib/constants";
import type { Player, SkillSnapshot } from "@/lib/types";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";

interface PlayerOption {
  player: Player;
  snapshot: SkillSnapshot | null;
}

export default function ComparePage() {
  const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .order("name");
    const { data: snapshots } = await supabase
      .from("skill_snapshots")
      .select("*")
      .order("captured_at", { ascending: false });

    const snapshotMap = new Map<number, SkillSnapshot>();
    if (snapshots) {
      for (const snap of snapshots) {
        if (!snapshotMap.has(snap.player_id)) {
          snapshotMap.set(snap.player_id, snap);
        }
      }
    }

    if (players) {
      setAllPlayers(
        players.map((p) => ({
          player: p,
          snapshot: snapshotMap.get(p.id) || null,
        }))
      );
    }
    setLoading(false);
  }

  function togglePlayer(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
  }

  const selectedPlayers = allPlayers.filter((p) =>
    selectedIds.includes(p.player.id)
  );

  // Find the max value for each skill among selected players
  function getMaxForSkill(dbKey: string): number {
    let max = 0;
    for (const p of selectedPlayers) {
      const val = p.snapshot
        ? (p.snapshot[dbKey as keyof SkillSnapshot] as number)
        : 0;
      if (val > max) max = val;
    }
    return max;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">Compare Players</h1>

        {/* Player selector */}
        <div
          className="rounded-lg p-4 mb-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-400">
              Select up to 5 players to compare:
            </span>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {allPlayers.map((p) => {
                const isSelected = selectedIds.includes(p.player.id);
                return (
                  <button
                    key={p.player.id}
                    onClick={() => togglePlayer(p.player.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isSelected ? "text-white" : "text-gray-400"
                    }`}
                    style={
                      isSelected
                        ? { background: "var(--accent)" }
                        : { background: "var(--background)", border: "1px solid var(--card-border)" }
                    }
                  >
                    {p.player.name}
                    {p.snapshot?.age ? ` (${p.snapshot.age})` : ""}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison table */}
        {selectedPlayers.length >= 2 ? (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--card-border)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "var(--card-bg)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-32">
                      Skill
                    </th>
                    {selectedPlayers.map((p) => (
                      <th
                        key={p.player.id}
                        className="px-4 py-3 text-center text-xs font-medium uppercase"
                        style={{ color: "var(--accent)" }}
                      >
                        {p.player.name}
                        <div className="text-gray-500 font-normal normal-case">
                          {p.player.position || "?"} | Age:{" "}
                          {p.snapshot?.age || "?"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Metadata rows */}
                  {[
                    { label: "DMI", key: "dmi" },
                    { label: "Potential", key: "potential" },
                    { label: "Salary", key: "salary" },
                    { label: "Skill Points", key: "skill_points" },
                  ].map((meta) => (
                    <tr
                      key={meta.key}
                      style={{ borderTop: "1px solid var(--card-border)" }}
                    >
                      <td className="px-4 py-2 text-sm text-gray-300 font-medium">
                        {meta.label}
                      </td>
                      {selectedPlayers.map((p) => {
                        const val = p.snapshot
                          ? (p.snapshot[
                              meta.key as keyof SkillSnapshot
                            ] as number)
                          : null;
                        return (
                          <td
                            key={p.player.id}
                            className="px-4 py-2 text-center text-sm font-mono"
                          >
                            {meta.key === "salary"
                              ? val
                                ? `$${val.toLocaleString()}`
                                : "-"
                              : meta.key === "potential"
                              ? val !== null
                                ? SKILLS.length > 0
                                  ? `${val} (${
                                      (
                                        {
                                          0: "announcer",
                                          1: "bench warmer",
                                          2: "role player",
                                          3: "6th man",
                                          4: "starter",
                                          5: "star",
                                          6: "allstar",
                                          7: "perennial allstar",
                                          8: "superstar",
                                          9: "MVP",
                                          10: "hall of famer",
                                          11: "all-time great",
                                        } as Record<number, string>
                                      )[val] || val
                                    })`
                                  : val
                                : "-"
                              : val ?? "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Skill rows */}
                  {SKILLS.map((skill) => {
                    const maxVal = getMaxForSkill(skill.dbKey);
                    return (
                      <tr
                        key={skill.dbKey}
                        style={{ borderTop: "1px solid var(--card-border)" }}
                        className="hover:bg-white/5"
                      >
                        <td className="px-4 py-2 text-sm text-gray-300">
                          {skill.name}
                        </td>
                        {selectedPlayers.map((p) => {
                          const val = p.snapshot
                            ? (p.snapshot[
                                skill.dbKey as keyof SkillSnapshot
                              ] as number | null)
                            : null;
                          const isBest = val !== null && val === maxVal && selectedPlayers.length > 1;
                          return (
                            <td
                              key={p.player.id}
                              className={`px-4 py-2 text-center ${
                                isBest ? "font-bold" : ""
                              }`}
                            >
                              <SkillBadge value={val} size="sm" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedPlayers.length === 1 ? (
          <div className="text-center py-12 text-gray-400">
            Select at least one more player to compare.
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Select players above to start comparing.
          </div>
        )}

        {/* CSV Export */}
        {selectedPlayers.length >= 2 && (
          <div className="mt-4 text-right">
            <button
              onClick={() => {
                const headers = [
                  "Player",
                  "Position",
                  "Age",
                  ...SKILLS.map((s) => s.name),
                  "DMI",
                  "Potential",
                  "Skill Points",
                ];
                const rows = selectedPlayers.map((p) => [
                  p.player.name,
                  p.player.position || "",
                  p.snapshot?.age || "",
                  ...SKILLS.map((s) =>
                    p.snapshot
                      ? (p.snapshot[s.dbKey as keyof SkillSnapshot] as number) ?? ""
                      : ""
                  ),
                  p.snapshot?.dmi || "",
                  p.snapshot?.potential || "",
                  p.snapshot?.skill_points || "",
                ]);

                const csv = [headers, ...rows]
                  .map((r) => r.join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "bb-scout-comparison.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-sm px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ background: "var(--accent)" }}
            >
              Export as CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
