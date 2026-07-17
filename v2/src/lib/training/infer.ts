import { minutesAtPositions } from './bridge';
import { getTrainingType, TRAINING_CATALOG } from './catalog';
import { weekStep, type PlayerState } from './engine';
import { BBSCOUT } from './models/bbscout';
import { SKILL_KEYS, type SkillKey, type Skills } from './types';
import type { PopEvent } from './pops';
import type { WeekMinutes } from '@/queries/minutes';

export interface PlayerWindowEvidence {
  playerId: number;
  state: PlayerState;   // at windowStart (earlier snapshot, midpoint sublevels)
  pops: PopEvent[];     // this player's displayed changes over the window
  weeks: WeekMinutes[]; // season-weeks overlapping the window (may be empty)
  windowWeeks: number;
}

export interface InferenceResult {
  inferredTrainingId: number | null;
  confidence: 'high' | 'medium' | 'low';
  scores: Array<{ trainingId: number; score: number }>; // top 5, desc
  popCount: number;     // positive rate-skill displayed levels across players
  playerCount: number;
  explainedFrac: number | null; // top score / popCount
}

/** 'superior' = ×1.00 — neutral assumption for clubs whose staff we can't see. */
const ASSUMED_COACH_LEVEL = 5;

/** A non-popped displayed integer can hide up to ~1 level of sublevel gain; predicted
 *  gains beyond that on a skill that did NOT pop contradict the observation. */
const CONTRADICTION_TOLERANCE = 1.0;
const CONTRADICTION_WEIGHT = 0.5;

/** Margin denominator floor. When every different-primary rival scores ≤ 0 the raw
 *  ratio is ∞, which promoted a barely-positive top score straight to 'high'. Flooring
 *  the denominator keeps margins finite: high (margin ≥ 1.5) then implies top.score
 *  ≥ 0.75 explained levels even with no positive rival. (Engineering judgment —
 *  fold into the ground-truth threshold recalibration.) */
const RIVAL_SCORE_FLOOR = 0.5;

const isRateSkill = (s: string): s is SkillKey => (SKILL_KEYS as readonly string[]).includes(s);

/** Predicted per-skill gains if the club ran training `tid` for the whole window. */
function predictedGains(ev: PlayerWindowEvidence, tid: number): Skills {
  const total = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Skills;
  if (ev.weeks.length === 0) {
    // No minutes data: rate signal only, assume full minutes.
    const r = weekStep(ev.state, { trainingId: tid, coachLevel: ASSUMED_COACH_LEVEL }, BBSCOUT);
    for (const k of SKILL_KEYS) total[k] = r.gains[k] * ev.windowWeeks;
    return total;
  }
  for (const w of ev.weeks) {
    const minutes = minutesAtPositions(w, tid);
    const r = weekStep(ev.state, { trainingId: tid, coachLevel: ASSUMED_COACH_LEVEL, minutes }, BBSCOUT);
    for (const k of SKILL_KEYS) total[k] += r.gains[k];
  }
  // Weeks without boxscore coverage: extrapolate from the observed weeks' average.
  const scale = ev.windowWeeks / ev.weeks.length;
  for (const k of SKILL_KEYS) total[k] *= scale;
  return total;
}

/** Which single weekly training best explains a club-window's pooled pops.
 *  A training must both predict the pops that happened (explained, capped at the
 *  observed delta) and NOT predict pops that didn't happen (contradiction penalty) —
 *  without the penalty, one pop saturates min(pred, delta) for every training whose
 *  secondary rates reach the delta and ties fall to catalog order.
 *  ST/FT pops are excluded (training court + gym scatter pop them regardless of the slot),
 *  which also means Team Stamina / Team Free Throws weeks are not inferable — by design. */
export function inferClubTraining(evidence: PlayerWindowEvidence[]): InferenceResult {
  const rated = evidence.map((ev) => {
    const popped = new Map<SkillKey, number>();
    const dropped = new Set<SkillKey>();
    for (const p of ev.pops) {
      if (!isRateSkill(p.skill)) continue;
      if (p.delta > 0) popped.set(p.skill, (popped.get(p.skill) ?? 0) + p.delta);
      else dropped.add(p.skill);
    }
    return { ev, popped, dropped };
  });
  const popCount = rated.reduce((a, r) => a + [...r.popped.values()].reduce((b, d) => b + d, 0), 0);
  const playerCount = evidence.length;
  if (popCount === 0) {
    return { inferredTrainingId: null, confidence: 'low', scores: [], popCount, playerCount, explainedFrac: null };
  }

  const full: Array<{ trainingId: number; score: number; explained: number }> = [];
  for (const tt of TRAINING_CATALOG) {
    if (tt.kind !== 'skill') continue;
    let explained = 0;
    let contradiction = 0;
    for (const { ev, popped, dropped } of rated) {
      const gains = predictedGains(ev, tt.id);
      for (const k of SKILL_KEYS) {
        const delta = popped.get(k);
        if (delta !== undefined) explained += Math.min(gains[k], delta);
        else if (!dropped.has(k)) contradiction += Math.max(0, gains[k] - CONTRADICTION_TOLERANCE);
      }
    }
    full.push({ trainingId: tt.id, score: explained - CONTRADICTION_WEIGHT * contradiction, explained });
  }
  full.sort((a, b) => b.score - a.score);
  const scores = full.slice(0, 5).map(({ trainingId, score }) => ({ trainingId, score }));

  const top = full[0];
  if (!top || top.score <= 0) {
    return { inferredTrainingId: null, confidence: 'low', scores, popCount, playerCount, explainedFrac: 0 };
  }
  // Margin vs the best training with a DIFFERENT primary skill; same-primary
  // position variants score near-identically and shouldn't dilute confidence.
  const topPrimary = getTrainingType(top.trainingId).primary;
  const rival = full.find((s) => getTrainingType(s.trainingId).primary !== topPrimary);
  const margin = top.score / Math.max(rival?.score ?? 0, RIVAL_SCORE_FLOOR);
  const explainedFrac = top.explained / popCount;

  // Tunable thresholds (engineering judgment; revisit against own-team ground truth).
  const confidence: InferenceResult['confidence'] =
    popCount >= 3 && explainedFrac >= 0.5 && margin >= 1.5 ? 'high'
    : popCount >= 2 && margin >= 1.2 ? 'medium'
    : 'low';

  return { inferredTrainingId: top.trainingId, confidence, scores, popCount, playerCount, explainedFrac };
}
