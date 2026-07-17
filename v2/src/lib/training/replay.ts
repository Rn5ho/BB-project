// Replay observed training weeks through a model and score its pop predictions.
// Pure — shared by the replay-case CLI and the self-trainer cron job (extracted
// 2026-07-17 from scripts/training/replay-case.mts).
import { weekStep, displayed, type PlayerState } from './engine';
import { SKILL_KEYS, skillsFromArray, type ModelParams, type SkillKey } from './types';

export interface ReplayWeek {
  date: string;
  trainingId: number;
  minutes: number | undefined;
  observedPops: Partial<Record<SkillKey, number>>;
  ageAfterThis?: number;
}

export interface ReplayCase {
  label: string;
  startSkills: number[]; // displayed, SKILL_KEYS order
  startAge: number; heightCm: number; potential: number;
  startStamina: number | null; startFreeThrow: number | null;
  coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number;
  weeks: ReplayWeek[];
  endSkills: Array<number | null>;
  unmodeledPopCount: number; // stamina/FT/experience pops (not scored)
}

export interface ReplayEvent { date: string; skill: SkillKey; kind: 'miss' | 'false-alarm'; detail: string }

export interface ReplayScore {
  hits: number; misses: number; falseAlarms: number;
  endAbsErr: number; endCount: number; endExact: number;
  events: ReplayEvent[];
}

/** Step the case's weeks through `model` and score predicted vs observed pops plus
 *  final displayed skills. Start sublevels = displayed − 0.5 midpoints. */
export function replayCase(c: ReplayCase, model: ModelParams): ReplayScore {
  let state: PlayerState = {
    skills: skillsFromArray(c.startSkills.map((v) => Math.max(0.5, v - 0.5))),
    age: c.startAge, heightCm: c.heightCm, potential: c.potential,
    ftSkill: (c.startFreeThrow ?? 1) - 0.5,
    staminaSkill: (c.startStamina ?? 1) - 0.5,
  };
  let hits = 0, misses = 0, falseAlarms = 0;
  const events: ReplayEvent[] = [];
  for (const wk of c.weeks) {
    const r = weekStep(state, {
      trainingId: wk.trainingId, coachLevel: c.coachLevel,
      youthTrainerLevel: c.youthTrainerLevel, minutes: wk.minutes,
      gymLevel: c.gymLevel, trainingCourtLevel: c.trainingCourtLevel,
    }, model);
    const predicted = SKILL_KEYS.filter((k) => r.pops[k]);
    const observed = Object.keys(wk.observedPops) as SkillKey[];
    for (const k of observed) {
      if (predicted.includes(k)) hits++;
      else { misses++; events.push({ date: wk.date, skill: k, kind: 'miss', detail: `${state.skills[k].toFixed(2)}→${r.skillsAfter[k].toFixed(2)}` }); }
    }
    for (const k of predicted) {
      if (!observed.includes(k)) { falseAlarms++; events.push({ date: wk.date, skill: k, kind: 'false-alarm', detail: `→${r.skillsAfter[k].toFixed(2)}` }); }
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
  return { hits, misses, falseAlarms, endAbsErr, endCount, endExact, events };
}

// ─── Scraped-history → ReplayCase ────────────────────────────────────────────

export interface ScrapedWeek {
  date: string; label: string; trainingId: number | null; minutes: number | null;
  pops: Array<{ key: string | null; from: number; to: number }>;
  ageEvent?: string;
}

export interface ScrapedCaseInput {
  label: string;
  rawWeeks: ScrapedWeek[]; // chronological (oldest first)
  heightCm: number;
  potential: number | null;
  snapshotAge: number | null;       // age on the end snapshot (fallback if no age events)
  endSkills: Partial<Record<SkillKey, number | null>>; // latest full snapshot, displayed
  endStamina: number | null;
  endFreeThrow: number | null;
  coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number;
}

/** Build a ReplayCase from scraped training history: training weeks from the page,
 *  end skills from the latest full snapshot, start skills back-tracked to each skill's
 *  first pop (its from-level), ages threaded from the page's age-increase events. */
export function caseFromScrapedHistory(input: ScrapedCaseInput): ReplayCase {
  const raw = input.rawWeeks;
  const firstAgeEvent = raw.find((w) => w.ageEvent);
  const startAge = firstAgeEvent
    ? Number(firstAgeEvent.ageEvent!.match(/(\d+)/)?.[1]) - 1
    : (input.snapshotAge ?? 18);
  let age = startAge;
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
  // back-track start skills: for each skill, the FIRST pop's from-level; otherwise the end value
  const startSkills = SKILL_KEYS.map((k) => {
    const firstPop = raw.flatMap((w) => w.pops).find((p) => p.key === k);
    return firstPop ? firstPop.from : (input.endSkills[k] ?? 1);
  });
  return {
    label: input.label,
    startSkills: startSkills.map((v) => v ?? 1),
    startAge, heightCm: input.heightCm, potential: input.potential ?? 8,
    startStamina: input.endStamina, startFreeThrow: input.endFreeThrow,
    coachLevel: input.coachLevel, youthTrainerLevel: input.youthTrainerLevel,
    gymLevel: input.gymLevel, trainingCourtLevel: input.trainingCourtLevel,
    weeks,
    endSkills: SKILL_KEYS.map((k) => input.endSkills[k] ?? null),
    unmodeledPopCount: unmodeled,
  };
}
