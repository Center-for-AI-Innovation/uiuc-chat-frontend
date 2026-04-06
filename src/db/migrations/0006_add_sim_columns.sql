-- Add Sim AI workflow configuration columns to projects table.
-- All columns are nullable; feature is opt-in per project.

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sim_api_key" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sim_base_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sim_workspace_id" text;
