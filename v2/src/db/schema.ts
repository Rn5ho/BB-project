import {
  pgTable, serial, integer, bigint, text, boolean, timestamp, jsonb,
  index, uniqueIndex, primaryKey,
} from 'drizzle-orm/pg-core';

export const SNAPSHOT_SOURCES = ['api', 'market', 'census', 'manual', 'extension'] as const;

export const reviewMarks = pgTable('review_marks', {
  id: serial('id').primaryKey(),
  scope: text('scope').notNull(),
  markedAt: timestamp('marked_at', { withTimezone: true }).notNull(),
}, (t) => [
  uniqueIndex('uq_review_marks_scope').on(t.scope),
]);

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
  status: text('status', { enum: ['requested', 'running', 'finished', 'aborted', 'failed'] }).notNull(),
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
  trigger: text('trigger').notNull().default('manual'),
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

export const teams = pgTable('teams', {
  teamId: integer('team_id').primaryKey(),
  name: text('name'),
  ownerAlias: text('owner_alias'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  scheduleSyncedAt: timestamp('schedule_synced_at', { withTimezone: true }),
  scheduleSyncedSeason: integer('schedule_synced_season'),
});

export const archetypes = pgTable('archetypes', {
  id: serial('id').primaryKey(),
  key: text('key'),                         // default key this overrides; null = custom
  name: text('name').notNull(),
  description: text('description'),
  rules: jsonb('rules').notNull(),          // ArchetypeRules
  hidden: boolean('hidden').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uq_archetypes_key').on(t.key)]);

export const matches = pgTable('matches', {
  matchId: integer('match_id').primaryKey(),
  homeTeamId: integer('home_team_id'),
  awayTeamId: integer('away_team_id'),
  matchType: text('match_type').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  season: integer('season'),
  seasonWeek: integer('season_week'),
  boxscoreFetchedAt: timestamp('boxscore_fetched_at', { withTimezone: true }),
  boxscoreError: text('boxscore_error'),
}, (t) => [
  index('idx_matches_pending').on(t.boxscoreFetchedAt),
  index('idx_matches_start').on(t.startTime.desc()),
  index('idx_matches_teams').on(t.homeTeamId, t.awayTeamId),
]);

export const playerMatchMinutes = pgTable('player_match_minutes', {
  matchId: integer('match_id').notNull().references(() => matches.matchId, { onDelete: 'cascade' }),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  minPg: integer('min_pg').notNull().default(0),
  minSg: integer('min_sg').notNull().default(0),
  minSf: integer('min_sf').notNull().default(0),
  minPf: integer('min_pf').notNull().default(0),
  minC: integer('min_c').notNull().default(0),
  isStarter: boolean('is_starter'),
}, (t) => [
  primaryKey({ columns: [t.matchId, t.playerId] }),
  index('idx_pmm_player').on(t.playerId),
]);

export const trainingPlans = pgTable('training_plans', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  blocks: jsonb('blocks').notNull(), // PlanBlock[]: { trainingId: 1-33, weeks: >=1 }[]
  coachLevel: integer('coach_level').notNull().default(5),
  youthTrainerLevel: integer('youth_trainer_level').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  planNotes: text('plan_notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_training_plans_player').on(t.playerId)]);
