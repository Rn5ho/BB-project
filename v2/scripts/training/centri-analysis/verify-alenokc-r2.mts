// ROUND-2 ADVERSARIAL VERIFICATION — independent re-derivation of the alenokc
// middle-era clean-window replay (club-vs-row confound test + SB adjudication).
// Fresh code: reads weeks.csv + series.csv directly, derives coverage from
// week_no continuity, builds maximal clean windows, replays via the real engine.
//
// Usage (from v2/): npx tsx scripts/training/centri-analysis/verify-alenokc-r2.mts <outDir>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../../src/lib/training/models/open-source-live';

const PARSED = '../docs/research/training/calibration-cases/centri-u21/source/parsed';
const outDir = process.argv[2];
if (!outDir) throw new Error('usage: verify-alenokc-r2.mts <outDir>');
mkdirSync(outDir, { recursive: true });

// --- tiny CSV parser (quoted fields) ---
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; if (row.some((f) => f !== '')) rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((f) => f !== '')) rows.push(row); }
  return rows;
}
function loadCsv(file: string): Array<Record<string, string>> {
  const raw = readFileSync(path.join(PARSED, file), 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(raw);
  const hdr = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(hdr.map((h, i) => [h, r[i] ?? ''])));
}

// --- 1. coverage: alenokc logged club-weeks ---
const weeksRows = loadCsv('weeks.csv').filter((r) => r.author === 'alenokc');
const trainingByWeek = new Map<number, { trainingId: number; minutesNote: string; coach: number; yt: string; gym: number; tc: string }>();
for (const r of weeksRows) {
  trainingByWeek.set(Number(r.week_no), {
    trainingId: Number(r.training_key), minutesNote: r.minutes_note,
    coach: Number(r.coach_level), yt: r.youth_trainer_level,
    gym: Number(r.fitness_level), tc: r.training_court_level,
  });
}
const ERA = { from: 7, to: 36 }; // middle era
const loggedMiddle = [...trainingByWeek.keys()].filter((w) => w >= ERA.from && w <= ERA.to).sort((a, b) => a - b);

// --- 2. cards ---
interface Card { week: number; date: string; age: number; heightCm: number; potential: number; skills: Record<SkillKey, number>; st: number; ft: number; checksum: string }
const seriesRows = loadCsv('series.csv').filter((r) => r.author === 'alenokc');
const cardsByPlayer = new Map<string, Card[]>();
for (const r of seriesRows) {
  const c: Card = {
    week: Number(r.week_no), date: r.report_date, age: Number(r.age), heightCm: Number(r.height_cm),
    potential: Number(r.potential_num),
    skills: Object.fromEntries(SKILL_KEYS.map((k) => [k, Number(r[k])])) as Record<SkillKey, number>,
    st: Number(r.st), ft: Number(r.ft), checksum: r.checksum_ok,
  };
  if (!cardsByPlayer.has(r.player_name)) cardsByPlayer.set(r.player_name, []);
  cardsByPlayer.get(r.player_name)!.push(c);
}
for (const cards of cardsByPlayer.values()) cards.sort((a, b) => a.week - b.week);

// --- 3. clean adjacent pairs -> maximal windows (per player) ---
// pair (w1, w2] is clean iff EVERY club week in (w1, w2] has a logged training row.
// pops.csv convention verified: a pop between cards w1 and w2 is attributed to the
// trainings of weeks w1+1..w2 (card at week N is post-training-N).
interface Window { player: string; startWeek: number; endWeek: number; trainWeeks: number[]; trainIds: number[]; startCard: Card; endCard: Card }
const windows: Window[] = [];
const pairAudit: Array<Record<string, unknown>> = [];
for (const [player, cards] of cardsByPlayer) {
  let cur: { start: number; end: number } | null = null;
  const flush = () => {
    if (!cur) return;
    const sc = cards.find((c) => c.week === cur!.start)!;
    const ec = cards.find((c) => c.week === cur!.end)!;
    const tw: number[] = [];
    for (let w = cur.start + 1; w <= cur.end; w++) if (trainingByWeek.has(w)) tw.push(w);
    windows.push({ player, startWeek: cur.start, endWeek: cur.end, trainWeeks: tw, trainIds: tw.map((w) => trainingByWeek.get(w)!.trainingId), startCard: sc, endCard: ec });
    cur = null;
  };
  for (let i = 0; i + 1 < cards.length; i++) {
    const w1 = cards[i].week, w2 = cards[i + 1].week;
    // does the pair touch the middle era?
    const touches = w2 > ERA.from - 1 && w1 < ERA.to; // covers any club week in [7..36]
    let clean = true;
    for (let w = w1 + 1; w <= w2; w++) if (!trainingByWeek.has(w)) { clean = false; break; }
    // only middle-era pairs
    const inEra = w1 + 1 >= ERA.from && w2 <= ERA.to;
    if (touches) pairAudit.push({ player, w1, w2, clean, inEra });
    if (clean && inEra) { if (!cur) cur = { start: w1, end: w2 }; else cur.end = w2; }
    else flush();
  }
  flush();
}

// --- 4. replay each window under each model x YT ---
const MODELS: Record<string, ModelParams> = { bbscout: BBSCOUT, 'coach-parrot': COACH_PARROT, 'open-source-live': OPEN_SOURCE_LIVE };
// minutes deviations inside window weeks, from weeks.csv minutes_note (checked by hand):
// wk35 "2x 48 min, Gojc Jalovec 44 min" -> Jalovec 44. All other window weeks "vsi 48"/"3x 48".
function minutesFor(player: string, week: number): number {
  if (week === 35 && player === 'Gojc Jalovec') return 44;
  return 48;
}

interface CellResult { pred: number; obs: number; startDisp: number; endDisp: number }
interface WindowResult {
  player: string; startWeek: number; endWeek: number; trainWeeks: number[]; trainIds: number[];
  age: number; heightCm: number; potential: number;
  cells: Record<SkillKey, CellResult>; ftPredGain: number; ftObsPops: number; stObs: number;
  cappedWeeks: number;
}
const results: Record<string, WindowResult[]> = {};
for (const [modelId, model] of Object.entries(MODELS)) {
  for (const yt of [7, 0]) {
    const key = `${modelId}|yt${yt}`;
    results[key] = [];
    for (const win of windows) {
      const sc = win.startCard, ec = win.endCard;
      if (sc.age !== ec.age) throw new Error(`window crosses age change: ${win.player} ${win.startWeek}->${win.endWeek}`);
      let state: PlayerState = {
        skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, sc.skills[k] - 0.5))),
        age: sc.age, heightCm: sc.heightCm, potential: sc.potential,
        ftSkill: sc.ft - 0.5, staminaSkill: sc.st - 0.5,
      };
      const predGain = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Record<SkillKey, number>;
      let ftPred = 0, cappedWeeks = 0;
      for (const w of win.trainWeeks) {
        const t = trainingByWeek.get(w)!;
        if (t.coach !== 7 || t.gym !== 3) throw new Error(`unexpected staff at wk${w}`);
        const r = weekStep(state, {
          trainingId: t.trainingId, coachLevel: t.coach, youthTrainerLevel: yt,
          minutes: minutesFor(win.player, w), gymLevel: t.gym, trainingCourtLevel: 3,
        }, model);
        for (const k of SKILL_KEYS) predGain[k] += r.gains[k];
        ftPred += r.ftAfter - (state.ftSkill ?? 0);
        if (r.capped) cappedWeeks++;
        state = { ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
      }
      const cells = Object.fromEntries(SKILL_KEYS.map((k) => [k, {
        pred: predGain[k], obs: ec.skills[k] - sc.skills[k], startDisp: sc.skills[k], endDisp: ec.skills[k],
      }])) as Record<SkillKey, CellResult>;
      results[key].push({
        player: win.player, startWeek: win.startWeek, endWeek: win.endWeek, trainWeeks: win.trainWeeks,
        trainIds: win.trainIds, age: sc.age, heightCm: sc.heightCm, potential: sc.potential,
        cells, ftPredGain: ftPred, ftObsPops: ec.ft - sc.ft, stObs: ec.st - sc.st, cappedWeeks,
      });
    }
  }
}

writeFileSync(path.join(outDir, 'v-coverage.json'), JSON.stringify({
  loggedMiddleWeeks: loggedMiddle,
  loggedMiddleCount: loggedMiddle.length,
  trainings: Object.fromEntries(loggedMiddle.map((w) => [w, trainingByWeek.get(w)!.trainingId])),
  pairAudit,
  windows: windows.map((w) => ({ player: w.player, span: `${w.startWeek}->${w.endWeek}`, trainWeeks: w.trainWeeks, trainIds: w.trainIds, age: w.startCard.age })),
}, null, 1));
writeFileSync(path.join(outDir, 'v-results.json'), JSON.stringify(results, null, 1));
console.log(JSON.stringify({
  loggedMiddleCount: loggedMiddle.length,
  nWindows: windows.length,
  players: [...new Set(windows.map((w) => w.player))],
  playerWeeks: windows.reduce((a, w) => a + w.trainWeeks.length, 0) / 1 * 1,
  totalPlayerWeeks: windows.reduce((a, w) => a + w.trainWeeks.length, 0),
}, null, 1));
