import { PlayerListRow } from '@/queries/players';
import { SKILLS, getPotentialColor, POTENTIAL_LEVELS } from '@/lib/constants';
import SkillCell from './SkillCell';

export default function PlayerTable({ rows, showCountry, showSkills }: {
  rows: PlayerListRow[]; showCountry?: boolean; showSkills?: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-neutral-400 border-b border-neutral-800">
        <tr>
          <th className="py-2 pr-3">Player</th>
          {showCountry && <th className="pr-3">Country</th>}
          <th className="pr-3">Age</th>
          <th className="pr-3">Pos</th>
          <th className="pr-3">Pot</th>
          <th className="pr-3 text-right">Salary</th>
          <th className="pr-3 text-right">DMI</th>
          <th className="pr-3">GS</th>
          <th className="pr-3 text-right">TSP</th>
          {showSkills && SKILLS.map((s) => <th key={s.dbKey} className="pr-2" title={s.name}>{s.name.split(' ').map(w => w[0]).join('')}</th>)}
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.bbPlayerId} className="border-b border-neutral-900 hover:bg-neutral-900/50">
            <td className="py-1.5 pr-3">
              <a href={`https://buzzerbeater.com/player/${p.bbPlayerId}/overview.aspx`} target="_blank"
                 className="hover:text-amber-500">{p.name}</a>
            </td>
            {showCountry && <td className="pr-3 text-neutral-400">{p.nationality ?? '–'}</td>}
            <td className="pr-3">{p.ageNow ?? '–'}</td>
            <td className="pr-3">{p.bestPosition ?? '–'}</td>
            <td className="pr-3">
              {p.potential != null
                ? <span style={{ color: getPotentialColor(p.potential) }} title={POTENTIAL_LEVELS[p.potential]}>{p.potential}</span>
                : '–'}
            </td>
            <td className="pr-3 text-right">{p.salary?.toLocaleString() ?? '–'}</td>
            <td className="pr-3 text-right">{p.dmi?.toLocaleString() ?? '–'}</td>
            <td className="pr-3">{p.gameShape ?? '–'}</td>
            <td className="pr-3 text-right font-medium">{p.tsp ?? '–'}</td>
            {showSkills && SKILLS.map((s) => (
              <td key={s.dbKey} className="pr-2"><SkillCell value={p.skills?.[s.dbKey] ?? null} /></td>
            ))}
            <td>
              {p.hasFullSkills
                ? <span className="text-xs rounded bg-green-900/40 text-green-400 px-1.5 py-0.5">skills</span>
                : <span className="text-xs rounded bg-blue-900/40 text-blue-400 px-1.5 py-0.5">DMI only</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
