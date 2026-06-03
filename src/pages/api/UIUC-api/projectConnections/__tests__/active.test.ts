/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

function mockRepoAndManager(setActiveImpl: () => any) {
  vi.doMock('~/db/projectConnectionsRepo', () => ({
    setActive: vi.fn(async () => setActiveImpl()),
    writeAuditEntry: vi.fn(async (e: any) => {
      auditEntries.push(e)
    }),
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
})

afterEach(() => {
  vi.doUnmock('~/db/projectConnectionsRepo')
  vi.doUnmock('~/utils/connectionManager')
})

describe('projectConnections/active handler', () => {
  it('rejects non-PATCH methods with 405', async () => {
    mockRepoAndManager(() => ({ found: true, is_active: true }))
    const { handler } = await import('../active')
    const res = makeRes()
    await handler(
      {
        method: 'POST',
        headers: {},
        body: { project_name: 'demo', is_active: false },
        user: { email: 'admin@example.com' },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(405)
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'PATCH')
  })

  it('returns 400 on invalid body', async () => {
    mockRepoAndManager(() => ({ found: true, is_active: true }))
    const { handler } = await import('../active')
    const res = makeRes()
    await handler(
      {
        method: 'PATCH',
        headers: {},
        body: { project_name: 'demo' }, // missing is_active
        user: { email: 'admin@example.com' },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('returns 404 when the row is missing and audits failure', async () => {
    mockRepoAndManager(() => ({ found: false, is_active: null }))
    const { handler } = await import('../active')
    const res = makeRes()
    await handler(
      {
        method: 'PATCH',
        headers: {},
        body: { project_name: 'missing', is_active: false },
        user: { email: 'admin@example.com' },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(404)
    expect(invalidatedProjects).toHaveLength(0)
    expect(auditEntries[0]).toMatchObject({
      action: 'set_active',
      outcome: 'failure',
      failure_reason: 'not_found',
      project_name: 'missing',
    })
  })

  it('happy path: 200, invalidate, audit success with is_active in changed_fields', async () => {
    mockRepoAndManager(() => ({ found: true, is_active: false }))
    const { handler } = await import('../active')
    const res = makeRes()
    await handler(
      {
        method: 'PATCH',
        headers: { 'x-forwarded-for': '203.0.113.7' },
        body: { project_name: 'demo', is_active: false },
        user: { email: 'admin@example.com' },
      } as any,
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      project_name: 'demo',
      is_active: false,
    })
    expect(invalidatedProjects).toEqual(['demo'])
    expect(auditEntries[0]).toMatchObject({
      action: 'set_active',
      outcome: 'success',
      project_name: 'demo',
      changed_fields: ['is_active'],
      source_ip: '203.0.113.7',
    })
  })
})
