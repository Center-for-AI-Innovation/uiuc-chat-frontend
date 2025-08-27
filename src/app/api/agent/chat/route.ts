// src/app/api/agent/chat/route.ts

import { type NextRequest, type NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

import { type ChatBody, type Content, type Conversation, type ImageBody, type Message } from '@/types/chat'
import {
  constructSearchQuery,
  handleContextSearch,
  routeModelRequest,
} from '~/utils/streamProcessing'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { getBaseUrl } from '~/utils/apiUtils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

type AgentRequestBody = ChatBody & {
  enabledDocumentGroups?: string[]
  enabledTools?: string[]
}

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const body = (await req.json()) as AgentRequestBody
    const {
      conversation: incomingConversation,
      course_name,
      courseMetadata,
      llmProviders,
      model,
      stream = true,
      enabledDocumentGroups = [],
    } = body

    if (!incomingConversation) {
      return new Response(
        JSON.stringify({ message: 'No conversation provided.' }),
        { status: 400 },
      )
    }

    // Work on a mutable copy
    const conversation: Conversation = JSON.parse(
      JSON.stringify(incomingConversation),
    )

    if (!conversation.messages || conversation.messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Conversation contains no messages.' }),
        { status: 400 },
      )
    }

    // Ensure last user message has an id
    const lastIdx = conversation.messages.length - 1
    if (!conversation.messages[lastIdx]!.id) {
      conversation.messages[lastIdx]!.id = uuidv4()
    }

    // 1) Image → text (if any images present)
    const lastMessage = conversation.messages[lastIdx] as Message
    const hasImages = Array.isArray(lastMessage.content)
      ? (lastMessage.content as Content[]).some((c) => c.type === 'image_url')
      : false

    if (hasImages) {
      const controller = new AbortController()
      try {
        const lastMessageContents = lastMessage.content
        const contentArray: Content[] = Array.isArray(lastMessageContents)
          ? (lastMessageContents as Content[])
          : [
              {
                type: 'text',
                text: (lastMessageContents as string) || '',
              },
            ]

        const imageBody: ImageBody = {
          contentArray,
          llmProviders: llmProviders!,
          model: conversation.model,
        }

        const response = await fetch(`${getBaseUrl()}/api/imageDescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageBody),
          signal: controller.signal,
        })

        if (response.ok) {
          const data = await response.json()
          const imgDesc =
            data.choices?.[0]?.message?.content ||
            'Error: no image description available...'

          // Add image description to message content
          if (Array.isArray(lastMessage.content)) {
            ;(lastMessage.content as Content[]).push({
              type: 'text',
              text: `Image description: ${imgDesc}`,
            })
          }
        }
      } catch (error) {
        controller.abort()
        // proceed even if image description fails
      }
    }

    // 2) Retrieval (attach contexts to last user message)
    try {
      const searchQuery = constructSearchQuery(conversation.messages)
      await handleContextSearch(
        lastMessage,
        course_name,
        conversation,
        searchQuery,
        enabledDocumentGroups,
      )
    } catch (error) {
      // Retrieval is best-effort; continue without contexts on failure
      // eslint-disable-next-line no-console
      console.error('Agent retrieval error:', error)
    }

    // 3) Build prompt (system + final user message content)
    const preparedConversation = await buildPrompt({
      conversation,
      projectName: course_name,
      courseMetadata,
      mode: 'chat',
    })

    // 4) Route to model (streaming)
    const finalBody: ChatBody = {
      conversation: preparedConversation,
      key: body.key,
      course_name,
      stream: stream,
      courseMetadata,
      llmProviders,
      model: model ?? preparedConversation.model,
      mode: 'chat',
    }

    const result = await routeModelRequest(finalBody)
    return result
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/agent/chat:', error)
    return new Response(
      JSON.stringify({
        title: 'Agent Error',
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error occurred in agent route.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

