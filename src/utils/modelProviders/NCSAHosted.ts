import {
  type NCSAHostedProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { OllamaModels, OllamaModelIDs, type OllamaModel } from './ollama'

export const getNCSAHostedModels = async (
  ncsaHostedProvider: NCSAHostedProvider,
): Promise<NCSAHostedProvider> => {
  delete ncsaHostedProvider.error // Remove the error property if it exists
  ncsaHostedProvider.provider = ProviderNames.NCSAHosted

  if (!ncsaHostedProvider.enabled) {
    ncsaHostedProvider.models = []
    return ncsaHostedProvider
  }

  // Store existing model states
  const existingModelStates = new Map<
    string,
    { enabled: boolean; default: boolean }
  >()
  if (ncsaHostedProvider.models) {
    ncsaHostedProvider.models.forEach((model) => {
      existingModelStates.set(model.id, {
        enabled: model.enabled ?? true,
        default: model.default ?? false,
      })
    })
  }

  try {
    // /api/tags - all downloaded models - might not have room on the GPUs.
    // /api/ps - all HOT AND LOADED models
    const response = await fetch(process.env.OLLAMA_SERVER_URL + '/api/ps')

    if (!response.ok) {
      ncsaHostedProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      ncsaHostedProvider.models = [] // clear any previous models.
      return ncsaHostedProvider as NCSAHostedProvider
    }

    const data = await response.json()
    const hotModelIds: string[] = Array.isArray(data?.models)
      ? data.models.map((m: any) => m?.model).filter(Boolean)
      : []

    // Only include models that are hot AND in our supported Ollama models list
    const availableSupportedIds = new Set<string>(
      Object.values(OllamaModelIDs) as string[],
    )

    const ncsaModels: OllamaModel[] = hotModelIds
      .filter((id) => availableSupportedIds.has(id))
      .map((id) => {
        const model = OllamaModels[id as OllamaModelIDs]
        const existingState = existingModelStates.get(model.id)
        return {
          ...model,
          enabled: existingState?.enabled ?? true,
          default: existingState?.default ?? false,
        }
      })

    ncsaHostedProvider.models = ncsaModels
    return ncsaHostedProvider as NCSAHostedProvider
  } catch (error: any) {
    ncsaHostedProvider.error = error.message
    console.warn('ERROR in getNCSAHostedModels', error)
    ncsaHostedProvider.models = [] // clear any previous models.
    return ncsaHostedProvider as NCSAHostedProvider
  }
}
