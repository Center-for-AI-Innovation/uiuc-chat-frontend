import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/** Max connections per pool. Keep low to avoid "too many clients" on Postgres. */
const POOL_MAX = Number(process.env.POSTGRES_POOL_MAX) || 10

function createPostgresClient(
  username?: string,
  password?: string,
  endpoint?: string,
  port?: string,
  database?: string,
) {
  if (!username || !password || !endpoint || !port || !database) {
    return postgres('postgres://postgres:postgres@localhost:5432/postgres', {
      max: 2,
      idle_timeout: 20,
    })
  }

  const connectionString = `postgres://${username}:${password}@${endpoint}:${port}/${database}`
  const isLocal = endpoint === 'localhost' || endpoint === '127.0.0.1'
  return postgres(connectionString, {
    max: POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  })
}

export const client = createPostgresClient(
  process.env.POSTGRES_USERNAME,
  process.env.POSTGRES_PASSWORD,
  process.env.POSTGRES_ENDPOINT,
  process.env.POSTGRES_PORT,
  process.env.POSTGRES_DATABASE,
)

const keycloakClient = createPostgresClient(
  process.env.KEYCLOAK_DB_USERNAME,
  process.env.KEYCLOAK_DB_PASSWORD,
  process.env.KEYCLOAK_DB_ENDPOINT,
  process.env.KEYCLOAK_DB_PORT,
  process.env.KEYCLOAK_DB_DATABASE,
)

export const db = drizzle(client, { schema: schema })
export const keycloakDB = drizzle(keycloakClient, { schema: schema })

export * from './schema'
