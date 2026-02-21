-- Enable pgvector extension (Drizzle does not create extensions automatically).
-- Required for the embeddings table and vector similarity search.
CREATE EXTENSION IF NOT EXISTS vector;
