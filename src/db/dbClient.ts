import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create postgres client
const nodeEnv = process.env.NODE_ENV as string;
const isLocalDevelopment = nodeEnv === 'localdevelopment';
const connectionString = isLocalDevelopment 
  ? process.env.DEV_DATABASE_URL as string
  : `postgres://${process.env.RDS_UIUC_POSTGRES_USERNAME}:${process.env.RDS_UIUC_POSTGRES_PASSWORD}@${process.env.RDS_UIUC_POSTGRES_ENDPOINT}/postgres`;

// Configure postgres client with SSL for non-local connections
const clientOptions = isLocalDevelopment ? {} : {
  ssl: {
    rejectUnauthorized: false // Note: For production, consider using a more secure SSL configuration
  }
};

const client = postgres(connectionString, clientOptions);

// Create drizzle ORM instance for postgresDB with proper typing
export const db = drizzle(client, { schema: schema });

// Export all tables
export * from './schema';
