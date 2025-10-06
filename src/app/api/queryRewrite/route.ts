// src/app/api/queryRewrite/route.ts

import { routeModelRequest } from '~/utils/streamProcessing'
import { type ChatBody } from '@/types/chat'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { withCourseAccessFromRequest } from '~/app/api/authorization'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const response = await routeModelRequest(body as ChatBody)
    return response
  } catch (error) {
    console.error('Error in query rewrite route:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process query rewrite request',
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

export const POST = withCourseAccessFromRequest('any')(handler)
