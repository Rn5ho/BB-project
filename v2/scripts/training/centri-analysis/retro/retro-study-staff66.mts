// STAFF-SENSITIVITY VARIANT of retro-study.mts (2026-08-05 optimizer-vs-reality study).
// Identical to the original except staffAt() for the PRESCRIPTION sweep returns coach 6 /
// YT 6 (club gym/TC kept). The actual-path simulation keeps REAL club staff (unchanged
// staffAtReal) so only the prescription counterfactual moves.
//
// Usage (from v2/): npx tsx scripts/training/centri-analysis/retro/retro-study-staff66.mts <outDir> [--player "Name"]
// Emits one JSON per player + _summary.json. READ-ONLY (CSV + engine only, no DB writes).
import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PARSED = '../docs/research/training/calibration-cases/centri-u21/source/parsed';
const outDir = process.argv[2];
if (!outDir) throw new Error('usage: retro-study.mts <outDir> [--player Name]');
const onlyPlayer = process.argv.includes('--player') ? process.argv[process.argv.indexOf('--player') + 1] : null;
mkdirSync(outDir, { recursive: true });

const { STUDY_BUILDS, toSkillTargets, gateReport } = await import('./targets');
const { planJourney } = await import('../../../../src/lib/archetypes/derive/plans');
const { weekStep, displayed } = await import('../../../../src/lib/training/engine');
const { SKILL_KEYS, skillsFromArray } = await import('../../../../src/lib/training/types');
const { getTrainingType } = await import('../../../../src/lib/training/catalog');
type PlayerState = import('../../../../src/lib/training/engine').PlayerState;
type SkillKey = import('../../../../src/lib/training/types').SkillKey;

// ---- CSV loading (utf-8-sig BOM) ----
function csvRows(file: string): Record<string, string>[] {
  const raw = readFileSync(path.join(PARSED, file), 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const header = splitCsv(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(splitCsv(l).map((v, i) => [header[i], v])));
}
function splitCsv(line: string): string[] {
  const out: string[] = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') inQ = false; else cur += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const series = csvRows('series.csv');
const weeks = csvRows('weeks.csv');

// Club staff (owner-verified, round-1): pjtr576 coach 5 (→6 from 2025-07-26), YT 6 until
// 2025-04-04 rollover, gym 3, TC 0. alenokc coach 7, YT 7 (stale-report caveat), gym 3, TC 3.
function staffAtReal(author: string, date: string) {
  if (author === 'pjtr576') {
    return {
      coachLevel: date >= '2025-07-26' ? 6 : 5,
      youthTrainerLevel: date >= '2025-04-04' ? 0 : 6,
      gymLevel: 3, trainingCourtLevel: 0,
    };
  }
  return { coachLevel: 7, youthTrainerLevel: date >= '2025-06-13' ? 0 : 7, gymLevel: 3, trainingCourtLevel: 3 };
}
// Sensitivity override: prescription sweep runs at coach 6 / YT 6, club gym/TC kept.
function staffAt(author: string, _date: string) {
  return { coachLevel: 6, youthTrainerLevel: 6, gymLevel: 3, trainingCourtLevel: author === 'pjtr576' ? 0 : 3 };
}

// Known minutes deviations (verified by the round-2 minutes-rebuild agent). player→(clubWeekNo→minutes)
const MINUTES_DEV: Record<string, Record<number, number>> = {
  'Jure Plesavec': { 7: 47, 12: 47, 32: 0 },
  'Benjamin Piršič': { 25: 38, 36: 0 },
  'Rožle Ostroveršnik': { 23: 46, 32: 46, 33: 46, 35: 46, 36: 46, 45: 46, 46: 46 },
  'Francis Koštomaj': { 25: 26 },
  'Gojc Jalovec': { 35: 44 },
  'Goran Pokorn': { 1: 0 },
};

const SKILL_COLS: Record<SkillKey, string> = {
  js: 'js', jr: 'jr', od: 'od', ha: 'ha', dr: 'dr', pa: 'pa', is: 'is', id: 'id', rb: 'rb', sb: 'sb',
};

// Season week at a date: Centri arc seasons start ~2024-09-20 + n*98d (validated by the
// S73 salary probe's 98-day boundaries). Week = 1-based 7-day bucket within the season.
const SEASON_EPOCH = Date.parse('2024-09-20');
function seasonWeekAt(date: string): number {
  const days = Math.floor((Date.parse(date) - SEASON_EPOCH) / 86400000);
  return Math.min(14, Math.max(1, Math.floor((days % 98) / 7) + 1));
}

const players = [...new Set(series.map((r) => r.player_name))];
const summary: Record<string, unknown>[] = [];

for (const name of players) {
  if (onlyPlayer && name !== onlyPlayer) continue;
  const cards = series.filter((r) => r.player_name === name);
  const first = cards[0];
  const last = cards[cards.length - 1];
  const author = first.author;

  const startDisplayed = Object.fromEntries(SKILL_KEYS.map((k) => [k, Number(first[SKILL_COLS[k]])])) as Record<SkillKey, number>;
  const startState: PlayerState = {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, startDisplayed[k] - 0.5))),
    age: Number(first.age), heightCm: Number(first.height_cm), potential: Number(first.potential_num),
    ftSkill: Number(first.ft) - 0.5, staminaSkill: Number(first.st) - 0.5,
  };
  const startWeek = seasonWeekAt(first.report_date);

  // ---- actual-path simulation: the club's logged trainings from the first card on ----
  const clubWeeks = weeks
    .filter((w) => w.author === author && w.report_date >= first.report_date && w.training_key)
    .sort((a, b) => a.report_date.localeCompare(b.report_date));
  const ageByDate = new Map(cards.map((c) => [c.report_date, Number(c.age)]));
  let sim: PlayerState = { ...startState, skills: { ...startState.skills } };
  let simWeeks = 0;
  for (const w of clubWeeks) {
    if (w.report_date > last.report_date) break;
    const dev = MINUTES_DEV[name]?.[Number(w.week_no)];
    const minutes = dev ?? 48;
    const staff = staffAtReal(author, w.report_date);
    const r = weekStep(sim, { trainingId: Number(w.training_key), minutes, ...staff }, (await import('../../../../src/lib/training/models/bbscout')).BBSCOUT);
    const cardAge = ageByDate.get(w.report_date);
    sim = { ...sim, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter, age: cardAge ?? sim.age };
    simWeeks++;
  }
  const actualSimEnd = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(sim.skills[k])])) as Record<SkillKey, number>;
  const observedEnd = Object.fromEntries(SKILL_KEYS.map((k) => [k, Number(last[SKILL_COLS[k]])])) as Record<SkillKey, number>;

  // ---- optimizer sweep at the first-card state ----
  const staff0 = staffAt(author, first.report_date);
  const sweep = STUDY_BUILDS.map((b) => {
    const targets = toSkillTargets(b);
    try {
      const res = planJourney(startState, { age: startState.age, week: startWeek }, targets, b.floorSkill, { name: b.key, ...staff0 });
      const m1 = res.checkpoints.m1;
      const gatesAtM1 = m1 ? gateReport(b, m1) : { passed: [], failed: Object.entries(b.gates).map(([k, v]) => `${k}≥${v}`) };
      const endCp = res.checkpoints.end ?? res.checkpoints.m2 ?? null;
      const margin = endCp
        ? targets.reduce((a, t) => a + Math.min(2, (endCp[t.skill] ?? 0) - t.displayed), 0)
        : -99;
      return {
        build: b.key, label: b.label,
        playable: res.playable, finalized: res.finalized,
        gatesPassedAtM1: gatesAtM1.passed, gatesFailedAtM1: gatesAtM1.failed,
        marginAtEnd: margin, weeklyPopRate: +res.weeklyPopRate.toFixed(3),
        phases: res.phases.map((p) => ({
          label: p.label,
          blocks: p.blocks.map((bl) => `${getTrainingType(bl.trainingId).label}x${bl.weeks}`),
          weeks: p.blocks.reduce((a, bl) => a + bl.weeks, 0),
        })),
        checkpoints: res.checkpoints,
      };
    } catch (e) {
      return { build: b.key, label: b.label, error: String(e).slice(0, 200) };
    }
  });

  // value-v0 ranking: gates → finalized → margin
  const ranked = sweep
    .filter((s) => !('error' in s))
    .sort((a, b) => {
      const ga = (a as { gatesFailedAtM1: string[] }).gatesFailedAtM1.length;
      const gb = (b as { gatesFailedAtM1: string[] }).gatesFailedAtM1.length;
      if (ga !== gb) return ga - gb;
      const fa = (a as { finalized: boolean }).finalized ? 1 : 0;
      const fb = (b as { finalized: boolean }).finalized ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return (b as { marginAtEnd: number }).marginAtEnd - (a as { marginAtEnd: number }).marginAtEnd;
    });

  const out = {
    name, author, potential: startState.potential, heightCm: startState.heightCm,
    firstCard: { date: first.report_date, age: startState.age, seasonWeek: startWeek, skills: startDisplayed, tsp: Number(first.tsp) },
    lastCard: { date: last.report_date, age: Number(last.age), skills: observedEnd, tsp: Number(last.tsp) },
    actualPath: {
      loggedWeeksSimulated: simWeeks,
      coverageNote: author === 'alenokc' ? 'alenokc log has gaps — sim covers logged weeks only' : 'gapless',
      simulatedEnd: actualSimEnd,
      simVsObservedAbsErr: SKILL_KEYS.reduce((a, k) => a + Math.abs(actualSimEnd[k] - observedEnd[k]), 0),
    },
    staffUsed: staff0,
    prescriptionSweep: ranked,
    prescriptionErrors: sweep.filter((s) => 'error' in s),
  };
  writeFileSync(path.join(outDir, `${name.replace(/[^\w]/g, '_')}.json`), JSON.stringify(out, null, 1));
  summary.push({
    name, pot: startState.potential, ht: startState.heightCm, startAge: startState.age, startTsp: Number(first.tsp),
    top: ranked[0] && 'build' in ranked[0] ? `${(ranked[0] as { build: string }).build} (fail ${(ranked[0] as { gatesFailedAtM1: string[] }).gatesFailedAtM1.length} gates, margin ${(ranked[0] as { marginAtEnd: number }).marginAtEnd})` : 'none',
    actualSimAbsErr: out.actualPath.simVsObservedAbsErr,
  });
  console.log(`${name}: top=${summary[summary.length - 1].top} | actual-sim |err| vs observed: ${out.actualPath.simVsObservedAbsErr}`);
}
writeFileSync(path.join(outDir, '_summary.json'), JSON.stringify(summary, null, 1));
console.log('done:', summary.length, 'players');
