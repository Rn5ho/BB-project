import { describe, it, expect } from 'vitest';
import { utcDayKey } from './players';

describe('utcDayKey', () => {
  it('same UTC day → same key', () =>
    expect(utcDayKey(new Date('2026-07-10T00:01:00Z'))).toBe(utcDayKey(new Date('2026-07-10T23:59:00Z'))));
  it('different UTC days differ across local-midnight boundaries', () =>
    expect(utcDayKey(new Date('2026-07-10T23:59:00Z'))).not.toBe(utcDayKey(new Date('2026-07-11T00:01:00Z'))));
  it('formats as YYYY-MM-DD', () => expect(utcDayKey(new Date('2026-07-10T12:00:00Z'))).toBe('2026-07-10'));
});
