import { describe, it, expect } from 'vitest';
import { mdTable, fmtSkills } from './md';

describe('mdTable', () => {
  it('renders a pipe table with null as dash', () => {
    expect(mdTable(['a', 'b'], [[1, null]])).toBe('| a | b |\n| --- | --- |\n| 1 | – |');
  });
});
describe('fmtSkills', () => {
  it('renders SKILL_KEYS order', () => {
    expect(fmtSkills({ js: 17, jr: 11, od: 15, ha: 14, dr: 15, pa: 8, is: 10, id: 6, rb: 5, sb: 4 }))
      .toBe('JS17 JR11 OD15 HA14 DR15 PA8 IS10 ID6 RB5 SB4');
  });
});
