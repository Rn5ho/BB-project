import { config } from 'dotenv';
config({ path: '.env.local' });
const { loadCandidateRows, currentSeasonWeek } = await import('../../src/server/census/candidate-rows');
const { selectCandidates } = await import('../../src/server/census/candidates');
type SelectOpts = import('../../src/server/census/candidates').SelectOpts;
const SEASON = 73;
const week = await currentSeasonWeek(SEASON);
const rows = await loadCandidateRows(SEASON);
function rep(label: string, opts: SelectOpts) {
  const n = selectCandidates(rows, { ...opts, all: false, seasonWeek: week });
  const byAge = [18, 19, 20, 21].map((a) => `${a}:${n.filter((r) => r.ageNow === a).length}`).join(' ');
  console.log(`${String(n.length).padStart(4)}  ${label.padEnd(48)} [${byAge}]`);
}
console.log('NEW (not yet fully captured in S73) — candidates a run would actually pick:\n');
rep('18-21, within 20 of NT track', { ntTrackSlack: 20 });
rep('18-21, within 25 of NT track', { ntTrackSlack: 25 });
rep('18-21, within 30 of NT track', { ntTrackSlack: 30 });
rep('20-21, within 20 of NT track', { minAge: 20, maxAge: 21, ntTrackSlack: 20 });
rep('18-19, pot>=8', { minAge: 18, maxAge: 19, minPotential: 8 });
rep('18-19, pot>=7', { minAge: 18, maxAge: 19, minPotential: 7 });
rep('18-21, no filter at all (everything uncaptured)', {});
