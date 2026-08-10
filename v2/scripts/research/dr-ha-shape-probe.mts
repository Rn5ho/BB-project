// SELECT-only. Does the "low DR/HA, high JS/JR/OD/PA" outside build exist in the wild?
//
// Motivation (U-21 coach question, 2026-08-07): is the 1v1 rush still the right opening,
// or is it better to spend those weeks on JS/JR/OD/PA and accept DR/HA 10-13?
// The Greek S72 bronze squad has DR 16-19 on 9/9 outside players — this checks whether
// that is medal-level necessity or just what everyone's training habit produces.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const CURRENT_SEASON = 73;

// Newest full-skill snapshot per player, any source, with derived age.
const rows = (await sql`
  with latest as (
    select distinct on (player_id) player_id, season, age, jump_shot js, jump_range jr,
           outside_def od, handling ha, driving dr, passing pa, inside_shot is_, inside_def id,
           rebounding rb, shot_blocking sb
    from snapshots
    where jump_shot is not null and age is not null and season is not null
    order by player_id, captured_at desc
  )
  select *, (age + (${CURRENT_SEASON} - season)) as derived_age from latest`) as Record<string, number>[];

const u21 = rows.filter((r) => r.derived_age >= 20 && r.derived_age <= 21);
// Outside-leaning: outside skill points clearly exceed inside ones.
const outside = u21.filter((r) => r.js + r.jr + r.od + r.ha + r.dr + r.pa > (r.is_ + r.id + r.rb + r.sb) * 1.3);

const pct = (n: number, d: number) => `${((100 * n) / d).toFixed(1)}%`;
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(p * (s.length - 1))] : NaN; };
const dist = (a: number[]) => ({ n: a.length, p10: q(a, 0.1), median: q(a, 0.5), p90: q(a, 0.9) });

// "NT-calibre" bar: owner's validated OD gate plus a real jumpshot.
const elite = outside.filter((r) => r.od >= 14 && r.js >= 16);

const shapeProposed = (r: Record<string, number>) =>
  r.js >= 19 && r.jr >= 15 && r.od >= 15 && r.pa >= 11 && r.dr <= 13 && r.ha <= 13;
const shapeRelaxed = (r: Record<string, number>) => r.js >= 17 && r.od >= 14 && r.dr <= 13 && r.ha <= 13;
const shape1v1 = (r: Record<string, number>) => r.js >= 16 && r.od >= 14 && r.dr >= 16;

console.log(JSON.stringify({
  universe: { allFullSkill: rows.length, age20_21: u21.length, outsideLeaning: outside.length, eliteOutside: elite.length },
  eliteOutside_skillDistribution: {
    note: 'age 20-21, outside-leaning, OD>=14 and JS>=16',
    DR: dist(elite.map((r) => r.dr)), HA: dist(elite.map((r) => r.ha)),
    JS: dist(elite.map((r) => r.js)), JR: dist(elite.map((r) => r.jr)),
    OD: dist(elite.map((r) => r.od)), PA: dist(elite.map((r) => r.pa)),
  },
  thresholds_amongEliteOutside: {
    'DR>=16': pct(elite.filter((r) => r.dr >= 16).length, elite.length),
    'HA>=16': pct(elite.filter((r) => r.ha >= 16).length, elite.length),
    'DR<=13': pct(elite.filter((r) => r.dr <= 13).length, elite.length),
    'HA<=13': pct(elite.filter((r) => r.ha <= 13).length, elite.length),
    'JR>=15': pct(elite.filter((r) => r.jr >= 15).length, elite.length),
    'PA>=11': pct(elite.filter((r) => r.pa >= 11).length, elite.length),
  },
  shapeCounts_amongOutside: {
    proposedExact: outside.filter(shapeProposed).length,
    proposedRelaxed_lowDrHa_goodJsOd: outside.filter(shapeRelaxed).length,
    classic1v1_highDr: outside.filter(shape1v1).length,
  },
  // Do the low-DR/HA ones that DO exist reach comparable total skill?
  tsp10Comparison: {
    lowDrHa: dist(outside.filter(shapeRelaxed).map((r) => r.js + r.jr + r.od + r.ha + r.dr + r.pa + r.is_ + r.id + r.rb + r.sb)),
    classic1v1: dist(outside.filter(shape1v1).map((r) => r.js + r.jr + r.od + r.ha + r.dr + r.pa + r.is_ + r.id + r.rb + r.sb)),
  },
}, null, 1));
