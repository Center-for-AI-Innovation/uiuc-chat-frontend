import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    createOpenAI: vi.fn(() => (modelId: string) => ({ modelId })),
    streamText: vi.fn(async () => ({
      toTextStreamResponse: () => new Response('vlm-stream'),
    })),
    generateText: vi.fn(async () => ({ text: 'vlm-text' })),
    convertConversationToCoreMessagesWithoutSystem: vi.fn(() => []),
  }
})

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: hoisted.createOpenAI,
}))

vi.mock('ai', () => ({
  streamText: hoisted.streamText,
  generateText: hoisted.generateText,
}))

vi.mock('~/utils/apiUtils', () => ({
  convertConversationToCoreMessagesWithoutSystem:
    hoisted.convertConversationToCoreMessagesWithoutSystem,
}))

import { POST } from '../vlm/route'

describe('app/api/chat/vlm POST', () => {
  const conversation = {
    model: { id: 'vlm-model' },
    temperature: 0.2,
    messages: [{ role: 'user', content: 'hi' }],
  }

  it('returns JSON choices when stream=false', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ conversation, stream: false }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.choices?.[0]?.message?.content).toBe('vlm-text')
  })

  it('streams when stream=true', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ conversation, stream: true }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('vlm-stream')
  })

  it('returns 500 on handler errors', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        conversation: { model: { id: 'vlm-model' }, temperature: 0.2, messages: [] },
        stream: false,
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
