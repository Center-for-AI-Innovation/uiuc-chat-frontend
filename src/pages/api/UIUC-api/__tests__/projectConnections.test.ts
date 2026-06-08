/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MASTER_KEY = 'test-master-key-do-not-use-in-prod'

function makeRes() {
  const res: any = {}
  res.status = vi.fn((code: number) => {
    res.statusCode = code
    return res
  })
  res.json = vi.fn((body: any) => {
    res.body = body
    return res
  })
  res.setHeader = vi.fn()
  return res
}

const auditEntries: any[] = []
const invalidatedProjects: string[] = []

function mockRepoAndManager() {
  vi.doMock('~/db/projectConnectionsRepo', () => ({
    getProjectIdByName: vi.fn(async (name: string) =>
      name === 'demo' ? 42 : null,
    ),
    getConnectionByProject: vi.fn(async () => null),
    upsertConnectionField: vi.fn(async () => ({})),
    deleteConnection: vi.fn(async () => ({
      deleted: true,
      found: true,
      cleared: null,
    })),
    setActive: vi.fn(async () => ({ found: true, is_active: true })),
    writeAuditEntry: vi.fn(async (e: any) => {
      auditEntries.push(e)
    }),
    getProjectIdByName_default: undefined,
  }))
  vi.doMock('~/utils/connectionManager', () => ({
    connectionManager: {
      invalidate: vi.fn(async (n: string) => {
        invalidatedProjects.push(n)
      }),
    },
  }))
}

beforeEach(() => {
  auditEntries.length = 0
  invalidatedProjects.length = 0
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.stubEnv('ENCRYPTION_MASTER_KEY', MASTER_KEY)
})

afterEach(() => {
  vi.doUnmock('~/db/projectConnectionsRepo')
  vi.doUnmock('~/utils/connectionManager')
})

describe('projectConnections handler — auth gate', () => {
  it('default export rejects non-super-admin with 403', async () => {
    mockRepoAndManager()
    vi.doMock('~/utils/superAdmins', () => ({
      isSuperAdmin: vi.fn(
        (email: string | null) => email === 'admin@example.com',
      ),
    }))
    vi.doMock('~/utils/authMiddleware', () => ({
      withAuth: (h: any) => async (req: any, res: any) => {
        req.user = { email: 'stranger@example.com' }
        return h(req, res)
      },
    }))

    const mod = await import('../projectConnections')
    const res = makeRes()
    await mod.default(
      { method: 'GET', query: { project_name: 'demo' }, headers: {} } as any,
      res,
    )
    expect(res.statusCode).toBe(403)
  })

  it('default export lets super-admin through', async () => {
    mockRepoAndManager()
    vi.doMock('~/utils/superAdmins', () => ({
      isSuperAdmin: vi.fn(() => true),
    }))
    vi.doMock('~/utils/authMiddleware', () => ({
      withAuth: (h: any) => async (req: any, res: any) => {
        req.user = { email: 'admin@example.com' }
        return h(req, res)
      },
    }))

    const mod = await import('../projectConnections')
    const res = makeRes()
    await mod.default(
      { method: 'GET', query: { project_name: 'demo' }, headers: {} } as any,
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ found: false, project_name: 'demo' })
  })
})

describe('projectConnections handler — GET masks secrets', () => {
  it('returns masked configs and identifiers in plaintext', async () => {
    const { encrypt } = await import('~/utils/crypto')
    const s3Plain = {
      aws_access_key_id: 'AKIA1234567890ABCD',
      aws_secret_access_key: 'secret-ending-in-CAFE',
      bucket_name: 'cropwizard-prod',
      region: 'us-east-2',
    }
    const s3Encrypted = {
      encrypted: (await encrypt(JSON.stringify(s3Plain), MASTER_KEY)) as string,
    }

    vi.doMock('~/db/projectConnectionsRepo', () => ({
      getProjectIdByName: vi.fn(async () => 42),
      getConnectionByProject: vi.fn(async () => ({
        id: 1,
        project_id: 42,
        project_name: 'demo',
        is_active: true,
        s3_config: s3Encrypted,
        database_config: null,
        qdrant_config: null,
        created_at: new Date('2026-01-01').toISOString(),
        updated_at: new Date('2026-01-01').toISOString(),
      })),
      upsertConnectionField: vi.fn(),
      deleteConnection: vi.fn(),
      setActive: vi.fn(),
      writeAuditEntry: vi.fn(async () => {}),
    }))
    vi.doMock('~/utils/connectionManager', () => ({
      connectionManager: { invalidate: vi.fn(async () => {}) },
    }))

    const { handler } = await import('../projectConnections')
    const req: any = {
      method: 'GET',
      query: { project_name: 'demo' },
      headers: {},
      user: { email: 'admin@example.com' },
    }
    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.found).toBe(true)
    expect(res.body.s3_config.aws_access_key_id).toBe('****ABCD')
    expect(res.body.s3_config.aws_secret_access_key).toBe('****CAFE')
    expect(res.body.s3_config.bucket_name).toBe('cropwizard-prod')
    expect(res.body.s3_config.region).toBe('us-east-2')
    expect(res.body.database_config).toBeNull()
    expect(res.body.qdrant_config).toBeNull()
  })
})

describe('projectConnections handler — POST', () => {
  it('upserts, invalidates, and writes an audit entry with field NAMES only', async () => {
    mockRepoAndManager()
    const { handler } = await import('../projectConnections')
    const req: any = {
      method: 'POST',
      headers: {
        'x-forwarded-for': '203.0.113.7',
        'user-agent': 'vitest',
        'x-request-id': 'req-1',
      },
      body: {
        project_name: 'demo',
        kind: 's3',
        config: {
          aws_access_key_id: 'AKIA',
          aws_secret_access_key: 'super-secret-value',
          bucket_name: 'demo-bucket',
        },
      },
      user: { email: 'admin@example.com' },
    }
    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      project_name: 'demo',
      project_id: 42,
      kind: 's3',
    })
    expect(invalidatedProjects).toContain('demo')
    expect(auditEntries).toHaveLength(1)
    const entry = auditEntries[0]
    expect(entry.action).toBe('upsert')
    expect(entry.outcome).toBe('success')
    expect(entry.actor_email).toBe('admin@example.com')
    expect(entry.source_ip).toBe('203.0.113.7')
    expect(entry.request_id).toBe('req-1')
    expect(entry.changed_fields).toEqual([
      'aws_access_key_id',
      'aws_secret_access_key',
      'bucket_name',
    ])
    // Sanity: nothing in the audit entry should contain the secret value.
    const serialized = JSON.stringify(entry)
    expect(serialized).not.toContain('super-secret-value')
  })

  it('returns 404 when the project is unknown', async () => {
    mockRepoAndManager()
    const { handler } = await import('../projectConnections')
    const res = makeRes()
    await handler(
      {
        method: 'POST',
        headers: {},
        user: { email: 'admin@example.com' },
        body: {
          project_name: 'nope',
          kind: 's3',
          config: { aws_access_key_id: 'a', aws_secret_access_key: 'b' },
        },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(404)
    expect(auditEntries[0]).toMatchObject({
      action: 'upsert',
      outcome: 'failure',
      failure_reason: 'project_not_found',
    })
  })

  it('returns 400 on validation error', async () => {
    mockRepoAndManager()
    const { handler } = await import('../projectConnections')
    const res = makeRes()
    await handler(
      {
        method: 'POST',
        headers: {},
        user: { email: 'admin@example.com' },
        body: { project_name: 'demo', kind: 's3', config: {} },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(400)
  })
})

describe('projectConnections handler — DELETE', () => {
  it('invalidates and audits on whole-row delete', async () => {
    mockRepoAndManager()
    const { handler } = await import('../projectConnections')
    const res = makeRes()
    await handler(
      {
        method: 'DELETE',
        query: { project_name: 'demo' },
        headers: {},
        user: { email: 'admin@example.com' },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(invalidatedProjects).toContain('demo')
    expect(auditEntries[0]).toMatchObject({
      action: 'delete',
      outcome: 'success',
      kind: null,
    })
  })

  it('records the kind on field-clear delete', async () => {
    mockRepoAndManager()
    const { handler } = await import('../projectConnections')
    const res = makeRes()
    await handler(
      {
        method: 'DELETE',
        query: { project_name: 'demo', kind: 's3' },
        headers: {},
        user: { email: 'admin@example.com' },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(auditEntries[0]).toMatchObject({ kind: 's3' })
  })
})
