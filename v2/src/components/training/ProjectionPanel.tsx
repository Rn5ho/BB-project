'use client';

import { useMemo, useState, useTransition } from 'react';
import BandChart from '@/components/charts/BandChart';
import CapBar from '@/components/player/CapBar';
import PlanEditor, { type PlanValue } from '@/components/player/PlanEditor';
import { SKILLS } from '@/lib/constants';
import { bandSeries, displayEquivalent, planToWeeks } from '@/lib/training/bridge';
import { displayed, type PlayerState } from '@/lib/training/engine';
import { ensembleProject, type SublevelBounds } from '@/lib/training/ensemble';
import { horizonWeeks, normalizePlan, type SeasonPoint } from '@/lib/training/horizon';
import { estimateSalary } from '@/lib/training/salary';
import type { PlanTemplate } from '@/lib/training/templates';
import { SKILL_DB_NAMES, SKILL_KEYS, type Skills } from '@/lib/training/types';

const SKILL_NAME: Record<string, string> = Object.fromEntries(SKILLS.map((s) => [s.dbKey, s.name]));

function toDbDisplayed(s: Skills): Record<string, number | null> {
  return Object.fromEntries(SKILL_KEYS.map((k) => [SKILL_DB_NAMES[k], displayed(s[k])]));
}

export default function ProjectionPanel({
  playerState, skillsDb, potential, age, startWeekOfSeason, initialPlan, templates, onSave, sublevelBounds,
}: {
  playerState: PlayerState;
  skillsDb: Record<string, number | null>;
  potential: number | null;
  age: number | null;
  startWeekOfSeason: number;
  initialPlan?: { blocks: Array<{ trainingId: number; weeks: number }>; coachLevel: number; youthTrainerLevel: number; gymLevel?: number; trainingCourtLevel?: number; horizon?: { age: number; week: number } | null } | null;
  templates: PlanTemplate[];
  /** When provided, the Save button appears and calls this. When omitted, Save is hidden. */
  onSave?: (value: PlanValue) => Promise<void>;
  sublevelBounds?: SublevelBounds;
}) {
  const now: SeasonPoint | null = age != null ? { age: Math.floor(age), week: startWeekOfSeason } : null;
  const [plan, setPlan] = useState<PlanValue>(() => {
    if (initialPlan) {
      return normalizePlan({
        blocks: initialPlan.blocks.map((b) => ({ ...b })), coachLevel: initialPlan.coachLevel,
        youthTrainerLevel: initialPlan.youthTrainerLevel,
        gymLevel: initialPlan.gymLevel ?? 0, trainingCourtLevel: initialPlan.trainingCourtLevel ?? 0,
        horizon: initialPlan.horizon ?? null,
      }, now);
    }
    const first = templates[0];
    return { blocks: first ? first.blocks.map((b) => ({ ...b })) : [], coachLevel: 5, youthTrainerLevel: 0, gymLevel: 0, trainingCourtLevel: 0, horizon: null };
  });
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const horizonLen = plan.horizon && now ? horizonWeeks(now, plan.horizon) : null;
  const weekConfigs = useMemo(() => {
    const all = planToWeeks(plan.blocks, plan.coachLevel, plan.youthTrainerLevel,
      { gymLevel: plan.gymLevel, trainingCourtLevel: plan.trainingCourtLevel });
    return horizonLen != null ? all.slice(0, horizonLen) : all;
  }, [plan, horizonLen]);
  const result = useMemo(() => {
    if (weekConfigs.length === 0) return null;
    return ensembleProject(playerState, weekConfigs, { startWeekOfSeason, sublevelBounds });
  }, [playerState, weekConfigs, startWeekOfSeason, sublevelBounds]);
  const points = useMemo(() => (result ? bandSeries(result) : []), [result]);
  const markers = useMemo(() => {
    if (!result) return [];
    const ms: Array<{ x: number; label: string }> = [];
    for (let i = 0; i < result.central.weeks.length; i++) {
      const w = result.central.weeks[i];
      if (w.seasonWeek === 14) ms.push({ x: i + 1, label: `age ${w.age + 1}` });
    }
    return ms;
  }, [result]);

  function handleChange(next: PlanValue) {
    setPlan(next);
    setSaved(false);
    setSaveError(null);
  }

  function handleSave() {
    if (!onSave) return;
    setSaved(false);
    setSaveError(null);
    startSaving(async () => {
      try {
        await onSave(plan);
        setSaved(true);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed');
      }
    });
  }

  const salaryNow = estimateSalary(playerState.skills).salary;
  const salaryProjected = result ? estimateSalary(result.central.finalSkills).salary : null;
  const projectedDbSkills = result ? toDbDisplayed(result.central.finalSkills) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-2">Projected TSP</h3>
        {result ? (
          <>
            <BandChart points={points} xLabel={(x) => `wk ${x}`} markers={markers} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-3">
                <thead className="text-left text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="py-1.5 pr-3">Skill</th>
                    <th className="pr-3 text-right">Now</th>
                    <th className="pr-3 text-right">Projected</th>
                    <th className="pr-3 text-right">[low..high]</th>
                    <th className="pr-3 text-right">Pops</th>
                  </tr>
                </thead>
                <tbody>
                  {SKILL_KEYS.map((k) => {
                    const dbKey = SKILL_DB_NAMES[k];
                    const now = skillsDb[dbKey];
                    const pops = result.central.weeks.filter((w) => w.result.pops[k]).length;
                    return (
                      <tr key={k} className="border-b border-neutral-900">
                        <td className="py-1 pr-3">{SKILL_NAME[dbKey] ?? dbKey}</td>
                        <td className="pr-3 text-right">{now ?? '–'}</td>
                        <td className="pr-3 text-right">{displayEquivalent(result.central.finalSkills[k]).toFixed(1)}</td>
                        <td className="pr-3 text-right text-neutral-500">
                          [{displayEquivalent(result.band.low[k]).toFixed(1)}..{displayEquivalent(result.band.high[k]).toFixed(1)}]
                        </td>
                        <td className="pr-3 text-right">{pops || '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-neutral-400">
              <span>Salary now: {salaryNow != null ? `$${salaryNow.toLocaleString('en-US')}` : '–'}</span>
              <span>Salary projected: {salaryProjected != null ? `$${salaryProjected.toLocaleString('en-US')}` : '–'}</span>
              <span>Final age: {result.central.finalAge}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Add at least one training block to see a projection.</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-neutral-500 mb-1">now</p>
          <CapBar skills={skillsDb} potential={potential} />
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">end of plan</p>
          <CapBar skills={projectedDbSkills ?? skillsDb} potential={potential} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-2">Training plan</h3>
        <PlanEditor
          value={plan}
          onChange={handleChange}
          onSave={handleSave}
          saving={saving}
          templates={templates}
          startAge={age}
          endAge={result?.central.finalAge ?? null}
          hideSave={!onSave}
          currentSeasonWeek={startWeekOfSeason}
        />
        {onSave && saved && <p className="text-xs text-green-500 mt-2">Saved.</p>}
        {onSave && saveError && <p className="text-xs text-red-400 mt-2">Could not save: {saveError}</p>}
      </div>
    </div>
  );
}
