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

export const CONNECTION_KINDS = ['s3', 'database', 'qdrant', 'embedding'] as const
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

// Per-project embedding provider override. Consumed by the backend's
// `_resolve_embedding_client(project_name)`: `ollama` uses the Ollama HTTP
// client (requires `base_url`); `openai` uses the OpenAI-compatible client
// with optional `api_key` / `api_base` overrides. `query_instruction` is
// only applied for Qwen models at query time.
//
// The active provider set is driven by the `ALLOWED_EMBEDDING_PROVIDERS` env
// var (comma-separated, lowercased — same parse shape as `SUPER_ADMIN_EMAILS`
// in `~/utils/superAdmins.ts`). The default is `['openai','ollama']`, which
// matches the providers the backend's `_resolve_embedding_client` actually
// implements. Tightening this env var (e.g. `openai` only) makes the Zod
// schema reject the other provider — useful for environments that want to
// disable Ollama at the boundary.
const DEFAULT_EMBEDDING_PROVIDERS = ['openai', 'ollama'] as const

function parseAllowedProviders(): readonly string[] {
  const raw = process.env.ALLOWED_EMBEDDING_PROVIDERS
  if (!raw) return DEFAULT_EMBEDDING_PROVIDERS
  const parsed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (parsed.length === 0) {
    throw new Error(
      'ALLOWED_EMBEDDING_PROVIDERS is set but parses to an empty list. ' +
        'Unset it to fall back to the default, or supply at least one provider.',
    )
  }
  return parsed
}

export const EMBEDDING_PROVIDERS = parseAllowedProviders()
export type EmbeddingProvider = (typeof EMBEDDING_PROVIDERS)[number]

export const embeddingConfigSchema = z
  .object({
    // Runtime tuple is type-narrowed for `z.enum`. `parseAllowedProviders`
    // already validated non-empty, so the cast is safe.
    provider: z.enum(EMBEDDING_PROVIDERS as unknown as [string, ...string[]]),
    model: z.string().min(1),
    base_url: z.string().url().optional(),
    api_base: z.string().url().optional(),
    api_key: z.string().min(1).optional(),
    query_instruction: z.string().optional(),
  })
  .refine((cfg) => cfg.provider !== 'ollama' || !!cfg.base_url, {
    message: "base_url is required when provider is 'ollama'",
    path: ['base_url'],
  })
export type EmbeddingOverrideConfig = z.infer<typeof embeddingConfigSchema>

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
  upsertBaseSchema.extend({
    kind: z.literal('embedding'),
    config: embeddingConfigSchema,
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
  z.object({ kind: z.literal('embedding'), config: embeddingConfigSchema }),
])
export type TestBody = z.infer<typeof testBodySchema>

export const deleteQuerySchema = z.object({
  project_name: z.string().min(1),
  kind: z.enum(CONNECTION_KINDS).optional(),
})

export const getQuerySchema = z.object({
  project_name: z.string().min(1),
})
