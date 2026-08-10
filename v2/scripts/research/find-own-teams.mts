// READ-ONLY probe: identify BOTH of the owner's BuzzerBeater club ids.
// Strategy 1 (DB, SELECT-only): teams sharing the owner_alias of self_trainer_config.team_id.
// Strategy 2 (BB web, GET-only): logged-in /home.aspx — the active team context plus any
//                                team links rendered on the page.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { BbWebSession } from '../../src/server/bb/web-session';

const sql = neon(process.env.DATABASE_URL!);

const cfg = await sql`select team_id, switch_team from self_trainer_config limit 1`;
console.log('self_trainer_config:', JSON.stringify(cfg));
const knownTeam = Number(cfg[0].team_id);

const known = await sql`select team_id, name, owner_alias from teams where team_id = ${knownTeam}`;
console.log('known team row:', JSON.stringify(known));

const alias = known[0]?.owner_alias ?? null;
if (alias) {
  const siblings = await sql`select team_id, name, owner_alias from teams where owner_alias = ${alias} order by team_id`;
  console.log('teams with same owner_alias:', JSON.stringify(siblings));
}

// BB web: read-only GETs only.
const s = new BbWebSession();
await s.login();
const home = await s.get('/home.aspx');
const ids = new Set<string>();
for (const m of home.matchAll(/\/team\/(\d+)\//g)) ids.add(m[1]);
for (const m of home.matchAll(/teamid=(\d+)/gi)) ids.add(m[1]);
console.log('team ids on /home.aspx:', [...ids].join(', '));
const switchLink = home.match(/lbSwitchTeams[\s\S]{0,400}?<\/a>/);
console.log('switch-teams link markup:', switchLink ? switchLink[0].replace(/\s+/g, ' ').slice(0, 400) : 'NONE');
console.log('home title:', home.match(/<title>([^<]*)<\/title>/)?.[1]);
