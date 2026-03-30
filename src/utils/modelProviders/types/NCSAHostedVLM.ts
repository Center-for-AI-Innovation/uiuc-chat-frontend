import { type NCSAHostedVLMProvider } from '../LLMProvider'

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
  QWEN3_5_27B = 'Qwen/Qwen3.5-27B',
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
  [NCSAHostedVLMModelID.QWEN3_5_27B]: {
    id: NCSAHostedVLMModelID.QWEN3_5_27B,
    name: 'Qwen 3.5 27B',
    tokenLimit: 262144,
    enabled: true,
  },
}

export const LEGACY_NCSA_DEFAULT_MODEL_IDS = new Set<string>([
  NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT,
  NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
])

export const CURRENT_NCSA_DEFAULT_MODEL_ID = NCSAHostedVLMModelID.QWEN3_5_27B

type NCSAHostedVLMModelState = {
  enabled: boolean
  default: boolean
}

type NCSAHostedVLMApiModel = {
  id: string
  max_tokens?: number
  max_model_len?: number
}

type NCSAHostedVLMApiResponse = {
  data: NCSAHostedVLMApiModel[]
}

const canUseCurrentNCSADefault = (availableModelIds: Iterable<string>): boolean =>
  new Set(availableModelIds).has(CURRENT_NCSA_DEFAULT_MODEL_ID)

const isKnownNCSAHostedVLMModelId = (
  modelId: string,
): modelId is NCSAHostedVLMModelID =>
  Object.prototype.hasOwnProperty.call(NCSAHostedVLMModels, modelId)

export const resolveStoredNCSADefaultModelId = (
  storedModelId: string | null,
  availableModelIds: Iterable<string>,
): string | null => {
  if (!storedModelId || !LEGACY_NCSA_DEFAULT_MODEL_IDS.has(storedModelId)) {
    return storedModelId
  }

  return canUseCurrentNCSADefault(availableModelIds)
    ? CURRENT_NCSA_DEFAULT_MODEL_ID
    : storedModelId
}

export const migrateNCSADefaultModelStates = (
  existingModelStates: Map<string, NCSAHostedVLMModelState>,
  availableModelIds: Iterable<string>,
): Map<string, NCSAHostedVLMModelState> => {
  const hasLegacyDefault = Array.from(LEGACY_NCSA_DEFAULT_MODEL_IDS).some(
    (modelId) => existingModelStates.get(modelId)?.default,
  )

  if (!hasLegacyDefault || !canUseCurrentNCSADefault(availableModelIds)) {
    return existingModelStates
  }

  const migratedModelStates = new Map(existingModelStates)

  for (const modelId of LEGACY_NCSA_DEFAULT_MODEL_IDS) {
    const existingState = migratedModelStates.get(modelId)
    if (!existingState) {
      continue
    }

    migratedModelStates.set(modelId, {
      enabled: existingState.enabled,
      default: false,
    })
  }

  migratedModelStates.set(CURRENT_NCSA_DEFAULT_MODEL_ID, {
    enabled: true,
    default: true,
  })

  return migratedModelStates
}

export const findAvailableNCSAFallbackModel = <T extends { id: string }>(
  models: T[],
): T | undefined => {
  const fallbackModelIds = [
    CURRENT_NCSA_DEFAULT_MODEL_ID,
    ...LEGACY_NCSA_DEFAULT_MODEL_IDS,
  ]

  for (const modelId of fallbackModelIds) {
    const model = models.find((candidate) => candidate.id === modelId)
    if (model) {
      return model
    }
  }

  return undefined
}

export const getNCSAHostedVLMModels = async (
  vlmProvider: NCSAHostedVLMProvider,
): Promise<NCSAHostedVLMProvider> => {
  delete vlmProvider.error // Clear any previous errors
  // Avoid importing ProviderNames here to prevent a circular dependency with LLMProvider.
  vlmProvider.provider =
    'NCSAHostedVLM' as unknown as NCSAHostedVLMProvider['provider']

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

    const data = (await response.json()) as NCSAHostedVLMApiResponse
    const modelIds = data.data.map((model) => model.id)
    const modelStates = migrateNCSADefaultModelStates(
      existingModelStates,
      modelIds,
    )
    const vlmModels: NCSAHostedVLMModel[] = data.data.flatMap((model) => {
      const knownModel = isKnownNCSAHostedVLMModelId(model.id)
        ? NCSAHostedVLMModels[model.id]
        : undefined
      const tokenLimit =
        model.max_tokens ?? model.max_model_len ?? knownModel?.tokenLimit

      if (tokenLimit == null) {
        console.warn('Skipping VLM model without token limit metadata:', model.id)
        return []
      }

      const existingState = modelStates.get(model.id)
      return [
        {
          id: model.id,
          name: knownModel ? knownModel.name : 'Experimental: ' + model.id,
          tokenLimit,
          enabled: existingState?.enabled ?? true,
          default: existingState?.default ?? false,
        },
      ]
    })

    vlmProvider.models = vlmModels
    return vlmProvider as NCSAHostedVLMProvider
  } catch (error: unknown) {
    console.warn('Error fetching VLM models:', error)
    vlmProvider.models = [] // clear any previous models.
    return vlmProvider as NCSAHostedVLMProvider
  }
}
