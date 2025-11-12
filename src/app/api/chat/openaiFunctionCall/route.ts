import { NextResponse } from 'next/server'
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions'
import { type Conversation } from '~/types/chat'
import { type AuthenticatedRequest } from '~/utils/appRouterAuth'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { withCourseAccessFromRequest } from '~/app/api/authorization'

// Change runtime to edge
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const conversationToMessages = (
  inputData: Conversation,
): ChatCompletionMessageParam[] => {
  const transformedData: ChatCompletionMessageParam[] = []

  inputData.messages.forEach((message) => {
    if (Array.isArray(message.content)) {
      // Handle array content (text, images, files)
      const contentParts: ChatCompletionContentPart[] = []
      let textParts: string[] = []

      message.content.forEach((c) => {
        if (c.type === 'text') {
          const text = c.text || ''
          if (text) {
            textParts.push(text)
          }
        } else if (c.type === 'image_url' || c.type === 'tool_image_url') {
          // If we have accumulated text, add it as a text part first
          if (textParts.length > 0) {
            contentParts.push({
              type: 'text',
              text: textParts.join(' '),
            })
            textParts = []
          }
          const imageUrl = c.image_url?.url || ''
          if (imageUrl) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: imageUrl },
            })
          }
        } else if (c.type === 'file') {
          // Convert file content to text representation
          textParts.push(
            `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          )
        }
      })

      // Add any remaining text parts
      if (textParts.length > 0) {
        contentParts.push({
          type: 'text',
          text: textParts.join(' '),
        })
      }

      // If we have content parts (images or multiple text parts), use array format
      // Otherwise, use string format for single text content
      if (
        contentParts.length > 1 ||
        contentParts.some((p) => p.type === 'image_url')
      ) {
        transformedData.push({
          role: message.role,
          content: contentParts,
        })
      } else if (contentParts.length === 1 && contentParts[0].type === 'text') {
        transformedData.push({
          role: message.role,
          content: contentParts[0].text,
        })
      }
    } else {
      // Handle string content
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
    openaiKey,
    imageUrls = [],
    imageDescription = '',
    // Optional parameters for OpenAI-compatible providers
    providerBaseUrl,
    apiKey,
    modelId,
  }: {
    tools: ChatCompletionTool[]
    conversation: Conversation
    imageUrls?: string[]
    imageDescription?: string
    openaiKey?: string
    providerBaseUrl?: string
    apiKey?: string
    modelId?: string
  } = await req.json()

  // Determine if this is an OpenAI-compatible request
  const isOpenAICompatible = !!(providerBaseUrl && apiKey && modelId)

  // Get API key - prefer OpenAI-compatible if provided, otherwise use OpenAI key
  let decryptedKey: string
  if (isOpenAICompatible) {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: apiKey' },
        { status: 400 },
      )
    }
    decryptedKey = await decryptKeyIfNeeded(apiKey)
  } else {
    decryptedKey = openaiKey
      ? await decryptKeyIfNeeded(openaiKey)
      : process.env.VLADS_OPENAI_KEY || ''

    if (!decryptedKey?.startsWith('sk-')) {
      decryptedKey = process.env.VLADS_OPENAI_KEY as string
    }
  }

  // Format messages
  const message_to_send: ChatCompletionMessageParam[] =
    conversationToMessages(conversation)

  // Add system message
  const globalToolsSytemPromptPrefix =
    "Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous. If you have ideas for suitable defaults, suggest that as an option to the user when asking for clarification.\n"
  message_to_send.unshift({
    role: 'system',
    content: globalToolsSytemPromptPrefix + conversation.prompt,
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

  // Determine API URL and model
  if (isOpenAICompatible && (!providerBaseUrl || !modelId)) {
    return NextResponse.json(
      { error: 'Missing required parameters: providerBaseUrl or modelId' },
      { status: 400 },
    )
  }
  const apiUrl = isOpenAICompatible
    ? `${providerBaseUrl}/chat/completions`
    : 'https://api.openai.com/v1/chat/completions'
  const model = isOpenAICompatible ? modelId : 'gpt-4.1'

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decryptedKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: message_to_send,
        tools: tools,
        stream: false,
      }),
    })

    if (!response.ok) {
      const apiName = isOpenAICompatible
        ? 'OpenAI-compatible API'
        : 'OpenAI API'
      console.error(`${apiName} error:`, response.status, response.statusText)
      return NextResponse.json(
        { error: `${apiName} error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.choices) {
      const apiName = isOpenAICompatible ? 'OpenAI-compatible API' : 'OpenAI'
      console.error(`No response from ${apiName}`)
      return NextResponse.json(
        { error: `No response from ${apiName}` },
        { status: 500 },
      )
    }

    if (!data.choices[0]?.message.tool_calls) {
      const apiName = isOpenAICompatible ? 'OpenAI-compatible API' : 'OpenAI'
      console.error(`No tool calls from ${apiName}`)
      return NextResponse.json({
        choices: [
          {
            message: {
              content: `No tools invoked by ${apiName}`,
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
    console.error('Error in openaiFunctionCall:', error)
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
