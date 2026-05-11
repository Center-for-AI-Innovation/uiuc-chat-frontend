-- Mirror of Redis `course_metadatas` hash for server-side chatbot search.
-- Redis remains the source of truth; this table is a search-optimized projection.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS "course_metadata" (
	"course_name" text PRIMARY KEY NOT NULL,
	"course_owner" text NOT NULL,
	"course_admins" text[] DEFAULT '{}'::text[] NOT NULL,
	"approved_emails_list" text[] DEFAULT '{}'::text[] NOT NULL,
	"project_description" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"allow_logged_in_users" boolean DEFAULT false NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"raw_metadata" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_metadata_owner_idx" ON "course_metadata" ("course_owner");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_metadata_admins_gin" ON "course_metadata" USING GIN ("course_admins");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_metadata_approved_gin" ON "course_metadata" USING GIN ("approved_emails_list");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_metadata_tags_gin" ON "course_metadata" USING GIN ("tags" jsonb_path_ops);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_metadata_name_trgm" ON "course_metadata" USING GIN ("course_name" gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_metadata_desc_trgm" ON "course_metadata" USING GIN ("project_description" gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_metadata_not_frozen_idx" ON "course_metadata" ("is_frozen") WHERE "is_frozen" = false;
