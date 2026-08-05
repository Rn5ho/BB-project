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
  gymLevel: integer('gym_level').notNull().default(0),
  trainingCourtLevel: integer('training_court_level').notNull().default(0),
  // Horizon target: plan runs until the player ENTERS this (age, season-week).
  // Both null = custom plan (raw week counts, pre-horizon behavior).
  horizonAge: integer('horizon_age'),
  horizonWeek: integer('horizon_week'),
  isActive: boolean('is_active').notNull().default(true),
  planNotes: text('plan_notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_training_plans_player').on(t.playerId)]);

export const skillPops = pgTable('skill_pops', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => players.bbPlayerId, { onDelete: 'cascade' }),
  skill: text('skill').notNull(), // 'js'|'jr'|'od'|'ha'|'dr'|'pa'|'is'|'id'|'rb'|'sb'|'st'|'ft'
  toDisplayed: integer('to_displayed').notNull(),
  delta: integer('delta').notNull(), // displayed change over the window; negative = drop
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  windowWeeks: integer('window_weeks').notNull(),
  source: text('source', { enum: ['snapshots', 'own-scrape'] }).notNull().default('snapshots'),
}, (t) => [
  index('idx_skill_pops_player').on(t.playerId),
  uniqueIndex('uq_skill_pops').on(t.playerId, t.skill, t.windowEnd, t.source),
]);

export const trainingObservations = pgTable('training_observations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  inferredTrainingId: integer('inferred_training_id'), // null = no usable signal
  confidence: text('confidence', { enum: ['high', 'medium', 'low'] }).notNull(),
  evidence: jsonb('evidence').notNull(), // { popCount, playerCount, explainedFrac, scores, playerIds }
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_training_obs_team').on(t.teamId, t.windowEnd.desc()),
  uniqueIndex('uq_training_obs').on(t.teamId, t.windowStart, t.windowEnd),
]);

// Self-trainer (weekly own-team model scoring). Single-row config like review_marks:
// the own club whose traininghistory pages we scrape + the staff levels the model
// replays with. switch_team = the club is the account's SECOND team (home.aspx toggle).
export const selfTrainerConfig = pgTable('self_trainer_config', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull(),
  switchTeam: boolean('switch_team').notNull().default(false),
  coachLevel: integer('coach_level').notNull().default(5),
  youthTrainerLevel: integer('youth_trainer_level').notNull().default(0),
  gymLevel: integer('gym_level').notNull().default(0),
  trainingCourtLevel: integer('training_court_level').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// App configuration managed from /settings (key-value; e.g. 'guest_password' —
// the shareable read-only community password; null/absent row = guest login disabled).
export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per model per self-trainer run: replay of every own-team player's full
// visible training history vs observed pops. Trend across run_at = model drift.
export const modelScorecards = pgTable('model_scorecards', {
  id: serial('id').primaryKey(),
  runAt: timestamp('run_at', { withTimezone: true }).notNull(),
  modelId: text('model_id').notNull(),
  popHits: integer('pop_hits').notNull(),
  popMisses: integer('pop_misses').notNull(),
  falseAlarms: integer('false_alarms').notNull(),
  endAbsErr: integer('end_abs_err').notNull(),  // Σ |displayed error| over scored end skills
  endCount: integer('end_count').notNull(),
  endExact: integer('end_exact').notNull(),
  playerCount: integer('player_count').notNull(),
  weekCount: integer('week_count').notNull(),
  details: jsonb('details').notNull(), // per-player: { playerId, name, weeks, hits, misses, falseAlarms, endAbsErr, endExact, endCount }
}, (t) => [
  index('idx_model_scorecards_model').on(t.modelId, t.runAt.desc()),
]);
