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
}

export enum OpenAIModelID {
  // GPT_o1 = 'o1-preview', // rolling model
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
    name: 'GPT-4 Turbo',
    tokenLimit: 128000,
    enabled: false,
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4',
    tokenLimit: 8192,
    enabled: false,
  },
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPT-3.5',
    tokenLimit: 16385,
    enabled: false,
  },
}
