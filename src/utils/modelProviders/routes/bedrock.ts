import { type BedrockProvider, ProviderNames } from '../LLMProvider'
import {
  type BedrockModel,
  BedrockModelID,
  BedrockModels,
} from '../types/bedrock'

export const getBedrockModels = async (
  bedrockProvider: BedrockProvider,
): Promise<BedrockProvider> => {
  bedrockProvider.provider = ProviderNames.Bedrock
  delete bedrockProvider.error // Clear any previous errors

  if (
    !bedrockProvider.accessKeyId ||
    !bedrockProvider.secretAccessKey ||
    !bedrockProvider.region ||
    bedrockProvider.accessKeyId === '' ||
    bedrockProvider.secretAccessKey === '' ||
    bedrockProvider.region === '' ||
    !bedrockProvider.enabled
  ) {
    // Don't show any error here... too confusing for users.
    bedrockProvider.models = []
    return bedrockProvider
  }

  // Store existing model states
  const existingModelStates = new Map<
    string,
    { enabled: boolean; default: boolean }
  >()
  if (bedrockProvider.models) {
    bedrockProvider.models.forEach((model) => {
      existingModelStates.set(model.id, {
        enabled: model.enabled ?? true,
        default: model.default ?? false,
      })
    })
  }

  // Get all available models and preserve their states
  const allAvailableModels = Object.values(BedrockModels).map((model) => {
    const existingState = existingModelStates.get(model.id)
    return {
      ...model,
      enabled: existingState?.enabled ?? true,
      default: existingState?.default ?? false,
    }
  })

  // Sort by preferred order
  const preferredBedrockModelIds = [
    BedrockModelID.Claude_3_5_Sonnet_Latest,
    BedrockModelID.Claude_3_Opus,
    BedrockModelID.Claude_3_5_Haiku,
    BedrockModelID.Nova_Pro,
    BedrockModelID.Nova_Lite,
    BedrockModelID.Nova_Micro,
    // BedrockModelID.Mistral_Large_2402,
    // BedrockModelID.Mistral_Small_2402,
  ]

  bedrockProvider.models = allAvailableModels.sort((a, b) => {
    const indexA = preferredBedrockModelIds.indexOf(a.id as BedrockModelID)
    const indexB = preferredBedrockModelIds.indexOf(b.id as BedrockModelID)
    return (
      (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    )
  })

  return bedrockProvider
}
