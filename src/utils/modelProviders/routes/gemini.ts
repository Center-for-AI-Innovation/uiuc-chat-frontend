import { type GeminiProvider, ProviderNames } from '../LLMProvider'
import { type GeminiModel, GeminiModelID, GeminiModels } from '../types/gemini'

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

  // Initialize models array if it doesn't exist
  geminiProvider.models = geminiProvider.models || []

  // Get all available models from GeminiModels
  const allAvailableModels = Object.values(GeminiModels)

  // Add any missing models to the provider's models array
  allAvailableModels.forEach((model) => {
    if (!geminiProvider.models!.find((m) => m.id === model.id)) {
      geminiProvider.models!.push(model)
    }
  })

  // Sort models by preference
  const preferredGeminiModelIds = [
    GeminiModelID.Gemini_2_0_Pro_Exp_02_05,
    GeminiModelID.Gemini_2_0_Flash,
    GeminiModelID.Gemini_2_0_Flash_Thinking_Exp_01_21,
    GeminiModelID.Gemini_1_5_Pro,
    GeminiModelID.LearnLM_1_5_Pro,
  ]

  geminiProvider.models.sort((a, b) => {
    const indexA = preferredGeminiModelIds.indexOf(a.id as GeminiModelID)
    const indexB = preferredGeminiModelIds.indexOf(b.id as GeminiModelID)
    return (
      (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    )
  })

  return geminiProvider
}
