import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return {
    ensureRedisConnected: vi.fn(),
    redisGet: vi.fn(),
  }
})

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: hoisted.ensureRedisConnected,
}))

import handler from '~/pages/api/UIUC-api/getMaintenanceModeDetails'

describe('UIUC-api/getMaintenanceModeDetails', () => {
  it('returns maintenance texts and 500 on redis errors', async () => {
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      get: hoisted.redisGet
        .mockResolvedValueOnce('title')
        .mockResolvedValueOnce('body'),
    })
    const res1 = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(200)

    hoisted.ensureRedisConnected.mockRejectedValueOnce(new Error('boom'))
    const res2 = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res2 as any)
    expect(res2.status).toHaveBeenCalledWith(500)
  })
})
