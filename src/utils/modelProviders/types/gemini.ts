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
  Gemini_1_5_Pro = 'gemini-1.5-pro',
  Gemini_1_5_Pro_Latest = 'gemini-1.5-pro-latest',
  Gemini_1_5_Flash = 'gemini-1.5-flash',
  Gemini_1_5_Flash_Latest = 'gemini-1.5-flash-latest',
  Gemini_1_5_Flash_8b = 'gemini-1.5-flash-8b',
  Gemini_1_5_Flash_8b_Latest = 'gemini-1.5-flash-8b-latest',
}

export const GeminiModels: Record<GeminiModelID, GeminiModel> = {
  [GeminiModelID.Gemini_1_5_Pro]: {
    id: GeminiModelID.Gemini_1_5_Pro,
    name: 'Gemini 1.5 Pro',
    tokenLimit: 32000,
    enabled: true,
    default: true
  },
  [GeminiModelID.Gemini_1_5_Pro_Latest]: {
    id: GeminiModelID.Gemini_1_5_Pro_Latest,
    name: 'Gemini 1.5 Pro (Latest)',
    tokenLimit: 32000,
    enabled: true
  },
  [GeminiModelID.Gemini_2_0_Flash]: {
    id: GeminiModelID.Gemini_2_0_Flash,
    name: 'Gemini 2.0 Flash',
    tokenLimit: 32000,
    enabled: true
  },
  [GeminiModelID.Gemini_1_5_Flash]: {
    id: GeminiModelID.Gemini_1_5_Flash,
    name: 'Gemini 1.5 Flash',
    tokenLimit: 32000,
    enabled: true
  },
  [GeminiModelID.Gemini_1_5_Flash_Latest]: {
    id: GeminiModelID.Gemini_1_5_Flash_Latest,
    name: 'Gemini 1.5 Flash (Latest)',
    tokenLimit: 32000,
    enabled: true
  },
  [GeminiModelID.Gemini_1_5_Flash_8b]: {
    id: GeminiModelID.Gemini_1_5_Flash_8b,
    name: 'Gemini 1.5 Flash 8B',
    tokenLimit: 32000,
    enabled: true
  },
  [GeminiModelID.Gemini_1_5_Flash_8b_Latest]: {
    id: GeminiModelID.Gemini_1_5_Flash_8b_Latest,
    name: 'Gemini 1.5 Flash 8B (Latest)',
    tokenLimit: 32000,
    enabled: true
  }
} 