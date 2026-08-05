// Per-case: potential, cap score at start/end (displayed-0.5 midpoints), stage thresholds,
// and bbscout obs-vs-pred cumulative gain — tests whether alenokc overprediction
// concentrates on cap-deep players.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { potentialScore } from '../../../src/lib/training/salary';
import { SKILL_KEYS, skillsFromArray, type SkillKey } from '../../../src/lib/training/types';

const casesDir = '../docs/research/training/calibration-cases/centri-u21';
const traceDir = process.argv[2];
for (const f of readdirSync(casesDir).filter((x) => x.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(path.join(casesDir, f), 'utf8'));
  if (!c.weeks) continue;
  const start = skillsFromArray(SKILL_KEYS.map((k) => (c.player.startSkillsDisplayed as Record<SkillKey, number>)[k] - 0.5));
  const end = skillsFromArray(SKILL_KEYS.map((k) => ((c.endSkillsDisplayed as Record<SkillKey, number>)[k] ?? 1) - 0.5));
  const ps = potentialScore(start), pe = potentialScore(end);
  const pot = c.player.potential;
  const stages = [8 + 2 * pot, 9 + 2 * pot, 10 + 2 * pot];
  const tr = JSON.parse(readFileSync(path.join(traceDir, f.replace(/\.json$/, '.trace.json')), 'utf8'));
  let obs = 0, pred = 0;
  for (const k of SKILL_KEYS) {
    const fin = tr.finals[k];
    if (fin.observed != null) { obs += fin.observed - c.player.startSkillsDisplayed[k]; pred += fin.predictedInternal - (c.player.startSkillsDisplayed[k] - 0.5); }
  }
  const club = f.includes('alenokc') ? 'alenokc' : 'pjtr576';
  console.log([club, f.replace('.json','').padEnd(38), `pot ${pot}`, `stages ${stages.join('/')}`,
    `capStart ${ps.score.toFixed(1)}(${ps.capPosition})`, `capEnd ${pe.score.toFixed(1)}`,
    `obs ${obs}`, `pred ${pred.toFixed(1)}`, `obs/pred ${(obs / pred).toFixed(2)}`].join(' | '));
}
