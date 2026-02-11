/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  fetchContextsFromBackend: vi.fn(async () => ({ data: [] })),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/hooks/__internal__/fetchContextsFromBackend', () => ({
  default: hoisted.fetchContextsFromBackend,
}))

import handler from '~/pages/api/getContexts'

describe('getContexts API', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 200 with backend contexts', async () => {
    hoisted.fetchContextsFromBackend.mockResolvedValueOnce([{ id: 1 }])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          course_name: 'CS101',
          search_query: 'q',
          token_limit: 10,
          doc_groups: [],
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }])
  })

  it('returns 500 when backend throws', async () => {
    hoisted.fetchContextsFromBackend.mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', search_query: 'q' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
