-- Table equivalent to Qdrant collection "illinois-chat-qwen"
-- Vector size: 4096 (matching Qdrant collection). Distance: Cosine (pgvector <=> operator).
CREATE TABLE IF NOT EXISTS embeddings (
  id BIGSERIAL PRIMARY KEY,
  qdrant_id UUID UNIQUE,
  embedding VECTOR(4096) NOT NULL,
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
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS embeddings_course_name_idx ON embeddings (course_name);
CREATE INDEX IF NOT EXISTS embeddings_s3_path_idx ON embeddings (s3_path);
CREATE INDEX IF NOT EXISTS embeddings_conversation_id_idx ON embeddings (conversation_id) WHERE conversation_id IS NOT NULL AND conversation_id != '';
CREATE INDEX IF NOT EXISTS embeddings_doc_groups_idx ON embeddings USING gin (doc_groups);
CREATE INDEX IF NOT EXISTS embeddings_metadata_idx ON embeddings USING gin (metadata);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_embeddings_updated_at ON embeddings;
CREATE TRIGGER update_embeddings_updated_at BEFORE UPDATE ON embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
