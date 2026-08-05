import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'bbscout_session';

export type Role = 'owner' | 'guest';

function secret(): Uint8Array {
  const s = process.env.APP_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('APP_SESSION_SECRET missing or too short');
  return new TextEncoder().encode(s);
}

/** Guest sessions are short-lived: rotating GUEST_PASSWORD only stops NEW logins,
 *  so a 7-day expiry bounds how long an already-issued guest token survives it. */
const EXPIRY: Record<Role, string> = { owner: '30d', guest: '7d' };

export async function createSessionToken(role: Role = 'owner'): Promise<string> {
  return new SignJWT({ sub: 'owner', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY[role])
    .sign(secret());
}

/** Returns the session role, or null if the token is invalid/expired.
 *  Back-compat: owner tokens issued before roles existed carry sub:'owner' and no
 *  role claim — they verify as 'owner'. Return truthiness matches the old boolean. */
export async function verifySessionToken(token: string): Promise<Role | null> {
  const key = secret(); // throws loudly on misconfiguration
  try {
    const { payload } = await jwtVerify(token, key);
    const role = payload.role;
    if (role === 'owner' || role === 'guest') return role;
    return payload.sub === 'owner' ? 'owner' : null;
  } catch {
    return null;
  }
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
