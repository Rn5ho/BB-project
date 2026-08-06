// Universe distributions for the Greek-external-validation study (2026-08-05):
// (c) JR distribution ages 20-21 S72-73 (JR>=14 / >=16 by height band + JS joint) and
// (d) ID distribution of OUTSIDE players ages 20-21 (verify owner's "defenders sit at 6-8").
// READ-ONLY SELECTs against Neon. Usage (from v2/):
//   npx tsx scripts/training/centri-analysis/retro/greek-universe-queries.mts <outDir>
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2];
if (!outDir) throw new Error('usage: greek-universe-queries.mts <outDir>');
mkdirSync(outDir, { recursive: true });
const sql = neon(process.env.DATABASE_URL!);

// Latest FULL snapshot per player captured at age 20/21 in season 72/73.
// Universe bias (carry into findings): full-skill snapshots come from market sweeps
// (pot>=6 listings, all countries), Slovenian census, and api/manual full captures —
// NOT a uniform sample of all BB players.
const rows = await sql`
  with latest_full as (
    select distinct on (player_id)
      player_id, season, age, source, captured_at,
      jump_shot, jump_range, outside_def, handling, driving, passing,
      inside_shot, inside_def, rebounding, shot_blocking, potential
    from snapshots
    where jump_range is not null and inside_def is not null and jump_shot is not null
      and season in (72, 73) and age in (20, 21)
    order by player_id, captured_at desc
  )
  select lf.*, p.height_cm, p.best_position, p.country_id, p.nationality, p.name
  from latest_full lf
  join players p on p.bb_player_id = lf.player_id
`;
console.log('universe rows (latest full snapshot, age 20-21, S72-73):', rows.length);

type Row = (typeof rows)[number];
const heightBand = (h: number | null) => h == null ? 'unknown' : h <= 198 ? '<=198 (outside)' : h <= 205 ? '199-205 (mid)' : '>=206 (inside)';

// ---- (c) JR distribution ----
function jrStats(sub: Row[]) {
  const jr = sub.map((r) => Number(r.jump_range));
  const hist: Record<number, number> = {};
  for (const v of jr) hist[v] = (hist[v] ?? 0) + 1;
  const ge14 = sub.filter((r) => Number(r.jump_range) >= 14);
  const ge16 = sub.filter((r) => Number(r.jump_range) >= 16);
  return {
    n: sub.length, hist,
    ge14: ge14.length, ge16: ge16.length,
    pctGe14: sub.length ? +(100 * ge14.length / sub.length).toFixed(2) : null,
    pctGe16: sub.length ? +(100 * ge16.length / sub.length).toFixed(2) : null,
  };
}
const jrAll = jrStats(rows);
const jrByAge = { age20: jrStats(rows.filter((r) => r.age === 20)), age21: jrStats(rows.filter((r) => r.age === 21)) };
const jrByBand = Object.fromEntries(
  ['<=198 (outside)', '199-205 (mid)', '>=206 (inside)', 'unknown'].map((b) => [b, jrStats(rows.filter((r) => heightBand(r.height_cm) === b))]),
);
// JR>=14: what JS rides alongside? (owner: JR value scales with JS)
const jrHigh = rows.filter((r) => Number(r.jump_range) >= 14).map((r) => ({
  playerId: r.player_id, name: r.name, age: r.age, height: r.height_cm, pos: r.best_position,
  nat: r.nationality, jr: Number(r.jump_range), js: Number(r.jump_shot), od: Number(r.outside_def),
  source: r.source, potential: r.potential,
}));
const jsAmongJrHigh: Record<number, number> = {};
for (const r of jrHigh) jsAmongJrHigh[r.js] = (jsAmongJrHigh[r.js] ?? 0) + 1;
const jr16List = jrHigh.filter((r) => r.jr >= 16);

// ---- (d) ID distribution of OUTSIDE players ----
function idStats(sub: Row[]) {
  const vals = sub.map((r) => Number(r.inside_def)).sort((a, b) => a - b);
  const hist: Record<number, number> = {};
  for (const v of vals) hist[v] = (hist[v] ?? 0) + 1;
  const in68 = vals.filter((v) => v >= 6 && v <= 8).length;
  const ge9 = vals.filter((v) => v >= 9).length;
  const le5 = vals.filter((v) => v <= 5).length;
  const median = vals.length ? vals[Math.floor(vals.length / 2)] : null;
  return {
    n: vals.length, hist, median,
    le5, in6to8: in68, ge9,
    pctLe5: vals.length ? +(100 * le5 / vals.length).toFixed(2) : null,
    pct6to8: vals.length ? +(100 * in68 / vals.length).toFixed(2) : null,
    pctGe9: vals.length ? +(100 * ge9 / vals.length).toFixed(2) : null,
  };
}
const GUARD_WING = new Set(['PG', 'SG', 'SF', 'G', 'GF', 'SW']);
const outsideByHeight = rows.filter((r) => r.height_cm != null && r.height_cm <= 202);
const outsideByPos = rows.filter((r) => r.best_position && GUARD_WING.has(r.best_position));
const outsideEither = rows.filter((r) => (r.height_cm != null && r.height_cm <= 202) || (r.best_position && GUARD_WING.has(r.best_position)));
const bestPosValues = await sql`select best_position, count(*)::int n from players group by 1 order by 2 desc`;

const idOut = {
  definitionNote: 'outside = height<=202cm OR bestPosition guard/wing (per study brief); three variants reported',
  bestPositionValuesInDb: bestPosValues,
  byHeightOnly: idStats(outsideByHeight),
  byPositionOnly: idStats(outsideByPos),
  byEither: idStats(outsideEither),
  byEither_age21only: idStats(outsideEither.filter((r) => r.age === 21)),
};

const out = {
  meta: {
    universe: 'latest full snapshot per player, snapshot age in (20,21), snapshot season in (72,73)',
    bias: 'market (pot>=6 listings) + Slovenian census + api full captures — not uniform BB population',
    totalPlayers: rows.length,
    sourceBreakdown: rows.reduce((a: Record<string, number>, r) => { a[r.source] = (a[r.source] ?? 0) + 1; return a; }, {}),
    ageBreakdown: { age20: rows.filter((r) => r.age === 20).length, age21: rows.filter((r) => r.age === 21).length },
  },
  jr: { all: jrAll, byAge: jrByAge, byHeightBand: jrByBand, jsDistributionAmongJrGe14: jsAmongJrHigh, jrGe16Players: jr16List, jrGe14Count: jrHigh.length },
  idOutside: idOut,
};
writeFileSync(path.join(outDir, 'universe-distributions.json'), JSON.stringify(out, null, 1));

console.log('JR all:', JSON.stringify(jrAll));
console.log('JR by age:', JSON.stringify(jrByAge));
console.log('JR by band:', JSON.stringify(jrByBand));
console.log('JR>=16 players:', JSON.stringify(jr16List, null, 1));
console.log('JS among JR>=14:', JSON.stringify(jsAmongJrHigh));
console.log('ID outside:', JSON.stringify(idOut, null, 1).slice(0, 4000));
