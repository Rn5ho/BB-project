// Scrape BB traininghistory.aspx for OWN-TEAM players (only visible for your own club)
// and emit replay-ready calibration case JSONs.
// Usage: npx tsx scripts/training/scrape-training-history.mts --players 55135479,55135481 --coach 5 --yt 6
//        npx tsx scripts/training/scrape-training-history.mts --team 114360 --coach 5 --yt 6
import { config } from 'dotenv';
config({ path: '.env.local' });
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { BbWebSession, collectHiddenFields } from '../../src/server/bb/web-session';
import { SKILL_KEYS, type SkillKey } from '../../src/lib/training/types';

const OUT_DIR = path.resolve(process.cwd(), '..', 'docs', 'research', 'training', 'calibration-cases', 'auto');

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${name}`);
  }
  return process.argv[i + 1];
}

// BB training label + positions -> catalog id (see src/lib/training/catalog.ts)
const TRAINING_IDS: Record<string, number> = {
  'Jump Shot|PG/SG': 1, 'Jump Shot|SF/PF': 2, 'Jump Shot|SG/SF': 3, 'Jump Shot|TEAM': 4,
  'Outside Shooting|SG': 5, 'Outside Shooting|PG/SG': 6, 'Outside Shooting|SG/SF': 7, 'Outside Shooting|TEAM': 8,
  'Outside Defense|PG': 9, 'Outside Defense|PG/SG': 10, 'Outside Defense|PG/SG/SF': 11,
  'Ball Handling|PG': 12, 'Ball Handling|PG/SG': 13, 'Ball Handling|PG/SG/SF': 14,
  'One on One|PG/SG': 15, 'One on One|SF/PF': 16, 'One on One|TEAM': 17,
  'Passing|PG': 18, 'Passing|PG/SG': 19, 'Passing|TEAM': 20,
  'Inside Scoring|C': 21, 'Inside Scoring|PF/C': 22, 'Inside Scoring|SF/PF/C': 23,
  'Inside Defense|C': 24, 'Inside Defense|PF/C': 25, 'Inside Defense|SF/PF/C': 26,
  'Rebounding|PF/C': 27, 'Rebounding|TEAM': 28,
  'Shot Blocking|C': 29, 'Shot Blocking|PF/C': 30, 'Shot Blocking|SF/PF/C': 31,
};

const SKILL_NAME_TO_KEY: Record<string, SkillKey | 'stamina' | 'free_throw'> = {
  'Jump Shot': 'js', 'Jump Range': 'jr', 'Outside Def.': 'od', 'Handling': 'ha',
  'Driving': 'dr', 'Passing': 'pa', 'Inside Shot': 'is', 'Inside Def.': 'id',
  'Rebounding': 'rb', 'Shot Blocking': 'sb', 'Stamina': 'stamina', 'Free Throw': 'free_throw',
};

/** Normalize BB's position labels ("C / PF", "Forwards", "Guards") to the catalog's
 *  canonical order (PG/SG, SF/PF, PF/C, …). */
function canonicalPositions(raw: string): string {
  const s = raw.replace(/\s*\/\s*/g, '/').trim().toUpperCase();
  if (s === 'GUARDS') return 'PG/SG';
  if (s === 'WINGMEN' || s === 'WINGS') return 'SG/SF';
  if (s === 'FORWARDS') return 'SF/PF';
  if (s === 'BIG MEN' || s === 'BIGS') return 'PF/C';
  if (s === 'TEAM' || s === 'ALL') return 'TEAM';
  const ORDER = ['PG', 'SG', 'SF', 'PF', 'C'];
  const parts = s.split('/').filter(Boolean);
  if (parts.every((p) => ORDER.includes(p))) {
    return parts.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).join('/');
  }
  return s;
}

interface WeekRow {
  date: string; // M/D/YYYY as shown
  label: string; positions: string; minutes: number | null; trainingId: number | null;
  pops: Array<{ skill: string; key: string | null; from: number; to: number }>;
  ageEvent?: string;
}

function parseHistory(html: string): WeekRow[] {
  const rows: WeekRow[] = [];
  let current: WeekRow | null = null;
  // iterate repeater rows in document order
  const rowRe = /<tr id="cphContent_rptTrainingHistory_trItemRow_\d+">([\s\S]*?)<\/tr>/g;
  for (const m of html.matchAll(rowRe)) {
    const cell = m[1];
    const date = cell.match(/<td align="center">\s*([0-9/]+)\s*<\/td>/)?.[1] ?? null;
    const training = cell.match(/lblTrainingText_\d+"><b>([^<]+)<\/b>(?:\s*for\s*<b>([^<]+)<\/b>)?\s*\(([^)]*?)\+?\s*minutes?\)/);
    const age = cell.match(/lblAgeIncrease_\d+">([^<]+)</)?.[1];
    const pop = cell.match(/lblPlayerSkill_\d+">([^<]+)<[\s\S]*?lblPlayerOldLevel_\d+" class="lev(\d+)"[\s\S]*?lblPlayerNewLevel_\d+" class="lev(\d+)"/);

    if (date && training) {
      if (current) rows.push(current);
      const label = training[1].trim();
      const positions = canonicalPositions(training[2] ?? 'TEAM');
      current = {
        date, label, positions,
        minutes: training[3] === '' ? null : Number(training[3]),
        trainingId: TRAINING_IDS[`${label}|${positions}`] ?? null,
        pops: [],
      };
    } else if (age) {
      if (current) rows.push(current);
      current = { date: date ?? '', label: 'AGE', positions: '', minutes: null, trainingId: null, pops: [], ageEvent: age.trim() };
    } else if (pop && current) {
      const skill = pop[1].trim();
      current.pops.push({ skill, key: SKILL_NAME_TO_KEY[skill] ?? null, from: Number(pop[2]), to: Number(pop[3]) });
    }
  }
  if (current) rows.push(current);
  return rows;
}

function parseUsDate(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// skill_pops.skill uses the same short keys as the snapshot-derived ('snapshots' source)
// pop rows (see src/lib/training/pops.ts PopSkill) — 'st'/'ft', not the scraper's own
// 'stamina'/'free_throw' internal names.
const POP_KEY_TO_DB: Record<string, string> = { stamina: 'st', free_throw: 'ft' };

/** Persist exact-date pops (and drops) as maximally tight anchors for Task 6/7 inference. */
async function upsertScrapedPops(playerId: number, weeks: WeekRow[]): Promise<number> {
  let n = 0;
  for (const w of weeks) {
    for (const p of w.pops) {
      if (!p.key) continue; // unmapped skill name — skip rather than write a bad row
      const skillKey = POP_KEY_TO_DB[p.key] ?? p.key;
      const at = parseUsDate(w.date).toISOString();
      await sql`
        insert into skill_pops (player_id, skill, to_displayed, delta, window_start, window_end, window_weeks, source)
        values (${playerId}, ${skillKey}, ${p.to}, ${p.to - p.from}, ${at}, ${at}, 1, 'own-scrape')
        on conflict (player_id, skill, window_end, source)
        do update set to_displayed = excluded.to_displayed, delta = excluded.delta
      `;
      n++;
    }
  }
  return n;
}

const coach = Number(arg('coach', '5'));
const yt = Number(arg('yt', '0'));
const gym = Number(arg('gym', '0'));
const tc = Number(arg('tc', '0'));
const noDb = process.argv.includes('--no-db');
const sql = neon(process.env.DATABASE_URL!);

let playerIds: number[];
const playersArg = process.argv.includes('--players') ? arg('players') : null;
if (playersArg) {
  playerIds = playersArg.split(',').map(Number);
} else {
  const team = Number(arg('team'));
  const rows = await sql`select bb_player_id from players where owner_team_id = ${team} order by bb_player_id`;
  playerIds = rows.map((r) => Number(r.bb_player_id));
}

mkdirSync(OUT_DIR, { recursive: true });
const session = new BbWebSession();
await session.login();

// --switch-team: BB accounts with a second team must toggle the active team
// context. The lbSwitchTeams postback belongs to /home.aspx — posting the
// event anywhere else silently no-ops (wrong VIEWSTATE owner).
if (process.argv.includes('--switch-team')) {
  const home = await session.get('/home.aspx');
  const resp = await session.post('/home.aspx', {
    ...collectHiddenFields(home),
    __EVENTTARGET: 'ctl00$lbSwitchTeams',
    __EVENTARGUMENT: '',
  });
  const active = resp.match(/id='menuTeamName' href='\/team\/(\d+)\/overview.aspx'[^>]*>([^<]+)</)?.slice(1);
  console.log('switched team context to:', active?.join(' '));
}

for (const pid of playerIds) {
  await new Promise((r) => setTimeout(r, 1000));
  const html = await session.get(`/player/${pid}/traininghistory.aspx`);
  const weeks = parseHistory(html);
  if (weeks.length === 0) {
    console.log(`${pid}: no history rows (foreign player or empty)`);
    continue;
  }

  // newest-first in the page -> chronological
  weeks.reverse();

  // latest full-skill snapshot = end state
  const [snap] = await sql`
    select captured_at::date as d, age, potential, jump_shot, jump_range, outside_def, handling, driving,
           passing, inside_shot, inside_def, rebounding, shot_blocking, stamina, free_throw
    from snapshots where player_id = ${pid} and jump_shot is not null
    order by captured_at desc limit 1`;
  const [p] = await sql`select name, height_cm from players where bb_player_id = ${pid}`;

  const KEY_TO_COL: Record<string, string> = {
    js: 'jump_shot', jr: 'jump_range', od: 'outside_def', ha: 'handling', dr: 'driving',
    pa: 'passing', is: 'inside_shot', id: 'inside_def', rb: 'rebounding', sb: 'shot_blocking',
  };

  // back-track start skills: for each skill, the FIRST pop's from-level; otherwise the end value
  const startSkills: Record<string, number | null> = {};
  if (snap) {
    for (const k of SKILL_KEYS) {
      const firstPop = weeks.flatMap((w) => w.pops).find((x) => x.key === k);
      startSkills[k] = firstPop ? firstPop.from : (snap[KEY_TO_COL[k]] as number | null);
    }
  }

  const out = {
    label: `${p?.name ?? pid} (${pid}) — scraped ${new Date().toISOString().slice(0, 10)}`,
    source: 'traininghistory.aspx (own team); end skills from latest full snapshot; start skills back-tracked from first pops',
    player: {
      bbPlayerId: pid,
      heightCm: p?.height_cm ?? null,
      potential: snap?.potential ?? null,
      age: snap?.age ?? null,
      startSkillsDisplayed: startSkills,
      startStamina: snap?.stamina ?? null,
      startFreeThrow: snap?.free_throw ?? null,
      endSnapshotDate: snap?.d ?? null,
    },
    coachLevel: coach,
    youthTrainerLevel: yt,
    gymLevel: gym,
    trainingCourtLevel: tc,
    rawWeeks: weeks,
    endSkillsDisplayed: snap
      ? Object.fromEntries(SKILL_KEYS.map((k) => [k, snap[KEY_TO_COL[k]]]))
      : null,
  };
  const file = path.join(OUT_DIR, `th-${pid}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2));
  const popCount = weeks.reduce((a, w) => a + w.pops.length, 0);
  const unmapped = weeks.filter((w) => w.label !== 'AGE' && w.trainingId == null).map((w) => `${w.label}|${w.positions}`);
  console.log(`${pid} ${p?.name}: ${weeks.length} rows, ${popCount} pops -> ${file}${unmapped.length ? ` | UNMAPPED: ${[...new Set(unmapped)].join(', ')}` : ''}`);

  if (!noDb) {
    const n = await upsertScrapedPops(pid, weeks);
    console.log(`  ↳ ${n} pops upserted to skill_pops`);
  }
}
