import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTrainingHistory, canonicalPositions, parseUsDate } from './training-history';

const html = readFileSync(new URL('./__fixtures__/traininghistory.html', import.meta.url), 'utf8');

describe('parseTrainingHistory', () => {
  it('parses training weeks, groups pops under them, and keeps age events (newest-first page order)', () => {
    const rows = parseTrainingHistory(html);
    expect(rows).toHaveLength(3);

    expect(rows[0]).toMatchObject({
      date: '7/10/2026', label: 'One on One', positions: 'PG/SG', minutes: 48, trainingId: 15,
    });
    expect(rows[0].pops).toEqual([
      { skill: 'Driving', key: 'dr', from: 10, to: 11 },
      { skill: 'Stamina', key: 'stamina', from: 5, to: 6 },
    ]);

    expect(rows[1].ageEvent).toBe('Your player is now 19 years old');

    // "Rebounding ( minutes)" — TEAM training, empty minutes
    expect(rows[2]).toMatchObject({
      date: '7/3/2026', label: 'Rebounding', positions: 'TEAM', minutes: null, trainingId: 28, pops: [],
    });
  });
});

describe('canonicalPositions', () => {
  it('normalizes BB label variants to catalog order', () => {
    expect(canonicalPositions('Guards')).toBe('PG/SG');
    expect(canonicalPositions('Wingmen')).toBe('SG/SF');
    expect(canonicalPositions('C / PF')).toBe('PF/C');
    expect(canonicalPositions('Team')).toBe('TEAM');
  });
});

describe('parseUsDate', () => {
  it('parses M/D/YYYY as UTC', () => {
    expect(parseUsDate('7/10/2026').toISOString()).toBe('2026-07-10T00:00:00.000Z');
  });
});
