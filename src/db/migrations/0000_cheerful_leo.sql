---
--- Postgres schema : this is created by drizzle-orm generate function.
--- The tables and columns are created from schema.ts file mentioned in drizzle.config.ts
---

CREATE TABLE "api_keys" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"keycloak_id" varchar(255),
	"email" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "cedar_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"document_id" text,
	"chunk_index" integer,
	"chunk_text" text,
	"embedding_id" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "cedar_document_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"document_id" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "cedar_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"document_id" text,
	"document_name" text,
	"document_source" text,
	"course_name" text,
	"status" text,
	"doc_groups" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "cedar_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"run_id" text,
	"course_name" text,
	"status" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_email" text,
	"project_name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_name" text
);
--> statement-breakpoint
CREATE TABLE "doc_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"course_name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"enabled" boolean DEFAULT true,
	"doc_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "doc_groups_sharing" (
	"id" serial PRIMARY KEY NOT NULL,
	"doc_group_id" integer NOT NULL,
	"shared_with_email" text,
	"permission_level" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"s3_path" text,
	"course_name" text,
	"url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"status" varchar(255),
	"readable_filename" text,
	"failed_reason" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "documents_doc_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"doc_group_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents_failed" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"s3_path" text,
	"readable_filename" text,
	"course_name" text,
	"url" text,
	"contexts" jsonb,
	"base_url" text,
	"doc_groups" text,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "documents_in_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"s3_path" text,
	"readable_filename" text,
	"course_name" text,
	"url" text,
	"contexts" jsonb,
	"base_url" text,
	"doc_groups" text,
	"error" text,
	"beam_task_id" text
);
--> statement-breakpoint
CREATE TABLE "email-newsletter" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"email" text
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"user_email" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "llm-convo-monitor" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"convo" jsonb,
	"convo_id" text,
	"course_name" text,
	"user_email" text,
	"summary" text,
	"convo_analysis_tags" jsonb
);
--> statement-breakpoint
CREATE TABLE "llm-guided-contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text,
	"num_tokens" text,
	"stop_reason" text,
	"doc_id" uuid,
	"section_id" uuid
);
--> statement-breakpoint
CREATE TABLE "llm-guided-docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"doc_name" text,
	"num_tokens" bigint,
	"total_tokens" bigint,
	"course_name" text
);
--> statement-breakpoint
CREATE TABLE "llm-guided-sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"num_tokens" bigint,
	"section_title" text,
	"section_num" text,
	"doc_id" uuid
);
--> statement-breakpoint
CREATE TABLE "LLMProvider" (
	"value" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"message" text,
	"role" text,
	"created_at" timestamp DEFAULT now(),
	"is_edited" boolean DEFAULT false,
	"message_tokens" integer,
	"cached_suggestions" jsonb,
	"model" varchar(255),
	"total_tokens" integer
);
--> statement-breakpoint
CREATE TABLE "n8n_workflows" (
	"latest_workflow_id" serial NOT NULL,
	"is_locked" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nal_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"pmid" varchar,
	"article_title" varchar,
	"journal_title" varchar,
	"publication_date" date,
	"filepath" text
);
--> statement-breakpoint
CREATE TABLE "pre_authorized_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text,
	"role" text,
	"status" text,
	"key" text,
	"expiration_date" timestamp,
	"max_daily_queries" integer,
	"daily_queries_count" integer DEFAULT 0,
	"last_query_date" timestamp,
	"course_name" text,
	"keycloak_id" text
);
--> statement-breakpoint
CREATE TABLE "project_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"total_messages" integer DEFAULT 0,
	"total_conversations" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted" boolean DEFAULT false,
	"owner_id" text
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"pmid" varchar NOT NULL,
	"pmcid" varchar,
	"doi" varchar,
	"journal_title" varchar,
	"article_title" varchar,
	"issn" varchar,
	"published" date,
	"last_revised" date,
	"license" varchar,
	"modified_at" timestamp DEFAULT now(),
	"full_text" boolean,
	"live" boolean,
	"release_date" date,
	"pubmed_ftp_link" text,
	"filepath" text,
	"xml_filename" text
);
--> statement-breakpoint
CREATE TABLE "pubmed_daily_update" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"pmid" varchar NOT NULL,
	"pmcid" varchar,
	"doi" varchar,
	"journal_title" varchar,
	"article_title" varchar,
	"issn" varchar,
	"published" date,
	"last_revised" date,
	"license" varchar,
	"modified_at" timestamp DEFAULT now(),
	"full_text" boolean,
	"live" boolean,
	"release_date" date,
	"pubmed_ftp_link" text,
	"filepath" text,
	"xml_filename" text
);
--> statement-breakpoint
CREATE TABLE "uiuc-course-table" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"total_tokens" jsonb,
	"total_prompt_price" jsonb,
	"total_completions_price" jsonb,
	"total_embeddings_price" jsonb,
	"total_queries" jsonb,
	"course_name" text
);
--> statement-breakpoint
CREATE TABLE "usage_metrics" (
	"id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"course_name" text,
	"total_docs" bigint,
	"total_convos" bigint,
	"most_recent_convo" timestamp,
	"owner_name" text,
	"admin_name" text
);
