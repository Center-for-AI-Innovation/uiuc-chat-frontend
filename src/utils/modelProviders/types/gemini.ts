export interface GeminiModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum GeminiModelID {
  Gemini_2_0_Flash = 'gemini-2.0-flash-001',
  Gemini_2_0_Flash_Thinking_Exp_01_21 = 'gemini-2.0-flash-thinking-exp-01-21',
  Gemini_2_0_Pro_Exp_02_05 = 'gemini-2.0-pro-exp-02-05',
  Gemini_1_5_Pro = 'gemini-1.5-pro',
}

export const GeminiModels: Record<GeminiModelID, GeminiModel> = {
  [GeminiModelID.Gemini_2_0_Flash]: {
    id: GeminiModelID.Gemini_2_0_Flash,
    name: 'Gemini 2.0 Flash',
    tokenLimit: 32000,
    enabled: true,
  },
  [GeminiModelID.Gemini_2_0_Flash_Thinking_Exp_01_21]: {
    id: GeminiModelID.Gemini_2_0_Flash_Thinking_Exp_01_21,
    name: 'Gemini 2.0 Flash Thinking',
    tokenLimit: 32000,
    enabled: true,
  },
  [GeminiModelID.Gemini_2_0_Pro_Exp_02_05]: {
    id: GeminiModelID.Gemini_2_0_Pro_Exp_02_05,
    name: 'Gemini 2.0 Pro',
    tokenLimit: 32000,
    enabled: true,
    default: true,
  },
  [GeminiModelID.Gemini_1_5_Pro]: {
    id: GeminiModelID.Gemini_1_5_Pro,
    name: 'Gemini 1.5 Pro',
    tokenLimit: 32000,
    enabled: true,
  },
}
