DROP INDEX IF EXISTS "documents_doc_groups_document_group_id_unique";--> statement-breakpoint
ALTER TABLE "documents_doc_groups" DROP CONSTRAINT IF EXISTS "documents_doc_groups_pkey";--> statement-breakpoint
ALTER TABLE "documents_doc_groups" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "doc_groups" ALTER COLUMN "doc_count" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "documents_doc_groups" ALTER COLUMN "document_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "documents_doc_groups" ALTER COLUMN "doc_group_id" SET DATA TYPE bigint;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "documents_doc_groups_pkey" ON "documents_doc_groups" USING btree ("document_id","doc_group_id");