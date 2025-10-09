import { NextResponse } from 'next/server'
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
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
    const simpleMessage: ChatCompletionMessageParam = {
      role: message.role,
      content: Array.isArray(message.content)
        ? (message.content[0]?.text ?? '')
        : message.content,
    }
    transformedData.push(simpleMessage)
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
  }: {
    tools: ChatCompletionTool[]
    conversation: Conversation
    imageUrls?: string[]
    imageDescription?: string
    openaiKey: string
  } = await req.json()

  // console.log('Received request with openaiKey:', openaiKey)
  let decryptedKey = openaiKey
    ? await decryptKeyIfNeeded(openaiKey)
    : process.env.VLADS_OPENAI_KEY

  if (!decryptedKey?.startsWith('sk-')) {
    decryptedKey = process.env.VLADS_OPENAI_KEY as string
  }

  // console.log('Using key for function calling:', decryptedKey)

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
        lastMessage.content += `\n\n${imageInfo}`
      }
    } else {
      message_to_send.push({
        role: 'system',
        content: imageInfo,
      })
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decryptedKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: message_to_send,
        tools: tools,
        stream: false,
      }),
    })

    if (!response.ok) {
      console.log('OpenAI API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.choices) {
      console.log('No response from OpenAI')
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 },
      )
    }

    if (!data.choices[0]?.message.tool_calls) {
      console.log('No tool calls from OpenAI')
      return NextResponse.json({
        choices: [
          {
            message: {
              content: 'No tools invoked by OpenAI',
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
