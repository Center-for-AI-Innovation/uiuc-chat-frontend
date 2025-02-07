import { BedrockProvider, ProviderNames } from '../LLMProvider'
import {
  BedrockModel,
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
      BedrockModelID.Claude_3_Sonnet,
      BedrockModelID.Claude_3_Haiku,
      BedrockModelID.Claude_2_1,
      BedrockModelID.Claude_Instant,
      BedrockModelID.Titan_Express,
      BedrockModelID.Titan_Lite,
      BedrockModelID.Llama2_70B,
      BedrockModelID.Llama2_13B,
    ]

    bedrockProvider.models = Object.values(BedrockModels).sort((a, b) => {
      const indexA = preferredBedrockModelIds.indexOf(a.id as BedrockModelID)
      const indexB = preferredBedrockModelIds.indexOf(b.id as BedrockModelID)
      return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    }) as BedrockModel[]
  }

  // Return these from API, not just all enabled...
  return bedrockProvider
} 