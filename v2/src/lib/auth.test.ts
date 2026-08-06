import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import { createSessionToken, verifySession, verifySessionToken, resolvePassword } from './auth';

beforeAll(() => {
  process.env.APP_SESSION_SECRET = 'a'.repeat(64);
  process.env.APP_PASSWORD = 'correct-horse';
  process.env.GUEST_PASSWORD = 'battery-staple';
});

describe('session tokens', () => {
  it('round-trips an owner token', async () => {
    const token = await createSessionToken('owner');
    expect(await verifySessionToken(token)).toBe('owner');
  });
  it('round-trips a guest token', async () => {
    const token = await createSessionToken('guest');
    expect(await verifySessionToken(token)).toBe('guest');
  });
  it('defaults to owner (back-compat call sites)', async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe('owner');
  });
  it('accepts pre-role owner tokens (sub only, no role claim)', async () => {
    const legacy = await new SignJWT({ sub: 'owner' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(new TextEncoder().encode(process.env.APP_SESSION_SECRET));
    expect(await verifySessionToken(legacy)).toBe('owner');
  });
  it('rejects a valid signature with an unknown identity', async () => {
    const weird = await new SignJWT({ sub: 'someone-else' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(new TextEncoder().encode(process.env.APP_SESSION_SECRET));
    expect(await verifySessionToken(weird)).toBe(null);
  });
  it('rejects a tampered token', async () => {
    const token = await createSessionToken('owner');
    expect(await verifySessionToken(token.slice(0, -2) + 'xx')).toBe(null);
  });
  it('rejects garbage', async () => {
    expect(await verifySessionToken('not-a-jwt')).toBe(null);
  });
});

describe('anonymous guest session ids', () => {
  it('gives each guest token a session id', async () => {
    const token = await createSessionToken('guest');
    const session = await verifySession(token);
    expect(session?.role).toBe('guest');
    expect(typeof session?.sessionId).toBe('string');
    expect(session?.sessionId?.length).toBeGreaterThan(0);
  });

  it('gives two guest logins different session ids', async () => {
    const a = await verifySession(await createSessionToken('guest'));
    const b = await verifySession(await createSessionToken('guest'));
    expect(a?.sessionId).not.toBe(b?.sessionId);
  });

  it('does not tag owner tokens with a session id', async () => {
    const session = await verifySession(await createSessionToken('owner'));
    expect(session).toEqual({ role: 'owner', sessionId: null });
  });

  it('accepts guest tokens issued before session ids existed', async () => {
    const legacy = await new SignJWT({ sub: 'owner', role: 'guest' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.APP_SESSION_SECRET));
    expect(await verifySession(legacy)).toEqual({ role: 'guest', sessionId: null });
  });

  it('returns null for a token that does not verify', async () => {
    expect(await verifySession('not-a-jwt')).toBe(null);
  });
});

describe('resolvePassword', () => {
  it('maps the owner password to owner', () => expect(resolvePassword('correct-horse', 'battery-staple')).toBe('owner'));
  it('maps the guest password to guest', () => expect(resolvePassword('battery-staple', 'battery-staple')).toBe('guest'));
  it('rejects a wrong password', () => expect(resolvePassword('wrong', 'battery-staple')).toBe(null));
  it('rejects empty input', () => expect(resolvePassword('', 'battery-staple')).toBe(null));
  it('disables guest login when no guest password is configured', () => {
    expect(resolvePassword('battery-staple', null)).toBe(null);
    expect(resolvePassword('battery-staple')).toBe(null);
  });
  it('empty guest password never matches', () => {
    expect(resolvePassword('', '')).toBe(null);
  });
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
  it('resolvePassword throws when APP_PASSWORD unset', () => {
    delete process.env.APP_PASSWORD;
    expect(() => resolvePassword('x')).toThrow(/APP_PASSWORD/);
  });
});
