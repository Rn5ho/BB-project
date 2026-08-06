/**
 * Centri U-21: salary + DMI sub-model validation (agent: salary-dmi-gs).
 *
 * (a) SALARY — BB updates salary once per season. series.csv confirms: each player's
 *     salary is piecewise-constant with breaks exactly at BB season rollovers
 *     (2024-12-27 / 2025-04-04 / 2025-07-11, 98-day chain). So the real observations
 *     are player-season salaries (~25), predicted from the card nearest the rollover.
 * (b) DMI — Joey Ka 2010 (t160760.1): DMI = 100*int( RAW * gsTerm(GS) * stTerm(ST)
 *     * ftTerm(FT) / 10 ) where RAW = undeflated virtual salary
 *     = max_pos 300*exp(sum ln(mult)*skill)  ("salary deflation coefficient is not
 *     included here"). GS9 cards (no GS sublevel) give the cleanest test.
 *
 * Outputs JSON artifacts to the agent scratch dir.
 */
import * as fs from 'fs';
import * as path from 'path';
import { estimateSalary } from '../../../src/lib/training/salary';
import { SKILL_KEYS, ALL_POSITIONS, type Skills, type Position } from '../../../src/lib/training/types';

const OUT_DIR =
  'C:/Users/Rn5ho/AppData/Local/Temp/claude/D--ClaudeProjects-BB-project-v2/3cc08ba3-8a42-4d6b-9ea5-496b684e99bf/scratchpad/agents/salary-dmi-gs';
const SERIES = 'C:/Users/Rn5ho/Downloads/centri-u21/parsed/series.csv';

// ---- 2010 Joey Ka multipliers (identical to salary.ts SALARY_MULTIPLIERS) ----
const MULT_2010: Record<Position, number[]> = {
  PG: [1.025, 1.045, 1.08, 1.08, 1.04, 1.155, 1.0, 1.0, 1.035, 1.0],
  SG: [1.125, 1.15, 1.13, 1.0, 1.0, 1.0, 1.0, 1.0, 1.065, 1.0],
  SF: [1.18, 1.085, 1.065, 1.0, 1.0, 1.0, 1.0, 1.06, 1.09, 1.005],
  PF: [1.08, 1.0, 1.0, 1.0, 1.0, 1.0, 1.115, 1.115, 1.115, 1.06],
  C: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.138, 1.135, 1.13, 1.065],
};
// ---- 2019 buzzer-manager refit (t160760.17): salary = const * exp(sum coef*skill) ----
const COEF_2019: Record<Position, { c: number[]; base: number }> = {
  PG: { c: [0.030, 0.039, 0.072, 0.071, 0.036, 0.147, 0.001, 0.001, 0.036, 0.001], base: 228.0 },
  SG: { c: [0.107, 0.121, 0.124, 0.003, 0.002, 0.006, 0.002, 0.002, 0.063, 0.001], base: 220.7 },
  SF: { c: [0.160, 0.071, 0.059, 0.002, 0.002, 0.003, 0.001, 0.057, 0.086, 0.002], base: 242.9 },
  PF: { c: [0.078, 0.001, 0.001, 0.000, 0.001, 0.001, 0.107, 0.107, 0.106, 0.044], base: 246.6 },
  C: { c: [0.002, 0.001, 0.001, 0.001, 0.001, 0.001, 0.124, 0.125, 0.124, 0.051], base: 241.9 },
};

function raw2010(skills: number[]): { raw: number; best: Position } {
  let best: Position = 'PG';
  let bestV = -1;
  for (const pos of ALL_POSITIONS) {
    const v = 300 * Math.exp(MULT_2010[pos].reduce((a, m, i) => a + Math.log(m) * skills[i], 0));
    if (v > bestV) { bestV = v; best = pos; }
  }
  return { raw: bestV, best };
}
function raw2019(skills: number[]): { raw: number; best: Position } {
  let best: Position = 'PG';
  let bestV = -1;
  for (const pos of ALL_POSITIONS) {
    const s = COEF_2019[pos];
    const v = s.base * Math.exp(s.c.reduce((a, c, i) => a + c * skills[i], 0));
    if (v > bestV) { bestV = v; best = pos; }
  }
  return { raw: bestV, best };
}

// DMI terms (Joey Ka 2010)
const gsTerm = (gs: number) => 0.1 + 0.76 * Math.exp(-1.13567746 * (9 - gs)) + 0.015780656 * Math.pow(gs, 0.9);
const stTerm = (st: number) => 1 - 0.035 * (10 - st);
const ftTerm = (ft: number) => 1 + 0.018 * (ft - 1);
const dmiPred = (raw: number, gs: number, st: number, ft: number) =>
  100 * Math.trunc((raw * gsTerm(gs) * stTerm(st) * ftTerm(ft)) / 10);

// ---- CSV parse (quote-aware) ----
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const header = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

type Card = {
  player: string; date: string; age: number; skills: number[]; st: number; ft: number;
  gs: number | null; salary: number | null; dmi: number | null; weekNo: number; author: string;
};

const rows = parseCsv(fs.readFileSync(SERIES, 'utf8'));
const cards: Card[] = rows.map((r) => ({
  player: r.player_name,
  date: r.report_date,
  age: Number(r.age),
  skills: ['js', 'jr', 'od', 'ha', 'dr', 'pa', 'is', 'id', 'rb', 'sb'].map((k) => Number(r[k])),
  st: Number(r.st),
  ft: Number(r.ft),
  gs: r.game_shape === '' ? null : Number(r.game_shape),
  salary: r.salary === '' ? null : Number(r.salary),
  dmi: r.dmi === '' || Number(r.dmi) === 0 ? null : Number(r.dmi),
  weekNo: Number(r.week_no),
  author: r.author,
}));
cards.sort((a, b) => (a.player + a.date + String(a.weekNo).padStart(3, '0')).localeCompare(b.player + b.date + String(b.weekNo).padStart(3, '0')));

// =========================================================================
// (a) SALARY: player-season segments
// =========================================================================
// BB rollover dates covering the card range (98-day chain hitting 2024-12-27 exactly,
// which is where every player's salary change lands). Season numbers derived by
// back-counting from season 73 start 2026-07-31±3d (CLAUDE.md: rollover 72->73 ~2026-08-03).
const ROLLOVERS: { date: string; season: number }[] = [
  { date: '2024-09-20', season: 66 }, // first cards 2024-09-20 sit at/just after this start
  { date: '2024-12-27', season: 67 },
  { date: '2025-04-04', season: 68 },
  { date: '2025-07-11', season: 69 },
];
const dayMs = 86400000;
const d2t = (s: string) => new Date(s + 'T00:00:00Z').getTime();

type SegmentObs = {
  player: string; season: number; rollover: string; salaryObs: number; age: number;
  cardUsed: string; gapDays: number; skills: number[];
  predDeflated: number; bestPos: Position; impliedScale: number;
  raw2010: number; fullDeflation: number; // salaryObs / raw
  altCard?: string; altPredDeflated?: number; altImpliedScale?: number;
  nCardsInSegment: number;
};

const segments: SegmentObs[] = [];
const byPlayer = new Map<string, Card[]>();
for (const c of cards) {
  if (!byPlayer.has(c.player)) byPlayer.set(c.player, []);
  byPlayer.get(c.player)!.push(c);
}

for (const [player, pc] of byPlayer) {
  const withSal = pc.filter((c) => c.salary != null);
  // segment = run of identical salary
  const segs: { salary: number; cards: Card[] }[] = [];
  for (const c of withSal) {
    if (segs.length && segs[segs.length - 1].salary === c.salary) segs[segs.length - 1].cards.push(c);
    else segs.push({ salary: c.salary!, cards: [c] });
  }
  for (const seg of segs) {
    const first = seg.cards[0];
    // rollover that set this salary = latest rollover <= first card date (+3d tolerance for
    // the 2024-09-20 start where the card IS the rollover-day card)
    const ro = [...ROLLOVERS].reverse().find((r) => d2t(r.date) <= d2t(first.date) + 0.5 * dayMs);
    if (!ro) continue;
    // card nearest the rollover date (from this player's full card list, any salary)
    let nearest = pc[0];
    for (const c of pc) if (Math.abs(d2t(c.date) - d2t(ro.date)) < Math.abs(d2t(nearest.date) - d2t(ro.date))) nearest = c;
    const gapDays = Math.round((d2t(nearest.date) - d2t(ro.date)) / dayMs);
    const sk = Object.fromEntries(SKILL_KEYS.map((k, i) => [k, nearest.skills[i]])) as Skills;
    const est = estimateSalary(sk, { deflationScale: 1 });
    const r10 = raw2010(nearest.skills);
    const obs: SegmentObs = {
      player, season: ro.season, rollover: ro.date, salaryObs: seg.salary, age: first.age,
      cardUsed: nearest.date, gapDays, skills: nearest.skills,
      predDeflated: est.salary, bestPos: est.best, impliedScale: seg.salary / est.salary,
      raw2010: r10.raw, fullDeflation: seg.salary / r10.raw,
      nCardsInSegment: seg.cards.length,
    };
    // sensitivity: adjacent card on the other side of the rollover
    const other = pc
      .filter((c) => (d2t(nearest.date) - d2t(ro.date)) * (d2t(c.date) - d2t(ro.date)) < 0)
      .sort((a, b) => Math.abs(d2t(a.date) - d2t(ro.date)) - Math.abs(d2t(b.date) - d2t(ro.date)))[0];
    if (other) {
      const sk2 = Object.fromEntries(SKILL_KEYS.map((k, i) => [k, other.skills[i]])) as Skills;
      const est2 = estimateSalary(sk2, { deflationScale: 1 });
      obs.altCard = other.date;
      obs.altPredDeflated = est2.salary;
      obs.altImpliedScale = seg.salary / est2.salary;
    }
    segments.push(obs);
  }
}

// stats
const scales = segments.map((s) => s.impliedScale);
const sorted = [...scales].sort((a, b) => a - b);
const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

// residual (log implied scale) by age and by season
const byAge: Record<string, number[]> = {};
const bySeason: Record<string, number[]> = {};
for (const s of segments) {
  (byAge[s.age] ??= []).push(s.impliedScale);
  (bySeason[s.season] ??= []).push(s.impliedScale);
}

// error at the Neon-refit scale 0.7144
const NEON = 0.7144;
const errAtNeon = segments.map((s) => s.salaryObs / (s.predDeflated * NEON) - 1);

const salaryResult = {
  note: 'Salary is constant within a season per player (verified below); observations are player-season segments, not 253 cards.',
  segmentsN: segments.length,
  cardsN: cards.filter((c) => c.salary != null).length,
  perSegmentTable: segments,
  impliedScale: {
    min: sorted[0], p25: q(0.25), median: median(scales), p75: q(0.75), max: sorted[sorted.length - 1],
    mean: scales.reduce((a, b) => a + b, 0) / scales.length,
  },
  impliedScaleByAge: Object.fromEntries(Object.entries(byAge).map(([a, xs]) => [a, { n: xs.length, median: median(xs), min: Math.min(...xs), max: Math.max(...xs) }])),
  impliedScaleBySeason: Object.fromEntries(Object.entries(bySeason).map(([a, xs]) => [a, { n: xs.length, median: median(xs), min: Math.min(...xs), max: Math.max(...xs) }])),
  errAtNeonScale0_7144: {
    medianAbsPct: median(errAtNeon.map((e) => Math.abs(e))) * 100,
    median: median(errAtNeon) * 100,
    min: Math.min(...errAtNeon) * 100, max: Math.max(...errAtNeon) * 100,
  },
  fullDeflationObsOverRaw2010: {
    // salaryObs / undeflated-2010-raw — the whole deflation stack in one number
    perSeason: Object.fromEntries(
      Object.entries(
        segments.reduce((m: Record<string, number[]>, s) => { (m[s.season] ??= []).push(s.fullDeflation); return m; }, {}),
      ).map(([se, xs]) => [se, { n: xs.length, median: median(xs), min: Math.min(...xs), max: Math.max(...xs) }]),
    ),
  },
};

// verify within-season constancy explicitly
const constancy: { player: string; season: number; distinct: number[] }[] = [];
for (const [player, pc] of byPlayer) {
  for (const ro of ROLLOVERS) {
    const end = d2t(ro.date) + 97.5 * dayMs;
    const inSeason = pc.filter((c) => c.salary != null && d2t(c.date) >= d2t(ro.date) - 0.5 * dayMs && d2t(c.date) < end);
    const distinct = [...new Set(inSeason.map((c) => c.salary!))];
    if (distinct.length > 1) constancy.push({ player, season: ro.season, distinct });
  }
}
(salaryResult as any).withinSeasonViolations = constancy;

// =========================================================================
// (b) DMI
// =========================================================================
type DmiRow = {
  player: string; date: string; gs: number; st: number; ft: number; dmiObs: number;
  raw2010: number; raw2019: number; bestPos: Position;
  pred2010: number; pred2019: number;
  ratio2010: number; ratio2019: number; // obs/pred
  impliedRawFromDmi: number; // DMI/(10*terms) — at GS9 only meaningful (no GS sublevel)
};
const gs9Rows: DmiRow[] = [];
const gsOtherRows: (DmiRow & { termImplied2010: number; termLo: number; termHi: number; inBand: boolean })[] = [];

for (const c of cards) {
  if (c.dmi == null || c.gs == null) continue;
  const r10 = raw2010(c.skills);
  const r19 = raw2019(c.skills);
  const base: Omit<DmiRow, 'pred2010' | 'pred2019' | 'ratio2010' | 'ratio2019' | 'impliedRawFromDmi'> = {
    player: c.player, date: c.date, gs: c.gs, st: c.st, ft: c.ft, dmiObs: c.dmi,
    raw2010: r10.raw, raw2019: r19.raw, bestPos: r10.best,
  };
  if (c.gs === 9) {
    const p10 = dmiPred(r10.raw, 9, c.st, c.ft);
    const p19 = dmiPred(r19.raw, 9, c.st, c.ft);
    gs9Rows.push({
      ...base, pred2010: p10, pred2019: p19,
      ratio2010: c.dmi / p10, ratio2019: c.dmi / p19,
      impliedRawFromDmi: c.dmi / (10 * gsTerm(9) * stTerm(c.st) * ftTerm(c.ft)),
    });
  } else {
    // GS sublevel unknown: displayed g could be internal [g, g+1) (floor display) — test band
    const p10lo = dmiPred(r10.raw, c.gs, c.st, c.ft);
    const p10hi = dmiPred(r10.raw, Math.min(9, c.gs + 0.999999), c.st, c.ft);
    const termImplied = c.dmi / (10 * r10.raw * stTerm(c.st) * ftTerm(c.ft));
    gsOtherRows.push({
      ...base, pred2010: p10lo, pred2019: dmiPred(r19.raw, c.gs, c.st, c.ft),
      ratio2010: c.dmi / p10lo, ratio2019: 0,
      impliedRawFromDmi: 0,
      termImplied2010: termImplied,
      termLo: gsTerm(c.gs), termHi: gsTerm(Math.min(9, c.gs + 1)),
      inBand: termImplied >= gsTerm(c.gs) * 0.999 && termImplied <= gsTerm(Math.min(9, c.gs + 1)) * 1.001,
    });
  }
}

const r10s = gs9Rows.map((r) => r.ratio2010);
const r19s = gs9Rows.map((r) => r.ratio2019);
const dmiResult = {
  gs9CardsN: gs9Rows.length,
  ratioObsOverPred2010: { median: median(r10s), min: Math.min(...r10s), max: Math.max(...r10s), p25: [...r10s].sort((a, b) => a - b)[Math.floor(r10s.length * 0.25)], p75: [...r10s].sort((a, b) => a - b)[Math.floor(r10s.length * 0.75)] },
  ratioObsOverPred2019: { median: median(r19s), min: Math.min(...r19s), max: Math.max(...r19s) },
  withinPct2010: {
    w1: r10s.filter((r) => Math.abs(r - 1) <= 0.01).length,
    w5: r10s.filter((r) => Math.abs(r - 1) <= 0.05).length,
    w10: r10s.filter((r) => Math.abs(r - 1) <= 0.10).length,
    n: r10s.length,
  },
  perCardGs9: gs9Rows,
  gsBelow9: {
    n: gsOtherRows.length,
    inBandN: gsOtherRows.filter((r) => r.inBand).length,
    byGs: Object.fromEntries(
      [5, 6, 7, 8].map((g) => {
        const xs = gsOtherRows.filter((r) => r.gs === g);
        return [g, { n: xs.length, inBand: xs.filter((r) => r.inBand).length, termLo: xs[0]?.termLo, termHi: xs[0]?.termHi, impliedTerms: xs.map((r) => Number(r.termImplied2010.toFixed(4))) }];
      }),
    ),
    perCard: gsOtherRows,
  },
  dmiAllMultiplesOf100: cards.filter((c) => c.dmi != null).every((c) => c.dmi! % 100 === 0),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'salary-validation.json'), JSON.stringify(salaryResult, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'dmi-validation.json'), JSON.stringify(dmiResult, null, 2));

// console summary
console.log('=== SALARY ===');
console.log('segments:', salaryResult.segmentsN, 'within-season violations:', constancy.length);
console.log('implied deflationScale:', JSON.stringify(salaryResult.impliedScale));
console.log('by age:', JSON.stringify(salaryResult.impliedScaleByAge));
console.log('by season:', JSON.stringify(salaryResult.impliedScaleBySeason));
console.log('err at Neon 0.7144:', JSON.stringify(salaryResult.errAtNeonScale0_7144));
console.log('=== DMI ===');
console.log('GS9 n:', dmiResult.gs9CardsN, 'ratio2010:', JSON.stringify(dmiResult.ratioObsOverPred2010));
console.log('ratio2019:', JSON.stringify(dmiResult.ratioObsOverPred2019));
console.log('within pct 2010:', JSON.stringify(dmiResult.withinPct2010));
console.log('GS<9 band test:', dmiResult.gsBelow9.inBandN, '/', dmiResult.gsBelow9.n);
console.log('all DMI %100==0:', dmiResult.dmiAllMultiplesOf100);
