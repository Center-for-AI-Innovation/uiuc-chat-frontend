import { OllamaModel, OllamaModels } from '~/utils/modelProviders/ollama'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import {
  OpenAIModel,
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'
import {
  AnthropicModel,
  AnthropicModelID,
  AnthropicModels,
} from '~/utils/modelProviders/types/anthropic'
import {
  AzureModel,
  AzureModelID,
  AzureModels,
} from '~/utils/modelProviders/azure'
import {
  NCSAHostedModelID,
  NCSAHostedModels,
} from '~/utils/modelProviders/NCSAHosted'
import {
  NCSAHostedVLLMModel,
  NCSAHostedVLLMModelID,
  NCSAHostedVLLMModels,
} from '~/utils/modelProviders/types/NCSAHostedVLLM'
import { Conversation } from '~/types/chat'

export enum ProviderNames {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
  Azure = 'Azure',
  Anthropic = 'Anthropic',
  WebLLM = 'WebLLM',
  NCSAHosted = 'NCSAHosted',
  NCSAHostedVLLM = 'NCSAHostedVLLM',
}

export type AnySupportedModel =
  | OllamaModel
  | OpenAIModel
  | WebllmModel
  | AnthropicModel
  | AzureModel
  | NCSAHostedVLLMModel

// Add other vision capable models as needed
export const VisionCapableModels: Set<
  OpenAIModelID | AzureModelID | AnthropicModelID | NCSAHostedVLLMModelID
> = new Set([
  OpenAIModelID.GPT_4_Turbo,
  OpenAIModelID.GPT_4o,
  OpenAIModelID.GPT_4o_mini,

  AzureModelID.GPT_4_Turbo,
  AzureModelID.GPT_4o,
  AzureModelID.GPT_4o_mini,
  // claude-3.5....
  AnthropicModelID.Claude_3_5_Sonnet,

  // VLLM
  NCSAHostedVLLMModelID.Llama_3_2_11B_Vision_Instruct,
])

export const AllSupportedModels: Set<AnySupportedModel> = new Set([
  ...Object.values(AnthropicModels),
  ...Object.values(OpenAIModels),
  ...Object.values(AzureModels),
  ...Object.values(OllamaModels),
  ...Object.values(NCSAHostedModels),
  ...Object.values(NCSAHostedVLLMModels),
  // ...webLLMModels,
])

export interface BaseLLMProvider {
  provider: ProviderNames
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  error?: string
}

export interface NCSAHostedVLLMProvider extends BaseLLMProvider {
  provider: ProviderNames.NCSAHostedVLLM
  models?: NCSAHostedVLLMModel[]
}

export interface OllamaProvider extends BaseLLMProvider {
  provider: ProviderNames.Ollama
  models?: OllamaModel[]
}

export interface NCSAHostedProvider extends BaseLLMProvider {
  // This uses Ollama, but hosted by NCSA. Keep it separate.
  provider: ProviderNames.NCSAHosted
  models?: OllamaModel[]
}

export interface OpenAIProvider extends BaseLLMProvider {
  provider: ProviderNames.OpenAI
  models?: OpenAIModel[]
}

export interface AzureProvider extends BaseLLMProvider {
  provider: ProviderNames.Azure
  models?: AzureModel[]
  AzureEndpoint?: string
  AzureDeployment?: string
}

export interface AnthropicProvider extends BaseLLMProvider {
  provider: ProviderNames.Anthropic
  models?: AnthropicModel[]
}

export interface WebLLMProvider extends BaseLLMProvider {
  provider: ProviderNames.WebLLM
  models?: WebllmModel[]
  downloadSize?: string
  vram_required_MB?: string
}

export type LLMProvider =
  | OllamaProvider
  | OpenAIProvider
  | AzureProvider
  | AnthropicProvider
  | WebLLMProvider
  | NCSAHostedProvider
  | NCSAHostedVLLMProvider

export type AllLLMProviders = {
  [key in ProviderNames]: LLMProvider
}

export type ProjectWideLLMProviders = {
  providers: {
    [P in ProviderNames]: LLMProvider & { provider: P }
  }
  defaultModel?: AnySupportedModel
  defaultTemp?: number
}

// Ordered list of preferred model IDs -- the first available model will be used as default
// Priority 1: Admin-defined default model
// Priority 2: Last used model, if actively chosen by end user.
// Priority 3: First available model in preferredModelIds
export const preferredModelIds = [
  AnthropicModelID.Claude_3_5_Sonnet,

  OpenAIModelID.GPT_4o_mini,
  AzureModelID.GPT_4o_mini,

  AnthropicModelID.Claude_3_Haiku,

  OpenAIModelID.GPT_4o,
  AzureModelID.GPT_4o,

  OpenAIModelID.GPT_4_Turbo,
  AzureModelID.GPT_4_Turbo,

  AnthropicModelID.Claude_3_Opus,

  OpenAIModelID.GPT_4,
  AzureModelID.GPT_4,

  OpenAIModelID.GPT_3_5,
]

export const selectBestModel = ({
  projectLLMProviders,
}: {
  projectLLMProviders?: ProjectWideLLMProviders
}): AnySupportedModel => {
  // ⭐️ Priority list for defaults ⭐️
  // 1. Admin-defined on /llms page
  // 2. User defined default from local storage
  // 3. Our preferred model list
  // 4. Fallback: Llama 3.1 70b (poor quality model)
  // Rules for local-storage: If they haven't clicked it, we can't set it. They should opt-in to storing that default.

  // 1. Admin-defined on /llms page
  // console.log("selectBestModel: At top. Here's the admin-defined on /llms page:", projectLLMProviders?.defaultModel || "No project-wide default model")
  if (
    projectLLMProviders &&
    projectLLMProviders.defaultModel &&
    // @ts-ignore - these types are fine.
    projectLLMProviders.providers[projectLLMProviders.defaultModel.provider]
  ) {
    // if defaultModel, and it's one of the project's active models, use it.
    // console.log("selectBestModel: Using 1. Admin-defined on /llms page:", projectLLMProviders.defaultModel)
    return projectLLMProviders.defaultModel
  }

  // 2. User defined default from local storage
  const defaultModelId = localStorage.getItem('defaultModel')
  const allAvailableModels = Object.values(projectLLMProviders?.providers || {})
    .filter((provider) => provider!.enabled)
    .flatMap((provider) => provider!.models || [])
    .filter((model) => model.enabled)

  // console.log('defaultModelId from localstorage: ', defaultModelId)
  if (
    defaultModelId &&
    allAvailableModels.find((m) => m.id === defaultModelId)
  ) {
    const defaultModel = allAvailableModels
      .filter((model) => model.enabled)
      .find((m) => m.id === defaultModelId)
    if (defaultModel) {
      // console.log(
      //   'selectBestModel ✅ -- 2. User-defined default from localStorage:',
      //   JSON.stringify(defaultModel),
      // )
      return defaultModel
    }
  }

  // 3. Our preferred model list
  // console.log("selectBestModel -- 3. checking preferredModels List")
  for (const preferredId of preferredModelIds) {
    const model = allAvailableModels
      .filter((model) => model.enabled)
      .find((m) => m.id === preferredId)
    if (model) {
      console.log(
        'selectBestModel ✅ -- 2. from preferredModels List using: ',
        preferredId,
      )
      return model
    }
  }

  // 4. Fallback: Llama 3.1 70b (poor quality model)
  // console.log("selectBestModel -- 4. falling back to Llama 3.1 70b")
  // localStorage.setItem('defaultModel', NCSAHostedModelID.LLAMA31_70b) // Don't set llama in local storage, it's too bad to be using anywhere.
  return NCSAHostedModels['llama3.1:70b']
}
