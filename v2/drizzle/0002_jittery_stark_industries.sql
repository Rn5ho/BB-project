CREATE TABLE "archetypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text,
	"name" text NOT NULL,
	"description" text,
	"rules" jsonb NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_archetypes_key" ON "archetypes" USING btree ("key");