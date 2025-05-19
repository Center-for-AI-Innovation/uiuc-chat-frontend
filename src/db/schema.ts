import { pgTable, text, integer, boolean, bigint } from 'drizzle-orm/pg-core';

// Keycloak user_entity table schema
export const keycloakUsers = pgTable('user_entity', {
  id: text('id').primaryKey(),
  email: text('email'),
  email_constraint: text('email_constraint'),
  email_verified: boolean('email_verified').notNull().default(false),
  enabled: boolean('enabled').notNull().default(false),
  federation_link: text('federation_link'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  realm_id: text('realm_id'),
  username: text('username'),
  created_timestamp: bigint('created_timestamp', { mode: 'number' }),
  service_account_client_link: text('service_account_client_link'),
  not_before: integer('not_before').notNull().default(0)
});
