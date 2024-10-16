import { NCSAHostedVLLMProvider, ProviderNames } from '../LLMProvider'

export interface NCSAHostedVLLMModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
}

export enum NCSAHostedVLLMModelID {
  Llama_3_2_11B_Vision_Instruct = 'meta-llama/Llama-3.2-11B-Vision-Instruct',
}

export const NCSAHostedVLLMModels: Record<
  NCSAHostedVLLMModelID,
  NCSAHostedVLLMModel
> = {
  [NCSAHostedVLLMModelID.Llama_3_2_11B_Vision_Instruct]: {
    id: NCSAHostedVLLMModelID.Llama_3_2_11B_Vision_Instruct,
    name: 'Llama 3.2 11B Vision Instruct',
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getNCSAHostedVLLMModels = async (
  vllmProvider: NCSAHostedVLLMProvider,
): Promise<NCSAHostedVLLMProvider> => {
  delete vllmProvider.error // Clear any previous errors
  vllmProvider.provider = ProviderNames.NCSAHostedVLLM
  try {
    vllmProvider.baseUrl = process.env.NCSA_HOSTED_VLLM_BASE_URL

    const response = await fetch(`${vllmProvider.baseUrl}/models`, {})

    if (!response.ok) {
      vllmProvider.error =
        response.status === 530
          ? 'Model is offline'
          : `HTTP error ${response.status} ${response.statusText}`
      vllmProvider.models = [] // clear any previous models.
      return vllmProvider as NCSAHostedVLLMProvider
    }

    const data = await response.json()
    const vllmModels: NCSAHostedVLLMModel[] = data.data.map((model: any) => {
      const knownModel = NCSAHostedVLLMModels[model.id as NCSAHostedVLLMModelID]
      return {
        id: model.id,
        name: knownModel ? knownModel.name : 'Experimental: ' + model.id,
        tokenLimit: model.max_tokens || 128000, // Default to 128000 if max_tokens is not provided
        enabled: true,
      }
    })

    vllmProvider.models = vllmModels
    return vllmProvider as NCSAHostedVLLMProvider
  } catch (error: any) {
    console.warn('Error fetching VLLM models:', error)
    vllmProvider.models = [] // clear any previous models.
    return vllmProvider as NCSAHostedVLLMProvider
  }
}
