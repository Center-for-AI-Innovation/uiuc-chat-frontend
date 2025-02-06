import { ProviderNames } from '../LLMProvider'

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
  // O1 = 'o1', // rolling model - currently points to gpt-3.5-turbo-0125
  // O1_mini = 'o1-mini', // rolling model - currently points to gpt-3.5-turbo-0125
  // O3 = 'o3', // rolling model - currently points to gpt-3.5-turbo-0125
  O3_mini = 'o3-mini', // rolling model - currently points to gpt-3.5-turbo-0125
  GPT_4o_mini = 'gpt-4o-mini', // rolling model - currently points to gpt-4o-2024-05-13
  GPT_4o = 'gpt-4o', // rolling model - currently points to gpt-4o-2024-05-13
  GPT_4 = 'gpt-4', // rolling model - currently points to gpt-4-0613
  GPT_4_Turbo = 'gpt-4-turbo', // rolling model - currently points to gpt-4-turbo-2024-04-09
  GPT_3_5 = 'gpt-3.5-turbo', // rolling model - currently points to gpt-3.5-turbo-0125
}

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  // NOTE: We use these as default values for enabled: true/false.

  // [OpenAIModelID.GPT_o1]: {
  //   id: OpenAIModelID.GPT_4o_mini,
  //   name: 'o1-preview',
  //   tokenLimit: 128000,
  //   enabled: true,
  // },
  [OpenAIModelID.O3_mini]: {
    id: OpenAIModelID.O3_mini,
    name: 'OpenAI O3-mini (smartest model today)',
    tokenLimit: 200000,
    enabled: true,
  },
  // [OpenAIModelID.O1_mini]: {
  //   id: OpenAIModelID.O1_mini,
  //   name: 'OpenAI O1-mini',
  //   tokenLimit: 200000,
  //   enabled: true,
  // },
  // [OpenAIModelID.O1]: {
  //   id: OpenAIModelID.O1,
  //   name: 'OpenAI O1',
  //   tokenLimit: 200000,
  //   enabled: true,
  // },
  [OpenAIModelID.GPT_4o_mini]: {
    id: OpenAIModelID.GPT_4o_mini,
    name: 'GPT-4o mini (best price / performance)',
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
}
