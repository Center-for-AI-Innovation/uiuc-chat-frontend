/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  hGet: vi.fn(),
  hGetAll: vi.fn(),
  hExists: vi.fn(),
}))

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (fn: any) => fn,
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (handler: any) => handler,
  withCourseOwnerOrAdminAccess: () => (handler: any) => handler,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: vi.fn(async () => ({
    hGet: hoisted.hGet,
    hGetAll: hoisted.hGetAll,
    hExists: hoisted.hExists,
  })),
}))

import getAllCourseMetadataHandler, {
  getAllCourseMetadata,
  getCoursesByOwnerOrAdmin,
} from '~/pages/api/UIUC-api/getAllCourseMetadata'
import getAllCourseNamesHandler from '~/pages/api/UIUC-api/getAllCourseNames'
import getCourseExistsHandler, { checkCourseExists } from '~/pages/api/UIUC-api/getCourseExists'
import getCourseMetadataHandler, {
  getCourseMetadata,
} from '~/pages/api/UIUC-api/getCourseMetadata'

describe('UIUC-api course metadata routes', () => {
  beforeEach(() => {
    hoisted.hGet.mockReset()
    hoisted.hGetAll.mockReset()
    hoisted.hExists.mockReset()
  })

  it('getCourseMetadata returns parsed metadata or null', async () => {
    hoisted.hGet.mockResolvedValueOnce(
      JSON.stringify({ is_private: false, course_owner: 'owner@example.com' }),
    )
    await expect(getCourseMetadata('CS101')).resolves.toEqual({
      is_private: false,
      course_owner: 'owner@example.com',
    })

    hoisted.hGet.mockResolvedValueOnce(null)
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()

    hoisted.hGet.mockRejectedValueOnce(new Error('boom'))
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()
  })

  it('getCourseMetadata handler returns 404 when course is missing', async () => {
    hoisted.hGet.mockResolvedValueOnce(null)
    const res = createMockRes()
    await getCourseMetadataHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('getCourseMetadata handler returns 200 with metadata', async () => {
    hoisted.hGet.mockResolvedValueOnce(JSON.stringify({ is_private: true }))
    const res = createMockRes()
    await getCourseMetadataHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ course_metadata: { is_private: true } })
  })

  it('getCoursesByOwnerOrAdmin filters metadata based on owner/admin', async () => {
    hoisted.hGetAll.mockResolvedValueOnce({
      CS101: JSON.stringify({ course_owner: 'me@example.com', course_admins: [] }),
      CS102: JSON.stringify({
        course_owner: 'someone@example.com',
        course_admins: ['me@example.com'],
      }),
      BAD: 'not-json',
    })

    const result = await getCoursesByOwnerOrAdmin('me@example.com')
    expect(result).toHaveLength(2)
    expect(Object.keys(result[0] ?? {})[0]).toBe('CS101')
    expect(Object.keys(result[1] ?? {})[0]).toBe('CS102')
  })

  it('getAllCourseMetadata returns all entries when redis has data', async () => {
    hoisted.hGetAll.mockResolvedValueOnce({
      CS101: JSON.stringify({ is_private: false }),
      CS102: JSON.stringify({ is_private: true }),
    })

    const all = await getAllCourseMetadata()
    expect(all).toEqual([{ CS101: { is_private: false } }, { CS102: { is_private: true } }])
  })

  it('getAllCourseMetadata handler returns 400 when user email is missing', async () => {
    const res = createMockRes()
    await getAllCourseMetadataHandler(createMockReq({ user: null }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('getAllCourseMetadata handler returns 200 for user-owned/admin courses', async () => {
    hoisted.hGetAll.mockResolvedValueOnce({
      CS101: JSON.stringify({ course_owner: 'me@example.com', course_admins: [] }),
    })

    const res = createMockRes()
    await getAllCourseMetadataHandler(
      createMockReq({ user: { email: 'me@example.com' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{ CS101: { course_owner: 'me@example.com', course_admins: [] } }])
  })

  it('getAllCourseNames returns 400 when email is missing and 200 with course names', async () => {
    const res1 = createMockRes()
    await getAllCourseNamesHandler(createMockReq({ user: null }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(400)

    hoisted.hGetAll.mockResolvedValueOnce({
      CS101: JSON.stringify({ course_owner: 'me@example.com', course_admins: [] }),
    })
    const res2 = createMockRes()
    await getAllCourseNamesHandler(
      createMockReq({ user: { email: 'me@example.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({ all_course_names: ['CS101'] })
  })

  it('checkCourseExists returns boolean and handler returns false on failure', async () => {
    hoisted.hExists.mockResolvedValueOnce(true)
    await expect(checkCourseExists('CS101')).resolves.toBe(true)

    hoisted.hExists.mockResolvedValueOnce(false)
    await expect(checkCourseExists('CS101')).resolves.toBe(false)

    const res1 = createMockRes()
    hoisted.hExists.mockResolvedValueOnce(true)
    await getCourseExistsHandler(
      createMockReq({ query: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(res1.json).toHaveBeenCalledWith(true)

    const res2 = createMockRes()
    hoisted.hExists.mockRejectedValueOnce(new Error('boom'))
    await getCourseExistsHandler(
      createMockReq({ query: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(500)
    expect(res2.json).toHaveBeenCalledWith(false)
  })
})

