'use client';

import { useTransition, useState } from 'react';
import { enqueueCensus, previewCensus, type EnqueueOpts, type PreviewResult } from '@/app/census/actions';
import CensusPreview from './CensusPreview';

function NumInput({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: number;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs text-neutral-400">
      {label}
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-24 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
    </label>
  );
}

function parseOpts(fd: FormData): EnqueueOpts {
  function getNum(key: string): number | undefined {
    const v = fd.get(key);
    if (v === null || v === '') return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }
  return {
    minAge: getNum('minAge'),
    maxAge: getNum('maxAge'),
    minPotential: getNum('minPotential'),
    maxPotential: getNum('maxPotential'),
    minSalary: getNum('minSalary'),
    maxSalary: getNum('maxSalary'),
    minHeight: getNum('minHeight'),
    maxHeight: getNum('maxHeight'),
    minTsp: getNum('minTsp'),
    ntTrackSlack: getNum('ntTrackSlack'),
    all: fd.get('all') === 'on',
    clearRoster: fd.get('clearRoster') === 'on',
  };
}

export default function CensusRunForm() {
  const [pending, startTransition] = useTransition();
  const [previewing, startPreview] = useTransition();
  const [result, setResult] = useState<
    { ok: true; runId: number } | { ok: false; error: string } | null
  >(null);
  const [preview, setPreview] = useState<PreviewResult | { ok: false; error: string } | null>(null);
  const [previewedClearRoster, setPreviewedClearRoster] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const opts = parseOpts(fd);
    const offseasonConfirm = (fd.get('offseasonConfirm') as string) ?? '';
    startTransition(async () => {
      const res = await enqueueCensus(opts, offseasonConfirm);
      setResult(res);
    });
  }

  function handlePreview(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    const opts = parseOpts(new FormData(form));
    setPreviewedClearRoster(opts.clearRoster === true);
    startPreview(async () => {
      const res = await previewCensus(opts);
      setPreview(res);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* OFF-SEASON warning */}
      <div className="rounded border border-amber-700 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
        <strong>OFF-SEASON only.</strong> A census dismisses every candidate from the NT roster
        (drains NT enthusiasm), then re-recruits them one by one. Running it mid-season is
        destructive. Only queue when the season has ended and you are ready to scout.
      </div>

      {/* Filter grid */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Filters (empty = no restriction)
        </legend>
        <div className="flex flex-wrap gap-4">
          <NumInput label="Min age" name="minAge" defaultValue={19} />
          <NumInput label="Max age" name="maxAge" defaultValue={21} />
          <NumInput label="Min potential" name="minPotential" placeholder="e.g. 7" />
          <NumInput label="Max potential" name="maxPotential" placeholder="e.g. 10" />
          <NumInput label="Min salary" name="minSalary" placeholder="e.g. 50000" />
          <NumInput label="Max salary" name="maxSalary" placeholder="e.g. 500000" />
          <NumInput label="Min height (cm)" name="minHeight" placeholder="e.g. 185" />
          <NumInput label="Max height (cm)" name="maxHeight" placeholder="e.g. 220" />
          <NumInput label="Min TSP" name="minTsp" placeholder="e.g. 70" />
          <NumInput label="NT-track slack" name="ntTrackSlack" placeholder="e.g. 15" />
        </div>
        <p className="text-xs text-neutral-500">
          NT-track slack keeps only players whose TSP is at most N points below the NT-track
          benchmark for their age (0 = at/above the benchmark). Players without a known TSP fail
          both TSP filters.
        </p>
      </fieldset>

      {/* Re-census checkbox */}
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" name="all" className="h-4 w-4 accent-amber-400" />
        Re-census players already captured this season (refresh stale skills)
      </label>

      {/* Clear roster checkbox */}
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="clearRoster"
          className="h-4 w-4 accent-amber-400"
        />
        Clear roster (18 slots) — dismiss current roster before recruiting candidates
      </label>

      {/* Preview */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing}
          className="rounded border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-200 hover:border-neutral-400 disabled:opacity-50"
        >
          {previewing ? 'Previewing…' : 'Preview candidates'}
        </button>
        {preview?.ok === true && <CensusPreview preview={preview} clearRoster={previewedClearRoster} />}
        {preview?.ok === false && <p className="text-sm text-red-400">{preview.error}</p>}
      </div>

      {/* OFFSEASON confirm */}
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        <span>
          Type <code className="rounded bg-neutral-800 px-1 py-0.5 text-amber-400">OFFSEASON</code>{' '}
          to confirm
        </span>
        <input
          type="text"
          name="offseasonConfirm"
          autoComplete="off"
          placeholder="OFFSEASON"
          className="w-40 rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none"
        />
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {pending ? 'Queuing…' : 'Queue census'}
      </button>

      {/* Result */}
      {result?.ok === true && (
        <p className="text-sm text-green-400">
          Queued run #{result.runId} — the Hetzner worker picks it up within ~30s.
        </p>
      )}
      {result?.ok === false && (
        <p className="text-sm text-red-400">{result.error}</p>
      )}
    </form>
  );
}
