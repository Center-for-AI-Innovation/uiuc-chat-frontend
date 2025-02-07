export interface GeminiModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum GeminiModelID {
  Gemini_Pro = 'gemini-pro',
  Gemini_Pro_Vision = 'gemini-pro-vision',
  Gemini_Ultra = 'gemini-ultra',
}

export const GeminiModels: Record<GeminiModelID, GeminiModel> = {
  [GeminiModelID.Gemini_Pro]: {
    id: GeminiModelID.Gemini_Pro,
    name: 'Gemini Pro',
    tokenLimit: 32000,
    enabled: true
  },
  [GeminiModelID.Gemini_Pro_Vision]: {
    id: GeminiModelID.Gemini_Pro_Vision,
    name: 'Gemini Pro Vision',
    tokenLimit: 32000,
    enabled: true
  },
  [GeminiModelID.Gemini_Ultra]: {
    id: GeminiModelID.Gemini_Ultra,
    name: 'Gemini Ultra',
    tokenLimit: 32000,
    enabled: false // Disabled by default as it requires special access
  }
} 