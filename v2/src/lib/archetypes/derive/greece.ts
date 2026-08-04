import { type SkillKey } from '../../training/types';
import { shapeVector, euclid } from './cluster';

export interface GreekPlayer {
  player: string; position: string | null; week: number;
  skills: Record<SkillKey, number>; tsp10: number;
}
const COL_TO_KEY: Array<[string, SkillKey]> = [
  ['JS', 'js'], ['JR', 'jr'], ['OD', 'od'], ['HA', 'ha'], ['DR', 'dr'],
  ['PA', 'pa'], ['IS', 'is'], ['ID', 'id'], ['RB', 'rb'], ['SB', 'sb'],
];

export function parseGreekTidy(csv: string): GreekPlayer[] {
  const [head, ...body] = csv.trim().split(/\r?\n/);
  const cols = head.split(',');
  const idx = (c: string) => cols.indexOf(c);
  return body.map((line) => {
    const cells = line.split(',');
    const skills = {} as Record<SkillKey, number>;
    for (const [col, key] of COL_TO_KEY) skills[key] = Number(cells[idx(col)]);
    return {
      player: cells[idx('player')],
      position: cells[idx('position')] || null,
      week: Number(cells[idx('week')]),
      skills,
      tsp10: Number(cells[idx('TSP10')]),
    };
  });
}

export function lastWeekRoster(rows: GreekPlayer[]): GreekPlayer[] {
  const byPlayer = new Map<string, GreekPlayer>();
  for (const r of rows) {
    const cur = byPlayer.get(r.player);
    if (!cur || r.week > cur.week) byPlayer.set(r.player, r);
  }
  return [...byPlayer.values()];
}

export function nearestCluster(
  p: GreekPlayer,
  centroids: Array<{ key: string; centroid: Record<SkillKey, number> }>,
): { key: string; distance: number } {
  const v = shapeVector(p.skills);
  let best = { key: centroids[0].key, distance: Infinity };
  for (const c of centroids) {
    const d = euclid(v, shapeVector(c.centroid));
    if (d < best.distance) best = { key: c.key, distance: d };
  }
  return best;
}
