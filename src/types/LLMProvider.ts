import { OllamaModel, OllamaModels } from '~/utils/modelProviders/ollama'
import { OpenAIModel, OpenAIModelID, OpenAIModels } from './openai'
import { WebllmModel, webLLMModels } from '~/utils/modelProviders/WebLLM'
import { AnthropicModel } from '~/utils/modelProviders/anthropic'
import { AzureModel } from '~/utils/modelProviders/azure'

export enum ProviderNames {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
  Azure = 'Azure',
  Anthropic = 'Anthropic',
  WebLLM = 'WebLLM',
}

export type SupportedModels =
  | OllamaModel[]
  | OpenAIModel[]
  | WebllmModel[]
  | AnthropicModel[]
  | AzureModel[]

// Add other vision capable models as needed
export const VisionCapableModels: Set<OpenAIModelID> = new Set([
  OpenAIModelID.GPT_4_Turbo,
  OpenAIModelID.GPT_4_AZURE_04_09,
  OpenAIModelID.GPT_4o,
  OpenAIModelID.GPT_4o_mini,
  // claude-3.5....
])

export const AllSupportedModels: Set<GenericSupportedModel> = new Set([
  ...Object.values(OllamaModels),
  ...Object.values(OpenAIModels),
  ...webLLMModels,
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
}

export interface BaseLLMProvider {
  provider: ProviderNames
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  models?: SupportedModels
  error?: string
}

export interface OllamaProvider extends BaseLLMProvider {
  provider: ProviderNames.Ollama
}

export interface OpenAIProvider extends BaseLLMProvider {
  provider: ProviderNames.OpenAI
}

export interface AzureProvider extends BaseLLMProvider {
  provider: ProviderNames.Azure
  AzureEndpoint?: string
  AzureDeployment?: string
}

export interface AnthropicProvider extends BaseLLMProvider {
  provider: ProviderNames.Anthropic
}

export interface WebLLMProvider extends BaseLLMProvider {
  provider: ProviderNames.WebLLM
}

export type LLMProvider =
  | OllamaProvider
  | OpenAIProvider
  | AzureProvider
  | AnthropicProvider
  | WebLLMProvider

export type AllLLMProviders = {
  [P in ProviderNames]?: LLMProvider & { provider: P }
}
