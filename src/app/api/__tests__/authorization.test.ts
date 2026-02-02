import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  ensureRedisConnected: vi.fn(),
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: (...args: any[]) => mocks.ensureRedisConnected(...args),
}))

vi.mock('~/utils/appRouterAuth', () => ({
  withAppRouterAuth: (handler: any) => handler,
}))

describe('app/api/authorization', () => {
  beforeEach(() => {
    mocks.ensureRedisConnected.mockReset()
  })

  function makeReq({
    url,
    method = 'GET',
    body,
    headers,
    user,
  }: {
    url: string
    method?: string
    body?: any
    headers?: Record<string, string>
    user?: any
  }) {
    const headerBag = new Headers(headers)
    return {
      url,
      method,
      headers: headerBag,
      clone: () => ({
        json: async () => body,
      }),
      user,
    } as any
  }

  it('extractCourseName reads from query params', async () => {
    const req = new Request('https://example.test/api?courseName=CS101', {
      method: 'GET',
    })
    const { extractCourseName } = await import('../authorization')
    await expect(extractCourseName(req as any)).resolves.toBe('CS101')
  })

  it('extractCourseName reads from POST JSON body', async () => {
    const req = new Request('https://example.test/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ course_name: 'CS101' }),
    })
    const { extractCourseName } = await import('../authorization')
    await expect(extractCourseName(req as any)).resolves.toBe('CS101')
  })

  it('extractCourseName tolerates invalid JSON body', async () => {
    const req = new Request('https://example.test/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    })
    const { extractCourseName } = await import('../authorization')
    await expect(extractCourseName(req as any)).resolves.toBeNull()
  })

  it('withCourseAccessFromRequest returns 400 when course name is missing', async () => {
    const { withCourseAccessFromRequest } = await import('../authorization')
    const wrapped = withCourseAccessFromRequest('any')(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 }) as any
    })

    const res = await wrapped(new Request('https://example.test/api', { method: 'GET' }) as any)
    expect(res.status).toBe(400)
  })

  it('withCourseAccessFromRequest returns 404 when project does not exist', async () => {
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () => null),
    })

    const { withCourseAccessFromRequest } = await import('../authorization')
    const wrapped = withCourseAccessFromRequest('any')(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 }) as any
    })

    const res = await wrapped(
      new Request('https://example.test/api?courseName=CS101', { method: 'GET' }) as any,
    )
    expect(res.status).toBe(404)
  })

  it('withCourseAccessFromRequest returns 403 when project is frozen', async () => {
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () => JSON.stringify({ is_private: false, is_frozen: true })),
    })

    const { withCourseAccessFromRequest } = await import('../authorization')
    const wrapped = withCourseAccessFromRequest('any')(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 }) as any
    })

    const res = await wrapped(
      new Request('https://example.test/api?courseName=CS101', { method: 'GET' }) as any,
    )
    expect(res.status).toBe(403)
  })

  it('withCourseAccessFromRequest calls handler for public projects with access=any', async () => {
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () => JSON.stringify({ is_private: false, is_frozen: false })),
    })

    const handler = vi.fn(async () => {
      return new Response(JSON.stringify({ ok: true }), { status: 200 }) as any
    })
    const { withCourseAccessFromRequest } = await import('../authorization')
    const wrapped = withCourseAccessFromRequest('any')(handler as any)

    const res = await wrapped(
      new Request('https://example.test/api?courseName=CS101', { method: 'GET' }) as any,
    )
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalled()
  })

  it('hasCourseAccess returns true for admins/owner/approved/allow_logged_in_users', async () => {
    const { hasCourseAccess } = await import('../authorization')

    expect(
      hasCourseAccess(
        { email: 'a@x' } as any,
        { course_admins: ['a@x'] } as any,
      ),
    ).toBe(true)

    expect(
      hasCourseAccess(
        { email: 'o@x' } as any,
        { course_owner: 'o@x' } as any,
      ),
    ).toBe(true)

    expect(
      hasCourseAccess(
        { email: 'u@x' } as any,
        { approved_emails_list: ['u@x'] } as any,
      ),
    ).toBe(true)

    expect(
      hasCourseAccess(
        { email: 'any@x' } as any,
        { allow_logged_in_users: true } as any,
      ),
    ).toBe(true)
  })

  it('getCourseMetadata returns parsed metadata and returns null on errors', async () => {
    const { getCourseMetadata } = await import('../authorization')

    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () => JSON.stringify({ is_private: false, course_owner: 'o@x' })),
    })
    await expect(getCourseMetadata('CS101')).resolves.toMatchObject({
      is_private: false,
      course_owner: 'o@x',
    })

    mocks.ensureRedisConnected.mockRejectedValueOnce(new Error('boom'))
    await expect(getCourseMetadata('CS101')).resolves.toBeNull()
  })

  it('withCourseAccessFromRequest enforces auth for private projects', async () => {
    const { withCourseAccessFromRequest } = await import('../authorization')
    const handler = vi.fn(async () => new Response('ok', { status: 200 }) as any)

    // Private course: unauthenticated -> 401
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () => JSON.stringify({ is_private: true, is_frozen: false })),
    })
    const wrappedAny = withCourseAccessFromRequest('any')(handler as any)
    const res401 = await wrappedAny(
      makeReq({ url: 'https://example.test/api?courseName=CS101', method: 'GET' }),
    )
    expect(res401.status).toBe(401)

    // Private course: authenticated but not allowed -> 403
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () =>
        JSON.stringify({
          is_private: true,
          is_frozen: false,
          course_owner: 'owner@x',
          approved_emails_list: [],
          course_admins: [],
        }),
      ),
    })
    const res403 = await wrappedAny(
      makeReq({
        url: 'https://example.test/api?courseName=CS101',
        method: 'GET',
        user: { email: 'nope@x' },
      }),
    )
    expect(res403.status).toBe(403)

    // Private course: admin-required and user isn't admin -> 403
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () =>
        JSON.stringify({
          is_private: true,
          is_frozen: false,
          course_owner: 'owner@x',
          course_admins: ['admin@x'],
          approved_emails_list: ['user@x'],
        }),
      ),
    })
    const wrappedAdmin = withCourseAccessFromRequest('admin')(handler as any)
    const resAdmin403 = await wrappedAdmin(
      makeReq({
        url: 'https://example.test/api?courseName=CS101',
        method: 'POST',
        user: { email: 'user@x' },
      }),
    )
    expect(resAdmin403.status).toBe(403)

    // Private course: owner-required and user isn't owner -> 403
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () =>
        JSON.stringify({
          is_private: true,
          is_frozen: false,
          course_owner: 'owner@x',
          course_admins: ['admin@x'],
          approved_emails_list: ['user@x'],
        }),
      ),
    })
    const wrappedOwner = withCourseAccessFromRequest('owner')(handler as any)
    const resOwner403 = await wrappedOwner(
      makeReq({
        url: 'https://example.test/api?courseName=CS101',
        method: 'POST',
        user: { email: 'user@x' },
      }),
    )
    expect(resOwner403.status).toBe(403)

    // Private course: allowed + access any -> handler called
    mocks.ensureRedisConnected.mockResolvedValueOnce({
      hGet: vi.fn(async () =>
        JSON.stringify({
          is_private: true,
          is_frozen: false,
          course_owner: 'owner@x',
          course_admins: [],
          approved_emails_list: ['user@x'],
        }),
      ),
    })
    const resOk = await wrappedAny(
      makeReq({
        url: 'https://example.test/api?courseName=CS101',
        method: 'GET',
        user: { email: 'user@x' },
      }),
    )
    expect(resOk.status).toBe(200)
    expect(handler).toHaveBeenCalled()
  })
})
