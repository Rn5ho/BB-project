'use client';

import type { PreviewResult } from '@/app/census/actions';

export default function CensusPreview({
  preview,
  clearRoster,
}: {
  preview: PreviewResult;
  clearRoster: boolean;
}) {
  const { candidates } = preview;
  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-300">
        <strong className="text-white">{candidates.length}</strong> candidate
        {candidates.length === 1 ? '' : 's'} match (of {preview.totalSlovenian} Slovenian 18–21,
        season {preview.season} week {preview.seasonWeek}).
      </p>
      {preview.rosteredCount > 0 && !clearRoster && (
        <p className="rounded border border-amber-700 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
          {preview.rosteredCount} of these (marked ★) are on your NT roster — they are protected
          and will be <strong>skipped</strong> unless you tick “Clear roster”.
        </p>
      )}
      {candidates.length > 0 && (
        <div className="max-h-96 overflow-auto rounded border border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-neutral-900 text-neutral-500">
              <tr>
                <th className="px-2 py-1.5 font-medium">Player</th>
                <th className="px-2 py-1.5 font-medium">Age</th>
                <th className="px-2 py-1.5 font-medium">Pot</th>
                <th className="px-2 py-1.5 font-medium">Salary</th>
                <th className="px-2 py-1.5 font-medium">Height</th>
                <th className="px-2 py-1.5 font-medium">TSP</th>
                <th className="px-2 py-1.5 font-medium" title="TSP minus NT-track benchmark for age (current week)">Δ bench</th>
                <th className="px-2 py-1.5 font-medium">Last full capture</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {candidates.map((c) => (
                <tr key={c.bbPlayerId} className="border-t border-neutral-800">
                  <td className="px-2 py-1">
                    <a href={`/players/${c.bbPlayerId}`} className="text-white hover:underline">
                      {c.name ?? c.bbPlayerId}
                    </a>
                    {c.rostered && <span className="ml-1 text-amber-400" title="On your NT roster (protected)">★</span>}
                  </td>
                  <td className="px-2 py-1">{c.ageNow ?? '–'}</td>
                  <td className="px-2 py-1">{c.potential ?? '–'}</td>
                  <td className="px-2 py-1">{c.salary != null ? `$ ${c.salary.toLocaleString('en-US')}` : '–'}</td>
                  <td className="px-2 py-1">{c.heightCm != null ? `${c.heightCm} cm` : '–'}</td>
                  <td className="px-2 py-1">{c.tsp ?? '–'}</td>
                  <td className={`px-2 py-1 ${c.benchDelta == null ? '' : c.benchDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {c.benchDelta == null ? '–' : c.benchDelta > 0 ? `+${c.benchDelta}` : c.benchDelta}
                  </td>
                  <td className="px-2 py-1">{c.lastFullCapture ? c.lastFullCapture.slice(0, 10) : 'never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
