/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  axiosPost: vi.fn(),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('axios', () => ({
  default: { post: hoisted.axiosPost },
}))

import handler from '~/pages/api/scrapeWeb'

describe('scrapeWeb API', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when url or courseName is missing', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST', body: { url: null, courseName: null } }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 500 when CRAWLEE_API_URL is not set', async () => {
    const old = process.env.CRAWLEE_API_URL
    delete process.env.CRAWLEE_API_URL

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { url: 'example.com', courseName: 'CS101', maxUrls: 2, scrapeStrategy: 'default' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)

    process.env.CRAWLEE_API_URL = old
  })

  it('posts to crawlee API with formatted url and match pattern', async () => {
    process.env.CRAWLEE_API_URL = 'http://crawlee'
    hoisted.axiosPost.mockResolvedValueOnce({ data: { ok: true } })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { url: 'example.com/path', courseName: 'CS101', maxUrls: 2, scrapeStrategy: 'default' },
      }) as any,
      res as any,
    )

    expect(hoisted.axiosPost).toHaveBeenCalledWith('http://crawlee', expect.any(Object))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 500 when axios throws', async () => {
    process.env.CRAWLEE_API_URL = 'http://crawlee'
    hoisted.axiosPost.mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { url: 'example.com', courseName: 'CS101', maxUrls: 2, scrapeStrategy: 'default' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

