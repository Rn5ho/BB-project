// Replay real observed training cases through each model and score pop predictions.
// Usage: npx tsx scripts/training/replay-case.mts <case.json | directory-of-cases>
// Accepts both hand-written cases (weeks[]) and scrape-training-history output (rawWeeks[]).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { weekStep, displayed, type PlayerState } from '../../src/lib/training/engine';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from '../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../src/lib/training/models/open-source-live';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from '../../src/lib/training/types';

interface ReplayWeek { date: string; trainingId: number; minutes: number | undefined; observedPops: Partial<Record<SkillKey, number>>; ageAfterThis?: number }
interface ReplayCase {
  label: string;
  startSkills: number[]; // displayed, SKILL_KEYS order
  startAge: number; heightCm: number; potential: number;
  startStamina: number | null; startFreeThrow: number | null;
  coachLevel: number; youthTrainerLevel: number;
  weeks: ReplayWeek[];
  endSkills: Array<number | null>;
  unmodeledPopCount: number; // stamina/FT/experience pops (not scored)
}

function loadCase(file: string): ReplayCase {
  const c = JSON.parse(readFileSync(file, 'utf8'));
  if (c.weeks && !c.rawWeeks) {
    // hand-written format
    return {
      label: c.label,
      startSkills: SKILL_KEYS.map((k) => c.player.startSkillsDisplayed[k]),
      startAge: c.player.age, heightCm: c.player.heightCm, potential: c.player.potential,
      startStamina: c.player.startStamina ?? null, startFreeThrow: c.player.startFreeThrow ?? null,
      coachLevel: c.coachLevel, youthTrainerLevel: c.youthTrainerLevel,
      weeks: c.weeks.map((w: { date: string; trainingId: number; minutes: number; observedPops: Record<string, number> }) => ({
        date: w.date, trainingId: w.trainingId, minutes: w.minutes, observedPops: w.observedPops ?? {},
      })),
      endSkills: SKILL_KEYS.map((k) => c.endSkillsDisplayed?.[k] ?? null),
      unmodeledPopCount: c.weeks.reduce((a: number, w: { unmodeledPops?: object }) => a + Object.keys(w.unmodeledPops ?? {}).length, 0),
    };
  }
  // scraped format (rawWeeks, chronological)
  const raw = c.rawWeeks as Array<{ date: string; label: string; trainingId: number | null; minutes: number | null; pops: Array<{ key: string | null; to: number }>; ageEvent?: string }>;
  const firstAgeEvent = raw.find((w) => w.ageEvent);
  let age = firstAgeEvent
    ? Number(firstAgeEvent.ageEvent!.match(/(\d+)/)?.[1]) - 1
    : (c.player.age ?? 18);
  const weeks: ReplayWeek[] = [];
  let unmodeled = 0;
  for (const w of raw) {
    if (w.ageEvent) {
      const n = Number(w.ageEvent.match(/(\d+)/)?.[1]);
      if (Number.isFinite(n)) age = n;
      if (weeks.length > 0) weeks[weeks.length - 1].ageAfterThis = age;
      continue;
    }
    if (w.trainingId == null) continue;
    const observedPops: Partial<Record<SkillKey, number>> = {};
    for (const p of w.pops) {
      if (p.key && (SKILL_KEYS as readonly string[]).includes(p.key)) observedPops[p.key as SkillKey] = p.to;
      else unmodeled++;
    }
    weeks.push({ date: w.date, trainingId: w.trainingId, minutes: w.minutes ?? undefined, observedPops });
  }
  const startAge = firstAgeEvent ? Number(firstAgeEvent.ageEvent!.match(/(\d+)/)?.[1]) - 1 : (c.player.age ?? 18);
  return {
    label: c.label,
    startSkills: SKILL_KEYS.map((k) => c.player.startSkillsDisplayed[k] ?? 1),
    startAge, heightCm: c.player.heightCm, potential: c.player.potential ?? 8,
    startStamina: c.player.startStamina, startFreeThrow: c.player.startFreeThrow,
    coachLevel: c.coachLevel, youthTrainerLevel: c.youthTrainerLevel,
    weeks,
    endSkills: SKILL_KEYS.map((k) => c.endSkillsDisplayed?.[k] ?? null),
    unmodeledPopCount: unmodeled,
  };
}

function replay(c: ReplayCase, model: ModelParams, verbose: boolean) {
  let state: PlayerState = {
    skills: skillsFromArray(c.startSkills.map((v) => Math.max(0.5, v - 0.5))),
    age: c.startAge, heightCm: c.heightCm, potential: c.potential,
    ftSkill: (c.startFreeThrow ?? 1) - 0.5,
    staminaSkill: (c.startStamina ?? 1) - 0.5,
  };
  let hits = 0, misses = 0, falseAlarms = 0;
  for (const wk of c.weeks) {
    const r = weekStep(state, {
      trainingId: wk.trainingId, coachLevel: c.coachLevel,
      youthTrainerLevel: c.youthTrainerLevel, minutes: wk.minutes,
    }, model);
    const predicted = SKILL_KEYS.filter((k) => r.pops[k]);
    const observed = Object.keys(wk.observedPops) as SkillKey[];
    for (const k of observed) {
      if (predicted.includes(k)) hits++;
      else { misses++; if (verbose) console.log(`  ${wk.date}: observed ${k} pop MISSED (${state.skills[k].toFixed(2)}→${r.skillsAfter[k].toFixed(2)})`); }
    }
    for (const k of predicted) {
      if (!observed.includes(k)) { falseAlarms++; if (verbose) console.log(`  ${wk.date}: predicted ${k} pop NOT observed (→${r.skillsAfter[k].toFixed(2)})`); }
    }
    state = { ...state, skills: r.skillsAfter, ftSkill: r.ftAfter, staminaSkill: r.staminaAfter, age: wk.ageAfterThis ?? state.age };
  }
  let endAbsErr = 0, endCount = 0, endExact = 0;
  SKILL_KEYS.forEach((k, i) => {
    const want = c.endSkills[i];
    if (want == null) return;
    const got = displayed(state.skills[k]);
    endAbsErr += Math.abs(got - want);
    endCount++;
    if (got === want) endExact++;
  });
  return { hits, misses, falseAlarms, endAbsErr, endCount, endExact };
}

const target = process.argv[2];
if (!target) throw new Error('usage: replay-case.mts <case.json | dir>');
const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => f.endsWith('.json')).map((f) => path.join(target, f))
  : [target];
const verbose = files.length === 1;

const models: ModelParams[] = [BBSCOUT, COACH_PARROT, OPEN_SOURCE_LIVE, BBSCOUT_LOW, BBSCOUT_HIGH];
const totals: Record<string, { hits: number; misses: number; fa: number; err: number; n: number; exact: number }> = {};

for (const file of files) {
  const c = loadCase(file);
  const observedTotal = c.weeks.reduce((a, w) => a + Object.keys(w.observedPops).length, 0);
  console.log(`\n=== ${c.label} ===`);
  console.log(`${c.weeks.length} weeks, ${observedTotal} scored pops (+${c.unmodeledPopCount} unmodeled ST/FT/XP), coach ${c.coachLevel}, yt ${c.youthTrainerLevel}, start age ${c.startAge}`);
  for (const m of models) {
    if (verbose) console.log(`--- ${m.id} ---`);
    const r = replay(c, m, verbose);
    const t = (totals[m.id] ??= { hits: 0, misses: 0, fa: 0, err: 0, n: 0, exact: 0 });
    t.hits += r.hits; t.misses += r.misses; t.fa += r.falseAlarms; t.err += r.endAbsErr; t.n += r.endCount; t.exact += r.endExact;
    console.log(`${m.id.padEnd(18)} pops ${r.hits}/${r.hits + r.misses} hit, ${r.falseAlarms} false alarms | final skills: ${r.endExact}/${r.endCount} exact, total |err| ${r.endAbsErr}`);
  }
}

if (files.length > 1) {
  console.log('\n===== AGGREGATE =====');
  for (const [id, t] of Object.entries(totals)) {
    const recall = t.hits / (t.hits + t.misses);
    console.log(`${id.padEnd(18)} pop recall ${(recall * 100).toFixed(0)}% (${t.hits}/${t.hits + t.misses}), false alarms ${t.fa} | final-skill exact ${t.exact}/${t.n} (${((t.exact / t.n) * 100).toFixed(0)}%), MAE ${(t.err / t.n).toFixed(2)} levels`);
  }
}
