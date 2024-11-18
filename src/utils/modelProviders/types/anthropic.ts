export interface AnthropicModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
}

export enum AnthropicModelID {
  Claude_3_5_Sonnet = 'claude-3-5-sonnet-latest',
  Claude_3_Opus = 'claude-3-opus-latest',
  Claude_3_5_Haiku = 'claude-3-5-haiku-latest',
}

// hardcoded anthropic models
export const AnthropicModels: Record<AnthropicModelID, AnthropicModel> = {
  [AnthropicModelID.Claude_3_5_Sonnet]: {
    id: AnthropicModelID.Claude_3_5_Sonnet,
    name: 'Claude 3.5 Sonnet',
    tokenLimit: 200000,
    enabled: true,
  },
  [AnthropicModelID.Claude_3_5_Haiku]: {
    id: AnthropicModelID.Claude_3_5_Haiku,
    name: 'Claude 3.5 Haiku',
    tokenLimit: 200000,
    enabled: true,
  },
  [AnthropicModelID.Claude_3_Opus]: {
    id: AnthropicModelID.Claude_3_Opus,
    name: 'Claude 3 Opus',
    tokenLimit: 200000,
    enabled: false, // NOTE: disabled by default!
  },
  // [AnthropicModelID.Claude_3_Sonnet]: {
  //   id: AnthropicModelID.Claude_3_Sonnet,
  //   name: 'Claude 3 sonnet',
  //   tokenLimit: 200000,
  //   enabled: true,
  // },
}
