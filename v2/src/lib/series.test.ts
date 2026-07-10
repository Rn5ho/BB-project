import { describe, it, expect } from 'vitest';
import { skillSeries, dmiSeries, snapshotDeltas, positionTimeline, currentProfile, type Snap } from './series';

const d = (s: string) => new Date(s);
const snaps: Snap[] = [
  { capturedAt: d('2026-01-01'), source: 'api', season: 70, age: 20, dmi: 100000, gameShape: 7, salary: 8000, potential: 8, experience: null, tsp: null, bestPosition: 'PG',
    skills: { jump_shot: null, jump_range: null, outside_def: null, handling: null, driving: null, passing: null, inside_shot: null, inside_def: null, rebounding: null, shot_blocking: null, stamina: null, free_throw: null } },
  { capturedAt: d('2026-04-01'), source: 'census', season: 71, age: 20, dmi: 140000, gameShape: 8, salary: 9000, potential: 8, experience: 3, tsp: 90, bestPosition: 'PG',
    skills: { jump_shot: 11, jump_range: 9, outside_def: 12, handling: 14, driving: 15, passing: 8, inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3 } },
  { capturedAt: d('2026-07-01'), source: 'census', season: 72, age: 21, dmi: 180000, gameShape: 8, salary: 11000, potential: 8, experience: 5, tsp: 96, bestPosition: 'SG',
    skills: { jump_shot: 13, jump_range: 9, outside_def: 12, handling: 14, driving: 16, passing: 8, inside_shot: 10, inside_def: 6, rebounding: 4, shot_blocking: 1, stamina: 5, free_throw: 3 } },
];

describe('skillSeries', () => {
  it('returns only full snapshots (skills present)', () => {
    const s = skillSeries(snaps);
    expect(s.jump_shot.map((p) => p.y)).toEqual([11, 13]); // the light api snap is skipped
    expect(s.jump_shot.map((p) => p.x.getTime())).toEqual([d('2026-04-01').getTime(), d('2026-07-01').getTime()]);
  });
});

describe('dmiSeries', () => {
  it('uses all snapshots with a dmi', () => {
    expect(dmiSeries(snaps).map((p) => p.y)).toEqual([100000, 140000, 180000]);
  });
});

describe('snapshotDeltas', () => {
  it('computes per-skill delta vs the previous FULL snapshot (newest-first output)', () => {
    const rows = snapshotDeltas(snaps); // newest first
    expect(rows[0].snap.bestPosition).toBe('SG');
    expect(rows[0].delta?.jump_shot).toBe(2);   // 13 - 11
    expect(rows[0].delta?.driving).toBe(1);      // 16 - 15
    expect(rows[0].delta?.passing).toBe(0);
    // middle full snap has no prior full snap → null delta
    expect(rows[1].delta).toBeNull();
    // the light api snapshot has no skills → delta null
    expect(rows[2].delta).toBeNull();
  });
});

describe('positionTimeline', () => {
  it('collapses consecutive same positions into segments', () => {
    const segs = positionTimeline(snaps);
    expect(segs.map((s) => s.position)).toEqual(['PG', 'SG']);
    expect(segs[0].from.getTime()).toBe(d('2026-01-01').getTime());
  });
});

describe('currentProfile', () => {
  it('returns skills from the latest full snap', () => {
    const p = currentProfile(snaps);
    expect(p.skills).not.toBeNull();
    expect(p.skills!.jump_shot).toBe(13);   // from 2026-07-01 snap
    expect(p.skills!.driving).toBe(16);
    expect(p.skillsAsOf?.getTime()).toBe(d('2026-07-01').getTime());
    expect(p.skillsSource).toBe('census');
  });

  it('returns dmi from the latest snap with dmi', () => {
    const p = currentProfile(snaps);
    expect(p.dmi).toBe(180000);
    expect(p.dmiAsOf?.getTime()).toBe(d('2026-07-01').getTime());
    expect(p.dmiSource).toBe('census');
  });

  it('returns meta (tsp, salary, experience, gameShape) from the latest full snap', () => {
    const p = currentProfile(snaps);
    expect(p.tsp).toBe(96);
    expect(p.salary).toBe(11000);
    expect(p.experience).toBe(5);
    expect(p.gameShape).toBe(8);
    expect(p.age).toBe(21);
  });

  it('returns skills null but dmi populated when no full snap exists', () => {
    const dmiOnly: Snap[] = [
      { capturedAt: d('2026-01-01'), source: 'api', season: 70, age: 20, dmi: 100000, gameShape: 7, salary: 8000, potential: 8, experience: null, tsp: null, bestPosition: 'PG',
        skills: { jump_shot: null, jump_range: null, outside_def: null, handling: null, driving: null, passing: null, inside_shot: null, inside_def: null, rebounding: null, shot_blocking: null, stamina: null, free_throw: null } },
    ];
    const p = currentProfile(dmiOnly);
    expect(p.skills).toBeNull();
    expect(p.skillsAsOf).toBeNull();
    expect(p.dmi).toBe(100000);
    expect(p.dmiAsOf?.getTime()).toBe(d('2026-01-01').getTime());
  });
});
