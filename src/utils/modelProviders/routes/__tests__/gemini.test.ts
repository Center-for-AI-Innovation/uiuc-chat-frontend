/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

vi.mock('~/utils/crypto', () => ({
  decryptKeyIfNeeded: vi.fn(async (k: string) => `dec:${k}`),
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => (modelId: string) => ({ id: modelId })),
}))

const aiHoisted = vi.hoisted(() => {
  const streamText = vi.fn()
  const generateText = vi.fn()
  return { streamText, generateText }
})
vi.mock('ai', () => ({
  streamText: aiHoisted.streamText,
  generateText: aiHoisted.generateText,
}))

import { getGeminiModels, runGeminiChat } from '../gemini'
import { GeminiModelID } from '../../types/gemini'

describe('getGeminiModels', () => {
  it('returns empty models when disabled or missing key', async () => {
    const provider: any = { enabled: false, apiKey: '' }
    const result = await getGeminiModels(provider)
    expect(result.models).toEqual([])
  })

  it('returns empty models when disabled even if a key is present', async () => {
    const provider: any = {
      enabled: false,
      apiKey: 'k',
      models: [{ id: GeminiModelID.Gemini_2_0_Flash, enabled: false }],
    }
    const result = await getGeminiModels(provider)
    expect(result.models).toEqual([])
  })

  it('preserves existing model state and sorts models', async () => {
    const provider: any = {
      enabled: true,
      apiKey: 'k',
      models: [
        { id: GeminiModelID.Gemini_2_0_Flash, enabled: false, default: true },
      ],
    }

    const result = await getGeminiModels(provider)
    const models = result.models ?? []
    const preserved = models.find(
      (m: any) => m.id === GeminiModelID.Gemini_2_0_Flash,
    )
    expect(preserved).toMatchObject({ enabled: false, default: true })
    expect(models.length).toBeGreaterThan(0)
  })
})

describe('runGeminiChat', () => {
  it('validates required inputs', async () => {
    await expect(
      runGeminiChat(null as any, { apiKey: 'k' } as any),
    ).rejects.toThrow(/conversation is missing/i)
    await expect(
      runGeminiChat({ messages: [] } as any, { apiKey: '' } as any),
    ).rejects.toThrow(/api key is missing/i)
    await expect(
      runGeminiChat({ messages: [] } as any, { apiKey: 'k' } as any),
    ).rejects.toThrow(/messages array is empty/i)
  })

  it('throws on invalid model id', async () => {
    const conversation: any = {
      model: { id: 'not-a-gemini', tokenLimit: 10 },
      temperature: 0.2,
      messages: [
        { id: 'u1', role: 'user', content: 'hi', latestSystemMessage: 'sys' },
      ],
    }
    await expect(
      runGeminiChat(conversation, { apiKey: 'k' } as any),
    ).rejects.toThrow(/invalid gemini model id/i)
  })

  it('streams via streamText when stream=true', async () => {
    aiHoisted.streamText.mockResolvedValueOnce({
      toTextStreamResponse: () => new Response('stream', { status: 200 }),
    })

    const conversation: any = {
      model: { id: GeminiModelID.Gemini_2_0_Flash, tokenLimit: 10 },
      temperature: 0.2,
      messages: [
        { id: 'u1', role: 'user', content: 'hi', latestSystemMessage: 'sys' },
      ],
    }

    const res = await runGeminiChat(conversation, { apiKey: 'k' } as any, true)
    expect(res).toBeInstanceOf(Response)
    await expect(res.text()).resolves.toBe('stream')
  })

  it('converts conversation messages to CoreMessage format', async () => {
    aiHoisted.streamText.mockResolvedValueOnce({
      toTextStreamResponse: () => new Response('stream', { status: 200 }),
    })

    const conversation: any = {
      model: { id: GeminiModelID.Gemini_2_0_Flash, tokenLimit: 10 },
      temperature: 0.2,
      messages: [
        { id: 's1', role: 'system', content: 'ignored' },
        {
          id: 'u1',
          role: 'user',
          content: [
            { type: 'text', text: 'hello' },
            { type: 'image_url', image_url: { url: 'x' } },
          ],
        },
        { id: 'a1', role: 'assistant', content: 'ok' },
        {
          id: 'u2',
          role: 'user',
          content: 'original',
          finalPromtEngineeredMessage: 'ENGINEERED',
          latestSystemMessage: 'SYS',
        },
      ],
    }

    await runGeminiChat(conversation, { apiKey: 'k' } as any, true)

    const call = aiHoisted.streamText.mock.calls[0]?.[0] as any
    const msgs = call.messages as any[]
    expect(msgs[0]).toMatchObject({ role: 'system', content: 'SYS' })
    expect(msgs.some((m) => m.content === 'hello')).toBe(true)
    expect(msgs.some((m) => m.content === 'ENGINEERED')).toBe(true)
  })

  it('returns NextResponse.json when stream=false', async () => {
    aiHoisted.generateText.mockResolvedValueOnce({ text: 'hello' })

    const conversation: any = {
      model: { id: GeminiModelID.Gemini_2_0_Flash, tokenLimit: 10 },
      temperature: 0.2,
      messages: [
        { id: 'u1', role: 'user', content: 'hi', latestSystemMessage: 'sys' },
      ],
    }

    const res = await runGeminiChat(conversation, { apiKey: 'k' } as any, false)
    expect(res).toBeInstanceOf(Response)
    await expect(res.json()).resolves.toMatchObject({
      choices: [{ message: { content: 'hello' } }],
    })
  })

  it('wraps specific permission errors with a friendly message', async () => {
    aiHoisted.streamText.mockRejectedValueOnce(
      new Error('Developer instruction is not enabled'),
    )

    const conversation: any = {
      model: { id: GeminiModelID.Gemini_2_0_Flash, tokenLimit: 10 },
      temperature: 0.2,
      messages: [
        { id: 'u1', role: 'user', content: 'hi', latestSystemMessage: 'sys' },
      ],
    }

    await expect(
      runGeminiChat(conversation, { apiKey: 'k' } as any, true),
    ).rejects.toThrow(/does not have access/i)
  })

  it('rethrows other errors from the AI SDK', async () => {
    aiHoisted.streamText.mockRejectedValueOnce(new Error('boom'))

    const conversation: any = {
      model: { id: GeminiModelID.Gemini_2_0_Flash, tokenLimit: 10 },
      temperature: 0.2,
      messages: [
        { id: 'u1', role: 'user', content: 'hi', latestSystemMessage: 'sys' },
      ],
    }

    await expect(
      runGeminiChat(conversation, { apiKey: 'k' } as any, true),
    ).rejects.toThrow(/boom/i)
  })
})
