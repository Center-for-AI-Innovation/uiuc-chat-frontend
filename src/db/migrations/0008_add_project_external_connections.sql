CREATE TABLE "project_external_connections" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"project_id" bigint NOT NULL,
	"project_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"s3_config" jsonb,
	"database_config" jsonb,
	"qdrant_config" jsonb,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "project_external_connections_project_id_unique" UNIQUE("project_id"),
	CONSTRAINT "project_external_connections_project_name_unique" UNIQUE("project_name")
);
--> statement-breakpoint
ALTER TABLE "project_external_connections" ADD CONSTRAINT "project_external_connections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
