const BASE = 'https://bbapi.buzzerbeater.com';

export async function fetchSeasons(): Promise<{ id: number; start: Date; finish: Date }[]> {
  const login = await fetch(
    `${BASE}/login.aspx?login=${encodeURIComponent(process.env.BB_API_USERNAME!)}&code=${encodeURIComponent(process.env.BB_API_SECURITY_CODE!)}`,
    { redirect: 'manual' },
  );
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('BB API login failed (no cookie)');
  const xml = await (await fetch(`${BASE}/seasons.aspx`, { headers: { Cookie: cookie } })).text();
  await fetch(`${BASE}/logout.aspx`, { headers: { Cookie: cookie } });

  const seasons = [...xml.matchAll(
    /<season id='(\d+)'>\s*<start>([^<]+)<\/start>\s*<finish>([^<]+)<\/finish>/g,
  )].map((m) => ({ id: Number(m[1]), start: new Date(m[2]), finish: new Date(m[3]) }));
  if (seasons.length === 0) throw new Error(`No seasons parsed. XML head: ${xml.slice(0, 300)}`);
  return seasons;
}
