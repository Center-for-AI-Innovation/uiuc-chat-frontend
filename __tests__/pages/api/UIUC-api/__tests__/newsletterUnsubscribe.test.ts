import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const insertOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
  const insertValues = vi.fn(() => ({ onConflictDoUpdate: insertOnConflictDoUpdate }))
  const insert = vi.fn(() => ({ values: insertValues }))

  return {
    db: { insert },
    emailNewsletter: { email: {} },
    insertOnConflictDoUpdate,
  }
})

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
}))

vi.mock('~/db/schema', () => ({
  emailNewsletter: hoisted.emailNewsletter,
}))

import handler from '~/pages/api/UIUC-api/newsletterUnsubscribe'

describe('UIUC-api/newsletterUnsubscribe', () => {
  it('returns 200 on success and 500 on db error', async () => {
    const res1 = createMockRes()
    await handler(createMockReq({ method: 'POST', body: { email: 'a@b.com' } }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(200)

    hoisted.insertOnConflictDoUpdate.mockRejectedValueOnce(new Error('boom'))
    const res2 = createMockRes()
    await handler(createMockReq({ method: 'POST', body: { email: 'a@b.com' } }) as any, res2 as any)
    expect(res2.status).toHaveBeenCalledWith(500)
  })
})

