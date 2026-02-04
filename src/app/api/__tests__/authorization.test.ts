import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    hGet: vi.fn(),
    ensureRedisConnected: vi.fn(),
    withAppRouterAuth: vi.fn(),
  }
})

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: hoisted.ensureRedisConnected,
}))

vi.mock('~/utils/appRouterAuth', () => ({
  withAppRouterAuth: (handler: any) => {
    hoisted.withAppRouterAuth(handler)
    return async (req: any) => handler(req)
  },
}))

import {
  extractCourseName,
  getCourseMetadata,
  hasCourseAccess,
  withCourseAccessFromRequest,
} from '../authorization'

describe('app/api/authorization', () => {
  it('extractCourseName finds course name from query params, headers, and body', async () => {
    const q = new Request('http://localhost/api?course_name=CS101', {
      method: 'GET',
    })
    await expect(extractCourseName(q as any)).resolves.toBe('CS101')

    const h = new Request('http://localhost/api', {
      method: 'GET',
      headers: { 'x-course-name': 'CS102' },
    })
    await expect(extractCourseName(h as any)).resolves.toBe('CS102')

    const b = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ projectName: 'CS103' }),
    })
    await expect(extractCourseName(b as any)).resolves.toBe('CS103')
  })

  it('hasCourseAccess checks owner/admin/approved/allow_logged_in_users', () => {
    const meta: any = {
      course_owner: 'owner@example.com',
      course_admins: ['admin@example.com'],
      approved_emails_list: ['allowed@example.com'],
      allow_logged_in_users: false,
    }

    expect(hasCourseAccess({ email: 'owner@example.com' } as any, meta)).toBe(
      true,
    )
    expect(hasCourseAccess({ email: 'admin@example.com' } as any, meta)).toBe(
      true,
    )
    expect(hasCourseAccess({ email: 'allowed@example.com' } as any, meta)).toBe(
      true,
    )
    expect(hasCourseAccess({ email: 'nope@example.com' } as any, meta)).toBe(
      false,
    )

    meta.allow_logged_in_users = true
    expect(hasCourseAccess({ email: 'any@example.com' } as any, meta)).toBe(
      true,
    )
  })

  it('getCourseMetadata returns parsed JSON and returns null on errors', async () => {
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: hoisted.hGet.mockResolvedValueOnce(
        JSON.stringify({ course_owner: 'x@example.com' }),
      ),
    })

    await expect(getCourseMetadata('CS101')).resolves.toMatchObject({
      course_owner: 'x@example.com',
    })

    hoisted.ensureRedisConnected.mockRejectedValueOnce(new Error('boom'))
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()
  })

  it('withCourseAccessFromRequest enforces course name and access levels', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('ok'))

    const wrapped = withCourseAccessFromRequest('any')(handler as any)
    const noCourseReq = new Request('http://localhost/api', { method: 'GET' })
    const r1 = await wrapped(noCourseReq as any)
    expect(r1.status).toBe(400)

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(null),
    })
    const missingCourseReq = new Request('http://localhost/api?course_name=X', {
      method: 'GET',
    })
    const r2 = await wrapped(missingCourseReq as any)
    expect(r2.status).toBe(404)

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi
        .fn()
        .mockResolvedValueOnce(JSON.stringify({ is_private: false })),
    })
    const publicReq = new Request('http://localhost/api?course_name=PUB', {
      method: 'GET',
    })
    const r3 = await wrapped(publicReq as any)
    expect(r3.status).toBe(200)
    expect(handler).toHaveBeenCalled()

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: true,
          course_owner: 'owner@example.com',
          course_admins: [],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const privateReqNoUser = new Request(
      'http://localhost/api?course_name=PRIV',
      { method: 'GET' },
    )
    const r4 = await wrapped(privateReqNoUser as any)
    expect(r4.status).toBe(401)

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: true,
          course_owner: 'owner@example.com',
          course_admins: [],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const privateReqDenied = Object.assign(
      new Request('http://localhost/api?course_name=PRIV', { method: 'GET' }),
      { user: { email: 'nope@example.com' } },
    )
    const r5 = await wrapped(privateReqDenied as any)
    expect(r5.status).toBe(403)

    const adminWrapped = withCourseAccessFromRequest('admin')(handler as any)
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: true,
          course_owner: 'owner@example.com',
          course_admins: ['admin@example.com'],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const privateReqNonAdmin = Object.assign(
      new Request('http://localhost/api?course_name=PRIV', { method: 'GET' }),
      { user: { email: 'nope@example.com' } },
    )
    const r6 = await adminWrapped(privateReqNonAdmin as any)
    expect(r6.status).toBe(403)

    const ownerWrapped = withCourseAccessFromRequest('owner')(handler as any)
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: true,
          course_owner: 'owner@example.com',
          course_admins: [],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const privateReqNonOwner = Object.assign(
      new Request('http://localhost/api?course_name=PRIV', { method: 'GET' }),
      { user: { email: 'admin@example.com' } },
    )
    const r7 = await ownerWrapped(privateReqNonOwner as any)
    expect(r7.status).toBe(403)

    // Success cases: admin + owner + allow_logged_in_users.
    handler.mockClear()
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: true,
          course_owner: 'owner@example.com',
          course_admins: ['admin@example.com'],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const privateReqAdmin = Object.assign(
      new Request('http://localhost/api?course_name=PRIV', { method: 'GET' }),
      { user: { email: 'admin@example.com' } },
    )
    const r8 = await adminWrapped(privateReqAdmin as any)
    expect(r8.status).toBe(200)
    expect(handler).toHaveBeenCalled()

    handler.mockClear()
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: true,
          course_owner: 'owner@example.com',
          course_admins: [],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const privateReqOwner = Object.assign(
      new Request('http://localhost/api?course_name=PRIV', { method: 'GET' }),
      { user: { email: 'owner@example.com' } },
    )
    const r9 = await ownerWrapped(privateReqOwner as any)
    expect(r9.status).toBe(200)

    handler.mockClear()
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: true,
          course_owner: 'owner@example.com',
          course_admins: [],
          approved_emails_list: [],
          allow_logged_in_users: true,
        }),
      ),
    })
    const allowLoggedIn = Object.assign(
      new Request('http://localhost/api?course_name=PRIV', { method: 'GET' }),
      { user: { email: 'someone@example.com' } },
    )
    const r10 = await wrapped(allowLoggedIn as any)
    expect(r10.status).toBe(200)

    // Method-specific access map.
    handler.mockClear()
    const mapWrapped = withCourseAccessFromRequest({ GET: 'admin' })(
      handler as any,
    )
    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: false,
          course_owner: 'owner@example.com',
          course_admins: ['admin@example.com'],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const mapReqNoUser = new Request('http://localhost/api?course_name=PUB', {
      method: 'GET',
    })
    const r11 = await mapWrapped(mapReqNoUser as any)
    expect(r11.status).toBe(401)

    hoisted.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          is_private: false,
          course_owner: 'owner@example.com',
          course_admins: ['admin@example.com'],
          approved_emails_list: [],
          allow_logged_in_users: false,
        }),
      ),
    })
    const mapReqAdmin = Object.assign(
      new Request('http://localhost/api?course_name=PUB', { method: 'GET' }),
      { user: { email: 'admin@example.com' } },
    )
    const r12 = await mapWrapped(mapReqAdmin as any)
    expect(r12.status).toBe(200)
  })
})
