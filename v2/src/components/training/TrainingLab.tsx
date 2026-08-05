'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { savePlan } from '@/app/players/[id]/actions';
import ProjectionPanel from '@/components/training/ProjectionPanel';
import ManualPlayerForm, { DEFAULT_MANUAL_PLAYER, type ManualPlayer } from '@/components/training/ManualPlayerForm';
import type { PlanValue } from '@/components/player/PlanEditor';
import { playerStateFromSnapshot } from '@/lib/training/bridge';
import type { PlayerState } from '@/lib/training/engine';
import type { SublevelBounds } from '@/lib/training/ensemble';
import type { PlanTemplate } from '@/lib/training/templates';
import type { ProjectablePlayer } from '@/queries/training';
import type { EffectiveArchetype, EvalPlayer } from '@/lib/archetypes/types';
import { SKILL_DB_NAMES, SKILL_KEYS } from '@/lib/training/types';

export interface SelectedPlayer {
  bbPlayerId: number;
  name: string;
  age: number | null;
  heightCm: number | null;
  potential: number | null;
  bestPosition: string | null;
  playerState: PlayerState;
  skillsDb: Record<string, number | null>;
  initialPlan: { blocks: Array<{ trainingId: number; weeks: number }>; coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number; horizon?: { age: number; week: number } | null } | null;
  sublevelBounds?: SublevelBounds;
}

type Mode = 'database' | 'manual';

function tsp10(skills: Record<string, number | null>): number | null {
  let sum = 0;
  for (const k of SKILL_KEYS) {
    const v = skills[SKILL_DB_NAMES[k]];
    if (v == null) return null;
    sum += v;
  }
  return sum;
}

export default function TrainingLab({
  players, selected, startWeekOfSeason, templates, archetypes, readOnly = false,
}: {
  players: ProjectablePlayer[];
  selected: SelectedPlayer | null;
  startWeekOfSeason: number;
  templates: PlanTemplate[];
  archetypes?: EffectiveArchetype[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(selected ? 'database' : 'manual');
  const [manual, setManual] = useState<ManualPlayer>(DEFAULT_MANUAL_PLAYER);

  const manualPlayerState = useMemo(
    () => playerStateFromSnapshot({
      skills: manual.skills,
      age: manual.age,
      heightCm: manual.heightCm,
      potential: manual.potential,
      stamina: manual.skills.stamina,
      freeThrow: manual.skills.free_throw,
    }),
    [manual],
  );

  const selectedEval: EvalPlayer | null = selected ? {
    ageNow: selected.age, skills: selected.skillsDb, potential: selected.potential,
    heightCm: selected.heightCm, tsp: tsp10(selected.skillsDb), bestPosition: selected.bestPosition,
  } : null;
  const manualEval: EvalPlayer = {
    ageNow: manual.age, skills: manual.skills, potential: manual.potential,
    heightCm: manual.heightCm, tsp: tsp10(manual.skills), bestPosition: null,
  };

  async function handleSaveSelected(value: PlanValue) {
    if (!selected) return;
    await savePlan(selected.bbPlayerId, {
      blocks: value.blocks,
      coachLevel: value.coachLevel,
      youthTrainerLevel: value.youthTrainerLevel,
      gymLevel: value.gymLevel,
      trainingCourtLevel: value.trainingCourtLevel,
      horizon: value.horizon,
    });
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['database', 'manual'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded px-3 py-1.5 text-sm font-medium border ${
              mode === m
                ? 'bg-amber-600 border-amber-600 text-white'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            {m === 'database' ? 'From database' : 'Build a player'}
          </button>
        ))}
      </div>

      {mode === 'database' && (
        <div className="space-y-6">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400">Player</span>
            <select
              key={selected?.bbPlayerId ?? 'none'}
              defaultValue={selected?.bbPlayerId ?? ''}
              onChange={(e) => router.push(e.target.value ? `/training?player=${e.target.value}` : '/training')}
              className="min-w-64 rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
            >
              <option value="">Select a player…</option>
              {players.map((p) => (
                <option key={p.bbPlayerId} value={p.bbPlayerId}>
                  {p.name} · age {p.age ?? '–'} · TSP {p.tsp ?? '–'}
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <div>
              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
                <span className="font-medium text-white">{selected.name}</span>
                <span>Age {selected.age ?? '–'}</span>
                <span>{selected.heightCm ? `${selected.heightCm} cm` : '–'}</span>
                <span>Pot {selected.potential ?? '–'}</span>
                <span>{selected.bestPosition ?? '–'}</span>
              </div>
              <ProjectionPanel
                playerState={selected.playerState}
                skillsDb={selected.skillsDb}
                potential={selected.potential}
                age={selected.age}
                startWeekOfSeason={startWeekOfSeason}
                initialPlan={selected.initialPlan}
                templates={templates}
                onSave={readOnly ? undefined : handleSaveSelected}
                sublevelBounds={selected.sublevelBounds}
                archetypes={archetypes}
                evalPlayer={selectedEval}
              />
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Pick a player with a full skill snapshot to project their training.</p>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-6">
          <ManualPlayerForm value={manual} onChange={setManual} currentWeek={startWeekOfSeason} />
          <ProjectionPanel
            playerState={manualPlayerState}
            skillsDb={manual.skills}
            potential={manual.potential}
            age={manual.age}
            startWeekOfSeason={manual.week}
            templates={templates}
            archetypes={archetypes}
            evalPlayer={manualEval}
          />
        </div>
      )}
    </div>
  );
}
