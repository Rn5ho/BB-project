// FT/ST engine trace over the Centri U-21 cases (bbscout): per-week free-throw and
// stamina engine gains, decomposed into gym-scatter vs training-court components by
// running each week twice (with configured TC level and with TC forced to 0).
// The rate-skill state evolves exactly as in the plain (non-anchored) replay.
//
// Usage (from v2/):
//   npx tsx scripts/training/centri-analysis/ft-st-trace.mts <casesDir> --out <outFile.json>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, displayed, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';

interface CaseFile {
  label: string;
  player: {
    startSkillsDisplayed: Record<SkillKey, number>;
    age: number; heightCm: number; potential: number;
    startStamina?: number; startFreeThrow?: number;
  };
  coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number;
  weeks: Array<{ date: string; trainingId: number; minutes: number; ageAfterThis?: number }>;
}

const args = process.argv.slice(2);
const casesDir = args[0];
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
if (!casesDir || !outFile) throw new Error('usage: ft-st-trace.mts <casesDir> --out <file.json>');

const files = readdirSync(casesDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const out: Array<Record<string, unknown>> = [];

for (const file of files) {
  const c = JSON.parse(readFileSync(path.join(casesDir, file), 'utf8')) as CaseFile;
  if (!c.weeks) continue;

  let state: PlayerState = {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, c.player.startSkillsDisplayed[k] - 0.5))),
    age: c.player.age, heightCm: c.player.heightCm, potential: c.player.potential,
    ftSkill: (c.player.startFreeThrow ?? 1) - 0.5,
    staminaSkill: (c.player.startStamina ?? 1) - 0.5,
  };

  const weeks: Array<Record<string, unknown>> = [];
  let ftScatterTotal = 0, ftTcTotal = 0, stScatterTotal = 0, predFtPops = 0, predStPops = 0;

  for (const wk of c.weeks) {
    const cfgBase = {
      trainingId: wk.trainingId, coachLevel: c.coachLevel,
      youthTrainerLevel: c.youthTrainerLevel, minutes: wk.minutes,
      gymLevel: c.gymLevel ?? 0,
    };
    const r = weekStep(state, { ...cfgBase, trainingCourtLevel: c.trainingCourtLevel ?? 0 }, BBSCOUT);
    const r0 = weekStep(state, { ...cfgBase, trainingCourtLevel: 0 }, BBSCOUT);

    const ftBefore = state.ftSkill ?? 1;
    const stBefore = state.staminaSkill ?? 1;
    const ftScatter = (r0.ftAfter - ftBefore);          // gym scatter EV only
    const ftTc = (r.ftAfter - r0.ftAfter);              // training-court passive component
    const stScatter = (r.staminaAfter - stBefore);      // stamina only gets scatter

    if (displayed(r.ftAfter) > displayed(ftBefore)) predFtPops++;
    if (displayed(r.staminaAfter) > displayed(stBefore)) predStPops++;
    ftScatterTotal += ftScatter; ftTcTotal += ftTc; stScatterTotal += stScatter;

    weeks.push({
      date: wk.date, trainingId: wk.trainingId, minutes: wk.minutes, age: state.age,
      ftBefore, ftScatter, ftTc, ftAfter: r.ftAfter,
      stBefore, stScatter, stAfter: r.staminaAfter,
    });

    state = {
      ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter,
      age: wk.ageAfterThis ?? state.age,
    };
  }

  out.push({
    file, label: c.label,
    gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
    startFt: c.player.startFreeThrow ?? null, startSt: c.player.startStamina ?? null,
    nWeeks: c.weeks.length,
    totals: {
      ftScatterTotal, ftTcTotal, ftTotal: ftScatterTotal + ftTcTotal,
      stScatterTotal, predFtPops, predStPops,
      endFtInternal: state.ftSkill, endStInternal: state.staminaSkill,
      endFtDisplayed: displayed(state.ftSkill ?? 1), endStDisplayed: displayed(state.staminaSkill ?? 1),
    },
    weeks,
  });
}

writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.map((c) => ({ label: c.label, totals: c.totals })), null, 1));
