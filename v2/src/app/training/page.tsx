import { eq } from 'drizzle-orm';
import { db, seasons } from '@/db';
import { getPlayerDetail } from '@/queries/player-detail';
import { getEffectiveArchetypes } from '@/queries/archetypes';
import { getPopAnchors, getProjectablePlayers } from '@/queries/training';
import { getCurrentSeasonId } from '@/queries/players';
import { getActivePlan } from '@/queries/minutes';
import { currentProfile } from '@/lib/series';
import { applyAnchors, boundsFromAnchors, playerStateFromSnapshot } from '@/lib/training/bridge';
import { PLAN_TEMPLATES } from '@/lib/training/templates';
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import { seasonWeekOf } from '@/server/sync/minutes';
import TrainingLab, { type SelectedPlayer } from '@/components/training/TrainingLab';
import { getSessionRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ player?: string }>;
}) {
  const { player: playerParam } = await searchParams;

  const [players, seasonNow, archetypes, role] = await Promise.all([
    getProjectablePlayers(),
    getCurrentSeasonId(),
    getEffectiveArchetypes(),
    getSessionRole(),
  ]);
  const [seasonRow] = await db.select().from(seasons).where(eq(seasons.id, seasonNow));
  const startWeekOfSeason = seasonRow ? Math.min(14, Math.max(1, seasonWeekOf(new Date(), seasonRow.start))) : 1;

  let selected: SelectedPlayer | null = null;
  const playerId = playerParam ? Number(playerParam) : null;
  if (playerId && Number.isFinite(playerId) && players.some((p) => p.bbPlayerId === playerId)) {
    const detail = await getPlayerDetail(playerId);
    if (detail) {
      const profile = currentProfile(detail.snaps);
      const fullSkills = profile.skills && Object.values(profile.skills).filter((v) => v != null).length >= 10;
      if (fullSkills && profile.skills && detail.player.ageNow != null && detail.player.heightCm != null) {
        const playerState = playerStateFromSnapshot({
          skills: profile.skills,
          age: detail.player.ageNow,
          heightCm: detail.player.heightCm,
          potential: profile.potential ?? detail.player.potential ?? 0,
          stamina: profile.skills.stamina,
          freeThrow: profile.skills.free_throw,
        });
        const popAnchors = await getPopAnchors(playerId);
        const anchors = popAnchors
          .filter((a): a is typeof a & { skill: SkillKey } => (SKILL_KEYS as readonly string[]).includes(a.skill))
          .map((a) => ({ skill: a.skill as SkillKey, toDisplayed: a.toDisplayed, windowStart: a.windowStart, windowEnd: a.windowEnd }));
        const sublevelBounds = boundsFromAnchors(profile.skills, anchors, new Date());
        const anchoredState = applyAnchors(playerState, sublevelBounds);
        const activePlan = await getActivePlan(playerId);
        selected = {
          bbPlayerId: playerId,
          name: detail.player.name,
          age: detail.player.ageNow,
          heightCm: detail.player.heightCm,
          potential: profile.potential ?? detail.player.potential,
          bestPosition: detail.player.bestPosition,
          playerState: anchoredState,
          skillsDb: profile.skills,
          initialPlan: activePlan
            ? {
                blocks: activePlan.blocks, coachLevel: activePlan.coachLevel,
                youthTrainerLevel: activePlan.youthTrainerLevel,
                gymLevel: activePlan.gymLevel, trainingCourtLevel: activePlan.trainingCourtLevel,
                horizon: activePlan.horizon,
              }
            : null,
          sublevelBounds,
        };
      }
    }
  }

  return (
    <main className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold mb-1">Training lab</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Project skill development for a tracked player or a hypothetical build.
      </p>
      <TrainingLab
        players={players}
        selected={selected}
        startWeekOfSeason={startWeekOfSeason}
        templates={PLAN_TEMPLATES}
        archetypes={archetypes}
        readOnly={role !== 'owner'}
      />
    </main>
  );
}
