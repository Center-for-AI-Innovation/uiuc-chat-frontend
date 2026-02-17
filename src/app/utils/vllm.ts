import { type ModelMessage, generateText, streamText } from 'ai'
import { type Conversation } from '~/types/chat'
import { type NCSAHostedVLMProvider } from '~/utils/modelProviders/LLMProvider'
export const dynamic = 'force-dynamic'

import { createOpenAI } from '@ai-sdk/openai'

export async function runVLLM(
  conversation: Conversation,
  ncsaHostedVLMProvider: NCSAHostedVLMProvider,
  stream: boolean,
) {
  try {
    if (!conversation) {
      throw new Error('Conversation is missing')
    }

    const vlmProvider = createOpenAI({
      baseURL: process.env.NCSA_HOSTED_VLM_BASE_URL,
      apiKey: process.env.NCSA_HOSTED_API_KEY || '',
    })
    if (conversation.messages.length === 0) {
      throw new Error('Conversation messages array is empty')
    }

    // Use .chat() to use Chat Completions API instead of Responses API
    const model = vlmProvider.chat(conversation.model.id)

    const commonParams = {
      model: model,
      messages: convertConversationToVercelAISDKv3(conversation),
      temperature: conversation.temperature,
      maxOutputTokens: 8192,
      topP: 0.8,
      repetitionPenalty: 1.05,
    }

    try {
      if (stream) {
        const result = streamText(commonParams as any)
        return result.toTextStreamResponse()
      } else {
        const result = await generateText(commonParams as any)
        return new Response(
          JSON.stringify({ choices: [{ message: { content: result.text } }] }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    } catch (error) {
      console.error('VLLM API error:', error)
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error(`VLLM request timed out: ${error.message}`)
      } else if (error instanceof Error && error.message.includes('apiKey')) {
        throw new Error(
          `VLLM authentication error: Please check API configuration`,
        )
      } else {
        throw error // rethrow the original error with context
      }
    }
  } catch (error) {
    console.error('Error in runVLLM:', error)
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred when running VLLM',
        detailed_error:
          error instanceof Error ? error.toString() : 'Unknown error',
        source: 'VLLM',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

function convertConversationToVercelAISDKv3(
  conversation: Conversation,
): ModelMessage[] {
  const coreMessages: ModelMessage[] = []

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
