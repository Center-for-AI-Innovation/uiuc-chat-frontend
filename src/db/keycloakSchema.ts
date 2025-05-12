// Need to add schema from keycloakDB
import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';   

// temporary table for users from keycloakDB
export const keycloakUsers = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  realm_id: text('realm_id').notNull(),
  username: text('username').notNull(),
  enabled: boolean('enabled').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// export types for users
export type KeycloakUsers = typeof keycloakUsers.$inferSelect;
export type NewKeycloakUsers = typeof keycloakUsers.$inferInsert;

