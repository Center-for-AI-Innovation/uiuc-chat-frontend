/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

import handler from '~/pages/api/test-auth'

describe('test-auth API', () => {
  it('returns 405 for non-GET methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 200 with user info', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: {
          sub: 's',
          email: 'u@example.com',
          preferred_username: 'u',
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const body = (res.json as any).mock.calls[0]?.[0]
    expect(body.user.email).toBe('u@example.com')
  })
})

