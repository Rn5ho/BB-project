import { db, settings } from '@/db';
import { fetchCountries, type BbCountry } from '@/server/bb/xml-api';
import { sql } from 'drizzle-orm';

const KEY = 'bb:countries';
const TTL_MS = 7 * 24 * 3600 * 1000;

interface Cached { fetchedAt: string; countries: BbCountry[] }

/** Country catalog from settings cache; refetched when older than 7 days. */
export async function getCountriesCatalog(): Promise<BbCountry[]> {
  const row = await db.query.settings.findFirst({ where: sql`key = ${KEY}` });
  const cached = row?.value as Cached | undefined;
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) return cached.countries;
  const countries = await fetchCountries();
  const value: Cached = { fetchedAt: new Date().toISOString(), countries };
  await db.insert(settings).values({ key: KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  return countries;
}
