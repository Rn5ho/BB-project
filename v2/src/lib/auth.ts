import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'bbscout_session';

export type Role = 'owner' | 'guest';

export type Session = { role: Role; sessionId: string | null };

function secret(): Uint8Array {
  const s = process.env.APP_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('APP_SESSION_SECRET missing or too short');
  return new TextEncoder().encode(s);
}

/** Guest sessions are short-lived: rotating GUEST_PASSWORD only stops NEW logins,
 *  so a 7-day expiry bounds how long an already-issued guest token survives it. */
const EXPIRY: Record<Role, string> = { owner: '30d', guest: '7d' };

export async function createSessionToken(role: Role = 'owner'): Promise<string> {
  const jwt = new SignJWT({ sub: 'owner', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY[role]);
  // Guest tokens carry a random id so anonymous usage can be counted per login without
  // identifying anyone. Owner tokens don't — owner traffic is deliberately not tracked.
  if (role === 'guest') jwt.setJti(crypto.randomUUID());
  return jwt.sign(secret());
}

/** Returns the session role + anonymous id, or null if the token is invalid/expired.
 *  Back-compat: owner tokens issued before roles existed carry sub:'owner' and no
 *  role claim — they verify as 'owner'. Tokens issued before session ids existed
 *  simply have no jti, and report sessionId: null. */
export async function verifySession(token: string): Promise<Session | null> {
  const key = secret(); // throws loudly on misconfiguration
  try {
    const { payload } = await jwtVerify(token, key);
    const sessionId = typeof payload.jti === 'string' ? payload.jti : null;
    const role = payload.role;
    if (role === 'owner' || role === 'guest') return { role, sessionId };
    return payload.sub === 'owner' ? { role: 'owner', sessionId } : null;
  } catch {
    return null;
  }
}

/** Role-only view of verifySession, for the many call sites that don't care about the id. */
export async function verifySessionToken(token: string): Promise<Role | null> {
  return (await verifySession(token))?.role ?? null;
}

/** Constant-time-ish compare without node:crypto (single-user hobby app). */
function matches(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Which role does this password grant? Owner (env APP_PASSWORD) checked first, so a
 *  DB outage can never lock the owner out; guest only when `guestPassword` (from the
 *  app_config table, managed on /settings) is present and non-empty. */
export function resolvePassword(input: string, guestPassword: string | null = null): Role | null {
  const owner = process.env.APP_PASSWORD ?? '';
  if (!owner) throw new Error('APP_PASSWORD is not set');
  if (matches(input, owner)) return 'owner';
  if (guestPassword && matches(input, guestPassword)) return 'guest';
  return null;
}
