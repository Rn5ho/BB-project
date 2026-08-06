'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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
    // Read the id back off the freshly minted token so the login row shares the session
    // id its page views will carry. Best-effort: never block a login on logging.
    try {
      const session = await verifySession(token);
      await recordGuestEvent({ sessionId: session?.sessionId ?? 'unknown', event: 'login', path: null });
    } catch {
      // ignored on purpose
    }
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
