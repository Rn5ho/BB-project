// READ-ONLY BB API probe. Feasibility for the owner's idea (2026-08-07): reconstruct a
// player's 18->21 training from per-position match minutes. The blocking question is
// whether BB still serves schedules AND boxscores for seasons 2-4 back.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchSchedule, fetchBoxscores } from '../../src/server/bb/xml-api';

const TEAM = Number(process.argv[2] ?? 276888); // owner's club

for (const season of [73, 72, 71, 70, 69]) {
  try {
    const sched = await fetchSchedule(TEAM, season);
    const finished = sched.filter((m) => m.matchId);
    let boxOk = 0, boxFail = 0, samplePositions: string[] = [];
    if (finished.length) {
      const probe = finished.slice(0, 2).map((m) => m.matchId);
      try {
        const boxes = await fetchBoxscores(probe);
        boxOk = boxes.length;
        const anyPlayer = boxes[0]?.players?.[0] as Record<string, unknown> | undefined;
        if (anyPlayer) samplePositions = Object.keys(anyPlayer);
      } catch (e) {
        boxFail = 1;
        samplePositions = [`boxscore error: ${(e as Error).message.slice(0, 90)}`];
      }
    }
    console.log(JSON.stringify({ season, matchesReturned: sched.length, withIds: finished.length, boxOk, boxFail, boxscoreFields: samplePositions }));
  } catch (e) {
    console.log(JSON.stringify({ season, error: (e as Error).message.slice(0, 120) }));
  }
}
