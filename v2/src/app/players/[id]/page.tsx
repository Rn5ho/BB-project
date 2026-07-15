import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db, seasons } from '@/db';
import { getPlayerDetail } from '@/queries/player-detail';
import { getPotentialColor, POTENTIAL_LEVELS } from '@/lib/constants';
import { skillSeries, dmiSeries, salarySeries, positionTimeline, currentProfile } from '@/lib/series';
import { getEffectiveArchetypes } from '@/queries/archetypes';
import { getActivePlan, getPlayerWeeklyMinutes } from '@/queries/minutes';
import { applyAnchors, boundsFromAnchors, playerStateFromSnapshot } from '@/lib/training/bridge';
import { getPopAnchors, type PopAnchorRow } from '@/queries/training';
import type { PopAnchor } from '@/lib/training/sublevels';
import { SKILL_KEYS, type SkillKey } from '@/lib/training/types';
import { PLAN_TEMPLATES } from '@/lib/training/templates';
import { seasonWeekOf } from '@/server/sync/minutes';
import SkillProgression from '@/components/player/SkillProgression';
import SnapshotHistory from '@/components/player/SnapshotHistory';
import PositionTimeline from '@/components/player/PositionTimeline';
import MetricChart from '@/components/player/MetricChart';
import NotesSection from '@/components/player/NotesSection';
import TagsSection from '@/components/player/TagsSection';
import ProfileCard from '@/components/player/ProfileCard';
import ArchetypeMatches from '@/components/player/ArchetypeMatches';
import DevelopmentSection from '@/components/player/DevelopmentSection';
import MinutesStrip from '@/components/player/MinutesStrip';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPlayerDetail(Number(id));
  if (!detail) notFound();
  const { player, snaps, notes, tags } = detail;

  const archetypes = await getEffectiveArchetypes();
  const profile = currentProfile(snaps);
  const evalPlayer = {
    ageNow: player.ageNow,
    skills: profile.skills,
    potential: profile.potential ?? player.potential,
    heightCm: player.heightCm,
    tsp: profile.tsp,
    bestPosition: player.bestPosition,
  };

  const skills = skillSeries(snaps);
  const skillsForChart = Object.fromEntries(Object.entries(skills).map(([k, pts]) => [k, pts.map((p) => ({ x: p.x.getTime(), y: p.y }))]));
  const dmi = dmiSeries(snaps).map((p) => ({ x: p.x.getTime(), y: p.y }));
  const salary = salarySeries(snaps).map((p) => ({ x: p.x.getTime(), y: p.y }));

  const [weeklyMinutes, activePlan, [seasonRow], popAnchors] = await Promise.all([
    getPlayerWeeklyMinutes(player.bbPlayerId),
    getActivePlan(player.bbPlayerId),
    db.select().from(seasons).where(eq(seasons.id, detail.seasonNow)),
    getPopAnchors(player.bbPlayerId),
  ]);
  const startWeekOfSeason = seasonRow ? Math.min(14, Math.max(1, seasonWeekOf(new Date(), seasonRow.start))) : 1;
  const fullSkills = profile.skills && Object.values(profile.skills).filter((v) => v != null).length >= 10;
  const playerState = profile.skills && fullSkills && player.ageNow != null && player.heightCm != null
    ? playerStateFromSnapshot({
        skills: profile.skills, age: player.ageNow, heightCm: player.heightCm,
        potential: profile.potential ?? player.potential ?? 0,
        stamina: profile.skills.stamina, freeThrow: profile.skills.free_throw,
      })
    : null;

  const asOf = new Date();
  const anchors: PopAnchor[] = popAnchors
    .filter((a): a is PopAnchorRow & { skill: SkillKey } => (SKILL_KEYS as readonly string[]).includes(a.skill))
    .map((a) => ({ skill: a.skill, toDisplayed: a.toDisplayed, windowStart: a.windowStart, windowEnd: a.windowEnd }));
  const sublevelBounds = playerState && profile.skills ? boundsFromAnchors(profile.skills, anchors, asOf) : {};
  const anchoredState = playerState ? applyAnchors(playerState, sublevelBounds) : null;

  return (
    <main className="p-6 max-w-5xl">
      <div className="flex items-baseline gap-3 mb-1">
        <h1 className="text-xl font-semibold">{player.name}</h1>
        <a href={`https://buzzerbeater.com/player/${player.bbPlayerId}/overview.aspx`} target="_blank" className="text-sm text-neutral-400 hover:text-amber-500">↗ BB</a>
      </div>
      <div className="text-sm text-neutral-400 mb-6 flex flex-wrap gap-x-4 gap-y-1">
        <span>{player.nationality ?? '–'}</span>
        <span>Age {player.ageNow ?? '–'}</span>
        <span>{player.heightCm ? `${player.heightCm} cm` : '–'}</span>
        <span>{player.bestPosition ?? '–'}</span>
        {player.potential != null && <span style={{ color: getPotentialColor(player.potential) }} title={POTENTIAL_LEVELS[player.potential]}>Pot {player.potential}</span>}
        {player.ownerTeamId && <a href={`https://buzzerbeater.com/team/${player.ownerTeamId}/overview.aspx`} target="_blank" className="hover:text-amber-500">{player.ownerTeamName ?? 'owner'} ↗</a>}
      </div>

      <TagsSection playerId={player.bbPlayerId} tags={tags} />

      <section className="mt-6">
        <ProfileCard profile={profile} heightCm={player.heightCm} bestPosition={player.bestPosition} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Weekly minutes by position</h2>
        <MinutesStrip weeks={weeklyMinutes} age={player.ageNow} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Development</h2>
        {anchoredState ? (
          <DevelopmentSection
            playerId={player.bbPlayerId}
            playerState={anchoredState}
            startWeekOfSeason={startWeekOfSeason}
            weeks={weeklyMinutes}
            age={player.ageNow}
            initialPlan={activePlan}
            templates={PLAN_TEMPLATES}
            skillsDb={profile.skills ?? {}}
            potential={profile.potential ?? player.potential}
            sublevelBounds={sublevelBounds}
          />
        ) : (
          <p className="text-sm text-neutral-500">Needs a full-skill snapshot (census or API) to project development.</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Archetypes</h2>
        <ArchetypeMatches player={evalPlayer} archetypes={archetypes} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Skill progression</h2>
        <SkillProgression series={skillsForChart} />
      </section>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <section>
          <h2 className="font-medium mb-2">DMI trajectory</h2>
          <MetricChart points={dmi} color="#e5a64b" unit="k" />
        </section>
        <section>
          <h2 className="font-medium mb-2">Salary</h2>
          <MetricChart points={salary} color="#0eae28" unit="k" />
        </section>
      </div>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Position over time</h2>
        <PositionTimeline segments={positionTimeline(snaps)} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Snapshot history</h2>
        <p className="text-xs text-neutral-500 mb-2">Every capture, newest first. Superscripts show change vs the previous full-skill capture.</p>
        <SnapshotHistory snaps={snaps} />
      </section>

      <section className="mt-6">
        <h2 className="font-medium mb-2">Notes</h2>
        <NotesSection playerId={player.bbPlayerId} notes={notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))} />
      </section>
    </main>
  );
}
