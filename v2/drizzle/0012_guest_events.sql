CREATE TABLE "guest_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" text NOT NULL,
	"event" text NOT NULL,
	"path" text
);
--> statement-breakpoint
CREATE INDEX "idx_guest_events_occurred" ON "guest_events" USING btree ("occurred_at" DESC NULLS LAST);