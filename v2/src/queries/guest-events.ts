import { db, guestEvents } from '@/db';
import { gte, desc } from 'drizzle-orm';

export type GuestEventInput = {
  sessionId: string;
  event: 'login' | 'pageview';
  path: string | null;
};

export type GuestEventRow = {
  occurredAt: Date;
  sessionId: string;
  event: string;
  path: string | null;
};

/** Append one anonymous guest event. Callers treat this as best-effort — see the
 *  proxy and login action, which never let a logging failure affect the user. */
export async function recordGuestEvent(input: GuestEventInput): Promise<void> {
  await db.insert(guestEvents).values({
    sessionId: input.sessionId,
    event: input.event,
    path: input.path,
  });
}

/** Raw events since `since`, newest first. Aggregation lives in
 *  src/lib/guest-activity.ts so it can be unit-tested without a database. */
export async function fetchGuestEvents(since: Date): Promise<GuestEventRow[]> {
  return db
    .select({
      occurredAt: guestEvents.occurredAt,
      sessionId: guestEvents.sessionId,
      event: guestEvents.event,
      path: guestEvents.path,
    })
    .from(guestEvents)
    .where(gte(guestEvents.occurredAt, since))
    .orderBy(desc(guestEvents.occurredAt));
}
