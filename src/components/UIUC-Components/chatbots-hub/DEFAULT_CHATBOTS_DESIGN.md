# Default Chatbot List — Design Notes

## Problem

The chatbot hub page needs a curated default list of chatbots to show when no search/filter is active (the "Course Assistants", "Department Resources", "Public Bots" sections). Currently `useFetchAccessibleChatbots` fetches all public bots, which may be too many and — without `project_type` from #598 — they all land in a single section.

## Options

### 1. Popular bots (recommended)

Use `project_stats` table (`total_messages`, `total_conversations`, `unique_users`) to surface the top N most-used public bots. Data-driven, self-maintaining, no manual curation needed.

**Implementation:** New API route that joins `project_stats` with Redis metadata, returns top ~20 public bots sorted by `unique_users`.

### 2. Admin-curated featured list

A Redis key (e.g. `featured_chatbots`) or env var listing featured bot names. Full editorial control but requires manual maintenance.

### 3. Recency-based

Show recently active or recently created public bots using `project_stats.updated_at` or `projects.created_at`.

### 4. Python backend recommendation endpoint

A backend endpoint returning "bots this user might find useful" based on department, enrolled courses, etc.

## Dependencies

- #598 — `project_type` and `organization` columns needed for proper section grouping (Course Assistants vs Department Resources vs Public Bots).

## Decision

TBD — revisit after #598 lands.
