import {
  ProviderNames,
  type NCSAHostedProvider,
} from '~/utils/modelProviders/LLMProvider'
import { OllamaModelIDs, OllamaModels, type OllamaModel } from './ollama'

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
    // /api/tags - all downloaded models (can be loaded on demand)
    // /api/ps - all HOT AND LOADED models

    const headers = {
      Authorization: `Bearer ${process.env.NCSA_HOSTED_API_KEY || ''}`,
    }

    const response = await fetch(process.env.OLLAMA_SERVER_URL + '/api/tags', {
      headers,
    })

    if (!response.ok) {
      ncsaHostedProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      ncsaHostedProvider.models = [] // clear any previous models.
      return ncsaHostedProvider as NCSAHostedProvider
    }

    const data = await response.json()
    const downloadedModelIds: string[] = Array.isArray(data?.models)
      ? data.models
          .map((m: { model?: string }) => m?.model)
          .filter(
            (id: unknown): id is string =>
              typeof id === 'string' && id.length > 0,
          )
      : []

    // Only include models that are downloaded AND in our supported Ollama models list
    const availableSupportedIds = new Set<string>(
      Object.values(OllamaModelIDs) as string[],
    )

    const ncsaModels: OllamaModel[] = downloadedModelIds
      .filter((id: string) => availableSupportedIds.has(id))
      .map((id: string) => {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    ncsaHostedProvider.error = message
    console.warn('ERROR in getNCSAHostedModels', error)
    ncsaHostedProvider.models = [] // clear any previous models.
    return ncsaHostedProvider as NCSAHostedProvider
  }
}
