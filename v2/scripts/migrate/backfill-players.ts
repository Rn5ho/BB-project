import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../../src/db/schema';

const WRITE = process.argv.includes('--yes');

const POSITION_MAP: Record<number, string> = {
  1: 'PG',
  2: 'SG',
  3: 'SF',
  4: 'PF',
  5: 'C',
};

// Age windows to keep each fetch under 1000
const AGE_WINDOWS = [
  { minAge: 18, maxAge: 21 },
  { minAge: 22, maxAge: 25 },
  { minAge: 26, maxAge: 29 },
  { minAge: 30, maxAge: 34 },
  { minAge: 35, maxAge: 45 },
];

interface BBPlayer {
  playerId: number;
  firstName: string;
  lastName: string;
  teamId: number;
  teamName: string;
  countryId: number;
  isUtopian: boolean;
  position: number;
  age: number;
  potential: number;
  salary: number;
  height: number; // INCHES
  isForSale: boolean;
  seasonDrafted: number;
  gs: number;
  dmi: number;
}

async function fetchWindow(minAge: number, maxAge: number): Promise<BBPlayer[]> {
  const url = `https://api.buzzerbeater.com/BBAPI/api/Players?countryId=66&minAge=${minAge}&maxAge=${maxAge}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BB API error ${res.status} for window ${minAge}-${maxAge}`);

  // Decode raw bytes as UTF-8 to handle potential mojibake
  const buf = await res.arrayBuffer();
  const text = Buffer.from(buf).toString('utf8');
  const data = JSON.parse(text) as { isMoreThan1000: boolean; players: BBPlayer[] };

  if (data.isMoreThan1000) {
    throw new Error(`Age window ${minAge}-${maxAge} returned >1000 results — split the window further`);
  }

  return data.players;
}

async function main() {
  console.log(`\n=== BB Player Identity Backfill (${WRITE ? 'REAL RUN' : 'DRY RUN'}) ===\n`);

  // ── 1. Fetch all age windows from BB API ──────────────────────────────────
  console.log('Fetching from BB Players API (countryId=66, 5 age windows)...');
  const apiMap = new Map<number, BBPlayer>();

  for (const { minAge, maxAge } of AGE_WINDOWS) {
    const players = await fetchWindow(minAge, maxAge);
    console.log(`  Window ${minAge}-${maxAge}: ${players.length} players`);
    for (const p of players) {
      apiMap.set(p.playerId, p);
    }
  }
  console.log(`  Total unique API players: ${apiMap.size}`);

  // Quick encoding sanity check — look for a name with Slovenian characters
  let encodingOk = false;
  for (const p of apiMap.values()) {
    const fullName = `${p.firstName} ${p.lastName}`;
    if (/[žščŽŠČ]/.test(fullName)) {
      console.log(`  Encoding check OK — sample name: ${fullName}`);
      encodingOk = true;
      break;
    }
  }
  if (!encodingOk) {
    console.log('  Encoding check: no Slovenian diacritics found in sample (may be OK if none present)');
  }

  // ── 2. Load all Neon players ───────────────────────────────────────────────
  console.log('\nLoading Neon players...');
  const dbUrl = process.env.DATABASE_URL!;
  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient, { schema });

  const neonPlayers = await db.select().from(schema.players);
  console.log(`  Neon players loaded: ${neonPlayers.length}`);

  // ── 3. Build update patches ────────────────────────────────────────────────
  type Patch = {
    playerId: number;
    fields: Partial<typeof schema.players.$inferInsert>;
  };

  const patches: Patch[] = [];
  let ownershipChanges = 0;

  for (const neon of neonPlayers) {
    const api = apiMap.get(neon.bbPlayerId);
    if (!api) continue;

    const patch: Partial<typeof schema.players.$inferInsert> = {};

    // Identity fields — only update if currently null
    if (neon.nationality === null) patch.nationality = 'Slovenia';
    if (neon.countryId === null) patch.countryId = 66;
    if (neon.heightCm === null && api.height != null) {
      patch.heightCm = Math.round(api.height * 2.54);
    }
    if (neon.bestPosition === null && api.position != null) {
      patch.bestPosition = POSITION_MAP[api.position] ?? null;
    }
    if (neon.firstName === null && api.firstName) patch.firstName = api.firstName;
    if (neon.lastName === null && api.lastName) patch.lastName = api.lastName;
    if (neon.seasonDrafted === null && api.seasonDrafted != null) {
      patch.seasonDrafted = api.seasonDrafted;
    }
    if (neon.isUtopian === false && api.isUtopian === true) {
      // Only update if API says utopian (don't flip back)
      patch.isUtopian = true;
    }
    if (neon.ownerTeamId === null && api.teamId != null) {
      patch.ownerTeamId = api.teamId;
    }
    if (neon.ownerTeamName === null && api.teamName) {
      patch.ownerTeamName = api.teamName;
    }

    // Ownership changes — update even if non-null when different
    if (
      api.teamId != null &&
      neon.ownerTeamId != null &&
      neon.ownerTeamId !== api.teamId
    ) {
      patch.ownerTeamId = api.teamId;
      patch.ownerTeamName = api.teamName;
      ownershipChanges++;
    }

    if (Object.keys(patch).length > 0) {
      patches.push({ playerId: neon.bbPlayerId, fields: patch });
    }
  }

  // ── 4. Report ──────────────────────────────────────────────────────────────
  const matchedCount = neonPlayers.filter(p => apiMap.has(p.bbPlayerId)).length;
  const stillNullNationality = neonPlayers.filter(
    p => p.nationality === null && !apiMap.has(p.bbPlayerId)
  ).length;

  console.log('\n--- Planned updates ---');
  console.log(`  Total Neon players:        ${neonPlayers.length}`);
  console.log(`  Matched in API:            ${matchedCount}`);
  console.log(`  Rows with patch:           ${patches.length}`);
  console.log(`  Ownership changes:         ${ownershipChanges}`);
  console.log(`  Still-null nationality:    ${stillNullNationality}  (foreign/retired — expected)`);

  if (patches.length > 0) {
    console.log('\n--- Sample patches (up to 5) ---');
    for (const p of patches.slice(0, 5)) {
      console.log(`  playerId=${p.playerId}  fields=${JSON.stringify(p.fields)}`);
    }
  }

  if (!WRITE) {
    console.log('\nDRY RUN complete — pass --yes to write.\n');
    return;
  }

  // ── 5. Write ───────────────────────────────────────────────────────────────
  console.log('\nWriting updates to Neon...');
  let written = 0;
  for (const { playerId, fields } of patches) {
    await db.update(schema.players)
      .set(fields)
      .where(eq(schema.players.bbPlayerId, playerId));
    written++;
  }
  console.log(`  Updated ${written} rows.`);

  // ── 6. Final verification ──────────────────────────────────────────────────
  console.log('\n--- Final verification ---');

  const nullNatRows = await sqlClient`
    SELECT bb_player_id, name FROM players WHERE nationality IS NULL LIMIT 6
  `;
  const nullCount = await sqlClient`
    SELECT COUNT(*)::int AS n FROM players WHERE nationality IS NULL
  `;
  const natGroups = await sqlClient`
    SELECT nationality, COUNT(*)::int AS n FROM players
    GROUP BY nationality ORDER BY 2 DESC LIMIT 5
  `;

  console.log(`\n  Players still with null nationality: ${nullCount[0].n}`);
  console.log('  Samples (null nationality):');
  for (const r of nullNatRows) {
    console.log(`    id=${r.bb_player_id}  name=${r.name}`);
  }

  console.log('\n  Nationality breakdown (top 5):');
  for (const r of natGroups) {
    console.log(`    ${String(r.nationality ?? 'NULL').padEnd(20)} ${r.n}`);
  }

  console.log('\nBackfill complete.');
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
