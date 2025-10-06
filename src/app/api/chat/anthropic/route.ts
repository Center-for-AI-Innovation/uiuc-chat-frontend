import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText, smoothStream, streamText, type CoreMessage } from 'ai'
import { type ChatBody, type Conversation } from '~/types/chat'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { type AnthropicModel } from '~/utils/modelProviders/types/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { withCourseAccessFromRequest } from '~/app/api/authorization'

function getAnthropicRequestConfig(conversation: Conversation) {
  const isThinking =
    conversation.model.id.includes('claude') &&
    (conversation.model as AnthropicModel).extendedThinking === true

  const modelId = isThinking
    ? conversation.model.id.replace('-thinking', '')
    : conversation.model.id

  const providerOptions = isThinking
    ? {
        anthropic: {
          thinking: {
            type: 'enabled' as const,
            budget_tokens: 16000,
          },
        },
      }
    : undefined

  const experimentalTransform = isThinking
    ? [
        smoothStream({
          chunking: 'word' as const,
        }),
      ]
    : undefined

  return { isThinking, modelId, providerOptions, experimentalTransform }
}

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const {
      chatBody,
    }: {
      chatBody: ChatBody
    } = await req.json()

    const conversation = chatBody.conversation
    if (!conversation) {
      throw new Error('Conversation is missing from the chat body')
    }

    const apiKey = chatBody.llmProviders?.Anthropic?.apiKey
    if (!apiKey) {
      throw new Error('Anthropic API  key is missing')
    }

    const anthropic = createAnthropic({
      apiKey: await decryptKeyIfNeeded(apiKey),
    })

    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }

    const { isThinking, modelId, providerOptions, experimentalTransform } =
      getAnthropicRequestConfig(conversation)

    if (chatBody.stream) {
      const result = await streamText({
        model: anthropic(modelId),
        temperature: conversation.temperature,
        messages: convertConversationToVercelAISDKv3(conversation),
        ...(experimentalTransform && {
          experimental_transform: experimentalTransform,
        }),
        ...(providerOptions && { providerOptions }),
      })

      if (isThinking) {
        console.log('Using Claude with reasoning enabled')
        const response = result.toDataStreamResponse({
          sendReasoning: true,
          getErrorMessage: () => {
            return `An error occurred while streaming the response.`
          },
        })
        return new NextResponse(response.body, {
          status: response.status,
          headers: response.headers,
        })
      } else {
        const response = result.toTextStreamResponse()
        return new NextResponse(response.body, {
          status: response.status,
          headers: response.headers,
        })
      }
    } else {
      const result = await generateText({
        model: anthropic(modelId),
        temperature: conversation.temperature,
        messages: convertConversationToVercelAISDKv3(conversation),
        ...(providerOptions && { providerOptions }),
      })
      const choices = [{ message: { content: result.text } }]
      return NextResponse.json({ choices })
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'data' in error &&
      error.data &&
      typeof error.data === 'object' &&
      'error' in error.data
    ) {
      console.error('error.data.error', error.data.error)
      const errValue: unknown = (error as { data: { error: unknown } }).data
        .error
      const message = typeof errValue === 'string' ? errValue : 'Unknown error'
      return NextResponse.json(
        { error: message },
        {
          status: 500,
        },
      )
    } else {
      return NextResponse.json(
        {
          error: 'An error occurred while processing the chat request',
        },
        {
          status: 500,
        },
      )
    }
  }
}

export const POST = withCourseAccessFromRequest('any')(handler)

function convertConversationToVercelAISDKv3(
  conversation: Conversation,
): CoreMessage[] {
  const coreMessages: CoreMessage[] = []

  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    coreMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') return

    let content: string
    if (index === conversation.messages.length - 1 && message.role === 'user') {
      content = message.finalPromtEngineeredMessage || ''
    } else if (Array.isArray(message.content)) {
      // Handle both text and file content
      const textParts: string[] = []

      message.content.forEach((c) => {
        if (c.type === 'text') {
          textParts.push(c.text || '')
        } else if (c.type === 'file') {
          // Convert file content to text representation for Anthropic
          textParts.push(
            `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          )
        }
        // Note: image_url content is handled differently by Anthropic and may need special processing
      })

      content = textParts.join('\n')
    } else {
      content = message.content as string
    }

    coreMessages.push({
      role: message.role as 'user' | 'assistant',
      content: content,
    })
  })

  return coreMessages
}
