import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return {
    ensureRedisConnected: vi.fn(),
    encryptKeyIfNeeded: vi.fn(async (k: string) => `enc:${k}`),
    redisGet: vi.fn(),
    redisSet: vi.fn(),
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: hoisted.ensureRedisConnected,
}))

vi.mock('~/utils/crypto', () => ({
  encryptKeyIfNeeded: hoisted.encryptKeyIfNeeded,
}))

import handler from '~/pages/api/UIUC-api/upsertLLMProviders'

describe('UIUC-api/upsertLLMProviders', () => {
  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 for missing/invalid params', async () => {
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      get: hoisted.redisGet,
      set: hoisted.redisSet,
    })
    const res1 = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      get: hoisted.redisGet,
      set: hoisted.redisSet,
    })
    const res2 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { projectName: 'CS101', llmProviders: null },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(400)
  })

  it('encrypts provider keys and saves combined providers', async () => {
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      get: hoisted.redisGet.mockResolvedValueOnce(
        JSON.stringify({ OpenAI: { apiKey: 'old' } }),
      ),
      set: hoisted.redisSet.mockResolvedValueOnce(undefined),
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          projectName: 'CS101',
          llmProviders: { Anthropic: { apiKey: 'k', models: [] } },
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.encryptKeyIfNeeded).toHaveBeenCalledWith('k')
    expect(hoisted.redisSet).toHaveBeenCalled()
  })
})
