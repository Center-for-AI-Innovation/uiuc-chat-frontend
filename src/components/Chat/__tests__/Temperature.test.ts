import { describe, expect, it } from 'vitest'
import { DEFAULT_TEMPERATURE } from '~/utils/app/const'
import {
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'
import {
  ProviderNames,
  type AllLLMProviders,
} from '~/utils/modelProviders/LLMProvider'
import { selectBestTemperature } from '../Temperature'
import { makeConversation } from '~/test-utils/mocks/chat'

function makeProvidersWithDefaultTemp(temp?: number): AllLLMProviders {
  const base: Record<string, any> = {}
  for (const provider of Object.values(ProviderNames)) {
    base[provider] = { provider, enabled: false, models: [] }
  }
  base[ProviderNames.OpenAI] = {
    provider: ProviderNames.OpenAI,
    enabled: true,
    models: [
      {
        ...OpenAIModels[OpenAIModelID.GPT_4o_mini],
        enabled: true,
        default: true,
        temperature: temp,
      },
    ],
  }
  return base as unknown as AllLLMProviders
}

describe('selectBestTemperature', () => {
  it('prefers selectedConversation.temperature', () => {
    expect(
      selectBestTemperature(
        makeConversation({ temperature: 0.2 }),
        makeConversation({ temperature: 0.9 }),
        makeProvidersWithDefaultTemp(0.4),
      ),
    ).toBe(0.9)
  })

  it('falls back to lastConversation.temperature', () => {
    expect(
      selectBestTemperature(
        makeConversation({ temperature: 0.7 }),
        undefined,
        makeProvidersWithDefaultTemp(0.4),
      ),
    ).toBe(0.7)
  })

  it('falls back to default model temperature from llmProviders', () => {
    expect(
      selectBestTemperature(null, undefined, makeProvidersWithDefaultTemp(0.6)),
    ).toBe(0.6)
  })

  it('falls back to DEFAULT_TEMPERATURE when nothing else is available', () => {
    expect(
      selectBestTemperature(
        null,
        undefined,
        makeProvidersWithDefaultTemp(undefined),
      ),
    ).toBe(DEFAULT_TEMPERATURE)
  })
})
