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

// Shared Qdrant client (lazy) used when a project has no qdrant_config
// override AND VECTOR_ENGINE=qdrant. The deleted utils/qdrantClient.ts had a
// module-level singleton; we rebuild it inline here only when needed.
let _sharedQdrantClient: QdrantClient | null | undefined
function getSharedQdrantClient(): QdrantClient | null {
  if (_sharedQdrantClient !== undefined) return _sharedQdrantClient
  if (
    process.env.VECTOR_ENGINE !== 'qdrant' ||
    !process.env.QDRANT_URL ||
    !process.env.QDRANT_API_KEY
  ) {
    _sharedQdrantClient = null
    return null
  }
  _sharedQdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  })
  return _sharedQdrantClient
}

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
  url: string
  api_key: string
  port?: number
  https?: boolean
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
}

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
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

type DocumentsDb = typeof hostDb

interface S3CacheEntry extends CacheEntry<S3Client> {
  bucket: string | null
  endpoint: string | null
  region: string | null
}

interface QdrantCacheEntry extends CacheEntry<QdrantClient> {
  collection: string
}

interface PgCacheEntry extends CacheEntry<DocumentsDb> {
  raw: ReturnType<typeof postgres>
}

class ConnectionManager {
  private configCache = new Map<string, CacheEntry<ResolvedRow>>()
  private s3Clients = new Map<string, S3CacheEntry>()
  private qdrantClients = new Map<string, QdrantCacheEntry>()
  private pgClients = new Map<string, PgCacheEntry>()

  // In-flight locks (one map per resource so different lookups don't queue
  // behind unrelated work for the same project).
  private configLocks = new Map<string, Promise<ResolvedRow>>()
  private s3Locks = new Map<string, Promise<S3CacheEntry>>()
  private qdrantLocks = new Map<string, Promise<QdrantCacheEntry>>()
  private pgLocks = new Map<string, Promise<PgCacheEntry>>()

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  getHostDb(): typeof hostDb {
    return hostDb
  }

  async getS3Client(
    projectName: string,
  ): Promise<{
    client: S3Client
    bucket: string | null
    endpoint: string | null
    region: string | null
  }> {
    const entry = await this.resolveS3(projectName)
    return {
      client: entry.value,
      bucket: entry.bucket,
      endpoint: entry.endpoint,
      region: entry.region,
    }
  }

  async getQdrantClient(
    projectName: string,
  ): Promise<{ client: QdrantClient; collection: string }> {
    const entry = await this.resolveQdrant(projectName)
    return { client: entry.value, collection: entry.collection }
  }

  /**
   * Resolve which vector engine a project should use.
   *
   * Order of resolution:
   *   1. Project has an active non-null `qdrant_config`     → external Qdrant
   *   2. `VECTOR_ENGINE === 'qdrant'` env (shared Qdrant)   → shared Qdrant
   *   3. Otherwise                                          → host pgvector
   *
   * Use this before deciding whether to call `getQdrantClient` (Qdrant
   * setPayload path) or fall through to the host-pgvector Drizzle write.
   */
  async resolveVectorEngine(
    projectName: string,
  ): Promise<
    | { kind: 'qdrant'; client: QdrantClient; collection: string }
    | { kind: 'pgvector' }
  > {
    const config = await this.resolveConfig(projectName)
    if (config.qdrant) {
      const entry = await this.resolveQdrant(projectName)
      return { kind: 'qdrant', client: entry.value, collection: entry.collection }
    }
    const shared = getSharedQdrantClient()
    if (shared && process.env.QDRANT_COLLECTION_NAME) {
      return {
        kind: 'qdrant',
        client: shared,
        collection: process.env.QDRANT_COLLECTION_NAME,
      }
    }
    return { kind: 'pgvector' }
  }

  async getDocumentsDb(projectName: string): Promise<DocumentsDb> {
    const entry = await this.resolvePg(projectName)
    return entry.value
  }

  async invalidate(projectName: string): Promise<void> {
    this.configCache.delete(projectName)
    this.s3Clients.delete(projectName)
    this.qdrantClients.delete(projectName)
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

  private async resolveConfig(projectName: string): Promise<ResolvedRow> {
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

  private async fetchConfig(projectName: string): Promise<ResolvedRow> {
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
      const [s3, database, qdrant] = await Promise.all([
        decryptProjectConfig<S3OverrideConfig>(
          row.s3_config as EncryptedField,
        ),
        decryptProjectConfig<DatabaseOverrideConfig>(
          row.database_config as EncryptedField,
        ),
        decryptProjectConfig<QdrantOverrideConfig>(
          row.qdrant_config as EncryptedField,
        ),
      ])
      resolved = { is_active: true, s3, database, qdrant }
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

  private async resolveS3(projectName: string): Promise<S3CacheEntry> {
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

  private async resolveQdrant(projectName: string): Promise<QdrantCacheEntry> {
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
      // No per-project override. Fall back to shared Qdrant only if
      // VECTOR_ENGINE=qdrant and QDRANT env vars are configured. Otherwise
      // pgvector is the engine and Qdrant should not be needed — callers
      // that hit this path mean an upstream bug.
      const client = getSharedQdrantClient()
      if (!client) {
        throw new Error(
          'No project qdrant_config override and shared Qdrant is not configured (VECTOR_ENGINE != qdrant or QDRANT_URL/API_KEY unset). Use resolveVectorEngine() before requesting a Qdrant client.',
        )
      }
      const collection = process.env.QDRANT_COLLECTION_NAME
      if (!collection) {
        throw new Error('QDRANT_COLLECTION_NAME is not set.')
      }
      return {
        value: client,
        collection,
        expiresAt: Date.now() + CLIENT_TTL_MS,
      }
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

  private async resolvePg(projectName: string): Promise<PgCacheEntry> {
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
          raw: { end: async () => {} } as unknown as ReturnType<typeof postgres>,
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function redisKey(projectName: string): string {
  return `pec:config:${projectName}`
}

function buildQdrantUrl(q: QdrantOverrideConfig): string {
  // Honor explicit url; if the caller supplied port / https separately,
  // graft them on. Backend stores all three so we mirror its behaviour.
  if (!q.port && q.https === undefined) return q.url
  try {
    const u = new URL(q.url)
    if (q.https !== undefined) u.protocol = q.https ? 'https:' : 'http:'
    if (q.port) u.port = String(q.port)
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
