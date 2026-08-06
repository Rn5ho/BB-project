// Staff-change natural experiment: for each analysis window (built by prep_windows.py),
// run the bbscout engine over the window's weeks twice —
//   (a) ACTUAL staff (the club's real coach/YT levels), and
//   (b) REFERENCE staff (coach 5 = mult 1.00, YT 0 = mult 1.00)
// — and report total predicted internal gain over the 10 rate skills. The observed
// displayed gain divided by (b) estimates the realized staff multiplier product;
// ratios across a staff change test the model's coach / youth-trainer parameters.
//
// Usage (from v2/): npx tsx scripts/training/centri-analysis/staff-experiment.mts <windows_spec.json> <out.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { weekStep, displayed, type PlayerState } from '../../../src/lib/training/engine';
import { SKILL_KEYS, skillsFromArray, type SkillKey } from '../../../src/lib/training/types';
import { BBSCOUT } from '../../../src/lib/training/models/bbscout';

interface SpecWindow {
  id: string; group: string; note: string; label: string;
  player: { startSkillsDisplayed: Record<SkillKey, number>; age: number; heightCm: number; potential: number; startStamina: number; startFreeThrow: number };
  gymLevel: number; trainingCourtLevel: number;
  actualCoach: number; actualYt: number;
  weeks: Array<{ date: string; trainingId: number | number[]; minutes: number; ageAfterThis?: number }>;
  obsDispGainBySkill: Record<string, number>;
  obsDispGainTotal: number;
}

const [specPath, outPath] = process.argv.slice(2);
if (!specPath || !outPath) throw new Error('usage: staff-experiment.mts <windows_spec.json> <out.json>');
const spec = JSON.parse(readFileSync(specPath, 'utf8')) as { windows: SpecWindow[] };

function runWindowFixed(w: SpecWindow, tids: number[], coachLevel: number, ytLevel: number) {
  let state: PlayerState = {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, w.player.startSkillsDisplayed[k] - 0.5))),
    age: w.player.age, heightCm: w.player.heightCm, potential: w.player.potential,
    ftSkill: (w.player.startFreeThrow ?? 1) - 0.5,
    staminaSkill: (w.player.startStamina ?? 1) - 0.5,
  };
  const gainBySkill = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Record<SkillKey, number>;
  let predPops = 0;
  w.weeks.forEach((wk, i) => {
    const r = weekStep(state, {
      trainingId: tids[i], coachLevel, youthTrainerLevel: ytLevel,
      minutes: wk.minutes, gymLevel: w.gymLevel, trainingCourtLevel: w.trainingCourtLevel,
    }, BBSCOUT);
    for (const k of SKILL_KEYS) {
      gainBySkill[k] += r.gains[k];
      if (displayed(r.skillsAfter[k]) > displayed(state.skills[k])) predPops++;
    }
    state = { ...state, skills: r.skillsAfter,
      ftSkill: r.ftAfter, staminaSkill: r.staminaAfter, age: wk.ageAfterThis ?? state.age };
  });
  const total = SKILL_KEYS.reduce((a, k) => a + gainBySkill[k], 0);
  return { gainBySkill, total, predPops };
}

function tidCombos(w: SpecWindow): number[][] {
  let combos: number[][] = [[]];
  for (const wk of w.weeks) {
    const opts = Array.isArray(wk.trainingId) ? wk.trainingId : [wk.trainingId];
    combos = combos.flatMap((c) => opts.map((o) => [...c, o]));
  }
  return combos;
}

function runWindow(w: SpecWindow, coachLevel: number, ytLevel: number) {
  const combos = tidCombos(w);
  const runs = combos.map((tids) => runWindowFixed(w, tids, coachLevel, ytLevel));
  runs.sort((a, b) => a.total - b.total);
  const mid = runs[Math.floor(runs.length / 2)];
  return { ...mid, totalMin: runs[0].total, totalMax: runs[runs.length - 1].total, nCombos: runs.length };
}

const out = spec.windows.map((w) => {
  const ref = runWindow(w, 5, 0);
  const act = runWindow(w, w.actualCoach, w.actualYt);
  const active = SKILL_KEYS.filter((k) => ref.gainBySkill[k] >= 0.05);
  return {
    id: w.id, group: w.group, note: w.note, label: w.label,
    weeks: w.weeks.length, startAge: w.player.age,
    trainings: w.weeks.map((x) => x.trainingId),
    obsDispGainTotal: w.obsDispGainTotal,
    obsDispGainBySkill: w.obsDispGainBySkill,
    predRefTotal: +ref.total.toFixed(4),
    predRefMin: +ref.totalMin.toFixed(4), predRefMax: +ref.totalMax.toFixed(4), nCombos: ref.nCombos,
    predRefBySkill: Object.fromEntries(Object.entries(ref.gainBySkill).map(([k, v]) => [k, +v.toFixed(4)])),
    predActualTotal: +act.total.toFixed(4),
    predActualMin: +act.totalMin.toFixed(4), predActualMax: +act.totalMax.toFixed(4),
    predActualPops: act.predPops,
    impliedStaffMultInModel: +(act.total / ref.total).toFixed(4),
    activeSkills: active, nActive: active.length,
  };
});

writeFileSync(outPath, JSON.stringify({ model: 'bbscout', referenceStaff: { coach: 5, yt: 0 }, windows: out }, null, 1));
console.log(`wrote ${out.length} windows -> ${outPath}`);
for (const o of out) {
  console.log(`${o.id.padEnd(32)} obs=${String(o.obsDispGainTotal).padStart(3)} predRef=${o.predRefTotal.toFixed(2).padStart(6)} predAct=${o.predActualTotal.toFixed(2).padStart(6)} staffMult=${o.impliedStaffMultInModel} nActive=${o.nActive}`);
}
