import { NextResponse } from 'next/server'
import { type Conversation } from '~/types/chat'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { withCourseAccessFromRequest } from '~/app/api/authorization'
import type { OpenAICompatibleTool } from '~/types/tools'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const conversationToMessages = (
  inputData: Conversation,
): Array<{
  role: string
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>
}> => {
  const transformedData: Array<{
    role: string
    content:
      | string
      | Array<{ type: string; text?: string; image_url?: { url: string } }>
  }> = []

  inputData.messages.forEach((message) => {
    if (Array.isArray(message.content)) {
      const content = message.content.map((c) => {
        if (c.type === 'text') {
          return { type: 'text', text: c.text || '' }
        } else if (c.type === 'image_url' || c.type === 'tool_image_url') {
          return {
            type: 'image_url',
            image_url: { url: c.image_url?.url || '' },
          }
        }
        return { type: 'text', text: '' }
      })
      transformedData.push({
        role: message.role,
        content: content,
      })
    } else {
      transformedData.push({
        role: message.role,
        content: message.content as string,
      })
    }
  })

  return transformedData
}

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const {
    conversation,
    tools,
    providerBaseUrl,
    apiKey,
    modelId,
    imageUrls = [],
    imageDescription = '',
  }: {
    tools: OpenAICompatibleTool[]
    conversation: Conversation
    providerBaseUrl: string
    apiKey: string
    modelId: string
    imageUrls?: string[]
    imageDescription?: string
  } = await req.json()

  if (!apiKey || !providerBaseUrl || !modelId) {
    return NextResponse.json(
      {
        error:
          'Missing required parameters: apiKey, providerBaseUrl, or modelId',
      },
      { status: 400 },
    )
  }

  try {
    const decryptedKey = await decryptKeyIfNeeded(apiKey)

    // Format messages
    const message_to_send = conversationToMessages(conversation)

    // Add system message
    const globalToolsSystemPromptPrefix =
      "Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous. If you have ideas for suitable defaults, suggest that as an option to the user when asking for clarification.\n"
    message_to_send.unshift({
      role: 'system',
      content: globalToolsSystemPromptPrefix + conversation.prompt,
    })

    // Add image info if present
    if (imageUrls && imageUrls.length > 0 && imageDescription) {
      const imageInfo = `Image URL(s): ${imageUrls.join(', ')};\nImage Description: ${imageDescription}`
      if (message_to_send.length > 0) {
        const lastMessage = message_to_send[message_to_send.length - 1]
        if (lastMessage) {
          if (typeof lastMessage.content === 'string') {
            lastMessage.content += `\n\n${imageInfo}`
          }
        }
      } else {
        message_to_send.push({
          role: 'system',
          content: imageInfo,
        })
      }
    }

    const apiUrl = `${providerBaseUrl}/chat/completions`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decryptedKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: message_to_send,
        tools: tools,
        stream: false,
      }),
    })

    if (!response.ok) {
      console.error(
        'OpenAI-compatible API error:',
        response.status,
        response.statusText,
      )
      return NextResponse.json(
        { error: `OpenAI-compatible API error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.choices) {
      console.error('No response from OpenAI-compatible API')
      return NextResponse.json(
        { error: 'No response from OpenAI-compatible API' },
        { status: 500 },
      )
    }

    if (!data.choices[0]?.message.tool_calls) {
      console.error('No tool calls from OpenAI-compatible API')
      return NextResponse.json({
        choices: [
          {
            message: {
              content: 'No tools invoked',
              role: 'assistant',
            },
          },
        ],
      })
    }

    const toolCalls = data.choices[0].message.tool_calls

    return NextResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify(toolCalls),
            role: 'assistant',
            tool_calls: toolCalls,
          },
        },
      ],
    })
  } catch (error) {
    console.error('Error in compatibleFunctionCall:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 },
    )
  }
}

export const POST = withCourseAccessFromRequest('any')(handler)
