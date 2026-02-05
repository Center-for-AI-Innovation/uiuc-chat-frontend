import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    decryptKeyIfNeeded: vi.fn(async (k: string) => k),
    createAnthropic: vi.fn(() => (modelId: string) => ({ modelId })),
    smoothStream: vi.fn(() => ({ kind: 'smooth' })),
    streamText: vi.fn(async () => ({
      toTextStreamResponse: () => new Response('text-stream'),
      toDataStreamResponse: () => new Response('data-stream'),
    })),
    generateText: vi.fn(async () => ({ text: 'generated' })),
  }
})

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/crypto', () => ({
  decryptKeyIfNeeded: hoisted.decryptKeyIfNeeded,
}))

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: hoisted.createAnthropic,
}))

vi.mock('ai', () => ({
  smoothStream: hoisted.smoothStream,
  streamText: hoisted.streamText,
  generateText: hoisted.generateText,
}))

import { POST } from '../anthropic/route'

function makeConversation(overrides: any = {}) {
  return {
    id: 'c1',
    name: 'n',
    model: {
      id: 'claude-3-5-sonnet',
      name: 'Claude',
      extendedThinking: false,
    },
    prompt: 'prompt',
    temperature: 0.2,
    messages: [
      {
        id: 'm0',
        role: 'user',
        latestSystemMessage: 'sys',
        content: [
          { type: 'text', text: 'hello' },
          {
            type: 'file',
            fileName: 'a.txt',
            fileType: 'text/plain',
            fileSize: 2048,
          },
        ],
      },
      { id: 'm1', role: 'assistant', content: 'ok' },
      {
        id: 'm2',
        role: 'user',
        content: [{ type: 'text', text: 'ask' }],
        finalPromtEngineeredMessage: 'engineered',
      },
    ],
    ...overrides,
  }
}

describe('app/api/chat/anthropic POST', () => {
  it('returns JSON choices when stream=false', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        chatBody: {
          conversation: makeConversation(),
          llmProviders: { Anthropic: { apiKey: 'k' } },
          stream: false,
        },
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.choices?.[0]?.message?.content).toBe('generated')
    expect(hoisted.createAnthropic).toHaveBeenCalled()
  })

  it('streams via data stream when extended thinking enabled', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        chatBody: {
          conversation: makeConversation({
            model: {
              id: 'claude-3-7-sonnet-thinking',
              name: 'Claude',
              extendedThinking: true,
            },
          }),
          llmProviders: { Anthropic: { apiKey: 'k' } },
          stream: true,
        },
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('data-stream')
    expect(hoisted.smoothStream).toHaveBeenCalled()
  })

  it('streams text when thinking is disabled', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        chatBody: {
          conversation: makeConversation(),
          llmProviders: { Anthropic: { apiKey: 'k' } },
          stream: true,
        },
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('text-stream')
  })

  it('returns 500 when conversation is missing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        chatBody: {
          conversation: null,
          llmProviders: { Anthropic: { apiKey: 'k' } },
        },
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })

  it('returns 500 when api key is missing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        chatBody: {
          conversation: makeConversation(),
          llmProviders: { Anthropic: {} },
        },
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })

  it('returns 500 when conversation has no messages', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        chatBody: {
          conversation: makeConversation({ messages: [] }),
          llmProviders: { Anthropic: { apiKey: 'k' } },
        },
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
