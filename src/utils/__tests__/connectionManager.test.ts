/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const MASTER_KEY = 'test-master-key-do-not-use-in-prod'

// Helpers --------------------------------------------------------------------

interface Row {
  is_active: boolean
  s3_config: { encrypted: string } | null
  database_config: { encrypted: string } | null
  qdrant_config: { encrypted: string } | null
}

function makeHostDbStub(rows: Row[]) {
  // drizzle's chain: db.select().from(table).where(...).limit(1)
  const limit = vi.fn().mockResolvedValue(rows)
  const where = vi.fn(() => ({ limit }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))
  return {
    db: { select, query: { docGroups: { findMany: vi.fn() } } },
    select,
    from,
    where,
    limit,
  }
}

async function encryptJson(obj: unknown) {
  const { encrypt } = await import('../crypto')
  const ct = await encrypt(JSON.stringify(obj), MASTER_KEY)
  return { encrypted: ct as string }
}

function setupRedisFake() {
  const store = new Map<string, string>()
  const redisFake = {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v)
      return 'OK'
    }),
    del: vi.fn(async (k: string) => {
      const had = store.delete(k)
      return had ? 1 : 0
    }),
    isOpen: true,
  }
  vi.doMock('~/utils/redisClient', () => ({
    ensureRedisConnected: vi.fn(async () => redisFake),
  }))
  return { store, redisFake }
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.stubEnv('ENCRYPTION_MASTER_KEY', MASTER_KEY)
  vi.stubEnv('S3_BUCKET_NAME', 'default-bucket')
  vi.stubEnv('AWS_REGION', 'us-east-2')
  vi.stubEnv('QDRANT_COLLECTION_NAME', 'default-collection')
  vi.stubEnv('QDRANT_URL', 'http://qdrant.local:6333')
  vi.stubEnv('QDRANT_API_KEY', 'default-qkey')
})

afterEach(() => {
  vi.doUnmock('~/db/dbClient')
  vi.doUnmock('~/utils/s3Client')
  vi.doUnmock('~/utils/qdrantClient')
  vi.doUnmock('~/utils/redisClient')
  vi.doUnmock('@aws-sdk/client-s3')
  vi.doUnmock('@qdrant/js-client-rest')
  vi.doUnmock('postgres')
  vi.doUnmock('drizzle-orm/postgres-js')
})

// Tests ----------------------------------------------------------------------

describe('ConnectionManager — defaults (no row)', () => {
  it('getS3Client returns the default singleton + env bucket when no row exists', async () => {
    const hostDb = makeHostDbStub([])
    vi.doMock('~/db/dbClient', () => ({ db: hostDb.db }))
    const defaultS3 = { kind: 'default-s3' }
    vi.doMock('~/utils/s3Client', () => ({ s3Client: defaultS3 }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: { kind: 'default-q' } }))
    setupRedisFake()

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.getS3Client('cs101')
    expect(got.client).toBe(defaultS3)
    expect(got.bucket).toBe('default-bucket')
  })

  it('resolveVectorEngine returns pgvector when no row + VECTOR_ENGINE != qdrant', async () => {
    vi.doMock('~/db/dbClient', () => ({ db: makeHostDbStub([]).db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.stubEnv('VECTOR_ENGINE', 'pgvector')
    setupRedisFake()

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.resolveVectorEngine('cs101')
    expect(got.kind).toBe('pgvector')
  })

  it('resolveVectorEngine returns qdrant (shared) when VECTOR_ENGINE=qdrant + env set', async () => {
    vi.doMock('~/db/dbClient', () => ({ db: makeHostDbStub([]).db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.stubEnv('VECTOR_ENGINE', 'qdrant')
    vi.stubEnv('QDRANT_URL', 'http://qdrant.local:6333')
    vi.stubEnv('QDRANT_API_KEY', 'shared-key')
    vi.stubEnv('QDRANT_COLLECTION_NAME', 'shared-coll')
    setupRedisFake()
    const ctor = vi.fn()
    vi.doMock('@qdrant/js-client-rest', () => ({ QdrantClient: ctor }))

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.resolveVectorEngine('cs101')
    expect(got.kind).toBe('qdrant')
    if (got.kind === 'qdrant') {
      expect(got.collection).toBe('shared-coll')
    }
  })

  it('getDocumentsDb returns the host db when no row exists', async () => {
    const hostStub = makeHostDbStub([])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()

    const { connectionManager } = await import('../connectionManager')
    const docsDb = await connectionManager.getDocumentsDb('cs101')
    expect(docsDb).toBe(hostStub.db)
  })

  it('falls back to defaults when row exists but is_active=false', async () => {
    const s3OverrideField = await encryptJson({
      aws_access_key_id: 'AKIA',
      aws_secret_access_key: 'sek',
      bucket_name: 'override-bucket',
    })
    const hostStub = makeHostDbStub([
      {
        is_active: false,
        s3_config: s3OverrideField,
        database_config: null,
        qdrant_config: null,
      },
    ])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    const defaultS3 = { kind: 'default-s3' }
    vi.doMock('~/utils/s3Client', () => ({ s3Client: defaultS3 }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.getS3Client('inactive-proj')
    expect(got.client).toBe(defaultS3)
    expect(got.bucket).toBe('default-bucket')
  })
})

describe('ConnectionManager — overrides', () => {
  it('builds an S3 client from a project s3_config row', async () => {
    const s3OverrideField = await encryptJson({
      aws_access_key_id: 'AKIA-OVERRIDE',
      aws_secret_access_key: 'sek-override',
      bucket_name: 'override-bucket',
      endpoint_url: 'https://minio.example.com',
      region: 'eu-west-1',
    })
    const hostStub = makeHostDbStub([
      {
        is_active: true,
        s3_config: s3OverrideField,
        database_config: null,
        qdrant_config: null,
      },
    ])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()

    const ctor = vi.fn()
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: ctor }))

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.getS3Client('override-proj')
    expect(got.bucket).toBe('override-bucket')
    expect(got.endpoint).toBe('https://minio.example.com')
    expect(got.region).toBe('eu-west-1')
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'eu-west-1',
        endpoint: 'https://minio.example.com',
        forcePathStyle: true,
        credentials: {
          accessKeyId: 'AKIA-OVERRIDE',
          secretAccessKey: 'sek-override',
        },
      }),
    )
  })

  it("defaults s3 region to 'us-east-1' when override omits it", async () => {
    const s3Field = await encryptJson({
      aws_access_key_id: 'k',
      aws_secret_access_key: 's',
      bucket_name: 'b',
    })
    const hostStub = makeHostDbStub([
      {
        is_active: true,
        s3_config: s3Field,
        database_config: null,
        qdrant_config: null,
      },
    ])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()
    const ctor = vi.fn()
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: ctor }))

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.getS3Client('p')
    expect(got.region).toBe('us-east-1')
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'us-east-1' }),
    )
  })

  it('builds a Qdrant client from a project qdrant_config row', async () => {
    const qField = await encryptJson({
      url: 'https://qdrant.override.com:6333',
      api_key: 'override-qkey',
      default_collection: 'override-coll',
    })
    const hostStub = makeHostDbStub([
      {
        is_active: true,
        s3_config: null,
        database_config: null,
        qdrant_config: qField,
      },
    ])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()
    const ctor = vi.fn()
    vi.doMock('@qdrant/js-client-rest', () => ({ QdrantClient: ctor }))

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.getQdrantClient('p')
    expect(got.collection).toBe('override-coll')
    expect(ctor).toHaveBeenCalledWith({
      url: 'https://qdrant.override.com:6333',
      apiKey: 'override-qkey',
    })
  })

  it('builds a documents drizzle instance from a database_config row', async () => {
    const dbField = await encryptJson({
      connection_uri: 'postgres://u:p@host:5432/db',
    })
    const hostStub = makeHostDbStub([
      {
        is_active: true,
        s3_config: null,
        database_config: dbField,
        qdrant_config: null,
      },
    ])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()

    const pgEnd = vi.fn()
    const pgFn = vi.fn(() => ({ end: pgEnd }))
    vi.doMock('postgres', () => ({ default: pgFn }))
    const drizzleFn = vi.fn(() => ({ kind: 'external-drizzle' }))
    vi.doMock('drizzle-orm/postgres-js', () => ({ drizzle: drizzleFn }))

    const { connectionManager } = await import('../connectionManager')
    const got = await connectionManager.getDocumentsDb('p')
    expect(pgFn).toHaveBeenCalledWith(
      'postgres://u:p@host:5432/db',
      expect.objectContaining({ max: 5 }),
    )
    expect(got).toEqual({ kind: 'external-drizzle' })
  })
})

describe('ConnectionManager — caching and invalidation', () => {
  it('caches the resolved config after the first lookup', async () => {
    const hostStub = makeHostDbStub([])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()

    const { connectionManager } = await import('../connectionManager')
    await connectionManager.getS3Client('p1')
    await connectionManager.getS3Client('p1')
    await connectionManager.getS3Client('p1')
    expect(hostStub.select).toHaveBeenCalledTimes(1)
  })

  it('serves the second project independently', async () => {
    const hostStub = makeHostDbStub([])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()

    const { connectionManager } = await import('../connectionManager')
    await connectionManager.getS3Client('p1')
    await connectionManager.getS3Client('p2')
    expect(hostStub.select).toHaveBeenCalledTimes(2)
  })

  it('invalidate() drops in-process + Redis cache and disposes pg pool', async () => {
    const dbField = await encryptJson({
      connection_uri: 'postgres://u:p@host:5432/db',
    })
    const hostStub = makeHostDbStub([
      {
        is_active: true,
        s3_config: null,
        database_config: dbField,
        qdrant_config: null,
      },
    ])
    vi.doMock("~/db/dbClient", () => ({ db: hostStub.db }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    const { redisFake } = setupRedisFake()

    const pgEnd = vi.fn()
    const pgFn = vi.fn(() => ({ end: pgEnd }))
    vi.doMock('postgres', () => ({ default: pgFn }))
    vi.doMock('drizzle-orm/postgres-js', () => ({
      drizzle: vi.fn(() => ({ kind: 'external' })),
    }))

    const { connectionManager } = await import('../connectionManager')
    await connectionManager.getDocumentsDb('p')
    await connectionManager.invalidate('p')
    expect(redisFake.del).toHaveBeenCalledWith('pec:config:p')
    expect(pgEnd).toHaveBeenCalled()

    // Next call hits the host DB again
    await connectionManager.getDocumentsDb('p')
    expect(hostStub.select).toHaveBeenCalledTimes(2)
  })

  it('coalesces concurrent lookups into a single DB read (lock)', async () => {
    let resolveLimit: (rows: Row[]) => void
    const limitPromise = new Promise<Row[]>((r) => {
      resolveLimit = r
    })
    const limit = vi.fn().mockReturnValue(limitPromise)
    const where = vi.fn(() => ({ limit }))
    const from = vi.fn(() => ({ where }))
    const select = vi.fn(() => ({ from }))
    vi.doMock('~/db/dbClient', () => ({
      db: { select, query: {} },
    }))
    vi.doMock('~/utils/s3Client', () => ({ s3Client: {} }))
    vi.doMock('~/utils/qdrantClient', () => ({ qdrant: {} }))
    setupRedisFake()

    const { connectionManager } = await import('../connectionManager')
    const a = connectionManager.getS3Client('p')
    const b = connectionManager.getS3Client('p')
    const c = connectionManager.getS3Client('p')
    resolveLimit!([])
    await Promise.all([a, b, c])
    expect(select).toHaveBeenCalledTimes(1)
  })
})
