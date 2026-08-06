// Round-2 DMI-inversion helper: run one real engine weekStep per job (card-anchored
// state, displayed-0.5 midpoints) and emit continuous gains + ft/st before/after.
// Usage (from v2/): npx tsx scripts/training/centri-analysis/dmi-weekstep-jobs.mts <jobs.json> <out.json> [modelId]
import { readFileSync, writeFileSync } from 'node:fs';
import { weekStep, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, type ModelParams, type SkillKey, type Skills } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../../src/lib/training/models/open-source-live';

const MODELS: Record<string, ModelParams> = {
  bbscout: BBSCOUT,
  'coach-parrot': COACH_PARROT,
  'open-source-live': OPEN_SOURCE_LIVE,
};

const [jobsPath, outPath, modelId = 'bbscout'] = process.argv.slice(2);
if (!jobsPath || !outPath) throw new Error('usage: dmi-weekstep-jobs.mts <jobs.json> <out.json> [modelId]');
const model = MODELS[modelId];
if (!model) throw new Error(`unknown model ${modelId}`);

interface Job {
  player: string; author: string; d0: string; d1: string;
  skills: Record<SkillKey, number>;
  age: number; heightCm: number; potential: number;
  st: number; ft: number;
  trainingId: number; coachLevel: number; youthTrainerLevel: number;
  gymLevel: number; trainingCourtLevel: number;
}

const jobs: Job[] = JSON.parse(readFileSync(jobsPath, 'utf8'));
const out = jobs.map((j) => {
  const skills = {} as Skills;
  for (const k of SKILL_KEYS) skills[k] = j.skills[k] - 0.5;
  const player: PlayerState = {
    skills, age: j.age, heightCm: j.heightCm, potential: j.potential,
    ftSkill: j.ft - 0.5, staminaSkill: j.st - 0.5,
  };
  const res = weekStep(player, {
    trainingId: j.trainingId, coachLevel: j.coachLevel,
    youthTrainerLevel: j.youthTrainerLevel, minutes: 48,
    gymLevel: j.gymLevel, trainingCourtLevel: j.trainingCourtLevel,
  }, model);
  return {
    player: j.player, author: j.author, d0: j.d0, d1: j.d1, model: modelId,
    gains: res.gains,
    before: skills,
    ftBefore: j.ft - 0.5, ftAfter: res.ftAfter,
    stBefore: j.st - 0.5, stAfter: res.staminaAfter,
    multipliers: res.multipliers, capped: res.capped,
  };
});
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`wrote ${out.length} weekStep results (${modelId}) -> ${outPath}`);
