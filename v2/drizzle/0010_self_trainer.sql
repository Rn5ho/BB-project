CREATE TABLE "model_scorecards" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"model_id" text NOT NULL,
	"pop_hits" integer NOT NULL,
	"pop_misses" integer NOT NULL,
	"false_alarms" integer NOT NULL,
	"end_abs_err" integer NOT NULL,
	"end_count" integer NOT NULL,
	"end_exact" integer NOT NULL,
	"player_count" integer NOT NULL,
	"week_count" integer NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "self_trainer_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"switch_team" boolean DEFAULT false NOT NULL,
	"coach_level" integer DEFAULT 5 NOT NULL,
	"youth_trainer_level" integer DEFAULT 0 NOT NULL,
	"gym_level" integer DEFAULT 0 NOT NULL,
	"training_court_level" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_model_scorecards_model" ON "model_scorecards" USING btree ("model_id","run_at" DESC NULLS LAST);