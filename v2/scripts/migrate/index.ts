import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/db/schema';
import { readTable } from './supabase';
import { fetchSeasons } from './seasons';
import { transformPlayer, transformSnapshot, V1Player, V1Snapshot } from './transform';
import { pickCurrentSeason } from '../../src/lib/domain';
import { sql } from 'drizzle-orm';

const WRITE = process.argv.includes('--yes');

interface V1Note {
  id: number;
  player_id: number;
  content: string;
  created_at: string;
}

interface V1Tag {
  id: number;
  player_id: number;
  tag: string;
}

interface V1Settings {
  key: string;
  value: unknown;
}

async function main() {
  console.log(`\n=== BB Scout v1 → v2 Migration (${WRITE ? 'REAL RUN' : 'DRY RUN'}) ===\n`);

  // ── 1. Read from Supabase ──────────────────────────────────────────────────
  console.log('Reading from Supabase...');
  const [v1Players, v1Snapshots, v1Notes, v1Tags, v1Settings] = await Promise.all([
    readTable<V1Player>('players', 'id'),
    readTable<V1Snapshot>('skill_snapshots', 'id'),
    readTable<V1Note>('player_notes', 'id'),
    readTable<V1Tag>('player_tags', 'id'),
    readTable<V1Settings>('settings', 'key'),
  ]);

  console.log(`  v1 players:          ${v1Players.length}`);
  console.log(`  v1 snapshots:        ${v1Snapshots.length}`);
  console.log(`  v1 notes:            ${v1Notes.length}`);
  console.log(`  v1 tags:             ${v1Tags.length}`);
  console.log(`  v1 settings:         ${v1Settings.length}`);

  // ── 2. Fetch seasons from BB API ───────────────────────────────────────────
  console.log('\nFetching seasons from BB API...');
  const seasons = await fetchSeasons();
  console.log(`  Fetched ${seasons.length} seasons`);
  const currentSeason = pickCurrentSeason(seasons, new Date());
  console.log(`  Current season:      ${currentSeason}`);

  // ── 3. Transform players ───────────────────────────────────────────────────
  const transformedPlayers = v1Players.map(transformPlayer);

  // Build v1 internal id → bb_player_id map
  const v1IdToBbId = new Map<number, number>();
  for (const p of v1Players) {
    v1IdToBbId.set(p.id, p.bb_player_id);
  }

  // ── 4. Transform snapshots ─────────────────────────────────────────────────
  const transformedSnapshots = v1Snapshots
    .map((s) => transformSnapshot(s, v1IdToBbId))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const droppedSnapshots = v1Snapshots.length - transformedSnapshots.length;
  if (droppedSnapshots > 0) {
    console.warn(`\nWARN: ${droppedSnapshots} snapshots dropped (unknown player FK)`);
  }

  // ── 5. NT squad rows ───────────────────────────────────────────────────────
  const ntSquadRows: { playerId: number; season: number; note: string }[] = [];
  const legacyOppNtTags: { playerId: number; tag: string }[] = [];

  for (const p of v1Players) {
    if (!p.is_nt_player) continue;
    if (p.nationality === 'Slovenia') {
      ntSquadRows.push({
        playerId: p.bb_player_id,
        season: currentSeason,
        note: 'migrated from v1 is_nt_player',
      });
    } else {
      legacyOppNtTags.push({ playerId: p.bb_player_id, tag: 'legacy-opp-nt' });
    }
  }

  // ── 6. Notes ───────────────────────────────────────────────────────────────
  const notesRows: { playerId: number; body: string; createdAt: Date }[] = [];
  let droppedNotes = 0;
  for (const n of v1Notes) {
    const bbId = v1IdToBbId.get(n.player_id);
    if (!bbId) { droppedNotes++; continue; }
    notesRows.push({ playerId: bbId, body: n.content, createdAt: new Date(n.created_at) });
  }
  if (droppedNotes > 0) console.warn(`WARN: ${droppedNotes} notes dropped (unknown player FK)`);

  // ── 7. Tags ────────────────────────────────────────────────────────────────
  const tagsFromV1: { playerId: number; tag: string }[] = [];
  let droppedTags = 0;
  for (const t of v1Tags) {
    const bbId = v1IdToBbId.get(t.player_id);
    if (!bbId) { droppedTags++; continue; }
    tagsFromV1.push({ playerId: bbId, tag: t.tag });
  }
  if (droppedTags > 0) console.warn(`WARN: ${droppedTags} tags dropped (unknown player FK)`);

  // Merge v1 tags + legacy-opp-nt tags (dedup by player+tag)
  const tagSet = new Set<string>();
  const allTags: { playerId: number; tag: string }[] = [];
  for (const t of [...tagsFromV1, ...legacyOppNtTags]) {
    const key = `${t.playerId}:${t.tag}`;
    if (!tagSet.has(key)) {
      tagSet.add(key);
      allTags.push(t);
    }
  }

  // ── 8. Settings / tracked countries ───────────────────────────────────────
  const trackedCountriesRows: { name: string; starred: boolean; purpose: string }[] = [];
  for (const s of v1Settings) {
    if (/starred/i.test(s.key)) {
      const val = s.value;
      if (Array.isArray(val)) {
        // Could be array of strings or array of objects — handle both
        for (const item of val) {
          if (typeof item === 'string') {
            trackedCountriesRows.push({ name: item, starred: true, purpose: 'season-opponent (migrated)' });
          } else if (item && typeof item === 'object') {
            // Print shape for debugging — no secrets
            console.log(`  Settings '${s.key}' item shape: ${JSON.stringify(item)}`);
            const name = (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).country;
            if (typeof name === 'string') {
              trackedCountriesRows.push({ name, starred: true, purpose: 'season-opponent (migrated)' });
            }
          }
        }
      } else {
        console.log(`  Settings '${s.key}' unexpected shape: ${JSON.stringify(val)}`);
      }
    } else {
      console.log(`  Settings key '${s.key}' not migrated (review manually)`);
    }
  }

  // ── 9. Print planned counts ────────────────────────────────────────────────
  console.log('\n--- Planned v2 inserts ---');
  console.log(`  seasons:             ${seasons.length}`);
  console.log(`  players:             ${transformedPlayers.length}`);
  console.log(`  snapshots:           ${transformedSnapshots.length}  (dropped: ${droppedSnapshots})`);
  console.log(`  nt_squad:            ${ntSquadRows.length}`);
  console.log(`  tags:                ${allTags.length}  (legacy-opp-nt: ${legacyOppNtTags.length})`);
  console.log(`  notes:               ${notesRows.length}  (dropped: ${droppedNotes})`);
  console.log(`  tracked_countries:   ${trackedCountriesRows.length}`);

  if (!WRITE) {
    console.log('\nDRY RUN complete — pass --yes to write.\n');
    return;
  }

  // ── 10. WRITE ──────────────────────────────────────────────────────────────
  console.log('\nWriting to Neon...');
  const dbUrl = process.env.DATABASE_URL!;
  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient, { schema });

  // Wipe (FK-safe order)
  console.log('  Wiping existing data...');
  await db.delete(schema.censusItems);
  await db.delete(schema.censusRuns);
  await db.delete(schema.ntSquad);
  await db.delete(schema.notes);
  await db.delete(schema.tags);
  await db.delete(schema.snapshots);
  await db.delete(schema.players);
  await db.delete(schema.seasons);
  await db.delete(schema.trackedCountries);

  // Insert seasons
  console.log('  Inserting seasons...');
  await db.insert(schema.seasons).values(seasons);

  // Insert players in chunks of 500
  console.log('  Inserting players...');
  for (let i = 0; i < transformedPlayers.length; i += 500) {
    await db.insert(schema.players).values(transformedPlayers.slice(i, i + 500));
  }

  // Insert snapshots in chunks of 500
  console.log('  Inserting snapshots...');
  for (let i = 0; i < transformedSnapshots.length; i += 500) {
    await db.insert(schema.snapshots).values(transformedSnapshots.slice(i, i + 500));
  }

  // Insert nt_squad
  if (ntSquadRows.length > 0) {
    console.log('  Inserting nt_squad...');
    await db.insert(schema.ntSquad).values(ntSquadRows);
  }

  // Insert tags (with conflict ignore)
  if (allTags.length > 0) {
    console.log('  Inserting tags...');
    for (let i = 0; i < allTags.length; i += 500) {
      await db.insert(schema.tags).values(allTags.slice(i, i + 500))
        .onConflictDoNothing();
    }
  }

  // Insert notes
  if (notesRows.length > 0) {
    console.log('  Inserting notes...');
    for (let i = 0; i < notesRows.length; i += 500) {
      await db.insert(schema.notes).values(notesRows.slice(i, i + 500));
    }
  }

  // Insert tracked_countries (with conflict ignore)
  if (trackedCountriesRows.length > 0) {
    console.log('  Inserting tracked_countries...');
    await db.insert(schema.trackedCountries).values(trackedCountriesRows)
      .onConflictDoNothing();
  }

  // ── 11. Verify ─────────────────────────────────────────────────────────────
  console.log('\n--- Verification ---');
  const counts = await Promise.all([
    sqlClient`SELECT COUNT(*)::int AS n FROM players`,
    sqlClient`SELECT COUNT(*)::int AS n FROM snapshots`,
    sqlClient`SELECT COUNT(*)::int AS n FROM nt_squad`,
    sqlClient`SELECT COUNT(*)::int AS n FROM notes`,
    sqlClient`SELECT COUNT(*)::int AS n FROM tags`,
    sqlClient`SELECT COUNT(*)::int AS n FROM seasons`,
  ]);

  const [dbPlayers, dbSnapshots, dbNtSquad, dbNotes, dbTags, dbSeasons] = counts.map((r) => Number(r[0].n));

  const checks = [
    { label: 'players',   got: dbPlayers,   want: transformedPlayers.length },
    { label: 'snapshots', got: dbSnapshots,  want: transformedSnapshots.length },
    { label: 'nt_squad',  got: dbNtSquad,    want: ntSquadRows.length },
    { label: 'notes',     got: dbNotes,      want: notesRows.length },
    { label: 'tags',      got: dbTags,       want: allTags.length },
    { label: 'seasons',   got: dbSeasons,    want: seasons.length },
  ];

  let anyMismatch = false;
  for (const { label, got, want } of checks) {
    const ok = got === want;
    if (!ok) anyMismatch = true;
    console.log(`  ${label.padEnd(12)} got=${got}  want=${want}  ${ok ? 'OK' : '*** MISMATCH ***'}`);
  }

  if (anyMismatch) {
    console.error('\n!!! MISMATCH detected — review above !!!');
  } else {
    console.log('\nAll counts match. Migration complete.');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
