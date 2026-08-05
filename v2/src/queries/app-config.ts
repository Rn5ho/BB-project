import { db, appConfig } from '@/db';
import { eq } from 'drizzle-orm';

const GUEST_KEY = 'guest_password';

/** The shareable read-only community password, or null if guest login is disabled.
 *  Stored plainly on purpose: the owner re-shares it from /settings, and it guards a
 *  strictly read-only role — anyone with DB access already sees more than a guest. */
export async function getGuestPassword(): Promise<string | null> {
  const [row] = await db.select().from(appConfig).where(eq(appConfig.key, GUEST_KEY));
  return row?.value || null;
}

export async function setGuestPassword(value: string | null): Promise<void> {
  await db
    .insert(appConfig)
    .values({ key: GUEST_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appConfig.key, set: { value, updatedAt: new Date() } });
}
