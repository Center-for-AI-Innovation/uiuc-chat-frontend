/**
 * Enable the pgvector extension and HNSW cosine index on embeddings.
 * Run once before first `npm run db:push` for the extension; re-run after embeddings
 * table exists to create the index. Uses same env vars as drizzle.config.ts: POSTGRES_*.
 */
import 'dotenv/config'
import postgres from 'postgres'

const connectionString = `postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_ENDPOINT}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`

const HNSW_INDEX_NAME = 'idx_embeddings_hnsw_cosine'
const EMBEDDING_SEARCH_DIM = 1536

/** Expression must match docSearchVector in src/db/vectorSearch.ts */
const CREATE_HNSW_INDEX_SQL = `
CREATE INDEX CONCURRENTLY IF NOT EXISTS ${HNSW_INDEX_NAME}
ON public.embeddings
USING hnsw (subvector(embedding, 1, ${EMBEDDING_SEARCH_DIM}) vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
`

async function main() {
  const sql = postgres(connectionString)
  try {
    await sql.unsafe('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('pgvector extension enabled (or already present).')

    try {
      await sql.unsafe(CREATE_HNSW_INDEX_SQL)
      console.log(
        `HNSW cosine index "${HNSW_INDEX_NAME}" enabled (or already present).`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(
        `Could not create HNSW index "${HNSW_INDEX_NAME}"; skipping. ${message}`,
      )
    }
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
