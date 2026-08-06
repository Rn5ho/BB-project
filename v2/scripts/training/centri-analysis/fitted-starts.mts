// Starting-sublevel fitting over the Centri U-21 calibration cases.
//
// Question: how much of bbscout's pop-timing error is explained by ONE static
// per-(case,skill) starting-sublevel offset, fitted in-sample?
//
// Method:
//  - Baseline replay starts every rate skill at displayed - 0.5 (midpoint).
//  - Per case, per skill k: scan delta in {0.05, 0.10, ..., 0.95}
//    (start_k = displayed_k - 1 + delta), holding all OTHER skills at the
//    midpoint, and score only skill k's timing mismatches over the case
//    (misses on k + false alarms on k). Best delta = min score; ties broken
//    by closest to 0.5, then lower delta (deterministic).
//    NOTE: this 1-D scan ignores cross-skill coupling (elastic bonuses, cap
//    slowdown and top-skill malus depend on other skills' levels) — accepted
//    approximation; the joint run below measures the actual combined effect.
//  - Then run each case ONCE with all best-fit offsets simultaneously and
//    report overall recall / FA / finals.
//
// Usage (from v2/):
//   npx tsx scripts/training/centri-analysis/fitted-starts.mts <casesDir> --out <outDir> [--model bbscout]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, displayed, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../../src/lib/training/models/open-source-live';

const MODELS: Record<string, ModelParams> = {
  bbscout: BBSCOUT,
  'coach-parrot': COACH_PARROT,
  'open-source-live': OPEN_SOURCE_LIVE,
};

interface CaseFile {
  label: string;
  player: {
    startSkillsDisplayed: Record<SkillKey, number>;
    age: number; heightCm: number; potential: number;
    startStamina?: number; startFreeThrow?: number;
  };
  coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number;
  weeks: Array<{ date: string; trainingId: number; minutes: number; observedPops?: Record<string, number>; ageAfterThis?: number }>;
  endSkillsDisplayed?: Partial<Record<SkillKey, number>>;
}

interface MissEvent {
  skill: SkillKey; date: string; weekIdx: number; obsToLevel: number; simInternalAfter: number;
  obsPopIndex: number;        // 1 = first observed pop of this skill in the case, 2 = second, ...
  cumGainAtWeek: number;      // predicted cumulative gain on this skill from case start through the miss week
}
interface RunResult {
  hits: number; misses: number; fa: number;
  perSkill: Record<SkillKey, { hits: number; misses: number; fa: number }>;
  missEvents: MissEvent[];
  faEvents: Array<{ skill: SkillKey; date: string; weekIdx: number; simToLevel: number }>;
  caseTotalGain: Record<SkillKey, number>;  // predicted cumulative gain per skill over the whole case
  obsPopCount: Record<SkillKey, number>;    // observed pops per skill in the case
  endAbsErr: number; endCount: number; endExact: number;
}

const args = process.argv.slice(2);
const casesDir = args[0];
if (!casesDir) throw new Error('usage: fitted-starts.mts <casesDir> --out <dir> [--model id]');
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
if (!outDir) throw new Error('--out <dir> required');
const modelId = args.includes('--model') ? args[args.indexOf('--model') + 1] : 'bbscout';
const model = MODELS[modelId];
if (!model) throw new Error(`unknown model ${modelId}`);
mkdirSync(outDir, { recursive: true });

const DELTAS = Array.from({ length: 19 }, (_, i) => +((i + 1) * 0.05).toFixed(2)); // 0.05..0.95

function runCase(c: CaseFile, startInternals: Record<SkillKey, number>): RunResult {
  let state: PlayerState = {
    skills: skillsFromArray(SKILL_KEYS.map((k) => startInternals[k])),
    age: c.player.age, heightCm: c.player.heightCm, potential: c.player.potential,
    ftSkill: (c.player.startFreeThrow ?? 1) - 0.5,
    staminaSkill: (c.player.startStamina ?? 1) - 0.5,
  };
  const res: RunResult = {
    hits: 0, misses: 0, fa: 0,
    perSkill: Object.fromEntries(SKILL_KEYS.map((k) => [k, { hits: 0, misses: 0, fa: 0 }])) as RunResult['perSkill'],
    missEvents: [], faEvents: [],
    caseTotalGain: Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as RunResult['caseTotalGain'],
    obsPopCount: Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as RunResult['obsPopCount'],
    endAbsErr: 0, endCount: 0, endExact: 0,
  };
  c.weeks.forEach((wk, wi) => {
    const r = weekStep(state, {
      trainingId: wk.trainingId, coachLevel: c.coachLevel,
      youthTrainerLevel: c.youthTrainerLevel, minutes: wk.minutes,
      gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
    }, model);
    const observed = (wk.observedPops ?? {}) as Partial<Record<SkillKey, number>>;
    for (const k of SKILL_KEYS) {
      res.caseTotalGain[k] += r.gains[k];
      const predPop = !!r.pops[k];
      const obsPop = observed[k] ?? null;
      if (obsPop != null) {
        res.obsPopCount[k]++;
        if (predPop) { res.hits++; res.perSkill[k].hits++; }
        else {
          res.misses++; res.perSkill[k].misses++;
          res.missEvents.push({
            skill: k, date: wk.date, weekIdx: wi, obsToLevel: obsPop, simInternalAfter: +r.skillsAfter[k].toFixed(3),
            obsPopIndex: res.obsPopCount[k], cumGainAtWeek: +res.caseTotalGain[k].toFixed(4),
          });
        }
      } else if (predPop) {
        res.fa++; res.perSkill[k].fa++;
        res.faEvents.push({ skill: k, date: wk.date, weekIdx: wi, simToLevel: displayed(r.skillsAfter[k]) });
      }
    }
    state = { ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter, age: wk.ageAfterThis ?? state.age };
  });
  for (const k of SKILL_KEYS) {
    const want = c.endSkillsDisplayed?.[k] ?? null;
    if (want == null) continue;
    const got = displayed(state.skills[k]);
    res.endAbsErr += Math.abs(got - want); res.endCount++;
    if (got === want) res.endExact++;
  }
  return res;
}

const files = readdirSync(casesDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));

const perCase: Array<Record<string, unknown>> = [];
const agg = {
  midpoint: { hits: 0, misses: 0, fa: 0, endAbsErr: 0, endCount: 0, endExact: 0 },
  fitted: { hits: 0, misses: 0, fa: 0, endAbsErr: 0, endCount: 0, endExact: 0 },
};
let sumPerSkillBestScore = 0; // Σ over (case,skill) of best isolated (miss+fa) — coupling check vs joint
let sumPerSkillMidScore = 0;
const deltaDistBySkill: Record<SkillKey, Record<string, number>> = Object.fromEntries(
  SKILL_KEYS.map((k) => [k, {}]),
) as Record<SkillKey, Record<string, number>>;
const deltaDistAll: Record<string, number> = {};
const deltaDistStrict: Record<string, number> = {}; // only entries where the min score was achieved by EXACTLY one delta
let strictBestEntries = 0, tieBrokenEntries = 0;
let constrainedEntries = 0, unconstrainedEntries = 0;
let observedPopsTotal = 0;
const residualMisses: Array<Record<string, unknown>> = [];
const perCaseFits: Array<Record<string, unknown>> = [];

for (const file of files) {
  const c = JSON.parse(readFileSync(path.join(casesDir, file), 'utf8')) as CaseFile;
  if (!c.weeks) continue;
  for (const wk of c.weeks) observedPopsTotal += Object.keys(wk.observedPops ?? {}).filter((k) => (SKILL_KEYS as readonly string[]).includes(k)).length;

  const midStarts = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, Math.max(0.5, c.player.startSkillsDisplayed[k] - 0.5)]),
  ) as Record<SkillKey, number>;

  const midRun = runCase(c, midStarts);

  // per-skill 1-D delta scan
  const bestDelta: Record<SkillKey, number> = {} as Record<SkillKey, number>;
  const fitInfo: Record<string, unknown> = {};
  for (const k of SKILL_KEYS) {
    const scores: Array<{ delta: number; score: number }> = [];
    for (const delta of DELTAS) {
      const starts = { ...midStarts, [k]: c.player.startSkillsDisplayed[k] - 1 + delta };
      const r = runCase(c, starts);
      scores.push({ delta, score: r.perSkill[k].misses + r.perSkill[k].fa });
    }
    const allEqual = scores.every((s) => s.score === scores[0].score);
    const best = [...scores].sort((a, b) =>
      a.score - b.score || Math.abs(a.delta - 0.5) - Math.abs(b.delta - 0.5) || a.delta - b.delta)[0];
    const tieCount = scores.filter((s) => s.score === best.score).length;
    bestDelta[k] = allEqual ? 0.5 : best.delta;
    if (allEqual) unconstrainedEntries++;
    else {
      constrainedEntries++;
      const key = bestDelta[k].toFixed(2);
      deltaDistBySkill[k][key] = (deltaDistBySkill[k][key] ?? 0) + 1;
      deltaDistAll[key] = (deltaDistAll[key] ?? 0) + 1;
      if (tieCount === 1) { strictBestEntries++; deltaDistStrict[key] = (deltaDistStrict[key] ?? 0) + 1; }
      else tieBrokenEntries++;
      sumPerSkillBestScore += best.score;
      sumPerSkillMidScore += midRun.perSkill[k].misses + midRun.perSkill[k].fa;
    }
    fitInfo[k] = {
      bestDelta: bestDelta[k], constrained: !allEqual, tieCount: allEqual ? DELTAS.length : tieCount,
      isolatedScore: allEqual ? scores[0].score : best.score, midpointScore: midRun.perSkill[k].misses + midRun.perSkill[k].fa,
    };
  }

  // joint run with all best-fit offsets
  const fittedStarts = Object.fromEntries(
    SKILL_KEYS.map((k) => [k, c.player.startSkillsDisplayed[k] - 1 + bestDelta[k]]),
  ) as Record<SkillKey, number>;
  const fitRun = runCase(c, fittedStarts);

  for (const m of fitRun.missEvents) {
    // classify: can ANY static start offset explain this miss?
    //  - noGain: model predicts ~zero cumulative gain on this skill over the whole case
    //    (untrained skill; only gym-scatter EV / nothing) — no offset fixes it
    //  - laterPop: 2nd+ observed pop of this skill in the case — offset only phase-aligns,
    //    repeated misses indicate rate error (drift), not start sublevel
    const totalGain = fitRun.caseTotalGain[m.skill];
    residualMisses.push({
      file, label: c.label, ...m,
      caseTotalGain: +totalGain.toFixed(4),
      obsPopsOfSkillInCase: fitRun.obsPopCount[m.skill],
      class: totalGain < 0.05 ? 'no-gain-skill'
        : m.obsPopIndex >= 2 ? 'later-pop-drift'
        : m.cumGainAtWeek < 0.05 ? 'first-pop-rate-too-slow'  // even a 0.95 start could not cross by this week
        : 'first-pop-tradeoff',                               // catchable in isolation; fitted delta traded it off
    });
  }

  for (const key of ['hits', 'misses', 'fa', 'endAbsErr', 'endCount', 'endExact'] as const) {
    agg.midpoint[key] += midRun[key]; agg.fitted[key] += fitRun[key];
  }
  perCase.push({
    file, label: c.label, weeks: c.weeks.length,
    midpoint: { hits: midRun.hits, misses: midRun.misses, fa: midRun.fa, endExact: midRun.endExact, endCount: midRun.endCount },
    fitted: { hits: fitRun.hits, misses: fitRun.misses, fa: fitRun.fa, endExact: fitRun.endExact, endCount: fitRun.endCount },
  });
  perCaseFits.push({ file, fits: fitInfo });
}

const recall = (x: { hits: number; misses: number }) => x.hits / (x.hits + x.misses);
const result = {
  model: modelId, cases: perCase.length, deltasScanned: DELTAS,
  note: '1-D per-skill delta scan holds other skills at midpoint (ignores cross-skill coupling: elastic/cap/malus). Fitted numbers are IN-SAMPLE.',
  observedPopsTotal,
  fittedParams: { constrainedEntries, unconstrainedEntries, totalEntries: constrainedEntries + unconstrainedEntries, observedPopsPerConstrainedParam: +(observedPopsTotal / constrainedEntries).toFixed(2) },
  rungs: {
    midpoint: {
      popRecall: `${(recall(agg.midpoint) * 100).toFixed(1)}% (${agg.midpoint.hits}/${agg.midpoint.hits + agg.midpoint.misses})`,
      falseAlarms: agg.midpoint.fa,
      finalExact: `${agg.midpoint.endExact}/${agg.midpoint.endCount}`,
      mae: +(agg.midpoint.endAbsErr / agg.midpoint.endCount).toFixed(4),
    },
    fittedStarts: {
      popRecall: `${(recall(agg.fitted) * 100).toFixed(1)}% (${agg.fitted.hits}/${agg.fitted.hits + agg.fitted.misses})`,
      falseAlarms: agg.fitted.fa,
      finalExact: `${agg.fitted.endExact}/${agg.fitted.endCount}`,
      mae: +(agg.fitted.endAbsErr / agg.fitted.endCount).toFixed(4),
      caveat: 'in-sample fit; upper bound of what correct starting sublevels alone buy',
    },
  },
  couplingCheck: {
    sumIsolatedBestScores: sumPerSkillBestScore,
    sumMidpointScores: sumPerSkillMidScore,
    jointFittedMissPlusFa: agg.fitted.misses + agg.fitted.fa,
    note: 'joint > sumIsolatedBest means cross-skill coupling degraded the combined fit vs the 1-D scans',
  },
  tieStats: { strictBestEntries, tieBrokenEntries, note: 'tie-broken entries default toward 0.5 — the 0.50 spike in deltaDistAll is partly tie-break artifact; deltaDistStrict shows only unique-minimum entries' },
  deltaDistAll, deltaDistStrict, deltaDistBySkill,
  residualMissClassCounts: residualMisses.reduce<Record<string, number>>((acc, m) => {
    const c = m.class as string; acc[c] = (acc[c] ?? 0) + 1; return acc;
  }, {}),
  perCase, perCaseFits,
  residualMisses,
};
writeFileSync(path.join(outDir, 'fitted-starts-result.json'), JSON.stringify(result, null, 1));
console.log(JSON.stringify({ ...result, perCase: undefined, perCaseFits: undefined, residualMisses: `${residualMisses.length} events (see artifact)` }, null, 1));
