const PAGE = 1000;

/** Read an entire Supabase table via PostgREST, 1000 rows/page. */
export async function readTable<T>(table: string, orderBy = 'id'): Promise<T[]> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=*&order=${orderBy}.asc&limit=${PAGE}&offset=${offset}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`Supabase read ${table} failed: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as T[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}
