'use client';

import { useMemo, useState, useTransition } from 'react';
import BandChart from '@/components/charts/BandChart';
import { savePlan } from '@/app/players/[id]/actions';
import { SKILLS } from '@/lib/constants';
import { bandSeries, planToWeeks } from '@/lib/training/bridge';
import { displayed, type PlayerState } from '@/lib/training/engine';
import { ensembleProject } from '@/lib/training/ensemble';
import { estimateSalary } from '@/lib/training/salary';
import type { PlanTemplate } from '@/lib/training/templates';
import { SKILL_DB_NAMES, SKILL_KEYS, type Skills } from '@/lib/training/types';
import type { PlanRow, WeekMinutes } from '@/queries/minutes'; // type-only import is fine (no IO)
import CapBar from './CapBar';
import PlanEditor, { type PlanValue } from './PlanEditor';

const SKILL_NAME: Record<string, string> = Object.fromEntries(SKILLS.map((s) => [s.dbKey, s.name]));

function toDbDisplayed(s: Skills): Record<string, number | null> {
  return Object.fromEntries(SKILL_KEYS.map((k) => [SKILL_DB_NAMES[k], displayed(s[k])]));
}

export default function DevelopmentSection({
  playerId, playerState, startWeekOfSeason, weeks, age, initialPlan, templates, skillsDb, potential,
}: {
  playerId: number;
  playerState: PlayerState | null;
  startWeekOfSeason: number;
  weeks: WeekMinutes[];
  age: number | null;
  initialPlan: PlanRow | null;
  templates: PlanTemplate[];
  skillsDb: Record<string, number | null>;
  potential: number | null;
}) {
  const [plan, setPlan] = useState<PlanValue>(() => {
    if (initialPlan) {
      return { blocks: initialPlan.blocks, coachLevel: initialPlan.coachLevel, youthTrainerLevel: initialPlan.youthTrainerLevel };
    }
    const first = templates[0];
    return { blocks: first ? first.blocks.map((b) => ({ ...b })) : [], coachLevel: 5, youthTrainerLevel: 0 };
  });
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const weekConfigs = useMemo(
    () => planToWeeks(plan.blocks, plan.coachLevel, plan.youthTrainerLevel),
    [plan],
  );
  const result = useMemo(() => {
    if (!playerState || weekConfigs.length === 0) return null;
    return ensembleProject(playerState, weekConfigs, { startWeekOfSeason });
  }, [playerState, weekConfigs, startWeekOfSeason]);
  const points = useMemo(() => (result ? bandSeries(result) : []), [result]);

  function handleChange(next: PlanValue) {
    setPlan(next);
    setSaved(false);
  }

  function handleSave() {
    setSaved(false);
    startSaving(async () => {
      await savePlan(playerId, {
        name: initialPlan?.name,
        blocks: plan.blocks,
        coachLevel: plan.coachLevel,
        youthTrainerLevel: plan.youthTrainerLevel,
      });
      setSaved(true);
    });
  }

  const salaryNow = playerState ? estimateSalary(playerState.skills).salary : null;
  const salaryProjected = result ? estimateSalary(result.central.finalSkills).salary : null;
  const projectedDbSkills = result ? toDbDisplayed(result.central.finalSkills) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-2">Projected TSP</h3>
        {result ? (
          <>
            <BandChart points={points} xLabel={(x) => `wk ${x}`} />
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
                        <td className="pr-3 text-right">{result.central.finalSkills[k].toFixed(1)}</td>
                        <td className="pr-3 text-right text-neutral-500">
                          [{result.band.low[k].toFixed(1)}..{result.band.high[k].toFixed(1)}]
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
          <p className="text-sm text-neutral-500">
            {playerState
              ? 'Add at least one training block to see a projection.'
              : 'Need a full skill snapshot before projecting training.'}
          </p>
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
        />
        {saved && <p className="text-xs text-green-500 mt-2">Saved.</p>}
      </div>
    </div>
  );
}
