import type { GuestActivity } from '@/lib/guest-activity';
import { formatStartedAt } from '@/lib/format-sync';

// Secondary stats are context, not the headline — kept visually quiet so the
// primary figure below (recent distinct sessions) is the only thing that reads as urgent.
// Every label carries its own window so a 7-day and a 30-day number can never be
// mistaken for each other at a glance.
function SecondaryStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-lg font-medium tabular-nums text-neutral-300">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
      {hint && <div className="text-xs text-neutral-600">{hint}</div>}
    </div>
  );
}

export default function GuestActivityCard({
  activity,
  recent,
  days,
  recentDays,
}: {
  /** Long-window (30d) summary — context only, not the leak signal. */
  activity: GuestActivity;
  /** Short-window (7d, matching the guest token's own lifetime) summary — the headline. */
  recent: GuestActivity;
  days: number;
  recentDays: number;
}) {
  const { totalViews, logins, lastSeenAt, perDay, topPaths } = activity;
  const peak = Math.max(1, ...perDay.map((d) => d.views));

  // recent is a strict subset of activity's rows (same fetch, narrower window), so
  // "zero 30-day activity" is a safe single empty-state gate — it can't be true
  // while the 7-day figures aren't.
  if (totalViews === 0 && logins === 0) {
    return <p className="text-sm text-neutral-500">No guest activity yet.</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Guest tokens hard-expire after 7 days with no renewal, so a 7-day window
          maps ~1:1 to people currently holding the password — unlike the 30-day count,
          which the token lifetime alone inflates several-fold for one continuously
          active guest. That's why this, not a longer window, is the primary/amber figure. */}
      <div>
        <div className="text-5xl font-semibold tabular-nums text-amber-400 leading-none">{recent.distinctSessions}</div>
        <div className="text-sm text-neutral-300 mt-1.5">distinct guest sessions in the last {recentDays} days</div>
        <div className="text-xs text-neutral-500">
          Guest logins last {recentDays} days, so this is roughly how many different people are using the password
          right now — noticeably more than you shared it with suggests it has been passed on.
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <SecondaryStat label={`distinct sessions (${days}d)`} value={String(activity.distinctSessions)} />
        <SecondaryStat label={`page views (${days}d)`} value={String(totalViews)} />
        <SecondaryStat label={`logins (${days}d)`} value={String(logins)} />
        <SecondaryStat label={`last seen (${days}d)`} value={lastSeenAt ? formatStartedAt(lastSeenAt) : '–'} hint={lastSeenAt ? 'UTC' : undefined} />
      </div>

      <div>
        <div className="text-xs text-neutral-400 mb-1">Views per day (last {days} days)</div>
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
          <div className="text-xs text-neutral-400 mb-1">Most visited pages (last {days} days)</div>
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
