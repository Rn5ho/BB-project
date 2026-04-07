"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { SKILLS, SKILL_LEVELS, POTENTIAL_LEVELS, getSkillColor, getPotentialColor } from "@/lib/constants";
import type { Player, SkillSnapshot, PlayerTag } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type ViewMode = "nt" | "scouting";

type SortField =
  | "name"
  | "age"
  | "nationality"
  | "position"
  | "potential"
  | "dmi"
  | "skill_points"
  | "osp"
  | "isp"
  | "updated";

// Outside skills: Jump Shot, Jump Range, Outside Def, Handling, Driving, Passing
const OUTSIDE_KEYS: (keyof SkillSnapshot)[] = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing'];
// Inside skills: Inside Shot, Inside Def, Rebounding, Shot Blocking
const INSIDE_KEYS: (keyof SkillSnapshot)[] = ['inside_shot', 'inside_def', 'rebounding', 'shot_blocking'];

function calcSkillSum(snapshot: SkillSnapshot | null, keys: (keyof SkillSnapshot)[]): number | null {
  if (!snapshot) return null;
  let sum = 0;
  let hasAny = false;
  for (const key of keys) {
    const val = snapshot[key];
    if (typeof val === 'number') {
      sum += val;
      hasAny = true;
    }
  }
  return hasAny ? sum : null;
}

interface PlayerRow {
  player: Player;
  snapshot: SkillSnapshot | null;
  tags: string[];
}

// Compute a player's current age based on season delta
function computeCurrentAge(snapshot: SkillSnapshot | null, currentSeason: number | null): number | null {
  if (!snapshot?.age) return null;
  if (currentSeason && snapshot.bb_season && currentSeason > snapshot.bb_season) {
    return snapshot.age + (currentSeason - snapshot.bb_season);
  }
  return snapshot.age;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("nt");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterAge, setFilterAge] = useState<number[]>([]);
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterPotential, setFilterPotential] = useState<number>(0);
  const [filterNationality, setFilterNationality] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCurrentSeason();
    loadPlayers();
  }, []);

  async function loadCurrentSeason() {
    // Check localStorage cache (valid for 24 hours)
    const cached = localStorage.getItem("bb_current_season");
    if (cached) {
      try {
        const { season, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setCurrentSeason(season);
          return;
        }
      } catch { /* stale or corrupt cache, refetch */ }
    }
    try {
      const res = await fetch("/api/scout/seasons");
      if (res.ok) {
        const data = await res.json();
        if (data.currentSeason) {
          setCurrentSeason(data.currentSeason);
          localStorage.setItem("bb_current_season", JSON.stringify({
            season: data.currentSeason,
            timestamp: Date.now(),
          }));
        }
      }
    } catch { /* non-fatal — ages will show raw snapshot values */ }
  }

  async function loadPlayers() {
    setLoading(true);

    const { data: playersData } = await supabase
      .from("players")
      .select("*")
      .order("name");

    if (!playersData) {
      setLoading(false);
      return;
    }

    const { data: snapshots } = await supabase
      .from("skill_snapshots")
      .select("*")
      .order("captured_at", { ascending: false });

    const { data: tags } = await supabase.from("player_tags").select("*");

    const snapshotMap = new Map<number, SkillSnapshot>();
    if (snapshots) {
      for (const snap of snapshots) {
        if (!snapshotMap.has(snap.player_id)) {
          snapshotMap.set(snap.player_id, snap);
        }
      }
    }

    const tagMap = new Map<number, string[]>();
    if (tags) {
      for (const tag of tags) {
        const existing = tagMap.get(tag.player_id) || [];
        existing.push(tag.tag);
        tagMap.set(tag.player_id, existing);
      }
    }

    const rows: PlayerRow[] = playersData.map((p) => ({
      player: p,
      snapshot: snapshotMap.get(p.id) || null,
      tags: tagMap.get(p.id) || [],
    }));

    setPlayers(rows);
    setSelectedIds(new Set());
    setLoading(false);
  }

  // Get unique nationalities for the scouting filter dropdown
  const nationalities = useMemo(() => {
    const natSet = new Set<string>();
    for (const row of players) {
      const nat = row.player.nationality;
      if (nat && nat !== 'Slovenia' && nat !== 'Unknown') {
        natSet.add(nat);
      }
    }
    return [...natSet].sort();
  }, [players]);

  // Filtered and sorted data
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // View mode: NT = Slovenia only, Scouting = everything else
    if (viewMode === "nt") {
      result = result.filter((r) => r.player.nationality === "Slovenia" || !r.player.nationality);
    } else {
      result = result.filter((r) => r.player.nationality && r.player.nationality !== "Slovenia");
      if (filterNationality) {
        result = result.filter((r) => r.player.nationality === filterNationality);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.player.name.toLowerCase().includes(q));
    }

    if (filterAge.length > 0) {
      result = result.filter((r) => {
        const age = computeCurrentAge(r.snapshot, currentSeason);
        return age != null && filterAge.includes(age);
      });
    }

    if (filterPosition) {
      result = result.filter((r) => r.player.position === filterPosition);
    }

    if (filterPotential > 0) {
      result = result.filter(
        (r) =>
          r.snapshot?.potential != null &&
          r.snapshot.potential >= filterPotential
      );
    }

    result.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "name":
          aVal = a.player.name;
          bVal = b.player.name;
          break;
        case "nationality":
          aVal = a.player.nationality || "";
          bVal = b.player.nationality || "";
          break;
        case "age":
          aVal = computeCurrentAge(a.snapshot, currentSeason) || 0;
          bVal = computeCurrentAge(b.snapshot, currentSeason) || 0;
          break;
        case "position":
          aVal = a.player.position || "";
          bVal = b.player.position || "";
          break;
        case "potential":
          aVal = a.snapshot?.potential || 0;
          bVal = b.snapshot?.potential || 0;
          break;
        case "dmi":
          aVal = a.snapshot?.dmi || 0;
          bVal = b.snapshot?.dmi || 0;
          break;
        case "skill_points":
          aVal = a.snapshot?.skill_points || 0;
          bVal = b.snapshot?.skill_points || 0;
          break;
        case "osp":
          aVal = calcSkillSum(a.snapshot, OUTSIDE_KEYS) || 0;
          bVal = calcSkillSum(b.snapshot, OUTSIDE_KEYS) || 0;
          break;
        case "isp":
          aVal = calcSkillSum(a.snapshot, INSIDE_KEYS) || 0;
          bVal = calcSkillSum(b.snapshot, INSIDE_KEYS) || 0;
          break;
        case "updated":
          aVal = a.snapshot?.captured_at || "";
          bVal = b.snapshot?.captured_at || "";
          break;
      }

      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [players, currentSeason, viewMode, searchQuery, filterAge, filterPosition, filterPotential, filterNationality, sortField, sortAsc]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "name");
    }
  }

  function toggleAgeFilter(age: number) {
    setFilterAge((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  }

  function toggleSelect(playerId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredPlayers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPlayers.map((r) => r.player.id)));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Delete ${count} player${count !== 1 ? "s" : ""} and all their snapshots, notes, and tags? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const ids = Array.from(selectedIds);

      // Delete players (cascades to snapshots, notes, tags via ON DELETE CASCADE)
      const { data, error } = await supabase
        .from("players")
        .delete()
        .in("id", ids)
        .select();

      if (error) {
        alert(`Delete failed: ${error.message}\n\nIf you see a "policy" error, you need to add a DELETE RLS policy in Supabase.\n\nRun this SQL in Supabase SQL Editor:\nCREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);`);
      } else if (!data || data.length === 0) {
        alert(`Delete blocked by database policy. No rows were deleted.\n\nRun this SQL in Supabase SQL Editor:\nCREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);`);
      } else {
        // Reload the list
        await loadPlayers();
      }
    } catch (err) {
      alert(`Delete error: ${err}`);
    }

    setDeleting(false);
  }

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
      onClick={() => toggleSort(field)}
    >
      {children}
      {sortField === field && (
        <span className="ml-1">{sortAsc ? "\u25B2" : "\u25BC"}</span>
      )}
    </th>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Players</h1>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--card-border)" }}
            >
              <button
                onClick={() => { setViewMode("nt"); setFilterNationality(""); }}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "nt" ? "text-white" : "text-gray-400"
                }`}
                style={viewMode === "nt" ? { background: "var(--accent)" } : { background: "var(--card-bg)" }}
              >
                My NT
              </button>
              <button
                onClick={() => setViewMode("scouting")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "scouting" ? "text-white" : "text-gray-400"
                }`}
                style={viewMode === "scouting" ? { background: "var(--accent)" } : { background: "var(--card-bg)" }}
              >
                Scouting
              </button>
            </div>
          </div>
          <span className="text-sm text-gray-400">
            {filteredPlayers.length} player{filteredPlayers.length !== 1 && "s"}
          </span>
        </div>

        {/* Filters */}
        <div
          className="rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm text-white focus:outline-none"
            style={{
              background: "var(--background)",
              border: "1px solid var(--card-border)",
            }}
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Age:</span>
            {[18, 19, 20, 21].map((age) => (
              <button
                key={age}
                onClick={() => toggleAgeFilter(age)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterAge.includes(age)
                    ? "text-white"
                    : "text-gray-400"
                }`}
                style={
                  filterAge.includes(age)
                    ? { background: "var(--accent)" }
                    : { background: "var(--background)" }
                }
              >
                {age}
              </button>
            ))}
          </div>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-2 py-1 rounded text-xs text-white focus:outline-none"
            style={{
              background: "var(--background)",
              border: "1px solid var(--card-border)",
            }}
          >
            <option value="">All positions</option>
            {["PG", "SG", "SF", "PF", "C"].map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          <select
            value={filterPotential}
            onChange={(e) => setFilterPotential(Number(e.target.value))}
            className="px-2 py-1 rounded text-xs text-white focus:outline-none"
            style={{
              background: "var(--background)",
              border: "1px solid var(--card-border)",
            }}
          >
            <option value={0}>All potentials</option>
            {Object.entries(POTENTIAL_LEVELS).map(([num, text]) => (
              <option key={num} value={num}>
                {num}+ ({text})
              </option>
            ))}
          </select>

          {viewMode === "scouting" && nationalities.length > 0 && (
            <select
              value={filterNationality}
              onChange={(e) => setFilterNationality(e.target.value)}
              className="px-2 py-1 rounded text-xs text-white focus:outline-none"
              style={{
                background: "var(--background)",
                border: "1px solid var(--card-border)",
              }}
            >
              <option value="">All nationalities</option>
              {nationalities.map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
          )}

          {(searchQuery ||
            filterAge.length > 0 ||
            filterPosition ||
            filterPotential > 0 ||
            filterNationality) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterAge([]);
                setFilterPosition("");
                setFilterPotential(0);
                setFilterNationality("");
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div
            className="rounded-lg p-3 mb-4 flex items-center justify-between"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--accent)",
            }}
          >
            <span className="text-sm">
              {selectedIds.size} player{selectedIds.size !== 1 && "s"} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors"
                style={{ background: "var(--background)" }}
              >
                Deselect All
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-3 py-1 rounded text-xs text-white font-medium transition-colors"
                style={{ background: "#dc2626" }}
              >
                {deleting ? "Deleting..." : `Delete ${selectedIds.size} Player${selectedIds.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {players.length === 0
              ? "No players yet. Use the Chrome extension to start scouting!"
              : "No players match your filters."}
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--card-border)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "var(--card-bg)" }}>
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredPlayers.length && filteredPlayers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                        title="Select all"
                      />
                    </th>
                    <SortHeader field="name">Name</SortHeader>
                    {viewMode === "scouting" && (
                      <SortHeader field="nationality">Nat</SortHeader>
                    )}
                    <SortHeader field="age">Age</SortHeader>
                    <SortHeader field="position">Pos</SortHeader>
                    <SortHeader field="potential">Potential</SortHeader>
                    <SortHeader field="dmi">DMI</SortHeader>
                    <SortHeader field="skill_points">TSP</SortHeader>
                    <SortHeader field="osp">OSP</SortHeader>
                    <SortHeader field="isp">ISP</SortHeader>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tags
                    </th>
                    <SortHeader field="updated">Updated</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((row, i) => (
                    <tr
                      key={row.player.id}
                      className={`hover:bg-white/5 transition-colors ${
                        selectedIds.has(row.player.id) ? "bg-white/10" : ""
                      }`}
                      style={{
                        borderTop:
                          i > 0 ? "1px solid var(--card-border)" : "none",
                      }}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.player.id)}
                          onChange={() => toggleSelect(row.player.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/players/${row.player.id}`}
                          className="font-medium hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          {row.player.name}
                        </Link>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          #{row.player.bb_player_id}
                          <a
                            href={`https://www.buzzerbeater.com/player/${row.player.bb_player_id}/overview.aspx`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors"
                            title="Open in BuzzerBeater"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ↗
                          </a>
                        </div>
                      </td>
                      {viewMode === "scouting" && (
                        <td className="px-3 py-2 text-sm text-gray-300">
                          {row.player.nationality || "-"}
                        </td>
                      )}
                      <td className="px-3 py-2 text-sm">
                        {computeCurrentAge(row.snapshot, currentSeason) ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.player.position || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.snapshot?.potential != null ? (
                          <span
                            style={{
                              color: getPotentialColor(row.snapshot.potential),
                            }}
                          >
                            {POTENTIAL_LEVELS[row.snapshot.potential] ||
                              row.snapshot.potential}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {row.snapshot?.dmi ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {row.snapshot?.skill_points ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {calcSkillSum(row.snapshot, OUTSIDE_KEYS) ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {calcSkillSum(row.snapshot, INSIDE_KEYS) ?? "-"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {row.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{
                                background: "var(--accent)",
                                opacity: 0.8,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {row.snapshot
                          ? new Date(
                              row.snapshot.captured_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
