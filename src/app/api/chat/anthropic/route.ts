import { CoreMessage, streamText } from 'ai'
import { ChatBody, Conversation } from '~/types/chat'
import { createAnthropic } from '@ai-sdk/anthropic'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const {
    chatBody,
  }: {
    chatBody: ChatBody
  } = await req.json()

  console.log('chatBody: ', chatBody)

  const conversation = chatBody.conversation!

  console.log('conversation', conversation)

  const anthropic = createAnthropic({
    apiKey: chatBody.llmProviders?.Anthropic?.apiKey,
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  console.log('model', conversation.model.id)

  const model = anthropic(conversation.model.id)

  const result = await streamText({
    model: model,
    messages: convertConversationToVercelAISDKv3(conversation),
    temperature: conversation.temperature,
    maxTokens: 4096,
  })
  return result.toTextStreamResponse()
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

import { NextResponse } from 'next/server'
import {
  AnthropicModels,
  AnthropicModel,
} from '~/utils/modelProviders/types/anthropic'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

export async function GET(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(AnthropicModels) as AnthropicModel[]

  return NextResponse.json({
    provider: ProviderNames.Anthropic,
    models: models,
  })
}
