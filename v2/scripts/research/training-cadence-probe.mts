// READ-ONLY (GET only, no DB writes). Measures the REAL training switch cadence of the
// owner's two clubs from traininghistory.aspx.
//
// WHY: the concentration "defect" (2026-08-07) turned out to be driven by switch cadence,
// not by a missing engine brake — see docs/research/training/concentration-study-2026-08-07/.
// The planner projects a plan as written; if real clubs switch every few weeks, long-block
// plans are optimistic as ADVICE. This measures what cadence actually looks like.
//
// BB clubs pick ONE training per week, so any long-tenured player's history is a faithful
// record of the whole club's weekly training sequence.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { writeFileSync, mkdirSync } from 'node:fs';
import { BbWebSession, collectHiddenFields } from '../../src/server/bb/web-session';
import { parseTrainingHistory, parseUsDate } from '../../src/server/bb/training-history';
import { getTrainingType } from '../../src/lib/training/catalog';

const TARGETS = [
  { pid: 54209203, team: 114360, note: 'Savlje BC, s69-73' },
  { pid: 49983596, team: 114360, note: 'Savlje BC, s69-72 (cross-check)' },
  { pid: 50891529, team: 276888, note: 'Berlin BC, s69-73' },
  { pid: 54849455, team: 276888, note: 'Berlin BC, s69-73 (cross-check)' },
];

const OUT = '../docs/research/training/long-arc';
mkdirSync(OUT, { recursive: true });

const session = new BbWebSession();
await session.login();

const report: Record<string, unknown> = {};
// The lbSwitchTeams postback is a NAVIGATION postback on /home.aspx (classified read-only
// by this repo's write-safety audit); it makes the second club's players visible.
async function switchTeamContext() {
  const home = await session.get('/home.aspx');
  const resp = await session.post('/home.aspx', {
    ...collectHiddenFields(home), __EVENTTARGET: 'ctl00$lbSwitchTeams', __EVENTARGUMENT: '',
  });
  const active = resp.match(/id='menuTeamName' href='\/team\/(\d+)\/overview.aspx'[^>]*>([^<]+)</)?.slice(1);
  console.log('# switched team context to:', active?.join(' '));
}

const ordered = [...TARGETS].sort((a, b) => a.team - b.team);
let currentTeam = ordered[0].team;
for (const t of ordered) {
  if (t.team !== currentTeam) { await switchTeamContext(); currentTeam = t.team; }
  const html = await session.get(`/player/${t.pid}/traininghistory.aspx`);
  const rows = parseTrainingHistory(html)
    .filter((r) => r.label !== 'AGE' && r.date)
    .reverse(); // parser returns newest-first; we want chronological
  if (!rows.length) { report[String(t.pid)] = { ...t, error: 'no training rows parsed' }; continue; }

  // Run-length encode consecutive identical (label|positions) weeks = training blocks.
  const blocks: { key: string; id: number | null; weeks: number; from: string; to: string }[] = [];
  for (const r of rows) {
    const key = `${r.label}|${r.positions}`;
    const last = blocks[blocks.length - 1];
    if (last && last.key === key) { last.weeks++; last.to = r.date; }
    else blocks.push({ key, id: r.trainingId, weeks: 1, from: r.date, to: r.date });
  }

  const lens = blocks.map((b) => b.weeks);
  const hist: Record<string, number> = {};
  for (const n of lens) { const b = n === 1 ? '1' : n <= 3 ? '2-3' : n <= 7 ? '4-7' : n <= 13 ? '8-13' : '14+'; hist[b] = (hist[b] ?? 0) + 1; }
  const span = (parseUsDate(rows[rows.length - 1].date).getTime() - parseUsDate(rows[0].date).getTime()) / (7 * 86400_000);

  report[String(t.pid)] = {
    ...t,
    weeksObserved: rows.length,
    spanWeeks: Math.round(span),
    distinctTrainings: new Set(blocks.map((b) => b.key)).size,
    blockCount: blocks.length,
    meanBlockWeeks: +(lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(2),
    medianBlockWeeks: [...lens].sort((a, b) => a - b)[Math.floor(lens.length / 2)],
    maxBlockWeeks: Math.max(...lens),
    switchesPer14wkSeason: +((blocks.length / rows.length) * 14).toFixed(2),
    blockLengthHistogram: hist,
    blocks: blocks.map((b) => ({
      training: b.id ? getTrainingType(b.id).label : b.key, weeks: b.weeks, from: b.from, to: b.to,
    })),
  };
  await new Promise((r) => setTimeout(r, 600));
}

writeFileSync(`${OUT}/training-cadence.json`, JSON.stringify(report, null, 1));
for (const [pid, v] of Object.entries(report)) {
  const r = v as Record<string, unknown>;
  if (r.error) { console.log(pid, 'ERROR', r.error); continue; }
  console.log(`${pid} (team ${r.team}) weeks=${r.weeksObserved} blocks=${r.blockCount} meanBlock=${r.meanBlockWeeks}wk medianBlock=${r.medianBlockWeeks}wk maxBlock=${r.maxBlockWeeks}wk switches/season=${r.switchesPer14wkSeason} hist=${JSON.stringify(r.blockLengthHistogram)}`);
}
