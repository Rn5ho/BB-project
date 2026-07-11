// Backfill teams table: fetch teaminfo from BB XML API for all owner_team_ids in players.
// Usage:  node scripts/backfill-teams.mjs            (dry-run: prints counts + samples)
//         node scripts/backfill-teams.mjs --yes       (write to DB)

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// neon-http client directly — avoids Drizzle parameter array issues for large IN lists
const { neon } = await import('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const args = process.argv.slice(2);
const dryRun = !args.includes('--yes');

// ── 1. Collect distinct owner_team_ids from players ───────────────────────────
const playerRows = await sql`select distinct owner_team_id from players where owner_team_id is not null`;
const allTeamIds = playerRows.map((r) => Number(r.owner_team_id));
console.log(`Found ${allTeamIds.length} distinct owner team IDs.`);

// ── 2. Find which teams are already fresh (updated within 7 days) ─────────────
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
const freshRows = await sql`select team_id from teams where updated_at >= ${sevenDaysAgo}`;
const freshSet = new Set(freshRows.map((r) => Number(r.team_id)));
const staleIds = allTeamIds.filter((id) => !freshSet.has(id));

console.log(`Fresh in DB: ${freshSet.size}, Stale/missing: ${staleIds.length}`);

if (staleIds.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

if (dryRun) {
  console.log('DRY RUN — pass --yes to write. Sample IDs:', staleIds.slice(0, 3));
  console.log(`Would fetch ${staleIds.length} teams.`);
  process.exit(0);
}

// ── 3. Fetch from BB XML API ──────────────────────────────────────────────────
const BASE = 'https://bbapi.buzzerbeater.com';

async function login() {
  const res = await fetch(
    `${BASE}/login.aspx?login=${encodeURIComponent(process.env.BB_API_USERNAME)}&code=${encodeURIComponent(process.env.BB_API_SECURITY_CODE)}`,
    { redirect: 'manual' }
  );
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('BB login failed (no cookie)');
  return cookie;
}

async function logout(cookie) {
  await fetch(`${BASE}/logout.aspx`, { headers: { Cookie: cookie } }).catch(() => {});
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function parseTeamInfoXml(xml, fallbackTeamId) {
  const teamIdMatch = xml.match(/<team[^>]*\sid='(\d+)'/);
  const teamId = teamIdMatch ? Number(teamIdMatch[1]) : (fallbackTeamId ?? 0);
  const nameMatch = xml.match(/<teamName>([^<]*)<\/teamName>/);
  const ownerMatch = xml.match(/<owner[^>]*>([^<]*)<\/owner>/);
  return {
    teamId,
    name: nameMatch ? decode(nameMatch[1].trim()) : null,
    ownerAlias: ownerMatch ? decode(ownerMatch[1].trim()) : null,
  };
}

console.log(`Fetching ${staleIds.length} teams from BB API (150ms pacing)...`);
const cookie = await login();
const results = [];
try {
  for (let i = 0; i < staleIds.length; i++) {
    const tid = staleIds[i];
    if (i > 0) await new Promise((r) => setTimeout(r, 150));
    try {
      const xml = await (
        await fetch(`${BASE}/teaminfo.aspx?teamid=${tid}`, { headers: { Cookie: cookie } })
      ).text();
      results.push(parseTeamInfoXml(xml, tid));
    } catch (err) {
      console.warn(`  Failed for team ${tid}:`, err.message);
      results.push({ teamId: tid, name: null, ownerAlias: null });
    }
    if ((i + 1) % 50 === 0) console.log(`  ... ${i + 1}/${staleIds.length}`);
  }
} finally {
  await logout(cookie);
}

// ── 4. Upsert into teams ──────────────────────────────────────────────────────
const now = new Date().toISOString();
let upserted = 0;
for (const t of results) {
  await sql`
    insert into teams (team_id, name, owner_alias, updated_at)
    values (${t.teamId}, ${t.name}, ${t.ownerAlias}, ${now})
    on conflict (team_id) do update set
      name = excluded.name,
      owner_alias = excluded.owner_alias,
      updated_at = excluded.updated_at
  `;
  upserted++;
}

console.log(`\nDone. Fetched: ${results.length}, Upserted: ${upserted}`);
console.log('Samples:');
results.slice(0, 3).forEach((t) => {
  console.log(`  teamId=${t.teamId}  name="${t.name}"  owner="${t.ownerAlias}"`);
});
process.exit(0);
