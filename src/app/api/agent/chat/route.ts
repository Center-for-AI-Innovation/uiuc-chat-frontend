// src/app/api/agent/chat/route.ts

import { type NextRequest, type NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

import {
  type ChatBody,
  type Content,
  type Conversation,
  type ImageBody,
  type Message,
  type UIUCTool,
} from '@/types/chat'
import {
  constructSearchQuery,
  handleContextSearch,
  routeModelRequest,
} from '~/utils/streamProcessing'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { getBaseUrl } from '~/utils/apiUtils'
import {
  fetchTools,
  handleFunctionCall,
  handleToolCall,
} from '~/utils/functionCalling/handleFunctionCalling'

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

    // Build a streaming response that interleaves agent events and final text
    const encoder = new TextEncoder()
    const streamResp = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emitText = (text: string) => controller.enqueue(encoder.encode(text))
        const emitEvent = (event: any) => emitText(`AGENT_EVENT:${JSON.stringify(event)}\n`)

        try {
          const lastMessage = conversation.messages[lastIdx] as Message
          const hasImages = Array.isArray(lastMessage.content)
            ? (lastMessage.content as Content[]).some((c) => c.type === 'image_url')
            : false

          // 1) Image → text
          if (hasImages) {
            emitEvent({ type: 'img2text-start' })
            const controllerAbort = new AbortController()
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

              const resp = await fetch(`${getBaseUrl()}/api/imageDescription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(imageBody),
                signal: controllerAbort.signal,
              })
              if (resp.ok) {
                const data = await resp.json()
                const imgDesc =
                  data.choices?.[0]?.message?.content ||
                  'Error: no image description available...'
                if (Array.isArray(lastMessage.content)) {
                  ;(lastMessage.content as Content[]).push({
                    type: 'text',
                    text: `Image description: ${imgDesc}`,
                  })
                }
                emitEvent({ type: 'img2text-done', imgDesc })
              } else {
                emitEvent({ type: 'img2text-error' })
              }
            } catch (error) {
              emitEvent({ type: 'img2text-error' })
              controllerAbort.abort()
            }
          }

          // 2) Retrieval
          emitEvent({ type: 'retrieval-start' })
          try {
            const searchQuery = constructSearchQuery(conversation.messages)
            await handleContextSearch(
              lastMessage,
              course_name,
              conversation,
              searchQuery,
              enabledDocumentGroups,
            )
            emitEvent({
              type: 'retrieval-done',
              count: Array.isArray(lastMessage.contexts) ? lastMessage.contexts.length : 0,
            })
          } catch (error) {
            emitEvent({ type: 'retrieval-error' })
          }

          // 3) Tool routing + execution (n8n)
          emitEvent({ type: 'routing-start' })
          let selectedTools: UIUCTool[] = []
          try {
            const allTools = (await fetchTools(
              course_name!,
              '',
              20,
              'true',
              false,
              getBaseUrl(),
            )) as UIUCTool[]
            // Filter tools if enabledTools passed
            const filtered = body.enabledTools && body.enabledTools.length > 0
              ? allTools.filter((t) => body.enabledTools!.includes(t.name))
              : allTools

            // Collect image urls if any
            const imageUrls: string[] = Array.isArray(lastMessage.content)
              ? (lastMessage.content as Content[])
                  .filter((c) => c.type === 'image_url' && c.image_url?.url)
                  .map((c) => c.image_url!.url)
              : []

            // Ask OpenAI function calling to pick tools
            selectedTools = await handleFunctionCall(
              lastMessage,
              filtered,
              imageUrls,
              '',
              conversation,
              body.key,
              getBaseUrl(),
            )
            emitEvent({
              type: 'routing-done',
              tools: selectedTools.map((t) => ({
                name: t.name,
                readableName: t.readableName,
                invocationId: t.invocationId,
                aiGeneratedArgumentValues: t.aiGeneratedArgumentValues,
              })),
            })
          } catch (error) {
            emitEvent({ type: 'routing-error' })
          }

          if (selectedTools.length > 0) {
            emitEvent({ type: 'tools-running' })
            try {
              await handleToolCall(selectedTools, conversation, course_name!, getBaseUrl())
              const updatedLast = conversation.messages[conversation.messages.length - 1] as Message
              emitEvent({ type: 'tools-done', tools: updatedLast?.tools || [] })
            } catch (error) {
              emitEvent({ type: 'tools-error' })
            }
          }

          // 4) Build prompt and stream final answer
          const preparedConversation = await buildPrompt({
            conversation,
            projectName: course_name!,
            courseMetadata,
            mode: 'chat',
          })

          const finalBody: ChatBody = {
            conversation: preparedConversation,
            key: body.key,
            course_name: course_name!,
            stream: true,
            courseMetadata,
            llmProviders,
            model: model ?? preparedConversation.model,
            mode: 'chat',
          }

          const result = await routeModelRequest(finalBody)
          if (result instanceof Response) {
            const reader = result.body?.getReader()
            if (!reader) {
              controller.close()
              return
            }
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              if (value) controller.enqueue(value)
            }
          } else if (result && 'getReader' in (result as any)) {
            const reader = (result as ReadableStream).getReader()
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              if (value) controller.enqueue(value)
            }
          } else {
            // Fallback: non-streaming text
            emitText((result?.text as string) || '')
          }
        } catch (e) {
          // On error, close stream
        } finally {
          controller.close()
        }
      },
    })

    return new Response(streamResp, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
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

