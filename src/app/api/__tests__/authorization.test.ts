/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  extractCourseName,
  getCourseMetadata,
  hasCourseAccess,
  withCourseAccessFromRequest,
} from '../authorization'
import type { AuthenticatedUser } from '~/middleware'
import type { AuthenticatedRequest } from '~/utils/appRouterAuth'
import type { CourseMetadata } from '~/types/courseMetadata'

const hoisted = vi.hoisted(() => ({
  hGet: vi.fn(),
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: vi.fn(async () => ({
    hGet: hoisted.hGet,
  })),
}))

vi.mock('~/utils/appRouterAuth', () => ({
  withAppRouterAuth: (fn: (req: unknown) => unknown) => (req: unknown) =>
    fn(req),
}))

type TestRequest = AuthenticatedRequest & {
  courseName?: string
  user?: AuthenticatedUser
}

describe('app/api authorization helpers', () => {
  it('extractCourseName ignores body parse errors', async () => {
    const req = new NextRequest('http://localhost/api', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })

    await expect(extractCourseName(req)).resolves.toBeNull()
  })

  it('extractCourseName reads from query, headers, and JSON body', async () => {
    await expect(
      extractCourseName(
        new NextRequest('http://localhost/api?courseName=Q', { method: 'GET' }),
      ),
    ).resolves.toBe('Q')

    const withHeader = new NextRequest('http://localhost/api', {
      method: 'GET',
      headers: { 'x-course-name': 'H' },
    })
    await expect(extractCourseName(withHeader)).resolves.toBe('H')

    const withBody = new NextRequest('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ course_name: 'B' }),
      headers: { 'content-type': 'application/json' },
    })
    await expect(extractCourseName(withBody)).resolves.toBe('B')
  })

  it('getCourseMetadata returns null on missing or malformed redis values', async () => {
    hoisted.hGet.mockResolvedValueOnce(null)
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()

    hoisted.hGet.mockResolvedValueOnce('not-json')
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()
  })

  it('getCourseMetadata returns parsed JSON when present', async () => {
    hoisted.hGet.mockResolvedValueOnce(JSON.stringify({ is_private: false }))
    await expect(getCourseMetadata('CS101')).resolves.toMatchObject({
      is_private: false,
    })
  })

  it('hasCourseAccess checks admins/owners/approved/all-logged-in', () => {
    const user: AuthenticatedUser = {
      email: 'u@example.com',
    } as AuthenticatedUser
    expect(
      hasCourseAccess(user, {
        course_admins: ['u@example.com'],
        course_owner: 'owner@example.com',
        approved_emails_list: [],
        allow_logged_in_users: false,
      } as unknown as CourseMetadata),
    ).toBe(true)

    expect(
      hasCourseAccess(user, {
        course_admins: [],
        course_owner: 'u@example.com',
        approved_emails_list: [],
        allow_logged_in_users: false,
      } as unknown as CourseMetadata),
    ).toBe(true)

    expect(
      hasCourseAccess(user, {
        course_admins: [],
        course_owner: 'owner@example.com',
        approved_emails_list: ['u@example.com'],
        allow_logged_in_users: false,
      } as unknown as CourseMetadata),
    ).toBe(true)

    expect(
      hasCourseAccess(user, {
        course_admins: [],
        course_owner: 'owner@example.com',
        approved_emails_list: [],
        allow_logged_in_users: true,
      } as unknown as CourseMetadata),
    ).toBe(true)

    expect(
      hasCourseAccess(user, {
        course_admins: [],
        course_owner: 'owner@example.com',
        approved_emails_list: [],
        allow_logged_in_users: false,
      } as unknown as CourseMetadata),
    ).toBe(false)
  })

  it('withCourseAccessFromRequest allows unauthenticated access for public courses', async () => {
    hoisted.hGet.mockResolvedValueOnce(JSON.stringify({ is_private: false }))

    const handler = vi.fn(async (req: TestRequest) =>
      NextResponse.json({ ok: true, course: req.courseName }),
    )
    const wrapped = withCourseAccessFromRequest('any')(
      handler as unknown as (
        req: AuthenticatedRequest,
      ) => Promise<NextResponse>,
    )

    const req = new NextRequest('http://localhost/api?courseName=CS101', {
      method: 'GET',
    }) as unknown as TestRequest

    const res = await wrapped(req)
    expect(handler).toHaveBeenCalled()
    await expect(res.json()).resolves.toEqual({ ok: true, course: 'CS101' })
  })

  it('withCourseAccessFromRequest blocks frozen courses', async () => {
    hoisted.hGet.mockResolvedValueOnce(
      JSON.stringify({ is_private: false, is_frozen: true }),
    )

    const handler = vi.fn(async (_req: AuthenticatedRequest) =>
      NextResponse.json({ ok: true }),
    )
    const wrapped = withCourseAccessFromRequest('any')(handler)

    const req = new NextRequest('http://localhost/api?courseName=CS101', {
      method: 'GET',
    }) as unknown as TestRequest

    const res = await wrapped(req)
    expect(res.status).toBe(403)
    expect(handler).not.toHaveBeenCalled()
  })

  it('withCourseAccessFromRequest returns 400 when courseName is missing', async () => {
    const handler = vi.fn(async (_req: AuthenticatedRequest) =>
      NextResponse.json({ ok: true }),
    )
    const wrapped = withCourseAccessFromRequest('any')(handler)

    const req = new NextRequest('http://localhost/api', {
      method: 'GET',
    }) as unknown as TestRequest
    const res = await wrapped(req)
    expect(res.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()
  })

  it('withCourseAccessFromRequest returns 404 when course metadata is missing', async () => {
    hoisted.hGet.mockResolvedValueOnce(null)

    const handler = vi.fn(async (_req: AuthenticatedRequest) =>
      NextResponse.json({ ok: true }),
    )
    const wrapped = withCourseAccessFromRequest('any')(handler)

    const req = new NextRequest('http://localhost/api?courseName=CS101', {
      method: 'GET',
    }) as unknown as TestRequest
    const res = await wrapped(req)
    expect(res.status).toBe(404)
    expect(handler).not.toHaveBeenCalled()
  })

  it('withCourseAccessFromRequest enforces auth for private courses and validates access level', async () => {
    hoisted.hGet.mockResolvedValue(
      JSON.stringify({
        is_private: true,
        course_owner: 'owner@example.com',
        course_admins: ['admin@example.com'],
        approved_emails_list: [],
        allow_logged_in_users: false,
      }),
    )

    const handler = vi.fn(async (req: TestRequest) =>
      NextResponse.json({ ok: true, course: req.courseName }),
    )
    const wrapped = withCourseAccessFromRequest({
      POST: 'admin',
      DELETE: 'owner',
    })(
      handler as unknown as (
        req: AuthenticatedRequest,
      ) => Promise<NextResponse>,
    )

    const unauthReq = new NextRequest('http://localhost/api?courseName=CS101', {
      method: 'POST',
    }) as unknown as TestRequest
    expect((await wrapped(unauthReq)).status).toBe(401)

    const nonAdmin = new NextRequest('http://localhost/api?courseName=CS101', {
      method: 'POST',
    }) as unknown as TestRequest
    nonAdmin.user = { email: 'user@example.com' } as AuthenticatedUser
    expect((await wrapped(nonAdmin)).status).toBe(403)

    const asAdmin = new NextRequest('http://localhost/api?courseName=CS101', {
      method: 'POST',
    }) as unknown as TestRequest
    asAdmin.user = { email: 'admin@example.com' } as AuthenticatedUser
    expect((await wrapped(asAdmin)).status).toBe(200)

    const asOwnerWrong = new NextRequest(
      'http://localhost/api?courseName=CS101',
      {
        method: 'DELETE',
      },
    ) as unknown as TestRequest
    asOwnerWrong.user = { email: 'admin@example.com' } as AuthenticatedUser
    expect((await wrapped(asOwnerWrong)).status).toBe(403)

    const asOwner = new NextRequest('http://localhost/api?courseName=CS101', {
      method: 'DELETE',
    }) as unknown as TestRequest
    asOwner.user = { email: 'owner@example.com' } as AuthenticatedUser
    expect((await wrapped(asOwner)).status).toBe(200)
  })
})
