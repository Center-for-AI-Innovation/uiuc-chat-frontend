import { describe, expect, it, beforeEach } from 'vitest'
import {
  ProviderNames,
  selectBestModel,
  type AllLLMProviders,
} from '../LLMProvider'
import { OpenAIModelID, OpenAIModels } from '../types/openai'
import {
  NCSAHostedVLMModelID,
  NCSAHostedVLMModels,
} from '../types/NCSAHostedVLM'

function makeAllProviders(
  overrides: Partial<
    Record<ProviderNames, { enabled: boolean; models: any[] }>
  >,
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

  it('migrates a legacy Qwen default only after Qwen 3.5 is available', () => {
    localStorage.setItem(
      'defaultModel',
      NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT,
    )

    const providers = makeAllProviders({
      [ProviderNames.NCSAHostedVLM]: {
        enabled: true,
        models: [{ ...NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN3_5_27B] }],
      },
    })

    expect(selectBestModel(providers)).toEqual(
      NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN3_5_27B],
    )
    expect(localStorage.getItem('defaultModel')).toBe(
      NCSAHostedVLMModelID.QWEN3_5_27B,
    )
  })

  it('keeps the stored legacy Qwen default when Qwen 3.5 is unavailable', () => {
    localStorage.setItem(
      'defaultModel',
      NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
    )

    const providers = makeAllProviders({
      [ProviderNames.NCSAHostedVLM]: {
        enabled: true,
        models: [
          {
            ...NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT],
          },
        ],
      },
    })

    expect(selectBestModel(providers)).toEqual(
      NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT],
    )
    expect(localStorage.getItem('defaultModel')).toBe(
      NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
    )
  })

  it('uses a global default model when no user default is set', () => {
    const providers = makeAllProviders({
      [ProviderNames.OpenAI]: {
        enabled: true,
        models: [
          {
            ...OpenAIModels[OpenAIModelID.GPT_4o_mini],
            enabled: true,
            default: true,
          },
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
        models: [
          {
            ...OpenAIModels[OpenAIModelID.GPT_4o_mini],
            enabled: true,
            default: false,
          },
        ],
      },
    })

    expect(selectBestModel(providers).id).toBe(OpenAIModelID.GPT_4o_mini)
  })

  it('rewrites the legacy NCSA default model in localStorage', () => {
    localStorage.setItem(
      'defaultModel',
      NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
    )

    const providers = makeAllProviders({
      [ProviderNames.NCSAHostedVLM]: {
        enabled: true,
        models: [{ ...NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN3_5_27B] }],
      },
    })

    expect(selectBestModel(providers)).toEqual(
      NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN3_5_27B],
    )
    expect(localStorage.getItem('defaultModel')).toBe(
      NCSAHostedVLMModelID.QWEN3_5_27B,
    )
  })

  it('falls back to Qwen 3.5 27B when no preferred models are available', () => {
    const providers = makeAllProviders({
      [ProviderNames.OpenAI]: { enabled: false, models: [] },
      [ProviderNames.NCSAHostedVLM]: { enabled: false, models: [] },
    })

    expect(selectBestModel(providers)).toEqual(
      NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN3_5_27B],
    )
  })

  it('falls back to an available legacy NCSA model before using the static Qwen 3.5 descriptor', () => {
    const providers = makeAllProviders({
      [ProviderNames.OpenAI]: { enabled: false, models: [] },
      [ProviderNames.NCSAHostedVLM]: {
        enabled: true,
        models: [
          {
            ...NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT],
            default: false,
          },
        ],
      },
    })

    expect(selectBestModel(providers)).toMatchObject(
      NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT],
    )
  })
})
