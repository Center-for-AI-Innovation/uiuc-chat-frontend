import {
  BedrockModels,
  type BedrockModel,
} from '~/utils/modelProviders/types/bedrock'
import {
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { withCourseAccessFromRequest } from '~/app/api/authorization'


async function getHandler(req: AuthenticatedRequest) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION

  if (!accessKeyId || !secretAccessKey || !region) {
    return NextResponse.json(
      { error: 'Bedrock credentials not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(BedrockModels) as BedrockModel[]

  return NextResponse.json({
    provider: ProviderNames.Bedrock,
    models: models,
  })
}

export const GET = withCourseAccessFromRequest('any')(getHandler)
