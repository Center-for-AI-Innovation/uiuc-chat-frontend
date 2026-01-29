CREATE TABLE "scraping_metadata_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_name" text,
	"url" text,
	"max_urls" int,
	"scrape_strategy" text
);

CREATE TABLE "scraping_metadata_document" (
	"run_id" uuid REFERENCES scraping_metadata_run (id) ON DELETE CASCADE,
	"content" text
);