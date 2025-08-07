import {
  type NCSAHostedProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { type OllamaModel } from './ollama'

// Define NCSA-hosted model IDs (exclude llama-guard)
export enum NCSAHostedModelIDs {
  GPT_OSS_120B = 'gpt-oss:120b',
  GPT_OSS_20B = 'gpt-oss:20b',
  DEEPSEEK_R1_32B = 'deepseek-r1:32b',
  GEMMA3_27B = 'gemma3:27b',
  LLAMA4_16x17B = 'llama4:16x17b',
  QWEN3_32B = 'qwen3:32b',
  DEEPSEEK_R1_70B = 'deepseek-r1:70b',
  LLAMA31_70B_INSTRUCT_FP16 = 'llama3.1:70b-instruct-fp16',
}

// Minimal metadata for display (token limits are conservative defaults)
export const NCSAHostedModels: Record<NCSAHostedModelIDs, OllamaModel> = {
  [NCSAHostedModelIDs.GPT_OSS_120B]: {
    id: NCSAHostedModelIDs.GPT_OSS_120B,
    name: 'GPT-OSS 120B',
    parameterSize: '120B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedModelIDs.GPT_OSS_20B]: {
    id: NCSAHostedModelIDs.GPT_OSS_20B,
    name: 'GPT-OSS 20B',
    parameterSize: '20B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedModelIDs.DEEPSEEK_R1_32B]: {
    id: NCSAHostedModelIDs.DEEPSEEK_R1_32B,
    name: 'DeepSeek R1 32B',
    parameterSize: '32B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedModelIDs.GEMMA3_27B]: {
    id: NCSAHostedModelIDs.GEMMA3_27B,
    name: 'Gemma 3 27B',
    parameterSize: '27B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedModelIDs.LLAMA4_16x17B]: {
    id: NCSAHostedModelIDs.LLAMA4_16x17B,
    name: 'Llama 4 16x17B (MoE)',
    parameterSize: '16x17B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedModelIDs.QWEN3_32B]: {
    id: NCSAHostedModelIDs.QWEN3_32B,
    name: 'Qwen 3 32B',
    parameterSize: '32B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedModelIDs.DEEPSEEK_R1_70B]: {
    id: NCSAHostedModelIDs.DEEPSEEK_R1_70B,
    name: 'DeepSeek R1 70B',
    parameterSize: '70B',
    tokenLimit: 8192,
    enabled: true,
  },
  [NCSAHostedModelIDs.LLAMA31_70B_INSTRUCT_FP16]: {
    id: NCSAHostedModelIDs.LLAMA31_70B_INSTRUCT_FP16,
    name: 'Llama 3.1 70B Instruct (FP16)',
    parameterSize: '70B',
    tokenLimit: 8192,
    enabled: true,
  },
}

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

    const ncsaModels: OllamaModel[] = (Object.values(
      NCSAHostedModelIDs,
    ) as string[])
      .filter((id) => hotModelIds.includes(id))
      .map((id) => {
        const model = NCSAHostedModels[id as NCSAHostedModelIDs]
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
