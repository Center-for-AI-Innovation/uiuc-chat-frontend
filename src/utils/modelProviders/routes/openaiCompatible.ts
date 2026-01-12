import { ProviderNames, type OpenAICompatibleProvider } from '../LLMProvider'
import { OpenAICompatibleModels } from '../types/openaiCompatible'
import { decryptKeyIfNeeded } from '~/utils/crypto'

interface ModelResponse {
  id: string
  object?: string
  created?: number
  owned_by?: string
}

interface ModelsApiResponse {
  data?: ModelResponse[]
}

export const getOpenAICompatibleModels = async (
  openAICompatibleProvider: OpenAICompatibleProvider,
): Promise<OpenAICompatibleProvider> => {
  try {
    delete openAICompatibleProvider.error
    openAICompatibleProvider.provider = ProviderNames.OpenAICompatible

    // Validate baseUrl includes /v1
    if (
      openAICompatibleProvider.baseUrl &&
      !openAICompatibleProvider.baseUrl.includes('/v1')
    ) {
      openAICompatibleProvider.error =
        'Base URL must include /v1. For example: https://api.example.com/v1'
      openAICompatibleProvider.models = []
      return openAICompatibleProvider
    }

    // If provider is disabled or missing required fields, return empty models
    if (
      !openAICompatibleProvider.enabled ||
      !openAICompatibleProvider.apiKey ||
      !openAICompatibleProvider.baseUrl
    ) {
      openAICompatibleProvider.models = []
      return openAICompatibleProvider
    }

    // Fetch available models from the endpoint
    const decryptedKey = await decryptKeyIfNeeded(
      openAICompatibleProvider.apiKey,
    )
    const modelsUrl = `${openAICompatibleProvider.baseUrl}/models`

    let availableModelIds: string[] = []

    try {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${decryptedKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch models: ${response.status} ${response.statusText}`,
        )
      }

      const data = (await response.json()) as
        | ModelsApiResponse
        | ModelResponse[]
      // Handle both OpenAI-compatible format (data.data) and direct array format
      const modelsData = Array.isArray(data) ? data : data.data
      if (Array.isArray(modelsData)) {
        availableModelIds = modelsData.map((model: ModelResponse) => model.id)
      } else {
        throw new Error('Unexpected response format from models endpoint')
      }
    } catch (fetchError: unknown) {
      console.warn(
        'Error fetching models from OpenAI-compatible endpoint:',
        fetchError,
      )
      // If fetching fails, show no models and set error message
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : 'Unknown error'
      openAICompatibleProvider.error =
        errorMessage || 'Failed to fetch available models from endpoint.'
      // Return empty models array when fetch fails
      openAICompatibleProvider.models = []
      return openAICompatibleProvider
    }

    // Filter to only show models that are:
    // 1. In our hardcoded list (OpenAICompatibleModels)
    // 2. Available on the endpoint (if we successfully fetched the list)
    const compatibleModels = Object.values(OpenAICompatibleModels)
      .filter((model) => {
        // Only include models that are available on the endpoint
        if (availableModelIds.length > 0) {
          // Case-insensitive matching to handle different casing conventions
          return availableModelIds.some(
            (availableId) =>
              availableId.toLowerCase() === model.id.toLowerCase(),
          )
        }
        // If no models were fetched (but no error), return empty array
        return false
      })
      .map((model) => {
        const existingModel = openAICompatibleProvider.models?.find(
          (m) => m.id.toLowerCase() === model.id.toLowerCase(),
        )
        return {
          ...model,
          enabled: existingModel?.enabled ?? model.enabled,
          default: existingModel?.default ?? model.default,
        }
      })

    openAICompatibleProvider.models = compatibleModels
    return openAICompatibleProvider
  } catch (error: unknown) {
    console.warn('Error fetching OpenAI-compatible models:', error)
    openAICompatibleProvider.error =
      error instanceof Error ? error.message : 'Failed to load models'
    openAICompatibleProvider.models = []
    return openAICompatibleProvider
  }
}
