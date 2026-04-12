"use client";

import { Fragment, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { POTENTIAL_LEVELS, getPotentialColor, getSkillColor } from "@/lib/constants";
import type { Player, SkillSnapshot } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { computeCurrentAge, staleSeasonDelta } from "@/lib/season";
import { useCurrentSeason } from "@/lib/useCurrentSeason";
import { CountryMultiSelect } from "@/components/world/CountryMultiSelect";
import { WorldPresets } from "@/components/world/WorldPresets";
import { FullSkillsBadge } from "@/components/world/FullSkillsBadge";
import { ColumnVisibilityMenu, type ColumnDef } from "@/components/world/ColumnVisibilityMenu";
import { PlayerRowExpanded } from "@/components/world/PlayerRowExpanded";

type SortField =
  | "name"
  | "age"
  | "position"
  | "potential"
  | "dmi"
  | "salary"
  | "skill_points"
  | "height"
  | "updated";

interface PlayerRow {
  player: Player;
  snapshot: SkillSnapshot | null;
  hasSk: boolean;
}

const SKILL_KEYS = [
  "jump_shot","jump_range","outside_def","handling","driving","passing",
  "inside_shot","inside_def","rebounding","shot_blocking","stamina","free_throw",
] as const;

const SKILL_COLUMNS: { key: typeof SKILL_KEYS[number]; label: string }[] = [
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

const COLUMN_DEFS: ColumnDef[] = [
  { key: "age", label: "Age", defaultVisible: true },
  { key: "position", label: "Position", defaultVisible: true },
  { key: "potential", label: "Potential", defaultVisible: true },
  { key: "dmi_gs", label: "DMI + GS", defaultVisible: true },
  { key: "data", label: "Data", defaultVisible: true },
  { key: "updated", label: "Updated", defaultVisible: true },
  { key: "salary", label: "Salary", defaultVisible: false },
  { key: "skill_points", label: "TSP", defaultVisible: false },
  { key: "height", label: "Height", defaultVisible: false },
];

const COLUMN_STORAGE_KEY = "bb_world_columns_v1";
const SHOW_SKILLS_STORAGE_KEY = "bb_world_show_skills_v1";
const SETTINGS_KEY_SEASON_OPPONENTS = "season_opponents";

function defaultVisible(): Record<string, boolean> {
  const v: Record<string, boolean> = {};
  for (const c of COLUMN_DEFS) v[c.key] = c.defaultVisible;
  return v;
}

export default function WorldPage() {
  const router = useRouter();
  const { currentSeason } = useCurrentSeason();

  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [starredCountries, setStarredCountries] = useState<string[]>([]);
  const [filterAge, setFilterAge] = useState<number[]>([]);
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterPotential, setFilterPotential] = useState<number>(0);
  const [filterU21, setFilterU21] = useState(false);
  const [filterIncludeSlovenia, setFilterIncludeSlovenia] = useState(false);
  const [filterHasFullSkills, setFilterHasFullSkills] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<SortField>("dmi");
  const [sortAsc, setSortAsc] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(defaultVisible);
  const [showSkills, setShowSkills] = useState(false);

  // --- Load column visibility + skills toggle from localStorage ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (raw) setVisibleColumns({ ...defaultVisible(), ...JSON.parse(raw) });
    } catch {}
    try {
      const raw = localStorage.getItem(SHOW_SKILLS_STORAGE_KEY);
      if (raw === "1") setShowSkills(true);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch {}
  }, [visibleColumns]);
  useEffect(() => {
    try {
      localStorage.setItem(SHOW_SKILLS_STORAGE_KEY, showSkills ? "1" : "0");
    } catch {}
  }, [showSkills]);

  // --- Load starred countries from Supabase settings ---
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", SETTINGS_KEY_SEASON_OPPONENTS)
        .maybeSingle();
      if (data?.value?.countries && Array.isArray(data.value.countries)) {
        setStarredCountries(data.value.countries);
      }
    })();
  }, []);

  async function persistStarred(next: string[]) {
    await supabase
      .from("settings")
      .upsert({ key: SETTINGS_KEY_SEASON_OPPONENTS, value: { countries: next }, updated_at: new Date().toISOString() });
  }

  function toggleStar(country: string) {
    setStarredCountries((prev) => {
      const next = prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country];
      persistStarred(next);
      return next;
    });
  }

  // --- Load players + snapshots ---
  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);
    const { data: playersData } = await supabase
      .from("players")
      .select("*")
      .not("nationality", "is", null)
      .order("name");

    if (!playersData) {
      setLoading(false);
      return;
    }

    const playerIds = playersData.map((p) => p.id);
    const { data: snapshots } =
      playerIds.length > 0
        ? await supabase
            .from("skill_snapshots")
            .select("*")
            .in("player_id", playerIds)
            .order("captured_at", { ascending: false })
        : { data: [] };

    const latestMap = new Map<number, SkillSnapshot>();
    if (snapshots) {
      for (const s of snapshots) {
        if (!latestMap.has(s.player_id)) latestMap.set(s.player_id, s);
      }
    }

    const out: PlayerRow[] = playersData.map((p) => {
      const snap = latestMap.get(p.id) || null;
      const hasSk = snap ? SKILL_KEYS.some((k) => (snap as any)[k] != null) : false;
      return { player: p, snapshot: snap, hasSk };
    });

    setRows(out);
    setSelectedIds(new Set());
    setLoading(false);
  }

  // --- Derived: countries in dataset ---
  const allCountriesInDataset = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      if (r.player.nationality && r.player.nationality !== "Unknown") s.add(r.player.nationality);
    }
    return [...s].sort();
  }, [rows]);

  // --- Filtering & sorting ---
  const filtered = useMemo(() => {
    let result = rows;

    if (!filterIncludeSlovenia) {
      result = result.filter((r) => r.player.nationality !== "Slovenia");
    }
    if (filterCountries.length > 0) {
      const set = new Set(filterCountries);
      result = result.filter((r) => r.player.nationality && set.has(r.player.nationality));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => r.player.name.toLowerCase().includes(q));
    }
    if (filterU21) {
      result = result.filter((r) => {
        const a = computeCurrentAge(r.snapshot, currentSeason);
        return a != null && a >= 18 && a <= 21;
      });
    }
    if (filterAge.length > 0) {
      result = result.filter((r) => {
        const a = computeCurrentAge(r.snapshot, currentSeason);
        return a != null && filterAge.includes(a);
      });
    }
    if (filterPosition) {
      result = result.filter((r) => r.player.position === filterPosition);
    }
    if (filterPotential > 0) {
      result = result.filter(
        (r) => r.snapshot?.potential != null && r.snapshot.potential >= filterPotential
      );
    }
    if (filterHasFullSkills) {
      result = result.filter((r) => r.hasSk);
    }

    const sorted = [...result].sort((a, b) => {
      // DMI sort special case: empty DMI always sinks to bottom
      if (sortField === "dmi") {
        const av = a.snapshot?.dmi;
        const bv = b.snapshot?.dmi;
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return sortAsc ? av - bv : bv - av;
      }

      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortField) {
        case "name": aVal = a.player.name; bVal = b.player.name; break;
        case "age":
          aVal = computeCurrentAge(a.snapshot, currentSeason) || 0;
          bVal = computeCurrentAge(b.snapshot, currentSeason) || 0;
          break;
        case "position": aVal = a.player.position || ""; bVal = b.player.position || ""; break;
        case "potential": aVal = a.snapshot?.potential || 0; bVal = b.snapshot?.potential || 0; break;
        case "salary": aVal = a.snapshot?.salary || 0; bVal = b.snapshot?.salary || 0; break;
        case "skill_points": aVal = a.snapshot?.skill_points || 0; bVal = b.snapshot?.skill_points || 0; break;
        case "height": aVal = a.player.height || ""; bVal = b.player.height || ""; break;
        case "updated": aVal = a.snapshot?.captured_at || ""; bVal = b.snapshot?.captured_at || ""; break;
      }
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [
    rows, filterCountries, filterIncludeSlovenia, searchQuery, filterU21, filterAge,
    filterPosition, filterPotential, filterHasFullSkills, sortField, sortAsc, currentSeason,
  ]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === "name"); }
  }
  function toggleAge(age: number) {
    setFilterAge((p) => (p.includes(age) ? p.filter((a) => a !== age) : [...p, age]));
  }
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.player.id)));
  }
  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearAllFilters() {
    setFilterCountries([]);
    setFilterAge([]);
    setFilterPosition("");
    setFilterPotential(0);
    setFilterU21(false);
    setFilterIncludeSlovenia(false);
    setFilterHasFullSkills(false);
    setSearchQuery("");
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} players and all their snapshots? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const { data, error } = await supabase.from("players").delete().in("id", ids).select();
      if (error) alert(`Delete failed: ${error.message}`);
      else if (!data || data.length === 0) alert("Delete blocked by RLS policy. See opponents page for SQL hint.");
      else await loadPlayers();
    } catch (err) {
      alert(`Delete error: ${err}`);
    }
    setDeleting(false);
  }

  function handleCompareSelected() {
    if (selectedIds.size < 2) return;
    const ids = Array.from(selectedIds).join(",");
    router.push(`/compare?ids=${ids}`);
  }

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
      onClick={() => toggleSort(field)}
    >
      {children}
      {sortField === field && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
    </th>
  );

  const anyFilterActive =
    filterCountries.length > 0 || filterAge.length > 0 || filterPosition !== "" ||
    filterPotential > 0 || filterU21 || filterIncludeSlovenia || filterHasFullSkills ||
    searchQuery.trim() !== "";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">World</h1>
            <p className="text-xs text-gray-500 mt-1">{filtered.length} player{filtered.length !== 1 && "s"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSkills((v) => !v)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                showSkills ? "text-white" : "text-gray-300 hover:text-white"
              }`}
              style={{
                background: showSkills ? "var(--accent)" : "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
              title="Toggle individual skill columns"
            >
              Skills
            </button>
            <ColumnVisibilityMenu columns={COLUMN_DEFS} visible={visibleColumns} onChange={setVisibleColumns} />
          </div>
        </div>

        <div className="mb-3">
          <WorldPresets
            allCountriesInDataset={allCountriesInDataset}
            starredCountries={starredCountries}
            onSetCountries={setFilterCountries}
            onClearAll={clearAllFilters}
          />
        </div>

        <div className="mb-4">
          <CountryMultiSelect
            countries={allCountriesInDataset}
            selected={filterCountries}
            starred={starredCountries}
            onChange={setFilterCountries}
            onToggleStar={toggleStar}
          />
        </div>

        <div
          className="rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm text-white focus:outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Age:</span>
            {[18, 19, 20, 21].map((age) => (
              <button
                key={age}
                onClick={() => toggleAge(age)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterAge.includes(age) ? "text-white" : "text-gray-400"
                }`}
                style={filterAge.includes(age) ? { background: "var(--accent)" } : { background: "var(--background)" }}
              >
                {age}
              </button>
            ))}
          </div>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-2 py-1 rounded text-xs text-white focus:outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
          >
            <option value="">All positions</option>
            {["PG", "SG", "SF", "PF", "C"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filterPotential}
            onChange={(e) => setFilterPotential(Number(e.target.value))}
            className="px-2 py-1 rounded text-xs text-white focus:outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
          >
            <option value={0}>All potentials</option>
            {Object.entries(POTENTIAL_LEVELS).map(([num, text]) => (
              <option key={num} value={num}>{num}+ ({text})</option>
            ))}
          </select>

          <button
            onClick={() => setFilterU21(!filterU21)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterU21 ? "text-white" : "text-gray-400"}`}
            style={filterU21 ? { background: "var(--accent)" } : { background: "var(--background)" }}
          >
            U-21 only
          </button>

          <button
            onClick={() => setFilterIncludeSlovenia(!filterIncludeSlovenia)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterIncludeSlovenia ? "text-white" : "text-gray-400"}`}
            style={filterIncludeSlovenia ? { background: "var(--accent)" } : { background: "var(--background)" }}
          >
            Include Slovenia
          </button>

          <button
            onClick={() => setFilterHasFullSkills(!filterHasFullSkills)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterHasFullSkills ? "text-white" : "text-gray-400"}`}
            style={filterHasFullSkills ? { background: "var(--accent)" } : { background: "var(--background)" }}
          >
            Full skills only
          </button>

          {anyFilterActive && (
            <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white transition-colors">
              Clear filters
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div
            className="rounded-lg p-3 mb-4 flex items-center justify-between"
            style={{ background: "var(--card-bg)", border: "1px solid var(--accent)" }}
          >
            <span className="text-sm">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={handleCompareSelected}
                disabled={selectedIds.size < 2}
                className="px-3 py-1 rounded text-xs text-white font-medium transition-colors disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Compare selected
              </button>
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

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {rows.length === 0
              ? "No players tracked yet. Scan rosters or the market with the extension."
              : "No players match your filters."}
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "var(--card-bg)" }}>
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2 w-8" />
                    <SortHeader field="name">Name</SortHeader>
                    {visibleColumns.age && <SortHeader field="age">Age</SortHeader>}
                    {visibleColumns.position && <SortHeader field="position">Pos</SortHeader>}
                    {visibleColumns.potential && <SortHeader field="potential">Potential</SortHeader>}
                    {visibleColumns.dmi_gs && <SortHeader field="dmi">DMI @ GS</SortHeader>}
                    {visibleColumns.salary && <SortHeader field="salary">Salary</SortHeader>}
                    {visibleColumns.skill_points && <SortHeader field="skill_points">TSP</SortHeader>}
                    {visibleColumns.height && <SortHeader field="height">Height</SortHeader>}
                    {visibleColumns.data && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                    )}
                    {visibleColumns.updated && <SortHeader field="updated">Updated</SortHeader>}
                    {showSkills && SKILL_COLUMNS.map((s) => (
                      <th
                        key={s.key}
                        className="px-2 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"
                        title={s.key.replace("_", " ")}
                      >
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const age = computeCurrentAge(row.snapshot, currentSeason);
                    const expanded = expandedIds.has(row.player.id);
                    const delta = staleSeasonDelta(currentSeason, row.snapshot?.bb_season ?? null);
                    return (
                      <Fragment key={row.player.id}>
                        <tr
                          className={`hover:bg-white/5 transition-colors ${
                            selectedIds.has(row.player.id) ? "bg-white/10" : ""
                          }`}
                          style={{ borderTop: i > 0 ? "1px solid var(--card-border)" : "none" }}
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
                            {row.hasSk ? (
                              <button
                                onClick={() => toggleExpand(row.player.id)}
                                className="text-gray-400 hover:text-white text-xs"
                                aria-label={expanded ? "Collapse" : "Expand"}
                              >
                                {expanded ? "▼" : "▶"}
                              </button>
                            ) : null}
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
                              <span className="text-gray-400">{row.player.nationality}</span>
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
                            </div>
                          </td>
                          {visibleColumns.age && (
                            <td className="px-3 py-2 text-sm">{age ?? "-"}</td>
                          )}
                          {visibleColumns.position && (
                            <td className="px-3 py-2 text-sm">{row.player.position || "-"}</td>
                          )}
                          {visibleColumns.potential && (
                            <td className="px-3 py-2 text-sm">
                              {row.snapshot?.potential != null ? (
                                <span style={{ color: getPotentialColor(row.snapshot.potential) }}>
                                  {POTENTIAL_LEVELS[row.snapshot.potential] || row.snapshot.potential}
                                </span>
                              ) : "-"}
                            </td>
                          )}
                          {visibleColumns.dmi_gs && (
                            <td className="px-3 py-2 text-sm font-mono">
                              {row.snapshot?.dmi != null ? (
                                <span>
                                  <span className="font-semibold">{row.snapshot.dmi.toLocaleString()}</span>
                                  {row.snapshot.game_shape != null && (
                                    <span className="text-gray-500">
                                      {" @ GS"}
                                      <span style={{ color: getSkillColor(row.snapshot.game_shape) }}>
                                        {row.snapshot.game_shape}
                                      </span>
                                    </span>
                                  )}
                                </span>
                              ) : "-"}
                            </td>
                          )}
                          {visibleColumns.salary && (
                            <td className="px-3 py-2 text-sm font-mono text-gray-300">
                              {row.snapshot?.salary != null ? `$${row.snapshot.salary.toLocaleString()}` : "-"}
                            </td>
                          )}
                          {visibleColumns.skill_points && (
                            <td className="px-3 py-2 text-sm font-mono">{row.snapshot?.skill_points ?? "-"}</td>
                          )}
                          {visibleColumns.height && (
                            <td className="px-3 py-2 text-sm text-gray-400">{row.player.height || "-"}</td>
                          )}
                          {visibleColumns.data && (
                            <td className="px-3 py-2 text-xs">
                              <FullSkillsBadge hasFullSkills={row.hasSk} seasonDelta={delta} />
                            </td>
                          )}
                          {visibleColumns.updated && (
                            <td className="px-3 py-2 text-xs text-gray-500">
                              {row.snapshot ? new Date(row.snapshot.captured_at).toLocaleDateString() : "-"}
                            </td>
                          )}
                          {showSkills && SKILL_COLUMNS.map((s) => {
                            const v = row.snapshot ? (row.snapshot[s.key] as number | null) : null;
                            return (
                              <td key={s.key} className="px-2 py-2 text-center text-sm font-mono">
                                {v == null ? (
                                  <span className="text-gray-600">-</span>
                                ) : (
                                  <span style={{ color: getSkillColor(v) }}>{v}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {expanded && row.hasSk && row.snapshot && (
                          <tr>
                            <td colSpan={99} className="p-0">
                              <PlayerRowExpanded snapshot={row.snapshot} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
