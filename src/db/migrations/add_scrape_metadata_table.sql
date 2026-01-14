CREATE TABLE "scraping_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_name" text,
	"url" text,
	"max_urls" int,
	"scrape_strategy" text
);