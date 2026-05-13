-- Registry of all known chatbot tag values. Populated on chatbot save via
-- `upsertCourseMetadata`. Powers autocomplete suggestions in the tag editor
-- (see /api/UIUC-api/searchTags). The course_metadata.tags jsonb column
-- remains the source of truth for which tags are *attached* to each chatbot;
-- this table just deduplicates known values across the system.

CREATE TABLE IF NOT EXISTS "chatbot_tags" (
	"id" bigserial PRIMARY KEY,
	"category" text NOT NULL,
	"value" text NOT NULL,
	"value_lower" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chatbot_tags_category_value_lower_unique" UNIQUE ("category", "value_lower")
);
--> statement-breakpoint

-- Prefix search on lowercased value within a category.
CREATE INDEX IF NOT EXISTS "chatbot_tags_category_value_lower_idx"
	ON "chatbot_tags" ("category", "value_lower" text_pattern_ops);
