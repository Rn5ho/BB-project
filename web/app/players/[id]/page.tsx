"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  SKILLS,
  SKILL_LEVELS,
  POTENTIAL_LEVELS,
  POSITIONS,
  getSkillColor,
  getPotentialColor,
} from "@/lib/constants";

import type { Player, SkillSnapshot, PlayerNote, PlayerTag } from "@/lib/types";
import type { SkillDbKey } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";
import SkillDelta from "@/components/SkillDelta";
import Link from "next/link";

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = Number(params.id);

  const [player, setPlayer] = useState<Player | null>(null);
  const [snapshots, setSnapshots] = useState<SkillSnapshot[]>([]);
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [tags, setTags] = useState<PlayerTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (playerId) loadPlayerData();
  }, [playerId]);

  async function loadPlayerData() {
    setLoading(true);

    const [playerRes, snapshotsRes, notesRes, tagsRes] = await Promise.all([
      supabase.from("players").select("*").eq("id", playerId).single(),
      supabase
        .from("skill_snapshots")
        .select("*")
        .eq("player_id", playerId)
        .order("captured_at", { ascending: false }),
      supabase
        .from("player_notes")
        .select("*")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false }),
      supabase.from("player_tags").select("*").eq("player_id", playerId),
    ]);

    if (playerRes.data) setPlayer(playerRes.data);
    if (snapshotsRes.data) setSnapshots(snapshotsRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    if (tagsRes.data) setTags(tagsRes.data);

    setLoading(false);
  }

  async function addNote() {
    if (!newNote.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("player_notes")
      .insert({
        player_id: playerId,
        author_id: user.id,
        content: newNote.trim(),
      })
      .select()
      .single();

    if (data && !error) {
      setNotes([data, ...notes]);
      setNewNote("");
    }
  }

  async function deleteNote(noteId: number) {
    await supabase.from("player_notes").delete().eq("id", noteId);
    setNotes(notes.filter((n) => n.id !== noteId));
  }

  async function addTag() {
    if (!newTag.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("player_tags")
      .insert({
        player_id: playerId,
        user_id: user.id,
        tag: newTag.trim().toLowerCase(),
      })
      .select()
      .single();

    if (data && !error) {
      setTags([...tags, data]);
      setNewTag("");
    }
  }

  async function removeTag(tagId: number) {
    await supabase.from("player_tags").delete().eq("id", tagId);
    setTags(tags.filter((t) => t.id !== tagId));
  }

  async function updatePosition(newPosition: string | null) {
    if (!player) return;
    const { error } = await supabase
      .from("players")
      .update({ position: newPosition })
      .eq("id", playerId);

    if (!error) {
      setPlayer({ ...player, position: newPosition });
    }
  }

  const latestSnapshot = snapshots[0] || null;
  const previousSnapshot = snapshots[1] || null;

  // Check if this player has any skill data at all
  const SKILL_KEYS = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing', 'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw'];
  const hasAnySkills = latestSnapshot
    ? SKILL_KEYS.some(k => latestSnapshot[k as keyof SkillSnapshot] != null)
    : false;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div style={{ color: "var(--accent)" }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-gray-400">Player not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Back link */}
        <Link
          href={player.nationality === "Slovenia" || !player.nationality ? "/slovenia" : "/opponents"}
          className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          &larr; {player.nationality === "Slovenia" || !player.nationality ? "Back to Slovenia" : "Back to Opponents"}
        </Link>

        {/* Player Header */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">{player.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>
                  <a
                    href={`https://www.buzzerbeater.com/player/${player.bb_player_id}/overview.aspx`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors underline"
                    style={{ color: "var(--accent)" }}
                  >
                    View on BuzzerBeater ↗
                  </a>
                </span>
                {latestSnapshot?.age && <span>Age: {latestSnapshot.age}</span>}
                {player.height && <span>Height: {player.height}</span>}
                <span className="flex items-center gap-1">
                  Position:{" "}
                  <select
                    value={player.position || ""}
                    onChange={(e) =>
                      updatePosition(e.target.value || null)
                    }
                    className="px-1.5 py-0.5 rounded text-xs text-white focus:outline-none cursor-pointer"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <option value="">—</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            </div>
            <div className="text-right">
              {latestSnapshot && (
                <>
                  <div className="text-sm text-gray-400">
                    DMI:{" "}
                    <span className="text-white font-mono">
                      {latestSnapshot.dmi}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Potential:{" "}
                    <span
                      style={{
                        color: getPotentialColor(latestSnapshot.potential),
                      }}
                    >
                      {POTENTIAL_LEVELS[latestSnapshot.potential || 0]}
                    </span>
                  </div>
                  {latestSnapshot.game_shape != null && (
                    <div className="text-sm text-gray-400">
                      Game Shape:{" "}
                      <span style={{ color: getSkillColor(latestSnapshot.game_shape) }}>
                        {latestSnapshot.game_shape} ({SKILL_LEVELS[latestSnapshot.game_shape] || "?"})
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    Salary: ${latestSnapshot.salary?.toLocaleString() || "?"}
                  </div>
                  {latestSnapshot.skill_points != null && (
                    <div className="text-sm text-gray-400">
                      TSP: {latestSnapshot.skill_points}
                    </div>
                  )}
                  <Link
                    href={`/training?player=${player.id}`}
                    className="inline-block mt-2 px-3 py-1 rounded text-xs font-medium text-white transition-colors"
                    style={{ background: "var(--accent)" }}
                  >
                    Simulate Training
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: "var(--accent)", opacity: 0.9 }}
              >
                {tag.tag}
                <button
                  onClick={() => removeTag(tag.id)}
                  className="ml-0.5 hover:text-red-300"
                >
                  &times;
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag..."
                className="px-2 py-0.5 rounded text-xs text-white focus:outline-none w-24"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--card-border)",
                }}
              />
              <button
                onClick={addTag}
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: "var(--accent)" }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Skills or DMI-only Summary */}
          <div
            className="lg:col-span-2 rounded-lg p-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            {hasAnySkills ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Current Skills</h2>
                {latestSnapshot && (
                  <div className="grid grid-cols-2 gap-3">
                    {SKILLS.map((skill) => {
                      const value = latestSnapshot[skill.dbKey as keyof SkillSnapshot] as number | null;
                      const prevValue = previousSnapshot
                        ? (previousSnapshot[skill.dbKey as keyof SkillSnapshot] as number | null)
                        : null;
                      return (
                        <div
                          key={skill.dbKey}
                          className="flex items-center justify-between py-1.5 px-3 rounded"
                          style={{
                            background: `${getSkillColor(value)}10`,
                          }}
                        >
                          <span className="text-sm text-gray-300">
                            {skill.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <SkillBadge value={value} />
                            {previousSnapshot && (
                              <SkillDelta
                                oldValue={prevValue}
                                newValue={value}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : latestSnapshot ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Player Overview</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Individual skills are not visible for this player. Tracking DMI and game shape over time.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: "var(--background)" }}>
                    <div className="text-xs text-gray-400 mb-1">DMI</div>
                    <div className="text-2xl font-bold font-mono">
                      {latestSnapshot.dmi?.toLocaleString() ?? "-"}
                    </div>
                    {previousSnapshot?.dmi != null && latestSnapshot.dmi != null && (
                      <div className={`text-sm mt-1 ${latestSnapshot.dmi > previousSnapshot.dmi ? "text-emerald-400" : latestSnapshot.dmi < previousSnapshot.dmi ? "text-red-400" : "text-gray-500"}`}>
                        {latestSnapshot.dmi > previousSnapshot.dmi ? "+" : ""}
                        {(latestSnapshot.dmi - previousSnapshot.dmi).toLocaleString()} from last scan
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "var(--background)" }}>
                    <div className="text-xs text-gray-400 mb-1">Game Shape</div>
                    <div className="text-2xl font-bold" style={{ color: getSkillColor(latestSnapshot.game_shape) }}>
                      {latestSnapshot.game_shape ?? "-"}
                      {latestSnapshot.game_shape != null && (
                        <span className="text-sm ml-2 text-gray-400">
                          ({SKILL_LEVELS[latestSnapshot.game_shape] || "?"})
                        </span>
                      )}
                    </div>
                    {latestSnapshot.game_shape != null && latestSnapshot.game_shape < 9 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Not at peak shape (9 = proficient = 100%)
                      </div>
                    )}
                    {latestSnapshot.game_shape != null && latestSnapshot.game_shape >= 9 && (
                      <div className="text-xs text-emerald-400 mt-1">
                        At peak game shape
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "var(--background)" }}>
                    <div className="text-xs text-gray-400 mb-1">Height</div>
                    <div className="text-lg font-mono">{player.height || "-"}</div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "var(--background)" }}>
                    <div className="text-xs text-gray-400 mb-1">Salary</div>
                    <div className="text-lg font-mono">
                      {latestSnapshot.salary != null ? `$${latestSnapshot.salary.toLocaleString()}` : "-"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Player Overview</h2>
                <p className="text-gray-400">No data captured yet.</p>
              </>
            )}

            {latestSnapshot && (
              <div className="mt-4 text-xs text-gray-500">
                Last captured:{" "}
                {new Date(latestSnapshot.captured_at).toLocaleString()} | Source:{" "}
                {latestSnapshot.source} | Team: {latestSnapshot.owner_team_name || "?"}
              </div>
            )}
          </div>

          {/* Notes */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this player..."
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none resize-none"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--card-border)",
                }}
                rows={3}
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="mt-2 px-4 py-1.5 rounded text-sm font-medium text-white disabled:opacity-50 transition-colors"
                style={{ background: "var(--accent)" }}
              >
                Add Note
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-sm">No notes yet.</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg"
                    style={{ background: "var(--background)" }}
                  >
                    <p className="text-sm">{note.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Snapshot History */}
        {snapshots.length > 1 && (
          <div
            className="rounded-lg p-6 mt-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">
              {hasAnySkills ? "Skill History" : "DMI History"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left text-xs text-gray-400">
                      Date
                    </th>
                    <th className="px-2 py-1 text-left text-xs text-gray-400">
                      Age
                    </th>
                    {hasAnySkills ? (
                      <>
                        {SKILLS.map((skill) => (
                          <th
                            key={skill.dbKey}
                            className="px-2 py-1 text-center text-xs text-gray-400"
                            title={skill.name}
                          >
                            {skill.name
                              .replace("Outside Def.", "OD")
                              .replace("Inside Def.", "ID")
                              .replace("Jump Shot", "JS")
                              .replace("Jump Range", "JR")
                              .replace("Inside Shot", "IS")
                              .replace("Shot Blocking", "SB")
                              .replace("Free Throw", "FT")
                              .replace("Rebounding", "Reb")
                              .replace("Handling", "Han")
                              .replace("Driving", "Dri")
                              .replace("Passing", "Pas")
                              .replace("Stamina", "Sta")}
                          </th>
                        ))}
                        <th className="px-2 py-1 text-center text-xs text-gray-400">
                          SP
                        </th>
                      </>
                    ) : (
                      <th className="px-2 py-1 text-center text-xs text-gray-400">
                        Shape
                      </th>
                    )}
                    <th className="px-2 py-1 text-center text-xs text-gray-400">
                      DMI
                    </th>
                    <th className="px-2 py-1 text-center text-xs text-gray-400">
                      Shape
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap, idx) => {
                    const prevSnap = snapshots[idx + 1] || null;
                    const dmiDiff = snap.dmi != null && prevSnap?.dmi != null ? snap.dmi - prevSnap.dmi : 0;
                    return (
                      <tr
                        key={snap.id}
                        className="hover:bg-white/5"
                        style={{
                          borderTop:
                            idx > 0
                              ? "1px solid var(--card-border)"
                              : "none",
                        }}
                      >
                        <td className="px-2 py-1 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(snap.captured_at).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-1 text-xs">{snap.age}</td>
                        {hasAnySkills ? (
                          <>
                            {SKILLS.map((skill) => {
                              const val = snap[skill.dbKey as keyof SkillSnapshot] as number | null;
                              const prevVal = prevSnap
                                ? (prevSnap[skill.dbKey as keyof SkillSnapshot] as number | null)
                                : null;
                              const diff =
                                val !== null && prevVal !== null
                                  ? val - prevVal
                                  : 0;
                              return (
                                <td
                                  key={skill.dbKey}
                                  className="px-2 py-1 text-center text-xs font-mono"
                                  style={{ color: getSkillColor(val) }}
                                >
                                  {val ?? "-"}
                                  {diff > 0 && (
                                    <span className="text-emerald-400 ml-0.5">
                                      +{diff}
                                    </span>
                                  )}
                                  {diff < 0 && (
                                    <span className="text-red-400 ml-0.5">
                                      {diff}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-2 py-1 text-center text-xs font-mono">
                              {snap.skill_points ?? "-"}
                            </td>
                          </>
                        ) : (
                          <td className="px-2 py-1 text-center text-xs" style={{ color: getSkillColor(snap.game_shape) }}>
                            {snap.game_shape ?? "-"}
                            {snap.game_shape != null && (
                              <span className="text-gray-500 ml-1">
                                ({SKILL_LEVELS[snap.game_shape] || "?"})
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-2 py-1 text-center text-xs font-mono">
                          {snap.dmi != null ? snap.dmi.toLocaleString() : "-"}
                          {dmiDiff > 0 && (
                            <span className="text-emerald-400 ml-0.5">
                              +{dmiDiff.toLocaleString()}
                            </span>
                          )}
                          {dmiDiff < 0 && (
                            <span className="text-red-400 ml-0.5">
                              {dmiDiff.toLocaleString()}
                            </span>
                          )}
                        </td>
                        {(() => {
                          const gs = snap.game_shape;
                          const prevGs = prevSnap?.game_shape;
                          const gsDiff = gs != null && prevGs != null ? gs - prevGs : 0;
                          return (
                            <td className="px-2 py-1 text-center text-xs" style={{ color: getSkillColor(gs) }}>
                              {gs ?? "-"}
                              {gsDiff > 0 && (
                                <span className="text-emerald-400 ml-0.5">+{gsDiff}</span>
                              )}
                              {gsDiff < 0 && (
                                <span className="text-red-400 ml-0.5">{gsDiff}</span>
                              )}
                            </td>
                          );
                        })()}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
