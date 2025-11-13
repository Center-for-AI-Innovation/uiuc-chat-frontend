import {
  ProviderNames,
  type OpenAICompatibleProvider,
} from '../LLMProvider'
import { OpenAICompatibleModels } from '../types/openaiCompatible'

export const getOpenAICompatibleModels = async (
  openAICompatibleProvider: OpenAICompatibleProvider,
): Promise<OpenAICompatibleProvider> => {
  try {
    delete openAICompatibleProvider.error
    openAICompatibleProvider.provider = ProviderNames.OpenAICompatible

    // Validate baseUrl includes /v1
    if (
      openAICompatibleProvider.baseUrl &&
      !openAICompatibleProvider.baseUrl.includes('/v1')
    ) {
      openAICompatibleProvider.error =
        'Base URL must include /v1. For example: https://api.example.com/v1'
      openAICompatibleProvider.models = []
      return openAICompatibleProvider
    }

    // If provider is disabled or missing required fields, return empty models
    if (
      !openAICompatibleProvider.enabled ||
      !openAICompatibleProvider.apiKey ||
      !openAICompatibleProvider.baseUrl
    ) {
      openAICompatibleProvider.models = []
      return openAICompatibleProvider
    }

    // Use hardcoded models from OpenAICompatibleModels
    const compatibleModels = Object.values(OpenAICompatibleModels).map(
      (model) => {
        const existingModel = openAICompatibleProvider.models?.find(
          (m) => m.id === model.id,
        )
        return {
          ...model,
          enabled: existingModel?.enabled ?? model.enabled,
          default: existingModel?.default ?? model.default,
        }
      },
    )

    openAICompatibleProvider.models = compatibleModels
    return openAICompatibleProvider
  } catch (error: any) {
    console.warn('Error fetching OpenAI-compatible models:', error)
    openAICompatibleProvider.error = error.message || 'Failed to load models'
    openAICompatibleProvider.models = []
    return openAICompatibleProvider
  }
}
