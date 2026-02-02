import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))
  return {
    db: { select },
    projects: { n8n_api_key: {}, course_name: {} },
    selectWhere,
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
}))

vi.mock('~/db/schema', () => ({
  projects: hoisted.projects,
}))

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
}))

import handler from '~/pages/api/UIUC-api/getN8Napikey'

describe('UIUC-api/getN8Napikey', () => {
  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 404 when no key exists and 200 when key exists', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([])
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(404)

    hoisted.selectWhere.mockResolvedValueOnce([{ n8n_api_key: 'k' }])
    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
  })
})

