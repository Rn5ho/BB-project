"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  SKILLS,
  SKILL_LEVELS,
  POTENTIAL_LEVELS,
  POSITIONS,
  getSkillColor,
  getPotentialColor,
} from "@/lib/constants";
import type { Player, SkillSnapshot } from "@/lib/types";
import type {
  TrainingType,
  TrainingPosition,
  TrainerLevel,
  PlayerParams,
  TrainingWeekConfig,
  WeeklyTrainingResult,
} from "@/lib/training/types";
import {
  TRAINING_TYPES,
  TRAINER_MULTIPLIERS,
  YOUTH_TRAINER_MULTIPLIERS,
  AGE_MULTIPLIERS,
  getAvailablePositions,
  getHeightCm,
  getMinutesThreshold,
} from "@/lib/training/data";
import { calculateWeeklyGains, initializeSkillState } from "@/lib/training/engine";
import Navbar from "@/components/Navbar";
import SkillBadge from "@/components/SkillBadge";

export default function TrainingSimulatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div style={{ color: "var(--accent)" }}>Loading...</div>
        </div>
      </div>
    }>
      <TrainingSimulatorContent />
    </Suspense>
  );
}

function TrainingSimulatorContent() {
  const searchParams = useSearchParams();
  const prefilledPlayerId = searchParams.get("player");

  // Player list for dropdown
  const [players, setPlayers] = useState<Player[]>([]);
  const [snapshots, setSnapshots] = useState<Record<number, SkillSnapshot>>({});
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [isManual, setIsManual] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manual player inputs
  const [manualAge, setManualAge] = useState("18");
  const [manualHeight, setManualHeight] = useState("196");
  const [manualPotential, setManualPotential] = useState("8");
  const [manualSkills, setManualSkills] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const skill of SKILLS) {
      initial[skill.dbKey] = "5";
    }
    return initial;
  });

  // Training config
  const [trainingType, setTrainingType] = useState<TrainingType>("Ball Handling");
  const [trainingPosition, setTrainingPosition] = useState<TrainingPosition>("PG");
  const [trainerLevel, setTrainerLevel] = useState<TrainerLevel>(5);
  const [youthTrainerLevel, setYouthTrainerLevel] = useState(0);
  const [minutesPlayed, setMinutesPlayed] = useState("48");

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [potentialModel, setPotentialModel] = useState<"off" | "on">("off");
  const [potentialResistance, setPotentialResistance] = useState<"low" | "medium" | "high">("medium");
  const [gymLevel, setGymLevel] = useState<0 | 1 | 2 | 3>(0);

  // Result
  const [result, setResult] = useState<WeeklyTrainingResult | null>(null);

  // Available positions for current training type
  const availablePositions = useMemo(
    () => getAvailablePositions(trainingType),
    [trainingType]
  );

  // Reset position when training type changes
  useEffect(() => {
    if (availablePositions.length > 0 && !availablePositions.includes(trainingPosition)) {
      setTrainingPosition(availablePositions[0]);
    }
  }, [availablePositions, trainingPosition]);

  // Load players
  useEffect(() => {
    loadPlayers();
  }, []);

  // Pre-fill from URL param
  useEffect(() => {
    if (prefilledPlayerId && players.length > 0) {
      setSelectedPlayerId(prefilledPlayerId);
      setIsManual(false);
      loadSnapshot(Number(prefilledPlayerId));
    }
  }, [prefilledPlayerId, players]);

  async function loadPlayers() {
    const { data } = await supabase.from("players").select("*").order("name");
    if (data) setPlayers(data);
    setLoading(false);
  }

  async function loadSnapshot(playerId: number) {
    if (snapshots[playerId]) return;
    const { data } = await supabase
      .from("skill_snapshots")
      .select("*")
      .eq("player_id", playerId)
      .order("captured_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setSnapshots((prev) => ({ ...prev, [playerId]: data }));
      // Auto-set minutes based on age
      if (data.age) {
        setMinutesPlayed(String(getMinutesThreshold(data.age)));
      }
    }
  }

  function handlePlayerSelect(value: string) {
    setSelectedPlayerId(value);
    setResult(null);
    if (value) {
      setIsManual(false);
      loadSnapshot(Number(value));
    }
  }

  // Get the effective age (from selected player or manual)
  function getEffectiveAge(): number {
    if (!isManual && selectedPlayerId) {
      const snap = snapshots[Number(selectedPlayerId)];
      return snap?.age ?? 18;
    }
    return parseInt(manualAge) || 18;
  }

  function handleCalculate() {
    let playerParams: PlayerParams;

    if (!isManual && selectedPlayerId) {
      const player = players.find((p) => p.id === Number(selectedPlayerId));
      const snap = snapshots[Number(selectedPlayerId)];
      if (!player || !snap) return;

      playerParams = {
        age: snap.age ?? 18,
        heightCm: getHeightCm(player.height),
        potential: snap.potential ?? 8,
        currentSkills: initializeSkillState(snap),
        potentialResistance,
        potentialModel,
      };
    } else {
      // Manual mode
      const skillState = {
        jump_shot: 0, jump_range: 0, outside_def: 0, handling: 0,
        driving: 0, passing: 0, inside_shot: 0, inside_def: 0,
        rebounding: 0, shot_blocking: 0, stamina: 0, free_throw: 0,
      };
      for (const skill of SKILLS) {
        const val = parseInt(manualSkills[skill.dbKey]) || 5;
        // Use midpoint assumption: displayed value - 0.5
        skillState[skill.dbKey as keyof typeof skillState] = Math.max(0.5, val - 0.5);
      }
      playerParams = {
        age: parseInt(manualAge) || 18,
        heightCm: parseInt(manualHeight) || 196,
        potential: parseInt(manualPotential) || 8,
        currentSkills: skillState,
        potentialResistance,
        potentialModel,
      };
    }

    const config: TrainingWeekConfig = {
      trainingType,
      trainingPosition,
      trainerLevel,
      youthTrainerLevel,
      gymLevel,
      trainingCourtLevel: 0,
      minutesPlayed: parseInt(minutesPlayed) || 48,
    };

    const calcResult = calculateWeeklyGains(playerParams, config);
    setResult(calcResult);
  }

  // Get current displayed skills for the results comparison
  function getCurrentDisplayedSkills(): Record<string, number | null> {
    if (!isManual && selectedPlayerId) {
      const snap = snapshots[Number(selectedPlayerId)];
      if (!snap) return {};
      const result: Record<string, number | null> = {};
      for (const skill of SKILLS) {
        result[skill.dbKey] = snap[skill.dbKey as keyof SkillSnapshot] as number | null;
      }
      return result;
    }
    const result: Record<string, number | null> = {};
    for (const skill of SKILLS) {
      result[skill.dbKey] = parseInt(manualSkills[skill.dbKey]) || null;
    }
    return result;
  }

  const effectiveAge = getEffectiveAge();
  const showYouthTrainer = effectiveAge <= 19;

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-3xl font-bold mb-2">Training Simulator</h1>

        {/* Disclaimer */}
        <div
          className="rounded-lg px-4 py-3 mb-6 text-sm"
          style={{
            background: "rgba(233, 69, 96, 0.1)",
            border: "1px solid rgba(233, 69, 96, 0.3)",
            color: "#f0a0b0",
          }}
        >
          Estimates based on community research. Youth trainer and cross-training values are
          approximations. Potential cap model is experimental and off by default (see Advanced Settings).
          Actual in-game results may differ.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Player Selection */}
          <div
            className="rounded-lg p-6"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            <h2 className="text-lg font-semibold mb-4">Player</h2>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setIsManual(false); setResult(null); }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${!isManual ? "text-white" : "text-gray-400"}`}
                style={!isManual ? { background: "var(--accent)" } : { background: "var(--background)", border: "1px solid var(--card-border)" }}
              >
                From Database
              </button>
              <button
                onClick={() => { setIsManual(true); setResult(null); }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${isManual ? "text-white" : "text-gray-400"}`}
                style={isManual ? { background: "var(--accent)" } : { background: "var(--background)", border: "1px solid var(--card-border)" }}
              >
                Enter Manually
              </button>
            </div>

            {!isManual ? (
              <div>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => handlePlayerSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                >
                  <option value="">Select a player...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {selectedPlayerId && snapshots[Number(selectedPlayerId)] && (() => {
                  const snap = snapshots[Number(selectedPlayerId)];
                  const player = players.find((p) => p.id === Number(selectedPlayerId));
                  return (
                    <div className="mt-3 text-sm text-gray-400 space-y-1">
                      <div className="flex gap-4">
                        <span>Age: <span className="text-white">{snap.age}</span></span>
                        <span>Height: <span className="text-white">{player?.height || "?"}</span></span>
                        <span>
                          Potential:{" "}
                          <span style={{ color: getPotentialColor(snap.potential) }}>
                            {POTENTIAL_LEVELS[snap.potential || 0]}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SKILLS.map((skill) => {
                          const val = snap[skill.dbKey as keyof SkillSnapshot] as number | null;
                          return (
                            <span key={skill.dbKey} className="text-xs">
                              <span className="text-gray-500">{skill.name.replace("Outside Def.", "OD").replace("Inside Def.", "ID").replace("Jump Shot", "JS").replace("Jump Range", "JR").replace("Inside Shot", "IS").replace("Shot Blocking", "SB").replace("Free Throw", "FT").replace("Rebounding", "Reb").replace("Handling", "Han").replace("Driving", "Dri").replace("Passing", "Pas").replace("Stamina", "Sta")}:</span>{" "}
                              <span style={{ color: getSkillColor(val) }}>{val ?? "?"}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {selectedPlayerId && !snapshots[Number(selectedPlayerId)] && (
                  <p className="mt-3 text-sm text-gray-500">Loading snapshot...</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Age</label>
                    <input
                      type="number"
                      min="18"
                      max="36"
                      value={manualAge}
                      onChange={(e) => { setManualAge(e.target.value); setResult(null); }}
                      className="w-full px-2 py-1.5 rounded text-sm text-white focus:outline-none"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min="175"
                      max="229"
                      value={manualHeight}
                      onChange={(e) => { setManualHeight(e.target.value); setResult(null); }}
                      className="w-full px-2 py-1.5 rounded text-sm text-white focus:outline-none"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Potential</label>
                    <select
                      value={manualPotential}
                      onChange={(e) => { setManualPotential(e.target.value); setResult(null); }}
                      className="w-full px-2 py-1.5 rounded text-sm text-white focus:outline-none"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                    >
                      {Object.entries(POTENTIAL_LEVELS).map(([k, v]) => (
                        <option key={k} value={k}>{v} ({k})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {SKILLS.map((skill) => (
                    <div key={skill.dbKey}>
                      <label className="block text-xs text-gray-400 mb-1">{skill.name}</label>
                      <select
                        value={manualSkills[skill.dbKey]}
                        onChange={(e) => {
                          setManualSkills((prev) => ({ ...prev, [skill.dbKey]: e.target.value }));
                          setResult(null);
                        }}
                        className="w-full px-2 py-1 rounded text-xs text-white focus:outline-none"
                        style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                      >
                        {Object.entries(SKILL_LEVELS).map(([k, v]) => (
                          <option key={k} value={k}>{v} ({k})</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Training Configuration */}
          <div
            className="rounded-lg p-6"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            <h2 className="text-lg font-semibold mb-4">Training Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Training Type</label>
                <select
                  value={trainingType}
                  onChange={(e) => { setTrainingType(e.target.value as TrainingType); setResult(null); }}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                >
                  {TRAINING_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Position(s) Trained</label>
                <select
                  value={trainingPosition}
                  onChange={(e) => { setTrainingPosition(e.target.value as TrainingPosition); setResult(null); }}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                >
                  {availablePositions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Trainer Level</label>
                  <select
                    value={trainerLevel}
                    onChange={(e) => { setTrainerLevel(Number(e.target.value) as TrainerLevel); setResult(null); }}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                  >
                    {([1, 2, 3, 4, 5, 6, 7] as TrainerLevel[]).map((l) => (
                      <option key={l} value={l}>
                        {l}. {TRAINER_MULTIPLIERS[l].name} ({TRAINER_MULTIPLIERS[l].multiplier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Minutes / Week</label>
                  <input
                    type="number"
                    min="0"
                    max="96"
                    value={minutesPlayed}
                    onChange={(e) => { setMinutesPlayed(e.target.value); setResult(null); }}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                  />
                </div>
              </div>

              {showYouthTrainer && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Youth Trainer Level{" "}
                    <span className="text-xs text-gray-500">(ages 18-19 only, estimated)</span>
                  </label>
                  <select
                    value={youthTrainerLevel}
                    onChange={(e) => { setYouthTrainerLevel(Number(e.target.value)); setResult(null); }}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                  >
                    <option value="0">None</option>
                    {([1, 2, 3, 4, 5, 6, 7] as const).map((l) => (
                      <option key={l} value={l}>
                        Level {l} ({((YOUTH_TRAINER_MULTIPLIERS[l] - 1) * 100).toFixed(1)}% boost)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Settings {showAdvanced ? "▲" : "▼"}
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--card-border)" }}>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Gym Level{" "}
                      <span className="text-xs text-gray-500">(extra cross-training slots)</span>
                    </label>
                    <select
                      value={gymLevel}
                      onChange={(e) => { setGymLevel(Number(e.target.value) as 0 | 1 | 2 | 3); setResult(null); }}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                    >
                      <option value="0">None</option>
                      <option value="1">Level 1 (+1 cross-training slot)</option>
                      <option value="2">Level 2 (+2 cross-training slots)</option>
                      <option value="3">Level 3 (+3 cross-training slots)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Potential Cap Model{" "}
                      <span className="text-xs text-yellow-500">(experimental)</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      {([
                        { key: "off" as const, label: "Off" },
                        { key: "on" as const, label: "On" },
                      ]).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => { setPotentialModel(key); setResult(null); }}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${potentialModel === key ? "text-white" : "text-gray-400"}`}
                          style={potentialModel === key ? { background: "var(--accent)" } : { background: "var(--background)", border: "1px solid var(--card-border)" }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {potentialModel === "on" && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">
                          Per-skill sigmoid slowdown. Training slows as individual skills approach
                          the threshold for this potential level. Resistance controls how sharp the slowdown is.
                        </p>
                        <label className="block text-xs text-gray-400 mb-1">
                          Resistance
                        </label>
                        <div className="flex gap-2">
                          {(["low", "medium", "high"] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => { setPotentialResistance(r); setResult(null); }}
                              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${potentialResistance === r ? "text-white" : "text-gray-400"}`}
                              style={potentialResistance === r ? { background: "var(--accent)" } : { background: "var(--background)", border: "1px solid var(--card-border)" }}
                            >
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={!isManual && !selectedPlayerId}
              className="mt-6 w-full px-4 py-3 rounded-lg font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ background: "var(--accent)" }}
            >
              Calculate Weekly Gains
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (() => {
          const currentDisplayedSkills = getCurrentDisplayedSkills();
          return (
          <div
            className="rounded-lg p-6"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            <h2 className="text-lg font-semibold mb-4">Projected Results (1 Week)</h2>

            {/* Multiplier Summary */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-400">
              <span>Age multiplier: <span className="text-white font-mono">{result.multipliers.age.toFixed(2)}</span></span>
              <span>Trainer: <span className="text-white font-mono">{result.multipliers.trainer.toFixed(2)}</span></span>
              {result.multipliers.youthTrainer > 1 && (
                <span>Youth trainer: <span className="text-white font-mono">{result.multipliers.youthTrainer.toFixed(3)}</span></span>
              )}
              <span>Minutes factor: <span className="text-white font-mono">{result.multipliers.minutes.toFixed(2)}</span></span>
            </div>

            {/* Salary Info (informational, when potential model is on) */}
            {result.salaryInfo && (
              <div
                className="flex flex-wrap gap-4 mb-4 px-3 py-2 rounded text-xs"
                style={{ background: "rgba(233, 69, 96, 0.08)", border: "1px solid rgba(233, 69, 96, 0.2)" }}
              >
                <span className="text-gray-400">
                  Best position: <span className="text-white font-semibold">{result.salaryInfo.position}</span>
                </span>
                <span className="text-gray-400">
                  Est. salary: <span className="text-white font-mono">${result.salaryInfo.salary.toLocaleString()}</span>
                </span>
              </div>
            )}

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SKILLS.map((skill) => {
                const current = currentDisplayedSkills[skill.dbKey];
                const projected = result.newDisplayedSkills[skill.dbKey as keyof typeof result.newDisplayedSkills];
                const gainBreakdown = result.gains[skill.dbKey as keyof typeof result.gains];
                const isLevelUp = result.levelUps[skill.dbKey as keyof typeof result.levelUps];
                const hasGain = gainBreakdown && gainBreakdown.total > 0.001;

                return (
                  <div
                    key={skill.dbKey}
                    className="flex items-center justify-between py-2 px-3 rounded"
                    style={{
                      background: isLevelUp
                        ? "rgba(16, 185, 129, 0.1)"
                        : hasGain
                        ? "rgba(255, 255, 255, 0.02)"
                        : "transparent",
                      border: isLevelUp ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                    }}
                  >
                    <span className="text-sm text-gray-300 w-28 shrink-0">{skill.name}</span>

                    <div className="flex items-center gap-2 text-sm">
                      <SkillBadge value={current ?? null} size="sm" />
                      {hasGain && (
                        <>
                          <span className="text-gray-500">&rarr;</span>
                          <SkillBadge value={projected} size="sm" />
                        </>
                      )}
                    </div>

                    <div className="text-right w-32 shrink-0">
                      {gainBreakdown && gainBreakdown.total > 0.001 ? (
                        <span className="text-xs font-mono">
                          <span className="text-emerald-400">
                            +{gainBreakdown.total.toFixed(3)}
                          </span>
                          {isLevelUp && (
                            <span className="ml-1 text-yellow-400 font-bold">LVL UP</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gain Breakdown Details */}
            <details className="mt-4">
              <summary className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                Detailed breakdown
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left text-gray-500">Skill</th>
                      <th className="px-2 py-1 text-right text-gray-500">Base</th>
                      <th className="px-2 py-1 text-right text-gray-500">Elastic</th>
                      <th className="px-2 py-1 text-right text-gray-500">Cross-Train</th>
                      <th className="px-2 py-1 text-right text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SKILLS.map((skill) => {
                      const g = result.gains[skill.dbKey as keyof typeof result.gains];
                      if (!g || g.total < 0.0001) return null;
                      return (
                        <tr key={skill.dbKey} style={{ borderTop: "1px solid var(--card-border)" }}>
                          <td className="px-2 py-1 text-gray-300">{skill.name}</td>
                          <td className="px-2 py-1 text-right font-mono text-gray-400">{g.base > 0 ? `+${g.base.toFixed(4)}` : "-"}</td>
                          <td className="px-2 py-1 text-right font-mono text-blue-400">{g.elastic > 0 ? `+${g.elastic.toFixed(4)}` : "-"}</td>
                          <td className="px-2 py-1 text-right font-mono text-purple-400">{g.crossTraining > 0 ? `+${g.crossTraining.toFixed(4)}` : "-"}</td>
                          <td className="px-2 py-1 text-right font-mono text-emerald-400">+{g.total.toFixed(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>

            {/* Total SP Gain */}
            <div className="mt-4 pt-3 text-sm text-gray-400" style={{ borderTop: "1px solid var(--card-border)" }}>
              Total skill point gain this week:{" "}
              <span className="text-emerald-400 font-mono font-bold">
                +{Object.values(result.gains).reduce((sum, g) => sum + g.total, 0).toFixed(3)}
              </span>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
