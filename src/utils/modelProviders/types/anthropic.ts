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

  // Claude 4 family
  Claude_Sonnet_4 = 'claude-sonnet-4-20250514',
  Claude_Sonnet_4_Thinking = 'claude-sonnet-4-20250514-thinking',
  Claude_Opus_4 = 'claude-opus-4-20250514',
  Claude_Opus_4_Thinking = 'claude-opus-4-20250514-thinking',
  Claude_Opus_4_1 = 'claude-opus-4-1-20250805',
  Claude_Opus_4_1_Thinking = 'claude-opus-4-1-20250805-thinking',
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
  // Claude 4 family
  [AnthropicModelID.Claude_Sonnet_4]: {
    id: AnthropicModelID.Claude_Sonnet_4,
    name: 'Claude Sonnet 4',
    tokenLimit: 200000, // 200k context window
    enabled: true,
  },
  [AnthropicModelID.Claude_Sonnet_4_Thinking]: {
    id: AnthropicModelID.Claude_Sonnet_4_Thinking,
    name: 'Claude Sonnet 4 with Extended Thinking',
    tokenLimit: 200000,
    enabled: true,
    extendedThinking: true,
  },
  [AnthropicModelID.Claude_Opus_4]: {
    id: AnthropicModelID.Claude_Opus_4,
    name: 'Claude Opus 4',
    tokenLimit: 200000,
    enabled: false,
  },
  [AnthropicModelID.Claude_Opus_4_Thinking]: {
    id: AnthropicModelID.Claude_Opus_4_Thinking,
    name: 'Claude Opus 4 with Extended Thinking',
    tokenLimit: 200000,
    enabled: false,
    extendedThinking: true,
  },
  [AnthropicModelID.Claude_Opus_4_1]: {
    id: AnthropicModelID.Claude_Opus_4_1,
    name: 'Claude Opus 4.1',
    tokenLimit: 200000,
    enabled: false,
  },
  [AnthropicModelID.Claude_Opus_4_1_Thinking]: {
    id: AnthropicModelID.Claude_Opus_4_1_Thinking,
    name: 'Claude Opus 4.1 with Extended Thinking',
    tokenLimit: 200000,
    enabled: false,
    extendedThinking: true,
  },
  // [AnthropicModelID.Claude_3_Sonnet]: {
  //   id: AnthropicModelID.Claude_3_Sonnet,
  //   name: 'Claude 3 sonnet',
  //   tokenLimit: 200000,
  //   enabled: true,
  // },
}
