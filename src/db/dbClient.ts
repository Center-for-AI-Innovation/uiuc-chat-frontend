import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Create postgres client
const connectionString = `postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_ENDPOINT}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`
const keycloakDBConnectionString = `postgres://${process.env.KEYCLOAK_DB_USERNAME}:${process.env.KEYCLOAK_DB_PASSWORD}@${process.env.KEYCLOAK_DB_ENDPOINT}:${process.env.KEYCLOAK_DB_PORT}/${process.env.KEYCLOAK_DB_DATABASE}`

// Configure postgres client with SSL for non-local connections
const clientOptions = {
  // ssl: {
  //   rejectUnauthorized: false // TODO: For production, consider using a more secure SSL configuration
  // }
}

export const client = postgres(connectionString, clientOptions)
const keycloakClient = postgres(keycloakDBConnectionString, clientOptions)

// Create drizzle ORM instance for postgresDB with proper typing
export const db = drizzle(client, { schema: schema })
export const keycloakDB = drizzle(keycloakClient, { schema: schema })

// Export all tables
export * from './schema'
