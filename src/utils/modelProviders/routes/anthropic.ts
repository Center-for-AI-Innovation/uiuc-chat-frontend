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

  // If no models, return default models sorted by our preference
  if (!anthropicProvider.models || anthropicProvider.models.length === 0) {
    const preferredAnthropicModelIds = [
      AnthropicModelID.Claude_3_5_Sonnet,
      AnthropicModelID.Claude_3_5_Haiku,
      AnthropicModelID.Claude_3_Opus,
    ]

    anthropicProvider.models = Object.values(AnthropicModels).sort((a, b) => {
      const indexA = preferredAnthropicModelIds.indexOf(
        a.id as AnthropicModelID,
      )
      const indexB = preferredAnthropicModelIds.indexOf(
        b.id as AnthropicModelID,
      )
      return (
        (indexA === -1 ? Infinity : indexA) -
        (indexB === -1 ? Infinity : indexB)
      )
    }) as AnthropicModel[]
  }

  // Return these from API, not just all enabled...
  return anthropicProvider
}
