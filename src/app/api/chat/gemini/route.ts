import { type CoreMessage, streamText } from 'ai'
import { type ChatBody, type Conversation } from '~/types/chat'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { GeminiModel, GeminiModels } from '~/utils/modelProviders/types/gemini'

export async function POST(req: Request) {
  try {
    const {
      chatBody,
    }: {
      chatBody: ChatBody
    } = await req.json()

    console.log('chatBody: ', chatBody)

    const conversation = chatBody.conversation
    if (!conversation) {
      throw new Error('Conversation is missing from the chat body')
    }

    const apiKey = chatBody.llmProviders?.Gemini?.apiKey
    if (!apiKey) {
      throw new Error('Gemini API key is missing')
    }

    const gemini = createGoogleGenerativeAI({
      apiKey: await decryptKeyIfNeeded(apiKey),
    })

    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }

    const model = gemini(conversation.model.id)

    const result = await streamText({
      model: model as any,
      messages: convertConversationToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      maxTokens: 4096,
    })
    return result.toTextStreamResponse()
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
      return new Response(JSON.stringify({ error: error.data.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(
        JSON.stringify({
          error: 'An error occurred while processing the chat request',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  }
}

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
      content +=
        '\n\nIf you use the <Potentially Relevant Documents> in your response, please remember cite your sources using the required formatting, e.g. "The grass is green. [29, page: 11]'
    } else if (Array.isArray(message.content)) {
      content = message.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
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

export async function GET(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(GeminiModels) as GeminiModel[]

  return NextResponse.json({
    provider: ProviderNames.Gemini,
    models: models,
  })
}
