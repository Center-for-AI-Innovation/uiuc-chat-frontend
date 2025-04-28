import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create postgres client
const connectionString = process.env.NODE_ENV === 'development' 
  ? process.env.DEV_DATABASE_URL as string
  : process.env.DATABASE_URL as string;

const client = postgres(connectionString, { 
  prepare: false  // Disable prepare for Supabase connection pooling when in "Transaction" pool mode
});

// Create drizzle ORM instance
export const db = drizzle(client, { schema });

// Export all tables
export * from './schema';
