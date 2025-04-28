import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL as string : process.env.DEV_DATABASE_URL as string,
  },
} satisfies Config; 
