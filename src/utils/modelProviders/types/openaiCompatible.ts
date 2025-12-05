// OpenAICompatibleProvider is defined in LLMProvider.ts following the same pattern as other providers

export interface OpenAICompatibleModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum OpenAICompatibleModelID {
  // ============================================
  // OpenAI Models (via OpenRouter/Groq)
  // ============================================
  GPT_5 = 'openai/gpt-5',
  GPT_5_1 = 'openai/gpt-5.1',
  GPT_5_1_Chat = 'openai/gpt-5.1-chat',
  GPT_5_1_Codex = 'openai/gpt-5.1-codex',
  GPT_5_1_Codex_Mini = 'openai/gpt-5.1-codex-mini',
  GPT_4o = 'openai/gpt-4o',
  GPT_4_1 = 'openai/gpt-4.1',
  GPT_OSS_120B = 'openai/gpt-oss-120b',
  GPT_OSS_20B = 'openai/gpt-oss-20b',
  o3_Mini = 'openai/o3-mini',
  o3_Pro = 'openai/o3-pro',
  o4_Mini = 'openai/o4-mini',

  // ============================================
  // Meta Llama Models
  // ============================================
  Llama_3_3_70B_Instruct = 'meta-llama/llama-3.3-70b-instruct',
  Llama_4_Maverick = 'meta-llama/llama-4-maverick',

  // ============================================
  // DeepSeek Models
  // ============================================
  DeepSeek_V3_0324 = 'deepseek/deepseek-chat-v3-0324',
  DeepSeek_V3_1 = 'deepseek/deepseek-chat-v3.1',
  DeepSeek_V3_1_Terminus = 'deepseek/deepseek-v3.1-terminus',
  DeepSeek_V3_2 = 'deepseek/deepseek-v3.2',
  DeepSeek_V3_2_Exp = 'deepseek/deepseek-v3.2-exp',
  DeepSeek_V3_2_Speciale = 'deepseek/deepseek-v3.2-speciale',
  DeepSeek_R1_Zero = 'deepseek/deepseek-r1-zero',
  DeepSeek_R1_0528_Qwen3_8B = 'deepseek/deepseek-r1-0528-qwen3-8b',

  // ============================================
  // Qwen Models
  // ============================================
  Qwen3_32B = 'qwen/qwen3-32b',
  Qwen3_235B_A22B = 'qwen/qwen3-235b-a22b',
  Qwen3_VL_235B_A22B_Thinking = 'qwen/qwen3-vl-235b-a22b-thinking',
  Qwen3_Coder_Plus = 'qwen/qwen3-coder-plus',
  Qwen3_VL_32B_Instruct = 'qwen/qwen3-vl-32b-instruct',
  Qwen2_5_VL_32B_Instruct = 'qwen/qwen2.5-vl-32b-instruct',
  Qwen2_5_VL_72B_Instruct = 'Qwen/Qwen2.5-VL-72B-Instruct',
  Qwen2_5_72B_Instruct = 'qwen/qwen-2.5-72b-instruct',
  EVA_Qwen2_5_32B = 'eva-unit-01/eva-qwen-2.5-32b',

  // ============================================
  // Anthropic Claude Models
  // ============================================
  Claude_Opus_4_1 = 'anthropic/claude-opus-4.1',
  Claude_Opus_4_5 = 'anthropic/claude-opus-4.5',
  Claude_Haiku_4_5 = 'anthropic/claude-haiku-4.5',

  // ============================================
  // Google Gemini Models
  // ============================================
  Gemini_2_5_Flash_Lite = 'google/gemini-2.5-flash-lite',
  Gemini_3_Pro_Preview = 'google/gemini-3-pro-preview',

  // ============================================
  // xAI Grok Models
  // ============================================
  Grok_3_Mini = 'x-ai/grok-3-mini',
  Grok_4_Fast = 'x-ai/grok-4-fast',
  Grok_4_1_Fast = 'x-ai/grok-4.1-fast',

  // ============================================
  // GLM Models (Z.AI / THUDM)
  // ============================================
  GLM_4_5 = 'z-ai/glm-4.5',
  GLM_4_5V = 'z-ai/glm-4.5v',
  GLM_4_5_Air = 'z-ai/glm-4.5-air',
  GLM_4_6 = 'z-ai/glm-4.6',
  GLM_4_1V_9B_Thinking = 'thudm/glm-4.1v-9b-thinking',

  // ============================================
  // MoonshotAI Kimi Models
  // ============================================
  Kimi_K2_0711 = 'moonshotai/kimi-k2',
  Kimi_K2_0905 = 'moonshotai/kimi-k2-0905',

  // ============================================
  // AllenAI OLMO Models
  // ============================================
  OLMO_3_7B_Think = 'allenai/olmo-3-7b-think',
  OLMO_3_7B_Instruct = 'allenai/olmo-3-7b-instruct',
  OLMO_3_32B_Think_Free = 'allenai/olmo-3-32b-think:free',

  // ============================================
  // Mistral Models (via OpenRouter - with mistralai/ prefix)
  // ============================================
  Mistral_Large_2512 = 'mistralai/mistral-large-2512',
  Mistral_Large_Latest = 'mistralai/mistral-large-latest',
  Mistral_Medium_Latest = 'mistralai/mistral-medium-latest',
  Mistral_Small_Latest = 'mistralai/mistral-small-latest',
  Ministral_14B_Latest = 'mistralai/ministral-14b-latest',
  Ministral_8B_Latest = 'mistralai/ministral-8b-latest',
  Ministral_3B_Latest = 'mistralai/ministral-3b-latest',
  // Magistral = Mistral's reasoning models (via OpenRouter)
  Magistral_Medium_Latest = 'mistralai/magistral-medium-latest',
  Magistral_Small_Latest = 'mistralai/magistral-small-latest',

  // ============================================
  // Mistral Models (direct API - no prefix)
  // These use Mistral-specific model IDs (without provider prefix)
  // ============================================
  Mistral_Direct_Large_Latest = 'mistral-large-latest',
  Mistral_Direct_Medium_Latest = 'mistral-medium-latest',
  Mistral_Direct_Small_Latest = 'mistral-small-latest',
  Mistral_Direct_Ministral_14B = 'ministral-14b-latest',
  Mistral_Direct_Ministral_8B = 'ministral-8b-latest',
  Mistral_Direct_Ministral_3B = 'ministral-3b-latest',
  // Magistral = Mistral's reasoning models (direct API)
  Mistral_Direct_Magistral_Medium = 'magistral-medium-latest',
  Mistral_Direct_Magistral_Small = 'magistral-small-latest',

  // ============================================
  // Other Models
  // ============================================
  MiniMax_M2 = 'minimax/minimax-m2',

  // ============================================
  // Cerebras Models
  // These use different model IDs than OpenRouter/Groq
  // e.g., 'gpt-oss-120b' instead of 'openai/gpt-oss-120b'
  // ============================================
  Cerebras_GPT_OSS_120B = 'gpt-oss-120b',
  Cerebras_Llama_3_3_70B = 'llama-3.3-70b',
  Cerebras_Llama_3_1_8B = 'llama3.1-8b',
  Cerebras_Qwen_3_32B = 'qwen-3-32b',
  Cerebras_Qwen_3_235B = 'qwen-3-235b-a22b-instruct-2507',
  Cerebras_GLM_4_6 = 'zai-glm-4.6',

  // ============================================
  // Ollama Models (self-hosted)
  // These use Ollama-specific model IDs with colons (e.g., 'gpt-oss:120b')
  // ============================================
  Ollama_GPT_OSS_120B = 'gpt-oss:120b',
  Ollama_GPT_OSS_20B = 'gpt-oss:20b',
  Ollama_DeepSeek_R1_70B = 'deepseek-r1:70b',
  Ollama_DeepSeek_R1_32B = 'deepseek-r1:32b',
  Ollama_DeepSeek_R1_14B = 'deepseek-r1:14b-qwen-distill-fp16',
  Ollama_Qwen3_32B = 'qwen3:32b',
  Ollama_Llama4_16x17B = 'llama4:16x17b',
  Ollama_Llama3_1_70B = 'llama3.1:70b-instruct-fp16',
  Ollama_Gemma3_27B = 'gemma3:27b',
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
    name: 'OpenAI: GPT-OSS 120B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_OSS_20B]: {
    id: OpenAICompatibleModelID.GPT_OSS_20B,
    name: 'OpenAI: GPT-OSS 20B',
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
  [OpenAICompatibleModelID.Qwen3_VL_32B_Instruct]: {
    id: OpenAICompatibleModelID.Qwen3_VL_32B_Instruct,
    name: 'Qwen: Qwen3 VL 32B Instruct',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Qwen2_5_VL_32B_Instruct]: {
    id: OpenAICompatibleModelID.Qwen2_5_VL_32B_Instruct,
    name: 'Qwen: Qwen2.5 VL 32B Instruct',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Qwen2_5_VL_72B_Instruct]: {
    id: OpenAICompatibleModelID.Qwen2_5_VL_72B_Instruct,
    name: 'Qwen: Qwen2.5 VL 72B Instruct',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Qwen2_5_72B_Instruct]: {
    id: OpenAICompatibleModelID.Qwen2_5_72B_Instruct,
    name: 'Qwen: Qwen2.5 72B Instruct',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_5_1_Chat]: {
    id: OpenAICompatibleModelID.GPT_5_1_Chat,
    name: 'OpenAI: GPT-5.1 Chat',
    tokenLimit: 400000,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_5_1_Codex_Mini]: {
    id: OpenAICompatibleModelID.GPT_5_1_Codex_Mini,
    name: 'OpenAI: GPT-5.1 Codex Mini',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_5_1_Codex]: {
    id: OpenAICompatibleModelID.GPT_5_1_Codex,
    name: 'OpenAI: GPT-5.1 Codex',
    tokenLimit: 400000,
    enabled: true,
  },
  [OpenAICompatibleModelID.GPT_5_1]: {
    id: OpenAICompatibleModelID.GPT_5_1,
    name: 'OpenAI: GPT-5.1',
    tokenLimit: 400000,
    enabled: true,
  },
  [OpenAICompatibleModelID.Gemini_3_Pro_Preview]: {
    id: OpenAICompatibleModelID.Gemini_3_Pro_Preview,
    name: 'Google: Gemini 3 Pro Preview',
    tokenLimit: 1048576,
    enabled: true,
  },
  [OpenAICompatibleModelID.Grok_4_1_Fast]: {
    id: OpenAICompatibleModelID.Grok_4_1_Fast,
    name: 'xAI: Grok 4.1 Fast',
    tokenLimit: 2000000,
    enabled: true,
  },
  [OpenAICompatibleModelID.OLMO_3_7B_Think]: {
    id: OpenAICompatibleModelID.OLMO_3_7B_Think,
    name: 'AllenAI: OLMO 3 7B Think',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.OLMO_3_7B_Instruct]: {
    id: OpenAICompatibleModelID.OLMO_3_7B_Instruct,
    name: 'AllenAI: OLMO 3 7B Instruct',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.OLMO_3_32B_Think_Free]: {
    id: OpenAICompatibleModelID.OLMO_3_32B_Think_Free,
    name: 'AllenAI: OLMO 3 32B Think (Free)',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Claude_Opus_4_5]: {
    id: OpenAICompatibleModelID.Claude_Opus_4_5,
    name: 'Anthropic: Claude Opus 4.5',
    tokenLimit: 200000,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_V3_2]: {
    id: OpenAICompatibleModelID.DeepSeek_V3_2,
    name: 'DeepSeek: DeepSeek V3.2',
    tokenLimit: 163840,
    enabled: true,
  },
  [OpenAICompatibleModelID.DeepSeek_V3_2_Speciale]: {
    id: OpenAICompatibleModelID.DeepSeek_V3_2_Speciale,
    name: 'DeepSeek: DeepSeek V3.2 Speciale',
    tokenLimit: 163840,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Large_2512]: {
    id: OpenAICompatibleModelID.Mistral_Large_2512,
    name: 'MistralAI: Mistral Large 2512',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Large_Latest]: {
    id: OpenAICompatibleModelID.Mistral_Large_Latest,
    name: 'MistralAI: Large 3',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Medium_Latest]: {
    id: OpenAICompatibleModelID.Mistral_Medium_Latest,
    name: 'MistralAI: Medium 3.1',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Small_Latest]: {
    id: OpenAICompatibleModelID.Mistral_Small_Latest,
    name: 'MistralAI: Small 3.2',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ministral_14B_Latest]: {
    id: OpenAICompatibleModelID.Ministral_14B_Latest,
    name: 'MistralAI: Ministral 14B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ministral_8B_Latest]: {
    id: OpenAICompatibleModelID.Ministral_8B_Latest,
    name: 'MistralAI: Ministral 8B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ministral_3B_Latest]: {
    id: OpenAICompatibleModelID.Ministral_3B_Latest,
    name: 'MistralAI: Ministral 3B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Magistral_Medium_Latest]: {
    id: OpenAICompatibleModelID.Magistral_Medium_Latest,
    name: 'MistralAI: Magistral Medium (Reasoning)',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Magistral_Small_Latest]: {
    id: OpenAICompatibleModelID.Magistral_Small_Latest,
    name: 'MistralAI: Magistral Small (Reasoning)',
    tokenLimit: 131072,
    enabled: true,
  },

  // ============================================
  // Mistral Models (direct API - no prefix)
  // These use Mistral-specific model IDs (without provider prefix)
  // ============================================
  [OpenAICompatibleModelID.Mistral_Direct_Large_Latest]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Large_Latest,
    name: 'Mistral: Large 3',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Direct_Medium_Latest]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Medium_Latest,
    name: 'Mistral: Medium 3.1',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Direct_Small_Latest]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Small_Latest,
    name: 'Mistral: Small 3.2',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Direct_Ministral_14B]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Ministral_14B,
    name: 'Mistral: Ministral 14B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Direct_Ministral_8B]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Ministral_8B,
    name: 'Mistral: Ministral 8B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Direct_Ministral_3B]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Ministral_3B,
    name: 'Mistral: Ministral 3B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Direct_Magistral_Medium]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Magistral_Medium,
    name: 'Mistral: Magistral Medium (Reasoning)',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Mistral_Direct_Magistral_Small]: {
    id: OpenAICompatibleModelID.Mistral_Direct_Magistral_Small,
    name: 'Mistral: Magistral Small (Reasoning)',
    tokenLimit: 131072,
    enabled: true,
  },

  // ============================================
  // Cerebras Models
  // These use Cerebras-specific model IDs (without provider prefix)
  // ============================================
  [OpenAICompatibleModelID.Cerebras_GPT_OSS_120B]: {
    id: OpenAICompatibleModelID.Cerebras_GPT_OSS_120B,
    name: 'Cerebras: GPT-OSS 120B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Cerebras_Llama_3_3_70B]: {
    id: OpenAICompatibleModelID.Cerebras_Llama_3_3_70B,
    name: 'Cerebras: Llama 3.3 70B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Cerebras_Llama_3_1_8B]: {
    id: OpenAICompatibleModelID.Cerebras_Llama_3_1_8B,
    name: 'Cerebras: Llama 3.1 8B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Cerebras_Qwen_3_32B]: {
    id: OpenAICompatibleModelID.Cerebras_Qwen_3_32B,
    name: 'Cerebras: Qwen 3 32B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Cerebras_Qwen_3_235B]: {
    id: OpenAICompatibleModelID.Cerebras_Qwen_3_235B,
    name: 'Cerebras: Qwen 3 235B A22B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Cerebras_GLM_4_6]: {
    id: OpenAICompatibleModelID.Cerebras_GLM_4_6,
    name: 'Cerebras: GLM 4.6',
    tokenLimit: 131072,
    enabled: true,
  },

  // ============================================
  // Ollama Models (self-hosted)
  // These use Ollama-specific model IDs with colons (e.g., 'gpt-oss:120b')
  // ============================================
  [OpenAICompatibleModelID.Ollama_GPT_OSS_120B]: {
    id: OpenAICompatibleModelID.Ollama_GPT_OSS_120B,
    name: 'Ollama: GPT-OSS 120B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_GPT_OSS_20B]: {
    id: OpenAICompatibleModelID.Ollama_GPT_OSS_20B,
    name: 'Ollama: GPT-OSS 20B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_DeepSeek_R1_70B]: {
    id: OpenAICompatibleModelID.Ollama_DeepSeek_R1_70B,
    name: 'Ollama: DeepSeek R1 70B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_DeepSeek_R1_32B]: {
    id: OpenAICompatibleModelID.Ollama_DeepSeek_R1_32B,
    name: 'Ollama: DeepSeek R1 32B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_DeepSeek_R1_14B]: {
    id: OpenAICompatibleModelID.Ollama_DeepSeek_R1_14B,
    name: 'Ollama: DeepSeek R1 14B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_Qwen3_32B]: {
    id: OpenAICompatibleModelID.Ollama_Qwen3_32B,
    name: 'Ollama: Qwen3 32B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_Llama4_16x17B]: {
    id: OpenAICompatibleModelID.Ollama_Llama4_16x17B,
    name: 'Ollama: Llama 4 16x17B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_Llama3_1_70B]: {
    id: OpenAICompatibleModelID.Ollama_Llama3_1_70B,
    name: 'Ollama: Llama 3.1 70B',
    tokenLimit: 131072,
    enabled: true,
  },
  [OpenAICompatibleModelID.Ollama_Gemma3_27B]: {
    id: OpenAICompatibleModelID.Ollama_Gemma3_27B,
    name: 'Ollama: Gemma 3 27B',
    tokenLimit: 131072,
    enabled: true,
  },
}
