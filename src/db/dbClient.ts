import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';


// Create postgres client
const connectionString = process.env.NODE_ENV === 'development' 
  ? process.env.DEV_DATABASE_URL as string
  : process.env.DATABASE_URL as string;

const client = postgres(connectionString);

// Create drizzle ORM instance for postgresDB with proper typing
export const db = drizzle(client, { schema: schema });

// Export all tables
export * from './schema';
