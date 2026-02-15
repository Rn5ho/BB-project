// BuzzerBeater API client library
// Docs: https://bbapi.buzzerbeater.com/docs/
// Auth: cookie-based (GET login.aspx → Set-Cookie → use cookie on all requests)

import { XMLParser } from 'fast-xml-parser';

const BBAPI_BASE = 'https://bbapi.buzzerbeater.com';

// --- Types ---

export interface BbApiPlayer {
  id: number;
  firstName: string;
  lastName: string;
  nationalityId: number;
  nationalityName: string;
  age: number;
  height: number; // in cm
  dmi: number;
  salary: number;
  bestPosition: string;
  gameShape: number;
  potential: number;
  experience: number;
  skills: {
    jumpShot: number;
    range: number;
    outsideDef: number;
    handling: number;
    driving: number;
    passing: number;
    insideShot: number;
    insideDef: number;
    rebound: number;
    block: number;
    stamina: number;
    freeThrow: number;
  };
  teamId?: number;
  teamName?: string;
}

export interface BbApiCountry {
  id: number;
  name: string;
}

export interface BbApiLeague {
  id: number;
  name: string;
}

export interface BbApiTeamStanding {
  teamId: number;
  teamName: string;
}

// BB API uses text labels for potential, we need to map to our 0-11 integers
const POTENTIAL_TEXT_TO_NUMBER: Record<string, number> = {
  'announcer': 0,
  'bench warmer': 1,
  'role player': 2,
  '6th man': 3,
  'starter': 4,
  'star': 5,
  'allstar': 6,
  'perennial allstar': 7,
  'superstar': 8,
  'mvp': 9,
  'hall of famer': 10,
  'all-time great': 11,
};

// BB API uses text labels for skills too
const SKILL_TEXT_TO_NUMBER: Record<string, number> = {
  'atrocious': 1,
  'pitiful': 2,
  'awful': 3,
  'inept': 4,
  'mediocre': 5,
  'average': 6,
  'respectable': 7,
  'strong': 8,
  'proficient': 9,
  'prominent': 10,
  'prolific': 11,
  'sensational': 12,
  'tremendous': 13,
  'wondrous': 14,
  'marvelous': 15,
  'prodigious': 16,
  'stupendous': 17,
  'phenomenal': 18,
  'colossal': 19,
  'legendary': 20,
};

function parseSkillValue(val: string | number): number {
  if (typeof val === 'number') return val;
  const text = val.toLowerCase().trim();
  return SKILL_TEXT_TO_NUMBER[text] ?? 0;
}

function parsePotentialValue(val: string | number): number {
  if (typeof val === 'number') return val;
  const text = val.toLowerCase().trim();
  return POTENTIAL_TEXT_TO_NUMBER[text] ?? 0;
}

// --- XML Parser ---

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
});

// --- Auth ---

export async function bbApiLogin(username: string, securityCode: string): Promise<string> {
  const url = `${BBAPI_BASE}/login.aspx?login=${encodeURIComponent(username)}&code=${encodeURIComponent(securityCode)}`;
  const res = await fetch(url, { redirect: 'manual' });

  // Extract Set-Cookie header
  const cookies = res.headers.getSetCookie?.() ?? [];
  const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');

  // Check for errors in response body
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);

  if (parsed?.bbapi?.error) {
    const errType = parsed.bbapi.error['@_type'] || 'Unknown';
    const errMsg = parsed.bbapi.error['@_message'] || '';
    throw new Error(`BB API login failed: ${errType} - ${errMsg}`);
  }

  if (!cookieStr) {
    throw new Error('BB API login: no cookie received');
  }

  return cookieStr;
}

export async function bbApiLogout(cookie: string): Promise<void> {
  await fetch(`${BBAPI_BASE}/logout.aspx`, {
    headers: { Cookie: cookie },
  });
}

// --- Raw Fetch ---

async function bbApiFetch(endpoint: string, params: Record<string, string | number>, cookie: string): Promise<string> {
  const searchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    searchParams.set(key, String(val));
  }
  const url = `${BBAPI_BASE}/${endpoint}?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: { Cookie: cookie },
  });
  const xml = await res.text();

  // Check for API errors
  const parsed = xmlParser.parse(xml);
  if (parsed?.bbapi?.error) {
    const errType = parsed.bbapi.error['@_type'] || 'Unknown';
    const errMsg = parsed.bbapi.error['@_message'] || '';
    throw new Error(`BB API error (${endpoint}): ${errType} - ${errMsg}`);
  }

  return xml;
}

// --- Parsers ---

function extractPlayerFromXml(playerNode: Record<string, unknown>, teamId?: number, teamName?: string): BbApiPlayer {
  const skills = playerNode.skills as Record<string, unknown> || {};
  const nationality = playerNode.nationality as Record<string, unknown> || {};

  return {
    id: (playerNode['@_id'] as number) || (playerNode.id as number) || 0,
    firstName: String(playerNode.firstName || ''),
    lastName: String(playerNode.lastName || ''),
    nationalityId: (nationality['@_id'] as number) || 0,
    nationalityName: String(nationality['#text'] || nationality || ''),
    age: Number(playerNode.age) || 0,
    height: Number(playerNode.height) || 0,
    dmi: Number(playerNode.dmi) || 0,
    salary: Number(playerNode.salary) || 0,
    bestPosition: String(playerNode.bestPosition || ''),
    gameShape: parseSkillValue(skills.gameShape as string | number || 0),
    potential: parsePotentialValue(skills.potential as string | number || 0),
    experience: parseSkillValue(skills.experience as string | number || 0),
    skills: {
      jumpShot: parseSkillValue(skills.jumpShot as string | number || 0),
      range: parseSkillValue(skills.range as string | number || 0),
      outsideDef: parseSkillValue(skills.outsideDef as string | number || 0),
      handling: parseSkillValue(skills.handling as string | number || 0),
      driving: parseSkillValue(skills.driving as string | number || 0),
      passing: parseSkillValue(skills.passing as string | number || 0),
      insideShot: parseSkillValue(skills.insideShot as string | number || 0),
      insideDef: parseSkillValue(skills.insideDef as string | number || 0),
      rebound: parseSkillValue(skills.rebound as string | number || 0),
      block: parseSkillValue(skills.block as string | number || 0),
      stamina: parseSkillValue(skills.stamina as string | number || 0),
      freeThrow: parseSkillValue(skills.freeThrow as string | number || 0),
    },
    teamId,
    teamName,
  };
}

export function parseRosterXml(xml: string): BbApiPlayer[] {
  const parsed = xmlParser.parse(xml);
  const roster = parsed?.bbapi?.roster;
  if (!roster) return [];

  const teamId = roster['@_teamid'] as number | undefined;
  const teamName = roster['@_teamname'] as string | undefined;

  let players = roster.player;
  if (!players) return [];
  if (!Array.isArray(players)) players = [players];

  return players.map((p: Record<string, unknown>) =>
    extractPlayerFromXml(p, teamId, teamName ? String(teamName) : undefined)
  );
}

export function parsePlayerXml(xml: string): BbApiPlayer {
  const parsed = xmlParser.parse(xml);
  const player = parsed?.bbapi?.player;
  if (!player) throw new Error('No player data in API response');

  const owner = player.owner as Record<string, unknown> | undefined;
  const teamId = owner?.['@_teamid'] as number | undefined;
  const teamName = owner?.['#text'] as string | undefined;

  return extractPlayerFromXml(player, teamId, teamName);
}

export function parseCountriesXml(xml: string): BbApiCountry[] {
  const parsed = xmlParser.parse(xml);
  let countries = parsed?.bbapi?.countries?.country;
  if (!countries) return [];
  if (!Array.isArray(countries)) countries = [countries];

  return countries.map((c: Record<string, unknown>) => ({
    id: (c['@_id'] as number) || 0,
    name: String(c['#text'] || c.name || ''),
  }));
}

export function parseLeaguesXml(xml: string): BbApiLeague[] {
  const parsed = xmlParser.parse(xml);
  let leagues = parsed?.bbapi?.leagues?.league;
  if (!leagues) return [];
  if (!Array.isArray(leagues)) leagues = [leagues];

  return leagues.map((l: Record<string, unknown>) => ({
    id: (l['@_id'] as number) || 0,
    name: String(l['#text'] || l.name || ''),
  }));
}

export function parseStandingsXml(xml: string): BbApiTeamStanding[] {
  const parsed = xmlParser.parse(xml);
  let teams = parsed?.bbapi?.standings?.team;
  if (!teams) return [];
  if (!Array.isArray(teams)) teams = [teams];

  return teams.map((t: Record<string, unknown>) => ({
    teamId: (t['@_id'] as number) || 0,
    teamName: String(t.teamName || ''),
  }));
}

// --- High-level API calls ---

export async function fetchPlayer(playerId: number, cookie: string): Promise<BbApiPlayer> {
  const xml = await bbApiFetch('player.aspx', { playerid: playerId }, cookie);
  return parsePlayerXml(xml);
}

export async function fetchRoster(teamId: number, cookie: string): Promise<BbApiPlayer[]> {
  const xml = await bbApiFetch('roster.aspx', { teamid: teamId }, cookie);
  return parseRosterXml(xml);
}

export async function fetchCountries(cookie: string): Promise<BbApiCountry[]> {
  const xml = await bbApiFetch('countries.aspx', {}, cookie);
  return parseCountriesXml(xml);
}

export async function fetchLeagues(countryId: number, level: number, cookie: string): Promise<BbApiLeague[]> {
  const xml = await bbApiFetch('leagues.aspx', { countryid: countryId, level }, cookie);
  return parseLeaguesXml(xml);
}

export async function fetchStandings(leagueId: number, cookie: string): Promise<BbApiTeamStanding[]> {
  const xml = await bbApiFetch('standings.aspx', { leagueid: leagueId }, cookie);
  return parseStandingsXml(xml);
}

// --- DB Mapping ---

export function mapBbApiPlayerToDb(apiPlayer: BbApiPlayer) {
  const playerData = {
    bb_player_id: apiPlayer.id,
    name: `${apiPlayer.firstName} ${apiPlayer.lastName}`.trim(),
    nationality: apiPlayer.nationalityName || null,
    height: apiPlayer.height ? `${apiPlayer.height} cm` : null,
    position: apiPlayer.bestPosition || null,
  };

  const skillPoints =
    apiPlayer.skills.jumpShot + apiPlayer.skills.range +
    apiPlayer.skills.outsideDef + apiPlayer.skills.handling +
    apiPlayer.skills.driving + apiPlayer.skills.passing +
    apiPlayer.skills.insideShot + apiPlayer.skills.insideDef +
    apiPlayer.skills.rebound + apiPlayer.skills.block +
    apiPlayer.skills.stamina + apiPlayer.skills.freeThrow;

  const snapshotData = {
    source: 'api' as const,
    captured_by: null,
    age: apiPlayer.age || null,
    salary: apiPlayer.salary || null,
    experience: apiPlayer.experience || null,
    skill_points: skillPoints || null,
    game_shape: apiPlayer.gameShape || null,
    potential: apiPlayer.potential,
    dmi: apiPlayer.dmi || null,
    jump_shot: apiPlayer.skills.jumpShot || null,
    jump_range: apiPlayer.skills.range || null,
    outside_def: apiPlayer.skills.outsideDef || null,
    handling: apiPlayer.skills.handling || null,
    driving: apiPlayer.skills.driving || null,
    passing: apiPlayer.skills.passing || null,
    inside_shot: apiPlayer.skills.insideShot || null,
    inside_def: apiPlayer.skills.insideDef || null,
    rebounding: apiPlayer.skills.rebound || null,
    shot_blocking: apiPlayer.skills.block || null,
    stamina: apiPlayer.skills.stamina || null,
    free_throw: apiPlayer.skills.freeThrow || null,
    owner_team_name: apiPlayer.teamName || null,
    owner_team_id: apiPlayer.teamId || null,
  };

  return { playerData, snapshotData };
}
