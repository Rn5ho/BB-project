CREATE TABLE "teams" (
	"team_id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"owner_alias" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
