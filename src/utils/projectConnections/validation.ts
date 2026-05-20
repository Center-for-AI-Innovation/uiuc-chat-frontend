// Zod validators for the project-connections API surface.
//
// Required fields mirror the backend's `_validate_connection_config` so
// records written by the frontend remain compatible with the backend's
// read-only resolver (`ai_ta_backend/database/connection_manager.py`).

import { z } from 'zod'
import type {
  S3OverrideConfig,
  DatabaseOverrideConfig,
  QdrantOverrideConfig,
} from '~/utils/connectionManager'

export const CONNECTION_KINDS = ['s3', 'database', 'qdrant'] as const
export type ConnectionKind = (typeof CONNECTION_KINDS)[number]

export const s3ConfigSchema = z.object({
  aws_access_key_id: z.string().min(1),
  aws_secret_access_key: z.string().min(1),
  bucket_name: z.string().min(1).optional(),
  endpoint_url: z.string().url().optional(),
  region: z.string().min(1).optional(),
}) satisfies z.ZodType<S3OverrideConfig>

export const databaseConfigSchema = z.object({
  connection_uri: z.string().min(1),
}) satisfies z.ZodType<DatabaseOverrideConfig>

// Entry in `qdrant_config.collections` for read-side multi-collection fan-out.
// Backend consumer: ai_ta_backend/database/vector.py `_multi_collection_search`.
export const qdrantCollectionEntrySchema = z.object({
  name: z.string().min(1),
  top_n: z.number().int().positive().optional(),
  use_filter: z.boolean().optional(),
  processor: z.string().min(1).optional(),
})
export type QdrantCollectionEntry = z.infer<typeof qdrantCollectionEntrySchema>

export const qdrantConfigSchema = z.object({
  url: z.string().url(),
  api_key: z.string().min(1),
  port: z.coerce.number().int().positive(),
  https: z.boolean().optional(),
  default_collection: z.string().min(1),
  // Optional read-side fan-out. Each entry is a dict, not a bare string —
  // the backend consumes `name`, `top_n`, `use_filter`, `processor`.
  collections: z.array(qdrantCollectionEntrySchema).optional(),
  // Top-level parallelism knob also read by the backend's vector module.
  parallel: z.boolean().optional(),
}) satisfies z.ZodType<
  QdrantOverrideConfig & {
    collections?: QdrantCollectionEntry[]
    parallel?: boolean
  }
>

// project_id is looked up server-side from the projects table — the caller
// only needs to supply project_name.
const upsertBaseSchema = z.object({
  project_name: z.string().min(1),
})

export const upsertBodySchema = z.discriminatedUnion('kind', [
  upsertBaseSchema.extend({
    kind: z.literal('s3'),
    config: s3ConfigSchema,
  }),
  upsertBaseSchema.extend({
    kind: z.literal('database'),
    config: databaseConfigSchema,
  }),
  upsertBaseSchema.extend({
    kind: z.literal('qdrant'),
    config: qdrantConfigSchema,
  }),
])
export type UpsertBody = z.infer<typeof upsertBodySchema>

export const setActiveBodySchema = z.object({
  project_name: z.string().min(1),
  is_active: z.boolean(),
})
export type SetActiveBody = z.infer<typeof setActiveBodySchema>

export const testBodySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('s3'), config: s3ConfigSchema }),
  z.object({ kind: z.literal('database'), config: databaseConfigSchema }),
  z.object({ kind: z.literal('qdrant'), config: qdrantConfigSchema }),
])
export type TestBody = z.infer<typeof testBodySchema>

export const deleteQuerySchema = z.object({
  project_name: z.string().min(1),
  kind: z.enum(CONNECTION_KINDS).optional(),
})

export const getQuerySchema = z.object({
  project_name: z.string().min(1),
})
