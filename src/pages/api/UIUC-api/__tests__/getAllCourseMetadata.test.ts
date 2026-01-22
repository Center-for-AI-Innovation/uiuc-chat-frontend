import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return {
    ensureRedisConnected: vi.fn(),
    hGetAll: vi.fn(),
  }
})

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: hoisted.ensureRedisConnected,
}))

import handler, {
  getAllCourseMetadata,
  getCoursesByOwnerOrAdmin,
} from '../getAllCourseMetadata'

describe('UIUC-api/getAllCourseMetadata', () => {
  it('getCoursesByOwnerOrAdmin filters by owner/admin and ignores invalid JSON', async () => {
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGetAll: hoisted.hGetAll.mockResolvedValueOnce({
        CS101: JSON.stringify({
          course_owner: 'owner@example.com',
          course_admins: [],
        }),
        CS102: JSON.stringify({
          course_owner: 'x@example.com',
          course_admins: ['admin@example.com'],
        }),
        BAD: '{not json',
      }),
    })
    const out = await getCoursesByOwnerOrAdmin('admin@example.com')
    expect(out.length).toBe(1)
  })

  it('getAllCourseMetadata returns [] when redis is empty and parses entries when present', async () => {
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGetAll: hoisted.hGetAll.mockResolvedValueOnce(null),
    })
    await expect(getAllCourseMetadata()).resolves.toEqual([])

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGetAll: hoisted.hGetAll.mockResolvedValueOnce({
        CS101: JSON.stringify({ course_owner: 'x', course_admins: [] }),
      }),
    })
    const out = await getAllCourseMetadata()
    expect(out[0]).toHaveProperty('CS101')
  })

  it('handler returns 400 without email and 200 with data', async () => {
    const res1 = createMockRes()
    await handler(createMockReq({ method: 'GET', user: {} }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(400)

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGetAll: hoisted.hGetAll.mockResolvedValueOnce({
        CS101: JSON.stringify({
          course_owner: 'owner@example.com',
          course_admins: [],
        }),
      }),
    })
    const res2 = createMockRes()
    await handler(
      createMockReq({ method: 'GET', user: { email: 'owner@example.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
  })
})

