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
    bedrockProvider.region === ''
  ) {
    // Don't show any error here... too confusing for users.
    bedrockProvider.models = []
    return bedrockProvider
  }

  // If no models, return default models sorted by our preference
  if (!bedrockProvider.models || bedrockProvider.models.length === 0) {
    const preferredBedrockModelIds = [
      BedrockModelID.Claude_3_Opus,
      BedrockModelID.Claude_3_5_Sonnet_Latest,
      BedrockModelID.Claude_3_5_Haiku,
      BedrockModelID.Nova_Pro,
      BedrockModelID.Nova_Lite,
      BedrockModelID.Nova_Micro,
      // BedrockModelID.Mistral_Large_2402,
      // BedrockModelID.Mistral_Small_2402,
    ]

    bedrockProvider.models = Object.values(BedrockModels).sort((a, b) => {
      const indexA = preferredBedrockModelIds.indexOf(a.id as BedrockModelID)
      const indexB = preferredBedrockModelIds.indexOf(b.id as BedrockModelID)
      return (
        (indexA === -1 ? Infinity : indexA) -
        (indexB === -1 ? Infinity : indexB)
      )
    }) as BedrockModel[]
  }

  // Return these from API, not just all enabled...
  return bedrockProvider
}
