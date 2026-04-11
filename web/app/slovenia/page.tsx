"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { SKILLS, SKILL_LEVELS, POTENTIAL_LEVELS, getSkillColor, getPotentialColor } from "@/lib/constants";
import type { Player, SkillSnapshot, PlayerTag } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type SubTab = "roster" | "prospects";

type SortField =
  | "name"
  | "age"
  | "height"
  | "type"
  | "position"
  | "potential"
  | "salary"
  | "dmi"
  | "skill_points"
  | "osp"
  | "isp"
  | "tsp_delta"
  | "updated"
  | "jump_shot"
  | "jump_range"
  | "outside_def"
  | "handling"
  | "driving"
  | "passing"
  | "inside_shot"
  | "inside_def"
  | "rebounding"
  | "shot_blocking"
  | "stamina"
  | "free_throw";

type PlayerType = "outside" | "inside" | "mid";

const SKILL_ABBREV: Record<string, string> = {
  jump_shot: "JS",
  jump_range: "JR",
  outside_def: "OD",
  handling: "Han",
  driving: "Dri",
  passing: "Pas",
  inside_shot: "IS",
  inside_def: "ID",
  rebounding: "Reb",
  shot_blocking: "SB",
  stamina: "Sta",
  free_throw: "FT",
};

const OUTSIDE_KEYS: (keyof SkillSnapshot)[] = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving', 'passing'];
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

function parseHeight(height: string | null): number | null {
  if (!height) return null;
  const match = height.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function classifyPlayer(heightCm: number | null): PlayerType {
  if (heightCm === null) return "mid";
  if (heightCm <= 198) return "outside";
  if (heightCm >= 206) return "inside";
  return "mid";
}

function computeCurrentAge(snapshot: SkillSnapshot | null, currentSeason: number | null): number | null {
  if (!snapshot?.age) return null;
  if (currentSeason && snapshot.bb_season && currentSeason > snapshot.bb_season) {
    return snapshot.age + (currentSeason - snapshot.bb_season);
  }
  return snapshot.age;
}

const TSP_BENCHMARKS: Record<number, { low: number; mid: number; high: number }> = {
  18: { low: 40, mid: 50, high: 60 },
  19: { low: 55, mid: 70, high: 85 },
  20: { low: 75, mid: 90, high: 110 },
  21: { low: 90, mid: 110, high: 130 },
};

function getTspBenchmark(age: number | null): { low: number; mid: number; high: number } | null {
  if (age === null) return null;
  return TSP_BENCHMARKS[age] || null;
}

function formatStaleness(capturedAt: string, currentSeason: number | null, snapshotSeason: number | null): string {
  if (currentSeason && snapshotSeason) {
    const delta = currentSeason - snapshotSeason;
    if (delta === 0) return "this season";
    if (delta === 1) return "1 season ago";
    return `${delta} seasons ago`;
  }
  const days = Math.floor((Date.now() - new Date(capturedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface PlayerRow {
  player: Player;
  snapshot: SkillSnapshot | null;
  prevSnapshot: SkillSnapshot | null;
  tags: string[];
  heightCm: number | null;
  playerType: PlayerType;
}

export default function SloveniaPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<number | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("prospects");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterAge, setFilterAge] = useState<number[]>([]);
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterPotential, setFilterPotential] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>("");
  const [filterMinTsp, setFilterMinTsp] = useState<string>("");
  const [filterMinSalary, setFilterMinSalary] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [togglingRoster, setTogglingRoster] = useState<Set<number>>(new Set());
  const [showSkills, setShowSkills] = useState(false);

  useEffect(() => {
    loadCurrentSeason();
    loadPlayers();
  }, []);

  async function loadCurrentSeason() {
    const cached = localStorage.getItem("bb_current_season");
    if (cached) {
      try {
        const { season, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setCurrentSeason(season);
          return;
        }
      } catch { /* refetch */ }
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
    } catch { /* non-fatal */ }
  }

  async function loadPlayers() {
    setLoading(true);

    const { data: playersData } = await supabase
      .from("players")
      .select("*")
      .or("nationality.eq.Slovenia,nationality.is.null")
      .order("name");

    if (!playersData) {
      setLoading(false);
      return;
    }

    const playerIds = playersData.map(p => p.id);

    const { data: snapshots } = await supabase
      .from("skill_snapshots")
      .select("*")
      .in("player_id", playerIds)
      .order("captured_at", { ascending: false });

    const { data: tags } = await supabase
      .from("player_tags")
      .select("*")
      .in("player_id", playerIds);

    const snapshotMap = new Map<number, SkillSnapshot>();
    const prevSnapshotMap = new Map<number, SkillSnapshot>();
    if (snapshots) {
      for (const snap of snapshots) {
        if (!snapshotMap.has(snap.player_id)) {
          snapshotMap.set(snap.player_id, snap);
        } else if (!prevSnapshotMap.has(snap.player_id)) {
          prevSnapshotMap.set(snap.player_id, snap);
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

    const rows: PlayerRow[] = playersData.map((p) => {
      const heightCm = parseHeight(p.height);
      return {
        player: p,
        snapshot: snapshotMap.get(p.id) || null,
        prevSnapshot: prevSnapshotMap.get(p.id) || null,
        tags: tagMap.get(p.id) || [],
        heightCm,
        playerType: classifyPlayer(heightCm),
      };
    });

    setPlayers(rows);
    setSelectedIds(new Set());
    setLoading(false);
  }

  function getTspDelta(row: PlayerRow): number | null {
    const current = row.snapshot?.skill_points;
    const prev = row.prevSnapshot?.skill_points;
    if (current == null || prev == null) return null;
    return current - prev;
  }

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (subTab === "roster") {
      result = result.filter((r) => r.player.is_nt_player);
    } else {
      result = result.filter((r) => !r.player.is_nt_player);
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

    if (filterType) {
      result = result.filter((r) => r.playerType === filterType);
    }

    if (filterMinTsp) {
      const minTsp = parseInt(filterMinTsp, 10);
      if (!isNaN(minTsp)) {
        result = result.filter((r) => (r.snapshot?.skill_points ?? 0) >= minTsp);
      }
    }

    if (filterMinSalary) {
      const minSal = parseInt(filterMinSalary, 10);
      if (!isNaN(minSal)) {
        result = result.filter((r) => (r.snapshot?.salary ?? 0) >= minSal);
      }
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
          aVal = computeCurrentAge(a.snapshot, currentSeason) || 0;
          bVal = computeCurrentAge(b.snapshot, currentSeason) || 0;
          break;
        case "height":
          aVal = a.heightCm || 0;
          bVal = b.heightCm || 0;
          break;
        case "type":
          const typeOrder = { outside: 0, mid: 1, inside: 2 };
          aVal = typeOrder[a.playerType];
          bVal = typeOrder[b.playerType];
          break;
        case "position":
          aVal = a.player.position || "";
          bVal = b.player.position || "";
          break;
        case "potential":
          aVal = a.snapshot?.potential || 0;
          bVal = b.snapshot?.potential || 0;
          break;
        case "salary":
          aVal = a.snapshot?.salary || 0;
          bVal = b.snapshot?.salary || 0;
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
        case "tsp_delta":
          aVal = getTspDelta(a) ?? -9999;
          bVal = getTspDelta(b) ?? -9999;
          break;
        case "updated":
          aVal = a.snapshot?.captured_at || "";
          bVal = b.snapshot?.captured_at || "";
          break;
        default: {
          // Individual skill sort (jump_shot, handling, etc.)
          const skillKey = sortField as keyof SkillSnapshot;
          const aSkill = a.snapshot?.[skillKey];
          const bSkill = b.snapshot?.[skillKey];
          aVal = typeof aSkill === "number" ? aSkill : 0;
          bVal = typeof bSkill === "number" ? bSkill : 0;
          break;
        }
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
  }, [players, currentSeason, subTab, searchQuery, filterAge, filterPosition, filterPotential, filterType, filterMinTsp, filterMinSalary, sortField, sortAsc]);

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
      const { data, error } = await supabase
        .from("players")
        .delete()
        .in("id", ids)
        .select();

      if (error) {
        alert(`Delete failed: ${error.message}\n\nRun this SQL in Supabase SQL Editor:\nCREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);`);
      } else if (!data || data.length === 0) {
        alert(`Delete blocked by database policy.\n\nRun this SQL in Supabase SQL Editor:\nCREATE POLICY "Anyone can delete players" ON players FOR DELETE TO authenticated USING (true);`);
      } else {
        await loadPlayers();
      }
    } catch (err) {
      alert(`Delete error: ${err}`);
    }

    setDeleting(false);
  }

  async function toggleRoster(playerId: number, currentValue: boolean) {
    setTogglingRoster((prev) => new Set(prev).add(playerId));
    try {
      const { error } = await supabase
        .from("players")
        .update({ is_nt_player: !currentValue })
        .eq("id", playerId);
      if (error) {
        alert(`Toggle failed: ${error.message}`);
      } else {
        setPlayers((prev) =>
          prev.map((r) =>
            r.player.id === playerId
              ? { ...r, player: { ...r.player, is_nt_player: !currentValue } }
              : r
          )
        );
      }
    } catch (err) {
      alert(`Toggle error: ${err}`);
    }
    setTogglingRoster((prev) => {
      const next = new Set(prev);
      next.delete(playerId);
      return next;
    });
  }

  const exportToCsv = useCallback(() => {
    if (filteredPlayers.length === 0) return;

    const headers = [
      "Name", "BB ID", "Age", "Height", "Type",
      "Position", "Potential", "Salary", "DMI", "TSP", "OSP", "ISP",
      "TSP Delta", "Tags", "Last Updated",
      ...SKILLS.map(s => s.name),
    ];

    const rows = filteredPlayers.map((row) => {
      const age = computeCurrentAge(row.snapshot, currentSeason);
      const s = row.snapshot;
      return [
        row.player.name,
        row.player.bb_player_id,
        age ?? "",
        row.heightCm ?? "",
        row.playerType,
        row.player.position || "",
        s?.potential != null ? POTENTIAL_LEVELS[s.potential] || s.potential : "",
        s?.salary ?? "",
        s?.dmi ?? "",
        s?.skill_points ?? "",
        calcSkillSum(s, OUTSIDE_KEYS) ?? "",
        calcSkillSum(s, INSIDE_KEYS) ?? "",
        getTspDelta(row) ?? "",
        row.tags.join("; "),
        s ? new Date(s.captured_at).toLocaleDateString() : "",
        ...SKILLS.map(skill => {
          const val = s?.[skill.dbKey as keyof SkillSnapshot];
          return typeof val === "number" ? val : "";
        }),
      ].join("\t");
    });

    const text = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied ${filteredPlayers.length} players to clipboard (tab-separated, paste into Excel)`);
    });
  }, [filteredPlayers, currentSeason]);

  const hasActiveFilters = searchQuery || filterAge.length > 0 || filterPosition || filterPotential > 0 || filterType || filterMinTsp || filterMinSalary;

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterAge([]);
    setFilterPosition("");
    setFilterPotential(0);
    setFilterType("");
    setFilterMinTsp("");
    setFilterMinSalary("");
  };

  const SortHeader = ({
    field,
    children,
    title,
  }: {
    field: SortField;
    children: React.ReactNode;
    title?: string;
  }) => (
    <th
      className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
      onClick={() => toggleSort(field)}
      title={title}
    >
      {children}
      {sortField === field && (
        <span className="ml-1">{sortAsc ? "\u25B2" : "\u25BC"}</span>
      )}
    </th>
  );

  const typeLabel = (t: PlayerType) => {
    switch (t) {
      case "outside": return "OUT";
      case "inside": return "IN";
      case "mid": return "MID";
    }
  };

  const typeColor = (t: PlayerType) => {
    switch (t) {
      case "outside": return "#3b82f6";
      case "inside": return "#ef4444";
      case "mid": return "#a855f7";
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Slovenia</h1>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--card-border)" }}
            >
              <button
                onClick={() => setSubTab("roster")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  subTab === "roster" ? "text-white" : "text-gray-400"
                }`}
                style={subTab === "roster" ? { background: "var(--accent)" } : { background: "var(--card-bg)" }}
              >
                U-21 Roster
              </button>
              <button
                onClick={() => setSubTab("prospects")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  subTab === "prospects" ? "text-white" : "text-gray-400"
                }`}
                style={subTab === "prospects" ? { background: "var(--accent)" } : { background: "var(--card-bg)" }}
              >
                Prospects
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSkills(!showSkills)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${showSkills ? "text-white" : "text-gray-300 hover:text-white"}`}
              style={{
                background: showSkills ? "var(--accent)" : "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
              title="Toggle individual skill columns"
            >
              Skills
            </button>
            <button
              onClick={exportToCsv}
              className="px-3 py-1.5 rounded text-xs font-medium text-gray-300 hover:text-white transition-colors"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
              title="Copy filtered list to clipboard (tab-separated)"
            >
              Export ({filteredPlayers.length})
            </button>
            <span className="text-sm text-gray-400">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 && "s"}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div
          className="rounded-lg p-4 mb-6 flex flex-col gap-3"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div className="flex flex-wrap gap-3 items-center">
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
              style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
            >
              <option value="">All positions</option>
              {["PG", "SG", "SF", "PF", "C"].map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
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

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1 rounded text-xs text-white focus:outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
            >
              <option value="">All types</option>
              <option value="outside">Outside (≤198cm)</option>
              <option value="mid">Mid (199-205cm)</option>
              <option value="inside">Inside (≥206cm)</option>
            </select>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showAdvanced ? "Less filters" : "More filters"}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {showAdvanced && (
            <div className="flex flex-wrap gap-3 items-center pt-2" style={{ borderTop: "1px solid var(--card-border)" }}>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Min TSP:</span>
                <input
                  type="number"
                  value={filterMinTsp}
                  onChange={(e) => setFilterMinTsp(e.target.value)}
                  placeholder="0"
                  className="w-16 px-2 py-1 rounded text-xs text-white focus:outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Min Salary:</span>
                <input
                  type="number"
                  value={filterMinSalary}
                  onChange={(e) => setFilterMinSalary(e.target.value)}
                  placeholder="0"
                  className="w-20 px-2 py-1 rounded text-xs text-white focus:outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div
            className="rounded-lg p-3 mb-4 flex items-center justify-between"
            style={{ background: "var(--card-bg)", border: "1px solid var(--accent)" }}
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
            {subTab === "roster"
              ? "No U-21 roster players yet. Star (★) players from the Prospects tab to add them to your final roster."
              : "No prospects tracked yet. Scan your Slovenia NT roster page with the extension to capture player skills."}
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
                    <th className="px-2 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredPlayers.length && filteredPlayers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                        title="Select all"
                      />
                    </th>
                    <th className="px-1 py-2 w-8 text-center text-xs font-medium text-gray-400 uppercase tracking-wider" title="Toggle U-21 Roster">
                      ★
                    </th>
                    <SortHeader field="name">Name</SortHeader>
                    <SortHeader field="age">Age</SortHeader>
                    <SortHeader field="height" title="Height in cm">Ht</SortHeader>
                    <SortHeader field="type" title="Outside (≤198) / Mid / Inside (≥206)">Type</SortHeader>
                    <SortHeader field="position">Pos</SortHeader>
                    <SortHeader field="potential">Pot</SortHeader>
                    <SortHeader field="salary">Salary</SortHeader>
                    <SortHeader field="dmi">DMI</SortHeader>
                    <SortHeader field="skill_points" title="Total Skill Points">TSP</SortHeader>
                    <SortHeader field="osp" title="Outside Skill Points">OSP</SortHeader>
                    <SortHeader field="isp" title="Inside Skill Points">ISP</SortHeader>
                    <SortHeader field="tsp_delta" title="TSP change since previous snapshot">+/-</SortHeader>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tags
                    </th>
                    <SortHeader field="updated" title="Last scouted">Scouted</SortHeader>
                    {showSkills && SKILLS.map((skill) => (
                      <SortHeader key={skill.dbKey} field={skill.dbKey as SortField} title={skill.name}>
                        {SKILL_ABBREV[skill.dbKey] || skill.name}
                      </SortHeader>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((row, i) => {
                    const age = computeCurrentAge(row.snapshot, currentSeason);
                    const tspDelta = getTspDelta(row);
                    const benchmark = getTspBenchmark(age);
                    const tsp = row.snapshot?.skill_points ?? null;
                    let tspStatus: "behind" | "on-track" | "ahead" | null = null;
                    if (benchmark && tsp !== null) {
                      if (tsp < benchmark.low) tspStatus = "behind";
                      else if (tsp >= benchmark.high) tspStatus = "ahead";
                      else tspStatus = "on-track";
                    }

                    return (
                      <tr
                        key={row.player.id}
                        className={`hover:bg-white/5 transition-colors ${
                          selectedIds.has(row.player.id) ? "bg-white/10" : ""
                        }`}
                        style={{
                          borderTop: i > 0 ? "1px solid var(--card-border)" : "none",
                        }}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.player.id)}
                            onChange={() => toggleSelect(row.player.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-1 py-2 text-center">
                          <button
                            onClick={() => toggleRoster(row.player.id, row.player.is_nt_player)}
                            disabled={togglingRoster.has(row.player.id)}
                            className="text-lg leading-none transition-colors hover:scale-110"
                            title={row.player.is_nt_player ? "Remove from U-21 Roster" : "Add to U-21 Roster"}
                            style={{
                              color: row.player.is_nt_player ? "#f59e0b" : "#4b5563",
                              opacity: togglingRoster.has(row.player.id) ? 0.5 : 1,
                              cursor: togglingRoster.has(row.player.id) ? "wait" : "pointer",
                            }}
                          >
                            {row.player.is_nt_player ? "★" : "☆"}
                          </button>
                        </td>
                        <td className="px-2 py-2">
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
                        <td className="px-2 py-2 text-sm">
                          {age ?? "-"}
                        </td>
                        <td className="px-2 py-2 text-sm font-mono">
                          {row.heightCm ?? "-"}
                        </td>
                        <td className="px-2 py-2 text-xs font-medium">
                          <span style={{ color: typeColor(row.playerType) }}>
                            {typeLabel(row.playerType)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm">
                          {row.player.position || "-"}
                        </td>
                        <td className="px-2 py-2 text-sm">
                          {row.snapshot?.potential != null ? (
                            <span
                              style={{ color: getPotentialColor(row.snapshot.potential) }}
                              title={POTENTIAL_LEVELS[row.snapshot.potential] || ""}
                            >
                              {row.snapshot.potential}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2 py-2 text-sm font-mono">
                          {row.snapshot?.salary != null
                            ? `${(row.snapshot.salary / 1000).toFixed(1)}k`
                            : "-"}
                        </td>
                        <td className="px-2 py-2 text-sm font-mono">
                          {row.snapshot?.dmi != null
                            ? (row.snapshot.dmi / 1000).toFixed(0) + "k"
                            : "-"}
                        </td>
                        <td
                          className="px-2 py-2 text-sm font-mono"
                          title={benchmark ? `Low: ${benchmark.low} | Mid: ${benchmark.mid} | High: ${benchmark.high}` : undefined}
                        >
                          <span
                            style={{
                              color: tspStatus === "behind" ? "#ef4444"
                                : tspStatus === "ahead" ? "#22c55e"
                                : undefined,
                            }}
                          >
                            {tsp ?? "-"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm font-mono">
                          {calcSkillSum(row.snapshot, OUTSIDE_KEYS) ?? "-"}
                        </td>
                        <td className="px-2 py-2 text-sm font-mono">
                          {calcSkillSum(row.snapshot, INSIDE_KEYS) ?? "-"}
                        </td>
                        <td className="px-2 py-2 text-sm font-mono">
                          {tspDelta !== null ? (
                            <span style={{ color: tspDelta > 0 ? "#22c55e" : tspDelta < 0 ? "#ef4444" : undefined }}>
                              {tspDelta > 0 ? `+${tspDelta}` : tspDelta}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
                            {row.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-xs"
                                style={{ background: "var(--accent)", opacity: 0.8 }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-500" title={row.snapshot ? new Date(row.snapshot.captured_at).toLocaleString() : undefined}>
                          {row.snapshot
                            ? formatStaleness(row.snapshot.captured_at, currentSeason, row.snapshot.bb_season)
                            : "-"}
                        </td>
                        {showSkills && SKILLS.map((skill) => {
                          const val = row.snapshot?.[skill.dbKey as keyof SkillSnapshot];
                          const numVal = typeof val === "number" ? val : null;
                          return (
                            <td key={skill.dbKey} className="px-1.5 py-2 text-xs font-mono text-center" title={numVal != null ? `${skill.name}: ${SKILL_LEVELS[numVal] || numVal}` : undefined}>
                              {numVal != null ? (
                                <span style={{ color: getSkillColor(numVal) }}>{numVal}</span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
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
        )}
      </div>
    </div>
  );
}
