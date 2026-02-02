/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  OpenAIStream: vi.fn(),
  OpenAIError: class OpenAIError extends Error {},
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('@/utils/server', () => ({
  OpenAIError: hoisted.OpenAIError,
  OpenAIStream: hoisted.OpenAIStream,
}))

import handler from '~/pages/api/imageDescription'

describe('imageDescription API', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'GET' }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 500 when OpenAIStream returns invalid response', async () => {
    hoisted.OpenAIStream.mockResolvedValueOnce(null)
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { contentArray: [], llmProviders: {}, model: { id: 'gpt-4o' } },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('returns 200 with OpenAIStream response', async () => {
    hoisted.OpenAIStream.mockResolvedValueOnce({ choices: [] })
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { contentArray: [], llmProviders: {}, model: { id: 'gpt-4o' } },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 400 for OpenAIError', async () => {
    hoisted.OpenAIStream.mockRejectedValueOnce(new hoisted.OpenAIError('bad'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { contentArray: [], llmProviders: {}, model: { id: 'gpt-4o' } },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 500 for unexpected errors', async () => {
    hoisted.OpenAIStream.mockRejectedValueOnce(new Error('boom'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { contentArray: [], llmProviders: {}, model: { id: 'gpt-4o' } },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
