// READ-ONLY (SELECT only). Research probe for the cross-training evidence review
// (docs/research/training/forum-research/crosstraining-2026-08/FINDINGS.md).
//
// QUESTION: the BB manual says cross-training costs "the average player" ~10% of his primary
// training, and more for a one-dimensional player. CoachParrot's fitted representation of that
// same mechanic is the top-skill malus 0.925^(maxSkill - avg10). If CP's malus really is the
// manual's mechanic, then the AVERAGE real player's (max - avg10) gap should imply ~10%:
//     0.925^gap = 0.90  =>  gap = 1.35
// This script measures that gap on the real population we hold.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const K = ['jump_shot', 'jump_range', 'outside_def', 'handling', 'driving',
  'passing', 'inside_shot', 'inside_def', 'rebounding', 'shot_blocking'] as const;

const rows = (await sql`
  select distinct on (s.player_id)
    s.player_id, s.age, s.jump_shot, s.jump_range, s.outside_def, s.handling, s.driving,
    s.passing, s.inside_shot, s.inside_def, s.rebounding, s.shot_blocking
  from snapshots s
  where s.jump_shot is not null and s.shot_blocking is not null
  order by s.player_id, s.captured_at desc
`) as Record<string, number>[];

const gaps: number[] = [];
for (const r of rows) {
  const v = K.map((k) => Number(r[k]));
  if (v.some((x) => !Number.isFinite(x))) continue;
  const avg = v.reduce((a, b) => a + b, 0) / v.length;
  gaps.push(Math.max(...v) - avg);
}
gaps.sort((a, b) => a - b);
const q = (p: number) => gaps[Math.floor(p * (gaps.length - 1))];
const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
const malus = (g: number) => Math.pow(0.925, g);
console.log(JSON.stringify({
  n: gaps.length,
  meanGap: +mean.toFixed(3),
  medianGap: +q(0.5).toFixed(3),
  p10: +q(0.1).toFixed(3), p90: +q(0.9).toFixed(3), p99: +q(0.99).toFixed(3),
  malusAtMean: +malus(mean).toFixed(3),
  malusAtMedian: +malus(q(0.5)).toFixed(3),
  malusAtP90: +malus(q(0.9)).toFixed(3),
  malusAtP99: +malus(q(0.99)).toFixed(3),
  gapImplyingExactly10pct: +(Math.log(0.9) / Math.log(0.925)).toFixed(3),
}, null, 2));
