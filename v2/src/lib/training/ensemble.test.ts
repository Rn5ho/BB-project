import { describe, expect, it } from 'vitest';
import { ensembleProject } from './ensemble';
import { skillsFromArray, SKILL_KEYS } from './types';

describe('ensembleProject', () => {
  const player = {
    skills: skillsFromArray([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
    age: 18, heightCm: 196, potential: 8,
  };

  it('returns bbscout as central and a band that contains it', () => {
    const plan = Array.from({ length: 28 }, () => ({ trainingId: 15, coachLevel: 5 }));
    const r = ensembleProject(player, plan);
    expect(Object.keys(r.byModel)).toHaveLength(7); // 5 models + 2 sublevel-bound runs
    expect(r.band.tspLow).toBeLessThanOrEqual(r.band.tspCentral);
    expect(r.band.tspHigh).toBeGreaterThanOrEqual(r.band.tspCentral);
    for (const k of SKILL_KEYS) {
      expect(r.band.low[k]).toBeLessThanOrEqual(r.central.finalSkills[k] + 1e-9);
      expect(r.band.high[k]).toBeGreaterThanOrEqual(r.central.finalSkills[k] - 1e-9);
    }
    // a 28-week DR-heavy plan must show real spread between models
    expect(r.band.tspHigh - r.band.tspLow).toBeGreaterThan(1);
  });

  it('sublevelBounds narrow the band vs the default ±0.49 runs', () => {
    const plan = Array.from({ length: 4 }, () => ({ trainingId: 15, coachLevel: 5 }));
    const loose = ensembleProject(player, plan);
    const tight = ensembleProject(player, plan, {
      sublevelBounds: Object.fromEntries(SKILL_KEYS.map((k) => [k, {
        low: player.skills[k] - 0.1, high: player.skills[k] + 0.1,
      }])),
    });
    expect(tight.band.tspHigh - tight.band.tspLow).toBeLessThan(loose.band.tspHigh - loose.band.tspLow);
  });
});
