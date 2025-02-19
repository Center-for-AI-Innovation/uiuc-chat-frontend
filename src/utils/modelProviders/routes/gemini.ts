import { type GeminiProvider, ProviderNames } from '../LLMProvider'
import {
  type GeminiModel,
  GeminiModelID,
  GeminiModels,
  preferredGeminiModelIds,
} from '../types/gemini'

export const getGeminiModels = async (
  geminiProvider: GeminiProvider,
): Promise<GeminiProvider> => {
  geminiProvider.provider = ProviderNames.Gemini
  delete geminiProvider.error // Clear any previous errors

  if (!geminiProvider.apiKey || geminiProvider.apiKey === '') {
    // Don't show any error here... too confusing for users.
    geminiProvider.models = []
    return geminiProvider
  }

  // Store existing model states
  const existingModelStates = new Map<
    string,
    { enabled: boolean; default: boolean }
  >()
  if (geminiProvider.models) {
    geminiProvider.models.forEach((model) => {
      existingModelStates.set(model.id, {
        enabled: model.enabled ?? true,
        default: model.default ?? false,
      })
    })
  }

  // Initialize models array if it doesn't exist
  geminiProvider.models = geminiProvider.models || []

  // Get all available models from GeminiModels and preserve their states
  const allAvailableModels = Object.values(GeminiModels).map((model) => {
    const existingState = existingModelStates.get(model.id)
    return {
      ...model,
      enabled: existingState?.enabled ?? true,
      default: existingState?.default ?? false,
    }
  })

  // Update models array with the latest information
  geminiProvider.models = allAvailableModels

  // Sort models based on preferred order
  geminiProvider.models.sort((a, b) => {
    const indexA = preferredGeminiModelIds.indexOf(a.id as GeminiModelID)
    const indexB = preferredGeminiModelIds.indexOf(b.id as GeminiModelID)
    return (
      (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    )
  })

  return geminiProvider
}
