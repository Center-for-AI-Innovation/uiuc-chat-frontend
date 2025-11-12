import { type ProviderNames } from '../LLMProvider'

export interface OpenAICompatibleProvider {
  provider: ProviderNames.OpenAICompatible
  enabled: boolean
  baseUrl: string
  apiKey?: string
  error?: string
  models?: OpenAICompatibleModel[]
}

export interface OpenAICompatibleModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
}

export enum OpenAICompatibleModelID {
  GPT_5 = 'openai/gpt-5',
  Llama_3_3_70B_Instruct = 'meta-llama/llama-3.3-70b-instruct',
  Llama_4_Maverick = 'meta-llama/llama-4-maverick',
  DeepSeek_V3_0324 = 'deepseek/deepseek-chat-v3-0324',
  DeepSeek_V3_1 = 'deepseek/deepseek-chat-v3.1',
  DeepSeek_V3_1_Terminus = 'deepseek/deepseek-v3.1-terminus',
  DeepSeek_V3_2_Exp = 'deepseek/deepseek-v3.2-exp',
  DeepSeek_R1_Zero = 'deepseek/deepseek-r1-zero',
  DeepSeek_R1_0528_Qwen3_8B = 'deepseek/deepseek-r1-0528-qwen3-8b',
  GPT_OSS_120B = 'openai/gpt-oss-120b',
  EVA_Qwen2_5_32B = 'eva-unit-01/eva-qwen-2.5-32b',
  Qwen3_32B = 'qwen/qwen3-32b',
  Qwen3_VL_235B_A22B_Thinking = 'qwen/qwen3-vl-235b-a22b-thinking',
  Qwen3_235B_A22B = 'qwen/qwen3-235b-a22b',
  Qwen3_Coder_Plus = 'qwen/qwen3-coder-plus',
  Kimi_K2_0711 = 'moonshotai/kimi-k2',
  Kimi_K2_0905 = 'moonshotai/kimi-k2-0905',
  GLM_4_5 = 'z-ai/glm-4.5',
  GLM_4_1V_9B_Thinking = 'thudm/glm-4.1v-9b-thinking',
  GLM_4_5V = 'z-ai/glm-4.5v',
  GLM_4_5_Air = 'z-ai/glm-4.5-air',
  GLM_4_6 = 'z-ai/glm-4.6',
  MiniMax_M2 = 'minimax/minimax-m2',
  Gemini_2_5_Flash_Lite = 'google/gemini-2.5-flash-lite',
  GPT_4o = 'openai/gpt-4o',
  GPT_4_1 = 'openai/gpt-4.1',
  o3_Mini = 'openai/o3-mini',
  o4_Mini = 'openai/o4-mini',
  o3_Pro = 'openai/o3-pro',
  Claude_Opus_4_1 = 'anthropic/claude-opus-4.1',
  Claude_Haiku_4_5 = 'anthropic/claude-haiku-4.5',
  Grok_3_Mini = 'x-ai/grok-3-mini',
  Grok_4_Fast = 'x-ai/grok-4-fast',
}

export const OpenAICompatibleModels: Record<
  OpenAICompatibleModelID,
  OpenAICompatibleModel
> = {
  [OpenAICompatibleModelID.GPT_5]: {
    id: OpenAICompatibleModelID.GPT_5,
    name: 'OpenAI: GPT-5',
    tokenLimit: 400000,
    enabled: true,
  },
  [OpenAICompatibleModelID.Llama_3_3_70B_Instruct]: {
    id: OpenAICompatibleModelID.Llama_3_3_70B_Instruct,
    name: 'Meta: Llama 3.3 70B Instruct',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Llama_4_Maverick]: {
    id: OpenAICompatibleModelID.Llama_4_Maverick,
    name: 'Meta: Llama 4 Maverick',
    tokenLimit: 128000,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_V3_0324]: {
    id: OpenAICompatibleModelID.DeepSeek_V3_0324,
    name: 'DeepSeek: DeepSeek V3 0324',
    tokenLimit: 163840,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_V3_1]: {
    id: OpenAICompatibleModelID.DeepSeek_V3_1,
    name: 'DeepSeek: DeepSeek V3.1',
    tokenLimit: 163800,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_V3_1_Terminus]: {
    id: OpenAICompatibleModelID.DeepSeek_V3_1_Terminus,
    name: 'DeepSeek: DeepSeek V3.1 Terminus',
    tokenLimit: 163840,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_V3_2_Exp]: {
    id: OpenAICompatibleModelID.DeepSeek_V3_2_Exp,
    name: 'DeepSeek: DeepSeek V3.2 Exp',
    tokenLimit: 163840,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_R1_Zero]: {
    id: OpenAICompatibleModelID.DeepSeek_R1_Zero,
    name: 'DeepSeek: DeepSeek R1 Zero',
    tokenLimit: 163840,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_R1_0528_Qwen3_8B]: {
    id: OpenAICompatibleModelID.DeepSeek_R1_0528_Qwen3_8B,
    name: 'DeepSeek: DeepSeek R1 0528 Qwen3 8B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_OSS_120B]: {
    id: OpenAICompatibleModelID.GPT_OSS_120B,
    name: 'OpenAI: gpt-oss-120b',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.EVA_Qwen2_5_32B]: {
    id: OpenAICompatibleModelID.EVA_Qwen2_5_32B,
    name: 'EVA Qwen2.5 32B',
    tokenLimit: 32000,
    enabled: true,
  },
  [OpenAICompatibleModelID.Qwen3_32B]: {
    id: OpenAICompatibleModelID.Qwen3_32B,
    name: 'Qwen: Qwen3 32B',
    tokenLimit: 40960,
    enabled: true,
  },
  [OpenAICompatibleModelID.Qwen3_VL_235B_A22B_Thinking]: {
    id: OpenAICompatibleModelID.Qwen3_VL_235B_A22B_Thinking,
    name: 'Qwen: Qwen3 VL 235B A22B Thinking',
    tokenLimit: 262144,
    enabled: true,
  },
  [OpenAICompatibleModelID.Qwen3_235B_A22B]: {
    id: OpenAICompatibleModelID.Qwen3_235B_A22B,
    name: 'Qwen: Qwen3 235B A22B',
    tokenLimit: 40960,
    enabled: true,
  },
  [OpenAICompatibleModelID.Qwen3_Coder_Plus]: {
    id: OpenAICompatibleModelID.Qwen3_Coder_Plus,
    name: 'Qwen: Qwen3 Coder Plus',
    tokenLimit: 128000,
    enabled: true,
  },
  [OpenAICompatibleModelID.Kimi_K2_0711]: {
    id: OpenAICompatibleModelID.Kimi_K2_0711,
    name: 'MoonshotAI: Kimi K2 0711',
    tokenLimit: 32768,
    enabled: true,
  },
  [OpenAICompatibleModelID.Kimi_K2_0905]: {
    id: OpenAICompatibleModelID.Kimi_K2_0905,
    name: 'MoonshotAI: Kimi K2 0905',
    tokenLimit: 262144,
    enabled: true,
  },
  [OpenAICompatibleModelID.GLM_4_5]: {
    id: OpenAICompatibleModelID.GLM_4_5,
    name: 'Z.AI: GLM 4.5',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.GLM_4_1V_9B_Thinking]: {
    id: OpenAICompatibleModelID.GLM_4_1V_9B_Thinking,
    name: 'THUDM: GLM 4.1V 9B Thinking',
    tokenLimit: 65536,
    enabled: true,
  },
  [OpenAICompatibleModelID.GLM_4_5V]: {
    id: OpenAICompatibleModelID.GLM_4_5V,
    name: 'Z.AI: GLM 4.5V',
    tokenLimit: 65536,
    enabled: true,
  },
  [OpenAICompatibleModelID.GLM_4_5_Air]: {
    id: OpenAICompatibleModelID.GLM_4_5_Air,
    name: 'Z.AI: GLM 4.5 Air',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.GLM_4_6]: {
    id: OpenAICompatibleModelID.GLM_4_6,
    name: 'Z.AI: GLM 4.6',
    tokenLimit: 202752,
    enabled: true,
  },
  [OpenAICompatibleModelID.MiniMax_M2]: {
    id: OpenAICompatibleModelID.MiniMax_M2,
    name: 'MiniMax: MiniMax M2',
    tokenLimit: 196608,
    enabled: true,
  },
  [OpenAICompatibleModelID.Gemini_2_5_Flash_Lite]: {
    id: OpenAICompatibleModelID.Gemini_2_5_Flash_Lite,
    name: 'Google: Gemini 2.5 Flash Lite',
    tokenLimit: 1048576,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_4o]: {
    id: OpenAICompatibleModelID.GPT_4o,
    name: 'OpenAI: GPT-4o',
    tokenLimit: 128000,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_4_1]: {
    id: OpenAICompatibleModelID.GPT_4_1,
    name: 'OpenAI: GPT-4.1',
    tokenLimit: 1047576,
    enabled: true,
  },
  [OpenAICompatibleModelID.o3_Mini]: {
    id: OpenAICompatibleModelID.o3_Mini,
    name: 'OpenAI: o3 Mini',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAICompatibleModelID.o4_Mini]: {
    id: OpenAICompatibleModelID.o4_Mini,
    name: 'OpenAI: o4 Mini',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAICompatibleModelID.o3_Pro]: {
    id: OpenAICompatibleModelID.o3_Pro,
    name: 'OpenAI: o3 Pro',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAICompatibleModelID.Claude_Opus_4_1]: {
    id: OpenAICompatibleModelID.Claude_Opus_4_1,
    name: 'Anthropic: Claude Opus 4.1',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAICompatibleModelID.Claude_Haiku_4_5]: {
    id: OpenAICompatibleModelID.Claude_Haiku_4_5,
    name: 'Anthropic: Claude Haiku 4.5',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAICompatibleModelID.Grok_3_Mini]: {
    id: OpenAICompatibleModelID.Grok_3_Mini,
    name: 'xAI: Grok 3 Mini',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Grok_4_Fast]: {
    id: OpenAICompatibleModelID.Grok_4_Fast,
    name: 'xAI: Grok 4 Fast',
    tokenLimit: 2000000,
    enabled: true,
  },
}
