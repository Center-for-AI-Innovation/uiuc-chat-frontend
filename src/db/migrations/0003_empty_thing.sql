CREATE TABLE "file_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"base_url" text,
	"contexts" jsonb,
	"course_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"readable_filename" text,
	"s3_path" text,
	"url" text
);
--> statement-breakpoint
ALTER TABLE "doc_groups" ADD COLUMN "private" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" ADD COLUMN "providerBodyNoModels" jsonb;--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" ADD COLUMN "emails" jsonb;--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" ADD COLUMN "providerName" text;--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "project_stats" ADD COLUMN "project_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "project_stats" ADD COLUMN "unique_users" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "project_stats" ADD COLUMN "model_usage_counts" jsonb;--> statement-breakpoint
ALTER TABLE "doc_groups" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "doc_groups" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "key";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "expiration_date";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "max_daily_queries";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "daily_queries_count";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "last_query_date";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "course_name";--> statement-breakpoint
ALTER TABLE "pre_authorized_api_keys" DROP COLUMN "keycloak_id";--> statement-breakpoint
ALTER TABLE "llm-convo-monitor" ADD CONSTRAINT "llm-convo-monitor_convo_id_unique" UNIQUE("convo_id");