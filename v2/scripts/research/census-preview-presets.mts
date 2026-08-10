// SELECT-only preview. Uses the census's OWN loader + selector, so counts are exactly what
// a real run would pick. Nothing is enqueued and nothing is written.
//
// Owner's ask (2026-08-07): a tighter census — 18/19 only genuine U-21 prospects, 20/21 only
// players who are actually U-21 material — to avoid another 365-candidate marathon.
import { config } from 'dotenv';
config({ path: '.env.local' });
// Dynamic imports: `@/db` builds its client at module-eval time, so env must load first.
const { loadCandidateRows, currentSeasonWeek } = await import('../../src/server/census/candidate-rows');
const { selectCandidates } = await import('../../src/server/census/candidates');
type SelectOpts = import('../../src/server/census/candidates').SelectOpts;
const { benchmarkTsp } = await import('../../src/lib/training/benchmarks');

const SEASON = 73;
const week = await currentSeasonWeek(SEASON);
const rows = await loadCandidateRows(SEASON);
console.log(`season ${SEASON}, week ${week}. Slovenian pool loaded: ${rows.length}`);
console.log(`NT-track benchmark this week — ` +
  [18, 19, 20, 21].map((a) => `${a}: ${benchmarkTsp(a, week)?.toFixed(0)}`).join('  '));

const inAge = (lo: number, hi: number) => rows.filter((r) => r.ageNow != null && r.ageNow >= lo && r.ageNow <= hi);
console.log(`\npool by age: ` + [18, 19, 20, 21].map((a) => `${a}:${inAge(a, a).length}`).join('  '));
console.log(`already fully captured in S73 (would be skipped unless "all"): ` +
  [18, 19, 20, 21].map((a) => `${a}:${inAge(a, a).filter((r) => r.hasFreshFullThisSeason).length}`).join('  '));

function report(label: string, opts: SelectOpts) {
  const matchAll = selectCandidates(rows, { ...opts, all: true, seasonWeek: week });
  const newOnly = selectCandidates(rows, { ...opts, all: false, seasonWeek: week });
  const byAge = [18, 19, 20, 21].map((a) => `${a}:${newOnly.filter((r) => r.ageNow === a).length}`).join(' ');
  console.log(`${String(matchAll.length).padStart(5)} ${String(newOnly.length).padStart(6)}   ${label.padEnd(46)} new-by-age[${byAge}]`);
}

const nullPot = rows.filter((r) => r.ageNow != null && r.ageNow >= 18 && r.ageNow <= 21 && r.potential == null).length;
const nullTsp = rows.filter((r) => r.ageNow != null && r.ageNow >= 18 && r.ageNow <= 21 && r.tsp == null).length;
console.log(`
in 18-21 pool: null potential ${nullPot} (these FAIL any pot filter), null TSP ${nullTsp} (FAIL any TSP/track filter)`);

console.log(`
  ALL    NEW   preset`);
console.log('=== 18-19 : is this a real prospect? ===');
report('18-19, pot>=8', { minAge: 18, maxAge: 19, minPotential: 8 });
report('18-19, pot>=9', { minAge: 18, maxAge: 19, minPotential: 9 });
report('18-19, pot>=8 AND within 10 of NT track', { minAge: 18, maxAge: 19, minPotential: 8, ntTrackSlack: 10 });
report('18-19, pot>=8 AND within 15 of NT track', { minAge: 18, maxAge: 19, minPotential: 8, ntTrackSlack: 15 });
report('18-19, pot>=7', { minAge: 18, maxAge: 19, minPotential: 7 });

console.log('=== 20-21 : is he actually U-21 material? ===');
report('20-21, within 20 of NT track', { minAge: 20, maxAge: 21, ntTrackSlack: 20 });
report('20-21, within 15 of NT track', { minAge: 20, maxAge: 21, ntTrackSlack: 15 });
report('20-21, within 10 of NT track', { minAge: 20, maxAge: 21, ntTrackSlack: 10 });
report('20-21, pot>=8', { minAge: 20, maxAge: 21, minPotential: 8 });
report('20-21, pot>=8 AND within 20 of track', { minAge: 20, maxAge: 21, minPotential: 8, ntTrackSlack: 20 });
report('20-21, pot>=8 AND within 15 of track', { minAge: 20, maxAge: 21, minPotential: 8, ntTrackSlack: 15 });

console.log('=== single run, age-blind ===');
report('18-21, pot>=8', { minPotential: 8 });
report('18-21, pot>=9', { minPotential: 9 });
report('18-21, pot>=8 AND within 20 of track', { minPotential: 8, ntTrackSlack: 20 });

// where do the already-fresh S73 captures come from?
