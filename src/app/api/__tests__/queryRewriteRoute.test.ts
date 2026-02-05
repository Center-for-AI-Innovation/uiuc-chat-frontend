import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    routeModelRequest: vi.fn(async () => new Response('ok')),
  }
})

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/streamProcessing', () => ({
  routeModelRequest: hoisted.routeModelRequest,
}))

import { POST } from '../queryRewrite/route'

describe('app/api/queryRewrite POST', () => {
  it('returns the underlying routeModelRequest response', async () => {
    hoisted.routeModelRequest.mockResolvedValueOnce(new Response('worked'))
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ any: 'body' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('worked')
  })

  it('returns 500 on errors', async () => {
    hoisted.routeModelRequest.mockRejectedValueOnce(new Error('boom'))
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ any: 'body' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
