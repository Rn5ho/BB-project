// Greek bronze squad (S72 wk6-14) scored against the owner's viability gates and
// positional bands (owner-build-knowledge-2026-08.md) + in-season progression shape.
// Part of the "optimizer vs reality" external-validation study (2026-08-05).
// READ-ONLY: reads greece-s72 CSVs, writes JSON artifacts to <outDir>.
//
// Usage (from v2/): npx tsx scripts/training/centri-analysis/retro/greek-bands-scorecard.mts <outDir>
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const GREEK = 'D:/ClaudeProjects/BB-project/docs/research/market-archetypes/greece-s72';
const outDir = process.argv[2];
if (!outDir) throw new Error('usage: greek-bands-scorecard.mts <outDir>');
mkdirSync(outDir, { recursive: true });

function csvRows(file: string): Record<string, string>[] {
  const raw = readFileSync(path.join(GREEK, file), 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0].split(',');
  return lines.slice(1).map((l) => Object.fromEntries(l.split(',').map((v, i) => [header[i], v])));
}

const tidy = csvRows('greek_tidy.csv');
const deltas = csvRows('greek_deltas.csv');

const SKILLS = ['JS', 'JR', 'OD', 'HA', 'DR', 'PA', 'IS', 'ID', 'RB', 'SB'] as const;
type Skill = (typeof SKILLS)[number];
type Vec = Record<Skill, number>;

// ---- band encoding. provenance: 'owner' = number stated in the knowledge doc;
// 'study' = proxy number encoded by the study (owner said "high" without a number).
interface Band { skill: Skill; lo: number; hi: number | null; provenance: 'owner' | 'study'; note: string }
interface Gate { skill: Skill; min: number; soft: number; note: string } // soft = "possible/borderline" bar

const OUTSIDE_GATES: Gate[] = [{ skill: 'OD', min: 14, soft: 13, note: 'THE outside gate (13 borderline)' }];
const BIG_GATES: Gate[] = [
  { skill: 'ID', min: 15, soft: 14, note: 'defense first (14 possible)' },
  { skill: 'IS', min: 15, soft: 15, note: '16-17 preferred' },
  { skill: 'RB', min: 11, soft: 10, note: '10 possible, <10 really hard to play' },
];
const PF_GATES: Gate[] = [ // pf-twoway relaxation used by the study harness (targets.ts)
  { skill: 'ID', min: 14, soft: 14, note: 'PF relaxed (study harness pf-twoway)' },
  { skill: 'IS', min: 14, soft: 14, note: 'PF relaxed (study harness pf-twoway)' },
  { skill: 'RB', min: 11, soft: 10, note: 'same as big' },
];

const BANDS: Record<string, Band[]> = {
  PG: [
    { skill: 'OD', lo: 15, hi: 16, provenance: 'owner', note: 'ideally 15-16 (gate 14)' },
    { skill: 'PA', lo: 11, hi: 12, provenance: 'owner', note: 'ideally 11-12' },
    { skill: 'JS', lo: 13, hi: 16, provenance: 'owner', note: 'band 13-16' },
    { skill: 'HA', lo: 15, hi: 19, provenance: 'owner', note: 'min 15-16, practice 17-19' },
    { skill: 'DR', lo: 15, hi: 19, provenance: 'owner', note: 'min 15-16, practice 17-19' },
  ],
  SG: [
    { skill: 'JS', lo: 16, hi: null, provenance: 'study', note: 'owner: "high JS" (no number; harness uses 16)' },
    { skill: 'JR', lo: 14, hi: null, provenance: 'study', note: 'owner: "high JR" (no number; harness uses 14)' },
    { skill: 'OD', lo: 15, hi: 16, provenance: 'owner', note: 'outside OD preferred 15-16' },
    { skill: 'HA', lo: 15, hi: 19, provenance: 'owner', note: 'outside DR/HA min 15-16' },
    { skill: 'DR', lo: 15, hi: 19, provenance: 'owner', note: 'outside DR/HA min 15-16' },
    { skill: 'IS', lo: 9, hi: 12, provenance: 'owner', note: 'outside IS meaningful band 9-12' },
  ],
  SF: [
    { skill: 'OD', lo: 14, hi: 17, provenance: 'owner', note: '14-15 at season start, on to 16-17' },
    { skill: 'JS', lo: 14, hi: 17, provenance: 'owner', note: 'JS 14-17 ideal' },
    { skill: 'IS', lo: 11, hi: 14, provenance: 'owner', note: 'wing IS 11-14' },
    { skill: 'HA', lo: 15, hi: 19, provenance: 'owner', note: 'outside DR/HA min 15-16' },
    { skill: 'DR', lo: 15, hi: 19, provenance: 'owner', note: 'outside DR/HA min 15-16' },
  ],
  PF: [
    { skill: 'IS', lo: 16, hi: null, provenance: 'study', note: 'harness pf-twoway target' },
    { skill: 'ID', lo: 15, hi: null, provenance: 'study', note: 'harness pf-twoway target' },
    { skill: 'RB', lo: 12, hi: null, provenance: 'study', note: 'harness pf-twoway target' },
    { skill: 'JS', lo: 12, hi: null, provenance: 'owner', note: 'heavy IS training naturally lands JS 12-13' },
  ],
  C: [
    { skill: 'IS', lo: 18, hi: 20, provenance: 'owner', note: 'C full-in band' },
    { skill: 'ID', lo: 16, hi: 17, provenance: 'owner', note: 'C full-in band' },
    { skill: 'RB', lo: 12, hi: 16, provenance: 'owner', note: 'C full-in band' },
  ],
};

const CLASS: Record<string, 'outside' | 'big'> = { PG: 'outside', SG: 'outside', SF: 'outside', PF: 'big', C: 'big' };

// ---- build per-player week vectors ----
const players = [...new Set(tidy.map((r) => r.player))];
const byPlayer = new Map(players.map((p) => [p, tidy.filter((r) => r.player === p)]));

function vecAt(rows: Record<string, string>[], week: number): Vec | null {
  const r = rows.find((x) => Number(x.week) === week);
  if (!r) return null;
  return Object.fromEntries(SKILLS.map((s) => [s, Number(r[s])])) as Vec;
}

function position(rows: Record<string, string>[]): string {
  // coach labels appear from wk10
  const withPos = rows.filter((r) => r.position && r.position.length > 0);
  return withPos.length ? withPos[withPos.length - 1].position : '?';
}

interface Check { skill: Skill; value: number; verdict: string; ref: string; provenance: string }
function score(pos: string, v: Vec): { gates: Check[]; bands: Check[]; gateFails: number; gateSoftPasses: number } {
  const cls = CLASS[pos];
  const gates = cls === 'outside' ? OUTSIDE_GATES : pos === 'PF' ? PF_GATES : BIG_GATES;
  const gateChecks: Check[] = gates.map((g) => ({
    skill: g.skill, value: v[g.skill],
    verdict: v[g.skill] >= g.min ? 'PASS' : v[g.skill] >= g.soft ? 'SOFT-PASS' : 'FAIL',
    ref: `>=${g.min} (soft ${g.soft})`, provenance: 'owner',
  }));
  const bandChecks: Check[] = (BANDS[pos] ?? []).map((b) => ({
    skill: b.skill, value: v[b.skill],
    verdict: v[b.skill] < b.lo ? 'BELOW' : b.hi !== null && v[b.skill] > b.hi ? 'ABOVE' : 'IN-BAND',
    ref: b.hi !== null ? `${b.lo}-${b.hi}` : `>=${b.lo}`, provenance: b.provenance,
  }));
  return {
    gates: gateChecks, bands: bandChecks,
    gateFails: gateChecks.filter((c) => c.verdict === 'FAIL').length,
    gateSoftPasses: gateChecks.filter((c) => c.verdict === 'SOFT-PASS').length,
  };
}

const scorecard = players.map((name) => {
  const rows = byPlayer.get(name)!;
  const pos = position(rows);
  const firstWeek = Number(rows[0].week);
  const lastWeek = Number(rows[rows.length - 1].week);
  const vFirst = vecAt(rows, firstWeek)!;
  const vLast = vecAt(rows, lastWeek)!;
  return {
    name, position: pos, class: CLASS[pos] ?? '?', firstWeek, lastWeek,
    tspFirst: Number(rows[0].TSP10), tspLast: Number(rows[rows.length - 1].TSP10),
    first: { skills: vFirst, ...score(pos, vFirst) },
    last: { skills: vLast, ...score(pos, vLast) },
  };
});

// ---- team-level aggregation: where do Greeks sit vs each band? ----
const bandAgg: Record<string, { n: number; below: number; inBand: number; above: number; values: number[] }> = {};
for (const p of scorecard) {
  for (const c of p.last.bands) {
    const key = `${p.position}:${c.skill} (${c.ref})`;
    bandAgg[key] ??= { n: 0, below: 0, inBand: 0, above: 0, values: [] };
    bandAgg[key].n++;
    bandAgg[key].values.push(c.value);
    if (c.verdict === 'BELOW') bandAgg[key].below++;
    else if (c.verdict === 'ABOVE') bandAgg[key].above++;
    else bandAgg[key].inBand++;
  }
}

// ---- (b) in-season progression shape from deltas ----
// transitions: to_week 7..14. Phase A = to_week 7-9 (early), Phase B = 10-14 (late).
// wk14 capture censored (README) → also report B' = 10-13.
const posOf = new Map(scorecard.map((p) => [p.name, p.position]));
const clsOf = new Map(scorecard.map((p) => [p.name, p.class]));
const RATE = new Set(SKILLS as readonly string[]);

interface Pop { player: string; skill: string; to: number; delta: number }
const pops: Pop[] = deltas.map((d) => ({ player: d.player, skill: d.skill, to: Number(d.to_week), delta: Number(d.delta) }));
const positive = pops.filter((p) => p.delta > 0);
const negative = pops.filter((p) => p.delta < 0);

// player-week transitions per phase (players observed at both endpoints)
function transitions(toWeeks: number[]): number {
  let n = 0;
  for (const p of scorecard) for (const w of toWeeks) if (w > p.firstWeek && w <= p.lastWeek) n++;
  return n;
}
const phases = {
  A_wk7to9: { toWeeks: [7, 8, 9] },
  B_wk10to14: { toWeeks: [10, 11, 12, 13, 14] },
  Bprime_wk10to13_uncensored: { toWeeks: [10, 11, 12, 13] },
};
const phaseStats = Object.fromEntries(
  Object.entries(phases).map(([k, { toWeeks }]) => {
    const t = transitions(toWeeks);
    const all = positive.filter((p) => toWeeks.includes(p.to));
    const rate = all.filter((p) => RATE.has(p.skill));
    return [k, {
      playerWeekTransitions: t,
      popsAll: all.length, popsRateSkills: rate.length,
      popsPerPlayerWeek_all: +(all.length / t).toFixed(3),
      popsPerPlayerWeek_rate: +(rate.length / t).toFixed(3),
    }];
  }),
);

// per-class per-skill pop matrix (positive, whole window)
const popMatrix: Record<string, Record<string, number>> = { outside: {}, big: {} };
for (const p of positive) {
  const cls = clsOf.get(p.player) ?? '?';
  if (!popMatrix[cls]) continue;
  popMatrix[cls][p.skill] = (popMatrix[cls][p.skill] ?? 0) + 1;
}

// per-week pop counts (see the censoring visibly)
const perWeek: Record<number, number> = {};
for (const p of positive) perWeek[p.to] = (perWeek[p.to] ?? 0) + 1;

// center IS finalization: IS deltas of C-class players
const centerIS = scorecard.filter((p) => p.position === 'C').map((p) => ({
  name: p.name, IS_first: p.first.skills.IS, IS_last: p.last.skills.IS, gain: p.last.skills.IS - p.first.skills.IS,
}));
// outside OD progression
const outsideOD = scorecard.filter((p) => p.class === 'outside').map((p) => ({
  name: p.name, position: p.position, OD_first: p.first.skills.OD, OD_last: p.last.skills.OD, gain: p.last.skills.OD - p.first.skills.OD,
}));

const out = {
  meta: {
    source: 'greece-s72 (bronze squad, S72 wk6-14, coach-recorded displayed levels)',
    caveats: [
      'wk6 is mid-season: entering-season state was ~5 weeks earlier, so wk6 gate passes OVERSTATE season-entry state',
      'wk14 capture censored (3 pops only) — phase B reported with and without it',
      'positions are coach labels from wk10; two SB=21 values are coach estimates above display cap',
      'no potentials/heights in workbook',
    ],
    playerCount: players.length,
  },
  scorecard,
  bandAggregation: bandAgg,
  inSeason: {
    totalPositivePops: positive.length,
    totalNegativeDeltas: negative.length,
    negativeDetail: negative,
    phaseStats,
    perWeekPopCounts: perWeek,
    popMatrixByClass: popMatrix,
    centerISFinalization: centerIS,
    outsideODProgression: outsideOD,
  },
};
writeFileSync(path.join(outDir, 'greek-scorecard.json'), JSON.stringify(out, null, 1));

// console digest
console.log('=== gates at first obs (wk6/wk10) vs last obs (wk14) ===');
for (const p of scorecard) {
  const f = p.first.gates.map((g) => `${g.skill}${g.value}:${g.verdict[0]}`).join(' ');
  const l = p.last.gates.map((g) => `${g.skill}${g.value}:${g.verdict[0]}`).join(' ');
  console.log(`${p.name.padEnd(24)} ${p.position.padEnd(2)} first[${f}] last[${l}]`);
}
console.log('\n=== band aggregation (last obs) ===');
for (const [k, v] of Object.entries(bandAgg)) {
  console.log(`${k.padEnd(20)} n=${v.n} below=${v.below} in=${v.inBand} above=${v.above} values=[${v.values.join(',')}]`);
}
console.log('\n=== phase stats ===', JSON.stringify(phaseStats, null, 1));
console.log('pop matrix by class:', JSON.stringify(popMatrix));
console.log('center IS finalization:', JSON.stringify(centerIS));
console.log('per-week pops:', JSON.stringify(perWeek));
console.log('negative deltas:', JSON.stringify(negative));
