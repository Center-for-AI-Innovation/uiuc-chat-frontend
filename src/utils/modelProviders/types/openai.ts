import { type ProviderNames } from '../LLMProvider'

export interface OpenAIProvider {
  provider: ProviderNames.OpenAI
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  error?: string
  models?: OpenAIModel[]
}

export interface OpenAIModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum OpenAIModelID {
  // We're not going to support o1 series - they are not worth including because replaced by o3.
  o3 = 'o3', // added - most powerful reasoning model
  o3_mini = 'o3-mini', // rolling model
  o4_mini = 'o4-mini', // added - faster, more affordable reasoning model
  GPT_4o_mini = 'gpt-4o-mini', // rolling model - currently points to gpt-4o-2024-05-13
  GPT_4o = 'gpt-4o', // rolling model - currently points to gpt-4o-2024-05-13
  GPT_4_Turbo = 'gpt-4-turbo', // rolling model - currently points to gpt-4-turbo-2024-04-09
  GPT_4 = 'gpt-4', // rolling model
  GPT_3_5 = 'gpt-3.5-turbo', // rolling model - currently points to gpt-3.5-turbo-0125
  GPT_4_1 = 'gpt-4.1', // rolling model
  GPT_4_1_mini = 'gpt-4.1-mini', // rolling model
  GPT_4_1_nano = 'gpt-4.1-nano', // rolling model
  // New GPT-5 family
  GPT_5 = 'gpt-5',
  GPT_5_mini = 'gpt-5-mini',
  GPT_5_nano = 'gpt-5-nano',
  GPT_5_thinking = 'gpt-5-thinking',
}

export const ModelIDsThatUseDeveloperMessage: readonly OpenAIModelID[] = [
  OpenAIModelID.o3_mini,
  OpenAIModelID.o3,
  OpenAIModelID.o4_mini,
] as const

export const GPT5Models: readonly OpenAIModelID[] = [
  OpenAIModelID.GPT_5,
  OpenAIModelID.GPT_5_mini,
  OpenAIModelID.GPT_5_nano,
  OpenAIModelID.GPT_5_thinking,
] as const

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  // NOTE: We use these as default values for enabled: true/false.

  [OpenAIModelID.o3]: {
    id: OpenAIModelID.o3,
    name: 'o3 (Reasoning)',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAIModelID.o3_mini]: {
    id: OpenAIModelID.o3_mini,
    name: 'o3-mini (Reasoning)',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAIModelID.o4_mini]: {
    id: OpenAIModelID.o4_mini,
    name: 'o4-mini (Reasoning)',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAIModelID.GPT_4o_mini]: {
    id: OpenAIModelID.GPT_4o_mini,
    name: 'GPT-4o mini',
    tokenLimit: 128000,
    enabled: true,
  },
  [OpenAIModelID.GPT_4o]: {
    id: OpenAIModelID.GPT_4o,
    name: 'GPT-4o',
    tokenLimit: 128000,
    enabled: true,
  },
  [OpenAIModelID.GPT_4_Turbo]: {
    id: OpenAIModelID.GPT_4_Turbo,
    name: 'GPT-4 Turbo (legacy)',
    tokenLimit: 128000,
    enabled: false,
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4 (legacy)',
    tokenLimit: 8192,
    enabled: false,
  },
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPT-3.5 (legacy)',
    tokenLimit: 16385,
    enabled: false,
  },
  [OpenAIModelID.GPT_4_1]: {
    id: OpenAIModelID.GPT_4_1,
    name: 'GPT-4.1',
    tokenLimit: 1047576,
    enabled: true,
  },
  [OpenAIModelID.GPT_4_1_mini]: {
    id: OpenAIModelID.GPT_4_1_mini,
    name: 'GPT-4.1 Mini',
    tokenLimit: 1047576,
    enabled: true,
  },
  [OpenAIModelID.GPT_4_1_nano]: {
    id: OpenAIModelID.GPT_4_1_nano,
    name: 'GPT-4.1 Nano',
    tokenLimit: 1047576,
    enabled: true,
  },
  [OpenAIModelID.GPT_5]: {
    id: OpenAIModelID.GPT_5,
    name: 'GPT-5',
    tokenLimit: 400000,
    enabled: true,
  },
  [OpenAIModelID.GPT_5_mini]: {
    id: OpenAIModelID.GPT_5_mini,
    name: 'GPT-5 Mini',
    tokenLimit: 400000,
    enabled: true,
  },
  [OpenAIModelID.GPT_5_nano]: {
    id: OpenAIModelID.GPT_5_nano,
    name: 'GPT-5 Nano',
    tokenLimit: 400000,
    enabled: true,
  },
  [OpenAIModelID.GPT_5_thinking]: {
    id: OpenAIModelID.GPT_5_thinking,
    name: 'GPT-5 Thinking',
    tokenLimit: 400000,
    enabled: true,
  },
}
