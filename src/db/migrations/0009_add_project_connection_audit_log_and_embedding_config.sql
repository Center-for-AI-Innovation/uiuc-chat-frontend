CREATE TABLE "project_connection_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"project_name" text,
	"kind" text,
	"outcome" text NOT NULL,
	"failure_reason" text,
	"changed_fields" text[],
	"source_ip" text,
	"user_agent" text,
	"request_id" text
);
--> statement-breakpoint
ALTER TABLE "project_external_connections" ADD COLUMN "embedding_config" jsonb;--> statement-breakpoint
CREATE INDEX "project_connection_audit_log_project_idx" ON "project_connection_audit_log" USING btree ("project_name","occurred_at" DESC);