export interface BedrockModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum BedrockModelID {
  Claude_3_Sonnet = 'anthropic.claude-3-sonnet-20240229-v1:0',
  Claude_3_Haiku = 'anthropic.claude-3-haiku-20240307-v1:0',
  Claude_2_1 = 'anthropic.claude-v2:1',
  Claude_Instant = 'anthropic.claude-instant-v1',
  Titan_Express = 'amazon.titan-text-express-v1',
  Titan_Lite = 'amazon.titan-text-lite-v1',
  Llama2_70B = 'meta.llama2-70b-chat-v1',
  Llama2_13B = 'meta.llama2-13b-chat-v1'
}

export const BedrockModels: Record<BedrockModelID, BedrockModel> = {
  [BedrockModelID.Claude_3_Sonnet]: {
    id: BedrockModelID.Claude_3_Sonnet,
    name: 'Claude 3 Sonnet (Bedrock)',
    tokenLimit: 200000,
    enabled: true
  },
  [BedrockModelID.Claude_3_Haiku]: {
    id: BedrockModelID.Claude_3_Haiku,
    name: 'Claude 3 Haiku (Bedrock)',
    tokenLimit: 200000,
    enabled: true
  },
  [BedrockModelID.Claude_2_1]: {
    id: BedrockModelID.Claude_2_1,
    name: 'Claude 2.1 (Bedrock)',
    tokenLimit: 100000,
    enabled: true
  },
  [BedrockModelID.Claude_Instant]: {
    id: BedrockModelID.Claude_Instant,
    name: 'Claude Instant (Bedrock)',
    tokenLimit: 100000,
    enabled: true
  },
  [BedrockModelID.Titan_Express]: {
    id: BedrockModelID.Titan_Express,
    name: 'Titan Text Express',
    tokenLimit: 8000,
    enabled: true
  },
  [BedrockModelID.Titan_Lite]: {
    id: BedrockModelID.Titan_Lite,
    name: 'Titan Text Lite',
    tokenLimit: 4000,
    enabled: true
  },
  [BedrockModelID.Llama2_70B]: {
    id: BedrockModelID.Llama2_70B,
    name: 'Llama 2 70B (Bedrock)',
    tokenLimit: 4096,
    enabled: true
  },
  [BedrockModelID.Llama2_13B]: {
    id: BedrockModelID.Llama2_13B,
    name: 'Llama 2 13B (Bedrock)',
    tokenLimit: 4096,
    enabled: true
  }
} 