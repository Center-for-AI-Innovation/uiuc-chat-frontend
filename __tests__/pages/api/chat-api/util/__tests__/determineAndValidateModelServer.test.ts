import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return {
    getModels: vi.fn(),
  }
})

vi.mock('~/pages/api/models', () => ({
  getModels: hoisted.getModels,
}))

vi.mock('~/utils/modelProviders/WebLLM', () => ({
  webLLMModels: [{ id: 'webllm-1' }],
}))

import { determineAndValidateModelServer } from '~/pages/api/chat-api/util/determineAndValidateModelServer'

describe('determineAndValidateModelServer', () => {
  it('throws when no enabled models are available', async () => {
    hoisted.getModels.mockResolvedValueOnce({
      OpenAI: { models: [{ id: 'm1', enabled: false }] },
    })
    await expect(
      determineAndValidateModelServer('m1', 'CS101'),
    ).rejects.toThrow(/No models are available/)
  })

  it('throws when requested model is not found and includes available model ids', async () => {
    hoisted.getModels.mockResolvedValueOnce({
      OpenAI: {
        models: [
          { id: 'webllm-1', enabled: true },
          { id: 'gpt-4o', enabled: true },
        ],
      },
    })
    await expect(
      determineAndValidateModelServer('missing', 'CS101'),
    ).rejects.toThrow(/gpt-4o/)
  })

  it('returns activeModel and modelsWithProviders on success', async () => {
    hoisted.getModels.mockResolvedValueOnce({
      OpenAI: { models: [{ id: 'gpt-4o', enabled: true }] },
    })
    const out = await determineAndValidateModelServer('gpt-4o', 'CS101')
    expect(out.activeModel.id).toBe('gpt-4o')
    expect(out.modelsWithProviders.OpenAI).toBeTruthy()
  })
})

