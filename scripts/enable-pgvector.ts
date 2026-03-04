/**
 * Enable the pgvector extension in the Postgres database.
 * Run once before first `npm run db:push` (or when using a new DB that doesn't have pgvector yet).
 * Uses same env vars as drizzle.config.ts: POSTGRES_*.
 */
import 'dotenv/config'
import postgres from 'postgres'

const connectionString = `postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_ENDPOINT}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`

async function main() {
  const sql = postgres(connectionString)
  try {
    await sql.unsafe('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('pgvector extension enabled (or already present).')
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
