/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

import {
  extractCourseName,
  getCourseMetadata,
  hasCourseAccess,
  isApprovedUser,
  isCourseAdmin,
  isCourseOwner,
  isCourseRegularUser,
  withCourseAccess,
  withCourseAdminAccess,
  withCourseOwnerAccess,
  withCourseOwnerOrAdminAccess,
  withCourseAccessFromRequest,
} from '~/pages/api/authorization'

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (fn: any) => fn,
}))

const hoisted = vi.hoisted(() => ({
  hGetMock: vi.fn(),
}))
vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: vi.fn(async () => ({
    hGet: hoisted.hGetMock,
  })),
}))

describe('authorization helpers', () => {
  it('extractCourseName finds course name from query/body/headers', () => {
    expect(extractCourseName(createMockReq({ query: { courseName: 'A' } }))).toBe('A')
    expect(
      extractCourseName(createMockReq({ query: { project_name: 'B' } })),
    ).toBe('B')
    expect(
      extractCourseName(createMockReq({ body: { course_name: 'C' } })),
    ).toBe('C')
    expect(
      extractCourseName(createMockReq({ headers: { 'x-course-name': 'D' } })),
    ).toBe('D')
    expect(extractCourseName(createMockReq())).toBeNull()
  })

  it('getCourseMetadata returns null when redis has no record or JSON parse fails', async () => {
    hoisted.hGetMock.mockResolvedValueOnce(null)
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()

    hoisted.hGetMock.mockResolvedValueOnce('not-json')
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()
  })

  it('getCourseMetadata returns parsed metadata when present', async () => {
    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        course_admins: ['admin@example.com'],
        course_owner: 'owner@example.com',
        approved_emails_list: ['approved@example.com'],
        allow_logged_in_users: false,
        is_private: true,
      }),
    )

    const meta = await getCourseMetadata('CS101')
    expect(meta?.course_owner).toBe('owner@example.com')
  })

  it('getCourseMetadata returns null when redis access throws', async () => {
    const { ensureRedisConnected } = await import('~/utils/redisClient')
    vi.mocked(ensureRedisConnected).mockRejectedValueOnce(new Error('boom'))
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()
  })

  it('computes access helpers correctly', () => {
    const meta: any = {
      course_admins: ['admin@example.com'],
      course_owner: 'owner@example.com',
      approved_emails_list: ['approved@example.com'],
      allow_logged_in_users: false,
      is_private: true,
    }

    expect(isCourseOwner({} as any, meta)).toBe(false)
    expect(isCourseAdmin({} as any, meta)).toBe(false)
    expect(isApprovedUser({} as any, meta)).toBe(false)
    expect(hasCourseAccess({ email: 'other@example.com' } as any, { ...meta, allow_logged_in_users: true })).toBe(
      true,
    )

    expect(isCourseOwner({ email: 'owner@example.com' } as any, meta)).toBe(true)
    expect(isCourseOwner({ email: 'x@example.com' } as any, meta)).toBe(false)
    expect(isCourseAdmin({ email: 'admin@example.com' } as any, meta)).toBe(true)
    expect(isApprovedUser({ email: 'approved@example.com' } as any, meta)).toBe(true)
    expect(hasCourseAccess({ email: 'approved@example.com' } as any, meta)).toBe(true)
    expect(isCourseRegularUser({ email: 'approved@example.com' } as any, meta)).toBe(true)
    expect(isCourseRegularUser({ email: 'admin@example.com' } as any, meta)).toBe(false)
  })

  it('withCourseAccess enforces authentication, course existence, and membership', async () => {
    const handler = vi.fn(async (_req: any, res: any) => res.status(200).json({ ok: true }))
    const wrapped = withCourseAccess('CS101')(handler)

    const res1 = createMockRes()
    await wrapped(
      createMockReq({ method: 'GET', user: null }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(401)

    hoisted.hGetMock.mockResolvedValueOnce(null)
    const res2 = createMockRes()
    await wrapped(
      createMockReq({ method: 'GET', user: { email: 'approved@example.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(404)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )
    const res3 = createMockRes()
    await wrapped(
      createMockReq({ method: 'GET', user: { email: 'someone@example.com' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(403)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        allow_logged_in_users: true,
      }),
    )
    const res4 = createMockRes()
    await wrapped(
      createMockReq({ method: 'GET', user: { email: 'someone@example.com' } }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(200)
    expect(handler).toHaveBeenCalled()
  })

  it('withCourseAdminAccess allows only admins/owners', async () => {
    const handler = vi.fn(async (_req: any, res: any) => res.status(200).json({ ok: true }))
    const wrapped = withCourseAdminAccess('CS101')(handler)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: ['admin@example.com'],
        approved_emails_list: ['approved@example.com'],
        allow_logged_in_users: false,
      }),
    )
    const res1 = createMockRes()
    await wrapped(
      createMockReq({ method: 'POST', user: { email: 'approved@example.com' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(403)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: ['admin@example.com'],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )
    const res2 = createMockRes()
    await wrapped(
      createMockReq({ method: 'POST', user: { email: 'admin@example.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )
    const res3 = createMockRes()
    await wrapped(
      createMockReq({ method: 'POST', user: { email: 'owner@example.com' } }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(200)
  })

  it('withCourseOwnerAccess allows only owners', async () => {
    const handler = vi.fn(async (_req: any, res: any) => res.status(200).json({ ok: true }))
    const wrapped = withCourseOwnerAccess('CS101')(handler)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: ['admin@example.com'],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )
    const res1 = createMockRes()
    await wrapped(
      createMockReq({ method: 'DELETE', user: { email: 'admin@example.com' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(403)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )
    const res2 = createMockRes()
    await wrapped(
      createMockReq({ method: 'DELETE', user: { email: 'owner@example.com' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
  })

  it('withCourseOwnerOrAdminAccess extracts course name and validates role', async () => {
    const handler = vi.fn(async (req: any, res: any) =>
      res.status(200).json({ ok: true, course: req.courseName }),
    )
    const wrapped = withCourseOwnerOrAdminAccess()(handler)

    const res1 = createMockRes()
    await wrapped(
      createMockReq({ method: 'POST', user: { email: 'owner@example.com' } }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: [],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )
    const res2 = createMockRes()
    await wrapped(
      createMockReq({
        method: 'POST',
        query: { courseName: 'CS101' },
        user: { email: 'approved@example.com' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(403)

    hoisted.hGetMock.mockResolvedValueOnce(null)
    const res3 = createMockRes()
    await wrapped(
      createMockReq({
        method: 'POST',
        query: { courseName: 'CS101' },
        user: { email: 'owner@example.com' },
      }) as any,
      res3 as any,
    )
    expect(res3.status).toHaveBeenCalledWith(404)

    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: ['admin@example.com'],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )
    const res4 = createMockRes()
    await wrapped(
      createMockReq({
        method: 'POST',
        query: { courseName: 'CS101' },
        user: { email: 'admin@example.com' },
      }) as any,
      res4 as any,
    )
    expect(res4.status).toHaveBeenCalledWith(200)
    expect(res4.json).toHaveBeenCalledWith({ ok: true, course: 'CS101' })
  })

  it('withCourseAccessFromRequest returns 400 when no course name is present', async () => {
    const handler = vi.fn()
    const wrapped = withCourseAccessFromRequest('any')(handler)

    const req = createMockReq({ method: 'GET' })
    const res = createMockRes()

    await wrapped(req as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('withCourseAccessFromRequest allows unauthenticated access to public courses', async () => {
    hoisted.hGetMock.mockResolvedValueOnce(
      JSON.stringify({
        is_private: false,
        allow_logged_in_users: false,
      }),
    )

    const handler = vi.fn(async (req: any, res: any) => res.status(200).json({ ok: true, course: req.courseName }))
    const wrapped = withCourseAccessFromRequest('any')(handler)

    const req = createMockReq({ method: 'GET', query: { courseName: 'CS101' } })
    const res = createMockRes()

    await wrapped(req as any, res as any)
    expect(handler).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ ok: true, course: 'CS101' })
  })

  it('withCourseAccessFromRequest enforces authentication for private courses', async () => {
    hoisted.hGetMock.mockResolvedValueOnce(JSON.stringify({ is_private: true }))

    const handler = vi.fn()
    const wrapped = withCourseAccessFromRequest('any')(handler)

    const req = createMockReq({ method: 'GET', query: { courseName: 'CS101' }, user: null })
    const res = createMockRes()

    await wrapped(req as any, res as any)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('withCourseAccessFromRequest supports method-specific access levels', async () => {
    hoisted.hGetMock.mockResolvedValue(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: ['admin@example.com'],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )

    const handler = vi.fn(async (_req: any, res: any) => res.status(200).json({ ok: true }))
    const wrapped = withCourseAccessFromRequest({ DELETE: 'owner', POST: 'admin' })(handler)

    const res1 = createMockRes()
    await wrapped(
      createMockReq({
        method: 'DELETE',
        query: { courseName: 'CS101' },
        user: { email: 'admin@example.com' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(403)

    const res2 = createMockRes()
    await wrapped(
      createMockReq({
        method: 'DELETE',
        query: { courseName: 'CS101' },
        user: { email: 'owner@example.com' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
  })
})
