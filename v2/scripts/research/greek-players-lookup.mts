// SELECT-only. Which Greek S72 bronze players do we hold, and what do we know about
// their clubs? Feasibility check for reconstructing their 18->21 training from
// per-position match minutes (owner's idea, 2026-08-07).
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const sql = neon(process.env.DATABASE_URL!);

const csv = readFileSync('../docs/research/market-archetypes/greece-s72/greek_summary.csv', 'utf8');
const names = csv.trim().split('\n').slice(1).map((l) => l.split(',')[0]);

const surnames = names.map((n) => n.split(' ').slice(-1)[0]);
const rows = await sql`
  select p.bb_player_id, p.name, p.height_cm, p.owner_team_id, p.owner_team_name, p.season_drafted,
         (select count(*) from snapshots s where s.player_id = p.bb_player_id) as snaps,
         (select min(s.season) from snapshots s where s.player_id = p.bb_player_id) as first_season,
         (select max(s.season) from snapshots s where s.player_id = p.bb_player_id) as last_season
  from players p where p.last_name = any(${surnames}) or p.name = any(${names})`;

console.log(JSON.stringify({ namesInWorkbook: names.length, matched: rows.length, rows }, null, 1));
