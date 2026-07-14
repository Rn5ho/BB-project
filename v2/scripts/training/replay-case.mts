// Replay a real observed training case through each model and score pop predictions.
// Usage: npx tsx scripts/training/replay-case.mts ../docs/research/training/calibration-cases/tim-zorec-s72.json
import { readFileSync } from 'node:fs';
import { weekStep, displayed, type PlayerState } from '../../src/lib/training/engine';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from '../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../src/lib/training/models/open-source-live';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../src/lib/training/types';

const casePath = process.argv[2];
if (!casePath) throw new Error('usage: replay-case.mts <case.json>');
const c = JSON.parse(readFileSync(casePath, 'utf8'));

const startArr = SKILL_KEYS.map((k) => c.player.startSkillsDisplayed[k]);
const models: ModelParams[] = [BBSCOUT, COACH_PARROT, OPEN_SOURCE_LIVE, BBSCOUT_LOW, BBSCOUT_HIGH];

console.log(`\n=== ${c.label} ===`);
console.log(`coach ${c.coachLevel}, youth trainer ${c.youthTrainerLevel}, age ${c.player.age}, ${c.player.heightCm}cm, pot ${c.player.potential}\n`);

for (const model of models) {
  let state: PlayerState = {
    skills: skillsFromArray(startArr.map((v: number) => Math.max(0.5, v - 0.5))),
    age: c.player.age,
    heightCm: c.player.heightCm,
    potential: c.player.potential,
    ftSkill: (c.player.startFreeThrow ?? 1) - 0.5,
    staminaSkill: (c.player.startStamina ?? 1) - 0.5,
  };
  let hits = 0, misses = 0, falseAlarms = 0;
  const detail: string[] = [];

  for (const wk of c.weeks) {
    const r = weekStep(state, {
      trainingId: wk.trainingId,
      coachLevel: c.coachLevel,
      youthTrainerLevel: c.youthTrainerLevel,
      minutes: wk.minutes,
    }, model);
    const predicted = SKILL_KEYS.filter((k) => r.pops[k]);
    const observed = Object.keys(wk.observedPops ?? {}) as SkillKey[];
    for (const k of observed) {
      if (predicted.includes(k)) hits++;
      else { misses++; detail.push(`${wk.date}: observed ${k} pop MISSED (pred ${state.skills[k].toFixed(2)}→${r.skillsAfter[k].toFixed(2)})`); }
    }
    for (const k of predicted) {
      if (!observed.includes(k)) { falseAlarms++; detail.push(`${wk.date}: predicted ${k} pop NOT observed (→${r.skillsAfter[k].toFixed(2)})`); }
    }
    state = { ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaAfter: r.staminaAfter } as PlayerState;
  }

  const endErr = SKILL_KEYS.map((k) => {
    const want = c.endSkillsDisplayed[k];
    const got = displayed(state.skills[k]);
    return { k, want, got, diff: got - want };
  }).filter((e) => e.diff !== 0);

  const totalObserved = c.weeks.reduce((a: number, w: { observedPops?: object }) => a + Object.keys(w.observedPops ?? {}).length, 0);
  console.log(`--- ${model.id} ---`);
  console.log(`pop hits ${hits}/${totalObserved}, misses ${misses}, false alarms ${falseAlarms}`);
  console.log(endErr.length === 0
    ? 'final displayed skills: EXACT match with census'
    : `final displayed mismatches: ${endErr.map((e) => `${e.k} ${e.got} (real ${e.want})`).join(', ')}`);
  for (const d of detail) console.log('  ' + d);
  console.log();
}
