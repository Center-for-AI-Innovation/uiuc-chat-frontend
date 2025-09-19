import { NextResponse } from 'next/server'
import { runGeminiChat } from '~/utils/modelProviders/routes/gemini'
import {
  GeminiModels,
  type GeminiModel,
} from '~/utils/modelProviders/types/gemini'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export { runGeminiChat }

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(GeminiModels) as GeminiModel[]

  return NextResponse.json({
    provider: ProviderNames.Gemini,
    models: models,
  })
}
