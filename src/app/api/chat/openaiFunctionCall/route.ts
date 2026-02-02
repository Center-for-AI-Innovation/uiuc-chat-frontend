import { NextResponse } from 'next/server'
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions'
import { type Conversation } from '~/types/chat'
import { persistMessageServer } from '~/pages/api/conversation'
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
          role: message.role as 'user' | 'assistant' | 'system',
          content: contentParts,
        } as ChatCompletionMessageParam)
      } else if (contentParts.length === 1 && contentParts[0]?.type === 'text') {
        const firstPart = contentParts[0]
        if (firstPart) {
          transformedData.push({
            role: message.role as 'user' | 'assistant' | 'system',
            content: firstPart.text,
          } as ChatCompletionMessageParam)
        }
      }
    } else {
      // Handle string content
      transformedData.push({
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content as string,
      } as ChatCompletionMessageParam)
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

  const lastMessage = conversation.messages[conversation.messages.length - 1]
  if (!lastMessage) {
    return NextResponse.json(
      { error: 'Conversation missing last message' },
      { status: 400 },
    )
  }

  if (imageUrls.length > 0 && imageDescription) {
    lastMessage.imageDescription = imageDescription
    lastMessage.imageUrls = imageUrls
    await persistMessageServer({
      conversation,
      message: lastMessage,
      courseName: conversation.projectName ?? '',
      userIdentifier: conversation.userEmail ?? '',
    })
  }

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
        } else if (Array.isArray(lastMessage.content)) {
          const lastTextPart = [...lastMessage.content]
            .reverse()
            .find(
              (p): p is ChatCompletionContentPart & { type: 'text' } =>
                p.type === 'text',
            )
          if (lastTextPart) {
            lastTextPart.text += `\n\n${imageInfo}`
          } else {
            lastMessage.content.push({ type: 'text', text: imageInfo })
          }
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
  if (isOpenAICompatible && (!providerBaseUrl || !apiKey || !modelId)) {
    return NextResponse.json(
      {
        error: 'Missing required parameters: providerBaseUrl, apiKey, or modelId',
      },
      { status: 400 },
    )
  }
  let apiUrl = 'https://api.openai.com/v1/chat/completions'
  let isOpenRouter = false
  if (isOpenAICompatible) {
    // Remove trailing slash if present, then append /chat/completions
    const baseUrl = providerBaseUrl.replace(/\/$/, '')
    apiUrl = `${baseUrl}/chat/completions`
    // Check if this is OpenRouter using proper hostname parsing
    try {
      const parsedUrl = new URL(providerBaseUrl)
      const hostname = parsedUrl.hostname.toLowerCase()
      isOpenRouter =
        hostname === 'openrouter.ai' || hostname.endsWith('.openrouter.ai')
    } catch {
      /* invalid URL */
    }
  }
  // OpenRouter requires lowercase model IDs
  const model = isOpenAICompatible
    ? isOpenRouter
      ? modelId.toLowerCase()
      : modelId
    : 'gpt-4.1'

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${decryptedKey}`,
    }
    // OpenRouter requires these headers
    if (isOpenRouter) {
      const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https'
      const host = req.headers.get('host')
      const inferredReferer = host ? `${forwardedProto}://${host}` : undefined

      headers['HTTP-Referer'] =
        process.env.OPENROUTER_HTTP_REFERER ||
        inferredReferer ||
        'https://chat.illinois.edu'
      headers['X-Title'] =
        process.env.OPENROUTER_X_TITLE ||
        process.env.NEXT_PUBLIC_APP_NAME ||
        'Illinois Chat'
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: message_to_send,
        tools: tools,
        stream: false,
      }),
    })

    if (!response.ok) {
      let errorBody = ''
      try {
        errorBody = await response.text()
      } catch {}
      const apiName = isOpenAICompatible
        ? 'OpenAI-compatible API'
        : 'OpenAI API'
      console.error(`${apiName} error:`, response.status, response.statusText, errorBody)
      return NextResponse.json(
        { error: `${apiName} error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const apiName = isOpenAICompatible ? 'OpenAI-compatible API' : 'OpenAI'

    if (!data.choices) {
      console.error(`No response from ${apiName}`)
      return NextResponse.json(
        { error: `No response from ${apiName}` },
        { status: 500 },
      )
    }

    if (!data.choices[0]?.message.tool_calls) {
      const modelContent = data.choices[0]?.message?.content || ''
      return NextResponse.json({
        choices: [
          {
            message: {
              content: modelContent,
              role: 'assistant',
            },
          },
        ],
      })
    }

    const toolCalls = data.choices[0].message.tool_calls

    lastMessage.tools = toolCalls as any
    await persistMessageServer({
      conversation,
      message: lastMessage,
      courseName: conversation.projectName ?? '',
      userIdentifier: conversation.userEmail ?? '',
    })

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
