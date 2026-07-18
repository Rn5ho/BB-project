// Compare the 2026-07 community pastes (YkDVRdJJ training effects, 2DHDx0uG height
// multipliers — resolved as a transcription of the DEPLOYED BuzzerIQ model, see
// docs/research/training/user-notes/community-paste-2026-07.md) against the project models,
// then score paste-based variants on the own-team calibration cases.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { replayCase, caseFromScrapedHistory, type ReplayCase } from '../../src/lib/training/replay';
import { BBSCOUT } from '../../src/lib/training/models/bbscout';
import { CP_RATES, CP_HEIGHT_STEPS, cpHeightTable } from '../../src/lib/training/models/coach-parrot';
import { getTrainingType } from '../../src/lib/training/catalog';
import { SKILL_KEYS, type HeightTable, type ModelParams, type RateRow, type SkillKey } from '../../src/lib/training/types';

// ─── Paste 1: trainingEffects (pastebin YkDVRdJJ), mapped to catalog ids ─────
// Labels are the paste's own; mapping notes where its naming differs from the
// real dropdown (catalog.ts).
const PASTE_RATES: Array<{ id: number; label: string; row: RateRow; note?: string }> = [
  { id: 1, label: 'JS (PG/SG)', row: { js: 0.52, jr: 0.2, dr: 0.05, ha: 0.05 } },
  { id: 2, label: 'JS (SF/PF)', row: { js: 0.35, jr: 0.15, is: 0.25 } },
  { id: 3, label: 'JS (SG/SF)', row: { js: 0.5, jr: 0.1, dr: 0.05, ha: 0.05 } },
  { id: 4, label: 'JS (team)', row: { js: 0.22, jr: 0.04, dr: 0.02, ha: 0.02 } },
  { id: 5, label: 'JR (SG)', row: { js: 0.2, jr: 0.4, dr: 0.05, ha: 0.05 } },
  { id: 6, label: 'JR (PG)', row: { js: 0.15, jr: 0.3, dr: 0.0375, ha: 0.0375 }, note: 'paste says "PG" — no such drill; values match JR (PG/SG) = id 6' },
  { id: 7, label: 'JR (SG/SF)', row: { js: 0.15, jr: 0.3, dr: 0.0375, ha: 0.0375 } },
  { id: 8, label: 'JR (team)', row: { js: 0.05, jr: 0.1, dr: 0.0125, ha: 0.0125 } },
  { id: 9, label: 'OD (PG)', row: { od: 0.5, dr: 0.05, ha: 0.05, id: 0.1 } },
  { id: 10, label: 'OD (PG/SG)', row: { od: 0.375, dr: 0.0375, ha: 0.0375, id: 0.075 } },
  { id: 11, label: 'OD(PG/SG/SF)', row: { od: 0.2, dr: 0.02, ha: 0.02, id: 0.04 } },
  { id: 12, label: 'HA (PG)', row: { od: 0.1, dr: 0.4, ha: 0.5 } },
  { id: 13, label: 'HA (PG/SG)', row: { od: 0.075, dr: 0.0375, ha: 0.045 }, note: 'NOT a typo: probe 36 confirms the deployed model returns exactly this (dr 8x, ha 8.3x below the 0.75-dilution pattern; CP: dr 0.3, ha 0.375)' },
  { id: 14, label: 'HA (PG/SG/SF)', row: { od: 0.04, dr: 0.2, ha: 0.25 } },
  { id: 15, label: '1v1 (PG/SG)', row: { js: 0.35, dr: 0.45, ha: 0.38 } },
  { id: 16, label: '1v1 (SF/PF)', row: { js: 0.18, dr: 0.45, ha: 0.38, is: 0.19 } },
  { id: 17, label: '1v1 (team)', row: { js: 0.088, dr: 0.176, ha: 0.22, is: 0.088 } },
  { id: 18, label: 'PA (PG)', row: { dr: 0.16, ha: 0.16, pa: 0.6 } },
  { id: 19, label: 'PA (PG/SG)', row: { dr: 0.12, ha: 0.12, pa: 0.45 } },
  { id: 20, label: 'PA (team)', row: { dr: 0.04, ha: 0.04, pa: 0.15 } },
  { id: 21, label: 'IS (C)', row: { js: 0.13, is: 0.5, id: 0.1 } },
  { id: 22, label: 'IS (PF/C)', row: { js: 0.075, is: 0.375, id: 0.0375 } },
  { id: 23, label: 'IS (SF/PF/C)', row: { js: 0.04, is: 0.2, id: 0.02 } },
  { id: 24, label: 'ID (C)', row: { is: 0.1, id: 0.5, sb: 0.1 } },
  { id: 25, label: 'ID (PF/C)', row: { is: 0.0375, id: 0.375, sb: 0.075 } },
  { id: 26, label: 'ID (SF/PF/C)', row: { is: 0.02, id: 0.2, sb: 0.04 } },
  { id: 27, label: 'RB (PF/C)', row: { is: 0.05, id: 0.05, rb: 0.5 } },
  { id: 28, label: 'RB (team)', row: { is: 0.022, id: 0.022, rb: 0.22 } },
  { id: 29, label: 'SB (C)', row: { id: 0.2, rb: 0.1, sb: 0.5 } },
  { id: 30, label: 'SB (PF/C)', row: { id: 0.15, rb: 0.075, sb: 0.375 } },
  { id: 31, label: 'SB (team)', row: { id: 0.08, rb: 0.04, sb: 0.2 }, note: 'paste says "team" — real drill is SB (SF/PF/C) = id 31; values match CP id 31' },
];

// ─── Paste 2: heightMultipliers (pastebin 2DHDx0uG) ──────────────────────────
// js/ha/pa flat 1.0, dr flat 0.95, jr/od = 1.5 declining 0.05/step,
// id/rb/sb = 0.5 rising 0.05/step, IS its own gentler low-end curve.
const PASTE_IS = [0.65, 0.7, 0.75, 0.78, 0.83, 0.85, 0.88, 0.93, 0.95, 0.97, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55];
function pasteHeightTable(): HeightTable {
  const n = CP_HEIGHT_STEPS.length;
  const declining = Array.from({ length: n }, (_, i) => Math.round((1.5 - 0.05 * i) * 100) / 100);
  const rising = Array.from({ length: n }, (_, i) => Math.round((0.5 + 0.05 * i) * 100) / 100);
  const flat = (v: number) => Array.from({ length: n }, () => v);
  const bySkill = {} as Record<SkillKey, number[]>;
  for (const k of SKILL_KEYS) {
    bySkill[k] =
      k === 'jr' || k === 'od' ? [...declining]
      : k === 'id' || k === 'rb' || k === 'sb' ? [...rising]
      : k === 'is' ? [...PASTE_IS]
      : k === 'dr' ? flat(0.95)
      : flat(1); // js, ha, pa
  }
  return { stepsCm: [...CP_HEIGHT_STEPS], bySkill };
}

// ─── Part 1: rate matrix diff ────────────────────────────────────────────────
console.log('══ PART 1: paste trainingEffects vs CP_RATES (= bbscout rates) ══');
let diffCells = 0, sameCells = 0;
for (const { id, label, row, note } of PASTE_RATES) {
  const cp = CP_RATES[id];
  const skills = new Set([...Object.keys(row), ...Object.keys(cp)]) as Set<SkillKey>;
  const diffs: string[] = [];
  for (const k of skills) {
    const a = row[k] ?? 0;
    const b = cp[k] ?? 0;
    if (Math.abs(a - b) > 1e-9) { diffs.push(`${k}: paste ${a} vs cp ${b} (${b ? (a / b).toFixed(2) + 'x' : 'new'})`); diffCells++; }
    else sameCells++;
  }
  if (diffs.length > 0 || note) {
    console.log(`id ${String(id).padStart(2)} ${getTrainingType(id).label.padEnd(28)} [paste: ${label}]${note ? `  NOTE: ${note}` : ''}`);
    for (const d of diffs) console.log(`      ${d}`);
  }
}
console.log(`cells identical: ${sameCells}, cells differing: ${diffCells}\n`);

// ─── Part 2: height table diff ───────────────────────────────────────────────
console.log('══ PART 2: paste heightMultipliers vs bbscout height table ══');
const bb = cpHeightTable(1.0);
const paste = pasteHeightTable();
for (const k of SKILL_KEYS) {
  const diffs = CP_HEIGHT_STEPS.map((cm, i) => ({ cm, a: paste.bySkill[k][i], b: bb.bySkill[k][i] }))
    .filter((d) => Math.abs(d.a - d.b) > 1e-9);
  if (diffs.length === 0) { console.log(`${k}: identical`); continue; }
  console.log(`${k}: ${diffs.length}/${CP_HEIGHT_STEPS.length} steps differ — ` +
    diffs.slice(0, 6).map((d) => `${d.cm}cm ${d.a} vs ${d.b}`).join(', ') + (diffs.length > 6 ? ', …' : ''));
}
console.log();

// ─── Part 3: empirical replay on own-team calibration cases ─────────────────
console.log('══ PART 3: replay calibration-cases/auto under paste-variant models ══');
function variant(id: string, opts: { rates?: boolean; height?: boolean }): ModelParams {
  const v = structuredClone(BBSCOUT);
  v.id = id as ModelParams['id'];
  if (opts.rates) {
    v.rates = { ...v.rates, value: Object.fromEntries(PASTE_RATES.map((p) => [p.id, p.row])) };
  }
  if (opts.height) v.height = { ...v.height, value: pasteHeightTable() };
  return v;
}
// Single-claim ablations so no result is confounded by another change.
function heightAblation(id: string, claims: { haFlat?: boolean; dr095?: boolean; isCurve?: boolean }): ModelParams {
  const v = structuredClone(BBSCOUT);
  v.id = id as ModelParams['id'];
  const table = cpHeightTable(1.0);
  const n = CP_HEIGHT_STEPS.length;
  if (claims.haFlat) table.bySkill.ha = Array.from({ length: n }, () => 1);
  if (claims.dr095) table.bySkill.dr = Array.from({ length: n }, () => 0.95);
  if (claims.isCurve) table.bySkill.is = [...PASTE_IS];
  v.height = { ...v.height, value: table };
  return v;
}
// Paste rates with HA (PG/SG) replaced by the real-game-plausible 0.75 dilution
// of the HA (PG) row (od 0.075, dr 0.3, ha 0.375) — the deployed row (probe 36) is a
// BuzzerIQ oddity no real-game source supports. Note: paste dilution is 0.75 on primaries
// in all 8 two-position families but on secondaries only in 5 of 8 (IS/ID PF-C deviate).
function pasteRatesTypoFixed(id: string): ModelParams {
  const v = variant(id, { rates: true });
  v.rates = { ...v.rates, value: { ...v.rates.value, 13: { od: 0.075, dr: 0.3, ha: 0.375 } } };
  return v;
}
const models: ModelParams[] = [
  BBSCOUT,
  variant('paste-height', { height: true }),
  variant('paste-rates', { rates: true }),
  variant('paste-both', { rates: true, height: true }),
  heightAblation('h-ha-flat', { haFlat: true }),
  heightAblation('h-dr-095', { dr095: true }),
  heightAblation('h-is-curve', { isCurve: true }),
  pasteRatesTypoFixed('paste-rates-fix13'),
];

const CASE_DIR = path.resolve(process.cwd(), '..', 'docs', 'research', 'training', 'calibration-cases', 'auto');
function loadScrapedCase(file: string): ReplayCase {
  const c = JSON.parse(readFileSync(file, 'utf8'));
  return caseFromScrapedHistory({
    label: c.label, rawWeeks: c.rawWeeks, heightCm: c.player.heightCm,
    potential: c.player.potential ?? null, snapshotAge: c.player.age ?? null,
    endSkills: c.endSkillsDisplayed ?? {}, endStamina: c.player.startStamina ?? null,
    endFreeThrow: c.player.startFreeThrow ?? null,
    coachLevel: c.coachLevel, youthTrainerLevel: c.youthTrainerLevel,
    gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
  });
}
const files = readdirSync(CASE_DIR).filter((f) => f.endsWith('.json')).map((f) => path.join(CASE_DIR, f));
const cases = files.map(loadScrapedCase);
console.log(`${cases.length} cases, ${cases.reduce((a, c) => a + c.weeks.length, 0)} weeks, ` +
  `${cases.reduce((a, c) => a + c.weeks.reduce((x, w) => x + Object.keys(w.observedPops).length, 0), 0)} scored pops, ` +
  `heights: ${cases.map((c) => c.heightCm).join(', ')}`);
// Coverage: which drills does the ground truth actually exercise, at which heights?
const drillWeeks = new Map<number, { weeks: number; heights: Set<number> }>();
for (const c of cases) {
  for (const w of c.weeks) {
    const e = drillWeeks.get(w.trainingId) ?? { weeks: 0, heights: new Set<number>() };
    e.weeks++; e.heights.add(c.heightCm);
    drillWeeks.set(w.trainingId, e);
  }
}
console.log('drill coverage: ' + [...drillWeeks.entries()].sort((a, b) => b[1].weeks - a[1].weeks)
  .map(([id, e]) => `${getTrainingType(id).label} ×${e.weeks}w @${[...e.heights].sort((a, b) => a - b).join('/')}cm`).join('; '));
for (const m of models) {
  let hits = 0, misses = 0, fa = 0, err = 0, n = 0, exact = 0;
  for (const c of cases) {
    const r = replayCase(c, m);
    hits += r.hits; misses += r.misses; fa += r.falseAlarms; err += r.endAbsErr; n += r.endCount; exact += r.endExact;
  }
  console.log(`${m.id.padEnd(14)} pop recall ${((hits / (hits + misses)) * 100).toFixed(0)}% (${hits}/${hits + misses}), ` +
    `false alarms ${fa} | final-skill exact ${exact}/${n} (${((exact / n) * 100).toFixed(0)}%), MAE ${(err / n).toFixed(3)}`);
}
