"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { SKILL_LEVELS, POTENTIAL_LEVELS, getSkillColor, getPotentialColor } from "@/lib/constants";
import type { Player, SkillSnapshot } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type SortField =
  | "name"
  | "age"
  | "position"
  | "potential"
  | "dmi"
  | "game_shape"
  | "salary"
  | "skill_points"
  | "updated";

interface PlayerRow {
  player: Player;
  snapshot: SkillSnapshot | null;
  hasSk: boolean; // has any skill data
}

export default function OpponentsPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("dmi");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterAge, setFilterAge] = useState<number[]>([]);
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterPotential, setFilterPotential] = useState<number>(0);
  const [filterNtOnly, setFilterNtOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);

    // Load non-Slovenian players
    const { data: playersData } = await supabase
      .from("players")
      .select("*")
      .neq("nationality", "Slovenia")
      .not("nationality", "is", null)
      .order("name");

    if (!playersData) {
      setLoading(false);
      return;
    }

    const playerIds = playersData.map(p => p.id);

    const { data: snapshots } = playerIds.length > 0
      ? await supabase
          .from("skill_snapshots")
          .select("*")
          .in("player_id", playerIds)
          .order("captured_at", { ascending: false })
      : { data: [] };

    const snapshotMap = new Map<number, SkillSnapshot>();
    if (snapshots) {
      for (const snap of snapshots) {
        if (!snapshotMap.has(snap.player_id)) {
          snapshotMap.set(snap.player_id, snap);
        }
      }
    }

    const SKILL_KEYS = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing', 'inside_shot', 'inside_def', 'rebounding', 'shot_blocking', 'stamina', 'free_throw'];

    const rows: PlayerRow[] = playersData.map((p) => {
      const snap = snapshotMap.get(p.id) || null;
      const hasSk = snap ? SKILL_KEYS.some(k => snap[k as keyof SkillSnapshot] != null) : false;
      return { player: p, snapshot: snap, hasSk };
    });

    setPlayers(rows);
    setSelectedIds(new Set());
    setLoading(false);
  }

  // Unique countries for filter dropdown
  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const row of players) {
      if (row.player.nationality && row.player.nationality !== "Unknown") {
        set.add(row.player.nationality);
      }
    }
    return [...set].sort();
  }, [players]);

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (filterCountry) {
      result = result.filter((r) => r.player.nationality === filterCountry);
    }

    if (filterNtOnly) {
      result = result.filter((r) => r.player.is_nt_player);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.player.name.toLowerCase().includes(q));
    }

    if (filterAge.length > 0) {
      result = result.filter(
        (r) => r.snapshot?.age != null && filterAge.includes(r.snapshot.age)
      );
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
        case "age":
          aVal = a.snapshot?.age || 0;
          bVal = b.snapshot?.age || 0;
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
        case "game_shape":
          aVal = a.snapshot?.game_shape || 0;
          bVal = b.snapshot?.game_shape || 0;
          break;
        case "salary":
          aVal = a.snapshot?.salary || 0;
          bVal = b.snapshot?.salary || 0;
          break;
        case "skill_points":
          aVal = a.snapshot?.skill_points || 0;
          bVal = b.snapshot?.skill_points || 0;
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
  }, [players, filterCountry, filterNtOnly, searchQuery, filterAge, filterPosition, filterPotential, sortField, sortAsc]);

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
      `Delete ${count} player${count !== 1 ? "s" : ""} and all their snapshots? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const ids = Array.from(selectedIds);
      const { data, error } = await supabase
        .from("players")
        .delete()
        .in("id", ids)
        .select();

      if (error) {
        alert(`Delete failed: ${error.message}`);
      } else if (!data || data.length === 0) {
        alert(`Delete blocked by database policy. Run this SQL:\nCREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);`);
      } else {
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
            <h1 className="text-2xl font-bold">Opponents</h1>
            {countries.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setFilterCountry("")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    !filterCountry ? "text-white" : "text-gray-400"
                  }`}
                  style={!filterCountry ? { background: "var(--accent)" } : { background: "var(--card-bg)" }}
                >
                  All
                </button>
                {countries.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCountry(c)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterCountry === c ? "text-white" : "text-gray-400"
                    }`}
                    style={filterCountry === c ? { background: "var(--accent)" } : { background: "var(--card-bg)" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
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
                  filterAge.includes(age) ? "text-white" : "text-gray-400"
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

          <button
            onClick={() => setFilterNtOnly(!filterNtOnly)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterNtOnly ? "text-white" : "text-gray-400"
            }`}
            style={filterNtOnly ? { background: "var(--accent)" } : { background: "var(--background)" }}
          >
            U-21 only
          </button>

          {(searchQuery || filterAge.length > 0 || filterPosition || filterPotential > 0 || filterNtOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterAge([]);
                setFilterPosition("");
                setFilterPotential(0);
                setFilterNtOnly(false);
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Bulk actions */}
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
                {deleting ? "Deleting..." : `Delete ${selectedIds.size}`}
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
              ? "No opponent players tracked yet. Scan an opposing NT roster page with the extension to start tracking."
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
                    <SortHeader field="age">Age</SortHeader>
                    <SortHeader field="position">Pos</SortHeader>
                    <SortHeader field="potential">Potential</SortHeader>
                    <SortHeader field="dmi">DMI</SortHeader>
                    <SortHeader field="game_shape">Shape</SortHeader>
                    <SortHeader field="salary">Salary</SortHeader>
                    <SortHeader field="skill_points">TSP</SortHeader>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Data
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
                          {!filterCountry && (
                            <span className="text-gray-400">{row.player.nationality}</span>
                          )}
                          <span>#{row.player.bb_player_id}</span>
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
                          {row.player.is_nt_player && (
                            <span
                              className="px-1 rounded text-xs"
                              style={{ background: "var(--accent)", opacity: 0.7, fontSize: "9px" }}
                            >
                              NT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.snapshot?.age ?? "-"}
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
                      <td className="px-3 py-2 text-sm font-mono font-semibold">
                        {row.snapshot?.dmi != null
                          ? row.snapshot.dmi.toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.snapshot?.game_shape != null ? (
                          <span
                            style={{
                              color: getSkillColor(row.snapshot.game_shape),
                            }}
                          >
                            {row.snapshot.game_shape}{" "}
                            <span className="text-gray-500 text-xs">
                              ({SKILL_LEVELS[row.snapshot.game_shape] || "?"})
                            </span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-300">
                        {row.snapshot?.salary != null
                          ? `$${row.snapshot.salary.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {row.snapshot?.skill_points ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.hasSk ? (
                          <span className="text-emerald-400">Full skills</span>
                        ) : (
                          <span className="text-blue-400">DMI only</span>
                        )}
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
