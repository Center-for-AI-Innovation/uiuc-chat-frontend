import type { Config } from 'drizzle-kit';
import 'dotenv/config';

// Match the same logic from dbClient.ts
const nodeEnv = process.env.NODE_ENV as string;
const isLocalDevelopment = nodeEnv === 'localdevelopment';
const connectionString = `postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_ENDPOINT}/${process.env.POSTGRES_DATABASE}`;

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
} satisfies Config; 
