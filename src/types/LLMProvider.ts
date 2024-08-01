import { OllamaModel } from '~/utils/modelProviders/ollama'
import { OpenAIModel } from './openai'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
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

export interface GenericSupportedModel {
  id: string
  name: string
  tokenLimit: number
  parameterSize?: string
  enabled: boolean
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
