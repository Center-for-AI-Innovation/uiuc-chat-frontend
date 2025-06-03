import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const host = process.env.KEYCLOAK_RDS_ENDPOINT;
const username = process.env.KEYCLOAK_RDS_USERNAME;
const password = process.env.KEYCLOAK_RDS_PASSWORD;
const database = 'keycloak';
const ssl = true;

// Build connection string
const keycloakDBConnectionString = `postgres://${username}:${password}@${host}:5432/${database}${ssl ? '?ssl=require' : ''}`;

const client = postgres(keycloakDBConnectionString);

export const db = drizzle(client, { schema });

export * from './schema';
