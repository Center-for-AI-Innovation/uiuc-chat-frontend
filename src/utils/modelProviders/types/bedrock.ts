export interface BedrockModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum BedrockModelID {
  Claude_3_Opus = 'anthropic.claude-3-opus-20240229-v1:0',
  Claude_3_Sonnet = 'anthropic.claude-3-sonnet-20240229-v1:0',
  Claude_3_Haiku = 'anthropic.claude-3-haiku-20240307-v1:0',
  Claude_3_5_Sonnet_Latest = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  Claude_3_5_Sonnet = 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  Claude_3_5_Haiku = 'anthropic.claude-3-5-haiku-20241022-v1:0',
  Claude_2_1 = 'anthropic.claude-v2:1',
  Claude_Instant = 'anthropic.claude-instant-v1',
  Titan_Express = 'amazon.titan-text-express-v1',
  Titan_Lite = 'amazon.titan-text-lite-v1',
  Llama2_70B = 'meta.llama2-70b-chat-v1',
  Llama2_13B = 'meta.llama2-13b-chat-v1',
  Llama3_2_1B_Instruct = 'meta.llama3-2-1b-instruct-v1:0',
  Llama3_2_3B_Instruct = 'meta.llama3-2-3b-instruct-v1:0',
  Llama3_2_11B_Instruct = 'meta.llama3-2-11b-instruct-v1:0',
  Llama3_2_90B_Instruct = 'meta.llama3-2-90b-instruct-v1:0',
}

export const BedrockModels: Record<BedrockModelID, BedrockModel> = {
  [BedrockModelID.Claude_3_Opus]: {
    id: BedrockModelID.Claude_3_Opus,
    name: 'Claude 3 Opus (Bedrock)',
    tokenLimit: 200000,
    enabled: true
  },
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
  [BedrockModelID.Claude_3_5_Sonnet_Latest]: {
    id: BedrockModelID.Claude_3_5_Sonnet_Latest,
    name: 'Claude 3.5 Sonnet Latest (Bedrock)',
    tokenLimit: 200000,
    enabled: true
  },
  [BedrockModelID.Claude_3_5_Sonnet]: {
    id: BedrockModelID.Claude_3_5_Sonnet,
    name: 'Claude 3.5 Sonnet (Bedrock)',
    tokenLimit: 200000,
    enabled: true
  },
  [BedrockModelID.Claude_3_5_Haiku]: {
    id: BedrockModelID.Claude_3_5_Haiku,
    name: 'Claude 3.5 Haiku (Bedrock)',
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
  },
  [BedrockModelID.Llama3_2_1B_Instruct]: {
    id: BedrockModelID.Llama3_2_1B_Instruct,
    name: 'Llama 3.2 1B Instruct (Bedrock)',
    tokenLimit: 4096,
    enabled: true
  },
  [BedrockModelID.Llama3_2_3B_Instruct]: {
    id: BedrockModelID.Llama3_2_3B_Instruct,
    name: 'Llama 3.2 3B Instruct (Bedrock)',
    tokenLimit: 4096,
    enabled: true
  },
  [BedrockModelID.Llama3_2_11B_Instruct]: {
    id: BedrockModelID.Llama3_2_11B_Instruct,
    name: 'Llama 3.2 11B Instruct (Bedrock)',
    tokenLimit: 4096,
    enabled: true
  },
  [BedrockModelID.Llama3_2_90B_Instruct]: {
    id: BedrockModelID.Llama3_2_90B_Instruct,
    name: 'Llama 3.2 90B Instruct (Bedrock)',
    tokenLimit: 4096,
    enabled: true
  }
} 