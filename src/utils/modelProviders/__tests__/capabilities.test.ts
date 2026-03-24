import { describe, expect, it } from 'vitest'
import { functionCallingModelIds } from '~/utils/modelProviders/ConfigWebLLM'
import { modelSupportsTools } from '~/utils/modelProviders/capabilities'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'

describe('modelSupportsTools', () => {
  it('returns true for WebLLM function-calling models (by name)', () => {
    const modelName = functionCallingModelIds[0]
    expect(modelName).toBeTruthy()

    const model = { id: 'webllm-any', name: modelName } as any
    expect(modelSupportsTools(model)).toBe(true)
  })

  it('returns false when model is missing or unknown', () => {
    expect(modelSupportsTools(null)).toBe(false)
    expect(modelSupportsTools({ id: 'unknown', name: 'unknown' } as any)).toBe(
      false,
    )
  })

  it('returns true for well-known provider model ids (e.g. OpenAI)', () => {
    const openAiId = Object.values(OpenAIModelID)[0]
    expect(openAiId).toBeTruthy()
    expect(modelSupportsTools({ id: openAiId, name: 'x' } as any)).toBe(true)
  })
})
