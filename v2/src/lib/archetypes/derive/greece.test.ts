import { describe, it, expect } from 'vitest';
import { parseGreekTidy, lastWeekRoster, nearestCluster } from './greece';

const CSV = `player,week,position,JS,JR,OD,HA,DR,PA,IS,ID,RB,SB,ST,FT,EXP,GS,TSP10,OSP,ISP
A Player,6,,15,11,15,13,16,8,8,5,6,9,6,9,4,9,106,78,28
A Player,14,SG,17,12,15,15,17,10,11,9,4,5,3,14,5,8,115,86,29
Big Man,14,C,9,6,7,10,9,6,19,17,14,14,5,10,4,9,111,47,64`;

describe('parseGreekTidy', () => {
  it('parses rows with skills and week', () => {
    const rows = parseGreekTidy(CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0].skills.js).toBe(15);
    expect(rows[1].position).toBe('SG');
    expect(rows[2].tsp10).toBe(111);
  });
});
describe('lastWeekRoster + nearestCluster', () => {
  it('keeps the latest week per player and finds the nearest shape', () => {
    const roster = lastWeekRoster(parseGreekTidy(CSV));
    expect(roster).toHaveLength(2);
    expect(roster.find((r) => r.player === 'A Player')?.week).toBe(14);
    const guardCentroid = { js: 16, jr: 11, od: 15, ha: 15, dr: 16, pa: 8, is: 10, id: 7, rb: 5, sb: 4 };
    const bigCentroid = { js: 8, jr: 5, od: 6, ha: 9, dr: 8, pa: 7, is: 18, id: 16, rb: 13, sb: 13 };
    const n = nearestCluster(roster.find((r) => r.player === 'Big Man')!,
      [{ key: 'g', centroid: guardCentroid }, { key: 'b', centroid: bigCentroid }]);
    expect(n.key).toBe('b');
  });
});
