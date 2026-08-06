// ADVERSARIAL VERIFICATION (independent recompute) — NOT part of the study harness.
// Recomputes the actual-path simulation for two players (Rožle Ostroveršnik, Francis
// Koštomaj) from series.csv/weeks.csv with INDEPENDENT choices:
//  - age threaded by season-boundary dates (2024-12-27 / 2025-04-04 / 2025-07-11 rollovers),
//    applied BEFORE the week's step (harness threads age from same-date cards AFTER stepping)
//  - minutes deviations re-derived from the Slovenian minutes_note text by the verifier
//  - staff schedule coded from the briefing ground truth, not copied from the harness
// Usage (from v2/): npx tsx scripts/training/centri-analysis/retro/adv-verify-sim.mts
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PARSED = 'C:/Users/Rn5ho/Downloads/centri-u21/parsed';
const { weekStep, displayed } = await import('../../../../src/lib/training/engine');
const { SKILL_KEYS, skillsFromArray } = await import('../../../../src/lib/training/types');
const { BBSCOUT } = await import('../../../../src/lib/training/models/bbscout');
type PlayerState = import('../../../../src/lib/training/engine').PlayerState;
type SkillKey = import('../../../../src/lib/training/types').SkillKey;

function rows(file: string): Record<string, string>[] {
  const raw = readFileSync(path.join(PARSED, file), 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const split = (line: string) => {
    const out: string[] = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
    }
    out.push(cur); return out;
  };
  const header = split(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [header[i], v])));
}

const series = rows('series.csv');
const weeks = rows('weeks.csv');

// Season rollovers in the Centri arc (validated: card ages flip 18→19 at 2024-12-27/28,
// 19→20 at 2025-04-04/11, 20→21 at 2025-07-11/12).
const ROLLOVERS = ['2024-12-27', '2025-04-04', '2025-07-11'];
function ageAt(startAge: number, date: string): number {
  return startAge + ROLLOVERS.filter((r) => date >= r).length;
}

// Verifier's own reading of minutes_note (weeks.csv):
// pjtr576 wk23 "Ostrovršnik 46 min", wk32/33/35/36 "Ostroveršnik 46 minut", wk45/46 same.
// alenokc wk25 "2x 48 min, Koštomaj 26 min".
const MY_MINUTES: Record<string, Record<number, number>> = {
  'Rožle Ostroveršnik': { 23: 46, 32: 46, 33: 46, 35: 46, 36: 46, 45: 46, 46: 46 },
  'Francis Koštomaj': { 25: 26 },
};

// Briefing ground truth staff schedules.
function staff(author: string, date: string) {
  if (author === 'pjtr576') {
    return { coachLevel: date >= '2025-07-26' ? 6 : 5, youthTrainerLevel: date >= '2025-04-04' ? 0 : 6, gymLevel: 3, trainingCourtLevel: 0 };
  }
  return { coachLevel: 7, youthTrainerLevel: date >= '2025-06-13' ? 0 : 7, gymLevel: 3, trainingCourtLevel: 3 };
}

for (const name of ['Rožle Ostroveršnik', 'Francis Koštomaj']) {
  const cards = series.filter((r) => r.player_name === name);
  const first = cards[0];
  const last = cards[cards.length - 1];
  const author = first.author;
  const startAge = Number(first.age);

  let st: PlayerState = {
    skills: skillsFromArray(SKILL_KEYS.map((k) => Math.max(0.5, Number(first[k]) - 0.5))),
    age: startAge, heightCm: Number(first.height_cm), potential: Number(first.potential_num),
    ftSkill: Number(first.ft) - 0.5, staminaSkill: Number(first.st) - 0.5,
  };

  const trainWeeks = weeks
    .filter((w) => w.author === author && w.training_key && w.report_date >= first.report_date && w.report_date <= last.report_date)
    .sort((a, b) => a.report_date.localeCompare(b.report_date));

  let n = 0;
  for (const w of trainWeeks) {
    const minutes = MY_MINUTES[name]?.[Number(w.week_no)] ?? 48;
    const age = ageAt(startAge, w.report_date); // age BEFORE step (independent convention)
    st = { ...st, age };
    const r = weekStep(st, { trainingId: Number(w.training_key), minutes, ...staff(author, w.report_date) }, BBSCOUT);
    st = { ...st, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter };
    n++;
  }

  const simEnd = Object.fromEntries(SKILL_KEYS.map((k) => [k, displayed(st.skills[k])])) as Record<SkillKey, number>;
  const obsEnd = Object.fromEntries(SKILL_KEYS.map((k) => [k, Number(last[k])])) as Record<SkillKey, number>;
  const absErr = SKILL_KEYS.reduce((a, k) => a + Math.abs(simEnd[k] - obsEnd[k]), 0);
  console.log(`== ${name} (${author}) weeks simulated: ${n}`);
  console.log('  simEnd:', SKILL_KEYS.map((k) => `${k}${simEnd[k]}`).join(' '));
  console.log('  obsEnd:', SKILL_KEYS.map((k) => `${k}${obsEnd[k]}`).join(' '));
  console.log(`  sum |err| = ${absErr}`);
  const under = SKILL_KEYS.filter((k) => simEnd[k] < obsEnd[k]).length;
  const over = SKILL_KEYS.filter((k) => simEnd[k] > obsEnd[k]).length;
  console.log(`  direction: under-sim on ${under}/10 skills, over-sim on ${over}/10`);
}
