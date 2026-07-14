// v2/src/lib/training/calibration/oracle-replay.test.ts
import { describe, expect, it } from 'vitest';
import { loadProbes, replayProbe } from './fixtures';
import { COACH_PARROT } from '../models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../models/open-source-live';

describe('oracle fixture replay (buzzeriq recordings)', () => {
  const probes = loadProbes();

  it('loads the recorded probe pairs', () => {
    expect(probes.length).toBeGreaterThanOrEqual(25);
  });

  it('open-source-live reproduces probed open_source cells within 0.02', () => {
    // Cells we corrected FROM these probes must round-trip: the definitional set.
    const definitional = ['01-order-HA1', '03-order-SB5', '04-order-PA1', '23-age21', '31-open-age19', '32-open-age20'];
    for (const name of definitional) {
      const probe = probes.find((p) => p.name === name);
      expect(probe, name).toBeDefined();
      const { maxAbsErr } = replayProbe(probe!, OPEN_SOURCE_LIVE);
      expect(maxAbsErr, `${name} maxAbsErr`).toBeLessThan(0.02);
    }
  });

  it('coach-parrot matches buzzeriq coach_parrot on primary-skill cells within 0.02', () => {
    // buzzeriq's parrot deviates from cp_2_1 on some secondaries (e.g. SB-for-5 drops the
    // ID secondary) — assert primaries only; full diffs go to the report script.
    const cases = [
      { name: '21-parrot-HA1', skillIdx: 3 }, // HA
      { name: '22-parrot-SB5', skillIdx: 9 }, // SB
      { name: '30-parrot-age21', skillIdx: 3 },
    ];
    for (const c of cases) {
      const probe = probes.find((p) => p.name === c.name);
      expect(probe, c.name).toBeDefined();
      const { predicted, actual } = replayProbe(probe!, COACH_PARROT);
      expect(Math.abs(predicted[c.skillIdx] - actual[c.skillIdx]), c.name).toBeLessThan(0.02);
    }
  });
});
