// This file will be populated by drizzle-kit introspect
import { pgTable, serial, text, timestamp, uuid, varchar, integer, boolean, jsonb, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

// publications table
// export const publications = pgTable('publications', {
//   id: serial('id').primaryKey(),
//   created_at: timestamp('created_at').defaultNow().notNull(),
//   pmid: varchar('pmid').notNull(),
//   pmcid: varchar('pmcid'),
//   doi: varchar('doi'),
//   journal_title: varchar('journal_title'),
//   article_title: varchar('article_title'),
//   issn: varchar('issn'),
//   published: Date,
//   last_revised: Date,
//   license: varchar('license'),
//   modified_at: timestamp('modified_at').defaultNow(),
//   full_text: boolean('full_text'),
//   live: boolean('live'),
//   release_date: Date,
//   pubmed_ftp_link: text('pubmed_ftp_link'),
//   filepath: text('filepath'),
//   xml_filename: text('xml_filename'),
// });

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

// Define relationships for llm-guided-sections
export const llmGuidedSectionsRelations = relations(llmGuidedSections, ({ many }) => ({
  contexts: many(llmGuidedContexts, { relationName: 'section_contexts' }),
}));

// Define relationships for llm-guided-contexts
export const llmGuidedContextsRelations = relations(llmGuidedContexts, ({ one }) => ({
  section: one(llmGuidedSections, {
    fields: [llmGuidedContexts.section_id],
    references: [llmGuidedSections.id],
    relationName: 'section_contexts',
  }),
}));


////////////////////////////////////////////////////////////


// Conversations table
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull(),
  user_email: text('user_email'),
  project_name: text('project_name'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Define relationships for conversations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

// Documents table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  s3_path: text('s3_path'),
  course_name: text('course_name'),
  url: text('url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  status: varchar('status', { length: 255 }),
  readable_filename: text('readable_filename'),
  failed_reason: text('failed_reason'),
  metadata: jsonb('metadata'),
});

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversation_id: integer('conversation_id'),
  message: text('message'),
  role: text('role'),
  created_at: timestamp('created_at').defaultNow(),
  is_edited: boolean('is_edited').default(false),
  message_tokens: integer('message_tokens'),
  cached_suggestions: jsonb('cached_suggestions'),
  model: varchar('model', { length: 255 }),
  total_tokens: integer('total_tokens'),
});

// Define relationships for messages
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
}));

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  deleted: boolean('deleted').default(false),
  owner_id: text('owner_id'),
});

// Define relationships for projects
export const projectsRelations = relations(projects, ({ many }) => ({
  apiKeys: many(apiKeys),
  conversations: many(conversations),
}));

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

// Define relationships for docGroups
export const docGroupsRelations = relations(docGroups, ({ many }) => ({
  documentsJunction: many(documentsDocGroups),
}));

// Define relationships for documents
export const documentsRelations = relations(documents, ({ many }) => ({
  docGroupsJunction: many(documentsDocGroups),
}));

// Define relationships for the junction table
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