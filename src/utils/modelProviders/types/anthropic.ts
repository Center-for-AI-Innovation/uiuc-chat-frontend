export interface AnthropicModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
  extendedThinking?: boolean
}

export enum AnthropicModelID {
  Claude_3_5_Sonnet = 'claude-3-5-sonnet-latest',
  Claude_3_Opus = 'claude-3-opus-latest',
  Claude_3_5_Haiku = 'claude-3-5-haiku-latest',
  Claude_3_7_Sonnet = 'claude-3-7-sonnet-latest',
  Claude_3_7_Sonnet_Thinking = 'claude-3-7-sonnet-latest-thinking',
}

// hardcoded anthropic models
export const AnthropicModels: Record<string, AnthropicModel> = {
  [AnthropicModelID.Claude_3_5_Sonnet]: {
    id: AnthropicModelID.Claude_3_5_Sonnet,
    name: 'Claude 3.5 Sonnet (Use Claude 3.7 instead, same price)',
    tokenLimit: 200000,
    enabled: false, // NOTE: disabled by default!
  },
  [AnthropicModelID.Claude_3_5_Haiku]: {
    id: AnthropicModelID.Claude_3_5_Haiku,
    name: 'Claude 3.5 Haiku',
    tokenLimit: 200000,
    enabled: false, // NOTE: disabled by default!
  },
  [AnthropicModelID.Claude_3_Opus]: {
    id: AnthropicModelID.Claude_3_Opus,
    name: 'Claude 3 Opus',
    tokenLimit: 200000,
    enabled: false, // NOTE: disabled by default!
  },
  [AnthropicModelID.Claude_3_7_Sonnet]: {
    id: AnthropicModelID.Claude_3_7_Sonnet,
    name: 'Claude 3.7 Sonnet (Best coding model)',
    tokenLimit: 200000,
    enabled: true,
  },
  [AnthropicModelID.Claude_3_7_Sonnet_Thinking]: {
    id: AnthropicModelID.Claude_3_7_Sonnet_Thinking,
    name: 'Claude 3.7 Sonnet with Extended Thinking',
    tokenLimit: 200000,
    enabled: true,
    extendedThinking: true,
  },
  // [AnthropicModelID.Claude_3_Sonnet]: {
  //   id: AnthropicModelID.Claude_3_Sonnet,
  //   name: 'Claude 3 sonnet',
  //   tokenLimit: 200000,
  //   enabled: true,
  // },
}
