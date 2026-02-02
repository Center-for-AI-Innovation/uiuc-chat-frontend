/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import handler from '~/pages/api/healthcheck'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('redis', () => ({
  createClient: hoisted.createClient,
}))

describe('healthcheck API', () => {
  it('returns UP when Redis is not configured', async () => {
    const old = process.env.REDIS_URL
    delete process.env.REDIS_URL

    const res = createMockRes()
    await handler(createMockReq() as any, res as any)

    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0]?.[0]
    expect(payload.status).toBe('UP')
    expect(payload.checks.redis.status).toBe('skipped')

    process.env.REDIS_URL = old
  })

  it('returns DOWN when Redis check fails', async () => {
    const old = process.env.REDIS_URL
    process.env.REDIS_URL = 'redis://localhost:6379'

    hoisted.createClient.mockReturnValueOnce({
      connect: vi.fn(async () => {
        throw new Error('boom')
      }),
      ping: vi.fn(),
      disconnect: vi.fn(),
    })

    const res = createMockRes()
    await handler(createMockReq() as any, res as any)

    expect(res.status).toHaveBeenCalledWith(500)
    const payload = (res.json as any).mock.calls[0]?.[0]
    expect(payload.status).toBe('DOWN')
    expect(payload.checks.redis.status).toBe('error')

    process.env.REDIS_URL = old
  })
})

