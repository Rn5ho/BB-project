// Round-2 (third-club agent): top-skill-malus mechanism test on the Centri U-21 cases.
// The delonche third-club windows (Umek id/dr, Brodnik id:rb, Orolik id:rb) suggest the
// x0.925 top-skill malus over-suppresses primary training of a player's top skill by ~2x.
// Mechanism hypothesis for the round-1 club tilt: pjtr576 trained rows 24/27/29 whose
// primaries (id/rb/sb) ARE the centers' top skills (malus active, model cold) while
// alenokc trained rows 16/18 (js/ha/dr/pa/is — not top skills; malus inactive, model hot).
// This clones BBSCOUT, edits ONLY xtrain, reruns the full 16-case replay and reports the
// per-club obs/pred cumulative-volume ratio (round-1 verified: pjtr 1.154, alenokc 0.780).
// NO parameter changes to the shipped model — evidence memo only.
//
// Usage (from v2/): npx tsx scripts/training/centri-analysis/malus-variants.mts <outDir>
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { weekStep, displayed, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';

const CASES_DIR = 'D:/ClaudeProjects/BB-project/docs/research/training/calibration-cases/centri-u21';
const OUT_DIR = process.argv[2];
if (!OUT_DIR) throw new Error('usage: malus-variants.mts <outDir>');
mkdirSync(OUT_DIR, { recursive: true });

function makeVariant(id: string, malusCoeff: number, rateScale = 1): ModelParams {
  const v = structuredClone(BBSCOUT);
  (v as { id: string }).id = id;
  if (v.xtrain.value.kind !== 'top-skill-malus') throw new Error('expected top-skill-malus');
  v.xtrain.value.coeff = malusCoeff;
  if (rateScale !== 1) {
    const rates = v.rates.value as Record<number, Partial<Record<SkillKey, number>>>;
    for (const row of Object.values(rates)) for (const k of Object.keys(row) as SkillKey[]) row[k]! *= rateScale;
  }
  return v;
}

const VARIANTS = [
  { id: 'baseline_malus_0.925', model: makeVariant('baseline', 0.925) },
  { id: 'malus_off', model: makeVariant('malus_off', 1.0) },
  { id: 'malus_0.96', model: makeVariant('malus_0.96', 0.96) },
  { id: 'malus_0.975', model: makeVariant('malus_0.975', 0.975) },
];

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

const files = readdirSync(CASES_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const cases = files.map((f) => ({ file: f, c: JSON.parse(readFileSync(path.join(CASES_DIR, f), 'utf8')) as CaseFile }))
  .filter((x) => x.c.weeks);
const clubOf = (file: string) => (file.includes('pjtr576') ? 'pjtr576' : 'alenokc');

function runVariant(model: ModelParams) {
  const clubs: Record<string, { predInternal: number; obsPops: number; hits: number; misses: number; fa: number }> = {
    pjtr576: { predInternal: 0, obsPops: 0, hits: 0, misses: 0, fa: 0 },
    alenokc: { predInternal: 0, obsPops: 0, hits: 0, misses: 0, fa: 0 },
  };
  const global = { hits: 0, misses: 0, fa: 0, endAbsErr: 0, endCount: 0, endExact: 0, predInternal: 0, obsPops: 0 };
  // per-skill club-level volume (for the SB adjudication view)
  const skillClub: Record<string, Record<SkillKey, { pred: number; obs: number }>> = {
    pjtr576: Object.fromEntries(SKILL_KEYS.map((k) => [k, { pred: 0, obs: 0 }])) as Record<SkillKey, { pred: number; obs: number }>,
    alenokc: Object.fromEntries(SKILL_KEYS.map((k) => [k, { pred: 0, obs: 0 }])) as Record<SkillKey, { pred: number; obs: number }>,
  };

  for (const { file, c } of cases) {
    const club = clubOf(file);
    let state: PlayerState = {
      skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, c.player.startSkillsDisplayed[k] - 0.5))),
      age: c.player.age, heightCm: c.player.heightCm, potential: c.player.potential,
      ftSkill: (c.player.startFreeThrow ?? 1) - 0.5,
      staminaSkill: (c.player.startStamina ?? 1) - 0.5,
    };
    const start = { ...state.skills };
    for (const wk of c.weeks) {
      const r = weekStep(state, {
        trainingId: wk.trainingId, coachLevel: c.coachLevel,
        youthTrainerLevel: c.youthTrainerLevel, minutes: wk.minutes,
        gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
      }, model);
      const observed = (wk.observedPops ?? {}) as Partial<Record<SkillKey, number>>;
      for (const k of SKILL_KEYS) {
        const predPop = !!r.pops[k];
        const obsPop = observed[k] != null;
        if (obsPop) { clubs[club].obsPops++; global.obsPops++; skillClub[club][k].obs++; }
        if (obsPop && predPop) { clubs[club].hits++; global.hits++; }
        else if (obsPop) { clubs[club].misses++; global.misses++; }
        else if (predPop) { clubs[club].fa++; global.fa++; }
      }
      state = { ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter, age: wk.ageAfterThis ?? state.age };
    }
    for (const k of SKILL_KEYS) {
      const g = state.skills[k] - start[k];
      clubs[club].predInternal += g;
      global.predInternal += g;
      skillClub[club][k].pred += g;
      const want = c.endSkillsDisplayed?.[k] ?? null;
      if (want != null) {
        const got = displayed(state.skills[k]);
        global.endAbsErr += Math.abs(got - want); global.endCount++;
        if (got === want) global.endExact++;
      }
    }
  }
  return { clubs, global, skillClub };
}

const out: Record<string, unknown> = {};
for (const v of VARIANTS) {
  const r = runVariant(v.model);
  const recall = r.global.hits / (r.global.hits + r.global.misses);
  const summary = {
    global: {
      popRecall: `${(recall * 100).toFixed(1)}% (${r.global.hits}/${r.global.hits + r.global.misses})`,
      falseAlarms: r.global.fa,
      finalExact: `${r.global.endExact}/${r.global.endCount}`,
      mae: +(r.global.endAbsErr / r.global.endCount).toFixed(4),
      predInternalVolume: +r.global.predInternal.toFixed(1),
      obsPopVolume: r.global.obsPops,
      obsOverPred: +(r.global.obsPops / r.global.predInternal).toFixed(3),
    },
    perClub: Object.fromEntries(Object.entries(r.clubs).map(([club, s]) => [club, {
      predInternal: +s.predInternal.toFixed(1), obsPops: s.obsPops,
      obsOverPred: +(s.obsPops / s.predInternal).toFixed(3),
      recall: `${s.hits}/${s.hits + s.misses}`, fa: s.fa,
    }])),
    tiltRatio: +((r.clubs.pjtr576.obsPops / r.clubs.pjtr576.predInternal) /
                 (r.clubs.alenokc.obsPops / r.clubs.alenokc.predInternal)).toFixed(3),
    skillClub: r.skillClub,
  };
  out[v.id] = summary;
  console.log(v.id, JSON.stringify({ global: summary.global, perClub: summary.perClub, tiltRatio: summary.tiltRatio }));
}

writeFileSync(path.join(OUT_DIR, 'malus-variants-results.json'), JSON.stringify({
  generated: new Date().toISOString(),
  casesDir: CASES_DIR,
  cases: cases.length,
  note: 'Full-engine reruns; baseline must reproduce verified bbscout numbers (recall 32.0% 58/181, FA 99, finals 112/160, MAE 0.300) and the club tilt (obs/pred pjtr 1.154, alenokc 0.780 per round-1 rate-check definition: observed pop count / predicted internal gain, 10 rate skills).',
  variants: out,
}, null, 1));
console.log('wrote', path.join(OUT_DIR, 'malus-variants-results.json'));
