// (c) cost side of the "JR 16+ hidden OP tactic" hypothesis, in-model:
// for a JS-16 SG at 196cm, weeks + cap points to take JR 13->16, vs spending the
// same weeks on OD or HA (HA tows OD via the ha->od elastic). Engine = BBSCOUT.
// The match VALUE of high JR stays owner judgment — this script prices it only.
// Usage (from v2/): npx tsx scripts/training/centri-analysis/retro/greek-jr-cost.mts <outDir>
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, displayed, type PlayerState } from '../../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type SkillKey } from '../../../../src/lib/training/types';
import { BBSCOUT, JK_POTENTIAL_WEIGHTS } from '../../../../src/lib/training/models/bbscout';

const outDir = process.argv[2];
if (!outDir) throw new Error('usage: greek-jr-cost.mts <outDir>');
mkdirSync(outDir, { recursive: true });

// Reference SG mid-build (displayed): JS16 JR13 OD13 HA14 DR15 PA9 IS9 ID7 RB8 SB4.
// Internal = displayed - 0.5 (bridge midpoint convention).
const DISPLAYED: Record<SkillKey, number> = { js: 16, jr: 13, od: 13, ha: 14, dr: 15, pa: 9, is: 9, id: 7, rb: 8, sb: 4 };
function mkState(age: number, potential: number): PlayerState {
  return {
    skills: skillsFromArray(SKILL_KEYS.map((k) => DISPLAYED[k] - 0.5)),
    age, heightCm: 196, potential,
    ftSkill: 7.5, staminaSkill: 5.5,
  };
}
const STAFF = { coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0, minutes: 48 };

function runWeeks(state0: PlayerState, trainingId: number, weeks: number) {
  let s: PlayerState = { ...state0, skills: { ...state0.skills } };
  const weekly: Array<Record<string, number>> = [];
  for (let w = 0; w < weeks; w++) {
    const r = weekStep(s, { trainingId, ...STAFF }, BBSCOUT);
    s = { ...s, skills: r.skillsAfter, ftAfter: undefined, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter } as PlayerState;
    weekly.push(Object.fromEntries(SKILL_KEYS.map((k) => [k, +s.skills[k].toFixed(3)])));
  }
  return { end: s, weekly };
}

function weeksToDisplayed(state0: PlayerState, trainingId: number, skill: SkillKey, target: number, cap = 40) {
  let s: PlayerState = { ...state0, skills: { ...state0.skills } };
  for (let w = 1; w <= cap; w++) {
    const r = weekStep(s, { trainingId, ...STAFF }, BBSCOUT);
    s = { ...s, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
    if (displayed(s.skills[skill]) >= target) return { weeks: w, end: s };
  }
  return { weeks: null as number | null, end: s };
}

function disp(s: PlayerState) {
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(s.skills[k])]));
}
function capPoints(deltaSkill: SkillKey, levels: number) {
  const idx = SKILL_KEYS.indexOf(deltaSkill);
  return Object.fromEntries(
    (['PG', 'SG', 'SF', 'PF', 'C'] as const).map((p) => [p, +(JK_POTENTIAL_WEIGHTS[p][idx] * levels).toFixed(2)]),
  );
}

// trainings: JR for 2 (id 5, single-pos SG), OD for 12 (id 10), HA for 12 (id 13)
const scenarios: Record<string, unknown> = {};
for (const [scen, age, pot] of [['age20_pot9_uncapped', 20, 9], ['age19_pot9_uncapped', 19, 9], ['age20_pot7_capBinding', 20, 7]] as const) {
  const s0 = mkState(age, pot);
  const jr = weeksToDisplayed(s0, 5, 'jr', 16);
  const W = jr.weeks ?? 40;
  const od = runWeeks(s0, 10, W);
  const ha = runWeeks(s0, 13, W);
  scenarios[scen] = {
    startDisplayed: disp(s0), age, potential: pot, heightCm: 196, staff: STAFF,
    jrPath: { trainingId: 5, weeksToJr16: jr.weeks, endDisplayed: disp(jr.end), endInternalJr: +jr.end.skills.jr.toFixed(3) },
    odAlternative: { trainingId: 10, weeks: W, endDisplayed: disp(od.end), endInternalOd: +od.end.skills.od.toFixed(3) },
    haAlternative: {
      trainingId: 13, weeks: W, endDisplayed: disp(ha.end),
      endInternalHa: +ha.end.skills.ha.toFixed(3), endInternalOd: +ha.end.skills.od.toFixed(3),
      note: 'OD moves passively via ha->od elastic 0.05 + any OD secondary cells',
    },
  };
}

const out = {
  question: 'price of JR 13->16 on a JS-16 SG @196cm vs same weeks on OD/HA (value stays owner judgment)',
  model: 'BBSCOUT weekStep, coach 5, no YT/gym/TC, 48 min single-position rows',
  capWeightPerLevel: {
    jr: capPoints('jr', 1), od: capPoints('od', 1), ha: capPoints('ha', 1),
    note: 'JK weights per level; x3 for a 3-level move. SG shape: jr .50/level is the 2nd-priciest skill after... see full table',
    fullWeights: JK_POTENTIAL_WEIGHTS,
  },
  capMove3Levels: { jr: capPoints('jr', 3), od: capPoints('od', 3), ha: capPoints('ha', 3) },
  scenarios,
};
writeFileSync(path.join(outDir, 'jr-cost-memo.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
