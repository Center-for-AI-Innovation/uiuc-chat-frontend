import { type NCSAHostedVLMProvider, ProviderNames } from '../LLMProvider'

export interface NCSAHostedVLMModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum NCSAHostedVLMModelID {
  Llama_3_2_11B_Vision_Instruct = 'meta-llama/Llama-3.2-11B-Vision-Instruct',
  MOLMO_7B_D_0924 = 'allenai/Molmo-7B-D-0924',
  QWEN2_VL_72B_INSTRUCT = 'Qwen/Qwen2-VL-72B-Instruct',
  QWEN2_5VL_72B_INSTRUCT = 'Qwen/Qwen2.5-VL-72B-Instruct',
  QWEN2_5VL_32B_INSTRUCT = 'Qwen/Qwen2.5-VL-32B-Instruct',
}

export const NCSAHostedVLMModels: Record<
  NCSAHostedVLMModelID,
  NCSAHostedVLMModel
> = {
  [NCSAHostedVLMModelID.Llama_3_2_11B_Vision_Instruct]: {
    id: NCSAHostedVLMModelID.Llama_3_2_11B_Vision_Instruct,
    name: 'Llama 3.2 11B Vision Instruct',
    tokenLimit: 128000,
    enabled: true,
  },
  [NCSAHostedVLMModelID.MOLMO_7B_D_0924]: {
    id: NCSAHostedVLMModelID.MOLMO_7B_D_0924,
    name: 'Molmo 7B D 0924',
    tokenLimit: 4096,
    enabled: true,
  },
  [NCSAHostedVLMModelID.QWEN2_VL_72B_INSTRUCT]: {
    id: NCSAHostedVLMModelID.QWEN2_VL_72B_INSTRUCT,
    name: 'Qwen 2 VL 72B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT]: {
    id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
    name: 'Qwen 2.5 VL 72B (Best in open source)',
    tokenLimit: 23000,
    enabled: true,
  },
  [NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT]: {
    id: NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT,
    name: 'Qwen 2.5 VL 32B',
    tokenLimit: 32000,
    enabled: true,
  },
}

export const getNCSAHostedVLMModels = async (
  vlmProvider: NCSAHostedVLMProvider,
): Promise<NCSAHostedVLMProvider> => {
  delete vlmProvider.error // Clear any previous errors
  vlmProvider.provider = ProviderNames.NCSAHostedVLM

  if (!vlmProvider.enabled) {
    vlmProvider.models = []
    return vlmProvider
  }

  // Store existing model states
  const existingModelStates = new Map<
    string,
    { enabled: boolean; default: boolean }
  >()
  if (vlmProvider.models) {
    vlmProvider.models.forEach((model) => {
      existingModelStates.set(model.id, {
        enabled: model.enabled ?? true,
        default: model.default ?? false,
      })
    })
  }

  try {
    vlmProvider.baseUrl = process.env.NCSA_HOSTED_VLM_BASE_URL

    const headers = {
      Authorization: `Bearer ${process.env.NCSA_HOSTED_API_KEY || ''}`,
    }

    const response = await fetch(`${vlmProvider.baseUrl}/models`, { headers })

    if (!response.ok) {
      vlmProvider.error =
        response.status === 530
          ? 'Model is offline'
          : `HTTP error ${response.status} ${response.statusText}`
      vlmProvider.models = [] // clear any previous models.
      return vlmProvider as NCSAHostedVLMProvider
    }

    const data = await response.json()
    const vlmModels: NCSAHostedVLMModel[] = data.data.map((model: any) => {
      const knownModel = NCSAHostedVLMModels[model.id as NCSAHostedVLMModelID]
      const existingState = existingModelStates.get(model.id)
      return {
        id: model.id,
        name: knownModel ? knownModel.name : 'Experimental: ' + model.id,
        tokenLimit: model.max_tokens || knownModel.tokenLimit,
        enabled: existingState?.enabled ?? true,
        default: existingState?.default ?? false,
      }
    })

    vlmProvider.models = vlmModels
    return vlmProvider as NCSAHostedVLMProvider
  } catch (error: any) {
    console.warn('Error fetching VLM models:', error)
    vlmProvider.models = [] // clear any previous models.
    return vlmProvider as NCSAHostedVLMProvider
  }
}
