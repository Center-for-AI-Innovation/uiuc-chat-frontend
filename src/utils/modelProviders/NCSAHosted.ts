// import { OllamaProvider } from 'ollama-ai-provider'
import {
  NCSAHostedProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { encryptKeyIfNeeded } from '../crypto'

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
  enabled: boolean
}

export enum NCSAHostedModelID {
  // Use "official" IDs from the Ollama API. Human-readable names in 'OllamaModels' below.
  LLAMA31_70b = 'llama3.1:70b',
}

export const NCSAHostedModels: Record<NCSAHostedModelID, OllamaModel> = {
  [NCSAHostedModelID.LLAMA31_70b]: {
    id: NCSAHostedModelID.LLAMA31_70b,
    name: 'Llama 3.1 70b',
    parameterSize: '70b',
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getNCSAHostedModels = async (
  ncsaHostedProvider: NCSAHostedProvider,
): Promise<NCSAHostedProvider> => {
  delete ncsaHostedProvider.error // Remove the error property if it exists
  ncsaHostedProvider.provider = ProviderNames.NCSAHosted
  try {
    const response = await fetch(process.env.OLLAMA_SERVER_URL + '/api/tags')

    if (!response.ok) {
      ncsaHostedProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      ncsaHostedProvider.models = [] // clear any previous models.
      return ncsaHostedProvider as NCSAHostedProvider
    }
    const data = await response.json()
    const ollamaModels: OllamaModel[] = data.models
      .filter((model: any) =>
        Object.values(NCSAHostedModelID).includes(model.model),
      )
      .map((model: any): OllamaModel => {
        return NCSAHostedModels[model.model as NCSAHostedModelID]
      })

    ncsaHostedProvider.models = ollamaModels
    return ncsaHostedProvider as NCSAHostedProvider
  } catch (error: any) {
    ncsaHostedProvider.error = error.message
    console.warn('ERROR in getNCSAHostedModels', error)
    ncsaHostedProvider.models = [] // clear any previous models.
    return ncsaHostedProvider as NCSAHostedProvider
  }
}
