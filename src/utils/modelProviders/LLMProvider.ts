import {
  type OllamaModel,
  OllamaModelIDs,
  OllamaModels,
} from '~/utils/modelProviders/ollama'
import { type WebllmModel } from '~/utils/modelProviders/WebLLM'
import {
  type OpenAIModel,
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'
import {
  type AnthropicModel,
  AnthropicModelID,
  AnthropicModels,
} from '~/utils/modelProviders/types/anthropic'
import {
  type AzureModel,
  AzureModelID,
  AzureModels,
} from '~/utils/modelProviders/azure'
import {
  type NCSAHostedVLMModel,
  NCSAHostedVLMModelID,
  NCSAHostedVLMModels,
} from '~/utils/modelProviders/types/NCSAHostedVLM'
import {
  type BedrockModel,
  BedrockModelID,
  BedrockModels,
} from '~/utils/modelProviders/types/bedrock'
import {
  type GeminiModel,
  GeminiModelID,
  GeminiModels,
} from '~/utils/modelProviders/types/gemini'
import {
  type SambaNovaModel,
  SambaNovaModelID,
  SambaNovaModels,
} from '~/utils/modelProviders/types/SambaNova'

export enum ProviderNames {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
  Azure = 'Azure',
  Anthropic = 'Anthropic',
  WebLLM = 'WebLLM',
  NCSAHosted = 'NCSAHosted',
  NCSAHostedVLM = 'NCSAHostedVLM',
  Bedrock = 'Bedrock',
  Gemini = 'Gemini',
  SambaNova = 'SambaNova',
}

// Define the preferred order of providers, like in modelSelect dropdown
export const LLM_PROVIDER_ORDER: ProviderNames[] = [
  ProviderNames.NCSAHostedVLM,
  ProviderNames.NCSAHosted,
  ProviderNames.Anthropic,
  ProviderNames.OpenAI,
  ProviderNames.Azure,
  ProviderNames.Gemini,
  ProviderNames.Bedrock,
  ProviderNames.SambaNova,
  ProviderNames.Ollama,
  ProviderNames.WebLLM,
]

export type AnySupportedModel =
  | OllamaModel
  | OpenAIModel
  | WebllmModel
  | AnthropicModel
  | AzureModel
  | NCSAHostedVLMModel
  | BedrockModel
  | GeminiModel
  | SambaNovaModel
// Add other vision capable models as needed
export const VisionCapableModels: Set<
  | OpenAIModelID
  | AzureModelID
  | AnthropicModelID
  | NCSAHostedVLMModelID
  | GeminiModelID
  | BedrockModelID
  | SambaNovaModelID
> = new Set([
  OpenAIModelID.o3,
  OpenAIModelID.o4_mini,
  OpenAIModelID.GPT_4_Turbo,
  OpenAIModelID.GPT_4o,
  OpenAIModelID.GPT_4o_mini,
  OpenAIModelID.GPT_4_1,
  OpenAIModelID.GPT_4_1_mini,
  OpenAIModelID.GPT_4_1_nano,

  AzureModelID.o3,
  AzureModelID.o4_mini,
  AzureModelID.GPT_4_Turbo,
  AzureModelID.GPT_4o,
  AzureModelID.GPT_4o_mini,
  AzureModelID.GPT_4_1,
  AzureModelID.GPT_4_1_mini,
  AzureModelID.GPT_4_1_nano,
  
  // claude-3.5....
  AnthropicModelID.Claude_3_7_Sonnet,
  AnthropicModelID.Claude_3_7_Sonnet_Thinking,
  AnthropicModelID.Claude_3_5_Sonnet,
  AnthropicModelID.Claude_3_5_Haiku,

  // VLM
  NCSAHostedVLMModelID.Llama_3_2_11B_Vision_Instruct,
  NCSAHostedVLMModelID.MOLMO_7B_D_0924,
  NCSAHostedVLMModelID.QWEN2_VL_72B_INSTRUCT,
  NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,

  // Gemini
  GeminiModelID.Gemini_2_5_Pro_Exp_03_25,
  GeminiModelID.Gemini_2_0_Pro_Exp_02_05,
  GeminiModelID.Gemini_2_0_Flash,
  GeminiModelID.Gemini_2_0_Flash_Lite,

  // Bedrock
  BedrockModelID.Claude_3_Opus,
  BedrockModelID.Claude_3_5_Sonnet_Latest,
  BedrockModelID.Nova_Pro,
  BedrockModelID.Nova_Lite,
  BedrockModelID.Llama3_2_11B_Instruct,
  BedrockModelID.Llama3_2_90B_Instruct,
])

/**
 * Models that support extended reasoning/thinking capabilities
 * These models can process <think> tags and have extended thinking enabled
 */
export const ReasoningCapableModels: Set<
  AnthropicModelID | OpenAIModelID | OllamaModelIDs
> = new Set([
  AnthropicModelID.Claude_3_7_Sonnet_Thinking,
  OpenAIModelID.o3,
  OpenAIModelID.o3_mini,
  OpenAIModelID.o4_mini,
  OpenAIModelID.GPT_4_1,
  OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16,
  // Add other reasoning-capable models as they become available
])

export const AllSupportedModels: Set<GenericSupportedModel> = new Set([
  ...Object.values(AnthropicModels),
  ...Object.values(OpenAIModels),
  ...Object.values(AzureModels),
  ...Object.values(OllamaModels),
  ...Object.values(NCSAHostedVLMModels),
  ...Object.values(BedrockModels),
  ...Object.values(GeminiModels),
  ...Object.values(SambaNovaModels),
  // ...webLLMModels,
])
// e.g. Easily validate ALL POSSIBLE models that we support. They may be offline or disabled, but they are supported.
// {
//   id: 'llama3.1:70b',
//   name: 'Llama 3.1 70b',
//   parameterSize: '70b',
//   tokenLimit: 16385,
//   enabled: false
// },
//   {
//   id: 'gpt-3.5-turbo',
//   name: 'GPT-3.5',
//   tokenLimit: 16385,
//   enabled: false
// },

export interface GenericSupportedModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  parameterSize?: string
  default?: boolean
  temperature?: number
}

export interface BaseLLMProvider {
  provider: ProviderNames
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  error?: string
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

export interface NCSAHostedVLMProvider extends BaseLLMProvider {
  // This uses Ollama, but hosted by NCSA. Keep it separate.
  provider: ProviderNames.NCSAHostedVLM
  models?: NCSAHostedVLMModel[]
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

export interface BedrockProvider extends BaseLLMProvider {
  provider: ProviderNames.Bedrock
  models?: BedrockModel[]
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  inferenceProfileArn?: string
}

export interface GeminiProvider extends BaseLLMProvider {
  provider: ProviderNames.Gemini
  models?: GeminiModel[]
}

export interface SambaNovaProvider extends BaseLLMProvider {
  provider: ProviderNames.SambaNova
  models?: SambaNovaModel[]
}

export type LLMProvider =
  | OllamaProvider
  | OpenAIProvider
  | AzureProvider
  | AnthropicProvider
  | WebLLMProvider
  | NCSAHostedProvider
  | NCSAHostedVLMProvider
  | BedrockProvider
  | GeminiProvider
  | SambaNovaProvider

// export type AllLLMProviders = {
//   [P in ProviderNames]?: LLMProvider & { provider: P }
// }

// export interface AllLLMProviders {
//   [key: string]: LLMProvider & { provider: ProviderNames } | undefined;
// }

export type AllLLMProviders = {
  [key in ProviderNames]: LLMProvider
}

// Ordered list of preferred model IDs -- the first available model will be used as default
export const preferredModelIds = [
  OpenAIModelID.GPT_4_1,
  OpenAIModelID.GPT_4_1_mini,
  OpenAIModelID.o3,
  OpenAIModelID.o4_mini,
  AnthropicModelID.Claude_3_5_Sonnet,
  OpenAIModelID.GPT_4o_mini,
  AzureModelID.GPT_4o_mini,
  AnthropicModelID.Claude_3_5_Haiku,
  OpenAIModelID.GPT_4_1_nano,
  OpenAIModelID.GPT_4o,
  AzureModelID.GPT_4o,
  OpenAIModelID.GPT_4_Turbo,
  AzureModelID.GPT_4_Turbo,
  AnthropicModelID.Claude_3_Opus,
  OpenAIModelID.GPT_4,
  AzureModelID.GPT_4,
  OpenAIModelID.GPT_3_5,
  NCSAHostedVLMModelID.QWEN2_VL_72B_INSTRUCT,
]

export const selectBestModel = (
  allLLMProviders: AllLLMProviders,
): GenericSupportedModel => {
  // Find default model from the local Storage
  // Currently, if the user ever specified a default model in local storage, this will ALWAYS override the default model specified by the admin,
  // especially for the creation of new chats.
  const allModels = Object.values(allLLMProviders)
    .filter((provider) => provider!.enabled)
    .flatMap((provider) => provider!.models || [])
    .filter((model) => model.enabled)

  const defaultModelId = localStorage.getItem('defaultModel')

  if (defaultModelId && allModels.find((m) => m.id === defaultModelId)) {
    const defaultModel = allModels
      .filter((model) => model.enabled)
      .find((m) => m.id === defaultModelId)
    if (defaultModel) {
      return defaultModel
    }
  }
  // If the default model that a user specifies is not available, fall back to the admin selected default model.
  const globalDefaultModel = Object.values(allLLMProviders)
    .filter((provider) => provider!.enabled)
    .flatMap((provider) => provider!.models || [])
    .filter((model) => model.default)
  if (globalDefaultModel[0]) {
    // This will always return one record since the default model is unique. If there are two default models (that means default model functionality is broken), this will return the first one.
    return globalDefaultModel[0] as GenericSupportedModel
  }
  // If the conversation model is not available or invalid, use the preferredModelIds
  for (const preferredId of preferredModelIds) {
    const model = allModels
      .filter((model) => model.enabled)
      .find((m) => m.id === preferredId)
    if (model) {
      // localStorage.setItem('defaultModel', preferredId)
      return model
    }
  }
  // If no preferred models are available, fallback to llama3.1:8b-instruct-fp16
  return NCSAHostedVLMModels[NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT]
}
