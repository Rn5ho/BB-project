'use client';

import { savePlan } from '@/app/players/[id]/actions';
import ProjectionPanel from '@/components/training/ProjectionPanel';
import type { PlayerState } from '@/lib/training/engine';
import type { PlanTemplate } from '@/lib/training/templates';
import type { PlanRow, WeekMinutes } from '@/queries/minutes'; // type-only import is fine (no IO)
import type { PlanValue } from './PlanEditor';

export default function DevelopmentSection({
  playerId, playerState, startWeekOfSeason, weeks, age, initialPlan, templates, skillsDb, potential,
}: {
  playerId: number;
  playerState: PlayerState;
  startWeekOfSeason: number;
  weeks: WeekMinutes[];
  age: number | null;
  initialPlan: PlanRow | null;
  templates: PlanTemplate[];
  skillsDb: Record<string, number | null>;
  potential: number | null;
}) {
  // `weeks` (per-position minutes history) isn't used by the projection panel today —
  // kept in the prop list because the player page already fetches and passes it.
  void weeks;

  async function handleSave(value: PlanValue) {
    await savePlan(playerId, {
      name: initialPlan?.name,
      blocks: value.blocks,
      coachLevel: value.coachLevel,
      youthTrainerLevel: value.youthTrainerLevel,
    });
  }

  return (
    <ProjectionPanel
      playerState={playerState}
      skillsDb={skillsDb}
      potential={potential}
      age={age}
      startWeekOfSeason={startWeekOfSeason}
      initialPlan={initialPlan}
      templates={templates}
      onSave={handleSave}
    />
  );
}
