import {
  OllamaProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
  enabled: boolean
}

export enum OllamaModelIDs {
  // Use "official" IDs from the Ollama API. Human-readable names in 'OllamaModels' below.
  LLAMA31_8b = 'llama3.1:8b',
  LLAMA31_latest = 'llama3.1:latest', // maps to LLAMA31_8b
  LLAMA31_70b = 'llama3.1:70b',
  LLAMA31_405b = 'llama3.1:405b',
  LLAMA31_8b_instruct_fp16 = 'llama3.1:8b-instruct-fp16',
  LLAMA31_70b_instruct_fp16 = 'llama3.1:70b-instruct-fp16',
}

export const OllamaModels: Record<OllamaModelIDs, OllamaModel> = {
  [OllamaModelIDs.LLAMA31_70b_instruct_fp16]: {
    id: OllamaModelIDs.LLAMA31_70b_instruct_fp16,
    name: 'Llama 3.1 70b (FP16)',
    parameterSize: '8b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_8b_instruct_fp16]: {
    id: OllamaModelIDs.LLAMA31_8b_instruct_fp16,
    name: 'Llama 3.1 8b (FP16)',
    parameterSize: '8b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_8b]: {
    id: OllamaModelIDs.LLAMA31_8b,
    name: 'Llama 3.1 8b',
    parameterSize: '8b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_latest]: {
    id: OllamaModelIDs.LLAMA31_latest,
    name: 'Llama 3.1 (Latest)',
    parameterSize: '8b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_70b]: {
    id: OllamaModelIDs.LLAMA31_70b,
    name: 'Llama 3.1 70b (Quantized, Poor Quality Model)',
    parameterSize: '70b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_405b]: {
    id: OllamaModelIDs.LLAMA31_405b,
    name: 'Llama 3.1 405b',
    parameterSize: '405b',
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getOllamaModels = async (
  ollamaProvider: OllamaProvider,
): Promise<OllamaProvider> => {
  delete ollamaProvider.error // Remove the error property if it exists
  ollamaProvider.provider = ProviderNames.Ollama
  try {
    if (!ollamaProvider.baseUrl) {
      // Don't error here, too confusing for users.
      // ollamaProvider.error = `Ollama Base Url is not defined, please set it to the URL that points to your Ollama instance.`
      ollamaProvider.models = [] // clear any previous models.
      return ollamaProvider as OllamaProvider
    }

    const response = await fetch(ollamaProvider.baseUrl + '/api/tags')

    if (!response.ok) {
      ollamaProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      ollamaProvider.models = [] // clear any previous models.
      return ollamaProvider as OllamaProvider
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
    return ollamaProvider as OllamaProvider
  } catch (error: any) {
    ollamaProvider.error = error.message
    console.warn('ERROR in getOllamaModels', error)
    ollamaProvider.models = [] // clear any previous models.
    return ollamaProvider as OllamaProvider
  }
}
