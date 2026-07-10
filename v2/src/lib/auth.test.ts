import { describe, it, expect, beforeAll, afterEach } from 'vitest';
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

describe('misconfiguration', () => {
  afterEach(() => {
    process.env.APP_SESSION_SECRET = 'a'.repeat(64);
    process.env.APP_PASSWORD = 'correct-horse';
  });
  it('verifySessionToken throws loudly when secret missing', async () => {
    delete process.env.APP_SESSION_SECRET;
    await expect(verifySessionToken('whatever')).rejects.toThrow(/APP_SESSION_SECRET/);
  });
  it('checkPassword throws when APP_PASSWORD unset', () => {
    delete process.env.APP_PASSWORD;
    expect(() => checkPassword('x')).toThrow(/APP_PASSWORD/);
  });
});
