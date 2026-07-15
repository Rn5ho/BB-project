'use client';

import BoundedNumberInput from '@/components/training/BoundedNumberInput';
import HorizonPicker from '@/components/training/HorizonPicker';
import { TRAINING_CATALOG } from '@/lib/training/catalog';
import {
  WEEKS_PER_SEASON, blockBoundaries, fitBlocksToHorizon, horizonWeeks, normalizePlan,
  type SeasonPoint,
} from '@/lib/training/horizon';
import type { PlanTemplate } from '@/lib/training/templates';

export interface PlanValue {
  blocks: Array<{ trainingId: number; weeks: number }>;
  coachLevel: number;
  youthTrainerLevel: number;
  gymLevel: number;
  trainingCourtLevel: number;
  /** Horizon target: plan runs until the player enters this (age, week). null = custom. */
  horizon: SeasonPoint | null;
}

export default function PlanEditor({
  value, onChange, onSave, saving, templates, startAge, endAge: endAgeExact, hideSave,
  currentSeasonWeek,
}: {
  value: PlanValue;
  onChange: (next: PlanValue) => void;
  onSave: () => void;
  saving: boolean;
  templates: PlanTemplate[];
  /** Player's current age — fallback for the rough end-age preview text. */
  startAge?: number | null;
  /** Season-aware final age from the projection — preferred over the rough estimate. */
  endAge?: number | null;
  /** Hides the Save button (e.g. for hypothetical players with nothing to persist). */
  hideSave?: boolean;
  /** Current season week (1–14). Together with startAge enables horizon targets. */
  currentSeasonWeek?: number | null;
}) {
  const now: SeasonPoint | null =
    startAge != null && currentSeasonWeek != null
      ? { age: Math.floor(startAge), week: currentSeasonWeek }
      : null;
  const hWeeks = now && value.horizon ? horizonWeeks(now, value.horizon) : null;
  const overflowWeeks =
    hWeeks != null ? fitBlocksToHorizon(value.blocks, hWeeks).overflowWeeks : 0;
  const boundaries = now ? blockBoundaries(value.blocks, now) : null;

  const totalWeeks = value.blocks.reduce((a, b) => a + b.weeks, 0);
  const seasons = totalWeeks / WEEKS_PER_SEASON;
  const endAge = endAgeExact ?? (startAge != null ? Math.floor(startAge + seasons) : null);

  /** All edits flow through here so a horizon-derived last block stays materialized. */
  function emit(next: PlanValue) {
    onChange(normalizePlan(next, now));
  }
  function updateBlock(i: number, patch: Partial<{ trainingId: number; weeks: number }>) {
    emit({ ...value, blocks: value.blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });
  }
  function removeBlock(i: number) {
    emit({ ...value, blocks: value.blocks.filter((_, idx) => idx !== i) });
  }
  function addBlock() {
    emit({ ...value, blocks: [...value.blocks, { trainingId: 1, weeks: 8 }] });
  }
  function applyTemplate(key: string) {
    const tpl = templates.find((t) => t.key === key);
    if (!tpl) return;
    emit({ ...value, blocks: tpl.blocks.map((b) => ({ ...b })) });
  }

  return (
    <div className="space-y-3">
      {now && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-400">Plan until</span>
            <HorizonPicker
              value={value.horizon}
              onChange={(h) => emit({ ...value, horizon: h })}
              currentAge={now.age}
            />
          </div>
          <p className="text-xs text-neutral-500">
            Now: age {now.age} · wk {now.week}
            {now.age <= 20 && <> · {horizonWeeks(now, { age: 21, week: 1 })} wks to age-21 season</>}
            {now.age <= 21 && <> · {horizonWeeks(now, { age: 22, week: 1 })} wks to end of U-21</>}
          </p>
          {hWeeks === 0 && (
            <p className="text-xs text-amber-500">
              Target is in the past for this player — pick a later target or Custom.
            </p>
          )}
          {overflowWeeks > 0 && (
            <p className="text-xs text-red-400">
              Earlier blocks overshoot the target by {overflowWeeks} wk{overflowWeeks === 1 ? '' : 's'} —
              the projection stops at the target.
            </p>
          )}
        </div>
      )}

      <select
        defaultValue=""
        onChange={(e) => { if (e.target.value) applyTemplate(e.target.value); e.target.value = ''; }}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
      >
        <option value="">Start from template…</option>
        {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
      </select>

      <div className="space-y-1.5">
        {value.blocks.map((b, i) => {
          const isDerivedLast = value.horizon != null && now != null && i === value.blocks.length - 1;
          const bd = boundaries?.[i];
          return (
            <div key={i} className="flex items-center gap-2">
              <select
                value={b.trainingId}
                onChange={(e) => updateBlock(i, { trainingId: Number(e.target.value) })}
                className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
              >
                {TRAINING_CATALOG.map((tt) => <option key={tt.id} value={tt.id}>{tt.label}</option>)}
              </select>
              {isDerivedLast ? (
                <span
                  className="w-16 rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-center text-sm text-neutral-400"
                  title="Derived from the horizon target — switch to Custom to edit by hand"
                >
                  {b.weeks}
                </span>
              ) : (
                <BoundedNumberInput
                  value={b.weeks} min={1} max={140}
                  onCommit={(n) => updateBlock(i, { weeks: n })}
                  className="w-16 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
                />
              )}
              <span className="text-xs text-neutral-500">wks{isDerivedLast ? ' · auto' : ''}</span>
              {bd && (
                <span className="whitespace-nowrap text-[10px] text-neutral-600">
                  {bd.start.age}·w{bd.start.week} → {bd.end.age}·w{bd.end.week}
                </span>
              )}
              <button onClick={() => removeBlock(i)} className="text-neutral-600 hover:text-red-400 px-1" aria-label="Remove block">×</button>
            </div>
          );
        })}
        {value.blocks.length === 0 && <p className="text-sm text-neutral-500">No blocks yet — add one or start from a template.</p>}
      </div>
      <button onClick={addBlock} className="text-sm text-amber-500 hover:text-amber-400">+ add block</button>

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-800">
        <label className="flex items-center gap-1.5 text-sm">
          Coach
          <select
            value={value.coachLevel}
            onChange={(e) => emit({ ...value, coachLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          Youth trainer
          <select
            value={value.youthTrainerLevel}
            onChange={(e) => emit({ ...value, youthTrainerLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm" title="Extra cross-training slots — random skill gains each week">
          Gym
          <select
            value={value.gymLevel}
            onChange={(e) => emit({ ...value, gymLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm" title="Passive free-throw training every week, no training slot needed">
          Training court
          <select
            value={value.trainingCourtLevel}
            onChange={(e) => emit({ ...value, trainingCourtLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <p className="text-xs text-neutral-500">
        Total: {totalWeeks} week{totalWeeks === 1 ? '' : 's'} (~{seasons.toFixed(1)} seasons)
        {endAge != null && ` · ends at age ${endAge}`}
        {value.horizon != null && ` · target: age ${value.horizon.age} wk ${value.horizon.week}`}
      </p>

      {!hideSave && (
        <button
          onClick={onSave}
          disabled={saving || value.blocks.length === 0}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save plan'}
        </button>
      )}
    </div>
  );
}
