'use client';

import { useState, useTransition } from 'react';
import { saveSelfTrainerConfig } from '@/app/scorecard/actions';

function NumField({ label, name, defaultValue, min, max }: {
  label: string; name: string; defaultValue: number; min: number; max: number;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs text-neutral-400">
      {label}
      <input
        type="number" name={name} defaultValue={defaultValue} min={min} max={max}
        className="w-24 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white focus:border-neutral-500 focus:outline-none"
      />
    </label>
  );
}

export default function ConfigForm({ initial }: {
  initial: {
    teamId: number | null; switchTeam: boolean; coachLevel: number;
    youthTrainerLevel: number; gymLevel: number; trainingCourtLevel: number;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: true } | { ok: false; error: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setResult(await saveSelfTrainerConfig({
        teamId: Number(fd.get('teamId')),
        switchTeam: fd.get('switchTeam') === 'on',
        coachLevel: Number(fd.get('coachLevel')),
        youthTrainerLevel: Number(fd.get('youthTrainerLevel')),
        gymLevel: Number(fd.get('gymLevel')),
        trainingCourtLevel: Number(fd.get('trainingCourtLevel')),
      }));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <NumField label="Club team id" name="teamId" defaultValue={initial.teamId ?? 0} min={1} max={99999999} />
      <NumField label="Coach (1–7)" name="coachLevel" defaultValue={initial.coachLevel} min={1} max={7} />
      <NumField label="Youth trainer (0–7)" name="youthTrainerLevel" defaultValue={initial.youthTrainerLevel} min={0} max={7} />
      <NumField label="Gym (0–3)" name="gymLevel" defaultValue={initial.gymLevel} min={0} max={3} />
      <NumField label="Training court (0–3)" name="trainingCourtLevel" defaultValue={initial.trainingCourtLevel} min={0} max={3} />
      <label className="flex items-center gap-2 text-xs text-neutral-400 pb-1.5">
        <input type="checkbox" name="switchTeam" defaultChecked={initial.switchTeam} className="accent-amber-600" />
        second team (switch context)
      </label>
      <button type="submit" disabled={pending}
        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium disabled:opacity-50">
        {pending ? 'Saving…' : 'Save'}
      </button>
      {result && (
        <span className={`text-xs ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.ok ? 'Saved.' : result.error}
        </span>
      )}
    </form>
  );
}
