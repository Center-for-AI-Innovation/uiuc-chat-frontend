import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))

  const insertValues = vi.fn()
  const insert = vi.fn(() => ({ values: insertValues }))

  const updateWhere = vi.fn()
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set: updateSet }))

  return {
    db: { select, insert, update },
    apiKeys: { key: {}, is_active: {}, email: {}, user_id: {} },
    selectWhere,
    insertValues,
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
  eq: () => ({}),
}))

import handler from '~/pages/api/chat-api/keys/generate'

describe('chat-api/keys/generate', () => {
  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when user email or id is missing', async () => {
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', user: { sub: 'u1' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)

    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', user: { email: 'a@b.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)
  })

  it('returns 409 when user already has an active API key', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([{ key: 'uc_x', is_active: true }])
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'a@b.com', sub: 'u1' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('inserts a new key when none exist and updates when an inactive key exists', async () => {
    hoisted.selectWhere.mockResolvedValueOnce([])
    hoisted.insertValues.mockResolvedValueOnce({ ok: true })

    const res1 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'a@b.com', sub: 'u1' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(hoisted.insertValues).toHaveBeenCalled()

    hoisted.selectWhere.mockResolvedValueOnce([
      { key: 'uc_old', is_active: false },
    ])
    hoisted.updateWhere.mockResolvedValueOnce(undefined)
    const res2 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'a@b.com', sub: 'u1' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(hoisted.updateWhere).toHaveBeenCalled()
  })
})

