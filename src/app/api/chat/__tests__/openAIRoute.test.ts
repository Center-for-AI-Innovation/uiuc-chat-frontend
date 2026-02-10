import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    decrypt: vi.fn(async (v: string) => v),
    createOpenAI: vi.fn(() => (modelId: string) => ({ modelId })),
    streamText: vi.fn(async () => ({
      toTextStreamResponse: () =>
        new Response('stream-body', { headers: { 'x-test': '1' } }),
    })),
    generateText: vi.fn(async () => ({ text: 'ok' })),
  }
})

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/crypto', () => ({
  decrypt: hoisted.decrypt,
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: hoisted.createOpenAI,
}))

vi.mock('ai', () => ({
  streamText: hoisted.streamText,
  generateText: hoisted.generateText,
}))

import { POST } from '../openAI/route'

describe('app/api/chat/openAI POST', () => {
  it('returns 401 when missing Authorization header', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization is not Bearer', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Token sk-real' },
      body: JSON.stringify({ messages: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('decrypts non-sk keys and returns JSON when stream=false', async () => {
    process.env.NEXT_PUBLIC_SIGNING_KEY = 'signing'
    hoisted.decrypt.mockResolvedValueOnce('sk-real')
    hoisted.generateText.mockResolvedValueOnce({ text: 'hello' })

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer encrypted-key' },
      body: JSON.stringify({ messages: [], model: 'gpt-4o', stream: false }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.choices?.[0]?.message?.content).toBe('hello')
    expect(hoisted.decrypt).toHaveBeenCalled()
  })

  it('returns 401 when api key is undefined or equals VLADS_OPENAI_KEY', async () => {
    process.env.VLADS_OPENAI_KEY = 'sk-vlad'

    const req1 = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer undefined' },
      body: JSON.stringify({ messages: [] }),
    })
    const r1 = await POST(req1 as any)
    expect(r1.status).toBe(401)

    const req2 = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer sk-vlad' },
      body: JSON.stringify({ messages: [] }),
    })
    const r2 = await POST(req2 as any)
    expect(r2.status).toBe(401)
  })

  it('returns 401 when decrypt resolves to invalid/non-user key', async () => {
    process.env.NEXT_PUBLIC_SIGNING_KEY = 'signing'
    process.env.VLADS_OPENAI_KEY = 'sk-vlad'
    hoisted.decrypt.mockResolvedValueOnce(process.env.VLADS_OPENAI_KEY)

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer encrypted-key' },
      body: JSON.stringify({ messages: [], stream: false }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)

    hoisted.decrypt.mockResolvedValueOnce('not-a-key')
    const req2 = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer encrypted-key-2' },
      body: JSON.stringify({ messages: [], stream: false }),
    })
    const res2 = await POST(req2 as any)
    expect(res2.status).toBe(401)
  })

  it('returns 401 when decrypt throws', async () => {
    process.env.NEXT_PUBLIC_SIGNING_KEY = 'signing'
    hoisted.decrypt.mockRejectedValueOnce(new Error('bad'))

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer not-a-key' },
      body: JSON.stringify({ messages: [], stream: false }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('streams when stream=true', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer sk-real' },
      body: JSON.stringify({ messages: [], stream: true }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('stream-body')
  })
})
