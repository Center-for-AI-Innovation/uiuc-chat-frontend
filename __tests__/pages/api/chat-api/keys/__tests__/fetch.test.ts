import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const deleteWhere = vi.fn()
  const del = vi.fn(() => ({ where: deleteWhere }))

  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))

  return {
    db: { delete: del, select },
    apiKeys: { key: {}, is_active: {}, email: {} },
    deleteWhere,
    selectWhere,
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
  apiKeys: hoisted.apiKeys,
}))

vi.mock('drizzle-orm', () => ({
  and: () => ({}),
  eq: () => ({}),
}))

import handler from '~/pages/api/chat-api/keys/fetch'

describe('chat-api/keys/fetch', () => {
  it('returns 405 for non-GET', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when email missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'GET', user: {} }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns null apiKey when no active key exists, otherwise returns key', async () => {
    hoisted.deleteWhere.mockResolvedValueOnce(null)
    hoisted.selectWhere.mockResolvedValueOnce([])
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', user: { email: 'a@b.com' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(res1.json).toHaveBeenCalledWith({ apiKey: null })

    hoisted.deleteWhere.mockResolvedValueOnce(null)
    hoisted.selectWhere.mockResolvedValueOnce([{ key: 'uc_key' }])
    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', user: { email: 'a@b.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({ apiKey: 'uc_key' })
  })
})

