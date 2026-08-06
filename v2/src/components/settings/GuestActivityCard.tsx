import type { GuestActivity } from '@/lib/guest-activity';
import { formatStartedAt } from '@/lib/format-sync';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
      {hint && <div className="text-xs text-neutral-600">{hint}</div>}
    </div>
  );
}

export default function GuestActivityCard({ activity, days }: { activity: GuestActivity; days: number }) {
  const { totalViews, distinctSessions, logins, lastSeenAt, perDay, topPaths } = activity;
  const peak = Math.max(1, ...perDay.map((d) => d.views));

  if (totalViews === 0 && logins === 0) {
    return <p className="text-sm text-neutral-500">No guest activity yet.</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-8">
        <Stat label={`distinct sessions (${days}d)`} value={String(distinctSessions)} hint="one per guest login" />
        <Stat label={`page views (${days}d)`} value={String(totalViews)} />
        <Stat label={`logins (${days}d)`} value={String(logins)} />
        <Stat label="last seen" value={lastSeenAt ? formatStartedAt(lastSeenAt) : '–'} hint={lastSeenAt ? 'UTC' : undefined} />
      </div>

      <div>
        <div className="text-xs text-neutral-400 mb-1">Views per day</div>
        <div className="flex items-end gap-[2px] h-16">
          {perDay.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.views} views, ${d.sessions} sessions`}
              className="flex-1 min-w-[3px] bg-amber-600/70 rounded-sm"
              style={{ height: `${Math.max(2, Math.round((d.views / peak) * 100))}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-neutral-600 mt-1">
          <span>{perDay[0]?.day}</span>
          <span>{perDay[perDay.length - 1]?.day}</span>
        </div>
      </div>

      {topPaths.length > 0 && (
        <div>
          <div className="text-xs text-neutral-400 mb-1">Most visited pages</div>
          <table className="w-full max-w-md">
            <tbody>
              {topPaths.map((p) => (
                <tr key={p.path} className="border-b border-neutral-900">
                  <td className="py-1 text-neutral-300">{p.path}</td>
                  <td className="py-1 text-right text-neutral-400 tabular-nums">{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
