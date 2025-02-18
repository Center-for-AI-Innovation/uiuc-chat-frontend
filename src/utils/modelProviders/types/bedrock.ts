export interface BedrockModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum BedrockModelID {
  Claude_3_Opus = 'us.anthropic.claude-3-opus-20240229-v1:0',
  Claude_3_5_Sonnet_Latest = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  Claude_3_5_Haiku = 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  Nova_Pro = 'us.amazon.nova-pro-v1:0',
  Nova_Lite = 'us.amazon.nova-lite-v1:0',
  Nova_Micro = 'us.amazon.nova-micro-v1:0',
  Llama3_2_1B_Instruct = 'us.meta.llama3-2-1b-instruct-v1:0',
  Llama3_2_3B_Instruct = 'us.meta.llama3-2-3b-instruct-v1:0',
  Llama3_2_11B_Instruct = 'us.meta.llama3-2-11b-instruct-v1:0',
  Llama3_2_90B_Instruct = 'us.meta.llama3-2-90b-instruct-v1:0',
  Llama3_3_70B_Instruct = 'us.meta.llama3-3-70b-instruct-v1:0',
  // Mistral_Large_2402 = 'us.mistral.mistral-large-2402-v1:0',
  // Mistral_7B_Instruct = 'us.mistral.mistral-7b-instruct-v0:2',
  // Mistral_Small_2402 = 'us.mistral.mistral-small-2402-v1:0',
}

export const BedrockModels: Record<BedrockModelID, BedrockModel> = {
  [BedrockModelID.Claude_3_Opus]: {
    id: BedrockModelID.Claude_3_Opus,
    name: 'Claude 3 Opus (Bedrock)',
    tokenLimit: 200000,
    enabled: true,
  },
  [BedrockModelID.Claude_3_5_Sonnet_Latest]: {
    id: BedrockModelID.Claude_3_5_Sonnet_Latest,
    name: 'Claude 3.5 Sonnet Latest (Bedrock)',
    tokenLimit: 200000,
    enabled: true,
  },
  [BedrockModelID.Claude_3_5_Haiku]: {
    id: BedrockModelID.Claude_3_5_Haiku,
    name: 'Claude 3.5 Haiku (Bedrock)',
    tokenLimit: 200000,
    enabled: true,
  },
  [BedrockModelID.Nova_Pro]: {
    id: BedrockModelID.Nova_Pro,
    name: 'Amazon Nova Pro (Bedrock)',
    tokenLimit: 300000,
    enabled: true,
  },
  [BedrockModelID.Nova_Lite]: {
    id: BedrockModelID.Nova_Lite,
    name: 'Amazon Nova Lite (Bedrock)',
    tokenLimit: 300000,
    enabled: true,
  },
  [BedrockModelID.Nova_Micro]: {
    id: BedrockModelID.Nova_Micro,
    name: 'Amazon Nova Micro (Bedrock)',
    tokenLimit: 128000,
    enabled: true,
  },
  [BedrockModelID.Llama3_2_1B_Instruct]: {
    id: BedrockModelID.Llama3_2_1B_Instruct,
    name: 'Llama 3.2 1B Instruct (Bedrock)',
    tokenLimit: 128000,
    enabled: true,
  },
  [BedrockModelID.Llama3_2_3B_Instruct]: {
    id: BedrockModelID.Llama3_2_3B_Instruct,
    name: 'Llama 3.2 3B Instruct (Bedrock)',
    tokenLimit: 128000,
    enabled: true,
  },
  [BedrockModelID.Llama3_2_11B_Instruct]: {
    id: BedrockModelID.Llama3_2_11B_Instruct,
    name: 'Llama 3.2 11B Instruct (Bedrock)',
    tokenLimit: 128000,
    enabled: true,
  },
  [BedrockModelID.Llama3_2_90B_Instruct]: {
    id: BedrockModelID.Llama3_2_90B_Instruct,
    name: 'Llama 3.2 90B Instruct (Bedrock)',
    tokenLimit: 128000,
    enabled: true,
  },
  [BedrockModelID.Llama3_3_70B_Instruct]: {
    id: BedrockModelID.Llama3_3_70B_Instruct,
    name: 'Llama 3.3 70B Instruct (Bedrock)',
    tokenLimit: 128000,
    enabled: true,
  },
  // Mistral models are not ready. Will iterate on this.
  // [BedrockModelID.Mistral_Large_2402]: {
  //   id: BedrockModelID.Mistral_Large_2402,
  //   name: 'Mistral Large 2402 (Bedrock)',
  //   tokenLimit: 32000,
  //   enabled: true
  // },
  // [BedrockModelID.Mistral_7B_Instruct]: {
  //   id: BedrockModelID.Mistral_7B_Instruct,
  //   name: 'Mistral 7B Instruct (Bedrock)',
  //   tokenLimit: 32000,
  //   enabled: true
  // },
  // [BedrockModelID.Mistral_Small_2402]: {
  //   id: BedrockModelID.Mistral_Small_2402,
  //   name: 'Mistral Small 2402 (Bedrock)',
  //   tokenLimit: 32000,
  //   enabled: true
  // }
}
