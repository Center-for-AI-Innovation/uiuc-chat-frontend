import { NextResponse } from 'next/server'
import {
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import {
  SambaNovaModels,
  type SambaNovaModel,
} from '~/utils/modelProviders/types/SambaNova'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { withCourseAccessFromRequest } from '~/app/api/authorization'

// Configure runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function getHandler(req: AuthenticatedRequest) {
  const models = Object.values(SambaNovaModels) as SambaNovaModel[]

  return NextResponse.json({
    provider: ProviderNames.SambaNova,
    models: models,
  })
}

export const GET = withCourseAccessFromRequest('any')(getHandler)
