/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  set: vi.fn(),
  hGet: vi.fn(),
  hSet: vi.fn(),
}))

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (fn: any) => fn,
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (handler: any) => handler,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: vi.fn(async () => ({
    set: hoisted.set,
    hGet: hoisted.hGet,
    hSet: hoisted.hSet,
  })),
}))

import setCourseExistsHandler from '~/pages/api/UIUC-api/setCourseExists'
import setCourseMetadataHandler from '~/pages/api/UIUC-api/setCourseMetadata'
import setCoursePublicOrPrivateHandler from '~/pages/api/UIUC-api/setCoursePublicOrPrivate'

describe('UIUC-api course metadata setters', () => {
  beforeEach(() => {
    hoisted.set.mockReset()
    hoisted.hGet.mockReset()
    hoisted.hSet.mockReset()
  })

  it('setCourseExists returns 200 on success and 500 on failure', async () => {
    hoisted.set.mockResolvedValueOnce(undefined)

    const res1 = createMockRes()
    await setCourseExistsHandler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(res1.json).toHaveBeenCalledWith({ success: true })

    hoisted.set.mockRejectedValueOnce(new Error('boom'))
    const res2 = createMockRes()
    await setCourseExistsHandler(
      createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(500)
    expect(res2.json).toHaveBeenCalledWith({ success: false })
  })

  it('setCoursePublicOrPrivate returns 200 on success and 500 on failures', async () => {
    hoisted.hGet.mockResolvedValueOnce(JSON.stringify({ is_private: false }))
    hoisted.hSet.mockResolvedValueOnce(undefined)

    const res1 = createMockRes()
    await setCoursePublicOrPrivateHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', is_private: 'true' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)
    expect(res1.json).toHaveBeenCalledWith({ success: true })
    expect(hoisted.hSet).toHaveBeenCalledWith('course_metadatas', {
      CS101: JSON.stringify({ is_private: true }),
    })

    hoisted.hGet.mockResolvedValueOnce(null)
    const res2 = createMockRes()
    await setCoursePublicOrPrivateHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', is_private: 'false' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(500)

    hoisted.hGet.mockResolvedValueOnce('not-json')
    const res3 = createMockRes()
    await setCoursePublicOrPrivateHandler(
      createMockReq({
        method: 'POST',
        body: { course_name: 'CS101', is_private: 'false' },
      }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(500)
  })

  it('setCourseMetadata returns 405/500 for non-POST and 200 for POST', async () => {
    const res1 = createMockRes()
    await setCourseMetadataHandler(
      createMockReq({ method: 'GET', query: { course_name: 'CS101' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(405)
    expect(res1.status).toHaveBeenCalledWith(500)

    hoisted.hSet.mockResolvedValueOnce(undefined)
    const res2 = createMockRes()
    await setCourseMetadataHandler(
      createMockReq({
        method: 'POST',
        query: {
          course_name: 'CS101',
          course_owner: 'owner@example.com',
          is_private: 'true',
          course_admins: JSON.stringify(['admin@example.com']),
          approved_emails_list: JSON.stringify(['student@example.com']),
          example_questions: JSON.stringify(['q1']),
          system_prompt: JSON.stringify(['s']),
          disabled_models: JSON.stringify([]),
          project_description: JSON.stringify(['desc']),
        },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({ success: true })
    expect(hoisted.hSet).toHaveBeenCalledWith('course_metadatas', {
      CS101: expect.any(String),
    })
  })

  it('setCourseMetadata returns 500 when redis fails', async () => {
    const { ensureRedisConnected } = await import('~/utils/redisClient')
    vi.mocked(ensureRedisConnected).mockRejectedValueOnce(new Error('boom'))

    const res = createMockRes()
    await setCourseMetadataHandler(
      createMockReq({
        method: 'POST',
        query: { course_name: 'CS101', course_owner: 'owner@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

