import { LLMProvider } from '~/types/LLMProvider'

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
  enabled: boolean
}

export enum OllamaModelIDs {
  // Use "official" IDs from the Ollama API. Human-readable names in 'OllamaModels' below.
  LLAMA31_70b = 'llama3.1:70b',
}

export const OllamaModels: Record<OllamaModelIDs, OllamaModel> = {
  [OllamaModelIDs.LLAMA31_70b]: {
    id: OllamaModelIDs.LLAMA31_70b,
    name: 'Llama 3.1 70b',
    parameterSize: '70b',
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getOllamaModels = async (
  ollamaProvider: LLMProvider,
): Promise<LLMProvider> => {
  try {
    if (!ollamaProvider.baseUrl) {
      ollamaProvider.error = `Ollama baseurl not defined: ${ollamaProvider.baseUrl}`
      return ollamaProvider
    }

    const response = await fetch(ollamaProvider.baseUrl + '/api/tags')

    if (!response.ok) {
      ollamaProvider.error = `HTTP error! status: ${response.status}`
      return ollamaProvider
    }
    const data = await response.json()
    const ollamaModels: OllamaModel[] = data.models
      .filter((model: any) =>
        Object.values(OllamaModelIDs).includes(model.model),
      )
      .map((model: any): OllamaModel => {
        return OllamaModels[model.model as OllamaModelIDs]
      })

    ollamaProvider.models = ollamaModels
    return ollamaProvider
  } catch (error: any) {
    ollamaProvider.error = error.message
    return ollamaProvider
  }
}
