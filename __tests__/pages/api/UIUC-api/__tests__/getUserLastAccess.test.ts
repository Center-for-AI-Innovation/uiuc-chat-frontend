import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  getUserLastAccessForCourse: vi.fn(),
}))

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/pages/api/UIUC-api/getCourseMetadata', () => ({
  getUserLastAccessForCourse: hoisted.getUserLastAccessForCourse,
}))

import handler from '~/pages/api/UIUC-api/getUserLastAccess'

describe('UIUC-api/getUserLastAccess', () => {
  beforeEach(() => {
    hoisted.getUserLastAccessForCourse.mockReset()
  })

  it('returns 405 for non-GET', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'me@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when course_name is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 401 when no email is present', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: {},
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns last_accessed_at on success', async () => {
    hoisted.getUserLastAccessForCourse.mockResolvedValueOnce(
      '2026-01-01T00:00:00Z',
    )
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.getUserLastAccessForCourse).toHaveBeenCalledWith(
      'me@example.com',
      'CS101',
    )
    expect(res.json).toHaveBeenCalledWith({
      last_accessed_at: '2026-01-01T00:00:00Z',
    })
  })

  it('returns 500 when the lookup throws', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    hoisted.getUserLastAccessForCourse.mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
