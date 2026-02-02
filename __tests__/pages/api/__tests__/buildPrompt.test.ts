/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  buildPrompt: vi.fn(),
}))

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (h: any) => h,
}))

vi.mock('~/app/utils/buildPromptUtils', () => ({
  buildPrompt: hoisted.buildPrompt,
}))

import handler from '~/pages/api/buildPrompt'

describe('buildPrompt API', () => {
  it('returns 400 when conversation is missing', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST', body: { course_name: 'CS101' } }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 200 with updated conversation', async () => {
    hoisted.buildPrompt.mockResolvedValueOnce({ id: 'c1' })
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { conversation: { id: 'c1' }, course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ id: 'c1' })
  })
})

