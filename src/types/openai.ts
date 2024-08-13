import { Conversation } from './chat'
import {
  AllLLMProviders,
  GenericSupportedModel,
  SupportedModels,
} from './LLMProvider'

export interface OpenAIModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
}

// Ordered list of preferred model IDs -- the first available model will be used as default
export const preferredModelIds = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4-turbo-2024-04-09',
  'gpt-4-128k',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  'gpt-4',
  'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo',
]

export const selectBestModel = (
  allLLMProviders: AllLLMProviders,
  convo?: Conversation,
): GenericSupportedModel => {
  const allModels = Object.values(allLLMProviders)
    .flatMap((provider) => provider.models || [])
    .filter((model) => model.enabled)

  // First, try to use the model from the conversation if it exists and is valid
  if (
    convo &&
    convo.model &&
    typeof convo.model === 'object' &&
    'id' in convo.model
  ) {
    const conversationModel = allModels.find((m) => m.id === convo.model.id)
    if (conversationModel) {
      return conversationModel
    }
  }

  // If the conversation model is not available or invalid, use the preferredModelIds
  for (const preferredId of preferredModelIds) {
    const model = allModels.find((m) => m.id === preferredId)
    if (model) {
      return model
    }
  }

  // If no preferred models are available, fallback to Llama 3.1 70b
  return {
    id: 'llama3.1:70b',
    name: 'Llama 3.1 70b',
    tokenLimit: 128000,
    enabled: true,
  }
}

export enum OpenAIModelID {
  GPT_3_5 = 'gpt-3.5-turbo', // rolling model - currently points to gpt-3.5-turbo-0125
  GPT_4 = 'gpt-4', // rolling model - currently points to gpt-4-0613
  GPT_4_Turbo = 'gpt-4-turbo', // rolling model - currently points to gpt-4-turbo-2024-04-09
  GPT_4o = 'gpt-4o', // rolling model - currently points to gpt-4o-2024-05-13
  GPT_4o_mini = 'gpt-4o-mini', // rolling model - currently points to gpt-4o-2024-05-13

  // Azure -- ONLY GPT-4 supported for now... due to deployment param being env var...
  // This values are deployment names, not model names
  GPT_4_AZURE = 'gpt-4-128k',
  GPT_4_HACKATHON = 'gpt-4-hackathon',
  GPT_4_AZURE_04_09 = 'gpt-4-04-09',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_4

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPT-3.5',
    tokenLimit: 16385,
    enabled: false,
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4',
    tokenLimit: 8192,
    enabled: false,
  },
  [OpenAIModelID.GPT_4_Turbo]: {
    id: OpenAIModelID.GPT_4_Turbo,
    name: 'GPT-4 Turbo',
    tokenLimit: 128000,
    enabled: false,
  },
  [OpenAIModelID.GPT_4o]: {
    id: OpenAIModelID.GPT_4o,
    name: 'GPT-4o',
    tokenLimit: 128000,
    enabled: false,
  },
  [OpenAIModelID.GPT_4o_mini]: {
    id: OpenAIModelID.GPT_4o_mini,
    name: 'GPT-4o-mini',
    tokenLimit: 128000,
    enabled: false,
  },

  // ! Our hard-coded Azure implementation ONLY allows GPT-4, no other azure models on that deployment
  [OpenAIModelID.GPT_4_AZURE]: {
    id: OpenAIModelID.GPT_4_AZURE,
    name: 'GPT-4 Turbo',
    tokenLimit: 128000,
    enabled: false,
  },
  [OpenAIModelID.GPT_4_HACKATHON]: {
    id: OpenAIModelID.GPT_4_HACKATHON,
    name: 'GPT-4 Hackathon',
    tokenLimit: 128000,
    enabled: false,
  },
  [OpenAIModelID.GPT_4_AZURE_04_09]: {
    id: OpenAIModelID.GPT_4_AZURE_04_09,
    name: 'GPT-4 Turbo 0409',
    tokenLimit: 128000,
    enabled: false,
  },
}

export const VisionCapableModels: Set<OpenAIModelID> = new Set([
  OpenAIModelID.GPT_4_Turbo, // Add other vision capable models here as needed
  OpenAIModelID.GPT_4_AZURE_04_09,
  OpenAIModelID.GPT_4o,
  OpenAIModelID.GPT_4o_mini,
])
