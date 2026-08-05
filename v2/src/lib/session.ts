// Server-only session helpers. getSessionRole feeds UI gating in server components;
// requireOwner is the SECURITY boundary — first line of every owner-only server action
// (UI hiding is cosmetic; this is what actually stops a guest).
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken, type Role } from './auth';

export async function getSessionRole(): Promise<Role | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireOwner(): Promise<void> {
  if ((await getSessionRole()) !== 'owner') throw new Error('owner only');
}
