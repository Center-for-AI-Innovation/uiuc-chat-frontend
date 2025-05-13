// Generated schema.ts based on PostgreSQL database
import { pgTable, serial, text, timestamp, uuid, varchar, integer, boolean, jsonb, bigint, date, foreignKey, primaryKey, uniqueIndex, index, doublePrecision, PgArray, bigserial } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';


// API keys table
export const apiKeys = pgTable('api_keys', {
  user_id: text('user_id').notNull(),
  key: text('key').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  modified_at: timestamp('modified_at').defaultNow().notNull(),
  usage_count: integer('usage_count').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  keycloak_id: varchar('keycloak_id', { length: 255 }),
  email: varchar('email', { length: 255 }),
});

// LLM-convo-monitor table
export const llmConvoMonitor = pgTable('llm-convo-monitor', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow(),
  convo: jsonb('convo'),
  convo_id: text('convo_id'),
  course_name: text('course_name'),
  user_email: text('user_email'),
  summary: text('summary'),
  convo_analysis_tags: jsonb('convo_analysis_tags'),
});

// uiuc-course-table table
export const uiucCourseTable = pgTable('uiuc-course-table', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  total_tokens: jsonb('total_tokens'),
  total_prompt_price: jsonb('total_prompt_price'),
  total_completions_price: jsonb('total_completions_price'),
  total_embeddings_price: jsonb('total_embeddings_price'),
  total_queries: jsonb('total_queries'),
  course_name: text('course_name'),
});

// documents_failed table
export const documentsFailed = pgTable('documents_failed', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  s3_path: text('s3_path'),
  readable_filename: text('readable_filename'),
  course_name: text('course_name'),
  url: text('url'),
  contexts: jsonb('contexts'),
  base_url: text('base_url'),
  doc_groups: text('doc_groups'),
  error: text('error'),
});

// documents_in_progress table
export const documentsInProgress = pgTable('documents_in_progress', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  s3_path: text('s3_path'),
  readable_filename: text('readable_filename'),
  course_name: text('course_name'),
  url: text('url'),
  contexts: jsonb('contexts'),
  base_url: text('base_url'),
  doc_groups: text('doc_groups'),
  error: text('error'),
  beam_task_id: text('beam_task_id'),
});

// n8n_workflows table
export const n8nWorkflows = pgTable('n8n_workflows', {
  latest_workflow_id: serial('latest_workflow_id').notNull(),
  is_locked: boolean('is_locked').notNull(),
});

// usage_metrics table
export const usageMetrics = pgTable('usage_metrics', {
  id: bigint('id', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  course_name: text('course_name'),
  total_docs: bigint('total_docs', { mode: 'number' }),
  total_convos: bigint('total_convos', { mode: 'number' }),
  most_recent_convo: timestamp('most_recent_convo', { withTimezone: false }),
  owner_name: text('owner_name'),
  admin_name: text('admin_name'),
});

// llm-guided-contexts table
export const llmGuidedContexts = pgTable('llm-guided-contexts', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  text: text('text'),
  num_tokens: text('num_tokens'),
  stop_reason: text('stop_reason'),
  doc_id: uuid('doc_id'),
  section_id: uuid('section_id'),
});

// llm-guided-sections table
export const llmGuidedSections = pgTable('llm-guided-sections', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  num_tokens: bigint('num_tokens', { mode: 'number' }),
  section_title: text('section_title'),
  section_num: text('section_num'),
  doc_id: uuid('doc_id'),
});

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  prompt: text('prompt').notNull(),
  temperature: doublePrecision('temperature').notNull(),
  user_email: varchar('user_email', { length: 255 }),
  project_name: text('project_name').default('').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  folder_id: uuid('folder_id'),
});

// Documents table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  s3_path: text('s3_path'),
  course_name: text('course_name'),
  url: text('url'),
  created_at: timestamp('created_at').defaultNow(),
  readable_filename: text('readable_filename'),
  base_url: text('base_url'),
  contexts: jsonb('contexts'),
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey(),
  conversation_id: uuid('conversation_id'),
  role: varchar('role', { length: 50 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull(),
  content_text: text('content_text').notNull(),
  contexts: jsonb('contexts'),
  tools: jsonb('tools'),
  latest_system_message: text('latest_system_message'),
  final_prompt_engineered_message: text('final_prompt_engineered_message'),
  response_time_sec: integer('response_time_sec'),
  updated_at: timestamp('updated_at', { withTimezone: true }),
  content_image_url: text('content_image_url').array(),
  image_description: text('image_description'),
  feedback_is_positive: boolean('feedback_is_positive'),
  feedback_category: text('feedback_category'),
  feedback_details: text('feedback_details'),
  was_query_rewritten: boolean('was_query_rewritten'),
  query_rewrite_text: text('query_rewrite_text'),
  processed_content: text('processed_content'),
  llm_monitor_tags: jsonb('llm-monitor-tags'),
});

// Projects table
export const projects = pgTable('projects', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  course_name: varchar('course_name'),
  doc_map_id: varchar('doc_map_id'),
  convo_map_id: varchar('convo_map_id'),
  n8n_api_key: text('n8n_api_key'),
  last_uploaded_doc_id: bigint('last_uploaded_doc_id', { mode: 'number' }),
  last_uploaded_convo_id: bigint('last_uploaded_convo_id', { mode: 'number' }),
  subscribed: bigint('subscribed', { mode: 'number' }),
  description: text('description'),
  metadata_schema: jsonb('metadata_schema'),
  conversation_map_index: text('conversation_map_index'),
  document_map_index: text('document_map_index')
});

// CourseNames table
export const courseNames = pgTable('course_names', {
  id: serial('id').primaryKey(),
  course_name: text('course_name'),
});

// DocGroups table
export const docGroups = pgTable('doc_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  course_name: text('course_name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  enabled: boolean('enabled').default(true),
  doc_count: integer('doc_count').default(0),
});

// Define the junction table for documents and doc_groups many-to-many relationship
export const documentsDocGroups = pgTable('documents_doc_groups', {
  id: serial('id').primaryKey(),
  document_id: integer('document_id').notNull(),
  doc_group_id: integer('doc_group_id').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// Doc Groups Sharing table (from schema.sql)
export const docGroupsSharing = pgTable('doc_groups_sharing', {
  id: serial('id').primaryKey(),
  doc_group_id: integer('doc_group_id').notNull(),
  shared_with_email: text('shared_with_email'),
  permission_level: text('permission_level'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Cedar Documents (from schema.sql)
export const cedarDocuments = pgTable('cedar_documents', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  document_id: text('document_id'),
  document_name: text('document_name'),
  document_source: text('document_source'),
  course_name: text('course_name'),
  status: text('status'),
  doc_groups: jsonb('doc_groups'),
  metadata: jsonb('metadata'),
});

// Cedar Document Metadata (from schema.sql)
export const cedarDocumentMetadata = pgTable('cedar_document_metadata', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  document_id: text('document_id'),
  metadata: jsonb('metadata'),
});

// Cedar Chunks (from schema.sql)
export const cedarChunks = pgTable('cedar_chunks', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  document_id: text('document_id'),
  chunk_index: integer('chunk_index'),
  chunk_text: text('chunk_text'),
  embedding_id: text('embedding_id'),
  metadata: jsonb('metadata'),
});

// Cedar Runs (from schema.sql)
export const cedarRuns = pgTable('cedar_runs', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  run_id: text('run_id'),
  course_name: text('course_name'),
  status: text('status'),
  metadata: jsonb('metadata'),
});

// Email Newsletter (from schema.sql)
export const emailNewsletter = pgTable('email-newsletter', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  email: text('email'),
  unsubscribedFromNewsletter: boolean('unsubscribed-from-newsletter'),
});

// Folders (from schema.sql)
export const folders = pgTable('folders', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  user_email: varchar('user_email', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  type: text('type'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Define enum for LLM Provider from schema.sql
export const llmProviderEnum = pgTable('LLMProvider', {
  value: text('value'),
});

// LLM-guided-docs table (from schema.sql)
export const llmGuidedDocs = pgTable('llm-guided-docs', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  doc_name: text('doc_name'),
  num_tokens: bigint('num_tokens', { mode: 'number' }),
  total_tokens: bigint('total_tokens', { mode: 'number' }),
  course_name: text('course_name'),
});

// NAL Publications (from schema.sql)
export const nalPublications = pgTable('nal_publications', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  pmid: varchar('pmid'),
  article_title: varchar('article_title'),
  journal_title: varchar('journal_title'),
  publication_date: date('publication_date'),
  filepath: text('filepath'),
});

// Publications (from schema.sql)
export const publications = pgTable('publications', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  pmid: varchar('pmid').notNull(),
  pmcid: varchar('pmcid'),
  doi: varchar('doi'),
  journal_title: varchar('journal_title'),
  article_title: varchar('article_title'),
  issn: varchar('issn'),
  published: date('published'),
  last_revised: date('last_revised'),
  license: varchar('license'),
  modified_at: timestamp('modified_at').defaultNow(),
  full_text: boolean('full_text'),
  live: boolean('live'),
  release_date: date('release_date'),
  pubmed_ftp_link: text('pubmed_ftp_link'),
  filepath: text('filepath'),
  xml_filename: text('xml_filename'),
});

// Pre-authorized API Keys (from schema.sql)
export const preAuthorizedApiKeys = pgTable('pre_authorized_api_keys', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  email: text('email'),
  role: text('role'),
  status: text('status'),
  key: text('key'),
  expiration_date: timestamp('expiration_date'),
  max_daily_queries: integer('max_daily_queries'),
  daily_queries_count: integer('daily_queries_count').default(0),
  last_query_date: timestamp('last_query_date'),
  course_name: text('course_name'),
  keycloak_id: text('keycloak_id'),
});

// Project Stats (from schema.sql)
export const projectStats = pgTable('project_stats', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull(),
  total_messages: integer('total_messages').default(0),
  total_conversations: integer('total_conversations').default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// PubMed Daily Update (from schema.sql)
export const pubmedDailyUpdate = pgTable('pubmed_daily_update', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  pmid: varchar('pmid').notNull(),
  pmcid: varchar('pmcid'),
  doi: varchar('doi'),
  journal_title: varchar('journal_title'),
  article_title: varchar('article_title'),
  issn: varchar('issn'),
  published: date('published'),
  last_revised: date('last_revised'),
  license: varchar('license'),
  modified_at: timestamp('modified_at').defaultNow(),
  full_text: boolean('full_text'),
  live: boolean('live'),
  release_date: date('release_date'),
  pubmed_ftp_link: text('pubmed_ftp_link'),
  filepath: text('filepath'),
  xml_filename: text('xml_filename'),
});

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


// Table relationships
export const llmGuidedSectionsRelations = relations(llmGuidedSections, ({ many }) => ({
  contexts: many(llmGuidedContexts, { relationName: 'section_contexts' }),
}));

export const llmGuidedContextsRelations = relations(llmGuidedContexts, ({ one }) => ({
  section: one(llmGuidedSections, {
    fields: [llmGuidedContexts.section_id],
    references: [llmGuidedSections.id],
    relationName: 'section_contexts',
  }),
}));

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  messages: many(messages),
  folder: one(folders, {
    fields: [conversations.folder_id],
    references: [folders.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  apiKeys: many(apiKeys),
  conversations: many(conversations),
  stats: one(projectStats, {
    fields: [projects.id],
    references: [projectStats.project_id],
  }),
}));

export const docGroupsRelations = relations(docGroups, ({ many }) => ({
  documentsJunction: many(documentsDocGroups),
  sharing: many(docGroupsSharing),
}));

export const documentsRelations = relations(documents, ({ many }) => ({
  docGroupsJunction: many(documentsDocGroups),
}));

export const documentsDocGroupsRelations = relations(documentsDocGroups, ({ one }) => ({
  document: one(documents, {
    fields: [documentsDocGroups.document_id],
    references: [documents.id],
  }),
  docGroup: one(docGroups, {
    fields: [documentsDocGroups.doc_group_id],
    references: [docGroups.id],
  }),
}));

export const foldersRelations = relations(folders, ({ many }) => ({
  conversations: many(conversations),
}));

// Export types
export type ApiKeys = typeof apiKeys.$inferSelect;
export type NewApiKeys = typeof apiKeys.$inferInsert;

export type LlmConvoMonitor = typeof llmConvoMonitor.$inferSelect;
export type NewLlmConvoMonitor = typeof llmConvoMonitor.$inferInsert;

export type LlmGuidedContexts = typeof llmGuidedContexts.$inferSelect;
export type NewLlmGuidedContexts = typeof llmGuidedContexts.$inferInsert;

export type LlmGuidedSections = typeof llmGuidedSections.$inferSelect;
export type NewLlmGuidedSections = typeof llmGuidedSections.$inferInsert;

export type Conversations = typeof conversations.$inferSelect;
export type NewConversations = typeof conversations.$inferInsert;

export type Messages = typeof messages.$inferSelect;
export type NewMessages = typeof messages.$inferInsert;

export type Projects = typeof projects.$inferSelect;
export type NewProjects = typeof projects.$inferInsert;

export type CourseNames = typeof courseNames.$inferSelect;
export type NewCourseNames = typeof courseNames.$inferInsert;

export type DocGroups = typeof docGroups.$inferSelect;
export type NewDocGroups = typeof docGroups.$inferInsert;

export type Documents = typeof documents.$inferSelect;
export type NewDocuments = typeof documents.$inferInsert;

export type DocumentsDocGroups = typeof documentsDocGroups.$inferSelect;
export type NewDocumentsDocGroups = typeof documentsDocGroups.$inferInsert;

export type DocGroupsSharing = typeof docGroupsSharing.$inferSelect;
export type NewDocGroupsSharing = typeof docGroupsSharing.$inferInsert;

export type CedarDocuments = typeof cedarDocuments.$inferSelect;
export type NewCedarDocuments = typeof cedarDocuments.$inferInsert;

export type CedarDocumentMetadata = typeof cedarDocumentMetadata.$inferSelect;
export type NewCedarDocumentMetadata = typeof cedarDocumentMetadata.$inferInsert;

export type CedarChunks = typeof cedarChunks.$inferSelect;
export type NewCedarChunks = typeof cedarChunks.$inferInsert;

export type CedarRuns = typeof cedarRuns.$inferSelect;
export type NewCedarRuns = typeof cedarRuns.$inferInsert;

export type EmailNewsletter = typeof emailNewsletter.$inferSelect;
export type NewEmailNewsletter = typeof emailNewsletter.$inferInsert;

export type Folders = typeof folders.$inferSelect;
export type NewFolders = typeof folders.$inferInsert;

export type LlmProviderEnum = typeof llmProviderEnum.$inferSelect;

export type LlmGuidedDocs = typeof llmGuidedDocs.$inferSelect;
export type NewLlmGuidedDocs = typeof llmGuidedDocs.$inferInsert;

export type NalPublications = typeof nalPublications.$inferSelect;
export type NewNalPublications = typeof nalPublications.$inferInsert;

export type Publications = typeof publications.$inferSelect;
export type NewPublications = typeof publications.$inferInsert;

export type PreAuthorizedApiKeys = typeof preAuthorizedApiKeys.$inferSelect;
export type NewPreAuthorizedApiKeys = typeof preAuthorizedApiKeys.$inferInsert;

export type ProjectStats = typeof projectStats.$inferSelect;
export type NewProjectStats = typeof projectStats.$inferInsert;

export type PubmedDailyUpdate = typeof pubmedDailyUpdate.$inferSelect;
export type NewPubmedDailyUpdate = typeof pubmedDailyUpdate.$inferInsert;

// export types for keycloak users
export type KeycloakUsers = typeof keycloakUsers.$inferSelect;
export type NewKeycloakUsers = typeof keycloakUsers.$inferInsert;