'use server';

import { revalidatePath } from 'next/cache';
import { db, trackedCountries } from '@/db';
import { eq } from 'drizzle-orm';
import { runPlayersSync } from '@/server/sync/players';
import { runSeasonsSync } from '@/server/sync/seasons';
import { runMarketSweep } from '@/server/sync/market';
import { runMinutesSync } from '@/server/sync/minutes';

export async function addTrackedCountry(countryId: number, name: string) {
  await db.insert(trackedCountries).values({ countryId, name }).onConflictDoNothing();
  revalidatePath('/settings');
}

export async function removeTrackedCountry(id: number) {
  await db.delete(trackedCountries).where(eq(trackedCountries.id, id));
  revalidatePath('/settings');
}

export async function toggleStar(id: number, starred: boolean) {
  await db.update(trackedCountries).set({ starred }).where(eq(trackedCountries.id, id));
  revalidatePath('/settings');
}

export async function syncNow(job: 'players' | 'seasons' | 'market' | 'minutes') {
  try {
    const counts =
      job === 'players' ? await runPlayersSync()
      : job === 'market' ? await runMarketSweep()
      : job === 'minutes' ? await runMinutesSync({}, 'manual')
      : await runSeasonsSync();
    revalidatePath('/settings');
    return { ok: true as const, counts };
  } catch (e) {
    revalidatePath('/settings');
    return { ok: false as const, error: String(e) };
  }
}
