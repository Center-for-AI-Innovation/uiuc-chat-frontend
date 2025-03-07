import { AnthropicProvider, ProviderNames } from '../LLMProvider'
import {
  AnthropicModel,
  AnthropicModelID,
  AnthropicModels,
} from '../types/anthropic'

export const getAnthropicModels = async (
  anthropicProvider: AnthropicProvider,
): Promise<AnthropicProvider> => {
  anthropicProvider.provider = ProviderNames.Anthropic
  delete anthropicProvider.error // Clear any previous errors

  if (!anthropicProvider.apiKey || anthropicProvider.apiKey === '') {
    // Don't show any error here... too confusing for users.
    anthropicProvider.models = []
    return anthropicProvider
  }

  // Store existing model states
  const existingModelStates = new Map<
    string,
    { enabled: boolean; default: boolean; temperature?: number }
  >()

  if (anthropicProvider.models) {
    anthropicProvider.models.forEach((model) => {
      existingModelStates.set(model.id, {
        enabled: model.enabled ?? true,
        default: model.default ?? false,
        temperature: model.temperature,
      })
    })
  }

  // Initialize models array if it doesn't exist
  anthropicProvider.models = anthropicProvider.models || []

  const preferredAnthropicModelIds = [
    AnthropicModelID.Claude_3_7_Sonnet,
    AnthropicModelID.Claude_3_7_Sonnet_Thinking,
    AnthropicModelID.Claude_3_5_Sonnet,
    AnthropicModelID.Claude_3_5_Haiku,
    AnthropicModelID.Claude_3_Opus,
  ]

  // Get all available models from AnthropicModels and preserve their states
  const allAvailableModels = Object.values(AnthropicModels).map((model) => {
    const existingState = existingModelStates.get(model.id)
    return {
      ...model,
      enabled: existingState?.enabled ?? model.enabled,
      default: existingState?.default ?? model.default,
      temperature: existingState?.temperature ?? model.temperature,
    }
  })

  // Update models array with the latest information
  anthropicProvider.models = allAvailableModels

  // Sort models based on preferred order
  anthropicProvider.models.sort((a, b) => {
    const indexA = preferredAnthropicModelIds.indexOf(a.id as AnthropicModelID)
    const indexB = preferredAnthropicModelIds.indexOf(b.id as AnthropicModelID)
    return (
      (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    )
  })

  // Return these from API, not just all enabled...
  return anthropicProvider
}
