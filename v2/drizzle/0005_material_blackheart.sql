CREATE TABLE "review_marks" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"marked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_review_marks_scope" ON "review_marks" USING btree ("scope");