import { db, seasons, syncLog } from '@/db';
import { fetchSeasons } from '@/server/bb/xml-api';
import { sql } from 'drizzle-orm';

export async function runSeasonsSync(trigger: 'cron' | 'manual' = 'manual'): Promise<{ seasons: number }> {
  const [logRow] = await db.insert(syncLog).values({ jobType: 'seasons', trigger }).returning({ id: syncLog.id });
  try {
    const rows = await fetchSeasons();
    await db.insert(seasons).values(rows)
      .onConflictDoUpdate({ target: seasons.id, set: { start: sql`excluded.start`, finish: sql`excluded.finish` } });
    const counts = { seasons: rows.length };
    await db.update(syncLog).set({ finishedAt: new Date(), ok: true, counts }).where(sql`id = ${logRow.id}`);
    return counts;
  } catch (e) {
    await db.update(syncLog).set({ finishedAt: new Date(), ok: false, error: String(e) }).where(sql`id = ${logRow.id}`);
    throw e;
  }
}
