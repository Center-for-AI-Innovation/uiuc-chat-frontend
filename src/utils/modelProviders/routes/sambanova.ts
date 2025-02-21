import { type SambaNovaProvider } from '../LLMProvider'
import { SambaNovaModels } from '../types/SambaNova'

export async function getSambaNovaModels(
  provider: SambaNovaProvider,
): Promise<SambaNovaProvider> {
  try {
    // If provider is disabled, return early with empty models
    if (!provider.enabled) {
      return {
        ...provider,
        models: [],
      }
    }

    // Return all available models
    return {
      ...provider,
      models: Object.values(SambaNovaModels),
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