import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseStaffLevels, parseInfrastructure } from './team-pages';

const staff = readFileSync(new URL('./__fixtures__/staff.html', import.meta.url), 'utf8');
const arena = readFileSync(new URL('./__fixtures__/arena.html', import.meta.url), 'utf8');

describe('parseStaffLevels', () => {
  it('reads every role level from the title attribute, keeping Trainer and Youth Trainer distinct', () => {
    expect(parseStaffLevels(staff)).toEqual({
      doctor: 3, trainer: 5, prManager: 1, youthTrainer: 6, sportsPsychologist: 6,
    });
  });

  it('returns nulls for roles missing from the page', () => {
    expect(parseStaffLevels('<html><body>no staff employed</body></html>')).toEqual({
      trainer: null, youthTrainer: null, doctor: null, prManager: null, sportsPsychologist: null,
    });
  });
});

describe('parseInfrastructure', () => {
  it('reads gym and training-court levels from the inline JS vars', () => {
    expect(parseInfrastructure(arena)).toEqual({ gym: 3, trainingCourt: 2 });
  });

  it('returns nulls when the vars are absent', () => {
    expect(parseInfrastructure('<html></html>')).toEqual({ gym: null, trainingCourt: null });
  });
});
