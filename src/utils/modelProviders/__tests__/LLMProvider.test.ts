import { describe, expect, it, beforeEach } from 'vitest'
import {
  ProviderNames,
  selectBestModel,
  type AllLLMProviders,
} from '../LLMProvider'
import { OpenAIModelID, OpenAIModels } from '../types/openai'
import { NCSAHostedVLMModelID, NCSAHostedVLMModels } from '../types/NCSAHostedVLM'

function makeAllProviders(
  overrides: Partial<Record<ProviderNames, { enabled: boolean; models: any[] }>>,
): AllLLMProviders {
  const base: Record<string, any> = {}
  for (const provider of Object.values(ProviderNames)) {
    base[provider] = { provider, enabled: false, models: [] }
  }

  for (const [provider, value] of Object.entries(overrides)) {
    base[provider] = { ...base[provider], ...value }
  }

  return base as unknown as AllLLMProviders
}

describe('selectBestModel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the user-selected default model when available', () => {
    localStorage.setItem('defaultModel', OpenAIModelID.GPT_4o_mini)

    const providers = makeAllProviders({
      [ProviderNames.OpenAI]: {
        enabled: true,
        models: [{ ...OpenAIModels[OpenAIModelID.GPT_4o_mini], enabled: true }],
      },
    })

    expect(selectBestModel(providers).id).toBe(OpenAIModelID.GPT_4o_mini)
  })

  it('maps Qwen2.5-VL-32B to Qwen2.5-VL-72B', () => {
    localStorage.setItem('defaultModel', NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT)

    const providers = makeAllProviders({
      [ProviderNames.NCSAHostedVLM]: { enabled: true, models: [] },
    })

    expect(selectBestModel(providers)).toEqual(
      NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT],
    )
  })

  it('uses a global default model when no user default is set', () => {
    const providers = makeAllProviders({
      [ProviderNames.OpenAI]: {
        enabled: true,
        models: [
          { ...OpenAIModels[OpenAIModelID.GPT_4o_mini], enabled: true, default: true },
          { ...OpenAIModels[OpenAIModelID.GPT_4o], enabled: true },
        ],
      },
    })

    expect(selectBestModel(providers).id).toBe(OpenAIModelID.GPT_4o_mini)
  })

  it('falls back to the first preferred model when no defaults exist', () => {
    const providers = makeAllProviders({
      [ProviderNames.OpenAI]: {
        enabled: true,
        models: [{ ...OpenAIModels[OpenAIModelID.GPT_4o_mini], enabled: true, default: false }],
      },
    })

    expect(selectBestModel(providers).id).toBe(OpenAIModelID.GPT_4o_mini)
  })

  it('falls back to Qwen2.5-VL-72B when no preferred models are available', () => {
    const providers = makeAllProviders({
      [ProviderNames.OpenAI]: { enabled: false, models: [] },
      [ProviderNames.NCSAHostedVLM]: { enabled: false, models: [] },
    })

    expect(selectBestModel(providers)).toEqual(
      NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT],
    )
  })
})
