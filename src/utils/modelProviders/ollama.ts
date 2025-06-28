import { ChatBody } from '~/types/chat'
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
  default?: boolean
  temperature?: number
}

export enum OllamaModelIDs {
  // Use "official" IDs from the Ollama API. Human-readable names in 'OllamaModels' below.
  // LLAMA31_8b = 'llama3.1:8b',
  // LLAMA31_latest = 'llama3.1:latest', // maps to LLAMA31_8b
  // LLAMA31_70b = 'llama3.1:70b',
  // LLAMA31_405b = 'llama3.1:405b',
  LLAMA31_8b_instruct_fp16 = 'llama3.1:8b-instruct-fp16',
  // LLAMA31_70b_instruct_fp16 = 'llama3.1:70b-instruct-fp16',

  GEMMA3_27B = 'gemma3:27b',


  LLAMA32_1b_fp16 = 'llama3.2:1b-instruct-fp16',
  LLAMA32_3b_fp16 = 'llama3.2:3b-instruct-fp16',

  DEEPSEEK_R1_14b_qwen_fp16 = 'deepseek-r1:14b-qwen-distill-fp16',

  QWEN25_14b_fp16 = 'qwen2.5:14b-instruct-fp16',
  QWEN25_7b_fp16 = 'qwen2.5:7b-instruct-fp16',
}

export const OllamaModels: Record<OllamaModelIDs, OllamaModel> = {
  [OllamaModelIDs.GEMMA3_27B]: {
    id: OllamaModelIDs.GEMMA3_27B,
    name: 'Gemma 3 27B',
    parameterSize: '27B',
    tokenLimit: 21_000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA32_1b_fp16]: {
    id: OllamaModelIDs.LLAMA32_1b_fp16,
    name: 'llama 3.2 1B',
    parameterSize: '1B',
    tokenLimit: 21_760,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA32_3b_fp16]: {
    id: OllamaModelIDs.LLAMA32_3b_fp16,
    name: 'llama 3.2 3B',
    parameterSize: '1B',
    tokenLimit: 15_500,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_8b_instruct_fp16]: {
    id: OllamaModelIDs.LLAMA31_8b_instruct_fp16,
    name: 'Llama 3.1 8B',
    parameterSize: '8B',
    tokenLimit: 12_500,
    enabled: true,
  },
  // [OllamaModelIDs.LLAMA32_1b]: {
  //   id: OllamaModelIDs.LLAMA32_1b,
  //   name: 'llama3.2 1B (quantized)',
  //   parameterSize: '1B',
  //   tokenLimit: 22_000,
  //   usableTokenLimit: 22_010,
  //   enabled: true,
  // },
  [OllamaModelIDs.QWEN25_7b_fp16]: {
    id: OllamaModelIDs.QWEN25_7b_fp16,
    name: 'Qwen 7B',
    parameterSize: '7B',
    tokenLimit: 15_500,
    enabled: true,
  },
  [OllamaModelIDs.QWEN25_14b_fp16]: {
    id: OllamaModelIDs.QWEN25_14b_fp16,
    name: 'Qwen 14B',
    parameterSize: '14B',
    tokenLimit: 20_000,
    enabled: true,
  },
  [OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16]: {
    id: OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16,
    name: 'Deepseek R1 14B (based on Qwen)',
    parameterSize: '14B',
    tokenLimit: 10_000,
    enabled: true,
  },
  // [OllamaModelIDs.LLAMA31_70b_instruct_fp16]: {
  //   id: OllamaModelIDs.LLAMA31_70b_instruct_fp16,
  //   name: 'Llama 3.1 7B',
  //   parameterSize: '70B',
  //   tokenLimit: 128000,
  //   usableTokenLimit: 2000, // NOT SURE OF TRUE VALUE!
  //   enabled: true,
  // },
  // [OllamaModelIDs.LLAMA31_8b]: {
  //   id: OllamaModelIDs.LLAMA31_8b,
  //   name: 'Llama 3.1 8B (quantized)',
  //   parameterSize: '8B',
  //   tokenLimit: 128000,
  //   usableTokenLimit: 12_000, // NOT SURE OF TRUE VALUE!
  //   enabled: true,
  // },
  // [OllamaModelIDs.LLAMA31_latest]: {
  //   id: OllamaModelIDs.LLAMA31_latest,
  //   name: 'Llama 3.1 8B (quantized)',
  //   parameterSize: '8B',
  //   tokenLimit: 128000,
  //   enabled: true,
  // },
  // [OllamaModelIDs.LLAMA31_70b]: {
  //   id: OllamaModelIDs.LLAMA31_70b,
  //   name: 'Llama 3.1 70B (Quantized, Poor Quality Model!)',
  //   parameterSize: '70B',
  //   tokenLimit: 128000,
  //   enabled: true,
  // },
  // [OllamaModelIDs.LLAMA31_405b]: {
  //   id: OllamaModelIDs.LLAMA31_405b,
  //   name: 'Llama 3.1 405B (Quantized)',
  //   parameterSize: '405B',
  //   tokenLimit: 128000,
  //   enabled: true,
  // },
}

export const getOllamaModels = async (
  ollamaProvider: OllamaProvider,
): Promise<OllamaProvider> => {
  delete ollamaProvider.error // Remove the error property if it exists
  ollamaProvider.provider = ProviderNames.Ollama
  try {
    if (!ollamaProvider.baseUrl || !ollamaProvider.enabled) {
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
