import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return {
    checkCourseExists: vi.fn(),
  }
})

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/pages/api/UIUC-api/getCourseExists', () => ({
  checkCourseExists: hoisted.checkCourseExists,
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: () => 'http://backend',
}))

import handler from '~/pages/api/UIUC-api/createProject'

describe('UIUC-api/createProject', () => {
  it('returns 405 for non-POST', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 for missing required fields', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: { project_name: 'x' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 409 when project exists and 503 when existence check fails', async () => {
    hoisted.checkCourseExists.mockResolvedValueOnce(true)
    const res1 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { project_name: 'x', project_owner_email: 'o@example.com' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(409)

    hoisted.checkCourseExists.mockRejectedValueOnce(new Error('redis down'))
    const res2 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { project_name: 'x', project_owner_email: 'o@example.com' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(503)
  })

  it('returns 200 on success and propagates backend failure status', async () => {
    hoisted.checkCourseExists.mockResolvedValueOnce(false)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const res1 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { project_name: 'x', project_owner_email: 'o@example.com' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)

    hoisted.checkCourseExists.mockResolvedValueOnce(false)
    fetchSpy.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    const res2 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { project_name: 'x', project_owner_email: 'o@example.com' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(500)

    fetchSpy.mockRestore()
  })
})
