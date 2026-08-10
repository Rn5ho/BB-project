// SELECT-only + pure simulation. U-21 coach question (2026-08-07):
// what changes if we REVERSE the classic order — instead of rushing 1v1 at 18-19 and
// finishing with OD/PA/JS/JR, we train OD/JS/JR/PA first and run 1v1 in the age-21 season?
//
// Design: identical 56-week budget (same multiset of trainings), only the ORDER differs.
// That isolates sequencing from training-mix, which is exactly the question.
//   A (classic):  1v1(14) -> OD(14) -> JS(14) -> JR(7)  -> PA(7)
//   B (inverted): OD(14)  -> JS(14) -> JR(7)  -> PA(7)  -> 1v1(14)
//
// Swept across elastic strength, because S73 trimmed elastic by an unstated amount and
// the inverted order leans on the two largest pairs (ha<-od 0.050, jr<-od 0.037).
// NOTE: elastic in this model is boost-only; the specialization penalty is the separate
// top-skill malus (0.925^(max - avg)), which S73 did NOT announce any change to.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { project, type PlayerState, type WeekConfig } from '../../src/lib/training/engine';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';
import { SKILL_KEYS, skillsFromArray, type ModelParams } from '../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);

// Representative high-potential 18yo draftee: median skill vector from our own intake.
const draftees = (await sql`
  select distinct on (s.player_id) s.jump_shot js, s.jump_range jr, s.outside_def od,
         s.handling ha, s.driving dr, s.passing pa, s.inside_shot is_, s.inside_def id,
         s.rebounding rb, s.shot_blocking sb, p.height_cm as height
  from snapshots s join players p on p.bb_player_id = s.player_id
  where s.jump_shot is not null and s.age = 18 and s.potential >= 8 and s.season >= 72
    and p.height_cm is not null
  order by s.player_id, s.captured_at desc`) as Record<string, number>[];

const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const startSkills = skillsFromArray(
  ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is_', 'id', 'rb', 'sb'].map((k) => med(draftees.map((d) => d[k]))),
);
const heightCm = med(draftees.map((d) => d.height)) || 190;

const player: PlayerState = { skills: startSkills, age: 18, heightCm, potential: 8 };
const STAFF = { coachLevel: 5, youthTrainerLevel: 5, gymLevel: 0, trainingCourtLevel: 0 };
const blk = (id: number, n: number): WeekConfig[] => Array.from({ length: n }, () => ({ trainingId: id, ...STAFF }));

const ONE_ON_ONE = 15, OD = 9, JS = 1, JR = 6, PA = 19; // PG/SG rows; OD is single-position PG
const ORDERS = {
  A_classic_1v1_first: [...blk(ONE_ON_ONE, 14), ...blk(OD, 14), ...blk(JS, 14), ...blk(JR, 7), ...blk(PA, 7)],
  B_inverted_1v1_last: [...blk(OD, 14), ...blk(JS, 14), ...blk(JR, 7), ...blk(PA, 7), ...blk(ONE_ON_ONE, 14)],
};

// Scale every elastic pair to model the S73 trim (1.0 = pre-S73, 0 = removed entirely).
function withElastic(scale: number): ModelParams {
  const spec = BBSCOUT.elastic.value;
  if (spec.kind !== 'additive-pair') throw new Error('unexpected elastic kind');
  return {
    ...BBSCOUT,
    elastic: {
      ...BBSCOUT.elastic,
      value: { kind: 'additive-pair', pairs: spec.pairs.map((p) => ({ ...p, coeff: p.coeff * scale })) },
    },
  };
}

const disp = (v: number) => Math.ceil(v - 1e-9);
const out: Record<string, unknown> = {
  start: { skills: startSkills, heightCm, potential: 8, nDrafteesSampled: draftees.length },
  budget: '1v1 x14, OD x14, JS x14, JR x7, PA x7  (56 weeks, ages 18-21, coach 5 / YT 5, full minutes)',
};

for (const scale of [1.0, 0.75, 0.5, 0.0]) {
  const model = withElastic(scale);
  const res: Record<string, unknown> = {};
  for (const [name, plan] of Object.entries(ORDERS)) {
    const p = project(player, plan, model, { startWeekOfSeason: 1 });
    const shown = Object.fromEntries(SKILL_KEYS.map((k) => [k, disp(p.finalSkills[k])]));
    res[name] = {
      displayed: shown,
      tsp10: SKILL_KEYS.reduce((a, k) => a + disp(p.finalSkills[k]), 0),
      internalDrHa: { dr: +p.finalSkills.dr.toFixed(2), ha: +p.finalSkills.ha.toFixed(2) },
    };
  }
  const a = res.A_classic_1v1_first as { displayed: Record<string, number>; tsp10: number };
  const b = res.B_inverted_1v1_last as { displayed: Record<string, number>; tsp10: number };
  out[`elastic_${Math.round(scale * 100)}pct`] = {
    ...res,
    delta_B_minus_A: {
      ...Object.fromEntries(SKILL_KEYS.map((k) => [k, b.displayed[k] - a.displayed[k]])),
      tsp10: b.tsp10 - a.tsp10,
    },
  };
}

console.log(JSON.stringify(out, null, 1));
