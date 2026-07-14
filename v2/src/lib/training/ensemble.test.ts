import { describe, expect, it } from 'vitest';
import { ensembleProject } from './ensemble';
import { skillsFromArray, SKILL_KEYS } from './types';

describe('ensembleProject', () => {
  it('returns bbscout as central and a band that contains it', () => {
    const player = {
      skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
      age: 18, heightCm: 196, potential: 8,
    };
    const plan = Array.from({ length: 28 }, () => ({ trainingId: 15, coachLevel: 5 }));
    const r = ensembleProject(player, plan);
    expect(Object.keys(r.byModel)).toHaveLength(5);
    expect(r.band.tspLow).toBeLessThanOrEqual(r.band.tspCentral);
    expect(r.band.tspHigh).toBeGreaterThanOrEqual(r.band.tspCentral);
    for (const k of SKILL_KEYS) {
      expect(r.band.low[k]).toBeLessThanOrEqual(r.central.finalSkills[k] + 1e-9);
      expect(r.band.high[k]).toBeGreaterThanOrEqual(r.central.finalSkills[k] - 1e-9);
    }
    // a 28-week DR-heavy plan must show real spread between models
    expect(r.band.tspHigh - r.band.tspLow).toBeGreaterThan(1);
  });
});
