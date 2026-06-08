// Server-only singleton that resolves S3 / Qdrant / documents-Postgres clients
// per project, falling back to the shared defaults when no override exists.
//
// Mirrors the backend's ConnectionManager (ai_ta_backend/database/connection_manager.py):
//   - configs decrypted from project_external_connections, cached for 5 min
//   - live clients cached in-process for 30 min
//   - per-project locks prevent duplicate construction under concurrent load
//   - host-only data (conversations, projects, stats, ...) always uses the
//     host db; only document-related tables route through getDocumentsDb().
//
// This module imports node-only deps and must never be evaluated in the browser.

import { S3Client } from '@aws-sdk/client-s3'
import { QdrantClient } from '@qdrant/js-client-rest'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from '~/db/schema'
import { db as hostDb } from '~/db/dbClient'
import { s3Client as defaultS3Client } from '~/utils/s3Client'
import { decryptProjectConfig, type EncryptedField } from '~/utils/crypto'
import { ensureRedisConnected } from '~/utils/redisClient'
import type { EmbeddingOverrideConfig } from '~/utils/projectConnections/validation'

import OpenAI from 'openai'

// ---------------------------------------------------------------------------
// Types — kept local so this module doesn't conflict with the milestone-2
// UI-side `src/types/externalConnections.ts` that's currently in flight.
// ---------------------------------------------------------------------------

export interface S3OverrideConfig {
  aws_access_key_id: string
  aws_secret_access_key: string
  bucket_name?: string
  endpoint_url?: string
  region?: string
}

export interface DatabaseOverrideConfig {
  connection_uri: string
}

export interface QdrantOverrideConfig {
  // URL is the source of truth for both host and scheme. Both qdrant-client
  // libraries (Python qdrant_remote.py:97-99 and JS qdrant-client.js:29)
  // let the URL's scheme overwrite any `https` flag passed alongside it, so
  // we don't model `https` here. The Python backend's connection_manager.py
  // still does `.get("https", False)` which is now a no-op against records
  // written by the new shape.
  url: string
  api_key: string
  // Applied only when the URL has no explicit port — matches qdrant-client
  // semantics (`self._port = parsed_url.port or port` in both libs).
  port?: number
  // Primary collection. All ingest writes (and the doc_groups setPayload
  // mutation that shares that lane) target this collection. The optional
  // `collections` array on the backend's qdrant_config schema is read-side
  // fan-out only and is intentionally not modeled here — the frontend never
  // dispatches reads to Qdrant directly.
  default_collection?: string
}

interface ResolvedRow {
  is_active: boolean
  s3: S3OverrideConfig | null
  database: DatabaseOverrideConfig | null
  qdrant: QdrantOverrideConfig | null
  embedding: EmbeddingOverrideConfig | null
}

// Discriminated union returned by `getEmbeddingClient`. Mirrors the backend's
// `_resolve_embedding_client` (ai_ta_backend/service/retrieval_service.py).
// The Ollama branch deliberately does NOT use the OpenAI SDK against Ollama's
// `/v1` compat endpoint — see backend `OllamaEmbeddings`. Both code paths
// (frontend Drizzle + backend `/getTopContexts`) hit `${baseUrl}/api/embeddings`
// with the same `{model, prompt}` payload so vectors land in the same space.
export type ResolvedEmbeddingClient =
  | {
      kind: 'openai'
      client: OpenAI
      model: string
      applyQwenInstruction: boolean
      queryInstruction: string
    }
  | { kind: 'ollama'; baseUrl: string; model: string }

// ---------------------------------------------------------------------------
// Cache TTLs (ms) — match backend
// ---------------------------------------------------------------------------

const CONFIG_TTL_MS = 5 * 60 * 1000
const CLIENT_TTL_MS = 30 * 60 * 1000
const REDIS_CONFIG_TTL_S = 5 * 60

// Sentinel cached when a project has no row / is inactive — avoids repeating
// the DB lookup just to learn there's no override.
const NO_OVERRIDES: ResolvedRow = {
  is_active: true,
  s3: null,
  database: null,
  qdrant: null,
  embedding: null,
}

const DEFAULT_QWEN_QUERY_INSTRUCTION =
  'Given a user search query, retrieve the most relevant passages from the Illinois Chat knowledge base stored in the vector store to answer the query accurately. Prioritize authoritative course materials, syllabi, FAQs, official documentation, web pages, and other relevant sources. Ignore boilerplate/navigation text.'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

type DocumentsDb = typeof hostDb

interface S3CacheEntry extends CacheEntry {
  bucket: string | null
  endpoint: string | null
  region: string | null
}

interface QdrantCacheEntry extends CacheEntry {
  collection: string
}

interface PgCacheEntry extends CacheEntry {
  raw: ReturnType
}

interface EmbeddingCacheEntry extends CacheEntry {}

class ConnectionManager {
  private configCache = new Map()
  private s3Clients = new Map()
  private qdrantClients = new Map()
  private pgClients = new Map()
  private embeddingClients = new Map()

  // In-flight locks (one map per resource so different lookups don't queue
  // behind unrelated work for the same project).
  private configLocks = new Map()
  private s3Locks = new Map()
  private qdrantLocks = new Map()
  private pgLocks = new Map()
  private embeddingLocks = new Map()

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  getHostDb(): typeof hostDb {
    return hostDb
  }

  async getS3Client(projectName: string): Promise {
    const entry = await this.resolveS3(projectName)
    return {
      client: entry.value,
      bucket: entry.bucket,
      endpoint: entry.endpoint,
      region: entry.region,
    }
  }

  async getQdrantClient(projectName: string): Promise {
    const entry = await this.resolveQdrant(projectName)
    return { client: entry.value, collection: entry.collection }
  }

  /**
   * Resolve which vector engine a project should use.
   *
   * Order of resolution:
   *   1. Project has an active non-null `qdrant_config`     → external Qdrant
   *   2. Otherwise                                          → pgvector
   *      (host pgvector by default; per-project external pg when
   *      `database_config` is set — embeddings follow the documents db.)
   *
   * Use this before deciding whether to call `getQdrantClient` (Qdrant
   * setPayload path) or fall through to the pgvector Drizzle write.
   */
  async resolveVectorEngine(projectName: string): Promise {
    const config = await this.resolveConfig(projectName)
    if (config.qdrant) {
      const entry = await this.resolveQdrant(projectName)
      return {
        kind: 'qdrant',
        client: entry.value,
        collection: entry.collection,
      }
    }
    return { kind: 'pgvector' }
  }

  async getDocumentsDb(projectName: string): Promise {
    const entry = await this.resolvePg(projectName)
    return entry.value
  }

  /**
   * Resolve the embedding client for a project. Mirrors the backend's
   * `_resolve_embedding_client` (retrieval_service.py): reads the top-level
   * `embedding_config` column, falls back to env defaults when unset.
   *
   * The returned value is a discriminated union so callers (e.g. `embedQuery`)
   * can dispatch to the right HTTP shape — `openai` via the OpenAI SDK,
   * `ollama` via a raw `fetch` to `/api/embeddings` (NOT Ollama's `/v1`
   * OpenAI-compat endpoint — backend uses LangChain `OllamaEmbeddings` which
   * targets `/api/embeddings`; we mirror it for vector-space parity).
   */
  async getEmbeddingClient(projectName: string): Promise {
    const entry = await this.resolveEmbedding(projectName)
    return entry.value
  }

  async invalidate(projectName: string): Promise {
    this.configCache.delete(projectName)
    this.s3Clients.delete(projectName)
    this.qdrantClients.delete(projectName)
    this.embeddingClients.delete(projectName)
    const pg = this.pgClients.get(projectName)
    if (pg) {
      this.pgClients.delete(projectName)
      try {
        await pg.raw.end({ timeout: 5 })
      } catch (e) {
        console.warn(
          `[ConnectionManager] failed to dispose pg pool for ${projectName}:`,
          e,
        )
      }
    }

    try {
      const redis = await ensureRedisConnected()
      await redis.del(redisKey(projectName))
    } catch (e) {
      // Non-fatal: in-process invalidation still happened.
      console.warn(
        `[ConnectionManager] redis invalidation failed for ${projectName}:`,
        e,
      )
    }
  }

  // -------------------------------------------------------------------------
  // Resolution — config layer
  // -------------------------------------------------------------------------

  private async resolveConfig(projectName: string): Promise {
    const now = Date.now()
    const cached = this.configCache.get(projectName)
    if (cached && cached.expiresAt > now) return cached.value

    const inflight = this.configLocks.get(projectName)
    if (inflight) return inflight

    const promise = this.fetchConfig(projectName)
      .then((row) => {
        this.configCache.set(projectName, {
          value: row,
          expiresAt: Date.now() + CONFIG_TTL_MS,
        })
        return row
      })
      .finally(() => {
        this.configLocks.delete(projectName)
      })

    this.configLocks.set(projectName, promise)
    return promise
  }

  private async fetchConfig(projectName: string): Promise {
    // Tier 1 — Redis
    try {
      const redis = await ensureRedisConnected()
      const raw = await redis.get(redisKey(projectName))
      if (raw) return JSON.parse(raw) as ResolvedRow
    } catch (e) {
      // Redis is optional — log once per process, then carry on.
      logRedisOnce('read', e)
    }

    // Tier 2 — host DB lookup. project_external_connections always lives on
    // the host DB; never resolve through getDocumentsDb here.
    const rows = await hostDb
      .select()
      .from(schema.projectExternalConnections)
      .where(eq(schema.projectExternalConnections.project_name, projectName))
      .limit(1)

    let resolved: ResolvedRow
    if (!rows.length || rows[0]!.is_active === false) {
      resolved = NO_OVERRIDES
    } else {
      const row = rows[0]!
      const [s3, database, qdrant, embedding] = await Promise.all([
        decryptProjectConfig(row.s3_config as EncryptedField),
        decryptProjectConfig(row.database_config as EncryptedField),
        decryptProjectConfig(row.qdrant_config as EncryptedField),
        decryptProjectConfig(row.embedding_config as EncryptedField),
      ])
      // Legacy: older rows stored the embedding override under
      // `qdrant_config.embedding`. Honor it as a fallback so we don't break
      // existing Qdrant projects until they migrate to the new column.
      const legacyEmbedding =
        !embedding && qdrant && typeof qdrant === 'object'
          ? ((qdrant as unknown as { embedding?: EmbeddingOverrideConfig })
              .embedding ?? null)
          : null
      resolved = {
        is_active: true,
        s3,
        database,
        qdrant,
        embedding: embedding ?? legacyEmbedding,
      }
    }

    try {
      const redis = await ensureRedisConnected()
      await redis.set(redisKey(projectName), JSON.stringify(resolved), {
        EX: REDIS_CONFIG_TTL_S,
      })
    } catch (e) {
      logRedisOnce('write', e)
    }

    return resolved
  }

  // -------------------------------------------------------------------------
  // Resolution — S3
  // -------------------------------------------------------------------------

  private async resolveS3(projectName: string): Promise {
    const now = Date.now()
    const cached = this.s3Clients.get(projectName)
    if (cached && cached.expiresAt > now) return cached

    const inflight = this.s3Locks.get(projectName)
    if (inflight) return inflight

    const promise = (async () => {
      const config = await this.resolveConfig(projectName)
      const entry = this.buildS3Entry(config.s3)
      this.s3Clients.set(projectName, entry)
      return entry
    })().finally(() => {
      this.s3Locks.delete(projectName)
    })

    this.s3Locks.set(projectName, promise)
    return promise
  }

  private buildS3Entry(s3: S3OverrideConfig | null): S3CacheEntry {
    if (!s3) {
      if (!defaultS3Client) {
        throw new Error(
          'No project S3 override and the default S3 client is not configured (missing AWS_REGION / AWS_KEY / AWS_SECRET).',
        )
      }
      return {
        value: defaultS3Client,
        bucket: process.env.S3_BUCKET_NAME ?? null,
        endpoint: process.env.MINIO_ENDPOINT ?? null,
        region: process.env.AWS_REGION ?? null,
        expiresAt: Date.now() + CLIENT_TTL_MS,
      }
    }

    const region = s3.region ?? 'us-east-1' // AWS SDK JS v3 requires an explicit region
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: s3.aws_access_key_id,
        secretAccessKey: s3.aws_secret_access_key,
      },
      ...(s3.endpoint_url
        ? { endpoint: s3.endpoint_url, forcePathStyle: true }
        : {}),
    })

    return {
      value: client,
      bucket: s3.bucket_name ?? process.env.S3_BUCKET_NAME ?? null,
      endpoint: s3.endpoint_url ?? null,
      region,
      expiresAt: Date.now() + CLIENT_TTL_MS,
    }
  }

  // -------------------------------------------------------------------------
  // Resolution — Qdrant
  // -------------------------------------------------------------------------

  private async resolveQdrant(projectName: string): Promise {
    const now = Date.now()
    const cached = this.qdrantClients.get(projectName)
    if (cached && cached.expiresAt > now) return cached

    const inflight = this.qdrantLocks.get(projectName)
    if (inflight) return inflight

    const promise = (async () => {
      const config = await this.resolveConfig(projectName)
      const entry = this.buildQdrantEntry(config.qdrant)
      this.qdrantClients.set(projectName, entry)
      return entry
    })().finally(() => {
      this.qdrantLocks.delete(projectName)
    })

    this.qdrantLocks.set(projectName, promise)
    return promise
  }

  private buildQdrantEntry(q: QdrantOverrideConfig | null): QdrantCacheEntry {
    if (!q) {
      // No per-project override and no shared Qdrant fallback — projects
      // without `qdrant_config` use pgvector. Hitting this path means a
      // caller skipped `resolveVectorEngine()` and went straight to
      // `getQdrantClient()`.
      throw new Error(
        `No qdrant_config override for project — use resolveVectorEngine() before requesting a Qdrant client.`,
      )
    }

    const collection =
      q.default_collection ?? process.env.QDRANT_COLLECTION_NAME ?? null
    if (!collection) {
      throw new Error(
        `Project Qdrant override has no default_collection and QDRANT_COLLECTION_NAME is not set.`,
      )
    }

    const client = new QdrantClient({
      url: buildQdrantUrl(q),
      apiKey: q.api_key,
    })

    return {
      value: client,
      collection,
      expiresAt: Date.now() + CLIENT_TTL_MS,
    }
  }

  // -------------------------------------------------------------------------
  // Resolution — documents Postgres
  // -------------------------------------------------------------------------

  private async resolvePg(projectName: string): Promise {
    const now = Date.now()
    const cached = this.pgClients.get(projectName)
    if (cached && cached.expiresAt > now) return cached

    const inflight = this.pgLocks.get(projectName)
    if (inflight) return inflight

    const promise = (async () => {
      const config = await this.resolveConfig(projectName)
      if (!config.database) {
        // Wrap the host db so callers always get a fresh expiresAt; we don't
        // own its lifecycle so `raw` is a no-op end().
        const entry: PgCacheEntry = {
          value: hostDb,
          raw: { end: async () => {} } as unknown as ReturnType,
          expiresAt: Date.now() + CLIENT_TTL_MS,
        }
        this.pgClients.set(projectName, entry)
        return entry
      }
      const raw = postgres(config.database.connection_uri, {
        max: 5,
        idle_timeout: 1800,
        connect_timeout: 10,
      })
      const value = drizzle(raw, { schema })
      const entry: PgCacheEntry = {
        value,
        raw,
        expiresAt: Date.now() + CLIENT_TTL_MS,
      }
      this.pgClients.set(projectName, entry)
      return entry
    })().finally(() => {
      this.pgLocks.delete(projectName)
    })

    this.pgLocks.set(projectName, promise)
    return promise
  }

  // -------------------------------------------------------------------------
  // Resolution — embedding
  // -------------------------------------------------------------------------

  private async resolveEmbedding(projectName: string): Promise {
    const now = Date.now()
    const cached = this.embeddingClients.get(projectName)
    if (cached && cached.expiresAt > now) return cached

    const inflight = this.embeddingLocks.get(projectName)
    if (inflight) return inflight

    const promise = (async () => {
      const config = await this.resolveConfig(projectName)
      const entry = this.buildEmbeddingEntry(config.embedding)
      this.embeddingClients.set(projectName, entry)
      return entry
    })().finally(() => {
      this.embeddingLocks.delete(projectName)
    })

    this.embeddingLocks.set(projectName, promise)
    return promise
  }

  private buildEmbeddingEntry(
    cfg: EmbeddingOverrideConfig | null,
  ): EmbeddingCacheEntry {
    const envModel = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
    const envApiKey =
      process.env.OPENAI_API_KEY || process.env.NCSA_HOSTED_API_KEY || ''
    const envApiBase =
      process.env.EMBEDDING_API_BASE || 'https://api.openai.com/v1'
    const queryInstruction =
      process.env.QWEN_QUERY_INSTRUCTION || DEFAULT_QWEN_QUERY_INSTRUCTION

    if (!cfg) {
      // Env-only default — preserves the legacy behaviour of `embedQuery.ts`.
      return {
        value: {
          kind: 'openai',
          client: new OpenAI({ apiKey: envApiKey, baseURL: envApiBase }),
          model: envModel,
          applyQwenInstruction: envModel.toLowerCase().includes('qwen'),
          queryInstruction,
        },
        expiresAt: Date.now() + CLIENT_TTL_MS,
      }
    }

    const model = cfg.model || envModel
    const cfgInstruction = cfg.query_instruction || queryInstruction

    if (cfg.provider === 'ollama') {
      const baseUrl =
        cfg.base_url ||
        process.env.OLLAMA_BASE_URL ||
        process.env.OLLAMA_SERVER_URL
      if (!baseUrl) {
        // Same message-shape as backend `retrieval_service.py:_resolve_embedding_client`
        // so substring-matching dev tooling works against either runtime.
        throw new Error(
          "embedding_config provider='ollama' requires base_url (or set OLLAMA_BASE_URL / OLLAMA_SERVER_URL)",
        )
      }
      return {
        value: { kind: 'ollama', baseUrl, model },
        expiresAt: Date.now() + CLIENT_TTL_MS,
      }
    }

    // Default to OpenAI-compatible for anything else. The provider value has
    // already been narrowed by Zod (validation.ts) at the API boundary and by
    // ALLOWED_EMBEDDING_PROVIDERS on the backend resolver.
    const apiKey = cfg.api_key || envApiKey
    const baseURL = cfg.api_base || envApiBase
    return {
      value: {
        kind: 'openai',
        client: new OpenAI({ apiKey, baseURL }),
        model,
        applyQwenInstruction: model.toLowerCase().includes('qwen'),
        queryInstruction: cfgInstruction,
      },
      expiresAt: Date.now() + CLIENT_TTL_MS,
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function redisKey(projectName: string): string {
  return `pec:config:${projectName}`
}

// Exported because the test probe in ~/utils/projectConnections/tester needs
// the same effective URL as the runtime QdrantClient.
//
// The URL's scheme is authoritative — this matches both qdrant-client libs
// (Python qdrant_remote.py:97-99 and JS qdrant-client.js:29 both let the
// URL's scheme overwrite the `https` arg). We only graft the configured port
// when the URL doesn't already carry one, which mirrors the same libs'
// `self._port = parsed_url.port or port`.
export function buildQdrantUrl(q: QdrantOverrideConfig): string {
  if (!q.port) return q.url
  try {
    const u = new URL(q.url)
    if (!u.port) u.port = String(q.port)
    return u.toString().replace(/\/$/, '')
  } catch {
    return q.url
  }
}

let redisErrorLogged = false
function logRedisOnce(op: 'read' | 'write', e: unknown): void {
  if (redisErrorLogged) return
  redisErrorLogged = true
  console.warn(
    `[ConnectionManager] Redis ${op} failed; continuing with in-process cache only:`,
    e,
  )
}

// ---------------------------------------------------------------------------
// Singleton — module-scoped so every server-side import shares one cache.
// ---------------------------------------------------------------------------

export const connectionManager = new ConnectionManager()
