// v2/scripts/training/report.mts
// Prints a per-model, per-probe diff table vs the recorded buzzeriq fixtures.
import { loadProbes, replayProbe } from '../../src/lib/training/calibration/fixtures';
import { COACH_PARROT } from '../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../src/lib/training/models/open-source-live';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';

const models = [OPEN_SOURCE_LIVE, COACH_PARROT, BBSCOUT];
const probes = loadProbes();

for (const model of models) {
  console.log(`\n=== ${model.id} vs recorded fixtures ===`);
  const rows = probes
    .filter((p) =>
      model.id === 'coach-parrot' || model.id === 'bbscout'
        ? p.request.player.training_model === 'coach_parrot'
        : p.request.player.training_model === 'open_source',
    )
    .map((p) => {
      const { maxAbsErr } = replayProbe(p, model);
      return { probe: p.name, maxAbsErr: Number(maxAbsErr.toFixed(4)) };
    })
    .sort((a, b) => b.maxAbsErr - a.maxAbsErr);
  console.table(rows);
  const worst = rows[0];
  console.log(`worst: ${worst?.probe} (${worst?.maxAbsErr})`);
}
