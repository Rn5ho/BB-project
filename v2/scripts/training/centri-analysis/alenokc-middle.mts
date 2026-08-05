// Replay the clean alenokc middle-era windows (built by build_windows.py) through
// the training engine: per-window per-skill predicted vs observed displayed gains.
// Usage (from v2/): npx tsx scripts/training/centri-analysis/alenokc-middle.mts <windows.json> --out <results.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { weekStep, displayed, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../../src/lib/training/models/open-source-live';

const MODELS: Record<string, ModelParams> = {
  bbscout: BBSCOUT,
  'coach-parrot': COACH_PARROT,
  'open-source-live': OPEN_SOURCE_LIVE,
};

interface WindowSpec {
  id: string; player: string; w1: number; w2: number; age: number;
  heightCm: number; potential: number;
  startSkillsDisplayed: Record<SkillKey, number>;
  endSkillsDisplayed: Record<SkillKey, number>;
  startStamina: number; startFreeThrow: number; endStamina: number; endFreeThrow: number;
  coachLevel: number; gymLevel: number; trainingCourtLevel: number;
  weeks: Array<{ week_no: number; date: string; trainingId: number; trainingName: string; minutes: number; observedPops: Record<string, number> }>;
}

const args = process.argv.slice(2);
const specPath = args[0];
const outPath = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
if (!specPath || !outPath) throw new Error('usage: alenokc-middle.mts <windows.json> --out <results.json>');
const windows = JSON.parse(readFileSync(specPath, 'utf8')) as WindowSpec[];

const results: Array<Record<string, unknown>> = [];

for (const w of windows) {
  for (const [modelId, model] of Object.entries(MODELS)) {
    for (const yt of [7, 0]) {
      // YT only matters at age <= 19; skip the redundant yt0 run at age 20
      if (yt === 0 && w.age > 19) continue;
      let state: PlayerState = {
        skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, w.startSkillsDisplayed[k] - 0.5))),
        age: w.age, heightCm: w.heightCm, potential: w.potential,
        ftSkill: w.startFreeThrow - 0.5,
        staminaSkill: w.startStamina - 0.5,
      };
      const perWeek: Array<Record<string, unknown>> = [];
      const cumGain = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Record<SkillKey, number>;
      let ftGain = 0;
      for (const wk of w.weeks) {
        const r = weekStep(state, {
          trainingId: wk.trainingId, coachLevel: w.coachLevel,
          youthTrainerLevel: yt, minutes: wk.minutes,
          gymLevel: w.gymLevel, trainingCourtLevel: w.trainingCourtLevel,
        }, model);
        for (const k of SKILL_KEYS) cumGain[k] += r.gains[k];
        ftGain += r.ftAfter - (state.ftSkill ?? 1);
        perWeek.push({
          week_no: wk.week_no, training: wk.trainingName, minutes: wk.minutes,
          gains: Object.fromEntries(SKILL_KEYS.map((k) => [k, +r.gains[k].toFixed(4)])),
          predPops: Object.fromEntries(SKILL_KEYS.filter((k) => r.pops[k]).map((k) => [k, displayed(r.skillsAfter[k])])),
          obsPops: wk.observedPops,
        });
        state = { ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
      }
      const perSkill = Object.fromEntries(SKILL_KEYS.map((k) => {
        const startDisp = w.startSkillsDisplayed[k];
        const endObs = w.endSkillsDisplayed[k];
        return [k, {
          startDisp, endObsDisp: endObs, obsGain: endObs - startDisp,
          predInternalGain: +cumGain[k].toFixed(4),
          predEndDisp: displayed(state.skills[k]),
          predDispGain: displayed(state.skills[k]) - startDisp,
        }];
      }));
      results.push({
        id: w.id, player: w.player, w1: w.w1, w2: w.w2, age: w.age,
        heightCm: w.heightCm, potential: w.potential, model: modelId, yt,
        nWeeks: w.weeks.length,
        trainings: w.weeks.map((x) => x.trainingName),
        idIsGapAtStart: Math.max(0, w.startSkillsDisplayed.id - w.startSkillsDisplayed.is),
        perSkill, perWeek,
        ft: { startDisp: w.startFreeThrow, endObsDisp: w.endFreeThrow, obsGain: w.endFreeThrow - w.startFreeThrow, predInternalGain: +ftGain.toFixed(4) },
      });
    }
  }
}

writeFileSync(outPath, JSON.stringify(results, null, 1));
console.log(`wrote ${results.length} window-model-yt runs to ${outPath}`);
