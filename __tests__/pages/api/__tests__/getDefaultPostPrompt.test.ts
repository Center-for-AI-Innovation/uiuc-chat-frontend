/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  getDefaultPostPrompt: vi.fn(() => 'prompt'),
}))

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/app/utils/buildPromptUtils', () => ({
  getDefaultPostPrompt: hoisted.getDefaultPostPrompt,
}))

import handler from '~/pages/api/getDefaultPostPrompt'

describe('getDefaultPostPrompt API', () => {
  it('returns 200 with prompt', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 405 for non-GET methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })
})
