// Pure simulation (no DB writes). Owner's hypothetical Training Lab build (2026-08-07)
// vs traditional 1v1-rush builds, swept across elastic strength to bracket the S73 trim.
//
// Owner's build: 185cm, pot 9 (MVP), coach 5 / YT 6 / gym 3 / TC 2, 56 weeks from age 18 wk 1.
//   Passing(PG) 10 -> OD(PG) 7 -> OD(PG) 10 -> JumpShot(PG/SG) 15 -> OutsideShooting(SG) 3 -> 1v1 11
// Traditional comparators use the SAME 56 weeks and staff, classic 1v1-first shape.
import { project, type PlayerState, type WeekConfig } from '../../src/lib/training/engine';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';
import { capThreshold, potentialScore } from '../../src/lib/training/salary';
import { SKILL_KEYS, skillsFromArray, type ModelParams } from '../../src/lib/training/types';

const PA1 = 18, OD1 = 9, JS12 = 1, JR2 = 5, ONE = 15; // catalog ids
const STAFF = { coachLevel: 5, youthTrainerLevel: 6, gymLevel: 3, trainingCourtLevel: 2 };
const blk = (id: number, n: number): WeekConfig[] => Array.from({ length: n }, () => ({ trainingId: id, ...STAFF }));

const player: PlayerState = {
  skills: skillsFromArray([7, 7, 6, 6, 5, 5, 4, 4, 3, 7]), // JS JR OD HA DR PA IS ID RB SB
  age: 18, heightCm: 185, potential: 9, ftSkill: 7, staminaSkill: 7,
};

const PLANS: Record<string, WeekConfig[]> = {
  owner_JSJR_OD_first: [...blk(PA1, 10), ...blk(OD1, 17), ...blk(JS12, 15), ...blk(JR2, 3), ...blk(ONE, 11)],
  trad_pure_1v1_rush: [...blk(ONE, 28), ...blk(OD1, 14), ...blk(JS12, 14)],
  trad_balanced: [...blk(ONE, 20), ...blk(OD1, 14), ...blk(JS12, 15), ...blk(PA1, 7)],
  // Owner's exact mix, but classic ordering — isolates ORDER from MIX.
  owner_mix_1v1_first: [...blk(ONE, 11), ...blk(PA1, 10), ...blk(OD1, 17), ...blk(JS12, 15), ...blk(JR2, 3)],
};

function withElastic(scale: number): ModelParams {
  const spec = BBSCOUT.elastic.value;
  if (spec.kind !== 'additive-pair') throw new Error('unexpected elastic kind');
  return {
    ...BBSCOUT,
    elastic: { ...BBSCOUT.elastic, value: { kind: 'additive-pair', pairs: spec.pairs.map((p) => ({ ...p, coeff: p.coeff * scale })) } },
  };
}

const disp = (v: number) => Math.ceil(v - 1e-9);
const out: Record<string, unknown> = {
  legend: 'displayed skills at end of U-21 (age 22 wk 1). capUsed/capStage1 = Josef-Ka '
    + 'weighted score vs the FIRST cap step (8+2*pot). S73 raised the real cap — our model still has the old ladder.',
};

for (const scale of [1.0, 0.75, 0.5]) {
  const model = withElastic(scale);
  const rows: Record<string, unknown> = {};
  for (const [name, plan] of Object.entries(PLANS)) {
    const p = project(player, plan, model, { startWeekOfSeason: 1 });
    const shown = Object.fromEntries(SKILL_KEYS.map((k) => [k, disp(p.finalSkills[k])]));
    const ps = potentialScore(p.finalSkills);
    rows[name] = {
      displayed: shown,
      tsp10: SKILL_KEYS.reduce((a, k) => a + disp(p.finalSkills[k]), 0),
      outsideTsp: ['js', 'jr', 'od', 'ha', 'dr', 'pa'].reduce((a, k) => a + disp(p.finalSkills[k as never]), 0),
      capUsed: +ps.score.toFixed(1), capStage1: capThreshold(9), capPosition: ps.capPosition,
      pops: p.popCount,
    };
  }
  out[`elastic_${Math.round(scale * 100)}pct`] = rows;
}

console.log(JSON.stringify(out, null, 1));
