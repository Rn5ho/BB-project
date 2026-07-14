'use client';

import { TRAINING_CATALOG } from '@/lib/training/catalog';
import type { PlanTemplate } from '@/lib/training/templates';

export interface PlanValue {
  blocks: Array<{ trainingId: number; weeks: number }>;
  coachLevel: number;
  youthTrainerLevel: number;
}

const WEEKS_PER_SEASON = 14; // BBSCOUT.weeksPerSeason — kept local to avoid pulling engine params into the UI

export default function PlanEditor({
  value, onChange, onSave, saving, templates, startAge, endAge: endAgeExact,
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
}) {
  const totalWeeks = value.blocks.reduce((a, b) => a + b.weeks, 0);
  const seasons = totalWeeks / WEEKS_PER_SEASON;
  const endAge = endAgeExact ?? (startAge != null ? Math.floor(startAge + seasons) : null);

  function updateBlock(i: number, patch: Partial<{ trainingId: number; weeks: number }>) {
    onChange({ ...value, blocks: value.blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });
  }
  function removeBlock(i: number) {
    onChange({ ...value, blocks: value.blocks.filter((_, idx) => idx !== i) });
  }
  function addBlock() {
    onChange({ ...value, blocks: [...value.blocks, { trainingId: 1, weeks: 8 }] });
  }
  function applyTemplate(key: string) {
    const tpl = templates.find((t) => t.key === key);
    if (!tpl) return;
    onChange({ ...value, blocks: tpl.blocks.map((b) => ({ ...b })) });
  }

  return (
    <div className="space-y-3">
      <select
        defaultValue=""
        onChange={(e) => { if (e.target.value) applyTemplate(e.target.value); e.target.value = ''; }}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
      >
        <option value="">Start from template…</option>
        {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
      </select>

      <div className="space-y-1.5">
        {value.blocks.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={b.trainingId}
              onChange={(e) => updateBlock(i, { trainingId: Number(e.target.value) })}
              className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
            >
              {TRAINING_CATALOG.map((tt) => <option key={tt.id} value={tt.id}>{tt.label}</option>)}
            </select>
            <input
              type="number" min={1} max={140} value={b.weeks}
              onChange={(e) => updateBlock(i, { weeks: Math.max(1, Math.min(140, Number(e.target.value) || 1)) })}
              className="w-16 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
            />
            <span className="text-xs text-neutral-500">wks</span>
            <button onClick={() => removeBlock(i)} className="text-neutral-600 hover:text-red-400 px-1" aria-label="Remove block">×</button>
          </div>
        ))}
        {value.blocks.length === 0 && <p className="text-sm text-neutral-500">No blocks yet — add one or start from a template.</p>}
      </div>
      <button onClick={addBlock} className="text-sm text-amber-500 hover:text-amber-400">+ add block</button>

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-800">
        <label className="flex items-center gap-1.5 text-sm">
          Coach
          <select
            value={value.coachLevel}
            onChange={(e) => onChange({ ...value, coachLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          Youth trainer
          <select
            value={value.youthTrainerLevel}
            onChange={(e) => onChange({ ...value, youthTrainerLevel: Number(e.target.value) })}
            className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-1 text-sm"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <p className="text-xs text-neutral-500">
        Total: {totalWeeks} week{totalWeeks === 1 ? '' : 's'} (~{seasons.toFixed(1)} seasons)
        {endAge != null && ` · ends at age ${endAge}`}
      </p>

      <button
        onClick={onSave}
        disabled={saving || value.blocks.length === 0}
        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save plan'}
      </button>
    </div>
  );
}
