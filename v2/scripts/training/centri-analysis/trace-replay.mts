// Trace-enabled replay over the Centri U-21 calibration cases: per-week per-skill
// internal states, gains and pop predictions, with an optional anchored mode that
// keeps the simulated state consistent with the observed displayed skills
// (teacher forcing — corrects the hidden sublevel whenever the simulation's
// displayed value contradicts the card).
//
// Usage (from v2/):
//   npx tsx scripts/training/centri-analysis/trace-replay.mts <casesDir> --out <outDir>
//     [--model bbscout|coach-parrot|open-source-live|bbscout-low|bbscout-high|bbscout-ha-flat]
//     [--anchored]           # state-consistent filtering (snap on contradiction)
//
// Writes one <case>.trace.json per case plus _aggregate.json into --out, and prints
// the aggregate summary (must reproduce replay-case.mts numbers when NOT anchored).
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, displayed, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW, BBSCOUT_HA_FLAT } from '../../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../../src/lib/training/models/open-source-live';

const MODELS: Record<string, ModelParams> = {
  bbscout: BBSCOUT,
  'coach-parrot': COACH_PARROT,
  'open-source-live': OPEN_SOURCE_LIVE,
  'bbscout-low': BBSCOUT_LOW,
  'bbscout-high': BBSCOUT_HIGH,
  'bbscout-ha-flat': BBSCOUT_HA_FLAT,
};

interface CaseFile {
  label: string;
  player: {
    startSkillsDisplayed: Record<SkillKey, number>;
    age: number; heightCm: number; potential: number;
    startStamina?: number; startFreeThrow?: number;
  };
  coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number;
  weeks: Array<{ date: string; trainingId: number; minutes: number; observedPops?: Record<string, number>; ageAfterThis?: number }>;
  endSkillsDisplayed?: Partial<Record<SkillKey, number>>;
}

interface SkillWeekTrace {
  before: number; gain: number; after: number;
  dispBefore: number; dispAfter: number;
  predPop: boolean;
  obsPop: number | null;      // observed to-level, if this skill popped this week
  obsDisp: number;            // observed displayed level AFTER this week (reconstructed)
  corrected: number | null;   // anchored mode: internal value after correction (null = none)
}

const args = process.argv.slice(2);
const casesDir = args[0];
if (!casesDir) throw new Error('usage: trace-replay.mts <casesDir> --out <dir> [--model id] [--anchored]');
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
if (!outDir) throw new Error('--out <dir> required');
const modelId = args.includes('--model') ? args[args.indexOf('--model') + 1] : 'bbscout';
const anchored = args.includes('--anchored');
const model = MODELS[modelId];
if (!model) throw new Error(`unknown model ${modelId}`);
mkdirSync(outDir, { recursive: true });

const EPS = 0.01; // where inside the observed interval a corrected value lands

const files = readdirSync(casesDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const agg = { hits: 0, misses: 0, fa: 0, endAbsErr: 0, endCount: 0, endExact: 0, corrections: 0, weeks: 0 };
const perCase: Array<Record<string, unknown>> = [];

for (const file of files) {
  const c = JSON.parse(readFileSync(path.join(casesDir, file), 'utf8')) as CaseFile;
  if (!c.weeks) continue;

  // observed displayed trajectory: start displayed + accumulated pops (no decreases in rate skills)
  const obsDisp = { ...c.player.startSkillsDisplayed };

  let state: PlayerState = {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, c.player.startSkillsDisplayed[k] - 0.5))),
    age: c.player.age, heightCm: c.player.heightCm, potential: c.player.potential,
    ftSkill: (c.player.startFreeThrow ?? 1) - 0.5,
    staminaSkill: (c.player.startStamina ?? 1) - 0.5,
  };

  let hits = 0, misses = 0, fa = 0, corrections = 0;
  const weekTraces: Array<{ date: string; trainingId: number; minutes: number; age: number; skills: Record<SkillKey, SkillWeekTrace> }> = [];

  for (const wk of c.weeks) {
    const r = weekStep(state, {
      trainingId: wk.trainingId, coachLevel: c.coachLevel,
      youthTrainerLevel: c.youthTrainerLevel, minutes: wk.minutes,
      gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
    }, model);

    const observed = (wk.observedPops ?? {}) as Partial<Record<SkillKey, number>>;
    for (const k of Object.keys(observed) as SkillKey[]) obsDisp[k] = observed[k]!;

    const skillTraces = {} as Record<SkillKey, SkillWeekTrace>;
    const nextSkills = { ...r.skillsAfter };
    for (const k of SKILL_KEYS) {
      const predPop = !!r.pops[k];
      const obsPop = observed[k] ?? null;
      if (obsPop != null) { if (predPop) hits++; else misses++; }
      else if (predPop) fa++;

      let corrected: number | null = null;
      if (anchored) {
        const d = obsDisp[k];
        const v = nextSkills[k];
        if (v > d) corrected = d;                 // sim ran hot: pull to top of observed interval
        else if (v <= d - 1) corrected = d - 1 + EPS; // sim ran cold: push just past the pop boundary
        if (corrected != null) { nextSkills[k] = corrected; corrections++; }
      }
      skillTraces[k] = {
        before: state.skills[k], gain: r.gains[k], after: r.skillsAfter[k],
        dispBefore: displayed(state.skills[k]), dispAfter: displayed(r.skillsAfter[k]),
        predPop, obsPop, obsDisp: obsDisp[k], corrected,
      };
    }

    weekTraces.push({ date: wk.date, trainingId: wk.trainingId, minutes: wk.minutes, age: state.age, skills: skillTraces });
    state = { ...state, skills: nextSkills, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter, age: wk.ageAfterThis ?? state.age };
  }

  let endAbsErr = 0, endCount = 0, endExact = 0;
  const finals: Record<string, { predicted: number; predictedInternal: number; observed: number | null }> = {};
  for (const k of SKILL_KEYS) {
    const want = c.endSkillsDisplayed?.[k] ?? null;
    const got = displayed(state.skills[k]);
    finals[k] = { predicted: got, predictedInternal: state.skills[k], observed: want };
    if (want == null) continue;
    endAbsErr += Math.abs(got - want); endCount++;
    if (got === want) endExact++;
  }

  agg.hits += hits; agg.misses += misses; agg.fa += fa;
  agg.endAbsErr += endAbsErr; agg.endCount += endCount; agg.endExact += endExact;
  agg.corrections += corrections; agg.weeks += c.weeks.length;
  perCase.push({ file, label: c.label, weeks: c.weeks.length, hits, misses, fa, endAbsErr, endCount, endExact, corrections });

  writeFileSync(path.join(outDir, file.replace(/\.json$/, '.trace.json')), JSON.stringify({
    file, label: c.label, model: modelId, anchored,
    player: c.player, coachLevel: c.coachLevel, youthTrainerLevel: c.youthTrainerLevel,
    gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
    weeks: weekTraces, finals,
    score: { hits, misses, fa, endAbsErr, endCount, endExact, corrections },
  }, null, 1));
}

const recall = agg.hits / (agg.hits + agg.misses);
const summary = {
  model: modelId, anchored, cases: perCase.length, weeks: agg.weeks,
  popRecall: `${(recall * 100).toFixed(1)}% (${agg.hits}/${agg.hits + agg.misses})`,
  falseAlarms: agg.fa,
  finalExact: `${agg.endExact}/${agg.endCount}`,
  mae: +(agg.endAbsErr / agg.endCount).toFixed(4),
  corrections: agg.corrections,
  perCase,
};
writeFileSync(path.join(outDir, '_aggregate.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, perCase: undefined }, null, 1));
