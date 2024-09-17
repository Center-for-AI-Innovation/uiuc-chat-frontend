import { AnthropicProvider, ProviderNames } from '../LLMProvider'
import { AnthropicModel, AnthropicModels } from '../types/anthropic'

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

  // TODO: if no models, return default models
  if (!anthropicProvider.models || anthropicProvider.models.length === 0) {
    anthropicProvider.models = Object.values(
      AnthropicModels,
    ) as AnthropicModel[]
  }

  // Return these from API, not just all enabled...
  return anthropicProvider
}
