'use client';

import { useMemo, useState } from 'react';
import BoundedNumberInput from '@/components/training/BoundedNumberInput';
import HorizonPicker from '@/components/training/HorizonPicker';
import { SKILLS } from '@/lib/constants';
import { evaluateArchetype } from '@/lib/archetypes/evaluate';
import { archetypeTargets } from '@/lib/archetypes/targets';
import type { EffectiveArchetype, EvalPlayer } from '@/lib/archetypes/types';
import { getTrainingType } from '@/lib/training/catalog';
import { displayed, type PlayerState } from '@/lib/training/engine';
import { absWeek, fromAbsWeek, horizonWeeks, type SeasonPoint } from '@/lib/training/horizon';
import {
  optimizePlan, type OptimizeResult, type PlanCandidate, type SkillTarget, type TargetPriority,
} from '@/lib/training/optimize';
import { SKILL_DB_NAMES, SKILL_KEYS, type SkillKey } from '@/lib/training/types';

const SKILL_NAME: Record<string, string> = Object.fromEntries(SKILLS.map((s) => [s.dbKey, s.name]));
const PRIORITIES: Array<{ value: TargetPriority; label: string }> = [
  { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'low', label: 'Low' },
];

function blocksSummary(c: PlanCandidate): string {
  return c.blocks.map((b) => `${getTrainingType(b.trainingId).label} ×${b.weeks}`).join(' → ');
}

export default function TargetBuildPanel({
  playerState, skillsDb, currentAge, startWeekOfSeason, defaultHorizon, staff, onUsePlan,
  archetypes, evalPlayer,
}: {
  playerState: PlayerState;
  skillsDb: Record<string, number | null>;
  currentAge: number;
  startWeekOfSeason: number;
  defaultHorizon: SeasonPoint | null;
  staff: { coachLevel: number; youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number };
  onUsePlan: (blocks: Array<{ trainingId: number; weeks: number }>, horizon: SeasonPoint) => void;
  /** When provided, the panel proposes targets from the best-matching archetype's age-21
   *  build on first open and auto-runs the search; a selector allows switching archetype. */
  archetypes?: EffectiveArchetype[];
  evalPlayer?: EvalPlayer | null;
}) {
  const current = useMemo(
    () => Object.fromEntries(
      SKILL_KEYS.map((k) => [k, skillsDb[SKILL_DB_NAMES[k]] ?? 1]),
    ) as Record<SkillKey, number>,
    [skillsDb],
  );
  const [open, setOpen] = useState(false);
  /** Explicit targets only — a missing key means "not targeted" (the input follows the
   *  current skill), so live-editing the player's skills can't fabricate targets. */
  const [targets, setTargets] = useState<Partial<Record<SkillKey, number>>>({});
  const [priority, setPriority] = useState<Record<SkillKey, TargetPriority>>(
    () => Object.fromEntries(SKILL_KEYS.map((k) => [k, 'normal'])) as Record<SkillKey, TargetPriority>,
  );
  const [horizon, setHorizon] = useState<SeasonPoint>(defaultHorizon ?? { age: 22, week: 1 });
  const [run, setRun] = useState<{ fingerprint: string; result: OptimizeResult } | null>(null);
  const [busy, setBusy] = useState(false);
  const [archetypeId, setArchetypeId] = useState<string>('');
  const [proposed, setProposed] = useState(false); // first-open auto-proposal done

  const now: SeasonPoint = { age: currentAge, week: startWeekOfSeason };
  const H = horizonWeeks(now, horizon);
  const targeted = SKILL_KEYS.filter((k) => (targets[k] ?? current[k]) > current[k]);

  // Archetypes ranked by fit: matches first, then fewest failing conditions.
  const ranked = useMemo(() => {
    if (!archetypes || archetypes.length === 0) return [];
    const rows = archetypes.map((a) => {
      const r = evalPlayer ? evaluateArchetype(evalPlayer, a) : null;
      return { a, matches: r?.matches ?? false, fails: r ? r.checks.filter((c) => !c.pass).length : 99 };
    });
    return rows.sort((x, y) =>
      Number(y.matches) - Number(x.matches) || x.fails - y.fails || x.a.name.localeCompare(y.a.name));
  }, [archetypes, evalPlayer]);

  const fingerprintFor = (
    t: Partial<Record<SkillKey, number>>, p: Record<SkillKey, TargetPriority>, h: SeasonPoint,
  ) => JSON.stringify([current, t, p, h, staff, currentAge, startWeekOfSeason]);

  // Everything the search reads. A result renders only while this still matches the
  // fingerprint it ran with — editing skills, staff, targets or the deadline hides it.
  const fingerprint = fingerprintFor(targets, priority, horizon);
  const result = run != null && run.fingerprint === fingerprint ? run.result : null;
  const stale = run != null && result == null;

  function setTarget(k: SkillKey, n: number) {
    setTargets((t) => {
      const next = { ...t };
      if (n > current[k]) next[k] = n;
      else delete next[k]; // at/below current = not a target
      return next;
    });
  }

  function runOptimizeWith(
    t: Partial<Record<SkillKey, number>>, p: Record<SkillKey, TargetPriority>, h: SeasonPoint,
  ) {
    const keys = SKILL_KEYS.filter((k) => (t[k] ?? current[k]) > current[k]);
    const hWeeks = horizonWeeks(now, h);
    if (keys.length === 0 || hWeeks === 0) return;
    setBusy(true);
    const fp = fingerprintFor(t, p, h);
    const specs: SkillTarget[] = keys.map((k) => ({
      skill: k, displayed: t[k] ?? current[k], priority: p[k],
    }));
    // setTimeout lets the busy state paint before the synchronous search runs.
    setTimeout(() => {
      setRun({
        fingerprint: fp,
        result: optimizePlan(playerState, specs, {
          horizonWeeks: hWeeks,
          startWeekOfSeason,
          coachLevel: staff.coachLevel,
          youthTrainerLevel: staff.youthTrainerLevel,
          gymLevel: staff.gymLevel,
          trainingCourtLevel: staff.trainingCourtLevel,
        }),
      });
      setBusy(false);
    }, 20);
  }

  function runOptimize() {
    runOptimizeWith(targets, priority, horizon);
  }

  /** Load an archetype's age-21 build as targets (skills already at target are left
   *  untargeted) and immediately propose a plan for it. */
  function applyArchetype(id: string) {
    setArchetypeId(id);
    const entry = ranked.find((r) => r.a.id === id);
    if (!entry) return;
    const raw = archetypeTargets(entry.a);
    const t: Partial<Record<SkillKey, number>> = {};
    for (const k of SKILL_KEYS) {
      const v = raw[k];
      if (v != null && v > current[k]) t[k] = v;
    }
    const p = Object.fromEntries(SKILL_KEYS.map((k) => [k, 'normal'])) as Record<SkillKey, TargetPriority>;
    setTargets(t);
    setPriority(p);
    runOptimizeWith(t, p, horizon);
  }

  function handleToggleOpen() {
    const opening = !open;
    setOpen(opening);
    // First open with no targets yet: propose from the best-fitting archetype.
    if (opening && !proposed && targeted.length === 0 && ranked.length > 0) {
      setProposed(true);
      applyArchetype(ranked[0].a.id);
    }
  }

  function handleHorizonChange(h: SeasonPoint | null) {
    if (!h) return;
    setHorizon(h);
    if (targeted.length > 0) runOptimizeWith(targets, priority, h); // re-propose for the new deadline
  }

  function verdict(c: PlanCandidate): string {
    if (c.reachable) {
      const weeks = targeted.map((k) => c.hitWeek[k]).filter((w): w is number => w != null);
      if (weeks.length === 0) return 'All targets already reached.';
      const at = fromAbsWeek(absWeek(now) + Math.max(...weeks));
      return `Build reachable by age ${at.age} wk ${at.week}`;
    }
    const misses = targeted
      .filter((k) => (c.shortfall[k] ?? 0) > 0)
      .map((k) => `${SKILL_NAME[SKILL_DB_NAMES[k]] ?? k} −${(c.shortfall[k] ?? 0).toFixed(1)}`);
    return `Not fully reachable — best effort leaves ${misses.join(', ')} (≈ levels short)`;
  }

  const candidates: PlanCandidate[] = result?.best ? [result.best, ...result.alternatives] : [];

  return (
    <div className="rounded border border-neutral-800 p-3">
      <button
        onClick={handleToggleOpen}
        className="flex w-full items-center justify-between text-sm font-medium text-neutral-300"
      >
        <span>Target build (reverse planner)</span>
        <span className="text-neutral-500">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {ranked.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral-400">Archetype</span>
              <select
                value={archetypeId}
                onChange={(e) => { if (e.target.value) applyArchetype(e.target.value); }}
                className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
              >
                {archetypeId === '' && <option value="">Pick an archetype…</option>}
                {ranked.map(({ a, matches, fails }) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{matches ? ' ✓' : fails < 99 ? ` (${fails} short)` : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-neutral-500">
                loads its age-21 build as targets and proposes a plan
              </span>
            </div>
          )}

          <p className="text-xs text-neutral-500">
            Raise the skills you care about; untouched skills are ignored. The search assumes
            full minutes and your current staff/facility settings.
          </p>

          <div className="grid gap-1.5 sm:grid-cols-2">
            {SKILL_KEYS.map((k) => {
              const isTargeted = (targets[k] ?? current[k]) > current[k];
              return (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 text-neutral-400">{SKILL_NAME[SKILL_DB_NAMES[k]] ?? k}</span>
                  <span className="w-6 text-right text-neutral-500">{current[k]}</span>
                  <span className="text-neutral-600">→</span>
                  <BoundedNumberInput
                    value={targets[k] ?? current[k]} min={1} max={20}
                    onCommit={(n) => setTarget(k, n)}
                    className={`w-14 rounded border px-2 py-1 text-sm ${isTargeted ? 'border-amber-700 bg-neutral-900' : 'border-neutral-700 bg-neutral-900'}`}
                  />
                  {isTargeted && (
                    <select
                      value={priority[k]}
                      onChange={(e) => setPriority((p) => ({ ...p, [k]: e.target.value as TargetPriority }))}
                      className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-xs"
                    >
                      {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-neutral-400">Deadline</span>
            <HorizonPicker
              value={horizon}
              onChange={handleHorizonChange}
              currentAge={currentAge}
              required
            />
            <span className="text-xs text-neutral-500">{H} wk{H === 1 ? '' : 's'}</span>
            <button
              onClick={runOptimize}
              disabled={busy || targeted.length === 0 || H === 0}
              className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'Optimizing…' : 'Optimize'}
            </button>
            {targeted.length === 0 && <span className="text-xs text-neutral-500">set at least one target above its current level</span>}
            {H === 0 && <span className="text-xs text-amber-500">deadline is in the past</span>}
          </div>

          {stale && !busy && (
            <p className="text-xs text-neutral-500">Inputs changed since the last run — press Optimize to refresh.</p>
          )}

          {result && !result.best && (
            <p className="text-sm text-neutral-500">Nothing to optimize — every target is already reached.</p>
          )}

          {result?.best && (
            <div className="space-y-3">
              <p className={`text-sm font-medium ${result.best.reachable ? 'text-green-500' : 'text-amber-500'}`}>
                {verdict(result.best)}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-800 text-left text-neutral-400">
                    <tr>
                      <th className="py-1.5 pr-3">Skill</th>
                      <th className="pr-3 text-right">Now</th>
                      <th className="pr-3 text-right">Target</th>
                      <th className="pr-3">Priority</th>
                      <th className="pr-3 text-right">Projected</th>
                      <th className="pr-3">Hit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targeted.map((k) => {
                      const best = result.best!;
                      const hit = best.hitWeek[k];
                      const at = hit != null ? fromAbsWeek(absWeek(now) + hit) : null;
                      return (
                        <tr key={k} className="border-b border-neutral-900">
                          <td className="py-1 pr-3">{SKILL_NAME[SKILL_DB_NAMES[k]] ?? k}</td>
                          <td className="pr-3 text-right">{current[k]}</td>
                          <td className="pr-3 text-right">{targets[k] ?? current[k]}</td>
                          <td className="pr-3 text-xs text-neutral-400">{priority[k]}</td>
                          <td className="pr-3 text-right">{displayed(best.finalSkills[k])}</td>
                          <td className="pr-3">
                            {at
                              ? <span className="text-green-500">✓ age {at.age} wk {at.week}</span>
                              : <span className="text-red-400">−{(best.shortfall[k] ?? 0).toFixed(1)}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                {candidates.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded border border-neutral-800 p-2 text-xs">
                    <span className="font-medium text-neutral-300">{i === 0 ? 'Best' : `Alt ${i}`}</span>
                    <span className="flex-1 text-neutral-400">{blocksSummary(c)}</span>
                    {!c.reachable && <span className="text-amber-500">short {c.totalShortfall.toFixed(1)}</span>}
                    <button
                      onClick={() => onUsePlan(c.blocks.map((b) => ({ ...b })), horizon)}
                      className="rounded border border-amber-700 px-2 py-1 text-amber-500 hover:bg-amber-950"
                    >
                      Use this plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
