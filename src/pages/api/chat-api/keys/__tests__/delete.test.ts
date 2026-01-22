import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const updateReturning = vi.fn()
  const updateWhere = vi.fn(() => ({ returning: updateReturning }))
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set: updateSet }))

  return {
    db: { update },
    apiKeys: { email: {} },
    updateReturning,
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
  eq: () => ({}),
}))

import handler from '../delete'

describe('chat-api/keys/delete', () => {
  it('returns 405 for non-DELETE', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when email missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'DELETE', user: {} }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 500 when no key was found, otherwise returns 200', async () => {
    hoisted.updateReturning.mockResolvedValueOnce([])
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'DELETE', user: { email: 'a@b.com' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(500)

    hoisted.updateReturning.mockResolvedValueOnce([{ key: 'uc_key' }])
    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'DELETE', user: { email: 'a@b.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
  })
})

