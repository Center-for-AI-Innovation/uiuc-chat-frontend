import { type CoreMessage, generateText, streamText, smoothStream } from 'ai'
import { type ChatBody, type Conversation } from '~/types/chat'
import { createAnthropic } from '@ai-sdk/anthropic'
import {
  AnthropicModels,
  type AnthropicModel,
} from '~/utils/modelProviders/types/anthropic'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '~/utils/crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
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

    if (chatBody.stream) {
      // Check if it's a Claude model that supports reasoning
      const isClaudeWithReasoning =
        conversation.model.id.includes('claude') &&
        (conversation.model as AnthropicModel).extendedThinking === true

      const result = await streamText({
        model: anthropic(conversation.model.id),
        temperature: conversation.temperature,
        messages: convertConversationToVercelAISDKv3(conversation),
        ...(isClaudeWithReasoning && {
          experimental_transform: [
            smoothStream({
              chunking: 'word',
            }),
          ],
          providerOptions: {
            anthropic: {
              thinking: {
                type: 'enabled',
                budget_tokens: 16000,
              },
            },
          },
        }),
      })

      if (isClaudeWithReasoning) {
        console.log('Using Claude with reasoning enabled')
        return result.toDataStreamResponse({
          sendReasoning: true,
          getErrorMessage: () => {
            return `An error occurred while streaming the response.`
          },
        })
      } else {
        return result.toTextStreamResponse()
      }
    } else {
      const result = await generateText({
        model: anthropic(conversation.model.id),
        temperature: conversation.temperature,
        messages: convertConversationToVercelAISDKv3(conversation),
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
