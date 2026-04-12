import type { SkillSnapshot } from "@/lib/types";

export function computeCurrentAge(
  snapshot: SkillSnapshot | null,
  currentSeason: number | null
): number | null {
  if (!snapshot?.age) return null;
  if (currentSeason && snapshot.bb_season && currentSeason > snapshot.bb_season) {
    return snapshot.age + (currentSeason - snapshot.bb_season);
  }
  return snapshot.age;
}

export function formatStaleness(
  capturedAt: string,
  currentSeason: number | null,
  snapshotSeason: number | null
): string {
  if (currentSeason && snapshotSeason) {
    const delta = currentSeason - snapshotSeason;
    if (delta === 0) return "this season";
    if (delta === 1) return "1 season ago";
    return `${delta} seasons ago`;
  }
  const days = Math.floor(
    (Date.now() - new Date(capturedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function staleSeasonDelta(
  currentSeason: number | null,
  snapshotSeason: number | null
): number | null {
  if (currentSeason == null || snapshotSeason == null) return null;
  return Math.max(0, currentSeason - snapshotSeason);
}
