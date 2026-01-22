/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}))

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (fn: any) => fn,
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (handler: any) => handler,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

vi.mock('~/db/schema', () => ({
  projects: {
    id: { name: 'id' },
    course_name: { name: 'course_name' },
    n8n_api_key: { name: 'n8n_api_key' },
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
}))

vi.mock('~/db/dbClient', () => ({
  db: {
    select: hoisted.select,
    insert: hoisted.insert,
  },
}))

import activateWorkflowHandler from '../activateWorkflow'
import getN8nKeyFromProjectHandler from '../getN8nKeyFromProject'
import testN8nAPIHandler from '../testN8nAPI'
import upsertN8nAPIKeyHandler from '../upsertN8nAPIKey'

describe('UIUC-api/tools routes', () => {
  beforeEach(() => {
    hoisted.select.mockReset()
    hoisted.insert.mockReset()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('activateWorkflow returns 200 on success and status on backend failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn(async () => ({ ok: true })),
      })) as any,
    )

    const res1 = createMockRes()
    await activateWorkflowHandler(
      createMockReq({ query: { api_key: 'k', id: '1', activate: 'true' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: vi.fn(async () => 'oops'),
      })) as any,
    )
    const res2 = createMockRes()
    await activateWorkflowHandler(
      createMockReq({ query: { api_key: 'k', id: '1', activate: 'true' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(502)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn(async () => ({ message: 'bad request' })),
      })) as any,
    )
    const res3 = createMockRes()
    await activateWorkflowHandler(
      createMockReq({ query: { api_key: 'k', id: '1', activate: 'true' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(400)
  })

  it('getN8nKeyFromProject returns 404 when missing, 200 when found, and 500 on db error', async () => {
    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: vi.fn().mockResolvedValueOnce([]),
      }),
    }))

    const res1 = createMockRes()
    await getN8nKeyFromProjectHandler(
      createMockReq({ query: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(404)

    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: vi.fn().mockResolvedValueOnce([{ n8n_api_key: 'k' }]),
      }),
    }))
    const res2 = createMockRes()
    await getN8nKeyFromProjectHandler(
      createMockReq({ query: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith('k')

    hoisted.select.mockImplementationOnce(() => ({
      from: () => ({
        where: vi.fn().mockRejectedValueOnce(new Error('boom')),
      }),
    }))
    const res3 = createMockRes()
    await getN8nKeyFromProjectHandler(
      createMockReq({ query: { course_name: 'CS101' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(500)
  })

  it('upsertN8nAPIKey validates input and returns 200/500', async () => {
    const res1 = createMockRes()
    await upsertN8nAPIKeyHandler(
      createMockReq({ method: 'POST', body: { n8n_api_key: 'k' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)

    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValueOnce(undefined),
      }),
    })
    const res2 = createMockRes()
    await upsertN8nAPIKeyHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', n8n_api_key: 'k' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)

    hoisted.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockRejectedValueOnce(new Error('boom')),
      }),
    })
    const res3 = createMockRes()
    await upsertN8nAPIKeyHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', n8n_api_key: 'k' },
      }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(500)
  })

  it('testN8nAPI returns 200 on ok and rejects on non-ok responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn(async () => ({})),
      })) as any,
    )

    const res1 = createMockRes()
    await testN8nAPIHandler(
      createMockReq({ method: 'POST', body: { n8nApiKey: 'k' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'boom',
      })) as any,
    )

    await expect(
      testN8nAPIHandler(
        createMockReq({ method: 'POST', body: { n8nApiKey: 'k' } }) as any,
        createMockRes() as any,
      ),
    ).rejects.toThrow('Unable to fetch n8n tools')
  })
})

