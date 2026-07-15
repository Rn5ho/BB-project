CREATE TABLE "skill_pops" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"skill" text NOT NULL,
	"to_displayed" integer NOT NULL,
	"delta" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"window_weeks" integer NOT NULL,
	"source" text DEFAULT 'snapshots' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"inferred_training_id" integer,
	"confidence" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_pops" ADD CONSTRAINT "skill_pops_player_id_players_bb_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("bb_player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_skill_pops_player" ON "skill_pops" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_skill_pops" ON "skill_pops" USING btree ("player_id","skill","window_end","source");--> statement-breakpoint
CREATE INDEX "idx_training_obs_team" ON "training_observations" USING btree ("team_id","window_end" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_training_obs" ON "training_observations" USING btree ("team_id","window_start","window_end");