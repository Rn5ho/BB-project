"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SKILLS, SKILL_LEVELS, POTENTIAL_LEVELS } from "@/lib/constants";
import type { Player } from "@/lib/types";
import Navbar from "@/components/Navbar";

export default function ManualEntryPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // New player form
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerBbId, setNewPlayerBbId] = useState("");
  const [newPlayerPosition, setNewPlayerPosition] = useState("");
  const [newPlayerHeight, setNewPlayerHeight] = useState("");

  // Snapshot form
  const [age, setAge] = useState("");
  const [salary, setSalary] = useState("");
  const [potential, setPotential] = useState("");
  const [dmi, setDmi] = useState("");
  const [gameShape, setGameShape] = useState("");
  const [experience, setExperience] = useState("");
  const [skillPoints, setSkillPoints] = useState("");
  const [skills, setSkills] = useState<Record<string, string>>({});
  const [ownerTeam, setOwnerTeam] = useState("");

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("name");
    if (data) setPlayers(data);
    setLoading(false);
  }

  function updateSkill(dbKey: string, value: string) {
    setSkills((prev) => ({ ...prev, [dbKey]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      let playerId = selectedPlayerId;

      // Create new player if needed
      if (isNewPlayer) {
        if (!newPlayerName || !newPlayerBbId) {
          throw new Error("Player name and BB ID are required");
        }

        const { data, error } = await supabase
          .from("players")
          .upsert(
            {
              bb_player_id: parseInt(newPlayerBbId),
              name: newPlayerName,
              position: newPlayerPosition || null,
              height: newPlayerHeight || null,
              nationality: "Slovenia",
            },
            { onConflict: "bb_player_id" }
          )
          .select()
          .single();

        if (error) throw error;
        playerId = data.id;
      }

      if (!playerId) throw new Error("Please select a player");

      // Build snapshot
      const snapshot: Record<string, unknown> = {
        player_id: playerId,
        captured_by: user.id,
        source: "manual",
        age: age ? parseInt(age) : null,
        salary: salary ? parseInt(salary) : null,
        potential: potential ? parseInt(potential) : null,
        dmi: dmi ? parseInt(dmi) : null,
        game_shape: gameShape ? parseInt(gameShape) : null,
        experience: experience ? parseInt(experience) : null,
        skill_points: skillPoints ? parseInt(skillPoints) : null,
        owner_team_name: ownerTeam || null,
      };

      // Add skills
      for (const skill of SKILLS) {
        const val = skills[skill.dbKey];
        snapshot[skill.dbKey] = val ? parseInt(val) : null;
      }

      const { error } = await supabase
        .from("skill_snapshots")
        .insert(snapshot);

      if (error) throw error;

      setMessage("Snapshot saved successfully!");
      // Refresh player list in case we added a new one
      if (isNewPlayer) {
        loadPlayers();
        setIsNewPlayer(false);
      }
    } catch (err: unknown) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">Manual Entry</h1>
        <p className="text-gray-400 text-sm mb-6">
          Manually enter or update player skill data. Useful for club managers
          tracking their own players&apos; weekly training progress.
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.startsWith("Error")
                ? "bg-red-500/10 border border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Player Selection */}
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">Player</h2>

            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => setIsNewPlayer(false)}
                className={`px-3 py-1 rounded text-sm ${
                  !isNewPlayer ? "text-white" : "text-gray-400"
                }`}
                style={
                  !isNewPlayer
                    ? { background: "var(--accent)" }
                    : { background: "var(--background)" }
                }
              >
                Existing Player
              </button>
              <button
                type="button"
                onClick={() => setIsNewPlayer(true)}
                className={`px-3 py-1 rounded text-sm ${
                  isNewPlayer ? "text-white" : "text-gray-400"
                }`}
                style={
                  isNewPlayer
                    ? { background: "var(--accent)" }
                    : { background: "var(--background)" }
                }
              >
                New Player
              </button>
            </div>

            {isNewPlayer ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Player Name *
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                    required={isNewPlayer}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    BB Player ID *
                  </label>
                  <input
                    type="number"
                    value={newPlayerBbId}
                    onChange={(e) => setNewPlayerBbId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                    required={isNewPlayer}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Position
                  </label>
                  <select
                    value={newPlayerPosition}
                    onChange={(e) => setNewPlayerPosition(e.target.value)}
                    className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <option value="">Select...</option>
                    {["PG", "SG", "SF", "PF", "C"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    value={newPlayerHeight}
                    onChange={(e) => setNewPlayerHeight(e.target.value)}
                    placeholder="e.g. 198 cm"
                    className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                  />
                </div>
              </div>
            ) : (
              <select
                value={selectedPlayerId || ""}
                onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded text-sm text-white focus:outline-none"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--card-border)",
                }}
              >
                <option value="">Select a player...</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (#{p.bb_player_id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Metadata */}
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">Player Info</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Age", value: age, setter: setAge, type: "number" },
                {
                  label: "Salary",
                  value: salary,
                  setter: setSalary,
                  type: "number",
                },
                { label: "DMI", value: dmi, setter: setDmi, type: "number" },
                {
                  label: "Skill Points",
                  value: skillPoints,
                  setter: setSkillPoints,
                  type: "number",
                },
                {
                  label: "Owner Team",
                  value: ownerTeam,
                  setter: setOwnerTeam,
                  type: "text",
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs text-gray-400 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Potential
                </label>
                <select
                  value={potential}
                  onChange={(e) => setPotential(e.target.value)}
                  className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <option value="">Select...</option>
                  {Object.entries(POTENTIAL_LEVELS).map(([num, text]) => (
                    <option key={num} value={num}>
                      {num} - {text}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Game Shape
                </label>
                <select
                  value={gameShape}
                  onChange={(e) => setGameShape(e.target.value)}
                  className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <option value="">Select...</option>
                  {Object.entries(SKILL_LEVELS).map(([num, text]) => (
                    <option key={num} value={num}>
                      {num} - {text}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Experience
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <option value="">Select...</option>
                  {Object.entries(SKILL_LEVELS).map(([num, text]) => (
                    <option key={num} value={num}>
                      {num} - {text}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">Skills</h2>
            <div className="grid grid-cols-2 gap-4">
              {SKILLS.map((skill) => (
                <div key={skill.dbKey}>
                  <label className="block text-xs text-gray-400 mb-1">
                    {skill.name}
                  </label>
                  <select
                    value={skills[skill.dbKey] || ""}
                    onChange={(e) => updateSkill(skill.dbKey, e.target.value)}
                    className="w-full px-3 py-1.5 rounded text-sm text-white focus:outline-none"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <option value="">Select...</option>
                    {Object.entries(SKILL_LEVELS).map(([num, text]) => (
                      <option key={num} value={num}>
                        {num} - {text}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "Saving..." : "Save Snapshot"}
          </button>
        </form>
      </div>
    </div>
  );
}
