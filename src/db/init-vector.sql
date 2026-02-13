-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table equivalent to Qdrant collection "illinois-chat-qwen"
-- Vector size: 4096 (matching Qdrant collection)
-- Distance: Cosine (pgvector uses <=> operator for cosine distance)
CREATE TABLE IF NOT EXISTS embeddings (
  id BIGSERIAL PRIMARY KEY,
  -- Optional: store Qdrant point id for migration idempotency
  qdrant_id UUID UNIQUE,
  -- Vector embedding with 4096 dimensions (matching Qdrant collection)
  embedding VECTOR(4096) NOT NULL,
  -- Qdrant payload as columns (same schema/behavior)
  page_content TEXT,
  course_name TEXT,
  s3_path TEXT,
  readable_filename TEXT,
  url TEXT,
  base_url TEXT,
  doc_groups JSONB DEFAULT '[]'::jsonb,
  chunk_index INTEGER,
  pagenumber TEXT,
  "timestamp" TEXT,
  conversation_id TEXT,
  -- Extra payload fields in JSONB for compatibility
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: pgvector HNSW index supports max 2000 dimensions; our vectors are 4096.
-- Cosine search still works using the <=> operator (sequential scan).

-- Indexes for filter translation (course_name, s3_path, conversation_id)
CREATE INDEX IF NOT EXISTS embeddings_course_name_idx ON embeddings (course_name);
CREATE INDEX IF NOT EXISTS embeddings_s3_path_idx ON embeddings (s3_path);
CREATE INDEX IF NOT EXISTS embeddings_conversation_id_idx ON embeddings (conversation_id) WHERE conversation_id IS NOT NULL AND conversation_id != '';

-- GIN index for doc_groups (MatchAny: doc_groups ?| array[])
CREATE INDEX IF NOT EXISTS embeddings_doc_groups_idx ON embeddings USING gin (doc_groups);
CREATE INDEX IF NOT EXISTS embeddings_metadata_idx ON embeddings USING gin (metadata);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_embeddings_updated_at ON embeddings;
CREATE TRIGGER update_embeddings_updated_at BEFORE UPDATE ON embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
