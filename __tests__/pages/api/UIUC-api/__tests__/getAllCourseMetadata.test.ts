import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  const makeDbChain = () => {
    const chain: any = {}
    const methods = [
      'select',
      'from',
      'where',
      'groupBy',
      'limit',
      'orderBy',
      'innerJoin',
      'leftJoin',
    ]
    for (const m of methods) chain[m] = (..._args: unknown[]) => chain
    chain.then = (onFulfilled: any, onRejected?: any) =>
      Promise.resolve([] as unknown[]).then(onFulfilled, onRejected)
    return chain
  }

  return {
    ensureRedisConnected: vi.fn(),
    hGetAll: vi.fn(),
    getBatchProjectTimestamps: vi.fn(
      async () =>
        new Map<
          string,
          { created_at: string | null; last_updated_at: string | null }
        >(),
    ),
    db: makeDbChain(),
  }
})

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: hoisted.ensureRedisConnected,
}))

vi.mock('~/utils/projectTimestamps', () => ({
  getBatchProjectTimestamps: hoisted.getBatchProjectTimestamps,
}))

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
}))

vi.mock('~/db/schema', () => ({
  conversations: {
    project_name: 'project_name',
    updated_at: 'updated_at',
    user_email: 'user_email',
  },
}))

import handler, {
  getAllCourseMetadata,
  getCoursesByOwnerOrAdmin,
} from '~/pages/api/UIUC-api/getAllCourseMetadata'

describe('UIUC-api/getAllCourseMetadata', () => {
  beforeEach(() => {
    hoisted.ensureRedisConnected.mockReset()
    hoisted.hGetAll.mockReset()
    hoisted.getBatchProjectTimestamps.mockReset()
    hoisted.getBatchProjectTimestamps.mockResolvedValue(new Map())
  })

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
    await handler(
      createMockReq({ method: 'GET', user: {} }) as any,
      res1 as any,
    )
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
      createMockReq({
        method: 'GET',
        user: { email: 'owner@example.com' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
  })
})
