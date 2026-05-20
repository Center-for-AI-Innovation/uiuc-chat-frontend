-- Append-only audit log for super-admin CRUD on project_external_connections.
-- Field values from configs MUST NOT be written here — only field names land
-- in `changed_fields`. The application role should not be granted UPDATE or
-- DELETE on this table.
--
-- `project_name` is nullable: the /test endpoint probes a candidate config
-- without a project context, and writes its audit row with project_name=NULL.
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
CREATE INDEX "project_connection_audit_log_project_idx"
	ON "project_connection_audit_log" ("project_name", "occurred_at" DESC);
