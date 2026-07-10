CREATE TABLE "census_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"status" text NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "census_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"totals" jsonb
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nt_squad" (
	"player_id" integer NOT NULL,
	"season" integer NOT NULL,
	"role" text,
	"note" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nt_squad_player_id_season_pk" PRIMARY KEY("player_id","season")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"bb_player_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"country_id" integer,
	"nationality" text,
	"height_cm" integer,
	"best_position" text,
	"is_utopian" boolean DEFAULT false NOT NULL,
	"season_drafted" integer,
	"draft_pick" integer,
	"owner_team_id" integer,
	"owner_team_name" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" integer PRIMARY KEY NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"finish" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"season" integer,
	"age" integer,
	"dmi" bigint,
	"game_shape" integer,
	"salary" integer,
	"potential" integer,
	"experience" integer,
	"jump_shot" integer,
	"jump_range" integer,
	"outside_def" integer,
	"handling" integer,
	"driving" integer,
	"passing" integer,
	"inside_shot" integer,
	"inside_def" integer,
	"rebounding" integer,
	"shot_blocking" integer,
	"stamina" integer,
	"free_throw" integer,
	"tsp" integer,
	"owner_team_id" integer,
	"owner_team_name" text,
	"starting_price" bigint,
	"auction_ends_at" timestamp with time zone,
	"is_rookie_listing" boolean
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_type" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"ok" boolean,
	"counts" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer,
	"name" text NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"purpose" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "census_items" ADD CONSTRAINT "census_items_run_id_census_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."census_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_player_id_players_bb_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("bb_player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nt_squad" ADD CONSTRAINT "nt_squad_player_id_players_bb_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("bb_player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_player_id_players_bb_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("bb_player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_player_id_players_bb_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("bb_player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_census_items_run" ON "census_items" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_notes_player" ON "notes" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_players_country" ON "players" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "idx_players_nationality" ON "players" USING btree ("nationality");--> statement-breakpoint
CREATE INDEX "idx_snapshots_player_date" ON "snapshots" USING btree ("player_id","captured_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_snapshots_captured_at" ON "snapshots" USING btree ("captured_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tags_player_tag" ON "tags" USING btree ("player_id","tag");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tracked_countries_name" ON "tracked_countries" USING btree ("name");