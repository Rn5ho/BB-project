// Round-2 adversarial verification: independent engine runner for the DMI-increment test.
// Reads pairs.json (built independently from series.csv/weeks.csv), runs weekStep from
// card-anchored state (displayed - 0.5) for bbscout + coach-parrot, and emits per-pair
// predicted ln-salary-weighted growth components. Analysis happens in Python.
import { readFileSync, writeFileSync } from 'node:fs';
import { weekStep, type PlayerState, type WeekConfig } from '../../../src/lib/training/engine';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../../src/lib/training/models/coach-parrot';
import { SKILL_KEYS, ALL_POSITIONS, type Position, type Skills } from '../../../src/lib/training/types';

const DIR = 'C:/Users/Rn5ho/AppData/Local/Temp/claude/D--ClaudeProjects-BB-project-v2/3cc08ba3-8a42-4d6b-9ea5-496b684e99bf/scratchpad/agents-r2/dmi-inversion-verify';

// Josef Ka 2010 salary multipliers (t160760.5; identical to v2 salary.ts SALARY_MULTIPLIERS)
const M2010: Record<Position, number[]> = {
  PG: [1.025, 1.045, 1.08, 1.08, 1.04, 1.155, 1.0, 1.0, 1.035, 1.0],
  SG: [1.125, 1.15, 1.13, 1.0, 1.0, 1.0, 1.0, 1.0, 1.065, 1.0],
  SF: [1.18, 1.085, 1.065, 1.0, 1.0, 1.0, 1.0, 1.06, 1.09, 1.005],
  PF: [1.08, 1.0, 1.0, 1.0, 1.0, 1.0, 1.115, 1.115, 1.115, 1.06],
  C: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.138, 1.135, 1.13, 1.065],
};
// Josef Ka 2019 season-48 refit (t160760.16/17): ln-linear coefficients + per-pos const
const C2019: Record<Position, { c: number[]; k: number }> = {
  PG: { c: [0.030, 0.039, 0.072, 0.071, 0.036, 0.147, 0.001, 0.001, 0.036, 0.001], k: 228.0 },
  SG: { c: [0.107, 0.121, 0.124, 0.003, 0.002, 0.006, 0.002, 0.002, 0.063, 0.001], k: 220.7 },
  SF: { c: [0.160, 0.071, 0.059, 0.002, 0.002, 0.003, 0.001, 0.057, 0.086, 0.002], k: 242.9 },
  PF: { c: [0.078, 0.001, 0.001, 0.000, 0.001, 0.001, 0.107, 0.107, 0.106, 0.044], k: 246.6 },
  C: { c: [0.002, 0.001, 0.001, 0.001, 0.001, 0.001, 0.124, 0.125, 0.124, 0.051], k: 241.9 },
};

function lnRaw2010(skills: Skills): { ln: number; pos: Position } {
  let best = -Infinity; let bp: Position = 'C';
  for (const pos of ALL_POSITIONS) {
    const ln = Math.log(300) + SKILL_KEYS.reduce((a, k, i) => a + Math.log(M2010[pos][i]) * skills[k], 0);
    if (ln > best) { best = ln; bp = pos; }
  }
  return { ln: best, pos: bp };
}
function lnRaw2019(skills: Skills): { ln: number; pos: Position } {
  let best = -Infinity; let bp: Position = 'C';
  for (const pos of ALL_POSITIONS) {
    const ln = Math.log(C2019[pos].k) + SKILL_KEYS.reduce((a, k, i) => a + C2019[pos].c[i] * skills[k], 0);
    if (ln > best) { best = ln; bp = pos; }
  }
  return { ln: best, pos: bp };
}
const stTerm = (st: number) => Math.log(1 - 0.035 * (10 - st));
const ftTerm = (ft: number) => Math.log(1 + 0.018 * (ft - 1));

interface Job {
  idx: number; tier: string; excluded_minutes: boolean; pid: string; name: string;
  author: string; t1: string; t2: string; gap: number; week_no: string;
  trainingId: number; trainingName: string; coach: number; ytRaw: number | null;
  gym: number; tc: number; minutes: number; age: number; heightCm: number;
  potential: number; skills1: Record<string, number>; skills2: Record<string, number>;
  st: number; ft: number; dmi1: number; dmi2: number;
}
const jobs: Job[] = JSON.parse(readFileSync(`${DIR}/pairs.json`, 'utf8'));

function predict(job: Job, model: typeof BBSCOUT, ytOverride?: number) {
  const skills = Object.fromEntries(SKILL_KEYS.map((k) => [k, job.skills1[k] - 0.5])) as Skills;
  const player: PlayerState = {
    skills, age: job.age, heightCm: job.heightCm, potential: job.potential,
    staminaSkill: job.st - 0.5, ftSkill: job.ft - 0.5,
  };
  const yt = ytOverride !== undefined ? ytOverride : (job.ytRaw ?? (job.author === 'alenokc' ? 7 : 0));
  const config: WeekConfig = {
    trainingId: job.trainingId, coachLevel: job.coach, youthTrainerLevel: yt,
    minutes: job.minutes, gymLevel: job.gym, trainingCourtLevel: job.tc,
  };
  const res = weekStep(player, config, model);
  const b10 = lnRaw2010(skills); const a10 = lnRaw2010(res.skillsAfter);
  const b19 = lnRaw2019(skills); const a19 = lnRaw2019(res.skillsAfter);
  const dST = stTerm(res.staminaAfter) - stTerm(job.st - 0.5);
  const dFT = ftTerm(res.ftAfter) - ftTerm(job.ft - 0.5);
  return {
    dLnSkill2010: a10.ln - b10.ln, dLnSkill2019: a19.ln - b19.ln,
    posBefore: b10.pos, posAfter: a10.pos, pos2019Before: b19.pos, pos2019After: b19.pos,
    posChanged: b10.pos !== a10.pos,
    dST, dFT,
    pred2010: a10.ln - b10.ln + dST + dFT,
    pred2019: a19.ln - b19.ln + dST + dFT,
    gains: res.gains, capped: res.capped, multipliers: res.multipliers,
    // per-skill ln-weighted contributions at the before-state best position (2010 weights)
    contrib: Object.fromEntries(SKILL_KEYS.map((k, i) => [k, res.gains[k] * Math.log(M2010[b10.pos][i])])),
  };
}

const out = jobs.map((job) => {
  const obs = Math.log((job.dmi2 + 50) / (job.dmi1 + 50));
  return {
    ...job,
    obs,
    bbscout: predict(job, BBSCOUT),
    cp: predict(job, COACH_PARROT),
    bbscoutYt5: predict(job, BBSCOUT, job.author === 'alenokc' ? 5 : undefined),
    bbscoutYt0: predict(job, BBSCOUT, job.author === 'alenokc' ? 0 : undefined),
  };
});

writeFileSync(`${DIR}/pred.json`, JSON.stringify(out, null, 1));
console.log(`wrote ${out.length} predictions (${out.filter(j => j.tier === 'gs9' && !j.excluded_minutes).length} gs9 primary)`);
