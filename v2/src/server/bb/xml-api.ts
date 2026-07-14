// BB XML API (bbapi.buzzerbeater.com) — cookie login. Cannot read NT rosters (spec §3.2).
// Gotcha: the current season has <inProgress/> and NO <finish> element.

const BASE = 'https://bbapi.buzzerbeater.com';

export interface BbSeason { id: number; start: Date; finish: Date | null }
export interface BbCountry { id: number; name: string }

export function parseSeasonsXml(xml: string): BbSeason[] {
  const blocks = [...xml.matchAll(/<season id='(\d+)'>([\s\S]*?)<\/season>/g)];
  if (blocks.length === 0) throw new Error(`No seasons parsed. XML head: ${xml.slice(0, 200)}`);
  return blocks.map((b) => {
    const start = b[2].match(/<start>([^<]+)<\/start>/)?.[1];
    if (!start) throw new Error(`Season ${b[1]}: no start date`);
    const finish = b[2].match(/<finish>([^<]+)<\/finish>/)?.[1] ?? null;
    return { id: Number(b[1]), start: new Date(start), finish: finish ? new Date(finish) : null };
  });
}

export function parseCountriesXml(xml: string): BbCountry[] {
  const rows = [...xml.matchAll(/<country id='(\d+)'[^>]*>([^<]+)<\/country>/g)];
  if (rows.length === 0) throw new Error(`No countries parsed. XML head: ${xml.slice(0, 200)}`);
  return rows.map((m) => ({ id: Number(m[1]), name: m[2] }));
}

async function withSession<T>(fn: (cookie: string) => Promise<T>): Promise<T> {
  const login = await fetch(
    `${BASE}/login.aspx?login=${encodeURIComponent(process.env.BB_API_USERNAME!)}&code=${encodeURIComponent(process.env.BB_API_SECURITY_CODE!)}`,
    { redirect: 'manual' },
  );
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('BB XML API login failed (no cookie)');
  try {
    return await fn(cookie);
  } finally {
    await fetch(`${BASE}/logout.aspx`, { headers: { Cookie: cookie } }).catch(() => {});
  }
}

export async function fetchSeasons(): Promise<BbSeason[]> {
  return withSession(async (cookie) => {
    const xml = await (await fetch(`${BASE}/seasons.aspx`, { headers: { Cookie: cookie } })).text();
    return parseSeasonsXml(xml);
  });
}

export async function fetchCountries(): Promise<BbCountry[]> {
  return withSession(async (cookie) => {
    const xml = await (await fetch(`${BASE}/countries.aspx`, { headers: { Cookie: cookie } })).text();
    return parseCountriesXml(xml);
  });
}

export interface BbTeamInfo { teamId: number; name: string | null; ownerAlias: string | null }

/** Parse a single teaminfo.aspx XML response. */
export function parseTeamInfoXml(xml: string, fallbackTeamId?: number): BbTeamInfo {
  const teamIdMatch = xml.match(/<team[^>]*\sid='(\d+)'/);
  const teamId = teamIdMatch ? Number(teamIdMatch[1]) : (fallbackTeamId ?? 0);

  const nameMatch = xml.match(/<teamName>([^<]*)<\/teamName>/);
  const name = nameMatch ? decodeXmlEntities(nameMatch[1].trim()) : null;

  // <owner supporter='1'>Alias here</owner>
  const ownerMatch = xml.match(/<owner[^>]*>([^<]*)<\/owner>/);
  const ownerAlias = ownerMatch ? decodeXmlEntities(ownerMatch[1].trim()) : null;

  return { teamId, name, ownerAlias };
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Fetch team info for multiple team IDs in a single BB API session (~150 ms pacing). */
export async function fetchTeamInfo(teamIds: number[]): Promise<BbTeamInfo[]> {
  if (teamIds.length === 0) return [];
  return withSession(async (cookie) => {
    const results: BbTeamInfo[] = [];
    for (let i = 0; i < teamIds.length; i++) {
      const tid = teamIds[i];
      if (i > 0) await new Promise((r) => setTimeout(r, 150));
      try {
        const xml = await (
          await fetch(`${BASE}/teaminfo.aspx?teamid=${tid}`, { headers: { Cookie: cookie } })
        ).text();
        results.push(parseTeamInfoXml(xml, tid));
      } catch (err) {
        console.warn(`fetchTeamInfo: failed for team ${tid}:`, err);
        results.push({ teamId: tid, name: null, ownerAlias: null });
      }
    }
    return results;
  });
}

export interface BbScheduleMatch {
  matchId: number; homeTeamId: number | null; awayTeamId: number | null;
  type: string; startTime: Date;
}

export function parseScheduleXml(xml: string): BbScheduleMatch[] {
  const err = xml.match(/<error[^>]*message='([^']+)'/) ?? xml.match(/<error[^>]*message="([^"]+)"/);
  if (err) throw new Error(`schedule.aspx error: ${err[1]}`);
  const blocks = [...xml.matchAll(/<match\s([^>]*)>([\s\S]*?)<\/match>/g)];
  const out: BbScheduleMatch[] = [];
  for (const b of blocks) {
    const attrs = b[1]; const body = b[2];
    const id = attrs.match(/id='(\d+)'/)?.[1];
    const type = attrs.match(/type='([^']+)'/)?.[1] ?? 'unknown';
    const start = attrs.match(/start='([^']+)'/)?.[1]
      ?? body.match(/<startTime>([^<]+)<\/startTime>/)?.[1];
    if (!id || !start) continue;
    const home = body.match(/<homeTeam id='(\d+)'/)?.[1];
    const away = body.match(/<awayTeam id='(\d+)'/)?.[1];
    out.push({
      matchId: Number(id), type,
      homeTeamId: home ? Number(home) : null,
      awayTeamId: away ? Number(away) : null,
      startTime: new Date(start),
    });
  }
  if (out.length === 0) throw new Error(`No matches parsed. XML head: ${xml.slice(0, 300)}`);
  return out;
}

export class BoxscoreNotAvailableError extends Error {}

export interface BbBoxscorePlayerMinutes {
  playerId: number; teamId: number;
  minPg: number; minSg: number; minSf: number; minPf: number; minC: number;
  isStarter: boolean | null;
}

export interface BbBoxscore {
  matchId: number; type: string; startTime: Date | null;
  homeTeamId: number | null; awayTeamId: number | null;
  players: BbBoxscorePlayerMinutes[];
}

export function parseBoxscoreXml(xml: string): BbBoxscore {
  const err = xml.match(/<error[^>]*message='([^']+)'/) ?? xml.match(/<error[^>]*message="([^"]+)"/);
  if (err) {
    if (/BoxscoreNotAvailable|UnknownMatchID/i.test(err[1])) throw new BoxscoreNotAvailableError(err[1]);
    throw new Error(`boxscore.aspx error: ${err[1]}`);
  }
  const matchAttr = xml.match(/<match id='(\d+)'[^>]*type='([^']+)'/);
  if (!matchAttr) throw new Error(`No match element. XML head: ${xml.slice(0, 300)}`);
  const startTime = xml.match(/<startTime>([^<]+)<\/startTime>/)?.[1] ?? null;

  const players: BbBoxscorePlayerMinutes[] = [];
  let homeTeamId: number | null = null;
  let awayTeamId: number | null = null;
  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const block = xml.match(new RegExp(`<${side} id='(\\d+)'>([\\s\\S]*?)</${side}>`));
    if (!block) continue;
    const teamId = Number(block[1]);
    if (side === 'homeTeam') homeTeamId = teamId; else awayTeamId = teamId;
    for (const pm of block[2].matchAll(/<player id='(\d+)'>([\s\S]*?)<\/player>/g)) {
      const body = pm[2];
      const min = (pos: string) => Number(body.match(new RegExp(`<${pos}>(\\d+)</${pos}>`))?.[1] ?? 0);
      const starter = body.match(/<isStarter>([^<]+)<\/isStarter>/)?.[1];
      players.push({
        playerId: Number(pm[1]), teamId,
        minPg: min('PG'), minSg: min('SG'), minSf: min('SF'), minPf: min('PF'), minC: min('C'),
        isStarter: starter == null ? null : /true/i.test(starter),
      });
    }
  }
  return {
    matchId: Number(matchAttr[1]), type: matchAttr[2],
    startTime: startTime ? new Date(startTime) : null,
    homeTeamId, awayTeamId, players,
  };
}

export async function fetchSchedule(teamId: number, season?: number): Promise<BbScheduleMatch[]> {
  return withSession(async (cookie) => {
    const url = `${BASE}/schedule.aspx?teamid=${teamId}${season ? `&season=${season}` : ''}`;
    const xml = await (await fetch(url, { headers: { Cookie: cookie } })).text();
    return parseScheduleXml(xml);
  });
}

/** Fetch many boxscores in ONE session, 150 ms pacing. null for unavailable/failed ids. */
export async function fetchBoxscores(
  matchIds: number[],
  onEach?: (b: BbBoxscore | null, id: number) => void,
): Promise<Array<BbBoxscore | null>> {
  if (matchIds.length === 0) return [];
  return withSession(async (cookie) => {
    const results: Array<BbBoxscore | null> = [];
    for (let i = 0; i < matchIds.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 150));
      const id = matchIds[i];
      try {
        const xml = await (
          await fetch(`${BASE}/boxscore.aspx?matchid=${id}`, { headers: { Cookie: cookie } })
        ).text();
        const b = parseBoxscoreXml(xml);
        results.push(b); onEach?.(b, id);
      } catch (err) {
        if (!(err instanceof BoxscoreNotAvailableError)) console.warn(`boxscore ${id} failed:`, err);
        results.push(null); onEach?.(null, id);
      }
    }
    return results;
  });
}

/** Fetch schedules for many clubs in ONE session, 150 ms pacing. null for failed teams. */
export async function fetchSchedules(
  teamIds: number[], season?: number,
): Promise<Array<{ teamId: number; matches: BbScheduleMatch[] | null }>> {
  if (teamIds.length === 0) return [];
  return withSession(async (cookie) => {
    const out: Array<{ teamId: number; matches: BbScheduleMatch[] | null }> = [];
    for (let i = 0; i < teamIds.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 150));
      const tid = teamIds[i];
      try {
        const url = `${BASE}/schedule.aspx?teamid=${tid}${season ? `&season=${season}` : ''}`;
        const xml = await (await fetch(url, { headers: { Cookie: cookie } })).text();
        out.push({ teamId: tid, matches: parseScheduleXml(xml) });
      } catch (err) {
        console.warn(`schedule ${tid} failed:`, err);
        out.push({ teamId: tid, matches: null });
      }
    }
    return out;
  });
}
