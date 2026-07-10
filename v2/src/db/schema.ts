import {
  pgTable, serial, integer, bigint, text, boolean, timestamp, jsonb,
  index, uniqueIndex, primaryKey,
} from 'drizzle-orm/pg-core';

export const SNAPSHOT_SOURCES = ['api', 'market', 'census', 'manual', 'extension'] as const;

export const players = pgTable('players', {
  bbPlayerId: integer('bb_player_id').primaryKey(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  countryId: integer('country_id'),
  nationality: text('nationality'),
  heightCm: integer('height_cm'),
  bestPosition: text('best_position'),
  isUtopian: boolean('is_utopian').notNull().default(false),
  seasonDrafted: integer('season_drafted'),
  draftPick: integer('draft_pick'),
  ownerTeamId: integer('owner_team_id'),
  ownerTeamName: text('owner_team_name'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  archived: boolean('archived').notNull().default(false),
}, (t) => [
  index('idx_players_country').on(t.countryId),
  index('idx_players_nationality').on(t.nationality),
]);

export const snapshots = pgTable('snapshots', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  source: text('source', { enum: SNAPSHOT_SOURCES }).notNull(),
  season: integer('season'),
  age: integer('age'),
  dmi: bigint('dmi', { mode: 'number' }),
  gameShape: integer('game_shape'),
  salary: integer('salary'),
  potential: integer('potential'),
  experience: integer('experience'),
  // 12 skills — null on light snapshots
  jumpShot: integer('jump_shot'),
  jumpRange: integer('jump_range'),
  outsideDef: integer('outside_def'),
  handling: integer('handling'),
  driving: integer('driving'),
  passing: integer('passing'),
  insideShot: integer('inside_shot'),
  insideDef: integer('inside_def'),
  rebounding: integer('rebounding'),
  shotBlocking: integer('shot_blocking'),
  stamina: integer('stamina'),
  freeThrow: integer('free_throw'),
  tsp: integer('tsp'),
  ownerTeamId: integer('owner_team_id'),
  ownerTeamName: text('owner_team_name'),
  // market-sweep fields
  startingPrice: bigint('starting_price', { mode: 'number' }),
  auctionEndsAt: timestamp('auction_ends_at', { withTimezone: true }),
  isRookieListing: boolean('is_rookie_listing'),
}, (t) => [
  index('idx_snapshots_player_date').on(t.playerId, t.capturedAt.desc()),
  index('idx_snapshots_captured_at').on(t.capturedAt.desc()),
]);

export const ntSquad = pgTable('nt_squad', {
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  season: integer('season').notNull(),
  role: text('role'),
  note: text('note'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.playerId, t.season] })]);

export const trackedCountries = pgTable('tracked_countries', {
  id: serial('id').primaryKey(),
  countryId: integer('country_id'),
  name: text('name').notNull(),
  starred: boolean('starred').notNull().default(false),
  purpose: text('purpose'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uq_tracked_countries_name').on(t.name)]);

export const seasons = pgTable('seasons', {
  id: integer('id').primaryKey(),
  start: timestamp('start', { withTimezone: true }).notNull(),
  finish: timestamp('finish', { withTimezone: true }),
});

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_notes_player').on(t.playerId)]);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uq_tags_player_tag').on(t.playerId, t.tag)]);

export const censusRuns = pgTable('census_runs', {
  id: serial('id').primaryKey(),
  status: text('status', { enum: ['running', 'finished', 'aborted', 'failed'] }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  totals: jsonb('totals'),
});

export const censusItems = pgTable('census_items', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').notNull().references(() => censusRuns.id, { onDelete: 'cascade' }),
  playerId: integer('player_id').notNull(),
  status: text('status', { enum: ['pending', 'recruited', 'captured', 'failed', 'skipped'] }).notNull(),
  error: text('error'),
}, (t) => [index('idx_census_items_run').on(t.runId)]);

export const syncLog = pgTable('sync_log', {
  id: serial('id').primaryKey(),
  jobType: text('job_type').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  ok: boolean('ok'),
  counts: jsonb('counts'),
  error: text('error'),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
