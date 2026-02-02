import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return {
    getCourseMetadata: vi.fn(),
    ensureRedisConnected: vi.fn(),
    encrypt: vi.fn(async () => 'enc'),
    isEncrypted: vi.fn(() => false),
    hSet: vi.fn(),
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/pages/api/UIUC-api/getCourseMetadata', () => ({
  getCourseMetadata: hoisted.getCourseMetadata,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: hoisted.ensureRedisConnected,
}))

vi.mock('~/utils/superAdmins', () => ({
  superAdmins: ['admin@example.com'],
}))

vi.mock('~/utils/crypto', () => ({
  encrypt: hoisted.encrypt,
  isEncrypted: hoisted.isEncrypted,
}))

import handler from '~/pages/api/UIUC-api/upsertCourseMetadata'

describe('UIUC-api/upsertCourseMetadata', () => {
  it('returns 400 when courseName is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('combines metadata, encrypts key, and writes to redis', async () => {
    hoisted.getCourseMetadata.mockResolvedValueOnce({
      course_admins: [],
      is_private: undefined,
      openai_api_key: 'sk-plain',
    })
    hoisted.ensureRedisConnected.mockResolvedValueOnce({ hSet: hoisted.hSet })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          courseName: 'CS101',
          courseMetadata: { course_owner: 'owner@example.com' },
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.encrypt).toHaveBeenCalled()
    expect(hoisted.hSet).toHaveBeenCalled()
  })
})
