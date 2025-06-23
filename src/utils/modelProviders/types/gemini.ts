export interface GeminiModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum GeminiModelID {
  Gemini_2_5_Pro_Exp_03_25 = 'gemini-2.5-pro-exp-03-25',
  Gemini_2_0_Flash_Lite = 'gemini-2.0-flash-lite',
  Gemini_2_0_Flash = 'gemini-2.0-flash',
  Gemini_2_0_Flash_Thinking_Exp_01_21 = 'gemini-2.0-flash-thinking-exp-01-21',
  Gemini_2_0_Pro_Exp_02_05 = 'gemini-2.0-pro-exp-02-05',
  // Gemini_1_5_Pro = 'gemini-1.5-pro',
  LearnLM_1_5_Pro = 'learnlm-1.5-pro-experimental',
}

// Sort models by preference
export const preferredGeminiModelIds = [
  GeminiModelID.Gemini_2_5_Pro_Exp_03_25,
  GeminiModelID.Gemini_2_0_Flash_Lite,
  GeminiModelID.Gemini_2_0_Flash_Thinking_Exp_01_21,
  GeminiModelID.Gemini_2_0_Flash,
  GeminiModelID.Gemini_2_0_Pro_Exp_02_05,
  // GeminiModelID.Gemini_1_5_Pro,
  GeminiModelID.LearnLM_1_5_Pro,
]

export const GeminiModels: Record<GeminiModelID, GeminiModel> = {
  [GeminiModelID.Gemini_2_5_Pro_Exp_03_25]: {
    id: GeminiModelID.Gemini_2_5_Pro_Exp_03_25,
    name: 'Gemini 2.5 Pro (One of the best LLMs today)',
    tokenLimit: 1_000_000,
    enabled: true,
  },
  [GeminiModelID.Gemini_2_0_Flash_Lite]: {
    id: GeminiModelID.Gemini_2_0_Flash_Lite,
    name: 'Gemini 2.0 Flash Lite (Free, for now)',
    tokenLimit: 1_000_000,
    enabled: false,
  },
  [GeminiModelID.Gemini_2_0_Flash]: {
    id: GeminiModelID.Gemini_2_0_Flash,
    name: 'Gemini 2.0 Flash (Free, for now)',
    tokenLimit: 1_000_000,
    enabled: true,
  },
  [GeminiModelID.Gemini_2_0_Flash_Thinking_Exp_01_21]: {
    id: GeminiModelID.Gemini_2_0_Flash_Thinking_Exp_01_21,
    name: 'Gemini 2.0 Flash Thinking',
    tokenLimit: 1_000_000,
    enabled: true,
  },
  [GeminiModelID.Gemini_2_0_Pro_Exp_02_05]: {
    id: GeminiModelID.Gemini_2_0_Pro_Exp_02_05,
    name: 'Gemini 2.0 Pro',
    tokenLimit: 2_000_000,
    enabled: true,
  },
  // [GeminiModelID.Gemini_1_5_Pro]: {
  //   id: GeminiModelID.Gemini_1_5_Pro,
  //   name: 'Gemini 1.5 Pro',
  //   tokenLimit: 2_000_000,
  //   enabled: true,
  // },
  [GeminiModelID.LearnLM_1_5_Pro]: {
    id: GeminiModelID.LearnLM_1_5_Pro,
    name: 'LearnLM 1.5 Pro (This is a tutor model, for teaching and learning)',
    tokenLimit: 1_000_000, // Not sure of the token limit for this model
    enabled: true,
  },
}
