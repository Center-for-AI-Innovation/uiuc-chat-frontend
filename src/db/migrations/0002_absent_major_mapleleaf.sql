CREATE TABLE "user_entity" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"email_constraint" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"federation_link" text,
	"first_name" text,
	"last_name" text,
	"realm_id" text,
	"username" text,
	"created_timestamp" bigint,
	"service_account_client_link" text,
	"not_before" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "user_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "project_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "project_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "email-newsletter" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "email-newsletter" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "email-newsletter" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email-newsletter" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "email-newsletter" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "user_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "user_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "conversation_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "role" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "model" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "prompt" text NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "temperature" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "base_url" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "contexts" jsonb;--> statement-breakpoint
ALTER TABLE "email-newsletter" ADD COLUMN "unsubscribed-from-newsletter" boolean;--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "content_text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "contexts" jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tools" jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "latest_system_message" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "final_prompt_engineered_message" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "response_time_sec" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "content_image_url" text[];--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "image_description" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "feedback_is_positive" boolean;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "feedback_category" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "feedback_details" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "was_query_rewritten" boolean;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "query_rewrite_text" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "processed_content" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "llm-monitor-tags" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "course_name" varchar;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "doc_map_id" varchar;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "convo_map_id" varchar;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "n8n_api_key" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "last_uploaded_doc_id" bigint;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "last_uploaded_convo_id" bigint;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "subscribed" bigint;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "metadata_schema" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "conversation_map_index" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "document_map_index" text;--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "uuid";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "failed_reason";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "message";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "is_edited";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "message_tokens";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "cached_suggestions";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "model";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "total_tokens";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "uuid";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "owner_id";