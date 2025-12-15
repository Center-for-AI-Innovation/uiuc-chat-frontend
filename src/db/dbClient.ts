import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Create postgres client
const connectionString = `postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_ENDPOINT}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`
const keycloakDBConnectionString = `postgres://${process.env.KEYCLOAK_DB_USERNAME}:${process.env.KEYCLOAK_DB_PASSWORD}@${process.env.KEYCLOAK_DB_ENDPOINT}:${process.env.KEYCLOAK_DB_PORT}/${process.env.KEYCLOAK_DB_DATABASE}`

// Only enable SSL if not connecting to localhost
const isLocal =
  process.env.POSTGRES_ENDPOINT === "localhost" ||
  process.env.POSTGRES_ENDPOINT === "127.0.0.1" ||
  process.env.POSTGRES_ENDPOINT === "postgres-illinois-chat"

/**
 * Configure connection pool settings to prevent "too many clients" errors
 * - max: Maximum number of connections in the pool (default: 10)
 * - idle_timeout: Time in seconds before an idle connection is closed (default: 30)
 * - connect_timeout: Time in seconds to wait for a connection (default: 30)
 */
const clientOptions = isLocal
  ? {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 30,
    }
  : {
      ssl: { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 30,
      connect_timeout: 30,
    }

export const client = postgres(connectionString, clientOptions)
const keycloakClient = postgres(keycloakDBConnectionString, clientOptions)

// Create drizzle ORM instance for postgresDB with proper typing
export const db = drizzle(client, { schema: schema })
export const keycloakDB = drizzle(keycloakClient, { schema: schema })

// Export all tables
export * from './schema'
