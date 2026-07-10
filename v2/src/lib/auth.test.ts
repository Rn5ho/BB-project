import { describe, it, expect, beforeAll } from 'vitest';
import { createSessionToken, verifySessionToken, checkPassword } from './auth';

beforeAll(() => {
  process.env.APP_SESSION_SECRET = 'a'.repeat(64);
  process.env.APP_PASSWORD = 'correct-horse';
});

describe('session tokens', () => {
  it('round-trips a signed token', async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });
  it('rejects a tampered token', async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token.slice(0, -2) + 'xx')).toBe(false);
  });
  it('rejects garbage', async () => {
    expect(await verifySessionToken('not-a-jwt')).toBe(false);
  });
});

describe('checkPassword', () => {
  it('accepts the correct password', () => expect(checkPassword('correct-horse')).toBe(true));
  it('rejects a wrong password', () => expect(checkPassword('wrong')).toBe(false));
  it('rejects empty input', () => expect(checkPassword('')).toBe(false));
});
