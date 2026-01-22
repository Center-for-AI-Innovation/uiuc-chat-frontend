import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))

  const updateWhere = vi.fn()
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set: updateSet }))

  return {
    db: { select, update },
    apiKeys: { key: {}, is_active: {}, email: {}, modified_at: {} },
    selectWhere,
    updateWhere,
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

import handler from '../rotate'

describe('chat-api/keys/rotate', () => {
  it('returns 405 for non-PUT', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when email missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'PUT', user: {} }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 404 when no active key exists', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'PUT',
        user: { email: 'a@b.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 200 when rotation succeeds', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([{ key: 'uc_old' }])
    hoisted.updateWhere.mockResolvedValueOnce(undefined)

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'PUT',
        user: { email: 'a@b.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

