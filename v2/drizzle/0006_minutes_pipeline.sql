CREATE TABLE "matches" (
	"match_id" integer PRIMARY KEY NOT NULL,
	"home_team_id" integer,
	"away_team_id" integer,
	"match_type" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"season" integer,
	"season_week" integer,
	"boxscore_fetched_at" timestamp with time zone,
	"boxscore_error" text
);
--> statement-breakpoint
CREATE TABLE "player_match_minutes" (
	"match_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"min_pg" integer DEFAULT 0 NOT NULL,
	"min_sg" integer DEFAULT 0 NOT NULL,
	"min_sf" integer DEFAULT 0 NOT NULL,
	"min_pf" integer DEFAULT 0 NOT NULL,
	"min_c" integer DEFAULT 0 NOT NULL,
	"is_starter" boolean,
	CONSTRAINT "player_match_minutes_match_id_player_id_pk" PRIMARY KEY("match_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "training_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"name" text NOT NULL,
	"blocks" jsonb NOT NULL,
	"coach_level" integer DEFAULT 5 NOT NULL,
	"youth_trainer_level" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"plan_notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "schedule_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "schedule_synced_season" integer;--> statement-breakpoint
ALTER TABLE "player_match_minutes" ADD CONSTRAINT "player_match_minutes_match_id_matches_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_minutes" ADD CONSTRAINT "player_match_minutes_player_id_players_bb_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("bb_player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_player_id_players_bb_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("bb_player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_matches_pending" ON "matches" USING btree ("boxscore_fetched_at");--> statement-breakpoint
CREATE INDEX "idx_matches_start" ON "matches" USING btree ("start_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_matches_teams" ON "matches" USING btree ("home_team_id","away_team_id");--> statement-breakpoint
CREATE INDEX "idx_pmm_player" ON "player_match_minutes" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_training_plans_player" ON "training_plans" USING btree ("player_id");