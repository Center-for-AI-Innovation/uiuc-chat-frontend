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
    name: 'Qwen 2 VL 72B Instruct',
    tokenLimit: 8192,
    enabled: true,
  },
}

export const getNCSAHostedVLMModels = async (
  vlmProvider: NCSAHostedVLMProvider,
): Promise<NCSAHostedVLMProvider> => {
  delete vlmProvider.error // Clear any previous errors
  vlmProvider.provider = ProviderNames.NCSAHostedVLM
  const existingDefaults = new Map<string, boolean>()
  if (vlmProvider.models) {
    vlmProvider.models.forEach(model => {
      existingDefaults.set(model.id, !!model.default)
    })
  }
  try {
    vlmProvider.baseUrl = process.env.NCSA_HOSTED_VLM_BASE_URL

    const response = await fetch(`${vlmProvider.baseUrl}/models`, {})

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
      return {
        id: model.id,
        name: knownModel ? knownModel.name : 'Experimental: ' + model.id,
        tokenLimit: model.max_tokens || knownModel.tokenLimit, // Default to 128000 if max_tokens is not provided
        enabled: data.enabled ? data.enabled : knownModel.enabled,
        default: existingDefaults.get(model.id) || false,
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
