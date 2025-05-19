import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const keycloakUsers = pgTable('user_entity', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
});
