import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  const modelsList = vi.fn()
  class OpenAI {
    models = { list: modelsList }
    constructor(_opts: any) {}
  }
  return { modelsList, OpenAI }
})

vi.mock('openai', () => ({ default: hoisted.OpenAI }))
vi.mock('~/utils/crypto', () => ({
  decryptKeyIfNeeded: vi.fn(async (k: string) => k),
}))

import { getOpenAIModels } from '../openai'
import { OpenAIModelID } from '../../types/openai'

describe('getOpenAIModels', () => {
  it('returns empty models when disabled', async () => {
    const provider: any = {
      enabled: false,
      apiKey: 'k',
      models: [{ id: OpenAIModelID.GPT_4o, enabled: true }],
    }

    const result = await getOpenAIModels(provider, 'proj')
    expect(result.models).toEqual([])
  })

  it('fetches models and adds gpt-5-thinking when gpt-5 exists', async () => {
    hoisted.modelsList.mockResolvedValueOnce({
      data: [
        { id: 'gpt-5' },
        { id: OpenAIModelID.GPT_4o },
        { id: 'not-supported' },
      ],
    })

    const provider: any = {
      enabled: true,
      apiKey: 'k',
      models: [
        {
          id: OpenAIModelID.GPT_4o,
          enabled: false,
          default: true,
          temperature: 0.9,
        },
      ],
    }

    const result = await getOpenAIModels(provider, 'proj')
    const models = result.models ?? []
    const ids = models.map((m: any) => m.id)
    expect(ids).toContain(OpenAIModelID.GPT_4o)
    expect(ids).toContain(OpenAIModelID.GPT_5_thinking)

    const gpt4o = models.find((m: any) => m.id === OpenAIModelID.GPT_4o)
    expect(gpt4o).toBeTruthy()
    expect(gpt4o!.enabled).toBe(false)
    expect(gpt4o!.default).toBe(true)
    expect(gpt4o!.temperature).toBe(0.9)
  })

  it('sets error and clears models on failures', async () => {
    hoisted.modelsList.mockRejectedValueOnce(new Error('boom'))
    const provider: any = {
      enabled: true,
      apiKey: 'k',
      models: [{ id: OpenAIModelID.GPT_4o }],
    }

    const result = await getOpenAIModels(provider, 'proj')
    expect(result.models).toEqual([])
    expect(result.error).toMatch(/boom/i)
  })

  it('sets error and clears models when response.data is missing', async () => {
    hoisted.modelsList.mockResolvedValueOnce({ data: undefined })
    const provider: any = {
      enabled: true,
      apiKey: 'k',
      models: [{ id: OpenAIModelID.GPT_4o }],
    }

    const result = await getOpenAIModels(provider, 'proj')
    expect(result.models).toEqual([])
    expect(result.error).toMatch(/unexpected response format/i)
  })
})
