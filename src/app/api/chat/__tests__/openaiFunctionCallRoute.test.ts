import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    decryptKeyIfNeeded: vi.fn(async (k: string) => k),
    persistMessageServer: vi.fn(async () => undefined),
  }
})

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/crypto', () => ({
  decryptKeyIfNeeded: hoisted.decryptKeyIfNeeded,
}))

vi.mock('~/pages/api/conversation', () => ({
  persistMessageServer: hoisted.persistMessageServer,
}))

import { POST } from '../openaiFunctionCall/route'

describe('app/api/chat/openaiFunctionCall POST', () => {
  it('returns 400 when conversation has no last message', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ conversation: { messages: [] }, tools: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('adds OpenRouter headers and lowercases model id for OpenRouter base URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'hi', tool_calls: null } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const conversation: any = {
      prompt: 'p',
      projectName: 'CS101',
      userEmail: 'u@example.com',
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: [{ type: 'text', text: 'hello' }],
        },
      ],
    }

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        conversation,
        tools: [],
        providerBaseUrl: 'https://openrouter.ai/api/v1/',
        apiKey: 'k',
        modelId: 'SOME/Model',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer k',
          'HTTP-Referer': expect.any(String),
          'X-Title': expect.any(String),
        }),
        body: expect.any(String),
      }),
    )

    const [, init] = fetchSpy.mock.calls[0] ?? []
    const parsed = JSON.parse(String(init?.body))
    expect(parsed.model).toBe('some/model')

    fetchSpy.mockRestore()
  })

  it('returns an error when upstream responds not ok', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 502 }))

    const conversation: any = {
      prompt: 'p',
      projectName: 'CS101',
      userEmail: 'u@example.com',
      messages: [{ id: 'm1', role: 'user', content: 'hi' }],
    }

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        conversation,
        tools: [],
        openaiKey: 'sk-real',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(502)
    fetchSpy.mockRestore()
  })

  it('returns 500 when upstream JSON has no choices', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const conversation: any = {
      prompt: 'p',
      projectName: 'CS101',
      userEmail: 'u@example.com',
      messages: [{ id: 'm1', role: 'user', content: 'hi' }],
    }

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ conversation, tools: [], openaiKey: 'sk-real' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    fetchSpy.mockRestore()
  })

  it('formats image_url parts and appends image info for array message content', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok', tool_calls: null } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const conversation: any = {
      prompt: 'p',
      projectName: 'CS101',
      userEmail: 'u@example.com',
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: [
            { type: 'text', text: 'hello' },
            { type: 'image_url', image_url: { url: 'http://img' } },
          ],
        },
      ],
    }

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        conversation,
        tools: [],
        imageUrls: ['http://img'],
        imageDescription: 'desc',
        openaiKey: 'sk-real',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)

    const [, init] = fetchSpy.mock.calls[0] ?? []
    const payload = JSON.parse(String(init?.body))
    const last = payload.messages[payload.messages.length - 1]
    expect(Array.isArray(last.content)).toBe(true)
    expect(JSON.stringify(last.content)).toContain('image_url')
    expect(JSON.stringify(last.content)).toContain('Image URL(s):')

    fetchSpy.mockRestore()
  })

  it('returns tool_calls JSON and persists message when tool calls exist', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [{ id: 'call1', function: { name: 't', arguments: '{}' } }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const conversation: any = {
      prompt: 'p',
      projectName: 'CS101',
      userEmail: 'u@example.com',
      messages: [{ id: 'm1', role: 'user', content: 'hi' }],
    }

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        conversation,
        tools: [],
        imageUrls: ['http://img'],
        imageDescription: 'desc',
        openaiKey: 'sk-real',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.choices?.[0]?.message?.tool_calls?.[0]?.id).toBe('call1')
    expect(hoisted.persistMessageServer).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
