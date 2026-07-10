import { SKILLS, getSkillColor } from '@/lib/constants';
import { snapshotDeltas, type Snap } from '@/lib/series';

const SOURCE_STYLE: Record<string, string> = {
  census: 'bg-green-900/40 text-green-400', market: 'bg-purple-900/40 text-purple-300',
  api: 'bg-blue-900/40 text-blue-300', manual: 'bg-amber-900/40 text-amber-300', extension: 'bg-neutral-800 text-neutral-300',
};

export default function SnapshotHistory({ snaps }: { snaps: Snap[] }) {
  const rows = snapshotDeltas(snaps); // newest-first
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-neutral-400 border-b border-neutral-800">
        <tr>
          <th className="py-2 pr-3">Date</th><th className="pr-3">Src</th><th className="pr-3">Sn</th>
          <th className="pr-3">Age</th><th className="pr-3 text-right">DMI</th><th className="pr-3">GS</th>
          <th className="pr-3 text-right">TSP</th>
          {SKILLS.map((s) => <th key={s.dbKey} className="pr-2" title={s.name}>{s.name.split(' ').map((w) => w[0]).join('')}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ snap, delta }, i) => (
          <tr key={i} className="border-b border-neutral-900">
            <td className="py-1.5 pr-3 whitespace-nowrap">{snap.capturedAt.toISOString().slice(0, 10)}</td>
            <td className="pr-3"><span className={`text-xs rounded px-1.5 py-0.5 ${SOURCE_STYLE[snap.source] ?? ''}`}>{snap.source}</span></td>
            <td className="pr-3 text-neutral-400">{snap.season ?? '–'}</td>
            <td className="pr-3">{snap.age ?? '–'}</td>
            <td className="pr-3 text-right">{snap.dmi?.toLocaleString() ?? '–'}</td>
            <td className="pr-3">{snap.gameShape ?? '–'}</td>
            <td className="pr-3 text-right">{snap.tsp ?? '–'}</td>
            {SKILLS.map((s) => {
              const v = snap.skills[s.dbKey];
              const dv = delta?.[s.dbKey];
              return (
                <td key={s.dbKey} className="pr-2 font-mono">
                  {v == null ? <span className="text-neutral-700">–</span> : (
                    <span style={{ color: getSkillColor(v) }}>
                      {v}{dv ? <sup className={dv > 0 ? 'text-green-500' : 'text-red-500'}>{dv > 0 ? `+${dv}` : dv}</sup> : null}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
