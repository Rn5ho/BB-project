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
