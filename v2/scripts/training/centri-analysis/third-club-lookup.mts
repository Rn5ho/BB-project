// Round-2 centri analysis: recover the delonche third-club context from the Neon DB.
// READ-ONLY. Looks up (1) teams owned by an alias matching 'delonche', (2) players whose
// names appear in history_pops.csv, and prints identity + latest full snapshot for each.
// Usage (from v2/): npx tsx scripts/training/centri-analysis/third-club-lookup.mts
import { config } from 'dotenv';
config({ path: '.env.local' });

const { sql } = await import('drizzle-orm');
const { db } = await import('../../../src/db/index');

const NAMES = [
  'Manuel Abas', 'Valjhun Umek', 'Stane Brodnik', 'Nien Hông', 'Juraj Orolík',
  'Tadej Vindiš', 'Gabriel Baía', 'Fuad Khayyat', 'Kamatchinathan Bhushan',
  'Miha Šušterič', 'Mubarak Manaf', 'Gaitán Lizana Lezana', 'Pablo Alpízar',
  'Bert Heyngenstaedt',
];

// 1. teams with a delonche-ish owner alias
const teams = await db.execute(sql`
  select team_id, name, owner_alias from teams where owner_alias ilike '%delonche%'
`);
console.log('TEAMS matching delonche:', JSON.stringify(teams.rows ?? teams, null, 1));

// 2. players by name (exact-ish, unaccent not assumed — try ilike on each)
for (const n of NAMES) {
  const r = await db.execute(sql`
    select p.bb_player_id, p.name, p.height_cm, p.owner_team_id, t.name as team_name,
           t.owner_alias, p.nationality, p.season_drafted, p.best_position
    from players p left join teams t on t.team_id = p.owner_team_id
    where p.name ilike ${'%' + n.split(' ').pop() + '%'}
  `);
  const rows = (r as any).rows ?? r;
  for (const row of rows) console.log('PLAYER?', n, '=>', JSON.stringify(row));
  if (rows.length === 0) console.log('PLAYER?', n, '=> NO MATCH');
}
process.exit(0);
