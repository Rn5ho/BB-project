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
