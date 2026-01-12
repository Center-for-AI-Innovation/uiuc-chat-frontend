// src/app/api/allNewRoutingChat/route.ts

import { type ChatBody, type Conversation } from '@/types/chat'
import { routeModelRequest } from '~/utils/streamProcessing'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { withCourseAccessFromRequest } from '~/app/api/authorization'
import { reconstructConversation } from '@/utils/app/conversation'
import { persistMessageServer } from '~/pages/api/conversation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { conversation, course_name, courseMetadata, mode } = body as ChatBody
    const hydratedConversation: Conversation | undefined =
      reconstructConversation(conversation)

    // Build the prompt
    const newConversation = await buildPrompt({
      conversation: hydratedConversation,
      projectName: course_name,
      courseMetadata,
      mode,
    })

    body.conversation = newConversation
    const lastMessage =
      newConversation?.messages?.[newConversation.messages.length - 1]
    if (lastMessage) {
      await persistMessageServer({
        conversation: newConversation,
        message: lastMessage,
        courseName: course_name,
        userIdentifier: newConversation.userEmail ?? '',
      })
    }
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
