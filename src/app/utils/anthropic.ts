import { type CoreMessage, generateText, streamText } from 'ai'
import { type ChatBody, type Conversation } from '~/types/chat'
import { createAnthropic } from '@ai-sdk/anthropic'
import {
  AnthropicModels,
  type AnthropicModel,
} from '~/utils/modelProviders/types/anthropic'
import {
  AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'

export async function runAnthropicChat(
  conversation: Conversation,
  anthropicProvider: AnthropicProvider,
  stream: boolean,
) {
  if (!conversation) {
    throw new Error('Conversation is missing')
  }

  if (!anthropicProvider.apiKey) {
    throw new Error('Anthropic API key is missing')
  }

  const anthropic = createAnthropic({
    apiKey: await decryptKeyIfNeeded(anthropicProvider.apiKey),
  })

  if (conversation.messages.length === 0) {
    throw new Error('Conversation messages array is empty')
  }

  const model = anthropic(conversation.model.id)

  const commonParams = {
    model: model,
    messages: convertConversationToVercelAISDKv3(conversation),
    temperature: conversation.temperature,
    maxTokens: 4096,
  }

  if (stream) {
    const result = await streamText(commonParams)
    return result.toTextStreamResponse()
  } else {
    const result = await generateText(commonParams)
    const choices = [{ message: { content: result.text } }]
    return { choices }
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
