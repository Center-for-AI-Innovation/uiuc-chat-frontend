import { type SambaNovaProvider, ProviderNames } from '../LLMProvider'
import {
  SambaNovaModels,
  type SambaNovaModel,
  type SambaNovaModelID,
  SambanovaPreferredModelIDs,
} from '../types/SambaNova'

export async function getSambaNovaModels(
  provider: SambaNovaProvider,
): Promise<SambaNovaProvider> {
  try {
    provider.provider = ProviderNames.SambaNova
    delete provider.error // Clear any previous errors

    // If provider is disabled, return early with empty models
    if (!provider.enabled || !provider.apiKey) {
      return {
        ...provider,
        models: [],
      }
    }

    // Store existing model states in a Map
    const existingModelStates = new Map<
      string,
      {
        enabled: boolean
        default: boolean
      }
    >()

    if (provider.models && provider.models.length > 0) {
      provider.models.forEach((model) => {
        existingModelStates.set(model.id, {
          enabled: Boolean(model.enabled),
          default: Boolean(model.default),
        })
      })
    }

    // Get all models and apply existing states
    const allModels = Object.values(SambaNovaModels).map((model) => {
      const existingState = existingModelStates.get(model.id)

      // Create a new model object with the existing state or defaults
      const updatedModel: SambaNovaModel = {
        ...model,
        enabled: existingState
          ? Boolean(existingState.enabled)
          : Boolean(model.enabled),
        default: existingState
          ? Boolean(existingState.default)
          : Boolean(model.default || false),
      }

      return updatedModel
    })

    // Sort models according to preferred order
    const sortedModels = [...allModels].sort((a, b) => {
      const indexA = SambanovaPreferredModelIDs.indexOf(
        a.id as SambaNovaModelID,
      )
      const indexB = SambanovaPreferredModelIDs.indexOf(
        b.id as SambaNovaModelID,
      )

      // If a model isn't in the preferred list, put it at the end
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })

    return {
      ...provider,
      models: sortedModels,
    }
  } catch (error) {
    console.error('Error fetching SambaNova models:', error)
    return {
      ...provider,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
