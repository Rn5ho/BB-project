"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { POTENTIAL_LEVELS, getSkillColor, getPotentialColor } from "@/lib/constants";

interface ScoutResult {
  bbPlayerId: number;
  name: string;
  status: "created" | "updated";
  playerId: number;
}

interface ScoutError {
  bbPlayerId: number;
  error: string;
}

interface FetchedPlayer {
  bbPlayerId: number;
  name: string;
  status: "created" | "updated";
  playerId: number;
  // Populated from DB after fetch
  age?: number | null;
  height?: string | null;
  position?: string | null;
  potential?: number | null;
  salary?: number | null;
  skills?: Record<string, number | null>;
}

export default function ScoutPage() {
  // Player ID fetch
  const [playerIdsInput, setPlayerIdsInput] = useState("");
  const [fetchingPlayers, setFetchingPlayers] = useState(false);
  const [playerProgress, setPlayerProgress] = useState("");

  // Team roster fetch
  const [teamIdInput, setTeamIdInput] = useState("");
  const [fetchingRoster, setFetchingRoster] = useState(false);
  const [rosterProgress, setRosterProgress] = useState("");

  // Results
  const [results, setResults] = useState<FetchedPlayer[]>([]);
  const [errors, setErrors] = useState<ScoutError[]>([]);
  const [message, setMessage] = useState("");

  // Recent scans from localStorage
  const [recentScans, setRecentScans] = useState<
    Array<{ type: string; count: number; timestamp: string; ids: string }>
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("bb_scout_recent") || "[]");
    } catch {
      return [];
    }
  });

  function addRecentScan(type: string, count: number, ids: string) {
    const scan = {
      type,
      count,
      timestamp: new Date().toLocaleString(),
      ids,
    };
    const updated = [scan, ...recentScans].slice(0, 20);
    setRecentScans(updated);
    localStorage.setItem("bb_scout_recent", JSON.stringify(updated));
  }

  function parsePlayerIds(input: string): number[] {
    // Support comma-separated, space-separated, newline-separated, or URL pasting
    const ids: number[] = [];
    const parts = input.split(/[\s,]+/).filter(Boolean);
    for (const part of parts) {
      // Extract player ID from BB URL if pasted
      const urlMatch = part.match(/playerid=(\d+)/i) || part.match(/player\/(\d+)/i);
      if (urlMatch) {
        ids.push(parseInt(urlMatch[1]));
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num > 0) ids.push(num);
      }
    }
    return [...new Set(ids)]; // dedupe
  }

  async function handleFetchPlayers() {
    const ids = parsePlayerIds(playerIdsInput);
    if (ids.length === 0) {
      setMessage("Error: Enter at least one valid player ID");
      return;
    }
    if (ids.length > 20) {
      setMessage("Error: Maximum 20 player IDs per request");
      return;
    }

    setFetchingPlayers(true);
    setMessage("");
    setResults([]);
    setErrors([]);
    setPlayerProgress(`Fetching ${ids.length} player(s)...`);

    try {
      const res = await fetch("/api/scout/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: ids }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error || "Request failed"}`);
        return;
      }

      const fetchedResults: FetchedPlayer[] = (data.results || []).map(
        (r: ScoutResult) => ({
          ...r,
        })
      );

      setResults(fetchedResults);
      setErrors(data.errors || []);

      const created = fetchedResults.filter(
        (r) => r.status === "created"
      ).length;
      const updated = fetchedResults.filter(
        (r) => r.status === "updated"
      ).length;
      const errCount = (data.errors || []).length;

      let msg = `Fetched ${fetchedResults.length} player(s)`;
      if (created > 0) msg += ` (${created} new`;
      if (updated > 0)
        msg += `${created > 0 ? ", " : " ("}${updated} updated`;
      if (created > 0 || updated > 0) msg += ")";
      if (errCount > 0) msg += `. ${errCount} error(s).`;

      setMessage(msg);
      addRecentScan("Player IDs", fetchedResults.length, ids.join(", "));

      // Load full player data for display
      await loadPlayerDetails(fetchedResults);
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Network error"}`
      );
    } finally {
      setFetchingPlayers(false);
      setPlayerProgress("");
    }
  }

  async function handleFetchRoster() {
    const teamId = parseInt(teamIdInput);
    if (isNaN(teamId) || teamId <= 0) {
      setMessage("Error: Enter a valid team ID");
      return;
    }

    setFetchingRoster(true);
    setMessage("");
    setResults([]);
    setErrors([]);
    setRosterProgress(`Fetching roster for team ${teamId}...`);

    try {
      const res = await fetch("/api/scout/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error || "Request failed"}`);
        return;
      }

      const fetchedResults: FetchedPlayer[] = (data.results || []).map(
        (r: ScoutResult) => ({
          ...r,
        })
      );

      setResults(fetchedResults);
      setErrors(data.errors || []);

      const created = fetchedResults.filter(
        (r) => r.status === "created"
      ).length;
      const updated = fetchedResults.filter(
        (r) => r.status === "updated"
      ).length;

      setMessage(
        `Roster: ${fetchedResults.length} players saved (${created} new, ${updated} updated)`
      );
      addRecentScan(
        `Team #${teamId}`,
        fetchedResults.length,
        String(teamId)
      );

      await loadPlayerDetails(fetchedResults);
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Network error"}`
      );
    } finally {
      setFetchingRoster(false);
      setRosterProgress("");
    }
  }

  async function loadPlayerDetails(fetchedResults: FetchedPlayer[]) {
    // Load latest snapshots for the fetched players from our DB via Supabase client
    // We use the public API since this runs client-side
    try {
      const { supabase } = await import("@/lib/supabase");
      const playerIds = fetchedResults.map((r) => r.playerId);

      const { data: snapshots } = await supabase
        .from("skill_snapshots")
        .select("*")
        .in("player_id", playerIds)
        .order("captured_at", { ascending: false });

      const { data: players } = await supabase
        .from("players")
        .select("*")
        .in("id", playerIds);

      if (snapshots && players) {
        // Get latest snapshot per player
        const latestSnap = new Map<number, Record<string, unknown>>();
        for (const snap of snapshots) {
          if (!latestSnap.has(snap.player_id)) {
            latestSnap.set(snap.player_id, snap);
          }
        }

        const playerMap = new Map(players.map((p) => [p.id, p]));

        const enriched = fetchedResults.map((r) => {
          const snap = latestSnap.get(r.playerId) as Record<string, unknown> | undefined;
          const player = playerMap.get(r.playerId) as Record<string, unknown> | undefined;
          return {
            ...r,
            age: (snap?.age as number) ?? null,
            height: (player?.height as string) ?? null,
            position: (player?.position as string) ?? null,
            potential: (snap?.potential as number) ?? null,
            salary: (snap?.salary as number) ?? null,
            skills: snap
              ? {
                  jump_shot: snap.jump_shot as number | null,
                  jump_range: snap.jump_range as number | null,
                  outside_def: snap.outside_def as number | null,
                  handling: snap.handling as number | null,
                  driving: snap.driving as number | null,
                  passing: snap.passing as number | null,
                  inside_shot: snap.inside_shot as number | null,
                  inside_def: snap.inside_def as number | null,
                  rebounding: snap.rebounding as number | null,
                  shot_blocking: snap.shot_blocking as number | null,
                  stamina: snap.stamina as number | null,
                  free_throw: snap.free_throw as number | null,
                }
              : undefined,
          };
        });

        setResults(enriched);
      }
    } catch {
      // Non-critical — results still show basic info
    }
  }

  function computeTSP(skills?: Record<string, number | null>): number {
    if (!skills) return 0;
    return Object.values(skills).reduce<number>((sum, v) => sum + (v || 0), 0);
  }

  function computeOSP(skills?: Record<string, number | null>): number {
    if (!skills) return 0;
    return (
      (skills.jump_shot || 0) +
      (skills.jump_range || 0) +
      (skills.outside_def || 0) +
      (skills.handling || 0) +
      (skills.driving || 0) +
      (skills.passing || 0)
    );
  }

  function computeISP(skills?: Record<string, number | null>): number {
    if (!skills) return 0;
    return (
      (skills.inside_shot || 0) +
      (skills.inside_def || 0) +
      (skills.rebounding || 0) +
      (skills.shot_blocking || 0)
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold mb-2">Scout</h1>
        <p className="text-gray-400 text-sm mb-6">
          Fetch player skills from the BuzzerBeater API. Find player IDs on{" "}
          <a
            href="https://nt.buzzerbeater.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--accent)" }}
          >
            nt.buzzerbeater.com
          </a>{" "}
          — click a player name to see their BB profile URL containing the ID.
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Card 1: Fetch by Player ID */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-3">Fetch by Player ID</h2>
            <p className="text-gray-400 text-xs mb-3">
              Enter BB player IDs (comma or newline separated). You can also
              paste full BB player URLs.
            </p>
            <textarea
              value={playerIdsInput}
              onChange={(e) => setPlayerIdsInput(e.target.value)}
              placeholder={"12345678\n23456789\nor paste BB player URLs"}
              rows={4}
              className="w-full px-3 py-2 rounded text-sm text-white focus:outline-none mb-3 font-mono"
              style={{
                background: "var(--background)",
                border: "1px solid var(--card-border)",
              }}
            />
            <button
              onClick={handleFetchPlayers}
              disabled={fetchingPlayers || !playerIdsInput.trim()}
              className="w-full py-2.5 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {fetchingPlayers ? playerProgress : "Fetch Players"}
            </button>
          </div>

          {/* Card 2: Fetch Team Roster */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-3">Fetch Team Roster</h2>
            <p className="text-gray-400 text-xs mb-3">
              Enter a BB team ID to fetch all players on their roster with full
              skills.
            </p>
            <input
              type="number"
              value={teamIdInput}
              onChange={(e) => setTeamIdInput(e.target.value)}
              placeholder="Team ID (e.g. 12345)"
              className="w-full px-3 py-2 rounded text-sm text-white focus:outline-none mb-3"
              style={{
                background: "var(--background)",
                border: "1px solid var(--card-border)",
              }}
            />
            <button
              onClick={handleFetchRoster}
              disabled={fetchingRoster || !teamIdInput.trim()}
              className="w-full py-2.5 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {fetchingRoster ? rosterProgress : "Fetch Roster"}
            </button>
          </div>
        </div>

        {/* Results Table */}
        {results.length > 0 && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4">
              Results ({results.length} players)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-center py-2 px-1">Status</th>
                    <th className="text-center py-2 px-1">Age</th>
                    <th className="text-center py-2 px-1">Ht</th>
                    <th className="text-center py-2 px-1">Pos</th>
                    <th className="text-center py-2 px-1">Pot</th>
                    <th className="text-right py-2 px-1">Salary</th>
                    <th className="text-center py-2 px-1">TSP</th>
                    <th className="text-center py-2 px-1">OSP</th>
                    <th className="text-center py-2 px-1">ISP</th>
                    <th className="text-center py-2 px-1">JS</th>
                    <th className="text-center py-2 px-1">JR</th>
                    <th className="text-center py-2 px-1">OD</th>
                    <th className="text-center py-2 px-1">HA</th>
                    <th className="text-center py-2 px-1">DR</th>
                    <th className="text-center py-2 px-1">PA</th>
                    <th className="text-center py-2 px-1">IS</th>
                    <th className="text-center py-2 px-1">ID</th>
                    <th className="text-center py-2 px-1">RB</th>
                    <th className="text-center py-2 px-1">SB</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr
                      key={r.bbPlayerId}
                      className="border-b border-gray-800 hover:bg-white/5"
                    >
                      <td className="py-2 px-2">
                        <Link
                          href={`/players/${r.playerId}`}
                          className="hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          {r.name}
                        </Link>
                        <a
                          href={`https://www.buzzerbeater.com/player/${r.bbPlayerId}/overview.aspx`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-gray-500 hover:text-gray-300 text-xs"
                          title="View on BuzzerBeater"
                        >
                          ↗
                        </a>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            r.status === "created"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {r.status === "created" ? "New" : "Updated"}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">{r.age ?? "-"}</td>
                      <td className="text-center py-2 px-1 text-xs">
                        {r.height ?? "-"}
                      </td>
                      <td className="text-center py-2 px-1">{r.position ?? "-"}</td>
                      <td
                        className="text-center py-2 px-1 text-xs font-medium"
                        style={{ color: getPotentialColor(r.potential ?? null) }}
                      >
                        {r.potential !== null && r.potential !== undefined
                          ? `${r.potential}-${POTENTIAL_LEVELS[r.potential] || "?"}`
                          : "-"}
                      </td>
                      <td className="text-right py-2 px-1 text-xs">
                        {r.salary
                          ? `$${r.salary.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="text-center py-2 px-1 font-medium">
                        {r.skills ? computeTSP(r.skills) : "-"}
                      </td>
                      <td className="text-center py-2 px-1 text-gray-400">
                        {r.skills ? computeOSP(r.skills) : "-"}
                      </td>
                      <td className="text-center py-2 px-1 text-gray-400">
                        {r.skills ? computeISP(r.skills) : "-"}
                      </td>
                      {/* Individual skills */}
                      {[
                        "jump_shot",
                        "jump_range",
                        "outside_def",
                        "handling",
                        "driving",
                        "passing",
                        "inside_shot",
                        "inside_def",
                        "rebounding",
                        "shot_blocking",
                      ].map((sk) => {
                        const val = r.skills?.[sk] ?? null;
                        return (
                          <td
                            key={sk}
                            className="text-center py-2 px-1 text-xs font-medium"
                            style={{ color: getSkillColor(val) }}
                          >
                            {val ?? "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <h3 className="text-sm font-semibold text-red-400 mb-2">
              Errors ({errors.length})
            </h3>
            {errors.map((e) => (
              <div key={e.bbPlayerId} className="text-xs text-red-300">
                Player #{e.bbPlayerId}: {e.error}
              </div>
            ))}
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Scans</h2>
              <button
                onClick={() => {
                  setRecentScans([]);
                  localStorage.removeItem("bb_scout_recent");
                }}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {recentScans.map((scan, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm text-gray-400 py-1 border-b border-gray-800 last:border-0"
                >
                  <span>
                    <span className="text-gray-300 font-medium">
                      {scan.type}
                    </span>{" "}
                    — {scan.count} player(s)
                  </span>
                  <span className="text-xs">{scan.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
