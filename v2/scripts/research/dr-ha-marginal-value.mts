// SELECT-only + pure simulation. The engine-computable half of the DR/HA question
// (owner decision: revise HA/DR club advice to 16-17, vs the community's 18-19?):
//
//   At the margin, is one more week of 1v1 (HA/DR primaries) worth more than a week
//   of OD directly — once the ha->od elastic (0.050, the biggest pair) is priced in?
//
// Design: 56-week arc (ages 18-19, coach 5 / YT 5, full minutes), plan = 1v1 x w
// followed by OD x (56 - w), sweeping w. The elastic dividend of a higher HA shows up
// as faster OD training in phase 2; the cost is the OD weeks foregone. Swept across
// elastic strength because S73 trimmed pairs by an unstated ("marginal") amount.
//
// CAVEAT: monolithic two-block plans — this is a MARGINAL-VALUE computation, not a
// realistic program (see concentration-study FINDINGS: real clubs switch ~every 2wk).
// Endpoint deltas between w values are the object of interest, not the endpoints.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { project, type PlayerState, type WeekConfig } from '../../src/lib/training/engine';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';
import { SKILL_KEYS, skillsFromArray, type ModelParams } from '../../src/lib/training/types';

const sql = neon(process.env.DATABASE_URL!);

// Same representative start as order-inversion-probe.mts: median skill vector of
// high-potential 18yo draftees from our own intake.
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

const ONE_ON_ONE = 15, OD = 9; // 1v1 (PG/SG), Outside Defense (PG)
const TOTAL = 56;

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
  design: `1v1 x w, then OD x (${TOTAL} - w); coach 5 / YT 5, full minutes, 56 weeks from age 18 wk 1`,
};

for (const scale of [1.0, 0.75, 0.5]) {
  const model = withElastic(scale);
  const rows: Record<string, unknown>[] = [];
  for (const w of [0, 4, 8, 12, 16, 20, 24, 28]) {
    const p = project(player, [...blk(ONE_ON_ONE, w), ...blk(OD, TOTAL - w)], model, { startWeekOfSeason: 1 });
    const f = p.finalSkills;
    rows.push({
      weeks1v1: w,
      ha: disp(f.ha), dr: disp(f.dr), od: disp(f.od),
      odInternal: +f.od.toFixed(2),
      tsp10: SKILL_KEYS.reduce((a, k) => a + disp(f[k]), 0),
    });
  }
  // marginal read-out: what each extra 4-week tranche of 1v1 buys/costs
  const marg = rows.slice(1).map((r, i) => ({
    from: rows[i].weeks1v1, to: r.weeks1v1,
    dHa: (r.ha as number) - (rows[i].ha as number),
    dDr: (r.dr as number) - (rows[i].dr as number),
    dOdInternal: +((r.odInternal as number) - (rows[i].odInternal as number)).toFixed(2),
    dTsp10: (r.tsp10 as number) - (rows[i].tsp10 as number),
  }));
  out[`elastic_${Math.round(scale * 100)}pct`] = { rows, marginalPer4wkTranche: marg };
}

console.log(JSON.stringify(out, null, 1));
