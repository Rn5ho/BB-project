// Retro "optimizer vs reality" study — question (b): GUARDS-vs-WINGS 1v1 CHOICE.
// Owner rule (build-knowledge batches 1-3): an 18yo outside prospect with IS~1 should take
// One on One (PG/SG) — the guards row has no IS cell so its JS cell is double (0.4 vs 0.2);
// with IS 5-7 already carried, wings-1v1 lands IS 9-10 "for free".
// This script runs both rows with the real engine (BBSCOUT project()) from age 18 week 1
// to the end of age 21, sweeping starting IS, and finds the IS-carry breakeven under the
// owner's wing bands (JS 14-17, IS 11-14, HA/DR min 15 practice 17-19).
//
// NEW file for the retro study; READ-ONLY (engine only, no DB, no BB).
// Usage (from v2/): npx tsx scripts/training/centri-analysis/retro/one-on-one-row-choice.mts [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { displayed, project, type PlayerState, type WeekConfig } from '../../../../src/lib/training/engine';
import { BBSCOUT } from '../../../../src/lib/training/models/bbscout';
import { SKILL_KEYS, skillsFromArray, type SkillKey } from '../../../../src/lib/training/types';

const outDir = process.argv[2]
  ?? 'C:/Users/Rn5ho/AppData/Local/Temp/claude/D--ClaudeProjects-BB-project-v2/3cc08ba3-8a42-4d6b-9ea5-496b684e99bf/scratchpad/retro-agents/marginal-value';
mkdirSync(outDir, { recursive: true });

const GUARDS = 15; // One on One (PG/SG): js .4, ha .4, dr .5
const WINGS = 16;  // One on One (SF/PF): js .2, ha .4, dr .5, is .2

const cfg = (trainingId: number): WeekConfig => ({
  trainingId, coachLevel: 5, youthTrainerLevel: 5, gymLevel: 0, trainingCourtLevel: 0,
});
const r3 = (x: number) => Math.round(x * 1000) / 1000;

// 18yo outside prospect (displayed): JS 6, JR 4, OD 6, HA 6, DR 6, PA 4, IS swept, ID 4,
// RB 4, SB 2; potential 7 (perennial allstar — typical outside gate pot≥6).
// Internal = displayed − 0.5. Horizon: 56 weeks = 4×14 (ages 18,19,20,21); entering-21
// checkpoint = end of week 42.
function mkState(heightCm: number, is0: number): PlayerState {
  const d: Record<SkillKey, number> = { js: 6, jr: 4, od: 6, ha: 6, dr: 6, pa: 4, is: is0, id: 4, rb: 4, sb: 2 };
  return {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, d[k] - 0.5))),
    age: 18, heightCm, potential: 7, ftSkill: 3.5, staminaSkill: 3.5,
  };
}

// Owner wing bands. Gate minimums on DISPLAYED values; credit tops on internal scale
// (displayed band top − 0.5, midpoint convention). Unweighted credit — owner can reweight.
const GATE_MINS: Partial<Record<SkillKey, number>> = { js: 14, is: 11, ha: 15, dr: 15 };
const CREDIT_TOPS: Partial<Record<SkillKey, number>> = { js: 16.5, is: 13.5, ha: 18.5, dr: 18.5 };
const IS_STANDOUT = 9; // batch-2: IS 9-12 "stands out" vs typical outside defenders' ID 6-8

interface RunOut {
  row: 'guards' | 'wings';
  gateWeek: Record<string, number | null>; // first 1-based week displayed ≥ gate
  at: Record<string, { internal: Record<string, number>; displayed: Record<string, number> }>;
  entering21: { shortfall: number; credit: number; standoutCredit: number; perSkillShortfall: Record<string, number> };
  week20Block: { credit: number; standoutCredit: number };
  cappedWeeks: number;
}

function runRow(heightCm: number, is0: number, row: 'guards' | 'wings'): RunOut {
  const state = mkState(heightCm, is0);
  const id = row === 'guards' ? GUARDS : WINGS;
  const plan = Array.from({ length: 56 }, () => cfg(id));
  const proj = project(state, plan, BBSCOUT, { startWeekOfSeason: 1 });

  const gateWeek: Record<string, number | null> = {};
  const gates: Array<[string, SkillKey, number]> = [
    ['js14', 'js', 14], ['is9', 'is', IS_STANDOUT], ['is11', 'is', 11], ['ha15', 'ha', 15], ['dr15', 'dr', 15],
  ];
  for (const [label] of gates) gateWeek[label] = null;
  proj.weeks.forEach((w, i) => {
    for (const [label, k, min] of gates) {
      if (gateWeek[label] === null && displayed(w.result.skillsAfter[k]) >= min) gateWeek[label] = i + 1;
    }
  });

  const KEYS: SkillKey[] = ['js', 'jr', 'is', 'ha', 'dr'];
  const snap = (weekIdx: number) => {
    const sk = proj.weeks[weekIdx - 1].result.skillsAfter;
    return {
      internal: Object.fromEntries(KEYS.map((k) => [k, r3(sk[k])])),
      displayed: Object.fromEntries(KEYS.map((k) => [k, displayed(sk[k])])),
    };
  };
  const at = { week20: snap(20), week42_entering21: snap(42), week56_endOf21: snap(56) };

  const bandCredit = (sk: Record<SkillKey, number>) => Object.entries(CREDIT_TOPS).reduce((a, [k, top]) => {
    const key = k as SkillKey;
    return a + (Math.min(top as number, sk[key]) - Math.min(top as number, state.skills[key]));
  }, 0);
  // Owner batch-2 valuation: IS below ~9 "doesn't stand out" (opposing outside defenders
  // carry ID 6-8). Standout credit counts IS sublevels only above internal 8.5
  // (displayed 9); all other skills as in bandCredit.
  const standoutCredit = (sk: Record<SkillKey, number>) => {
    const isPart = Math.max(0, Math.min(CREDIT_TOPS.is as number, sk.is) - Math.max(8.5, state.skills.is));
    const isPlain = Math.min(CREDIT_TOPS.is as number, sk.is) - Math.min(CREDIT_TOPS.is as number, state.skills.is);
    return bandCredit(sk) - isPlain + isPart;
  };
  const e21 = proj.weeks[41].result.skillsAfter;
  const w20 = proj.weeks[19].result.skillsAfter;
  const perSkillShortfall = Object.fromEntries(
    Object.entries(GATE_MINS).map(([k, min]) => [k, Math.max(0, (min as number) - displayed(e21[k as SkillKey]))]),
  ) as Record<string, number>;
  const shortfall = Object.values(perSkillShortfall).reduce((a, b) => a + b, 0);

  return {
    row, gateWeek, at,
    entering21: { shortfall, credit: r3(bandCredit(e21)), standoutCredit: r3(standoutCredit(e21)), perSkillShortfall },
    week20Block: { credit: r3(bandCredit(w20)), standoutCredit: r3(standoutCredit(w20)) }, // 20-wk 1v1 block inside a mixed plan
    cappedWeeks: proj.weeks.filter((w) => w.result.capped).length,
  };
}

const HEIGHTS = [188, 196, 203];
const IS_SWEEP = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const results: Array<{ heightCm: number; is0: number; guards: RunOut; wings: RunOut }> = [];
for (const heightCm of HEIGHTS) {
  for (const is0 of IS_SWEEP) {
    results.push({ heightCm, is0, guards: runRow(heightCm, is0, 'guards'), wings: runRow(heightCm, is0, 'wings') });
  }
}

// Breakevens per height at entering-21: smallest IS0 where wings ties/beats guards.
const breakevens = HEIGHTS.map((heightCm) => {
  const seq = results.filter((r) => r.heightCm === heightCm);
  const byShortfall = seq.find((r) => r.wings.entering21.shortfall <= r.guards.entering21.shortfall);
  const byCredit = seq.find((r) => r.wings.entering21.credit > r.guards.entering21.credit);
  const byCredit20 = seq.find((r) => r.wings.week20Block.credit > r.guards.week20Block.credit);
  const byStandout = seq.find((r) => r.wings.entering21.standoutCredit > r.guards.entering21.standoutCredit);
  const byStandout20 = seq.find((r) => r.wings.week20Block.standoutCredit > r.guards.week20Block.standoutCredit);
  return {
    heightCm,
    wingsTiesOnGateShortfallFromIS: byShortfall ? byShortfall.is0 : null,
    wingsBeatsOnBandCreditFromIS: byCredit ? byCredit.is0 : null,
    wingsBeatsOnBandCredit_20wkBlock_FromIS: byCredit20 ? byCredit20.is0 : null,
    wingsBeatsOnStandoutCredit_42wk_FromIS: byStandout ? byStandout.is0 : null,
    wingsBeatsOnStandoutCredit_20wkBlock_FromIS: byStandout20 ? byStandout20.is0 : null,
  };
});

// ---- switch policy: guards-1v1 until JS reaches the band top, then wings-1v1 ----
// Motivated by the full-horizon result: guards' JS overshoots displayed 20 while wings'
// IS keeps paying — a mixed policy should dominate both pure rows.
function runSwitch(heightCm: number, is0: number, jsSwitchInternal = 16.0) {
  const state = mkState(heightCm, is0);
  let st: PlayerState = { ...state, skills: { ...state.skills } };
  let switched: number | null = null;
  const seq: number[] = [];
  for (let w = 1; w <= 42; w++) {
    const id = st.skills.js >= jsSwitchInternal ? WINGS : GUARDS;
    if (id === WINGS && switched === null) switched = w;
    seq.push(id);
    const r = project(st, [cfg(id)], BBSCOUT, { startWeekOfSeason: ((w - 1) % 14) + 1 }).weeks[0].result;
    st = { ...st, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
    if (w % 14 === 0) st = { ...st, age: st.age + 1 };
  }
  const bandCredit = Object.entries(CREDIT_TOPS).reduce((a, [k, top]) => {
    const key = k as SkillKey;
    return a + (Math.min(top as number, st.skills[key]) - Math.min(top as number, state.skills[key]));
  }, 0);
  const isPlain = Math.min(CREDIT_TOPS.is as number, st.skills.is) - Math.min(CREDIT_TOPS.is as number, state.skills.is);
  const isPart = Math.max(0, Math.min(CREDIT_TOPS.is as number, st.skills.is) - Math.max(8.5, state.skills.is));
  return {
    heightCm, is0, switchedAtWeek: switched,
    entering21Displayed: { js: displayed(st.skills.js), is: displayed(st.skills.is), ha: displayed(st.skills.ha), dr: displayed(st.skills.dr) },
    credit: r3(bandCredit), standoutCredit: r3(bandCredit - isPlain + isPart),
  };
}
const switchPolicy = [188, 196, 203].flatMap((h) => [1, 5, 9].map((is0) => runSwitch(h, is0)));

const out = {
  question: 'Guards-1v1 (id15, JS .4, no IS) vs Wings-1v1 (id16, JS .2, IS .2) for an 18yo outside prospect, full horizon age 18 wk1 → end of 21',
  model: 'bbscout (engine project(); coach 5, YT 5, gym 0, TC 0, full minutes, potential 7)',
  caveat: '1v1-ONLY paths isolate the row choice; real plans mix OD/JS blocks, so absolute end states overstate HA/DR/JS and train no OD. The guards-vs-wings DIFFERENCE per week is the finding.',
  bands: { gateMins: GATE_MINS, creditTops: CREDIT_TOPS, isStandout: IS_STANDOUT },
  breakevens,
  switchPolicy,
  results,
};
writeFileSync(path.join(outDir, 'one-on-one-choice.json'), JSON.stringify(out, null, 1));

console.log('=== (b) guards vs wings 1v1 — entering-21 checkpoint (wk42) ===');
for (const heightCm of HEIGHTS) {
  console.log(`--- ${heightCm} cm ---`);
  console.log('is0 | G js/is (JSwk14) | W js/is (JSwk14, IS9wk, IS11wk) | shortfall G/W | credit G/W');
  for (const r of results.filter((r) => r.heightCm === heightCm)) {
    const g = r.guards, w = r.wings;
    const gd = g.at.week42_entering21.displayed, wd = w.at.week42_entering21.displayed;
    console.log(
      `${r.is0} | ${gd.js}/${gd.is} (wk${g.gateWeek.js14}) | ${wd.js}/${wd.is} (wk${w.gateWeek.js14}, ${w.gateWeek.is9}, ${w.gateWeek.is11})` +
      ` | ${g.entering21.shortfall}/${w.entering21.shortfall} | ${g.entering21.credit}/${w.entering21.credit}` +
      ` | wk20 ${g.week20Block.credit}/${w.week20Block.credit} | capped G:${g.cappedWeeks} W:${w.cappedWeeks}`,
    );
  }
}
console.log('breakevens:', JSON.stringify(breakevens, null, 1));
console.log('switchPolicy (guards until JS internal>=16, then wings):', JSON.stringify(switchPolicy, null, 1));
console.log('written:', path.join(outDir, 'one-on-one-choice.json'));
