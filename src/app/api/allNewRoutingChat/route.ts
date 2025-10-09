// src/app/api/allNewRoutingChat/route.ts

import { type ChatBody } from '@/types/chat'
import { routeModelRequest } from '~/utils/streamProcessing'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { withCourseAccessFromRequest } from '~/app/api/authorization'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { conversation, course_name, courseMetadata, mode } = body as ChatBody

    // Build the prompt
    const newConversation = await buildPrompt({
      conversation,
      projectName: course_name,
      courseMetadata,
      mode,
    })

    body.conversation = newConversation
    const result = await routeModelRequest(body as ChatBody)

    return result
  } catch (error) {
    console.error('Error in route handler:', error)

    // For errors that occur before calling routeModelRequest
    return new Response(
      JSON.stringify({
        title: 'LLM Error',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
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
