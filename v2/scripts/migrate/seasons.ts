const BASE = 'https://bbapi.buzzerbeater.com';

export async function fetchSeasons(): Promise<{ id: number; start: Date; finish: Date | null }[]> {
  const login = await fetch(
    `${BASE}/login.aspx?login=${encodeURIComponent(process.env.BB_API_USERNAME!)}&code=${encodeURIComponent(process.env.BB_API_SECURITY_CODE!)}`,
    { redirect: 'manual' },
  );
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('BB API login failed (no cookie)');
  const xml = await (await fetch(`${BASE}/seasons.aspx`, { headers: { Cookie: cookie } })).text();
  await fetch(`${BASE}/logout.aspx`, { headers: { Cookie: cookie } });

  const blocks = [...xml.matchAll(/<season id='(\d+)'>([\s\S]*?)<\/season>/g)];
  const seasons = blocks.map((b) => {
    const id = Number(b[1]);
    const start = b[2].match(/<start>([^<]+)<\/start>/)?.[1];
    const finish = b[2].match(/<finish>([^<]+)<\/finish>/)?.[1] ?? null;
    if (!start) throw new Error(`Season ${id}: no start date`);
    return { id, start: new Date(start), finish: finish ? new Date(finish) : null };
  });
  if (seasons.length === 0) throw new Error(`No seasons parsed. XML head: ${xml.slice(0, 300)}`);
  return seasons;
}
