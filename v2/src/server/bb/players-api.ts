// BB Players JSON API — unauthenticated, backbone of discovery (spec §3.1).
// Gotcha: `height` is in INCHES (spec warning); results cap at 1000 per query.

export interface BbApiPlayer {
  playerId: number;
  firstName: string;
  lastName: string;
  teamId: number | null;
  teamName: string | null;
  countryId: number;
  isUtopian: boolean;
  position: number;
  age: number;
  potential: number;
  salary: number;
  height: number; // inches!
  isForSale: boolean;
  seasonDrafted?: number;
  gs: number;
  dmi: number;
  isInjured: boolean;
  injuredWeeks: number;
}

export const POSITION_NAMES: Record<number, string> = { 1: 'PG', 2: 'SG', 3: 'SF', 4: 'PF', 5: 'C' };

const BASE = 'https://api.buzzerbeater.com/BBAPI/api/Players';

export function splitAgeWindows(minAge: number, maxAge: number, split = false): [number, number][] {
  if (!split) return [[minAge, maxAge]];
  const windows: [number, number][] = [];
  for (let a = minAge; a <= maxAge; a++) windows.push([a, a]);
  return windows;
}

/** Fetch all players of a country in an age range; splits into single-age
 *  queries if the API reports >1000 rows for the combined window. */
export async function fetchCountryPlayers(countryId: number, minAge: number, maxAge: number): Promise<BbApiPlayer[]> {
  const byId = new Map<number, BbApiPlayer>();
  let windows = splitAgeWindows(minAge, maxAge);
  for (let i = 0; i < windows.length; i++) {
    const [lo, hi] = windows[i];
    const res = await fetch(`${BASE}?countryId=${countryId}&minAge=${lo}&maxAge=${hi}`);
    if (!res.ok) throw new Error(`Players API ${countryId} ages ${lo}-${hi}: HTTP ${res.status}`);
    // response bytes are UTF-8 but may be served with a wrong charset header — decode explicitly
    const data = JSON.parse(Buffer.from(await res.arrayBuffer()).toString('utf8')) as
      { isMoreThan1000: boolean; players: BbApiPlayer[] };
    if (data.isMoreThan1000) {
      if (lo === hi) throw new Error(`Players API ${countryId} age ${lo}: >1000 rows even single-age — cannot sync completely`);
      windows = splitAgeWindows(minAge, maxAge, true);
      byId.clear();
      i = -1; // restart with split windows
      continue;
    }
    for (const p of data.players) byId.set(p.playerId, p);
  }
  return [...byId.values()];
}

/** → players-table upsert shape. `catalogName` is the BB country name for NEW rows' nationality. */
export function mapApiPlayerToPlayer(p: BbApiPlayer, catalogName: string) {
  return {
    bbPlayerId: p.playerId,
    name: `${p.firstName} ${p.lastName}`.trim(),
    firstName: p.firstName,
    lastName: p.lastName,
    countryId: p.countryId,
    nationality: catalogName,
    heightCm: p.height ? Math.round(p.height * 2.54) : null,
    bestPosition: POSITION_NAMES[p.position] ?? null,
    isUtopian: p.isUtopian,
    seasonDrafted: p.seasonDrafted ?? null,
    ownerTeamId: p.teamId ?? null,
    ownerTeamName: p.teamName ?? null,
  };
}

/** → light snapshot insert shape (no skill columns). */
export function mapApiPlayerToSnapshot(p: BbApiPlayer, season: number) {
  return {
    playerId: p.playerId,
    source: 'api' as const,
    season,
    age: p.age,
    dmi: p.dmi,
    gameShape: p.gs,
    salary: p.salary,
    potential: p.potential,
    ownerTeamId: p.teamId ?? null,
    ownerTeamName: p.teamName ?? null,
  };
}
