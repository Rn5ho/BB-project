// Replay real observed training cases through each model and score pop predictions.
// Usage: npx tsx scripts/training/replay-case.mts <case.json | directory-of-cases>
// Accepts both hand-written cases (weeks[]) and scrape-training-history output (rawWeeks[]).
// Replay/scoring logic lives in src/lib/training/replay.ts (shared with the self-trainer job).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { replayCase, caseFromScrapedHistory, type ReplayCase } from '../../src/lib/training/replay';
import { BBSCOUT, BBSCOUT_HIGH, BBSCOUT_LOW } from '../../src/lib/training/models/bbscout';
import { COACH_PARROT } from '../../src/lib/training/models/coach-parrot';
import { OPEN_SOURCE_LIVE } from '../../src/lib/training/models/open-source-live';
import { SKILL_KEYS, type ModelParams } from '../../src/lib/training/types';

function loadCase(file: string): ReplayCase {
  const c = JSON.parse(readFileSync(file, 'utf8'));
  if (c.weeks && !c.rawWeeks) {
    // hand-written format
    return {
      label: c.label,
      startSkills: SKILL_KEYS.map((k) => c.player.startSkillsDisplayed[k]),
      startAge: c.player.age, heightCm: c.player.heightCm, potential: c.player.potential,
      startStamina: c.player.startStamina ?? null, startFreeThrow: c.player.startFreeThrow ?? null,
      coachLevel: c.coachLevel, youthTrainerLevel: c.youthTrainerLevel, gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
      weeks: c.weeks.map((w: { date: string; trainingId: number; minutes: number; observedPops: Record<string, number> }) => ({
        date: w.date, trainingId: w.trainingId, minutes: w.minutes, observedPops: w.observedPops ?? {},
      })),
      endSkills: SKILL_KEYS.map((k) => c.endSkillsDisplayed?.[k] ?? null),
      unmodeledPopCount: c.weeks.reduce((a: number, w: { unmodeledPops?: object }) => a + Object.keys(w.unmodeledPops ?? {}).length, 0),
    };
  }
  // scraped format (rawWeeks, chronological)
  return caseFromScrapedHistory({
    label: c.label,
    rawWeeks: c.rawWeeks,
    heightCm: c.player.heightCm,
    potential: c.player.potential ?? null,
    snapshotAge: c.player.age ?? null,
    endSkills: c.endSkillsDisplayed ?? {},
    endStamina: c.player.startStamina ?? null,
    endFreeThrow: c.player.startFreeThrow ?? null,
    coachLevel: c.coachLevel, youthTrainerLevel: c.youthTrainerLevel,
    gymLevel: c.gymLevel ?? 0, trainingCourtLevel: c.trainingCourtLevel ?? 0,
  });
}

const target = process.argv[2];
if (!target) throw new Error('usage: replay-case.mts <case.json | dir>');
const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => f.endsWith('.json')).map((f) => path.join(target, f))
  : [target];
const verbose = files.length === 1;

const models: ModelParams[] = [BBSCOUT, COACH_PARROT, OPEN_SOURCE_LIVE, BBSCOUT_LOW, BBSCOUT_HIGH];
const totals: Record<string, { hits: number; misses: number; fa: number; err: number; n: number; exact: number }> = {};

for (const file of files) {
  const c = loadCase(file);
  const observedTotal = c.weeks.reduce((a, w) => a + Object.keys(w.observedPops).length, 0);
  console.log(`\n=== ${c.label} ===`);
  console.log(`${c.weeks.length} weeks, ${observedTotal} scored pops (+${c.unmodeledPopCount} unmodeled ST/FT/XP), coach ${c.coachLevel}, yt ${c.youthTrainerLevel}, start age ${c.startAge}`);
  for (const m of models) {
    if (verbose) console.log(`--- ${m.id} ---`);
    const r = replayCase(c, m);
    if (verbose) {
      for (const e of r.events) {
        console.log(e.kind === 'miss'
          ? `  ${e.date}: observed ${e.skill} pop MISSED (${e.detail})`
          : `  ${e.date}: predicted ${e.skill} pop NOT observed (${e.detail})`);
      }
    }
    const t = (totals[m.id] ??= { hits: 0, misses: 0, fa: 0, err: 0, n: 0, exact: 0 });
    t.hits += r.hits; t.misses += r.misses; t.fa += r.falseAlarms; t.err += r.endAbsErr; t.n += r.endCount; t.exact += r.endExact;
    console.log(`${m.id.padEnd(18)} pops ${r.hits}/${r.hits + r.misses} hit, ${r.falseAlarms} false alarms | final skills: ${r.endExact}/${r.endCount} exact, total |err| ${r.endAbsErr}`);
  }
}

if (files.length > 1) {
  console.log('\n===== AGGREGATE =====');
  for (const [id, t] of Object.entries(totals)) {
    const recall = t.hits / (t.hits + t.misses);
    console.log(`${id.padEnd(18)} pop recall ${(recall * 100).toFixed(0)}% (${t.hits}/${t.hits + t.misses}), false alarms ${t.fa} | final-skill exact ${t.exact}/${t.n} (${((t.exact / t.n) * 100).toFixed(0)}%), MAE ${(t.err / t.n).toFixed(2)} levels`);
  }
}
