import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'bbscout_session';

function secret(): Uint8Array {
  const s = process.env.APP_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('APP_SESSION_SECRET missing or too short');
  return new TextEncoder().encode(s);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const key = secret(); // throws loudly on misconfiguration
  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

/** Constant-time-ish compare without node:crypto (single-user hobby app). */
export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? '';
  if (!expected) throw new Error('APP_PASSWORD is not set');
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
