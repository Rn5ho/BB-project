'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { resolvePassword, createSessionToken, verifySession, SESSION_COOKIE } from '@/lib/auth';
import { getGuestPassword } from '@/queries/app-config';
import { recordGuestEvent } from '@/queries/guest-events';

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get('password') ?? '');
  // Guest password lives in the DB (managed on /settings); env GUEST_PASSWORD is a
  // fallback for local setups. A DB outage only disables GUEST login, never the owner.
  let guestPw: string | null = null;
  try {
    guestPw = await getGuestPassword();
  } catch {
    guestPw = null;
  }
  const role = resolvePassword(password, guestPw ?? process.env.GUEST_PASSWORD ?? null);
  if (!role) return { error: 'Wrong password' }; // never reveals which tier failed
  let token: string;
  try {
    token = await createSessionToken(role);
  } catch {
    return { error: 'Server misconfiguration — check APP_SESSION_SECRET' };
  }
  if (role === 'guest') {
    // Read the id back off the freshly minted token so the login row shares the session id
    // its page views will carry. Pure local JWT verification — no network call — so it's
    // cheap to do inline; only the DB write is deferred below.
    const session = await verifySession(token);
    const sessionId = session?.sessionId ?? 'unknown';
    // Scheduled via after() to run once the response has been sent: the neon-http client has
    // no default timeout and this project's Neon compute scales to zero, so an inline await
    // here could stall a cold-starting guest login indefinitely. after() runs even when
    // redirect() is called (per Next 16 docs), and the swallowed rejection means a DB hiccup
    // can never break a guest's login either — it can neither fail nor delay it. Mirrors the
    // proxy's identical pageview write, which is kept off the response path via waitUntil.
    after(() => recordGuestEvent({ sessionId, event: 'login', path: null }).catch(() => {}));
  }
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * (role === 'guest' ? 7 : 30),
    path: '/',
  });
  redirect('/slovenia');
}
