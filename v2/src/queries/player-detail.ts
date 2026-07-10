import { db, players, snapshots, notes, tags } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getCurrentSeasonId } from '@/queries/players';
import { currentAge } from '@/lib/domain';
import type { Snap, SkillKey } from '@/lib/series';
import { SKILLS } from '@/lib/constants';

export interface PlayerDetail {
  player: {
    bbPlayerId: number; name: string; nationality: string | null; countryId: number | null;
    heightCm: number | null; bestPosition: string | null; potential: number | null;
    ownerTeamId: number | null; ownerTeamName: string | null; isUtopian: boolean; seasonDrafted: number | null;
    ageNow: number | null;
  };
  seasonNow: number;
  snaps: Snap[];       // oldest→newest
  notes: { id: number; body: string; createdAt: Date }[];
  tags: string[];
}

export async function getPlayerDetail(bbPlayerId: number): Promise<PlayerDetail | null> {
  const [p] = await db.select().from(players).where(eq(players.bbPlayerId, bbPlayerId));
  if (!p) return null;
  const seasonNow = await getCurrentSeasonId();
  const rawSnaps = await db.select().from(snapshots).where(eq(snapshots.playerId, bbPlayerId)).orderBy(snapshots.capturedAt);
  const noteRows = await db.select().from(notes).where(eq(notes.playerId, bbPlayerId)).orderBy(desc(notes.createdAt));
  const tagRows = await db.select().from(tags).where(eq(tags.playerId, bbPlayerId));

  const snapsData: Snap[] = rawSnaps.map((s) => {
    const skills = {} as Record<SkillKey, number | null>;
    const col: Record<SkillKey, number | null> = {
      jump_shot: s.jumpShot, jump_range: s.jumpRange, outside_def: s.outsideDef, handling: s.handling,
      driving: s.driving, passing: s.passing, inside_shot: s.insideShot, inside_def: s.insideDef,
      rebounding: s.rebounding, shot_blocking: s.shotBlocking, stamina: s.stamina, free_throw: s.freeThrow,
    };
    for (const { dbKey } of SKILLS) skills[dbKey] = col[dbKey];
    return {
      capturedAt: s.capturedAt, source: s.source, season: s.season, age: s.age,
      dmi: s.dmi == null ? null : Number(s.dmi), gameShape: s.gameShape, salary: s.salary,
      potential: s.potential, experience: s.experience ?? null, tsp: s.tsp, bestPosition: p.bestPosition, skills,
    };
  });

  // latest snapshot values drive header age/potential
  const latest = rawSnaps[rawSnaps.length - 1];
  return {
    player: {
      bbPlayerId: p.bbPlayerId, name: p.name, nationality: p.nationality, countryId: p.countryId,
      heightCm: p.heightCm, bestPosition: p.bestPosition, potential: latest?.potential ?? null,
      ownerTeamId: p.ownerTeamId, ownerTeamName: p.ownerTeamName, isUtopian: p.isUtopian, seasonDrafted: p.seasonDrafted,
      ageNow: currentAge(latest?.age ?? null, latest?.season ?? null, seasonNow),
    },
    seasonNow,
    snaps: snapsData,
    notes: noteRows.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt })),
    tags: tagRows.map((t) => t.tag),
  };
}
