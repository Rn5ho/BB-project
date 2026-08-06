// Shared-training-slot study (retro, pjtr576 trio): BB clubs pick ONE training per week
// for the whole roster. pjtr576 trained Piršič/Plesavec/Ostroveršnik IDENTICALLY for 53
// gapless weeks — this script searches for the best SHARED weekly sequence (one training
// for all three, each stepped with the real engine on the club's real 53-week timeline,
// real staff changes, real minutes deviations) and compares four end states at each
// player's age-21 entry:
//   (1) per-player prescribed optimum (retro-study.mts sweep, --retro dir)
//   (2) best SHARED plan (this beam search)
//   (3) the club's ACTUAL logged sequence, simulated
//   (4) observed reality (weekly cards)
//
// Usage (from v2/):
//   npx tsx scripts/training/centri-analysis/retro/shared-slot-study.mts <outDir> \
//     --retro <retroStudyOutDir> [--scheme A|B] [--beam N]
//
// Scheme A = harness value-v0 top build per player (Plesavec -> wing-twoway).
// Scheme B = class-consistent all-big assignment (Plesavec -> pf-twoway, his best big).
// READ-ONLY: CSV + engine only, no DB, no BB calls. New file — does not touch retro-study.mts.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PARSED = '../docs/research/training/calibration-cases/centri-u21/source/parsed';
const outDir = process.argv[2];
if (!outDir) throw new Error('usage: shared-slot-study.mts <outDir> --retro <dir> [--scheme A|B] [--beam N]');
const argOf = (flag: string): string | null =>
  process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : null;
const retroDir = argOf('--retro');
const scheme = (argOf('--scheme') ?? 'B') as 'A' | 'B';
const beamWidth = Number(argOf('--beam') ?? 96);
mkdirSync(outDir, { recursive: true });

const { STUDY_BUILDS, toSkillTargets, gateReport } = await import('./targets');
const { weekStep, displayed } = await import('../../../../src/lib/training/engine');
const { SKILL_KEYS, skillsFromArray } = await import('../../../../src/lib/training/types');
const { getTrainingType, TRAINING_CATALOG } = await import('../../../../src/lib/training/catalog');
const { BBSCOUT } = await import('../../../../src/lib/training/models/bbscout');
type PlayerState = import('../../../../src/lib/training/engine').PlayerState;
type SkillKey = import('../../../../src/lib/training/types').SkillKey;
type Skills = import('../../../../src/lib/training/types').Skills;

// ---- CSV loading (same conventions as retro-study.mts) ----
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
const weeksCsv = csvRows('weeks.csv');

// Club staff timeline (owner-verified): pjtr576 coach 5 (→6 from 2025-07-26), YT 6 until
// 2025-04-04 rollover, gym 3, TC 0. Same function as retro-study.mts (copied, unmodified).
function staffAt(date: string) {
  return {
    coachLevel: date >= '2025-07-26' ? 6 : 5,
    youthTrainerLevel: date >= '2025-04-04' ? 0 : 6,
    gymLevel: 3, trainingCourtLevel: 0,
  };
}

// Known minutes deviations (round-2 minutes-rebuild agent), keyed by club week_no.
const MINUTES_DEV: Record<string, Record<number, number>> = {
  'Jure Plesavec': { 7: 47, 12: 47, 32: 0 },
  'Benjamin Piršič': { 25: 38, 36: 0 },
  'Rožle Ostroveršnik': { 23: 46, 32: 46, 33: 46, 35: 46, 36: 46, 45: 46, 46: 46 },
};

// ---- club timeline: 53 consecutive weeks on the 14-week season grid ----
const clubWeeks = weeksCsv
  .filter((w) => w.author === 'pjtr576' && w.training_key)
  .sort((a, b) => Number(a.week_no) - Number(b.week_no));
if (clubWeeks.length !== 53) throw new Error(`expected 53 pjtr576 weeks, got ${clubWeeks.length}`);
const timeline = clubWeeks.map((w, i) => ({
  weekNo: i + 1,
  date: w.report_date,
  actualTrainingId: Number(w.training_key),
  staff: staffAt(w.report_date),
}));

// ---- players: start states from first card, age = startAge + seasonIdx on the grid ----
interface StudyPlayer {
  name: string;
  startAge: number;
  m1Week: number;   // state AFTER this many trained weeks = entering age-21 season week 1
  m2Week: number;   // entering age-21 season week 7 (playoffs)
  u21EndWeek: number; // last trained week inside the age-21 season (capped at data end)
  buildKey: string;
  heightCm: number;
  potential: number;
  start: PlayerState;
}
const BUILD_ASSIGNMENT: Record<'A' | 'B', Record<string, string>> = {
  // A = retro-harness value-v0 top build; B = class-consistent best BIG build.
  A: { 'Benjamin Piršič': 'pf-twoway', 'Jure Plesavec': 'wing-twoway', 'Rožle Ostroveršnik': 'c-israeli' },
  B: { 'Benjamin Piršič': 'pf-twoway', 'Jure Plesavec': 'pf-twoway', 'Rožle Ostroveršnik': 'c-israeli' },
};

const SKILL_COLS: Record<SkillKey, string> = {
  js: 'js', jr: 'jr', od: 'od', ha: 'ha', dr: 'dr', pa: 'pa', is: 'is', id: 'id', rb: 'rb', sb: 'sb',
};

function firstCard(name: string) {
  const cards = series.filter((r) => r.player_name === name);
  return { first: cards[0], cards };
}
function toStart(first: Record<string, string>): PlayerState {
  const disp = Object.fromEntries(SKILL_KEYS.map((k) => [k, Number(first[SKILL_COLS[k]])])) as Record<SkillKey, number>;
  return {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, disp[k] - 0.5))),
    age: Number(first.age), heightCm: Number(first.height_cm), potential: Number(first.potential_num),
    ftSkill: Number(first.ft) - 0.5, staminaSkill: Number(first.st) - 0.5,
  };
}

const players: StudyPlayer[] = [
  { name: 'Benjamin Piršič', startAge: 19, m1Week: 28, m2Week: 34, u21EndWeek: 42 },
  { name: 'Jure Plesavec', startAge: 18, m1Week: 42, m2Week: 48, u21EndWeek: 53 },
  { name: 'Rožle Ostroveršnik', startAge: 18, m1Week: 42, m2Week: 48, u21EndWeek: 53 },
].map((p) => {
  const { first } = firstCard(p.name);
  const start = toStart(first);
  return {
    ...p, buildKey: BUILD_ASSIGNMENT[scheme][p.name],
    heightCm: start.heightCm, potential: start.potential, start,
  };
});

// ---- value function (documented choice) ----
// Per player p with StudyBuild b (targets merged with gates via toSkillTargets):
//   needed(t) = t - 1 + 1e-6 (sublevel where displayed >= t; same τ convention as optimize.ts)
//   weight w_k = 4 if gate & floorSkill, 3 if gate, 1 otherwise
//   running shortfall S_p = Σ w_k · max(0, needed(t_k) − sublevel_k)  (continuous guidance)
//   margin M_p = Σ min(2, max(0, sublevel_k − needed(t_k)))          (capped overshoot)
// Frozen milestone penalties (added once, then permanent — this is what beams are ranked on):
//   at m1Week: 10 × S_p vs M1-RELAXED targets (floor −2, others −1, min 1 — planJourney's rule)
//   at m2Week:  5 × S_p vs FULL targets
//   at u21EndWeek: 2 × S_p vs FULL targets − 0.1 × M_p (polish counts a little)
// Beam score (minimize) = frozenPen + Σ_{active p} urgency_p(w)·S_p − 0.02·Σ M_p + 0.01·switches
//   urgency_p(w) = 1 + 2·max(0, (10 − weeksToM1)/10) — ramps to 3× in the last 10 weeks
//   before p's own M1, giving the beam lookahead pressure toward the earliest deadline.
interface BuildEval {
  targets: Array<{ skill: SkillKey; needed: number; weight: number; displayedTarget: number }>;
  m1Targets: Array<{ skill: SkillKey; needed: number; weight: number; displayedTarget: number }>;
  build: (typeof STUDY_BUILDS)[number];
}
function buildEval(buildKey: string): BuildEval {
  const b = STUDY_BUILDS.find((x) => x.key === buildKey);
  if (!b) throw new Error(`unknown build ${buildKey}`);
  const t = toSkillTargets(b).map((x) => ({
    skill: x.skill,
    displayedTarget: x.displayed,
    needed: x.displayed - 1 + 1e-6,
    weight: (b.gates as Record<string, number | undefined>)[x.skill] !== undefined
      ? (x.skill === b.floorSkill ? 4 : 3) : 1,
  }));
  const m1 = t.map((x) => {
    const relaxed = Math.max(1, x.displayedTarget - (x.skill === b.floorSkill ? 2 : 1));
    return { ...x, displayedTarget: relaxed, needed: relaxed - 1 + 1e-6 };
  });
  return { targets: t, m1Targets: m1, build: b };
}
const evals = players.map((p) => buildEval(p.buildKey));

function shortfall(skills: Skills, ts: BuildEval['targets']): number {
  let s = 0;
  for (const t of ts) s += t.weight * Math.max(0, t.needed - skills[t.skill]);
  return s;
}
function margin(skills: Skills, ts: BuildEval['targets']): number {
  let m = 0;
  for (const t of ts) m += Math.min(2, Math.max(0, skills[t.skill] - t.needed));
  return m;
}

// ---- simulation of a full 53-week shared sequence ----
interface SimPlayerOut {
  atM1: Record<SkillKey, number>;
  atM2: Record<SkillKey, number>;
  atU21End: Record<SkillKey, number>;
  atDataEnd: Record<SkillKey, number>;
}
function ageAt(p: StudyPlayer, weekNo: number): number {
  return p.startAge + Math.floor((weekNo - 1) / 14);
}
function minutesAt(p: StudyPlayer, weekNo: number): number {
  return MINUTES_DEV[p.name]?.[weekNo] ?? 48;
}
function disp(skills: Skills): Record<SkillKey, number> {
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(skills[k])])) as Record<SkillKey, number>;
}
function simulate(seq: number[]): SimPlayerOut[] {
  const states = players.map((p) => ({ ...p.start, skills: { ...p.start.skills } }));
  const out: SimPlayerOut[] = players.map(() => ({} as SimPlayerOut));
  for (let i = 0; i < seq.length; i++) {
    const wk = timeline[i];
    for (let pi = 0; pi < players.length; pi++) {
      const p = players[pi];
      const st = { ...states[pi], age: ageAt(p, wk.weekNo) };
      const r = weekStep(st, { trainingId: seq[i], minutes: minutesAt(p, wk.weekNo), ...wk.staff }, BBSCOUT);
      states[pi] = { ...st, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
      if (wk.weekNo === p.m1Week) out[pi].atM1 = disp(states[pi].skills);
      if (wk.weekNo === p.m2Week) out[pi].atM2 = disp(states[pi].skills);
      if (wk.weekNo === p.u21EndWeek) out[pi].atU21End = disp(states[pi].skills);
    }
  }
  for (let pi = 0; pi < players.length; pi++) out[pi].atDataEnd = disp(states[pi].skills);
  return out;
}

// ---- beam search over shared weekly choices ----
const ACTIONS = TRAINING_CATALOG.filter((t) => t.kind === 'skill').map((t) => t.id); // ids 1..31
interface Node {
  states: PlayerState[];
  frozenPen: number;
  switches: number;
  last: number | null;
  seq: number[];
}
function runningScore(n: Node, weekNo: number): number {
  let s = n.frozenPen + 0.01 * n.switches;
  for (let pi = 0; pi < players.length; pi++) {
    const p = players[pi];
    if (weekNo > p.u21EndWeek) continue; // out of U-21 — frozen contributions only
    const toM1 = Math.max(0, p.m1Week - weekNo);
    const urgency = 1 + 2 * Math.max(0, (10 - toM1) / 10);
    s += urgency * shortfall(n.states[pi].skills, evals[pi].targets);
    s -= 0.02 * margin(n.states[pi].skills, evals[pi].targets);
  }
  return s;
}
function dedupKey(n: Node): string {
  const parts: string[] = [String(n.last ?? 0)];
  for (const st of n.states) for (const k of SKILL_KEYS) parts.push(String(Math.round(st.skills[k] * 4)));
  return parts.join(',');
}
function beamSearch(width: number): { best: Node; score: number } {
  let beam: Node[] = [{
    states: players.map((p) => ({ ...p.start, skills: { ...p.start.skills } })),
    frozenPen: 0, switches: 0, last: null, seq: [],
  }];
  for (let i = 0; i < timeline.length; i++) {
    const wk = timeline[i];
    const children: Node[] = [];
    for (const node of beam) {
      for (const a of ACTIONS) {
        const states: PlayerState[] = new Array(players.length);
        let frozenPen = node.frozenPen;
        for (let pi = 0; pi < players.length; pi++) {
          const p = players[pi];
          const st = { ...node.states[pi], age: ageAt(p, wk.weekNo) };
          const r = weekStep(st, { trainingId: a, minutes: minutesAt(p, wk.weekNo), ...wk.staff }, BBSCOUT);
          states[pi] = { ...st, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
          if (wk.weekNo === p.m1Week) frozenPen += 10 * shortfall(states[pi].skills, evals[pi].m1Targets);
          if (wk.weekNo === p.m2Week) frozenPen += 5 * shortfall(states[pi].skills, evals[pi].targets);
          if (wk.weekNo === p.u21EndWeek) {
            frozenPen += 2 * shortfall(states[pi].skills, evals[pi].targets);
            frozenPen -= 0.1 * margin(states[pi].skills, evals[pi].targets);
          }
        }
        children.push({
          states, frozenPen,
          switches: node.switches + (node.last !== null && node.last !== a ? 1 : 0),
          last: a, seq: [...node.seq, a],
        });
      }
    }
    const seen = new Map<string, Node>();
    for (const c of children) {
      const key = dedupKey(c);
      const prev = seen.get(key);
      if (!prev || runningScore(c, wk.weekNo + 1) < runningScore(prev, wk.weekNo + 1)) seen.set(key, c);
    }
    beam = [...seen.values()]
      .map((c) => ({ c, s: runningScore(c, wk.weekNo + 1) }))
      .sort((a, b) => a.s - b.s)
      .slice(0, width)
      .map((x) => x.c);
  }
  const scored = beam.map((n) => ({ n, s: n.frozenPen + 0.01 * n.switches }));
  scored.sort((a, b) => a.s - b.s);
  return { best: scored[0].n, score: scored[0].s };
}

// ---- observed cards at checkpoint weeks ----
// Card dated D reports the state AFTER the training of club week with that date. State
// "after N trained weeks" = card at timeline[N-1].date (nearest card at/before, +3d slack).
function observedAt(name: string, weekNo: number): { date: string; skills: Record<SkillKey, number> } | null {
  const target = timeline[weekNo - 1]?.date;
  if (!target) return null;
  const cards = series.filter((r) => r.player_name === name && r.report_date <= target);
  if (cards.length === 0) return null;
  const c = cards[cards.length - 1];
  const gapDays = (Date.parse(target) - Date.parse(c.report_date)) / 86400000;
  if (gapDays > 10) return null; // too stale to stand in for this checkpoint
  return {
    date: c.report_date,
    skills: Object.fromEntries(SKILL_KEYS.map((k) => [k, Number(c[SKILL_COLS[k]])])) as Record<SkillKey, number>,
  };
}

// ---- per-player prescribed optimum from the retro harness output ----
function prescribed(name: string, buildKey: string) {
  if (!retroDir) return null;
  const file = path.join(retroDir, `${name.replace(/[^\w]/g, '_')}.json`);
  const d = JSON.parse(readFileSync(file, 'utf8'));
  const entry = (d.prescriptionSweep as Array<Record<string, unknown>>).find((s) => s.build === buildKey);
  if (!entry) return null;
  const cp = entry.checkpoints as { m1: Record<SkillKey, number> | null; m2: Record<SkillKey, number> | null; end: Record<SkillKey, number> };
  return { m1: cp.m1, m2: cp.m2, end: cp.end, rankInSweep: (d.prescriptionSweep as unknown[]).indexOf(entry) + 1 };
}

// ---- run ----
console.log(`scheme ${scheme}, beam ${beamWidth}, actions ${ACTIONS.length}, weeks ${timeline.length}`);
const t0 = Date.now();
const greedy = beamSearch(1);
const main = beamSearch(beamWidth);
const wide = beamWidth < 160 ? beamSearch(160) : main;
console.log(`greedy score ${greedy.score.toFixed(3)} | beam${beamWidth} ${main.score.toFixed(3)} | beam160 ${wide.score.toFixed(3)} | ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const chosen = [greedy, main, wide].sort((a, b) => a.score - b.score)[0];

const sharedSim = simulate(chosen.best.seq);
const actualSeq = timeline.map((w) => w.actualTrainingId);
const actualSim = simulate(actualSeq);

function rle(seq: number[]): string[] {
  const out: string[] = [];
  let cur = seq[0], n = 0;
  for (const s of seq) {
    if (s === cur) n++;
    else { out.push(`${getTrainingType(cur).label}x${n}`); cur = s; n = 1; }
  }
  out.push(`${getTrainingType(cur).label}x${n}`);
  return out;
}
function tsp10(s: Record<SkillKey, number>): number {
  return SKILL_KEYS.reduce((a, k) => a + s[k], 0);
}
function colReport(be: BuildEval, s: Record<SkillKey, number> | null) {
  if (!s) return null;
  const g = gateReport(be.build, s);
  const tShort = be.targets.reduce((a, t) => a + Math.max(0, t.displayedTarget - s[t.skill]), 0);
  const gShort = Object.entries(be.build.gates)
    .reduce((a, [k, v]) => a + Math.max(0, (v as number) - s[k as SkillKey]), 0);
  return { skills: s, tsp10: tsp10(s), gatesPassed: g.passed, gatesFailed: g.failed, gateShortfall: gShort, targetShortfall: tShort };
}

const result = {
  scheme,
  buildAssignment: BUILD_ASSIGNMENT[scheme],
  valueFunction: 'frozen milestone penalties: 10x weighted shortfall vs M1-relaxed targets at own age-21 entry, 5x vs full targets at age-21 wk7, 2x at end of age-21 (-0.1x capped margin); running guidance = urgency-ramped weighted shortfall (gates w3, floor-gate w4, targets w1), continuous sublevels, tau(d)=d-1+1e-6; switch penalty 0.01',
  beam: { widthsTried: [1, beamWidth, 160], scores: { greedy: greedy.score, main: main.score, wide: wide.score }, chosenScore: chosen.score },
  timelineNote: '53 club weeks on the 14-week season grid; staff timeline coach5->6@wk45, YT6->0@wk29, gym3, TC0; real minutes deviations applied to BOTH shared and actual sims',
  sharedPlan: { rle: rle(chosen.best.seq), seq: chosen.best.seq, switches: chosen.best.switches },
  actualPlan: { rle: rle(actualSeq) },
  players: players.map((p, pi) => {
    const be = evals[pi];
    const presc = prescribed(p.name, p.buildKey);
    const obsM1 = observedAt(p.name, p.m1Week);
    const obsM2 = observedAt(p.name, p.m2Week);
    const obsEnd = observedAt(p.name, p.u21EndWeek);
    return {
      name: p.name, build: p.buildKey, potential: p.potential, heightCm: p.heightCm,
      startAge: p.startAge, m1Week: p.m1Week, m2Week: p.m2Week, u21EndWeek: p.u21EndWeek,
      startSkills: disp(p.start.skills),
      fourWayAtAge21Entry: {
        prescribed: colReport(be, presc?.m1 ?? null),
        shared: colReport(be, sharedSim[pi].atM1),
        actualSim: colReport(be, actualSim[pi].atM1),
        observed: obsM1 ? { cardDate: obsM1.date, ...colReport(be, obsM1.skills) } : null,
      },
      atM2: {
        prescribed: colReport(be, presc?.m2 ?? null),
        shared: colReport(be, sharedSim[pi].atM2),
        actualSim: colReport(be, actualSim[pi].atM2),
        observed: obsM2 ? { cardDate: obsM2.date, ...colReport(be, obsM2.skills) } : null,
      },
      atU21End: {
        shared: colReport(be, sharedSim[pi].atU21End),
        actualSim: colReport(be, actualSim[pi].atU21End),
        observed: obsEnd ? { cardDate: obsEnd.date, ...colReport(be, obsEnd.skills) } : null,
      },
      prescribedRankInSweep: presc?.rankInSweep ?? null,
    };
  }),
};
writeFileSync(path.join(outDir, `shared-slot-${scheme}.json`), JSON.stringify(result, null, 1));
console.log(`wrote shared-slot-${scheme}.json`);
for (const p of result.players) {
  const f = p.fourWayAtAge21Entry;
  const fmt = (c: ReturnType<typeof colReport> | null | { cardDate: string }) =>
    c && 'tsp10' in c ? `tsp ${c.tsp10} gateShort ${c.gateShortfall} tgtShort ${c.targetShortfall}` : 'n/a';
  console.log(`${p.name} [${p.build}] @21-entry  presc: ${fmt(f.prescribed)} | shared: ${fmt(f.shared)} | actual: ${fmt(f.actualSim)} | obs: ${fmt(f.observed)}`);
}
