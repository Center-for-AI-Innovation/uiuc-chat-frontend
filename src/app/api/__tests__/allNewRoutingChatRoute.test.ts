import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    routeModelRequest: vi.fn(async () => new Response('routed')),
    buildPrompt: vi.fn(async ({ conversation }: any) => conversation),
    reconstructConversation: vi.fn((c: any) => c),
    persistMessageServer: vi.fn(async () => undefined),
  }
})

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/streamProcessing', () => ({
  routeModelRequest: hoisted.routeModelRequest,
}))

vi.mock('~/app/utils/buildPromptUtils', () => ({
  buildPrompt: hoisted.buildPrompt,
}))

vi.mock('@/hooks/__internal__/conversation', () => ({
  reconstructConversation: hoisted.reconstructConversation,
}))

vi.mock('~/pages/api/conversation', () => ({
  persistMessageServer: hoisted.persistMessageServer,
}))

import { POST } from '../allNewRoutingChat/route'

describe('app/api/allNewRoutingChat POST', () => {
  it('builds prompt, persists last message, and routes request', async () => {
    hoisted.buildPrompt.mockResolvedValueOnce({
      id: 'c1',
      userEmail: 'u@example.com',
      messages: [{ id: 'm1', role: 'user', content: 'hi' }],
    })
    hoisted.routeModelRequest.mockResolvedValueOnce(new Response('done'))

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        course_name: 'CS101',
        conversation: { id: 'c1', messages: [] },
        courseMetadata: {},
        mode: 'chat',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('done')
    expect(hoisted.persistMessageServer).toHaveBeenCalled()
  })

  it('returns 500 response when route handler throws', async () => {
    hoisted.buildPrompt.mockRejectedValueOnce(new Error('boom'))
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        course_name: 'CS101',
        conversation: { id: 'c1' },
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
