import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createSessionToken, SESSION_COOKIE } from './auth';

// Mock next/headers so requireOwner can be exercised outside a request context.
let cookieValue: string | undefined;
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === SESSION_COOKIE && cookieValue ? { value: cookieValue } : undefined),
  }),
}));

import { getSessionRole, requireOwner } from './session';

beforeAll(() => {
  process.env.APP_SESSION_SECRET = 'a'.repeat(64);
});

describe('requireOwner — the server-action security boundary', () => {
  it('passes with an owner token', async () => {
    cookieValue = await createSessionToken('owner');
    await expect(requireOwner()).resolves.toBeUndefined();
  });
  it('throws for a guest token', async () => {
    cookieValue = await createSessionToken('guest');
    await expect(requireOwner()).rejects.toThrow(/owner only/);
  });
  it('throws with no cookie at all', async () => {
    cookieValue = undefined;
    await expect(requireOwner()).rejects.toThrow(/owner only/);
  });
  it('throws for a tampered token', async () => {
    cookieValue = (await createSessionToken('owner')).slice(0, -2) + 'xx';
    await expect(requireOwner()).rejects.toThrow(/owner only/);
  });
});

describe('getSessionRole', () => {
  it('reads guest role from the cookie', async () => {
    cookieValue = await createSessionToken('guest');
    expect(await getSessionRole()).toBe('guest');
  });
  it('returns null without a cookie', async () => {
    cookieValue = undefined;
    expect(await getSessionRole()).toBe(null);
  });
});
