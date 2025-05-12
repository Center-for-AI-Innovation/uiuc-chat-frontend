import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as keycloakSchema from './keycloakSchema';

// Create postgres client
const connectionString = process.env.NODE_ENV === 'development' 
  ? process.env.DEV_DATABASE_URL as string
  : process.env.DATABASE_URL as string;

const client = postgres(connectionString);

// Create drizzle ORM instance for postgresDB
export const db = drizzle(client, { schema });

// Create keycloak client
const keycloakConnectionString = process.env.KEYCLOAK_DATABASE_URL as string;
const keycloakClient = postgres(keycloakConnectionString);

// Create drizzle ORM instance for keycloakDB
export const keycloakDB = drizzle(keycloakClient, { schema: keycloakSchema });


// Export all tables
export * from './schema';
export * from './keycloakSchema';