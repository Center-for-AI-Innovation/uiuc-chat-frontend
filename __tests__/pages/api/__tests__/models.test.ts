/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

const hoisted = vi.hoisted(() => ({
  redisGet: vi.fn(),
  getOllamaModels: vi.fn(async (p: any) => p),
  getAzureModels: vi.fn(async (p: any) => p),
  getAnthropicModels: vi.fn(async (p: any) => p),
  getWebLLMModels: vi.fn(async (p: any) => p),
  getNCSAHostedModels: vi.fn(async (p: any) => p),
  getOpenAIModels: vi.fn(async (p: any) => p),
  getNCSAHostedVLMModels: vi.fn(async (p: any) => p),
  getBedrockModels: vi.fn(async (p: any) => p),
  getGeminiModels: vi.fn(async (p: any) => p),
  getSambaNovaModels: vi.fn(async (p: any) => p),
  getOpenAICompatibleModels: vi.fn(async (p: any) => p),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: vi.fn(async () => ({
    get: hoisted.redisGet,
  })),
}))

vi.mock('~/utils/modelProviders/ollama', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getOllamaModels: hoisted.getOllamaModels,
  }
})
vi.mock('~/utils/modelProviders/azure', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getAzureModels: hoisted.getAzureModels,
  }
})
vi.mock('~/utils/modelProviders/routes/anthropic', () => ({
  getAnthropicModels: hoisted.getAnthropicModels,
}))
vi.mock('~/utils/modelProviders/WebLLM', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getWebLLMModels: hoisted.getWebLLMModels,
  }
})
vi.mock('~/utils/modelProviders/NCSAHosted', () => ({
  getNCSAHostedModels: hoisted.getNCSAHostedModels,
}))
vi.mock('~/utils/modelProviders/routes/openai', () => ({
  getOpenAIModels: hoisted.getOpenAIModels,
}))
vi.mock('~/utils/modelProviders/types/NCSAHostedVLM', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getNCSAHostedVLMModels: hoisted.getNCSAHostedVLMModels,
  }
})
vi.mock('~/utils/modelProviders/routes/bedrock', () => ({
  getBedrockModels: hoisted.getBedrockModels,
}))
vi.mock('~/utils/modelProviders/routes/gemini', () => ({
  getGeminiModels: hoisted.getGeminiModels,
}))
vi.mock('~/utils/modelProviders/routes/sambanova', () => ({
  getSambaNovaModels: hoisted.getSambaNovaModels,
}))
vi.mock('~/utils/modelProviders/routes/openaiCompatible', () => ({
  getOpenAICompatibleModels: hoisted.getOpenAICompatibleModels,
}))

import handler, { getModels } from '~/pages/api/models'

describe('models API', () => {
  it('getModels returns providers even when redis has no config', async () => {
    hoisted.redisGet.mockResolvedValueOnce(null)

    const out = await getModels('CS101')
    expect(out).toBeTruthy()

    const keys = Object.keys(out as any)
    for (const provider of Object.values(ProviderNames)) {
      expect(keys).toContain(provider)
    }
  })

  it('handler returns 400 when projectName is missing', async () => {
    const res = createMockRes()
    await handler(createMockReq({ method: 'POST', body: {} }) as any, res as any)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('handler returns 200 with all providers', async () => {
    hoisted.redisGet.mockResolvedValueOnce(JSON.stringify({}))
    const res = createMockRes()

    await handler(
      createMockReq({ method: 'POST', body: { projectName: 'CS101' } }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const body = (res.json as any).mock.calls[0]?.[0]
    expect(body[ProviderNames.OpenAI]).toBeTruthy()
    expect(body[ProviderNames.Azure]).toBeTruthy()
  })

  it('handler returns 500 when getModels throws', async () => {
    hoisted.redisGet.mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const res = createMockRes()

    await handler(
      createMockReq({ method: 'POST', body: { projectName: 'CS101' } }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
